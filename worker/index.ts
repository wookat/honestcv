import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  type BillingEnv,
  type LicenseRecord,
  type TokenPayload,
  licenseKvKey,
  newLicenseRecord,
  quotaKvKey,
  signToken,
  verifyToken,
} from './billing'
import {
  PADDLE_PAID_STATUSES,
  type PaddleEnv,
  fetchPaddleTransaction,
  generateLicenseKey,
  paddleEventKvKey,
  paddleTransactionInfo,
  paddleTxKvKey,
  planFromPriceIds,
  verifyPaddleSignature,
} from './paddle'
import {
  LS_PAID_STATUSES,
  type LsEnv,
  createLsCheckout,
  fetchLsOrder,
  lsConfigured,
  lsEventKvKey,
  lsOrderKvKey,
  planFromVariantId,
  verifyLsSignature,
} from './lemonsqueezy'
import {
  type RewriteKind,
  type TailorItem,
  buildTailorMessages,
  buildCoverLetterMessages,
  buildInterviewBriefMessages,
  buildRewriteMessages,
} from './prompts'

interface Env extends BillingEnv, PaddleEnv, LsEnv {
  LLM_RELAY_BASE_URL?: string
  LLM_RELAY_API_KEY?: string
  LLM_MODEL?: string
  /** Checkout switch: frontend opens Paddle checkout only when "true" */
  CHECKOUT_ENABLED?: string
  /** Launch/traffic mode: downloads free, bundle AI tools share the free quota */
  FREE_MODE?: string
  ASSETS: Fetcher
}

const freeMode = (env: Env) => env.FREE_MODE === 'true'

/** Free users: AI rewrites per client per 30 days (paid = unlimited) */
const FREE_AI_REWRITES = 5
/** Launch mode is more generous while we optimize for traffic */
const FREE_MODE_AI_CALLS = 12

async function entitlementFromRequest(c: {
  req: { header: (name: string) => string | undefined }
  env: Env
}): Promise<TokenPayload | null> {
  const token = c.req.header('x-license-token')
  const secret = c.env.LICENSE_SIGNING_SECRET
  if (!token || !secret) return null
  return verifyToken(secret, token)
}

async function callLlm(
  env: Env,
  messages: { role: string; content: string }[],
  temperature = 0.5,
  maxTokens = 1200
): Promise<{ text?: string; error?: string; status?: number }> {
  let baseUrl = env.LLM_RELAY_BASE_URL?.replace(/\/+$/, '')
  if (baseUrl && !/\/v\d+$/.test(baseUrl)) baseUrl = `${baseUrl}/v1`
  const apiKey = env.LLM_RELAY_API_KEY
  const model = env.LLM_MODEL || 'gpt-4o-mini'
  if (!baseUrl || !apiKey) {
    return { error: 'The AI service is not configured yet. Please try again later.', status: 503 }
  }
  // One automatic retry on transient upstream failures (429/5xx/network)
  let upstream: Response | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000))
    try {
      upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      })
    } catch {
      upstream = null
      continue
    }
    if (upstream.ok || (upstream.status !== 429 && upstream.status < 500)) break
    console.error('LLM upstream retryable error', upstream.status)
  }
  if (!upstream) {
    return { error: 'Could not reach the AI service. Please retry.', status: 502 }
  }
  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    console.error('LLM upstream error', upstream.status, detail.slice(0, 500))
    return {
      error: `The AI service returned an error (${upstream.status}). Please retry.`,
      status: 502,
    }
  }
  const body = (await upstream.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[]
  } | null
  const text = body?.choices?.[0]?.message?.content?.trim()
  if (!text) return { error: 'Empty response from the AI service. Please retry.', status: 502 }
  return { text }
}

/** Consume one free-AI-quota unit; returns remaining, or -1 when exhausted */
async function consumeFreeQuota(c: {
  req: { header: (name: string) => string | undefined }
  env: Env
}): Promise<number> {
  const fp = c.req.header('x-client-id')?.trim()
  if (!fp || fp.length < 8 || fp.length > 128) return -1
  const limit = freeMode(c.env) ? FREE_MODE_AI_CALLS : FREE_AI_REWRITES
  const kvKey = quotaKvKey(fp, 'ai')
  const used = Number((await c.env.KV.get(kvKey)) ?? '0')
  if (used >= limit) return -1
  await c.env.KV.put(kvKey, String(used + 1), { expirationTtl: 60 * 60 * 24 * 30 })
  return limit - used - 1
}

/** Peek at the remaining free-AI quota without consuming; -1 when exhausted/invalid */
async function peekFreeQuota(c: {
  req: { header: (name: string) => string | undefined }
  env: Env
}): Promise<number> {
  const fp = c.req.header('x-client-id')?.trim()
  if (!fp || fp.length < 8 || fp.length > 128) return -1
  const limit = freeMode(c.env) ? FREE_MODE_AI_CALLS : FREE_AI_REWRITES
  const used = Number((await c.env.KV.get(quotaKvKey(fp, 'ai'))) ?? '0')
  if (used >= limit) return -1
  return limit - used
}

const app = new Hono<{ Bindings: Env }>()

// Security headers on every response; long-lived caching for fingerprinted
// build assets (self-hosted fonts get a shorter TTL since their names are stable).
app.use('*', async (c, next) => {
  await next()
  // Responses proxied from the assets binding have immutable headers
  c.res = new Response(c.res.body, c.res)
  const h = c.res.headers
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  h.set('X-Content-Type-Options', 'nosniff')
  h.set('X-Frame-Options', 'SAMEORIGIN')
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  h.set('Content-Security-Policy', "frame-ancestors 'self'; object-src 'none'; base-uri 'self'")
  if (c.req.path.startsWith('/assets/')) {
    h.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (c.req.path.startsWith('/fonts/')) {
    h.set('Cache-Control', 'public, max-age=604800')
  }
})

app.use('/api/*', cors())

// Remaining free-AI quota for this client (read-only, no consumption)
app.get('/api/ai/quota', async (c) => {
  const fp = c.req.header('x-client-id')?.trim()
  if (!fp || fp.length < 8 || fp.length > 128) return c.json({ freeRemaining: null })
  const limit = freeMode(c.env) ? FREE_MODE_AI_CALLS : FREE_AI_REWRITES
  const used = Number((await c.env.KV.get(quotaKvKey(fp, 'ai'))) ?? '0')
  return c.json({ freeRemaining: Math.max(limit - used, 0) })
})

app.get('/api/health', (c) => {
  const configured = Boolean(c.env.LLM_RELAY_BASE_URL && c.env.LLM_RELAY_API_KEY)
  return c.json({ ok: true, llmConfigured: configured })
})

// AI rewrite: polish a summary / bullets / skills, optionally tailored to a JD.
// Free users get FREE_AI_REWRITES per 30 days; any license = unlimited.
app.post('/api/ai/rewrite', async (c) => {
  const body = await c.req
    .json<{
      kind?: string
      text?: string
      role?: string
      jobDescription?: string
      variants?: boolean
    }>()
    .catch(() => ({}) as Record<string, never>)
  const kind = body.kind as RewriteKind
  if (kind !== 'bullets' && kind !== 'summary' && kind !== 'skills') {
    return c.json({ error: 'Unknown rewrite kind.' }, 400)
  }
  const text = body.text?.trim()
  if (!text || text.length < 3) {
    return c.json({ error: 'Nothing to rewrite — add some text first.' }, 400)
  }

  const ent = await entitlementFromRequest(c)
  let freeRemaining: number | null = null
  if (!ent) {
    const remaining = await peekFreeQuota(c)
    if (remaining < 0) {
      return c.json(
        {
          error: freeMode(c.env)
            ? 'You have used all free AI calls for now — they reset within 30 days. Downloads stay free.'
            : 'Free AI rewrites are used up. Unlock HonestCV once ($9.99) for unlimited AI rewrites plus PDF/DOCX downloads.',
          code: 'payment_required',
        },
        402
      )
    }
    freeRemaining = remaining
  }

  const wantVariants = body.variants === true && kind !== 'skills'
  const result = await callLlm(
    c.env,
    buildRewriteMessages(
      kind,
      text,
      { role: body.role, jobDescription: body.jobDescription },
      wantVariants
    ),
    0.5,
    wantVariants ? 2000 : 1200
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  let texts: string[] | undefined
  if (wantVariants && result.text) {
    texts = result.text
      .split(/^\s*===+\s*$/m)
      .map((t) => t.trim())
      .filter(Boolean)
    if (texts.length < 2) texts = undefined
  }
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ text: texts?.[0] ?? result.text, texts, freeRemaining })
})

// Tailor pass: rewrite summary + bullets toward one JD in a single call,
// returning per-item suggestions. Shares the free AI quota.
app.post('/api/ai/tailor', async (c) => {
  const body = await c.req
    .json<{ items?: TailorItem[]; jobDescription?: string; role?: string }>()
    .catch(() => ({}) as Record<string, never>)
  const jd = body.jobDescription?.trim()
  const items = (body.items ?? [])
    .filter(
      (i): i is TailorItem =>
        Boolean(i && typeof i.id === 'string' && typeof i.text === 'string' && i.text.trim()) &&
        (i.kind === 'summary' || i.kind === 'bullet')
    )
    .slice(0, 40)
  if (!jd) return c.json({ error: 'Paste the job description first.' }, 400)
  if (items.length === 0)
    return c.json({ error: 'Add a summary or experience bullets first — tailoring rewords your real content.' }, 400)

  const ent = await entitlementFromRequest(c)
  let freeRemaining: number | null = null
  if (!ent) {
    const remaining = await peekFreeQuota(c)
    if (remaining < 0) {
      return c.json(
        {
          error: 'You have used all free AI calls for now — they reset within 30 days.',
          code: 'payment_required',
        },
        402
      )
    }
    freeRemaining = remaining
  }

  const result = await callLlm(c.env, buildTailorMessages(items, jd, body.role ?? ''), 0.4, 3000)
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  const raw = (result.text ?? '').replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  let suggestions: { id: string; text: string }[] = []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      const known = new Set(items.map((i) => i.id))
      suggestions = parsed.filter(
        (s): s is { id: string; text: string } =>
          Boolean(
            s &&
              typeof (s as { id?: unknown }).id === 'string' &&
              typeof (s as { text?: unknown }).text === 'string' &&
              known.has((s as { id: string }).id)
          )
      )
    }
  } catch {
    return c.json({ error: 'The AI returned an unexpected format — please try again.' }, 502)
  }
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ suggestions, freeRemaining })
})

// Cover letter — Career Bundle (free mode: shares the free AI quota)
app.post('/api/ai/cover-letter', async (c) => {
  const ent = await entitlementFromRequest(c)
  let freeRemaining: number | null = null
  if (!ent || ent.plan !== 'bundle') {
    if (!freeMode(c.env)) {
      return c.json(
        {
          error: 'The cover letter writer is part of the Career Bundle ($19.99, one-time).',
          code: 'payment_required',
        },
        402
      )
    }
    const remaining = await peekFreeQuota(c)
    if (remaining < 0) {
      return c.json(
        {
          error:
            'You have used all free AI calls for now — they reset within 30 days.',
          code: 'payment_required',
        },
        402
      )
    }
    freeRemaining = remaining
  }
  const body = await c.req
    .json<{ resumeText?: string; jobDescription?: string; company?: string; role?: string }>()
    .catch(() => ({}) as Record<string, never>)
  const resumeText = body.resumeText?.trim()
  const jd = body.jobDescription?.trim()
  if (!resumeText) return c.json({ error: 'Add resume content first.' }, 400)
  if (!jd) return c.json({ error: 'Paste the job description first.' }, 400)
  const result = await callLlm(
    c.env,
    buildCoverLetterMessages(resumeText, jd, body.company ?? '', body.role ?? ''),
    0.6
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ text: result.text, freeRemaining })
})

// Interview brief — Career Bundle (free mode: shares the free AI quota)
app.post('/api/ai/interview-brief', async (c) => {
  const ent = await entitlementFromRequest(c)
  let freeRemaining: number | null = null
  if (!ent || ent.plan !== 'bundle') {
    if (!freeMode(c.env)) {
      return c.json(
        {
          error: 'Interview prep is part of the Career Bundle ($19.99, one-time).',
          code: 'payment_required',
        },
        402
      )
    }
    const remaining = await peekFreeQuota(c)
    if (remaining < 0) {
      return c.json(
        {
          error:
            'You have used all free AI calls for now — they reset within 30 days.',
          code: 'payment_required',
        },
        402
      )
    }
    freeRemaining = remaining
  }
  const body = await c.req
    .json<{ resumeText?: string; jobDescription?: string; role?: string }>()
    .catch(() => ({}) as Record<string, never>)
  const resumeText = body.resumeText?.trim()
  const jd = body.jobDescription?.trim()
  if (!resumeText) return c.json({ error: 'Add resume content first.' }, 400)
  if (!jd) return c.json({ error: 'Paste the job description first.' }, 400)
  const result = await callLlm(
    c.env,
    buildInterviewBriefMessages(resumeText, jd, body.role ?? ''),
    0.5
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ text: result.text, freeRemaining })
})

// Checkout availability: frontend checks before opening Paddle; when disabled
// the buy button degrades to an email waitlist.
app.get('/api/billing/status', (c) => {
  const enabled = c.env.CHECKOUT_ENABLED === 'true' && !freeMode(c.env)
  const provider = lsConfigured(c.env) ? 'lemonsqueezy' : 'paddle'
  return c.json({ checkoutEnabled: enabled, provider, freeMode: freeMode(c.env) })
})

// Create a Lemon Squeezy hosted checkout for a plan (opened as an overlay)
app.post('/api/billing/checkout', async (c) => {
  if (c.env.CHECKOUT_ENABLED !== 'true' || !lsConfigured(c.env)) {
    return c.json({ error: 'Checkout is not available yet.' }, 503)
  }
  const { plan } = await c.req
    .json<{ plan?: string }>()
    .catch(() => ({ plan: undefined }))
  if (plan !== 'resume' && plan !== 'bundle') {
    return c.json({ error: 'Invalid plan.' }, 400)
  }
  const clientId = c.req.header('x-client-id')?.trim().slice(0, 64) ?? ''
  const url = await createLsCheckout(c.env, plan, clientId)
  if (!url) return c.json({ error: 'Could not start checkout — please retry.' }, 502)
  return c.json({ url })
})

// Lemon Squeezy webhook: verify X-Signature, record paid orders in KV so
// claims don't need the LS API.
app.post('/api/billing/ls-webhook', async (c) => {
  const secret = c.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) return c.json({ error: 'webhook not configured' }, 503)
  const signature = c.req.header('x-signature')
  if (!signature) return c.json({ error: 'missing signature' }, 401)
  const rawBody = await c.req.text()
  if (!(await verifyLsSignature(secret, rawBody, signature))) {
    return c.json({ error: 'invalid signature' }, 401)
  }

  let event: {
    meta?: { event_name?: string; webhook_id?: string }
    data?: {
      id?: string
      attributes?: {
        status?: string
        first_order_item?: { variant_id?: number }
      }
    }
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return c.json({ error: 'invalid payload' }, 400)
  }

  // Idempotency: LS retries deliveries
  const webhookId = event.meta?.webhook_id
  if (webhookId) {
    const seenKey = lsEventKvKey(webhookId)
    if (await c.env.KV.get(seenKey)) return c.json({ ok: true, duplicate: true })
    await c.env.KV.put(seenKey, '1', { expirationTtl: 60 * 60 * 24 * 7 })
  }

  if (event.meta?.event_name === 'order_created' && event.data?.id) {
    const attrs = event.data.attributes
    const paid = (LS_PAID_STATUSES as readonly string[]).includes(
      attrs?.status ?? ''
    )
    const plan = planFromVariantId(c.env, attrs?.first_order_item?.variant_id)
    if (paid && plan) {
      const kvKey = lsOrderKvKey(event.data.id)
      const existing = await c.env.KV.get(kvKey)
      if (!existing) {
        const record: PaddleTxRecord = { transactionId: event.data.id, plan }
        await c.env.KV.put(kvKey, JSON.stringify(record))
      }
    }
  }
  return c.json({ ok: true })
})

// First-party pageview beacon — fallback for when adblockers block
// Cloudflare's beacon.min.js. Stores path + day + external referrer origin
// only; no cookies, no PII. Accepts JSON {p, r} or a legacy plain path.
app.post('/api/hit', async (c) => {
  const body = await c.req.text()
  let path: string
  let ref = ''
  if (body.startsWith('{')) {
    try {
      const parsed = JSON.parse(body) as { p?: string; r?: string }
      path = (parsed.p ?? '').trim()
      ref = (parsed.r ?? '').trim()
    } catch {
      return c.json({ error: 'bad body' }, 400)
    }
  } else {
    path = body.trim()
  }
  if (!path.startsWith('/') || path.length > 200 || /[\s<>]/.test(path)) {
    return c.json({ error: 'bad path' }, 400)
  }
  if (!/^https?:\/\/[^\s<>"']{1,100}$/.test(ref)) ref = ''
  const day = new Date().toISOString().slice(0, 10)
  await c.env.KV.put(
    `hit:${day}:${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    JSON.stringify(ref ? { p: path, r: ref } : { p: path }),
    { expirationTtl: 60 * 60 * 24 * 90 }
  )
  return c.json({ ok: true })
})

// Email waitlist while the payment channel is pending approval
app.post('/api/leads', async (c) => {
  const { email, plan } = await c.req
    .json<{ email?: string; plan?: string }>()
    .catch(() => ({ email: undefined, plan: undefined }))
  const addr = email?.trim().toLowerCase() ?? ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr) || addr.length > 254) {
    return c.json({ error: 'Please enter a valid email address.' }, 400)
  }
  const record = {
    email: addr,
    plan: typeof plan === 'string' ? plan.slice(0, 32) : '',
    createdAt: new Date().toISOString(),
  }
  await c.env.KV.put(`lead:${Date.now()}`, JSON.stringify(record))
  return c.json({ ok: true })
})

interface PaddleTxRecord {
  transactionId: string
  licenseKey?: string
  plan?: 'resume' | 'bundle'
  claimedAt?: number
}

// Paddle Billing webhook: verify signature, then record completed transactions
// in KV so claims don't need the Paddle API.
app.post('/api/billing/paddle-webhook', async (c) => {
  const secret = c.env.PADDLE_WEBHOOK_SECRET
  if (!secret) return c.json({ error: 'webhook not configured' }, 503)
  const signature = c.req.header('paddle-signature')
  if (!signature) return c.json({ error: 'missing signature' }, 401)
  const rawBody = await c.req.text()
  if (!(await verifyPaddleSignature(secret, rawBody, signature))) {
    return c.json({ error: 'invalid signature' }, 401)
  }

  let event: {
    event_id?: string
    event_type?: string
    data?: { id?: string; status?: string; items?: { price?: { id?: string } }[] }
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return c.json({ error: 'invalid payload' }, 400)
  }

  // Idempotency: Paddle retries deliveries
  if (event.event_id) {
    const seenKey = paddleEventKvKey(event.event_id)
    if (await c.env.KV.get(seenKey)) return c.json({ ok: true, duplicate: true })
    await c.env.KV.put(seenKey, '1', { expirationTtl: 60 * 60 * 24 * 7 })
  }

  if (event.event_type === 'transaction.completed' && event.data?.id) {
    const info = paddleTransactionInfo(event.data)
    const plan = planFromPriceIds(c.env, info.priceIds)
    if (plan) {
      const kvKey = paddleTxKvKey(info.id)
      const existing = await c.env.KV.get(kvKey)
      if (!existing) {
        const record: PaddleTxRecord = { transactionId: info.id, plan }
        await c.env.KV.put(kvKey, JSON.stringify(record))
      }
    }
  }
  return c.json({ ok: true })
})

// After checkout the frontend claims a license with the transaction_id.
// Idempotent: the same transaction always returns the same license.
app.post('/api/license/claim', async (c) => {
  const secret = c.env.LICENSE_SIGNING_SECRET
  if (!secret) return c.json({ error: 'License signing is not configured.' }, 503)
  const { transactionId } = await c.req
    .json<{ transactionId?: string }>()
    .catch(() => ({ transactionId: undefined }))
  const txId = transactionId?.trim()
  if (!txId || txId.length < 4 || txId.length > 128) {
    return c.json({ error: 'Invalid transaction id.' }, 400)
  }

  // Lemon Squeezy order ids are numeric; Paddle transaction ids are txn_...
  const isLsOrder = /^\d+$/.test(txId)
  const txKvKey = isLsOrder ? lsOrderKvKey(txId) : paddleTxKvKey(txId)
  let txRecord: PaddleTxRecord | null = null
  const storedTx = await c.env.KV.get(txKvKey)
  if (storedTx) {
    try {
      txRecord = JSON.parse(storedTx) as PaddleTxRecord
    } catch {
      txRecord = null
    }
  }

  // Already claimed: return the same license (idempotent, no re-issue)
  if (txRecord?.licenseKey) {
    const stored = await c.env.KV.get(licenseKvKey(txRecord.licenseKey))
    if (stored) {
      const record = JSON.parse(stored) as LicenseRecord
      if (record.expiresAt < Date.now()) {
        return c.json({ error: 'The license for this order has expired.' }, 410)
      }
      const token = await signToken(secret, {
        key: record.key,
        plan: record.plan,
        exp: record.expiresAt,
      })
      return c.json({
        token,
        licenseKey: record.key,
        plan: record.plan,
        expiresAt: record.expiresAt,
        alreadyClaimed: true,
      })
    }
  }

  // Determine the plan: webhook record first, else verify via the provider API
  let plan = txRecord?.plan ?? null
  if (!plan && isLsOrder) {
    const order = await fetchLsOrder(c.env, txId)
    if (!order) {
      return c.json(
        {
          error:
            'Could not verify the order right now — please retry in a minute if you just paid.',
        },
        502
      )
    }
    if (!(LS_PAID_STATUSES as readonly string[]).includes(order.status)) {
      return c.json({ error: 'This order has not been paid yet.' }, 402)
    }
    plan = planFromVariantId(c.env, order.variantId)
    if (!plan) {
      return c.json({ error: 'No HonestCV product found in this order.' }, 404)
    }
  } else if (!plan) {
    const tx = await fetchPaddleTransaction(c.env, txId)
    if (!tx) {
      return c.json(
        {
          error:
            'Could not verify the order right now — please retry in a minute if you just paid.',
        },
        502
      )
    }
    if (!(PADDLE_PAID_STATUSES as readonly string[]).includes(tx.status)) {
      return c.json({ error: 'This order has not been paid yet.' }, 402)
    }
    plan = planFromPriceIds(c.env, tx.priceIds)
    if (!plan) {
      return c.json({ error: 'No HonestCV product found in this order.' }, 404)
    }
  }

  const licenseKey = generateLicenseKey()
  const record = newLicenseRecord(licenseKey, plan, {
    orderId: txId,
    activatedAt: Date.now(),
  })
  await c.env.KV.put(licenseKvKey(licenseKey), JSON.stringify(record))
  const claimed: PaddleTxRecord = {
    transactionId: txId,
    licenseKey,
    plan,
    claimedAt: Date.now(),
  }
  await c.env.KV.put(txKvKey, JSON.stringify(claimed))

  const token = await signToken(secret, {
    key: record.key,
    plan: record.plan,
    exp: record.expiresAt,
  })
  return c.json({
    token,
    licenseKey,
    plan: record.plan,
    expiresAt: record.expiresAt,
  })
})

// Re-activate on another device with the license key
app.post('/api/license/activate', async (c) => {
  const secret = c.env.LICENSE_SIGNING_SECRET
  if (!secret) return c.json({ error: 'License signing is not configured.' }, 503)
  const { licenseKey } = await c.req
    .json<{ licenseKey?: string }>()
    .catch(() => ({ licenseKey: undefined }))
  const key = licenseKey?.trim()
  if (!key || key.length < 8 || key.length > 128) {
    return c.json({ error: 'Please enter a valid license key.' }, 400)
  }

  const stored = await c.env.KV.get(licenseKvKey(key))
  let record: LicenseRecord | null = null
  if (stored) {
    try {
      record = JSON.parse(stored) as LicenseRecord
    } catch {
      record = null
    }
  }
  if (!record) {
    return c.json(
      { error: 'License not found — double-check the key, or retry in a minute if you just paid.' },
      404
    )
  }
  if (record.expiresAt < Date.now()) {
    return c.json({ error: 'This license has expired.' }, 410)
  }
  if (!record.activatedAt) {
    record.activatedAt = Date.now()
    await c.env.KV.put(licenseKvKey(key), JSON.stringify(record))
  }

  const token = await signToken(secret, {
    key: record.key,
    plan: record.plan,
    exp: record.expiresAt,
  })
  return c.json({
    token,
    plan: record.plan,
    expiresAt: record.expiresAt,
  })
})

// Current unlock status for the stored token (checked at app start)
app.get('/api/license/status', async (c) => {
  const ent = await entitlementFromRequest(c)
  if (!ent) return c.json({ plan: null })
  return c.json({ plan: ent.plan, expiresAt: ent.exp })
})

// Client-side routes rendered by the SPA shell; anything else missing from
// static assets is a real 404 (avoids soft-404s for arbitrary URLs).
const SPA_ROUTES = new Set(['/', '/builder', '/ats-checker'])

app.notFound(async (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'Not Found' }, 404)
  }
  const res = await c.env.ASSETS.fetch(c.req.raw)
  if (res.status !== 404) return res
  const path = c.req.path.length > 1 ? c.req.path.replace(/\/+$/, '') : c.req.path
  const shell = await c.env.ASSETS.fetch(new Request(new URL('/', c.req.url)))
  return new Response(shell.body, {
    status: SPA_ROUTES.has(path) ? 200 : 404,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
})

export default app
