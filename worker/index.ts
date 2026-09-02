import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  type BillingEnv,
  type LicenseRecord,
  type TokenPayload,
  generateLicenseKey,
  licenseKvKey,
  newLicenseRecord,
  quotaKvKey,
  signToken,
  verifyToken,
} from './billing'
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
  type AssistantTurn,
  type RewriteKind,
  type TailorItem,
  buildAssistantMessages,
  parseAssistantAction,
  buildTailorMessages,
  buildCoverLetterMessages,
  buildKeywordBulletMessages,
  buildSuggestBulletMessages,
  buildInterviewBriefMessages,
  buildInterviewFeedbackMessages,
  buildInterviewQuestionsMessages,
  buildResignationLetterMessages,
  buildRewriteMessages,
  buildSkillSuggestMessages,
  buildSummaryDraftMessages,
  withOutputLanguage,
} from './prompts'

interface Env extends BillingEnv, LsEnv {
  LLM_RELAY_BASE_URL?: string
  LLM_RELAY_API_KEY?: string
  LLM_MODEL?: string
  /** Checkout switch: frontend opens checkout only when "true" */
  CHECKOUT_ENABLED?: string
  /** Launch/traffic mode: downloads free, bundle AI tools share the free quota */
  FREE_MODE?: string
  ASSETS: Fetcher
}

const freeMode = (env: Env) => env.FREE_MODE === 'true'

/** Unified QA-traffic marker: scripted probes send `x-qa: 1`, and headless
 * browsers are never real visitors. Marked requests are accepted but not
 * counted in first-party analytics. */
const isQaRequest = (req: Request) => {
  if (req.headers.get('x-qa') === '1') return true
  const ua = (req.headers.get('user-agent') ?? '').toLowerCase()
  // Beacon counts can't be made forgery-proof; at least drop headless
  // browsers, obvious bots and bare HTTP clients (no UA) at the source.
  return ua === '' || /headless|bot|crawl|spider|curl|wget|python|node-fetch|go-http/.test(ua)
}

/** Free users: AI rewrites per client per 30 days (paid = unlimited) */
const FREE_AI_REWRITES = 5
/** Launch mode is more generous while we optimize for traffic */
const FREE_MODE_AI_CALLS = 12
/** Wide per-IP daily backstop on AI requests: bounds single-source floods
 * without locking out shared exits (CGNAT / campus networks); the narrow
 * per-client quota and the global breaker are the primary cost gates. */
const AI_IP_DAILY_LIMIT = 100
/** Site-wide daily circuit breaker on unlicensed AI calls: caps total LLM
 * spend even against distributed (many-IP) abuse. */
const AI_GLOBAL_DAILY_LIMIT = 500
/** Waitlist/subscribe limits, three layers: a narrow per-client quota (the
 * primary gate), a wide per-IP backstop (shared exits / CGNAT put many real
 * users behind one IP, so this must stay loose), and a global daily breaker. */
const LEADS_CLIENT_DAILY_LIMIT = 5
const LEADS_IP_DAILY_LIMIT = 100
const LEADS_GLOBAL_DAILY_LIMIT = 500
/** Upper bound on AI request bodies (resume text + JD comfortably fit) */
const AI_MAX_BODY_BYTES = 60_000
/** Upper bound on a single rewrite input */
const AI_MAX_TEXT_CHARS = 5_000

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
    return {
      error:
        'Could not reach the AI service — please retry in a minute. None of your free AI uses were spent.',
      status: 502,
    }
  }
  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    console.error('LLM upstream error', upstream.status, detail.slice(0, 500))
    return {
      error: `The AI service is temporarily unavailable (${upstream.status}) — please retry in a minute. None of your free AI uses were spent.`,
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

// Edge-cache successful same-origin GET pages (same pattern as NameChart's
// cache middleware) so the SPA shells served by the Worker for /builder and
// /ats-checker get cf-cache hits like the static assets already do.
// Bump to invalidate edge-cached Worker HTML on deploys that change rendering.
const CACHE_VER = 4

const etagOf = async (buf: ArrayBuffer) => {
  const d = await crypto.subtle.digest('SHA-1', buf)
  return '"' + [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('') + '"'
}
const notModified = (res: Response) => {
  const h = new Headers()
  for (const k of ['ETag', 'Cache-Control']) {
    const v = res.headers.get(k)
    if (v) h.set(k, v)
  }
  return new Response(null, { status: 304, headers: h })
}

app.use('*', async (c, next) => {
  if (c.req.method !== 'GET') return next()
  const url = new URL(c.req.url)
  // Query-string requests are never cached (the key is path-only), so don't serve them from cache either.
  if (url.pathname.startsWith('/api/') || url.search) return next()
  const inm = c.req.header('If-None-Match')
  const key = new Request(url.origin + '/__v' + CACHE_VER + url.pathname, { method: 'GET' })
  const hit = await caches.default.match(key)
  if (hit) {
    if (inm && inm === hit.headers.get('ETag')) return notModified(hit)
    return new Response(hit.body, hit)
  }
  await next()
  if (c.res.status === 200 && (c.res.headers.get('Cache-Control') || '').includes('s-maxage')) {
    const buf = await c.res.arrayBuffer()
    const res = new Response(buf, c.res)
    res.headers.set('ETag', await etagOf(buf))
    c.executionCtx.waitUntil(caches.default.put(key, res.clone()))
    c.res = inm && inm === res.headers.get('ETag') ? notModified(res) : res
  }
})

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
  h.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob: https://remotive.com; font-src 'self'; connect-src 'self' https://resume.zalize.com https://resume-forge.wookat520.workers.dev; " +
      "worker-src 'self' blob:; object-src 'none'; base-uri 'self'; " +
      "form-action 'self'; frame-ancestors 'self'"
  )
  if (c.req.path.startsWith('/assets/')) {
    h.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (c.req.path.startsWith('/fonts/')) {
    h.set('Cache-Control', 'public, max-age=604800')
  } else if (c.req.path.startsWith('/s/')) {
    // Shared-resume shells stay uncached so a revoked link 404s immediately
    h.set('Cache-Control', 'no-store')
  } else if (c.req.method === 'GET' && !c.req.path.startsWith('/api/') && c.res.status === 200) {
    // Pages: short TTLs everywhere (s-maxage also opts the response into the
    // cache middleware above). The zone edge cache sits in front of the Worker
    // and can't be purged with our API tokens, so s-maxage bounds how long a
    // stale SPA shell (with previous-deploy asset hashes) survives a deploy.
    h.set('Cache-Control', 'public, max-age=60, s-maxage=60')
  }
})

app.use(
  '/api/*',
  cors({
    origin: (origin) =>
      origin === 'https://cv.zalize.com' || /^http:\/\/localhost(:\d+)?$/.test(origin)
        ? origin
        : 'https://cv.zalize.com',
  })
)

// Abuse gate for all AI endpoints: request-size cap plus a per-IP daily
// request cap. Licensed users are exempt; the per-client free quota is
// still checked per endpoint (x-client-id stays a UX dimension only).
app.use('/api/ai/*', async (c, next) => {
  if (c.req.method !== 'POST') return next()
  const length = Number(c.req.header('content-length') ?? '0')
  if (length > AI_MAX_BODY_BYTES) {
    return c.json({ error: 'Request too large — trim the pasted text and retry.' }, 413)
  }
  const ip = c.req.header('cf-connecting-ip')
  if (ip && !(await entitlementFromRequest(c))) {
    const day = new Date().toISOString().slice(0, 10)
    const key = `rl:ai:${day}:${ip}`
    const used = Number((await c.env.KV.get(key)) ?? '0')
    if (used >= AI_IP_DAILY_LIMIT) {
      return c.json(
        {
          error:
            'Daily AI request limit reached for your network — please try again tomorrow.',
          code: 'rate_limited',
        },
        429
      )
    }
    const globalKey = `rl:ai-global:${day}`
    const globalUsed = Number((await c.env.KV.get(globalKey)) ?? '0')
    if (globalUsed >= AI_GLOBAL_DAILY_LIMIT) {
      return c.json(
        {
          error:
            'The free AI tier is at capacity for today — please try again tomorrow. None of your free AI uses were spent.',
          code: 'rate_limited',
        },
        429
      )
    }
    await c.env.KV.put(key, String(used + 1), { expirationTtl: 60 * 60 * 24 * 2 })
    await c.env.KV.put(globalKey, String(globalUsed + 1), { expirationTtl: 60 * 60 * 24 * 2 })
  }
  return next()
})

// Remaining free-AI quota for this client (read-only, no consumption)
app.get('/api/ai/quota', async (c) => {
  const fp = c.req.header('x-client-id')?.trim()
  if (!fp || fp.length < 8 || fp.length > 128) return c.json({ freeRemaining: null })
  const limit = freeMode(c.env) ? FREE_MODE_AI_CALLS : FREE_AI_REWRITES
  const used = Number((await c.env.KV.get(quotaKvKey(fp, 'ai'))) ?? '0')
  return c.json({ freeRemaining: Math.max(limit - used, 0) })
})

// Job search: proxy Remotive's public remote-jobs API behind a KV cache so
// the upstream sees at most one request per query per hour. Descriptions are
// flattened to plain text so the client can feed them straight into the JD
// tailoring flow (and the CSP never has to allow third-party origins).
const JOBS_CACHE_TTL = 60 * 60
const JOBS_MAX_QUERY = 80
const JOBS_MAX_DESCRIPTION = 8_000

const htmlToText = (html: string) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&(#39|apos|#x27);/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

// Fixed category slugs accepted by Remotive's `category` parameter,
// mapped to the category labels Remotive uses on job entries. The label
// match is enforced here because the upstream parameter is not always
// honored; 'all-others' acts as the catch-all for unmatched labels.
const JOBS_CATEGORIES: Record<string, string[]> = {
  'software-dev': ['software development'],
  'customer-support': ['customer service'],
  design: ['design'],
  marketing: ['marketing'],
  'sales-business': ['sales', 'business'],
  product: ['product'],
  'project-management': ['project management'],
  data: ['data analysis', 'data'],
  devops: ['devops', 'sysadmin'],
  'finance-legal': ['finance', 'legal'],
  hr: ['human resources'],
  qa: ['qa', 'quality assurance'],
  writing: ['writing'],
  'all-others': [],
}
const JOBS_KNOWN_LABELS = new Set(
  Object.values(JOBS_CATEGORIES).flat()
)

function matchesCategory(slug: string, label: string): boolean {
  const l = label.trim().toLowerCase()
  if (slug === 'all-others') return !JOBS_KNOWN_LABELS.has(l)
  return JOBS_CATEGORIES[slug].includes(l)
}

interface RemotiveJob {
  id?: number | string
  url?: string
  title?: string
  company_name?: string
  company_logo?: string
  category?: string
  job_type?: string
  publication_date?: string
  candidate_required_location?: string
  salary?: string
  description?: string
  tags?: string[]
}

/** Normalize upstream skill tags: trimmed, deduped case-insensitively, capped. */
function normalizeTags(tags: string[] | undefined): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags ?? []) {
    const tag = String(raw).trim()
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    out.push(tag)
    if (out.length >= 24) break
  }
  return out
}

app.get('/api/jobs/search', async (c) => {
  const q = (c.req.query('q') ?? '').trim().slice(0, JOBS_MAX_QUERY)
  const rawCategory = (c.req.query('category') ?? '').trim()
  const category = rawCategory in JOBS_CATEGORIES ? rawCategory : ''
  const cacheKey = `jobs:v4:${q.toLowerCase()}|${category}`
  const cached = await c.env.KV.get(cacheKey)
  if (cached) return c.json(JSON.parse(cached) as Record<string, unknown>)
  const upstreamUrl = new URL('https://remotive.com/api/remote-jobs')
  if (q) upstreamUrl.searchParams.set('search', q)
  if (category) upstreamUrl.searchParams.set('category', category)
  upstreamUrl.searchParams.set('limit', '50')
  let upstream: Response | undefined
  try {
    upstream = await fetch(upstreamUrl, { headers: { accept: 'application/json' } })
  } catch {
    // network failure: handled below
  }
  if (!upstream?.ok) {
    return c.json({ error: 'Job search is unavailable right now — please retry shortly.' }, 502)
  }
  const data = await upstream
    .json<{ jobs?: RemotiveJob[] }>()
    .catch(() => ({ jobs: [] as RemotiveJob[] }))
  const jobs = (data.jobs ?? [])
    .filter((j) => j.id && j.title && j.url)
    .filter((j) => !category || matchesCategory(category, j.category ?? ''))
    .map((j) => ({
      id: String(j.id),
      title: j.title ?? '',
      company: j.company_name ?? '',
      logo: j.company_logo ?? '',
      category: j.category ?? '',
      type: (j.job_type ?? '').replace(/_/g, ' '),
      location: j.candidate_required_location || 'Remote',
      postedAt: j.publication_date ?? '',
      salary: j.salary ?? '',
      url: j.url ?? '',
      tags: normalizeTags(j.tags),
      description: htmlToText(j.description ?? '').slice(0, JOBS_MAX_DESCRIPTION),
    }))
  const payload = { jobs, source: 'remotive' }
  c.executionCtx.waitUntil(
    c.env.KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: JOBS_CACHE_TTL })
  )
  return c.json(payload)
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
      language?: string
    }>()
    .catch(() => ({}) as Record<string, never>)
  const kind = body.kind as RewriteKind
  if (kind !== 'bullets' && kind !== 'summary' && kind !== 'skills') {
    return c.json({ error: 'Choose what to rewrite — a summary, bullet points, or skills.' }, 400)
  }
  const text = body.text?.trim()
  if (!text || text.length < 3) {
    return c.json({ error: 'Nothing to rewrite — add some text first.' }, 400)
  }
  if (text.length > AI_MAX_TEXT_CHARS) {
    return c.json({ error: 'That text is too long to rewrite in one go — split it up.' }, 400)
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
            : 'Free AI rewrites are used up. Unlock RezUp once ($9.99) for unlimited AI rewrites plus PDF/DOCX downloads.',
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
    withOutputLanguage(
      buildRewriteMessages(
        kind,
        text,
        { role: body.role, jobDescription: body.jobDescription },
        wantVariants
      ),
      body.language
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

// Summary draft: write candidate summaries from the resume alone, grounded
// strictly in existing content. Shares the free AI quota.
app.post('/api/ai/summary-draft', async (c) => {
  const body = await c.req
    .json<{
      resumeText?: string
      role?: string
      highlights?: string[]
      jobDescription?: string
      language?: string
    }>()
    .catch(() => ({}) as Record<string, never>)
  const resumeText = body.resumeText?.trim()
  if (!resumeText) {
    return c.json(
      { error: 'Add some experience or skills first — the draft is written only from your resume.' },
      400
    )
  }
  const highlights = (Array.isArray(body.highlights) ? body.highlights : [])
    .filter((h): h is string => typeof h === 'string')
    .map((h) => h.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 8)

  const ent = await entitlementFromRequest(c)
  let freeRemaining: number | null = null
  if (!ent) {
    const remaining = await peekFreeQuota(c)
    if (remaining < 0) {
      return c.json(
        {
          error: freeMode(c.env)
            ? 'You have used all free AI calls for now — they reset within 30 days. Downloads stay free.'
            : 'Free AI rewrites are used up. Unlock RezUp once ($9.99) for unlimited AI rewrites plus PDF/DOCX downloads.',
          code: 'payment_required',
        },
        402
      )
    }
    freeRemaining = remaining
  }

  const result = await callLlm(
    c.env,
    withOutputLanguage(
      buildSummaryDraftMessages(
        resumeText,
        body.role ?? '',
        highlights,
        typeof body.jobDescription === 'string' ? body.jobDescription : ''
      ),
      body.language
    ),
    0.5,
    900
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  const raw = (result.text ?? '').replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  let texts: string[] = []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      texts = parsed
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim())
        .slice(0, 3)
    }
  } catch {
    texts = []
  }
  if (texts.length === 0) {
    return c.json(
      {
        error:
          'The AI service is having trouble right now — please retry in a minute. None of your free AI uses were spent.',
      },
      502
    )
  }
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ text: texts[0], texts, freeRemaining })
})

// Skill suggestions: discovery chips related to the user's existing skills /
// target role — the user confirms each one. Shares the free AI quota.
app.post('/api/ai/skill-suggest', async (c) => {
  const body = await c.req
    .json<{
      skills?: string
      role?: string
      jobDescription?: string
      context?: string
      category?: string
    }>()
    .catch(() => ({}) as Record<string, never>)
  const skills = body.skills?.trim() ?? ''
  const role = body.role?.trim() ?? ''
  const context = (typeof body.context === 'string' ? body.context : '').trim().slice(0, 200)
  const category = (typeof body.category === 'string' ? body.category : '').trim().slice(0, 40)
  if (!skills && !role && !context) {
    return c.json(
      { error: 'Add a target role, a few skills, or describe what you did — suggestions build on what you already have.' },
      400
    )
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
            : 'Free AI rewrites are used up. Unlock RezUp once ($9.99) for unlimited AI rewrites plus PDF/DOCX downloads.',
          code: 'payment_required',
        },
        402
      )
    }
    freeRemaining = remaining
  }

  const result = await callLlm(
    c.env,
    buildSkillSuggestMessages(skills, role, body.jobDescription ?? '', context, category),
    0.5,
    400
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  const raw = (result.text ?? '').replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  let suggested: string[] = []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      suggested = parsed
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim())
        .filter((t) => t.length <= 40)
        .slice(0, 12)
    }
  } catch {
    suggested = []
  }
  if (suggested.length === 0) {
    return c.json(
      {
        error:
          'The AI service is having trouble right now — please retry in a minute. None of your free AI uses were spent.',
      },
      502
    )
  }
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ skills: suggested, freeRemaining })
})

// Keyword bullet: draft one bullet working a missing JD keyword into the
// resume, grounded in existing content. Shares the free AI quota.
app.post('/api/ai/keyword-bullet', async (c) => {
  const body = await c.req
    .json<{ keyword?: string; resumeText?: string; jobDescription?: string; role?: string; language?: string }>()
    .catch(() => ({}) as Record<string, never>)
  const keyword = body.keyword?.trim()
  const resumeText = body.resumeText?.trim()
  const jd = body.jobDescription?.trim()
  if (!keyword || keyword.length > 80) {
    return c.json({ error: 'Pick a keyword first.' }, 400)
  }
  if (!resumeText) {
    return c.json({ error: 'Add some resume content first — the bullet is grounded in it.' }, 400)
  }
  if (!jd) return c.json({ error: 'Paste the job description first.' }, 400)

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

  const result = await callLlm(
    c.env,
    withOutputLanguage(buildKeywordBulletMessages(keyword, resumeText, jd, body.role ?? ''), body.language),
    0.5,
    400
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  const text = (result.text ?? '').trim().replace(/^[-•]\s*/, '')
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ text, freeRemaining })
})

// Suggest one new bullet for a specific experience entry, grounded in the
// resume (bracketed placeholders where specifics are unknown). Shares the
// free AI quota.
app.post('/api/ai/suggest-bullet', async (c) => {
  const body = await c.req
    .json<{ role?: string; company?: string; companyInfo?: string; bullets?: string[]; resumeText?: string; variant?: string; language?: string }>()
    .catch(() => ({}) as Record<string, never>)
  const role = body.role?.trim() ?? ''
  const company = body.company?.trim() ?? ''
  const companyInfo = (body.companyInfo?.trim() ?? '').slice(0, 300)
  if (!role && !company) {
    return c.json({ error: 'Add a job title or company first — the bullet is drafted for that role.' }, 400)
  }
  if (role.length > 200 || company.length > 200) {
    return c.json({ error: 'That role or company name is too long.' }, 400)
  }
  const bullets = Array.isArray(body.bullets)
    ? body.bullets.filter((b): b is string => typeof b === 'string').slice(0, 12)
    : []
  const resumeText = body.resumeText?.trim() ?? ''
  const variant = body.variant === 'key-numbers' ? 'key-numbers' : undefined

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

  const result = await callLlm(
    c.env,
    withOutputLanguage(
      buildSuggestBulletMessages(role, company, bullets, resumeText, variant, companyInfo),
      body.language
    ),
    0.6,
    400
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  const text = (result.text ?? '').trim().replace(/^[-•]\s*/, '')
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ text, freeRemaining })
})

// Tailor pass: rewrite summary + bullets toward one JD in a single call,
// returning per-item suggestions. Shares the free AI quota.
app.post('/api/ai/tailor', async (c) => {
  const body = await c.req
    .json<{ items?: TailorItem[]; jobDescription?: string; role?: string; language?: string }>()
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

  const result = await callLlm(
    c.env,
    withOutputLanguage(buildTailorMessages(items, jd, body.role ?? ''), body.language),
    0.4,
    3000
  )
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
    return c.json(
      {
        error:
          'The AI service is having trouble right now — please retry in a minute. None of your free AI uses were spent.',
      },
      502
    )
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
    .json<{ resumeText?: string; jobDescription?: string; company?: string; role?: string; addressee?: string; language?: string }>()
    .catch(() => ({}) as Record<string, never>)
  const resumeText = body.resumeText?.trim()
  const jd = body.jobDescription?.trim()
  if (!resumeText) return c.json({ error: 'Add resume content first.' }, 400)
  if (!jd) return c.json({ error: 'Paste the job description first.' }, 400)
  const result = await callLlm(
    c.env,
    withOutputLanguage(
      buildCoverLetterMessages(resumeText, jd, body.company ?? '', body.role ?? '', body.addressee?.trim() ?? ''),
      body.language
    ),
    0.6
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ text: result.text, freeRemaining })
})

// Resignation letter — Career Bundle (free mode: shares the free AI quota)
app.post('/api/ai/resignation-letter', async (c) => {
  const ent = await entitlementFromRequest(c)
  let freeRemaining: number | null = null
  if (!ent || ent.plan !== 'bundle') {
    if (!freeMode(c.env)) {
      return c.json(
        {
          error: 'The resignation letter writer is part of the Career Bundle ($19.99, one-time).',
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
    .json<{ company?: string; role?: string; lastDay?: string; reason?: string; name?: string }>()
    .catch(() => ({}) as Record<string, never>)
  const company = body.company?.trim()
  const role = body.role?.trim()
  if (!company) return c.json({ error: 'Add your company name first.' }, 400)
  if (!role) return c.json({ error: 'Add your current role first.' }, 400)
  const result = await callLlm(
    c.env,
    buildResignationLetterMessages(
      company,
      role,
      body.lastDay?.trim() ?? '',
      body.reason ?? '',
      body.name?.trim() ?? ''
    ),
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

// Interview practice questions — Career Bundle (free mode: shares the free AI quota)
app.post('/api/ai/interview-questions', async (c) => {
  const ent = await entitlementFromRequest(c)
  let freeRemaining: number | null = null
  if (!ent || ent.plan !== 'bundle') {
    if (!freeMode(c.env)) {
      return c.json(
        {
          error: 'Interview practice is part of the Career Bundle ($19.99, one-time).',
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
    buildInterviewQuestionsMessages(resumeText, jd, body.role ?? ''),
    0.6,
    600
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  const raw = (result.text ?? '').replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  let questions: string[] = []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      questions = parsed
        .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
        .map((q) => q.trim().slice(0, 200))
        .slice(0, 5)
    }
  } catch {
    questions = []
  }
  if (questions.length === 0) {
    return c.json(
      {
        error:
          'The AI service is having trouble right now — please retry in a minute. None of your free AI uses were spent.',
      },
      502
    )
  }
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ questions, freeRemaining })
})

// Interview answer feedback — Career Bundle (free mode: shares the free AI quota)
app.post('/api/ai/interview-feedback', async (c) => {
  const ent = await entitlementFromRequest(c)
  let freeRemaining: number | null = null
  if (!ent || ent.plan !== 'bundle') {
    if (!freeMode(c.env)) {
      return c.json(
        {
          error: 'Interview practice is part of the Career Bundle ($19.99, one-time).',
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
    .json<{
      question?: string
      answer?: string
      resumeText?: string
      jobDescription?: string
      role?: string
    }>()
    .catch(() => ({}) as Record<string, never>)
  const question = body.question?.trim()
  const answer = body.answer?.trim()
  if (!question) return c.json({ error: 'Type the interview question first.' }, 400)
  if (!answer || answer.length < 20) {
    return c.json({ error: 'Write your answer first — a couple of sentences at least.' }, 400)
  }
  const result = await callLlm(
    c.env,
    buildInterviewFeedbackMessages(
      question,
      answer,
      body.resumeText ?? '',
      body.jobDescription ?? '',
      body.role ?? ''
    ),
    0.5
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  return c.json({ text: result.text, freeRemaining })
})

// Resume assistant chat — Career Bundle (free mode: shares the free AI quota)
app.post('/api/ai/assistant', async (c) => {
  const ent = await entitlementFromRequest(c)
  let freeRemaining: number | null = null
  if (!ent || ent.plan !== 'bundle') {
    if (!freeMode(c.env)) {
      return c.json(
        {
          error: 'The resume assistant is part of the Career Bundle ($19.99, one-time).',
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
    .json<{
      turns?: AssistantTurn[]
      resumeText?: string
      jobDescription?: string
      role?: string
      scoreSummary?: string
    }>()
    .catch(() => ({}) as Record<string, never>)
  const turns = (body.turns ?? [])
    .filter(
      (t): t is AssistantTurn =>
        Boolean(t && typeof t.content === 'string' && t.content.trim()) &&
        (t.role === 'user' || t.role === 'assistant')
    )
    .slice(-12)
  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
    return c.json({ error: 'Type a message first.' }, 400)
  }
  const result = await callLlm(
    c.env,
    buildAssistantMessages(
      turns,
      body.resumeText ?? '',
      body.jobDescription ?? '',
      body.role ?? '',
      typeof body.scoreSummary === 'string' ? body.scoreSummary : ''
    ),
    0.5,
    1200
  )
  // Quota is consumed only after a successful call, so failures cost nothing
  if (result.error) return c.json({ error: result.error }, (result.status ?? 502) as 502)
  if (freeRemaining !== null) freeRemaining = Math.max(await consumeFreeQuota(c), 0)
  const { text, action } = parseAssistantAction(result.text ?? '')
  return c.json({ text, action, freeRemaining })
})

// Checkout availability: frontend checks before opening checkout; when
// disabled the buy button degrades to an email waitlist.
app.get('/api/billing/status', (c) => {
  const enabled = c.env.CHECKOUT_ENABLED === 'true' && lsConfigured(c.env) && !freeMode(c.env)
  return c.json({ checkoutEnabled: enabled, provider: 'lemonsqueezy', freeMode: freeMode(c.env) })
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
        const record: OrderRecord = { transactionId: event.data.id, plan }
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
  // Internal QA pages (visited before the honestcv.qa flag is set) never count
  if (path.startsWith('/qa-') || isQaRequest(c.req.raw)) return c.json({ ok: true })
  if (!/^https?:\/\/[^\s<>"']{1,100}$/.test(ref)) ref = ''
  const day = new Date().toISOString().slice(0, 10)
  await c.env.KV.put(
    `hit:${day}:${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    JSON.stringify(ref ? { p: path, r: ref } : { p: path }),
    { expirationTtl: 60 * 60 * 24 * 90 }
  )
  return c.json({ ok: true })
})

// Daily funnel counters — aggregate counts only (ev:<day>:<event>), no user
// identifiers. The client sends each event at most once per browser per day.
const FUNNEL_EVENTS = new Set(['builder-start', 'export', 'ai-use', 'return'])
app.post('/api/ev', async (c) => {
  if (isQaRequest(c.req.raw)) return c.json({ ok: true })
  const { e } = await c.req.json<{ e?: string }>().catch(() => ({ e: undefined }))
  if (typeof e !== 'string' || !FUNNEL_EVENTS.has(e)) {
    return c.json({ error: 'bad event' }, 400)
  }
  const day = new Date().toISOString().slice(0, 10)
  const key = `ev:${day}:${e}`
  const current = Number((await c.env.KV.get(key)) ?? '0')
  await c.env.KV.put(key, String(current + 1), { expirationTtl: 60 * 60 * 24 * 400 })
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
  // Three layers: narrow per-client quota, wide per-IP backstop (shared
  // exits must not lock each other out), and a global daily breaker.
  const day = new Date().toISOString().slice(0, 10)
  const ttl = { expirationTtl: 60 * 60 * 24 * 2 }
  const clientId = c.req.header('x-client-id')?.trim()
  const gates: { key: string; limit: number }[] = [
    { key: `rl:leads-global:${day}`, limit: LEADS_GLOBAL_DAILY_LIMIT },
  ]
  if (clientId && clientId.length >= 8 && clientId.length <= 128) {
    gates.push({ key: `rl:leads-client:${day}:${clientId}`, limit: LEADS_CLIENT_DAILY_LIMIT })
  }
  const ip = c.req.header('cf-connecting-ip')
  if (ip) {
    // No client id (scripted callers) → the IP gate tightens to the narrow limit
    const ipLimit = clientId ? LEADS_IP_DAILY_LIMIT : LEADS_CLIENT_DAILY_LIMIT
    gates.push({ key: `rl:leads:${day}:${ip}`, limit: ipLimit })
  }
  const counts = await Promise.all(gates.map((g) => c.env.KV.get(g.key)))
  for (let i = 0; i < gates.length; i++) {
    if (Number(counts[i] ?? '0') >= gates[i].limit) {
      return c.json(
        { error: 'Too many submissions today — please try again tomorrow.' },
        429
      )
    }
  }
  await Promise.all(
    gates.map((g, i) => c.env.KV.put(g.key, String(Number(counts[i] ?? '0') + 1), ttl))
  )
  const record = {
    email: addr,
    plan: typeof plan === 'string' ? plan.slice(0, 32) : '',
    createdAt: new Date().toISOString(),
  }
  await c.env.KV.put(`lead:${Date.now()}`, JSON.stringify(record))
  return c.json({ ok: true })
})

// Shareable read-only resume links: capability URLs backed by KV. The id is
// the read capability, the token (returned once, never stored raw) is the
// revoke capability. Snapshots expire unless re-shared.
const SHARE_MAX_BODY_BYTES = 120_000
const SHARE_TTL_SECONDS = 60 * 60 * 24 * 180
const SHARE_CLIENT_DAILY_LIMIT = 20
const SHARE_ID_RE = /^[A-Za-z0-9_-]{10,64}$/
/** User-chosen memorable slugs: lowercase, 3-40 chars, no edge hyphens */
const SHARE_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/
const validShareId = (id: string) => SHARE_ID_RE.test(id) || SHARE_SLUG_RE.test(id)

const randomB64url = (bytes: number) =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const sha256Hex = async (s: string) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

interface ShareRecord {
  resume?: unknown
  tokenHash?: string
  createdAt?: number
}

const parseShareRecord = (raw: string): ShareRecord | null => {
  try {
    const v = JSON.parse(raw) as unknown
    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as ShareRecord) : null
  } catch {
    return null
  }
}

app.post('/api/share', async (c) => {
  const length = Number(c.req.header('content-length') ?? '0')
  if (length > SHARE_MAX_BODY_BYTES) {
    return c.json({ error: 'This resume is too large to share.' }, 413)
  }
  const fp = c.req.header('x-client-id')?.trim()
  if (!fp || fp.length < 8 || fp.length > 128) {
    return c.json({ error: 'Sharing is unavailable — please reload and retry.' }, 400)
  }
  const day = new Date().toISOString().slice(0, 10)
  const rlKey = `rl:share:${day}:${fp}`
  const used = Number((await c.env.KV.get(rlKey)) ?? '0')
  if (used >= SHARE_CLIENT_DAILY_LIMIT) {
    return c.json({ error: 'Daily share limit reached — please try again tomorrow.' }, 429)
  }
  // content-length can be absent (chunked bodies), so enforce the cap on the
  // actual bytes too before parsing.
  const text = await c.req.text().catch(() => '')
  if (new TextEncoder().encode(text).length > SHARE_MAX_BODY_BYTES) {
    return c.json({ error: 'This resume is too large to share.' }, 413)
  }
  let body: { resume?: unknown; id?: string; token?: string; slug?: string } | null
  try {
    body = JSON.parse(text) as { resume?: unknown; id?: string; token?: string; slug?: string }
  } catch {
    body = null
  }
  const resume = body?.resume
  if (typeof resume !== 'object' || resume === null || Array.isArray(resume)) {
    return c.json({ error: 'Invalid resume payload.' }, 400)
  }
  // Re-publish keeps the recipient's URL stable: with a valid id+token pair
  // the existing snapshot is overwritten (and its TTL refreshed) in place.
  let id = ''
  let token = ''
  if (
    typeof body?.id === 'string' &&
    typeof body?.token === 'string' &&
    validShareId(body.id)
  ) {
    const existing = await c.env.KV.get(`share:${body.id}`)
    if (existing) {
      const rec = parseShareRecord(existing)
      if (rec && rec.tokenHash === (await sha256Hex(body.token))) {
        id = body.id
        token = body.token
      }
    }
  }
  if (!id && typeof body?.slug === 'string' && body.slug.trim()) {
    const slug = body.slug.trim().toLowerCase()
    if (!SHARE_SLUG_RE.test(slug) || slug.length < 3) {
      return c.json(
        { error: 'Custom links use 3–40 lowercase letters, numbers and hyphens.' },
        400
      )
    }
    const existing = await c.env.KV.get(`share:${slug}`)
    if (existing) {
      return c.json({ error: 'That custom link is already taken — try another.' }, 409)
    }
    id = slug
    token = randomB64url(16)
  }
  if (!id) {
    id = randomB64url(16)
    token = randomB64url(16)
  }
  await c.env.KV.put(
    `share:${id}`,
    JSON.stringify({ resume, tokenHash: await sha256Hex(token), createdAt: Date.now() }),
    { expirationTtl: SHARE_TTL_SECONDS }
  )
  await c.env.KV.put(rlKey, String(used + 1), { expirationTtl: 60 * 60 * 24 * 2 })
  return c.json({ id, token, url: `https://cv.zalize.com/s/${id}` })
})

app.get('/api/share/:id', async (c) => {
  const id = c.req.param('id')
  if (!validShareId(id)) return c.json({ error: 'Not Found' }, 404)
  const raw = await c.env.KV.get(`share:${id}`)
  if (!raw) return c.json({ error: 'Not Found' }, 404)
  const rec = parseShareRecord(raw)
  if (!rec) return c.json({ error: 'Not Found' }, 404)
  c.header('Cache-Control', 'no-store')
  return c.json({ resume: rec.resume, createdAt: rec.createdAt ?? 0 })
})

app.delete('/api/share/:id', async (c) => {
  const id = c.req.param('id')
  const token = c.req.header('x-share-token')?.trim() ?? ''
  if (!validShareId(id) || !token) return c.json({ error: 'Not Found' }, 404)
  const raw = await c.env.KV.get(`share:${id}`)
  if (!raw) return c.json({ ok: true })
  const rec = parseShareRecord(raw)
  if (!rec) {
    // Corrupt record: unreadable by GET anyway, so allow cleanup.
    await c.env.KV.delete(`share:${id}`)
    return c.json({ ok: true })
  }
  if (rec.tokenHash !== (await sha256Hex(token))) {
    return c.json({ error: 'Not authorized.' }, 403)
  }
  await c.env.KV.delete(`share:${id}`)
  return c.json({ ok: true })
})

interface OrderRecord {
  transactionId: string
  licenseKey?: string
  plan?: 'resume' | 'bundle'
  claimedAt?: number
}

// After checkout the frontend claims a license with the order id.
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

  const txKvKey = lsOrderKvKey(txId)
  let txRecord: OrderRecord | null = null
  const storedTx = await c.env.KV.get(txKvKey)
  if (storedTx) {
    try {
      txRecord = JSON.parse(storedTx) as OrderRecord
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

  // Determine the plan: webhook record first, else verify via the LS API
  let plan = txRecord?.plan ?? null
  if (!plan) {
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
      return c.json({ error: 'No RezUp product found in this order.' }, 404)
    }
  }

  const licenseKey = generateLicenseKey()
  const record = newLicenseRecord(licenseKey, plan, {
    orderId: txId,
    activatedAt: Date.now(),
  })
  await c.env.KV.put(licenseKvKey(licenseKey), JSON.stringify(record))
  const claimed: OrderRecord = {
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

// --- Zalize unified account (optional; guests are unaffected) ---
// The `.zalize.com` central-session cookie reaches cv.zalize.com, so the
// Worker forwards it server-side; the central token never reaches the client.
const ZA_ACCOUNT_ORIGIN = 'https://account.zalize.com'
const ZA_RESUME_ORIGIN = 'https://resume.zalize.com'

async function zaEmail(cookie: string | undefined): Promise<string | null> {
  if (!cookie || !cookie.includes('better-auth.session_token')) return null
  try {
    const r = await fetch(`${ZA_ACCOUNT_ORIGIN}/api/auth/get-session`, {
      headers: { cookie },
    })
    if (!r.ok) return null
    const data = (await r.json()) as { user?: { email?: string } } | null
    const email = (data?.user?.email ?? '').trim().toLowerCase()
    return email || null
  } catch {
    return null
  }
}

// Signed-out is an expected state, not an error: return 200 with a null email
// so the browser console stays clean on every page load.
app.get('/api/za/session', async (c) => {
  c.header('Cache-Control', 'no-store')
  const email = await zaEmail(c.req.header('cookie'))
  return c.json({ email: email ?? null })
})

// Proxy the Resume Center primary-resume export (ResumeProfile v1) for the
// signed-in central account, so the Builder can offer one-click import.
app.get('/api/za/primary', async (c) => {
  c.header('Cache-Control', 'no-store')
  const cookie = c.req.header('cookie') ?? ''
  if (!cookie.includes('better-auth.session_token')) {
    return c.json({ error: 'Not signed in to Zalize account' }, 401)
  }
  let r: Response
  try {
    r = await fetch(`${ZA_RESUME_ORIGIN}/api/export/primary`, {
      headers: { cookie },
    })
  } catch {
    return c.json({ error: 'Resume Center is unavailable, try again later' }, 502)
  }
  if (r.status === 401) return c.json({ error: 'Not signed in to Zalize account' }, 401)
  if (r.status === 404) return c.json({ error: 'No resume in Resume Center yet' }, 404)
  if (!r.ok) return c.json({ error: 'Resume Center is unavailable, try again later' }, 502)
  const profile = (await r.json()) as Record<string, unknown>
  return c.json(profile)
})

// Current unlock status for the stored token (checked at app start)
app.get('/api/license/status', async (c) => {
  const ent = await entitlementFromRequest(c)
  if (!ent) return c.json({ plan: null })
  return c.json({ plan: ent.plan, expiresAt: ent.exp })
})

// Client-side routes rendered by the SPA shell; anything else missing from
// static assets is a real 404 (avoids soft-404s for arbitrary URLs).
const SPA_ROUTES = new Set(['/', '/builder', '/ats-checker', '/dashboard', '/jobs'])

app.notFound(async (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'Not Found' }, 404)
  }
  const res = await c.env.ASSETS.fetch(c.req.raw)
  if (res.status !== 404) return res
  const path = c.req.path.length > 1 ? c.req.path.replace(/\/+$/, '') : c.req.path
  // spa.html is the empty shell (index.html carries the prerendered landing)
  let shell = await c.env.ASSETS.fetch(new Request(new URL('/spa.html', c.req.url)))
  if (shell.status !== 200) shell = await c.env.ASSETS.fetch(new Request(new URL('/', c.req.url)))
  // Shared-resume pages resolve to the SPA shell too, but must never be indexed
  const isShare = path.startsWith('/s/') && validShareId(path.slice(3))
  const headers: Record<string, string> = { 'content-type': 'text/html; charset=utf-8' }
  if (path.startsWith('/s/')) {
    headers['X-Robots-Tag'] = 'noindex'
    headers['Cache-Control'] = 'no-store'
  }
  return new Response(shell.body, {
    status: SPA_ROUTES.has(path) || isShare ? 200 : 404,
    headers,
  })
})

// Weekly IndexNow full push (same pattern as Shelfmark's runIndexNow cron):
// read our own sitemap and submit every URL. Incremental pushes still happen
// at deploy time via scripts/indexnow.mjs.
const INDEXNOW_KEY = '88d13cb021bb7d759cc09d7b95af03fc'
async function runIndexNow(): Promise<void> {
  const site = 'https://cv.zalize.com'
  const res = await fetch(`${site}/sitemap.xml?v=${Date.now()}`)
  if (!res.ok) return
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  if (urls.length === 0) return
  await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: 'cv.zalize.com',
      key: INDEXNOW_KEY,
      keyLocation: `${site}/${INDEXNOW_KEY}.txt`,
      urlList: urls.slice(0, 8000),
    }),
  })
}

export default {
  fetch: app.fetch,
  scheduled: (_event: ScheduledEvent, _env: Env, ctx: ExecutionContext) =>
    ctx.waitUntil(runIndexNow()),
}
