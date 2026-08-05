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
  type RewriteKind,
  buildCoverLetterMessages,
  buildInterviewBriefMessages,
  buildRewriteMessages,
} from './prompts'

interface Env extends BillingEnv, PaddleEnv {
  LLM_RELAY_BASE_URL?: string
  LLM_RELAY_API_KEY?: string
  LLM_MODEL?: string
  /** Checkout switch: frontend opens Paddle checkout only when "true" */
  CHECKOUT_ENABLED?: string
  ASSETS: Fetcher
}

/** Free users: AI rewrites per client per 30 days (paid = unlimited) */
const FREE_AI_REWRITES = 5

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
  temperature = 0.5
): Promise<{ text?: string; error?: string; status?: number }> {
  let baseUrl = env.LLM_RELAY_BASE_URL?.replace(/\/+$/, '')
  if (baseUrl && !/\/v\d+$/.test(baseUrl)) baseUrl = `${baseUrl}/v1`
  const apiKey = env.LLM_RELAY_API_KEY
  const model = env.LLM_MODEL || 'gpt-4o-mini'
  if (!baseUrl || !apiKey) {
    return { error: 'The AI service is not configured yet. Please try again later.', status: 503 }
  }
  let upstream: Response
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: 1200 }),
    })
  } catch {
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
  const kvKey = quotaKvKey(fp, 'ai')
  const used = Number((await c.env.KV.get(kvKey)) ?? '0')
  if (used >= FREE_AI_REWRITES) return -1
  await c.env.KV.put(kvKey, String(used + 1), { expirationTtl: 60 * 60 * 24 * 30 })
  return FREE_AI_REWRITES - used - 1
}

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors())

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
    const remaining = await consumeFreeQuota(c)
    if (remaining < 0) {
      return c.json(
        {
          error:
            'Free AI rewrites are used up. Unlock HonestCV once ($9.99) for unlimited AI rewrites plus PDF/DOCX downloads.',
          code: 'payment_required',
        },
        402
      )
    }
    freeRemaining = remaining
  }

  const result = await callLlm(
    c.env,
    buildRewriteMessages(kind, text, {
      role: body.role,
      jobDescription: body.jobDescription,
    })
  )
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  return c.json({ text: result.text, freeRemaining })
})

// Cover letter — Career Bundle only
app.post('/api/ai/cover-letter', async (c) => {
  const ent = await entitlementFromRequest(c)
  if (!ent || ent.plan !== 'bundle') {
    return c.json(
      {
        error: 'The cover letter writer is part of the Career Bundle ($19.99, one-time).',
        code: 'payment_required',
      },
      402
    )
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
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  return c.json({ text: result.text })
})

// Interview brief — Career Bundle only
app.post('/api/ai/interview-brief', async (c) => {
  const ent = await entitlementFromRequest(c)
  if (!ent || ent.plan !== 'bundle') {
    return c.json(
      {
        error: 'Interview prep is part of the Career Bundle ($19.99, one-time).',
        code: 'payment_required',
      },
      402
    )
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
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  return c.json({ text: result.text })
})

// Checkout availability: frontend checks before opening Paddle; when disabled
// the buy button degrades to an email waitlist.
app.get('/api/billing/status', (c) => {
  return c.json({ checkoutEnabled: c.env.CHECKOUT_ENABLED === 'true' })
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

  const txKvKey = paddleTxKvKey(txId)
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

  // Determine the plan: webhook record first, else verify via the Paddle API
  let plan = txRecord?.plan ?? null
  if (!plan) {
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

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'Not Found' }, 404)
  }
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
