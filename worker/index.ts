import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import { stream, streamSSE } from 'hono/streaming'
import {
  jobRankingHits,
  jobTitleRank,
  matchesJobQuery,
  parseJobQuery,
  type JobQuery,
} from './jobQuery'
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
  /** GLM `thinking.type` ("disabled" | "enabled"); unset = provider default */
  LLM_THINKING?: string
  /** Checkout switch: frontend opens checkout only when "true" */
  CHECKOUT_ENABLED?: string
  /** Launch/traffic mode: downloads free, bundle AI tools share the free quota */
  FREE_MODE?: string
  ASSETS: Fetcher
}

const freeMode = (env: Env) => env.FREE_MODE === 'true'

// KV is shared with the account's other Workers, so its free-plan daily read
// cap can be exhausted by traffic that is not ours ("KV get() limit exceeded
// for the day"), and the binding then throws on every read for the rest of the
// UTC day. Every KV call goes through these wrappers so the failure is one
// typed error: routes that can degrade catch it (quota peek, job cache, share
// shell) and the rest answer an honest 503 from `app.onError` instead of 500.
class KvUnavailableError extends Error {
  constructor(op: 'get' | 'put' | 'delete', key: string, cause: unknown) {
    super(
      `KV ${op} ${key.split(':')[0]}:* failed: ${cause instanceof Error ? cause.message : String(cause)}`
    )
    this.name = 'KvUnavailableError'
  }
}

async function kvGet(env: Env, key: string): Promise<string | null> {
  try {
    return await env.KV.get(key)
  } catch (e) {
    const err = new KvUnavailableError('get', key, e)
    console.error(err.message)
    throw err
  }
}

async function kvPut(
  env: Env,
  key: string,
  value: string,
  options?: KVNamespacePutOptions
): Promise<void> {
  try {
    await env.KV.put(key, value, options)
  } catch (e) {
    const err = new KvUnavailableError('put', key, e)
    console.error(err.message)
    throw err
  }
}

async function kvDelete(env: Env, key: string): Promise<void> {
  try {
    await env.KV.delete(key)
  } catch (e) {
    const err = new KvUnavailableError('delete', key, e)
    console.error(err.message)
    throw err
  }
}

const KV_UNAVAILABLE_MESSAGE =
  'This is temporarily unavailable on our side — please retry in a few minutes.'
const AI_UNAVAILABLE_MESSAGE =
  'Free AI is paused for a few minutes — usage tracking is offline on our side. None of your free uses were spent; please retry shortly.'
const SHARE_UNAVAILABLE_MESSAGE =
  'Loading shared resumes is temporarily unavailable on our side — please retry in a few minutes. This is not a revoked link.'

// Cache API shadow for the job-search caches (feed snapshots, assembled
// payloads): free and uncapped, but per data centre, so KV stays the primary
// global cache and the shadow only answers when KV reads fail — each colo then
// asks the upstream boards once per query per TTL instead of on every request.
const shadowRequest = (key: string) =>
  new Request(`https://kv-shadow.cv.zalize.com/${encodeURIComponent(key)}`, { method: 'GET' })

const shadowStore = () => (typeof caches === 'undefined' ? null : caches.default)

async function readShadowedCache(c: Context<{ Bindings: Env }>, key: string): Promise<string | null> {
  try {
    return await kvGet(c.env, key)
  } catch (e) {
    if (!(e instanceof KvUnavailableError)) throw e
    const hit = await shadowStore()?.match(shadowRequest(key))
    return hit ? hit.text() : null
  }
}

function writeShadowedCache(
  c: Context<{ Bindings: Env }>,
  key: string,
  value: string,
  ttlSeconds: number
): void {
  const shadow = shadowStore()
  c.executionCtx.waitUntil(
    Promise.allSettled([
      kvPut(c.env, key, value, { expirationTtl: ttlSeconds }),
      shadow
        ? shadow.put(
            shadowRequest(key),
            new Response(value, {
              headers: {
                'content-type': 'application/json',
                'Cache-Control': `public, s-maxage=${ttlSeconds}`,
              },
            })
          )
        : Promise.resolve(),
    ])
  )
}

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

/** Set once the relay rejects the `thinking` parameter, so later calls in this
 * isolate skip it instead of paying a 400 round trip each time. */
let thinkingParamRejected = false

/** A failed attempt that already ran this long is not retried: a second full
 * generation would double a wait the user has mostly given up on. */
const LLM_RETRY_BUDGET_MS = 30_000

/** The relay could not be reached at all (fetch threw, or a gateway status came
 * back): recorded in KV so the client can say so before the next click.
 * `status` is the upstream status, or 0 when the fetch itself failed. */
interface LlmOutage {
  since: number
  last: number
  status: number
}
const LLM_DOWN_KEY = 'llm:down'
const LLM_DOWN_TTL_S = 15 * 60
const LLM_DOWN_WRITE_GAP_MS = 30_000
let llmDownWrittenAt = 0
let llmDownSeen = false

const isUnreachableStatus = (status: number) =>
  status === 502 || status === 503 || status === 504 || (status >= 520 && status <= 530)

async function readLlmOutage(env: Env): Promise<LlmOutage | null> {
  try {
    const raw = await kvGet(env, LLM_DOWN_KEY)
    if (!raw) return null
    const rec = JSON.parse(raw) as Partial<LlmOutage>
    if (typeof rec.since !== 'number' || typeof rec.last !== 'number') return null
    return { since: rec.since, last: rec.last, status: typeof rec.status === 'number' ? rec.status : 0 }
  } catch {
    return null
  }
}

/** Record an unreachable relay. KV trouble is swallowed: the reply the user is
 * waiting for must not depend on the bookkeeping (R822). */
async function markLlmOutage(env: Env, status: number): Promise<LlmOutage> {
  const now = Date.now()
  llmDownSeen = true
  const prev = await readLlmOutage(env)
  const rec: LlmOutage = { since: prev?.since ?? now, last: now, status }
  if (now - llmDownWrittenAt >= LLM_DOWN_WRITE_GAP_MS) {
    llmDownWrittenAt = now
    try {
      await kvPut(env, LLM_DOWN_KEY, JSON.stringify(rec), { expirationTtl: LLM_DOWN_TTL_S })
    } catch {
      llmDownWrittenAt = 0
    }
  }
  return rec
}

/** A usable reply ends the outage: the record is removed whichever isolate wrote it. */
async function clearLlmOutage(env: Env): Promise<void> {
  llmDownWrittenAt = 0
  if (!llmDownSeen && !(await readLlmOutage(env))) return
  llmDownSeen = false
  try {
    await kvDelete(env, LLM_DOWN_KEY)
  } catch {
    llmDownSeen = true
  }
}

interface LlmUsage {
  prompt_tokens?: number
  completion_tokens?: number
  completion_tokens_details?: { reasoning_tokens?: number }
}

interface LlmReply {
  model?: string
  finish?: string
  content: string
  reasoningChars: number
  usage?: LlmUsage
  /** Stream ended without `[DONE]` / a finish reason */
  interrupted?: boolean
}

interface LlmStreamChunk {
  model?: string
  choices?: {
    delta?: { content?: string; reasoning_content?: string }
    finish_reason?: string | null
  }[]
  usage?: LlmUsage | null
  error?: { message?: string }
}

/** Assemble an OpenAI-style SSE completion stream into one reply. */
async function readLlmStream(
  body: ReadableStream<Uint8Array>,
  onDelta?: (text: string) => void
): Promise<LlmReply> {
  const reply: LlmReply = { content: '', reasoningChars: 0, interrupted: true }
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const handle = (line: string) => {
    if (!line.startsWith('data:')) return
    const data = line.slice(5).trim()
    if (!data) return
    if (data === '[DONE]') {
      reply.interrupted = false
      return
    }
    let chunk: LlmStreamChunk
    try {
      chunk = JSON.parse(data) as LlmStreamChunk
    } catch {
      return
    }
    if (chunk.error?.message) throw new Error(chunk.error.message)
    if (chunk.model) reply.model = chunk.model
    if (chunk.usage) reply.usage = chunk.usage
    const choice = chunk.choices?.[0]
    if (!choice) return
    if (choice.delta?.content) {
      reply.content += choice.delta.content
      onDelta?.(choice.delta.content)
    }
    if (choice.delta?.reasoning_content) reply.reasoningChars += choice.delta.reasoning_content.length
    if (choice.finish_reason) {
      reply.finish = choice.finish_reason
      reply.interrupted = false
    }
  }
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) handle(line)
  }
  buffer += decoder.decode()
  if (buffer) handle(buffer)
  return reply
}

async function readLlmJson(upstream: Response): Promise<LlmReply> {
  const body = (await upstream.json().catch(() => null)) as {
    model?: string
    choices?: { message?: { content?: string; reasoning_content?: string }; finish_reason?: string }[]
    usage?: LlmUsage
  } | null
  const choice = body?.choices?.[0]
  return {
    model: body?.model,
    finish: choice?.finish_reason,
    content: choice?.message?.content ?? '',
    reasoningChars: choice?.message?.reasoning_content?.length ?? 0,
    usage: body?.usage,
  }
}

/** Live hooks for callers that forward the reply to the browser as it arrives.
 * `reset` fires when a retry starts after an earlier attempt already emitted text;
 * `signal` aborts the upstream generation when the browser has gone away. */
interface LlmLiveHooks {
  delta?: (text: string) => void
  reset?: () => void
  signal?: AbortSignal
}

const LLM_CANCELLED = { error: 'Cancelled.', status: 499 }


async function callLlm(
  env: Env,
  messages: { role: string; content: string }[],
  temperature = 0.5,
  maxTokens = 1200,
  live?: LlmLiveHooks
): Promise<{ text?: string; error?: string; status?: number; aiUnavailable?: LlmOutage }> {
  let baseUrl = env.LLM_RELAY_BASE_URL?.replace(/\/+$/, '')
  if (baseUrl && !/\/v\d+$/.test(baseUrl)) baseUrl = `${baseUrl}/v1`
  const apiKey = env.LLM_RELAY_API_KEY
  const model = env.LLM_MODEL || 'gpt-4o-mini'
  if (!baseUrl || !apiKey) {
    return { error: 'The AI service is not configured yet. Please try again later.', status: 503 }
  }
  // One automatic retry on transient upstream failures (429/5xx/network/cut
  // stream) that fail fast. The reply is requested as a stream so response
  // headers arrive with the first token instead of after the whole
  // generation — a 100 s header timeout on the path cannot end a long
  // completion.
  const startedAt = Date.now()
  const thinkingType = env.LLM_THINKING?.trim()
  let withThinking = Boolean(thinkingType) && !thinkingParamRejected
  let attempts = 2
  let backoff = false
  let emitted = false
  let failure = {
    error: 'Could not reach the AI service — please retry in a minute. None of your free AI uses were spent.',
    status: 502,
  }
  /** Upstream status of the last unreachable attempt (0 = fetch threw); -1 when the last failure was something else. */
  let unreachable = 0
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (live?.signal?.aborted) return LLM_CANCELLED
    if (backoff) await new Promise((r) => setTimeout(r, 1000))
    backoff = true
    if (live?.signal?.aborted) return LLM_CANCELLED
    const attemptStartedAt = Date.now()
    if (emitted) {
      live?.reset?.()
      emitted = false
    }
    const elapsed = () => Date.now() - attemptStartedAt
    let upstream: Response
    try {
      upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
          ...(withThinking ? { thinking: { type: thinkingType } } : {}),
        }),
        signal: live?.signal,
      })
    } catch {
      if (live?.signal?.aborted) return LLM_CANCELLED
      unreachable = 0
      if (elapsed() >= LLM_RETRY_BUDGET_MS) break
      continue
    }
    const firstByteMs = elapsed()
    if (withThinking && upstream.status === 400) {
      // Relay does not know the GLM `thinking` parameter — fall back to the default mode.
      thinkingParamRejected = true
      withThinking = false
      attempts++
      backoff = false
      console.error('LLM upstream rejected thinking param', (await upstream.text().catch(() => '')).slice(0, 300))
      continue
    }
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      console.error('LLM upstream error', upstream.status, `${elapsed()}ms`, detail.slice(0, 500))
      unreachable = isUnreachableStatus(upstream.status) ? upstream.status : -1
      failure = {
        error:
          unreachable >= 0
            ? `The AI service can't be reached right now (${upstream.status}). None of your free AI uses were spent.`
            : `The AI service is temporarily unavailable (${upstream.status}) — please retry in a minute. None of your free AI uses were spent.`,
        status: 502,
      }
      const retryable = upstream.status === 429 || upstream.status >= 500
      if (!retryable || elapsed() >= LLM_RETRY_BUDGET_MS) break
      continue
    }
    const streamed =
      (upstream.headers.get('content-type') ?? '').includes('text/event-stream') && upstream.body !== null
    let reply: LlmReply
    try {
      reply = streamed
        ? await readLlmStream(upstream.body as ReadableStream<Uint8Array>, (text) => {
            emitted = true
            live?.delta?.(text)
          })
        : await readLlmJson(upstream)
    } catch (err) {
      reply = {
        content: '',
        reasoningChars: 0,
        interrupted: true,
        finish: live?.signal?.aborted
          ? 'cancelled'
          : err instanceof Error
            ? err.message.slice(0, 120)
            : String(err),
      }
    }
    // Upstream timing + token usage, so `wrangler tail` can attribute latency
    // (queue wait vs generation vs hidden reasoning tokens) per endpoint.
    console.log(
      'LLM upstream',
      JSON.stringify({
        ms: Date.now() - startedAt,
        attemptMs: elapsed(),
        firstByteMs,
        stream: streamed,
        model: reply.model ?? model,
        finish: reply.finish,
        prompt: reply.usage?.prompt_tokens,
        completion: reply.usage?.completion_tokens,
        reasoningTokens: reply.usage?.completion_tokens_details?.reasoning_tokens,
        reasoningChars: reply.reasoningChars || undefined,
        interrupted: reply.interrupted || undefined,
        thinking: withThinking ? thinkingType : 'default',
        maxTokens,
      })
    )
    if (live?.signal?.aborted) return LLM_CANCELLED
    if (reply.interrupted) {
      unreachable = -1
      failure = {
        error: 'The AI service was interrupted — please retry in a minute. None of your free AI uses were spent.',
        status: 502,
      }
      if (elapsed() >= LLM_RETRY_BUDGET_MS) break
      continue
    }
    const text = reply.content.trim()
    if (!text) return { error: 'Empty response from the AI service. Please retry.', status: 502 }
    await clearLlmOutage(env)
    return { text }
  }
  if (unreachable >= 0) return { ...failure, aiUnavailable: await markLlmOutage(env, unreachable) }
  return failure
}

/** Top-level `{…}` objects in a reply that was emitted as JSON Lines or
 * concatenated objects instead of an array. String-aware brace matching, so
 * braces inside text are ignored; an unterminated final object is dropped. */
function scanTopLevelObjects(raw: string): unknown[] {
  const out: unknown[] = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      if (depth > 0) inString = true
      continue
    }
    if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}' && depth > 0) {
      depth--
      if (depth === 0 && start >= 0) {
        try {
          out.push(JSON.parse(raw.slice(start, i + 1)) as unknown)
        } catch {
          /* skip malformed object */
        }
        start = -1
      }
    }
  }
  return out
}

/** Parse a model reply that is supposed to be a JSON array. Tolerates code
 * fences, prose around the array, JSON Lines / concatenated objects instead
 * of an array, and a reply truncated by max_tokens (the complete leading
 * elements are kept). Returns null when nothing usable. */
export function parseJsonArrayLenient(text: string): unknown[] | null {
  const raw = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  const tryParse = (s: string): unknown[] | null => {
    try {
      const v = JSON.parse(s) as unknown
      return Array.isArray(v) ? v : null
    } catch {
      return null
    }
  }
  const direct = tryParse(raw)
  if (direct) return direct
  const objectsOrNull = (): unknown[] | null => {
    const objects = scanTopLevelObjects(raw)
    if (objects.length === 1) {
      // A single wrapper object such as {"suggestions": [...]}: unwrap.
      const values = Object.values(objects[0] as Record<string, unknown>)
      const inner = values.find(Array.isArray)
      if (inner && values.length === 1) return inner as unknown[]
    }
    return objects.length > 0 ? objects : null
  }
  const start = raw.indexOf('[')
  if (start < 0) return objectsOrNull()
  const end = raw.lastIndexOf(']')
  if (end > start) {
    const inner = tryParse(raw.slice(start, end + 1))
    if (inner) return inner
  }
  // Truncated mid-element: keep every complete element before the cut.
  const body = raw.slice(start)
  for (const closer of ['}', '"']) {
    let cut = body.lastIndexOf(closer)
    while (cut > 0) {
      const salvaged = tryParse(body.slice(0, cut + 1).replace(/,\s*$/, '') + ']')
      if (salvaged && salvaged.length > 0) return salvaged
      cut = body.lastIndexOf(closer, cut - 1)
    }
  }
  return objectsOrNull()
}

const AI_TROUBLE_ERROR =
  'The AI service is having trouble right now — please retry in a minute. None of your free AI uses were spent.'

/** callLlm for endpoints that need a JSON array back. When the reply is not
 * a usable array even after lenient parsing, asks the model once more with an
 * explicit format reminder at low temperature before giving up. */
async function callLlmJsonArray(
  env: Env,
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number,
  live?: LlmLiveHooks
): Promise<{ items?: unknown[]; error?: string; status?: number; aiUnavailable?: LlmOutage }> {
  const first = await callLlm(env, messages, temperature, maxTokens, live)
  if (first.error) return { error: first.error, status: first.status, aiUnavailable: first.aiUnavailable }
  const items = parseJsonArrayLenient(first.text ?? '')
  if (items && items.length > 0) return { items }
  console.error('LLM non-JSON output, re-asking', (first.text ?? '').slice(0, 200))
  const second = await callLlm(
    env,
    [
      ...messages,
      { role: 'assistant', content: first.text ?? '' },
      {
        role: 'user',
        content:
          'That reply was not a JSON array. Reply again with ONLY the JSON array described above — no prose, no markdown, no code fence.',
      },
    ],
    Math.min(temperature, 0.2),
    maxTokens,
    live
  )
  if (second.error) return { error: second.error, status: second.status, aiUnavailable: second.aiUnavailable }
  const retried = parseJsonArrayLenient(second.text ?? '')
  if (retried && retried.length > 0) return { items: retried }
  console.error('LLM non-JSON output after re-ask', (second.text ?? '').slice(0, 200))
  return { error: AI_TROUBLE_ERROR, status: 502 }
}

const wantsLiveReply = (c: { req: { header: (name: string) => string | undefined } }) =>
  (c.req.header('accept') ?? '').includes('text/event-stream')

/** Forward the model reply to the browser as SSE while it is generated.
 * `delta` events carry text as it arrives; `reset` means a retry started and
 * the text shown so far must be discarded; `done` carries the authoritative
 * full text plus quota; `error` the message the JSON path would have returned.
 * Quota is consumed only once a usable reply exists, exactly like the JSON path.
 * When the browser disconnects first (dialog closed, Stop pressed) the upstream
 * generation is aborted and nothing is charged. */
function liveAiReply(
  c: Context<{ Bindings: Env }>,
  freeRemaining: number | null,
  run: (live: LlmLiveHooks) => Promise<{ text?: string; error?: string; status?: number; aiUnavailable?: LlmOutage }>
) {
  return streamSSE(c, async (stream) => {
    const gone = new AbortController()
    const startedAt = Date.now()
    const abandon = () => {
      if (gone.signal.aborted) return
      gone.abort()
      console.log('LLM live reply abandoned by client', JSON.stringify({ ms: Date.now() - startedAt }))
    }
    stream.onAbort(abandon)
    c.req.raw.signal.addEventListener('abort', abandon)
    const send = (event: string, data: unknown) =>
      stream.writeSSE({ event, data: JSON.stringify(data) }).catch(() => {})
    const result = await run({
      delta: (text) => void send('delta', text),
      reset: () => void send('reset', null),
      signal: gone.signal,
    })
    if (gone.signal.aborted) return
    if (result.error) {
      await send('error', {
        error: result.error,
        status: result.status ?? 502,
        ...(result.aiUnavailable ? { aiUnavailable: result.aiUnavailable } : {}),
      })
      return
    }
    const remaining = freeRemaining !== null ? await consumeFreeQuota(c) : null
    await send('done', { text: result.text, freeRemaining: remaining })
  })
}

type AiReplyBody = Record<string, unknown> | { error: string; status: number }

const aiFailure = (r: { error?: string; status?: number; aiUnavailable?: LlmOutage }) => ({
  error: r.error ?? AI_TROUBLE_ERROR,
  status: r.status ?? 502,
  ...(r.aiUnavailable ? { aiUnavailable: r.aiUnavailable } : {}),
})

/** Buffered (JSON) AI reply whose headers leave at once and whose body is one
 * JSON document preceded by keep-alive spaces (one per second while the model
 * works). Starting the response early is what lets the runtime notice a browser
 * that has disconnected: over HTTP/3 `Request.signal` does not fire before the
 * first response byte, so an abandoned request would otherwise run to the end
 * and be charged. Failures decided after the headers travel in the body as
 * `{ error, status }`; validation and quota errors keep their real status
 * because routes decide them before entering here. */
function bufferedAiReply(
  c: Context<{ Bindings: Env }>,
  run: (live: LlmLiveHooks) => Promise<AiReplyBody>
) {
  c.header('content-type', 'application/json; charset=utf-8')
  c.header('cache-control', 'no-store')
  return stream(c, async (s) => {
    const gone = new AbortController()
    const startedAt = Date.now()
    const abandon = () => {
      if (gone.signal.aborted) return
      gone.abort()
      console.log('LLM buffered reply abandoned by client', JSON.stringify({ ms: Date.now() - startedAt }))
    }
    s.onAbort(abandon)
    c.req.raw.signal.addEventListener('abort', abandon)
    const keepAlive = setInterval(() => void s.write(' '), 1000)
    let body: AiReplyBody
    try {
      body = await run({ signal: gone.signal })
    } finally {
      clearInterval(keepAlive)
    }
    if (gone.signal.aborted) return
    await s.write(JSON.stringify(body))
  })
}

/** Consume one free-AI-quota unit after a successful call; returns the uses
 * left (0 when exhausted), or null when KV could not record it — the reply the
 * user waited for is still delivered, and the client shows no count. */
async function consumeFreeQuota(c: {
  req: { header: (name: string) => string | undefined }
  env: Env
}): Promise<number | null> {
  const fp = c.req.header('x-client-id')?.trim()
  if (!fp || fp.length < 8 || fp.length > 128) return 0
  const limit = freeMode(c.env) ? FREE_MODE_AI_CALLS : FREE_AI_REWRITES
  const kvKey = quotaKvKey(fp, 'ai')
  try {
    const used = Number((await kvGet(c.env, kvKey)) ?? '0')
    if (used >= limit) return 0
    await kvPut(c.env, kvKey, String(used + 1), { expirationTtl: 60 * 60 * 24 * 30 })
    return limit - used - 1
  } catch (e) {
    if (e instanceof KvUnavailableError) return null
    throw e
  }
}

/** Peek at the remaining free-AI quota without consuming; -1 when exhausted/invalid */
async function peekFreeQuota(c: {
  req: { header: (name: string) => string | undefined }
  env: Env
}): Promise<number> {
  const fp = c.req.header('x-client-id')?.trim()
  if (!fp || fp.length < 8 || fp.length > 128) return -1
  const limit = freeMode(c.env) ? FREE_MODE_AI_CALLS : FREE_AI_REWRITES
  const used = Number((await kvGet(c.env, quotaKvKey(fp, 'ai'))) ?? '0')
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
    // The sha256 hash allows exactly the inline pre-paint theme snippet
    // (see THEME_INLINE in scripts/build-seo.mjs, which verifies the hash).
    "default-src 'self'; script-src 'self' 'sha256-N/UQmAIyFzhi3Hmx8pQOPRHy6bKhEKOZ7DC6QVyuIpc='; style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob: https://remotive.com https://jobicy.com; font-src 'self'; connect-src 'self' https://resume.zalize.com https://resume-forge.wookat520.workers.dev; " +
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

const aiUnavailable = (c: Context<{ Bindings: Env }>) => {
  c.header('Retry-After', '300')
  c.header('Cache-Control', 'no-store')
  return c.json({ error: AI_UNAVAILABLE_MESSAGE, code: 'unavailable' }, 503)
}

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
    // Fail closed: with the counters unreadable the free tier is paused (a
    // licensed request never touches KV here), and the reply says so.
    let used: number
    try {
      used = Number((await kvGet(c.env, key)) ?? '0')
    } catch (e) {
      if (!(e instanceof KvUnavailableError)) throw e
      return aiUnavailable(c)
    }
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
    let globalUsed: number
    try {
      globalUsed = Number((await kvGet(c.env, globalKey)) ?? '0')
    } catch (e) {
      if (!(e instanceof KvUnavailableError)) throw e
      return aiUnavailable(c)
    }
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
    try {
      await kvPut(c.env, key, String(used + 1), { expirationTtl: 60 * 60 * 24 * 2 })
      await kvPut(c.env, globalKey, String(globalUsed + 1), { expirationTtl: 60 * 60 * 24 * 2 })
    } catch (e) {
      if (!(e instanceof KvUnavailableError)) throw e
      return aiUnavailable(c)
    }
  }
  return next()
})

// Remaining free-AI quota for this client (read-only, no consumption).
// `null` means "unknown" to the client (no count shown), so a KV outage
// degrades to the same answer an anonymous request gets.
app.get('/api/ai/quota', async (c) => {
  const fp = c.req.header('x-client-id')?.trim()
  if (!fp || fp.length < 8 || fp.length > 128) return c.json({ freeRemaining: null })
  const limit = freeMode(c.env) ? FREE_MODE_AI_CALLS : FREE_AI_REWRITES
  try {
    const [usedRaw, outage] = await Promise.all([kvGet(c.env, quotaKvKey(fp, 'ai')), readLlmOutage(c.env)])
    const used = Number(usedRaw ?? '0')
    if (outage) c.header('Cache-Control', 'no-store')
    return c.json({
      freeRemaining: Math.max(limit - used, 0),
      ...(outage ? { aiUnavailable: outage } : {}),
    })
  } catch (e) {
    if (!(e instanceof KvUnavailableError)) throw e
    c.header('Cache-Control', 'no-store')
    return c.json({ freeRemaining: null })
  }
})

// Job search: aggregate the keyless public feeds (Remotive, Jobicy, Arbeitnow,
// plus The Muse's on-site postings once the user names a place) behind a KV
// cache so each upstream sees at most one request per query per hour.
// Descriptions are flattened to plain text so the client can feed them
// straight into the JD tailoring flow (and the CSP never has to allow
// third-party origins).
const JOBS_CACHE_TTL = 60 * 60
/** A response missing a feed (upstream timeout / 5xx) is kept only briefly, so the feed is retried soon rather than hidden for an hour. */
const JOBS_DEGRADED_CACHE_TTL = 5 * 60
const JOBS_MAX_QUERY = 80
const JOBS_MAX_LOCATION = 60
const JOBS_MAX_DESCRIPTION = 8_000
const JOBS_MAX_RESULTS = 150
/** Fewer complete title matches than this and the response also offers broader queries (with their own counts). */
const JOBS_BROADEN_BELOW = 3
const JOBS_BROADEN_MAX = 2
/** A broader query is only offered when at least this share of its rows are complete title matches. */
const JOBS_BROADEN_MIN_TITLED_SHARE = 0.05
/** Feeds that ignore the query (Arbeitnow; The Muse per place) are fetched once per this window and shared by every query. */
const JOBS_FEED_FRESH_MS = 15 * 60 * 1000
/** Remotive's public feed is one fixed page (17 rows, `search` / `category` / `limit` ignored) and its terms ask for at most ~4 requests a day. */
const JOBS_REMOTIVE_FRESH_MS = 6 * 60 * 60 * 1000
/** …and the last good copy is kept this long so an upstream 429 / timeout serves it instead of dropping the feed. */
const JOBS_FEED_KEEP_TTL = 24 * 60 * 60

// Cut over-limit descriptions at the last whitespace inside the cap so the
// visible text never ends mid-word; the flag lets the client disclose the cut.
const truncateDescription = (text: string): { description: string; descriptionTruncated: boolean } => {
  if (text.length <= JOBS_MAX_DESCRIPTION) return { description: text, descriptionTruncated: false }
  const head = text.slice(0, JOBS_MAX_DESCRIPTION)
  const lastSpace = head.search(/\s\S*$/)
  return {
    description: (lastSpace > 0 ? head.slice(0, lastSpace) : head).trimEnd(),
    descriptionTruncated: true,
  }
}

const NAMED_ENTITIES: Record<string, string> = {
  mdash: '—', ndash: '–', hellip: '…', bull: '•', middot: '·',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', euro: '€', pound: '£', trade: '™', copy: '©', reg: '®',
}
const decodeHtmlEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&(#39|apos|#x27);/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(x[0-9a-f]{1,6}|\d{1,7});/gi, (m, code: string) => {
      const cp = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : parseInt(code, 10)
      return cp >= 0x20 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff) ? String.fromCodePoint(cp) : m
    })
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/&amp;/g, '&')

// Some feeds (Arbeitnow for ATS-fed postings) ship the body entity-encoded
// (`&lt;div class=&quot;…`) with only a real-markup footer after it; when the
// encoded tags outnumber the real ones the markup is decoded first so the tag
// strip sees it, and the final passes decode the text's own entities (twice:
// Jobicy ships `PKI &amp;amp; SSL`).
const isEntityEncodedMarkup = (s: string) =>
  (s.match(/&lt;\/?[a-z]/gi)?.length ?? 0) > (s.match(/<\/?[a-z]/g)?.length ?? 0)
const htmlToText = (html: string) =>
  decodeHtmlEntities(
    decodeHtmlEntities(
      (isEntityEncodedMarkup(html) ? decodeHtmlEntities(html) : html)
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/h[1-6]>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
    )
  )
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

// Like the query match (worker/jobQuery.ts), the category label match is
// enforced here because the upstream parameter is not always honored.
function matchesCategory(slug: string, label: string): boolean {
  const l = label.trim().toLowerCase()
  if (slug === 'all-others') return !JOBS_KNOWN_LABELS.has(l)
  return JOBS_CATEGORIES[slug].includes(l)
}

// Other feeds label categories their own way ("Software Engineering",
// "Marketing & Sales", tags like "backend"); fold them onto the Remotive-style
// labels the category filter understands. Order matters: first hit wins.
const CATEGORY_HINTS: [RegExp, string][] = [
  [/customer|support|success/, 'customer service'],
  [/devops|sysadmin|sre\b|site reliability|cloud|infrastructure/, 'devops'],
  [/\bqa\b|quality|test/, 'qa'],
  [/data|analytics|machine learning|\bml\b|\bai\b/, 'data analysis'],
  [/software|engineer|developer|programming|frontend|backend|full[- ]?stack|mobile/, 'software development'],
  [/design|ux|ui\b|creative|multimedia/, 'design'],
  [/marketing|seo|growth/, 'marketing'],
  [/sales|business|account exec/, 'sales'],
  [/product/, 'product'],
  [/project|program manag|scrum|agile/, 'project management'],
  [/finance|accounting|legal|compliance/, 'finance'],
  [/\bhr\b|human resources|recruit|talent|people/, 'human resources'],
  [/writ|content|copy|editor|translation/, 'writing'],
]
function canonicalCategory(...labels: string[]): string {
  const joined = labels.join(' ').toLowerCase()
  if (!joined.trim()) return ''
  if (JOBS_KNOWN_LABELS.has(joined.trim())) return joined.trim()
  for (const [re, label] of CATEGORY_HINTS) if (re.test(joined)) return label
  return labels.find(Boolean) ?? ''
}

interface NormalizedJob {
  id: string
  title: string
  company: string
  logo: string
  category: string
  type: string
  location: string
  postedAt: string
  salary: string
  url: string
  tags: string[]
  description: string
  descriptionTruncated: boolean
  /** Feed the row came from (`remotive` | `jobicy` | `arbeitnow` | `themuse`); stamped at assembly */
  source?: string
}

const JOBS_UPSTREAM_TIMEOUT_MS = 8_000
async function fetchJson<T>(url: URL | string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { accept: 'application/json', ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(JOBS_UPSTREAM_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.warn(`jobs feed ${new URL(String(url)).host} -> ${res.status}`)
      return null
    }
    return (await res.json()) as T
  } catch (e) {
    console.warn(`jobs feed ${new URL(String(url)).host} -> ${e instanceof Error ? e.name : 'error'}`)
    return null
  }
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

async function fetchRemotive(): Promise<NormalizedJob[] | null> {
  const data = await fetchJson<{ jobs?: RemotiveJob[] }>(new URL('https://remotive.com/api/remote-jobs'))
  if (!data) return null
  return (data.jobs ?? [])
    .filter((j) => j.id && j.title && j.url)
    .map((j) => ({
      id: String(j.id),
      title: (j.title ?? '').trim(),
      company: (j.company_name ?? '').trim(),
      logo: j.company_logo ?? '',
      category: canonicalCategory(j.category ?? ''),
      type: (j.job_type ?? '').replace(/_/g, ' '),
      location: j.candidate_required_location || 'Remote',
      postedAt: j.publication_date ?? '',
      salary: j.salary ?? '',
      url: j.url ?? '',
      tags: normalizeTags(j.tags),
      ...truncateDescription(htmlToText(j.description ?? '')),
    }))
}

interface JobicyJob {
  id?: number | string
  url?: string
  jobTitle?: string
  companyName?: string
  companyLogo?: string
  jobIndustry?: string[] | string
  jobType?: string[] | string
  jobGeo?: string
  jobLevel?: string
  jobDescription?: string
  jobExcerpt?: string
  pubDate?: string
  salaryMin?: number | string
  salaryMax?: number | string
  salaryCurrency?: string
  salaryPeriod?: string
}

const decodeEntities = (s: string) => htmlToText(s).replace(/\n/g, ' ')

const toIso = (raw: string | undefined): string => {
  if (!raw) return ''
  const t = Date.parse(raw)
  return Number.isNaN(t) ? '' : new Date(t).toISOString()
}

const asList = (v: string[] | string | undefined): string[] =>
  Array.isArray(v) ? v.map(String) : v ? [String(v)] : []

// Jobicy (remote-only, worldwide). `tag` is a free-text match the API does
// honour, so the query goes upstream too; the local token filter still applies.
async function fetchJobicy(q: string): Promise<NormalizedJob[] | null> {
  const url = new URL('https://jobicy.com/api/v2/remote-jobs')
  url.searchParams.set('count', '50')
  if (q) url.searchParams.set('tag', q)
  const data = await fetchJson<{ jobs?: JobicyJob[] }>(url)
  if (!data) return null
  return (data.jobs ?? [])
    .filter((j) => j.id && j.jobTitle && j.url)
    .map((j) => {
      const industry = asList(j.jobIndustry).map(decodeEntities)
      const min = Number(j.salaryMin) || 0
      const max = Number(j.salaryMax) || 0
      const salary =
        min || max
          ? `${j.salaryCurrency ?? ''} ${[min, max]
              .filter(Boolean)
              .map((n) => n.toLocaleString('en-US'))
              .join(' – ')}${j.salaryPeriod ? ` / ${j.salaryPeriod.replace(/ly$/, '')}` : ''}`.trim()
          : ''
      const geo = (j.jobGeo ?? '').replace(/\s+/g, ' ').trim()
      return {
        id: `jobicy-${j.id}`,
        title: decodeEntities(j.jobTitle ?? ''),
        company: decodeEntities(j.companyName ?? ''),
        logo: j.companyLogo ?? '',
        category: canonicalCategory(...industry),
        type: asList(j.jobType).join(', ').toLowerCase().replace(/-/g, ' '),
        location: !geo || /^anywhere$/i.test(geo) ? 'Worldwide' : geo,
        postedAt: toIso(j.pubDate),
        salary,
        url: j.url ?? '',
        tags: normalizeTags([...industry, ...(j.jobLevel ? [j.jobLevel] : [])]),
        ...truncateDescription(htmlToText(j.jobDescription || j.jobExcerpt || '')),
      }
    })
}

interface ArbeitnowJob {
  slug?: string
  company_name?: string
  title?: string
  description?: string
  remote?: boolean
  url?: string
  tags?: string[]
  job_types?: string[]
  location?: string
  created_at?: number
}

// A posting written in German or French cannot be applied to with an English
// resume; the density of those languages' function words in the opening text
// tells them apart without touching English postings from European companies.
const NON_ENGLISH_STOPWORDS_RE =
  /\b(und|wir|sie|mit|für|der|die|das|nicht|eine|einen|bei|auf|dich|deine|unser|unsere|et|nous|vous|les|des|pour|une|dans|avec|notre|votre|sur)\b/gi
const isNonEnglishText = (text: string) =>
  (text.slice(0, 800).match(NON_ENGLISH_STOPWORDS_RE)?.length ?? 0) >= 6

// Every Arbeitnow body ends with the board's own paragraph — `Find <a>Jobs in
// Germany</a> on Arbeitnow` or `Find more <a>English Speaking Jobs in France</a>
// on Arbeitnow` (258 of 500 postings use the second shape).
const ARBEITNOW_FOOTER_RE = /\n*Find (?:[a-z]+ ){0,3}Jobs in [^\n]{1,60} on Arbeitnow\s*$/i

// Arbeitnow (Europe, on-site + remote). Its `search` parameter is ignored
// upstream, so the newest pages are fetched and filtered locally.
async function fetchArbeitnow(allowPartial: boolean): Promise<NormalizedJob[] | null> {
  const pages = await Promise.all(
    [1, 2].map((p) =>
      fetchJson<{ data?: ArbeitnowJob[] }>(`https://www.arbeitnow.com/api/job-board-api?page=${p}`)
    )
  )
  if (allowPartial ? pages.every((p) => !p) : pages.some((p) => !p)) return null
  return pages
    .flatMap((p) => p?.data ?? [])
    .filter((j) => j.slug && j.title && j.url)
    .map((j) => {
      const tags = normalizeTags(j.tags)
      const location = (j.location ?? '').trim()
      const description = htmlToText(j.description ?? '').replace(ARBEITNOW_FOOTER_RE, '')
      return {
        id: `arbeitnow-${j.slug}`,
        title: (j.title ?? '').trim(),
        company: (j.company_name ?? '').trim(),
        logo: '',
        category: canonicalCategory(...tags, j.title ?? ''),
        type: (j.job_types ?? []).join(', ').toLowerCase().replace(/_/g, ' '),
        location: j.remote ? (location ? `Remote · ${location}` : 'Remote') : location || 'Europe',
        postedAt: j.created_at ? toIso(new Date(j.created_at * 1000).toISOString()) : '',
        salary: '',
        url: j.url ?? '',
        tags,
        ...truncateDescription(description),
      }
    })
    .filter((j) => !isNonEnglishText(`${j.title} ${j.description}`))
}

// The Muse (themuse.com/api/public/jobs, keyless, 500 req/h): the only feed
// here with on-site postings, so it is consulted once the user names a place.
// Its `location` filter only understands its own exact labels ("New York, NY",
// "London, United Kingdom") and silently answers anything else with the
// remote-only set, so typed places are mapped onto verified labels and only
// postings that carry the label are kept.
const MUSE_PAGES = 5
const MUSE_MAX_AGE_DAYS = 120
// The Muse lists one employer's postings back to back, so a page of results can
// be a single company; cap each so the location tier stays a mix.
const MUSE_MAX_PER_COMPANY = 8

const MUSE_US: [string, string][] = [
  ['new york', 'New York, NY'],
  ['nyc', 'New York, NY'],
  ['san francisco', 'San Francisco, CA'],
  ['los angeles', 'Los Angeles, CA'],
  ['chicago', 'Chicago, IL'],
  ['boston', 'Boston, MA'],
  ['seattle', 'Seattle, WA'],
  ['austin', 'Austin, TX'],
  ['denver', 'Denver, CO'],
  ['atlanta', 'Atlanta, GA'],
  ['dallas', 'Dallas, TX'],
  ['houston', 'Houston, TX'],
  ['miami', 'Miami, FL'],
  ['washington', 'Washington, DC'],
  ['washington dc', 'Washington, DC'],
  ['dc', 'Washington, DC'],
  ['philadelphia', 'Philadelphia, PA'],
  ['phoenix', 'Phoenix, AZ'],
  ['san diego', 'San Diego, CA'],
  ['minneapolis', 'Minneapolis, MN'],
  ['portland', 'Portland, OR'],
  ['charlotte', 'Charlotte, NC'],
  ['nashville', 'Nashville, TN'],
  ['detroit', 'Detroit, MI'],
  ['salt lake city', 'Salt Lake City, UT'],
  ['pittsburgh', 'Pittsburgh, PA'],
  ['raleigh', 'Raleigh, NC'],
  ['san jose', 'San Jose, CA'],
  ['columbus', 'Columbus, OH'],
  ['indianapolis', 'Indianapolis, IN'],
  ['kansas city', 'Kansas City, MO'],
  ['st. louis', 'St. Louis, MO'],
  ['st louis', 'St. Louis, MO'],
  ['tampa', 'Tampa, FL'],
  ['orlando', 'Orlando, FL'],
  ['las vegas', 'Las Vegas, NV'],
  ['baltimore', 'Baltimore, MD'],
  ['sacramento', 'Sacramento, CA'],
  ['cincinnati', 'Cincinnati, OH'],
  ['cleveland', 'Cleveland, OH'],
  ['milwaukee', 'Milwaukee, WI'],
  ['san antonio', 'San Antonio, TX'],
]
const MUSE_WORLD: [string, string][] = [
  ['london', 'London, United Kingdom'],
  ['manchester', 'Manchester, United Kingdom'],
  ['edinburgh', 'Edinburgh, United Kingdom'],
  ['birmingham', 'Birmingham, United Kingdom'],
  ['bristol', 'Bristol, United Kingdom'],
  ['cambridge', 'Cambridge, United Kingdom'],
  ['leeds', 'Leeds, United Kingdom'],
  ['glasgow', 'Glasgow, United Kingdom'],
  ['paris', 'Paris, France'],
  ['lyon', 'Lyon, France'],
  ['berlin', 'Berlin, Germany'],
  ['munich', 'Munich, Germany'],
  ['münchen', 'Munich, Germany'],
  ['hamburg', 'Hamburg, Germany'],
  ['frankfurt', 'Frankfurt, Germany'],
  ['madrid', 'Madrid, Spain'],
  ['barcelona', 'Barcelona, Spain'],
  ['amsterdam', 'Amsterdam, Netherlands'],
  ['zurich', 'Zurich, Switzerland'],
  ['zürich', 'Zurich, Switzerland'],
  ['geneva', 'Geneva, Switzerland'],
  ['dublin', 'Dublin, Ireland'],
  ['milan', 'Milan, Italy'],
  ['rome', 'Rome, Italy'],
  ['warsaw', 'Warsaw, Poland'],
  ['lisbon', 'Lisbon, Portugal'],
  ['stockholm', 'Stockholm, Sweden'],
  ['vienna', 'Vienna, Austria'],
  ['prague', 'Prague, Czech Republic'],
  ['budapest', 'Budapest, Hungary'],
  ['tel aviv', 'Tel Aviv, Israel'],
  ['dubai', 'Dubai, United Arab Emirates'],
  ['toronto', 'Toronto, Canada'],
  ['vancouver', 'Vancouver, Canada'],
  ['montreal', 'Montreal, Canada'],
  ['mexico city', 'Mexico City, Mexico'],
  ['são paulo', 'São Paulo, Brazil'],
  ['sao paulo', 'São Paulo, Brazil'],
  ['buenos aires', 'Buenos Aires, Argentina'],
  ['sydney', 'Sydney, Australia'],
  ['melbourne', 'Melbourne, Australia'],
  ['tokyo', 'Tokyo, Japan'],
  ['bangalore', 'Bangalore, India'],
  ['bengaluru', 'Bangalore, India'],
  ['mumbai', 'Mumbai, India'],
  ['singapore', 'Singapore'],
  ['hong kong', 'Hong Kong'],
]
const MUSE_LOCATIONS = new Map<string, string>([...MUSE_US, ...MUSE_WORLD])
for (const label of [...MUSE_LOCATIONS.values()]) MUSE_LOCATIONS.set(label.toLowerCase(), label)

/** The Muse label for a typed place ("london", "NYC", "Austin, TX"), or null when it has none. */
function museLocation(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ')
  return MUSE_LOCATIONS.get(key) ?? null
}

// The Muse has no free-text search, only its fixed categories; a category
// filter narrows the sample it hands back so the local token match has
// something to bite on. Verified category names only (unknown ones return 0).
const MUSE_CATEGORIES: Record<string, string[]> = {
  'software-dev': ['Software Engineering', 'Computer and IT'],
  'customer-support': ['Customer Service', 'Account Management'],
  design: ['Design and UX'],
  marketing: ['Advertising and Marketing'],
  'sales-business': ['Sales', 'Business Operations'],
  product: ['Product Management'],
  'project-management': ['Project Management'],
  data: ['Data and Analytics'],
  devops: ['Computer and IT', 'Software Engineering'],
  'finance-legal': ['Accounting and Finance', 'Legal Services'],
  hr: ['Human Resources and Recruitment'],
  qa: ['Software Engineering'],
  writing: ['Writing and Editing', 'Media, PR, and Communications'],
  'all-others': [
    'Healthcare',
    'Retail',
    'Education',
    'Food and Hospitality Services',
    'Administration and Office',
    'Science and Engineering',
    'Transportation and Logistics',
    'Manufacturing and Warehouse',
  ],
}
// Without a category filter, the query itself picks the Muse categories to
// sample ("registered nurse" → Healthcare). Order matters: first hit wins.
const MUSE_QUERY_HINTS: [RegExp, string[]][] = [
  [/nurs|\brn\b|health|medic|clinic|pharma|physician|therap|dental|caregiver|hospital/, ['Healthcare']],
  [/retail|store|cashier|merchandis|barista|shop/, ['Retail', 'Food and Hospitality Services']],
  [/teach|tutor|school|educat|instructor|professor/, ['Education']],
  [/chef|cook|hotel|hospitality|restaurant|server|kitchen/, ['Food and Hospitality Services']],
  [/warehouse|driver|logistic|forklift|delivery|supply chain/, ['Transportation and Logistics', 'Manufacturing and Warehouse']],
  [/receptionist|office manager|administrative|clerk/, ['Administration and Office']],
  [/data|analy/, ['Data and Analytics']],
  [/scien|research|laborator|chemist|biolog|mechanical|electrical|civil/, ['Science and Engineering']],
  [/engineer|developer|software|programm|frontend|backend|devops|\bsre\b|cloud|\bit\b/, ['Software Engineering', 'Computer and IT']],
  [/design|\bux\b|\bui\b/, ['Design and UX']],
  [/market|\bseo\b|growth|brand/, ['Advertising and Marketing']],
  [/sales|account exec|business develop/, ['Sales']],
  [/product/, ['Product Management']],
  [/project|program manag|scrum/, ['Project Management']],
  [/financ|account|legal|lawyer|paralegal|compliance/, ['Accounting and Finance', 'Legal Services']],
  [/\bhr\b|recruit|talent|people/, ['Human Resources and Recruitment']],
  [/writ|content|editor|journal|communications|\bpr\b/, ['Writing and Editing', 'Media, PR, and Communications']],
  [/customer|support/, ['Customer Service']],
]
function museCategories(slug: string, q: string): string[] {
  if (slug) return MUSE_CATEGORIES[slug] ?? []
  const lower = q.toLowerCase()
  for (const [re, cats] of MUSE_QUERY_HINTS) if (re.test(lower)) return cats
  return []
}

interface MuseJob {
  id?: number | string
  name?: string
  contents?: string
  publication_date?: string
  locations?: { name?: string }[]
  categories?: { name?: string }[]
  levels?: { name?: string }[]
  refs?: { landing_page?: string }
  company?: { name?: string }
}
interface MusePage {
  page_count?: number
  results?: MuseJob[]
}

async function fetchMuse(
  label: string,
  categories: string[],
  allowPartial: boolean
): Promise<NormalizedJob[] | null> {
  const pageUrl = (p: number) => {
    const url = new URL('https://www.themuse.com/api/public/jobs')
    url.searchParams.set('page', String(p))
    url.searchParams.set('location', label)
    for (const cat of categories) url.searchParams.append('category', cat)
    return url
  }
  const first = await fetchJson<MusePage>(pageUrl(1))
  if (!first) return null
  const lastPage = Math.min(first.page_count ?? 1, MUSE_PAGES)
  const rest = await Promise.all(
    Array.from({ length: Math.max(lastPage - 1, 0) }, (_, i) => fetchJson<MusePage>(pageUrl(i + 2)))
  )
  if (!allowPartial && rest.some((p) => !p)) return null
  const cutoff = Date.now() - MUSE_MAX_AGE_DAYS * 86_400_000
  const perCompany = new Map<string, number>()
  return [first, ...rest]
    .flatMap((p) => p?.results ?? [])
    .filter(
      (j) =>
        j.id &&
        j.name &&
        j.refs?.landing_page &&
        (j.locations ?? []).some((l) => l.name === label) &&
        Date.parse(j.publication_date ?? '') >= cutoff
    )
    .filter((j) => {
      const key = (j.company?.name ?? '').trim().toLowerCase()
      const n = (perCompany.get(key) ?? 0) + 1
      perCompany.set(key, n)
      return n <= MUSE_MAX_PER_COMPANY
    })
    .map((j) => {
      const cats = (j.categories ?? []).map((c) => c.name ?? '').filter(Boolean)
      // canonicalCategory falls back to its first label, which here would be the title
      const category = canonicalCategory(...cats, j.name ?? '')
      const title = (j.name ?? '').trim()
      const levels = (j.levels ?? []).map((l) => l.name ?? '').filter(Boolean)
      const locations = (j.locations ?? [])
        .map((l) => (l.name === 'Flexible / Remote' ? 'Remote' : (l.name ?? '')))
        .filter(Boolean)
      return {
        id: `muse-${j.id}`,
        title,
        company: (j.company?.name ?? '').trim(),
        logo: '',
        category: category === title ? (cats[0] ?? '') : category,
        type: '',
        location: locations.join(', '),
        postedAt: toIso(j.publication_date),
        salary: '',
        url: j.refs?.landing_page ?? '',
        tags: normalizeTags([...cats, ...levels]),
        ...truncateDescription(htmlToText(j.contents ?? '')),
      }
    })
}

type JobFeeds = [string, NormalizedJob[] | null][]

interface FeedSnapshot {
  at: number
  jobs: NormalizedJob[]
}

// Arbeitnow and Remotive ignore their `search` parameter and The Muse is asked
// per place, so every uncached query used to re-download the same pages — a burst of 12 new
// queries got Arbeitnow's 429 on four of them and the feed silently vanished
// from `sources`. One snapshot per feed (per place) is shared by all queries;
// when the upstream fails, the last good snapshot is served rather than nothing.
// A refresh with a missing page only replaces the snapshot when there is none
// to fall back on (`allowPartial`), so a half feed never overwrites a whole one.
async function sharedFeed(
  c: Context<{ Bindings: Env }>,
  key: string,
  load: (allowPartial: boolean) => Promise<NormalizedJob[] | null>,
  freshMs = JOBS_FEED_FRESH_MS
): Promise<NormalizedJob[] | null> {
  const raw = await readShadowedCache(c, key)
  const snap = raw ? (JSON.parse(raw) as FeedSnapshot) : null
  const age = snap ? Date.now() - snap.at : Infinity
  if (snap && age < freshMs) return snap.jobs
  const fresh = await load(snap === null)
  if (fresh) {
    const next: FeedSnapshot = { at: Date.now(), jobs: fresh }
    writeShadowedCache(c, key, JSON.stringify(next), JOBS_FEED_KEEP_TTL)
    return fresh
  }
  if (snap) {
    console.warn(`jobs feed ${key} -> serving ${Math.round(age / 60_000)} min old snapshot after upstream failure`)
    return snap.jobs
  }
  return null
}

interface JobSearchPayload {
  jobs: NormalizedJob[]
  source: string
  sources: string[]
  query: { terms: string[]; ranking: string[] }
  /** Complete title matches (every role word in the title). */
  titled: number
  /** Broader queries that have more complete title matches than this one, with their real counts. */
  broaden?: { query: string; jobs: number; titled: number }[]
}

const jobsCacheKey = (query: JobQuery, category: string, museLabel: string | null) =>
  `jobs:v18:${query.upstream}|${query.ranking.join(' ')}|${category}|${museLabel ?? ''}`

// Relevance tiers for a query: every token in the title beats some tokens in
// the title, which beats a match found only in the body text.
function assembleJobs(
  query: JobQuery,
  category: string,
  feeds: JobFeeds
): Omit<JobSearchPayload, 'broaden'> {
  const sources = feeds.filter(([, jobs]) => jobs).map(([name]) => name)
  const seen = new Set<string>()
  const byFeed = feeds.map(([name, list]) =>
    (list ?? [])
      .map((j) => ({ ...j, source: name }))
      .filter((j) => !category || matchesCategory(category, j.category))
      .filter((j) =>
        matchesJobQuery(
          query,
          [j.title, j.company, j.category, j.location, ...j.tags, j.description]
            .join('\n')
            .toLowerCase()
        )
      )
      .filter((j) => {
        // The same posting syndicated to several boards: keep the first copy
        const key = `${j.title}|${j.company}`.toLowerCase().replace(/\s+/g, ' ')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => (b.postedAt || '').localeCompare(a.postedAt || ''))
  )
  // Arbeitnow alone publishes a couple of hundred postings a day, so a plain
  // newest-first sort would bury the remote-first feeds: within each relevance
  // tier take the newest posting from each feed in turn; titles carrying more
  // of the ranking words ("senior", "react") form their own band ahead of the
  // rest of the tier across every feed, so one feed's unranked titles cannot
  // interleave above another feed's "Head of …" rows.
  const jobs: NormalizedJob[] = []
  for (const tier of [2, 1, 0]) {
    for (let hits = query.ranking.length; hits >= 0; hits--) {
      const queues = byFeed.map((list) =>
        list.filter(
          (j) => jobTitleRank(query, j.title) === tier && jobRankingHits(query, j.title) === hits
        )
      )
      while (queues.some((qu) => qu.length > 0) && jobs.length < JOBS_MAX_RESULTS) {
        for (const qu of queues) {
          const next = qu.shift()
          if (next && jobs.length < JOBS_MAX_RESULTS) jobs.push(next)
        }
      }
    }
  }
  return {
    jobs,
    source: sources.join('+'),
    sources,
    query: { terms: query.required.map((g) => g[0]), ranking: query.ranking },
    titled: jobs.filter((j) => jobTitleRank(query, j.title) === 2).length,
  }
}

async function fetchJobFeeds(
  c: Context<{ Bindings: Env }>,
  query: JobQuery,
  category: string,
  museLabel: string | null,
  shared?: { remotive: NormalizedJob[] | null; arbeitnow: NormalizedJob[] | null; muse: NormalizedJob[] | null }
): Promise<JobFeeds> {
  const museCats = museLabel ? museCategories(category, query.upstream) : []
  const [remotive, jobicy, arbeitnow, muse] = await Promise.all([
    shared
      ? shared.remotive
      : sharedFeed(c, 'jobs:feed:v3:remotive', fetchRemotive, JOBS_REMOTIVE_FRESH_MS),
    fetchJobicy(query.upstream),
    shared ? shared.arbeitnow : sharedFeed(c, 'jobs:feed:v3:arbeitnow', fetchArbeitnow),
    shared
      ? shared.muse
      : museLabel
        ? sharedFeed(c, `jobs:feed:v3:muse:${museLabel}|${[...museCats].sort().join(',')}`, (partial) =>
            fetchMuse(museLabel, museCats, partial)
          )
        : Promise.resolve(null),
  ])
  return [
    ['remotive', remotive],
    ['jobicy', jobicy],
    ['arbeitnow', arbeitnow],
    ...(museLabel ? ([['themuse', muse]] as JobFeeds) : []),
  ]
}

const cacheJobs = (c: Context<{ Bindings: Env }>, key: string, payload: JobSearchPayload, feedCount: number) =>
  writeShadowedCache(
    c,
    key,
    JSON.stringify(payload),
    payload.sources.length < feedCount ? JOBS_DEGRADED_CACHE_TTL : JOBS_CACHE_TTL
  )

// "Registered Nurse - ICU" is one indirect match on the remote feeds while
// "nurse" is 25; the user cannot know which word to drop, so the response
// names the broader queries that do have complete title matches, each with its
// real counts, and the client offers them — the typed query is never widened
// on its own. Each broader query is a full search (Jobicy re-asked with the
// shorter term; the Remotive / Arbeitnow / Muse pages are shared) and its result
// is cached under its own key, so accepting a suggestion is instant.
async function broaderQueries(
  c: Context<{ Bindings: Env }>,
  query: JobQuery,
  category: string,
  museLabel: string | null,
  feeds: JobFeeds,
  titled: number
): Promise<JobSearchPayload['broaden']> {
  const groups = query.required
  if (titled >= JOBS_BROADEN_BELOW || groups.length < 2 || groups.length > 4) return undefined
  const shared = {
    remotive: feeds.find(([name]) => name === 'remotive')?.[1] ?? null,
    arbeitnow: feeds.find(([name]) => name === 'arbeitnow')?.[1] ?? null,
    muse: feeds.find(([name]) => name === 'themuse')?.[1] ?? null,
  }
  const tried = new Set<string>([query.upstream])
  const run = async (keep: string[][]) => {
    const label = keep.map((g) => g[0]).join(' ')
    const cq = parseJobQuery(label)
    if (cq.required.length === 0 || tried.has(cq.upstream)) return null
    tried.add(cq.upstream)
    const cacheKey = jobsCacheKey(cq, category, museLabel)
    const cached = await readShadowedCache(c, cacheKey)
    const payload: JobSearchPayload = cached
      ? (JSON.parse(cached) as JobSearchPayload)
      : assembleJobs(cq, category, await fetchJobFeeds(c, cq, category, museLabel, shared))
    if (payload.sources.length === 0) return null
    if (!cached) cacheJobs(c, cacheKey, payload, feeds.length)
    return {
      query: label,
      jobs: payload.jobs.length,
      titled: payload.titled,
      // English job titles are head-final ("Technical Writer" is a writer), so
      // a query that keeps the last role word is offered before one that drops it.
      head: keep[keep.length - 1] === groups[groups.length - 1],
    }
  }
  // Worth offering only when it clearly beats the typed query and its own
  // complete title matches are not a rounding error: "icu" alone is 118 rows
  // ("difficult", "curriculum") with 1 titled.
  const better = (xs: ({ query: string; jobs: number; titled: number; head: boolean } | null)[]) =>
    xs
      .filter(
        (x): x is NonNullable<typeof x> =>
          x !== null &&
          x.titled > titled &&
          x.titled >= JOBS_BROADEN_BELOW &&
          x.titled >= x.jobs * JOBS_BROADEN_MIN_TITLED_SHARE
      )
      .sort((a, b) => Number(b.head) - Number(a.head) || b.titled - a.titled || b.jobs - a.jobs)
      .map(({ query, jobs, titled }) => ({ query, jobs, titled }))
  // Drop one role word first; only when no such query qualifies ("registered
  // nurse", "nurse icu", "registered icu" all have 0) fall back to single words.
  let found = better(await Promise.all(groups.map((_, i) => run(groups.filter((__, j) => j !== i)))))
  if (groups.length > 2 && found.length === 0) {
    found = better(await Promise.all(groups.map((g) => run([g]))))
  }
  return found.length > 0 ? found.slice(0, JOBS_BROADEN_MAX) : undefined
}

app.get('/api/jobs/search', async (c) => {
  const q = (c.req.query('q') ?? '').trim().slice(0, JOBS_MAX_QUERY)
  const rawCategory = (c.req.query('category') ?? '').trim()
  const category = rawCategory in JOBS_CATEGORIES ? rawCategory : ''
  const museLabel = museLocation((c.req.query('location') ?? '').slice(0, JOBS_MAX_LOCATION))
  // "Senior Frontend Engineer (React)" must find frontend-engineer jobs: the
  // role words gate, the grade / bracketed words only rank (worker/jobQuery.ts).
  const query = parseJobQuery(q)
  const cacheKey = jobsCacheKey(query, category, museLabel)
  const cached = await readShadowedCache(c, cacheKey)
  if (cached) return c.json(JSON.parse(cached) as Record<string, unknown>)
  const feeds = await fetchJobFeeds(c, query, category, museLabel)
  const assembled = assembleJobs(query, category, feeds)
  if (assembled.sources.length === 0) {
    return c.json({ error: 'Job search is unavailable right now — please retry shortly.' }, 502)
  }
  const broaden = await broaderQueries(c, query, category, museLabel, feeds, assembled.titled)
  const payload: JobSearchPayload = broaden ? { ...assembled, broaden } : assembled
  cacheJobs(c, cacheKey, payload, feeds.length)
  return c.json(payload)
})

app.get('/api/health', async (c) => {
  const configured = Boolean(c.env.LLM_RELAY_BASE_URL && c.env.LLM_RELAY_API_KEY)
  const outage = await readLlmOutage(c.env)
  return c.json({ ok: true, llmConfigured: configured, llmUnreachableSince: outage?.since ?? null })
})

// AI rewrite: polish a summary / bullets / skills, optionally tailored to a JD.
/** Rejected earlier versions the user asked to steer away from. */
const sanitizeAvoid = (avoid: unknown): string[] =>
  (Array.isArray(avoid) ? avoid : [])
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim().slice(0, 400))
    .filter(Boolean)
    .slice(0, 6)

// Free users get FREE_AI_REWRITES per 30 days; any license = unlimited.
app.post('/api/ai/rewrite', async (c) => {
  const body = await c.req
    .json<{
      kind?: string
      text?: string
      role?: string
      jobDescription?: string
      variants?: boolean
      emphasis?: string
      avoid?: string[]
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
  const emphasis =
    body.emphasis === 'key-numbers' && kind === 'bullets' ? ('key-numbers' as const) : undefined
  const avoid = sanitizeAvoid(body.avoid)
  return bufferedAiReply(c, async (live) => {
    const result = await callLlm(
      c.env,
      withOutputLanguage(
        buildRewriteMessages(
          kind,
          text,
          { role: body.role, jobDescription: body.jobDescription },
          wantVariants,
          emphasis,
          avoid
        ),
        body.language
      ),
      0.5,
      wantVariants ? 2000 : 1200,
      live
    )
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    let texts: string[] | undefined
    if (wantVariants && result.text) {
      texts = result.text
        .split(/^\s*===+\s*$/m)
        .map((t) => t.trim())
        .filter(Boolean)
      if (texts.length < 2) texts = undefined
    }
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { text: texts?.[0] ?? result.text, texts, freeRemaining }
  })
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
      avoid?: string[]
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

  return bufferedAiReply(c, async (live) => {
    const result = await callLlmJsonArray(
      c.env,
      withOutputLanguage(
        buildSummaryDraftMessages(
          resumeText,
          body.role ?? '',
          highlights,
          typeof body.jobDescription === 'string' ? body.jobDescription : '',
          sanitizeAvoid(body.avoid)
        ),
        body.language
      ),
      0.5,
      900,
      live
    )
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    const texts = (result.items ?? [])
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim())
      .slice(0, 3)
    if (texts.length === 0) return { error: AI_TROUBLE_ERROR, status: 502 }
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { text: texts[0], texts, freeRemaining }
  })
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

  return bufferedAiReply(c, async (live) => {
    const result = await callLlmJsonArray(
      c.env,
      buildSkillSuggestMessages(skills, role, body.jobDescription ?? '', context, category),
      0.5,
      400,
      live
    )
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    const suggested = (result.items ?? [])
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim())
      .filter((t) => t.length <= 40)
      .slice(0, 12)
    if (suggested.length === 0) return { error: AI_TROUBLE_ERROR, status: 502 }
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { skills: suggested, freeRemaining }
  })
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

  return bufferedAiReply(c, async (live) => {
    const result = await callLlm(
      c.env,
      withOutputLanguage(buildKeywordBulletMessages(keyword, resumeText, jd, body.role ?? ''), body.language),
      0.5,
      400,
      live
    )
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    const text = (result.text ?? '').trim().replace(/^[-•]\s*/, '')
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { text, freeRemaining }
  })
})

// Suggest one new bullet for a specific experience, project or involvement
// entry, grounded in the resume (bracketed placeholders where specifics are
// unknown). Shares the free AI quota.
app.post('/api/ai/suggest-bullet', async (c) => {
  const body = await c.req
    .json<{ role?: string; company?: string; companyInfo?: string; bullets?: string[]; resumeText?: string; variant?: string; language?: string; section?: string; targetRole?: string; jobDescription?: string; draft?: string }>()
    .catch(() => ({}) as Record<string, never>)
  const role = body.role?.trim() ?? ''
  const company = body.company?.trim() ?? ''
  const companyInfo = (body.companyInfo?.trim() ?? '').slice(0, 300)
  const section =
    body.section === 'project' || body.section === 'involvement' ? body.section : undefined
  if (!role && !company) {
    return c.json(
      {
        error:
          section === 'project'
            ? 'Add a project name or organization first — the bullet is drafted for that project.'
            : section === 'involvement'
              ? 'Add a role or organization first — the bullet is drafted for that involvement.'
              : 'Add a job title or company first — the bullet is drafted for that role.',
      },
      400
    )
  }
  if (role.length > 200 || company.length > 200) {
    return c.json({ error: 'That role or company name is too long.' }, 400)
  }
  const bullets = Array.isArray(body.bullets)
    ? body.bullets.filter((b): b is string => typeof b === 'string').slice(0, 12)
    : []
  const resumeText = body.resumeText?.trim() ?? ''
  const variant = body.variant === 'key-numbers' ? 'key-numbers' : undefined
  const targetRole = (body.targetRole?.trim() ?? '').slice(0, 200)
  const jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription : ''
  const draft = (typeof body.draft === 'string' ? body.draft.trim() : '').slice(0, 300)

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

  return bufferedAiReply(c, async (live) => {
    const result = await callLlm(
      c.env,
      withOutputLanguage(
        buildSuggestBulletMessages(role, company, bullets, resumeText, variant, companyInfo, section, targetRole, jobDescription, draft),
        body.language
      ),
      0.6,
      400,
      live
    )
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    const text = (result.text ?? '').trim().replace(/^[-•]\s*/, '')
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { text, freeRemaining }
  })
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

  return bufferedAiReply(c, async (live) => {
    const result = await callLlmJsonArray(
      c.env,
      withOutputLanguage(buildTailorMessages(items, jd, body.role ?? ''), body.language),
      0.4,
      3000,
      live
    )
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    const known = new Set(items.map((i) => i.id))
    const suggestions = (result.items ?? []).filter(
      (s): s is { id: string; text: string } =>
        Boolean(
          s &&
            typeof (s as { id?: unknown }).id === 'string' &&
            typeof (s as { text?: unknown }).text === 'string' &&
            known.has((s as { id: string }).id)
        )
    )
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { suggestions, freeRemaining }
  })
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
    .json<{ resumeText?: string; jobDescription?: string; company?: string; role?: string; addressee?: string; highlights?: string; language?: string; tone?: string }>()
    .catch(() => ({}) as Record<string, never>)
  const resumeText = body.resumeText?.trim()
  const jd = body.jobDescription?.trim()
  if (!resumeText) return c.json({ error: 'Add resume content first.' }, 400)
  if (!jd) return c.json({ error: 'Paste the job description first.' }, 400)
  const messages = withOutputLanguage(
    buildCoverLetterMessages(
      resumeText,
      jd,
      body.company ?? '',
      body.role ?? '',
      body.addressee?.trim() ?? '',
      body.highlights?.trim() ?? '',
      body.tone === 'formal' || body.tone === 'friendly' ? body.tone : undefined
    ),
    body.language
  )
  if (wantsLiveReply(c)) {
    return liveAiReply(c, freeRemaining, (live) => callLlm(c.env, messages, 0.6, 1200, live))
  }
  return bufferedAiReply(c, async (live) => {
    const result = await callLlm(c.env, messages, 0.6, 1200, live)
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { text: result.text, freeRemaining }
  })
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
    .json<{ company?: string; role?: string; lastDay?: string; reason?: string; name?: string; language?: string; tone?: string }>()
    .catch(() => ({}) as Record<string, never>)
  const company = body.company?.trim()
  const role = body.role?.trim()
  if (!company) return c.json({ error: 'Add your company name first.' }, 400)
  if (!role) return c.json({ error: 'Add your current role first.' }, 400)
  return bufferedAiReply(c, async (live) => {
    const result = await callLlm(
      c.env,
      withOutputLanguage(
        buildResignationLetterMessages(
          company,
          role,
          body.lastDay?.trim() ?? '',
          body.reason ?? '',
          body.name?.trim() ?? '',
          body.tone === 'formal' || body.tone === 'friendly' ? body.tone : undefined
        ),
        body.language
      ),
      0.6,
      1200,
      live
    )
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { text: result.text, freeRemaining }
  })
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
  const messages = buildInterviewBriefMessages(resumeText, jd, body.role ?? '')
  if (wantsLiveReply(c)) {
    return liveAiReply(c, freeRemaining, (live) => callLlm(c.env, messages, 0.5, 1200, live))
  }
  return bufferedAiReply(c, async (live) => {
    const result = await callLlm(c.env, messages, 0.5, 1200, live)
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { text: result.text, freeRemaining }
  })
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
  return bufferedAiReply(c, async (live) => {
    const result = await callLlmJsonArray(
      c.env,
      buildInterviewQuestionsMessages(resumeText, jd, body.role ?? ''),
      0.6,
      600,
      live
    )
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    const questions = (result.items ?? [])
      .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
      .map((q) => q.trim().slice(0, 200))
      .slice(0, 5)
    if (questions.length === 0) return { error: AI_TROUBLE_ERROR, status: 502 }
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { questions, freeRemaining }
  })
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
  return bufferedAiReply(c, async (live) => {
    const result = await callLlm(
      c.env,
      buildInterviewFeedbackMessages(
        question,
        answer,
        body.resumeText ?? '',
        body.jobDescription ?? '',
        body.role ?? ''
      ),
      0.5,
      1200,
      live
    )
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    return { text: result.text, freeRemaining }
  })
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
  return bufferedAiReply(c, async (live) => {
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
      1200,
      live
    )
    // Quota is consumed only after a successful call, so failures cost nothing
    if (result.error) return aiFailure(result)
    if (freeRemaining !== null) freeRemaining = await consumeFreeQuota(c)
    const { text, action } = parseAssistantAction(result.text ?? '')
    return { text, action, freeRemaining }
  })
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
    if (await kvGet(c.env, seenKey)) return c.json({ ok: true, duplicate: true })
    await kvPut(c.env, seenKey, '1', { expirationTtl: 60 * 60 * 24 * 7 })
  }

  if (event.meta?.event_name === 'order_created' && event.data?.id) {
    const attrs = event.data.attributes
    const paid = (LS_PAID_STATUSES as readonly string[]).includes(
      attrs?.status ?? ''
    )
    const plan = planFromVariantId(c.env, attrs?.first_order_item?.variant_id)
    if (paid && plan) {
      const kvKey = lsOrderKvKey(event.data.id)
      const existing = await kvGet(c.env, kvKey)
      if (!existing) {
        const record: OrderRecord = { transactionId: event.data.id, plan }
        await kvPut(c.env, kvKey, JSON.stringify(record))
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
  await kvPut(c.env, 
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
  const current = Number((await kvGet(c.env, key)) ?? '0')
  await kvPut(c.env, key, String(current + 1), { expirationTtl: 60 * 60 * 24 * 400 })
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
  const counts = await Promise.all(gates.map((g) => kvGet(c.env, g.key)))
  for (let i = 0; i < gates.length; i++) {
    if (Number(counts[i] ?? '0') >= gates[i].limit) {
      return c.json(
        { error: 'Too many submissions today — please try again tomorrow.' },
        429
      )
    }
  }
  await Promise.all(
    gates.map((g, i) => kvPut(c.env, g.key, String(Number(counts[i] ?? '0') + 1), ttl))
  )
  const record = {
    email: addr,
    plan: typeof plan === 'string' ? plan.slice(0, 32) : '',
    createdAt: new Date().toISOString(),
  }
  await kvPut(c.env, `lead:${Date.now()}`, JSON.stringify(record))
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
  const used = Number((await kvGet(c.env, rlKey)) ?? '0')
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
    const existing = await kvGet(c.env, `share:${body.id}`)
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
    const existing = await kvGet(c.env, `share:${slug}`)
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
  await kvPut(c.env, 
    `share:${id}`,
    JSON.stringify({ resume, tokenHash: await sha256Hex(token), createdAt: Date.now() }),
    { expirationTtl: SHARE_TTL_SECONDS }
  )
  await kvPut(c.env, rlKey, String(used + 1), { expirationTtl: 60 * 60 * 24 * 2 })
  return c.json({ id, token, url: `https://cv.zalize.com/s/${id}` })
})

app.get('/api/share/:id', async (c) => {
  const id = c.req.param('id')
  if (!validShareId(id)) return c.json({ error: 'Not Found' }, 404)
  // A 404 here is what tells the client the link is revoked, so a KV outage
  // must answer 503, never 404 (the recipient would be told the link is gone).
  let raw: string | null
  try {
    raw = await kvGet(c.env, `share:${id}`)
  } catch (e) {
    if (!(e instanceof KvUnavailableError)) throw e
    c.header('Retry-After', '300')
    c.header('Cache-Control', 'no-store')
    return c.json({ error: SHARE_UNAVAILABLE_MESSAGE, code: 'unavailable' }, 503)
  }
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
  const raw = await kvGet(c.env, `share:${id}`)
  if (!raw) return c.json({ ok: true })
  const rec = parseShareRecord(raw)
  if (!rec) {
    // Corrupt record: unreadable by GET anyway, so allow cleanup.
    await kvDelete(c.env, `share:${id}`)
    return c.json({ ok: true })
  }
  if (rec.tokenHash !== (await sha256Hex(token))) {
    return c.json({ error: 'Not authorized.' }, 403)
  }
  await kvDelete(c.env, `share:${id}`)
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
  const storedTx = await kvGet(c.env, txKvKey)
  if (storedTx) {
    try {
      txRecord = JSON.parse(storedTx) as OrderRecord
    } catch {
      txRecord = null
    }
  }

  // Already claimed: return the same license (idempotent, no re-issue)
  if (txRecord?.licenseKey) {
    const stored = await kvGet(c.env, licenseKvKey(txRecord.licenseKey))
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
  await kvPut(c.env, licenseKvKey(licenseKey), JSON.stringify(record))
  const claimed: OrderRecord = {
    transactionId: txId,
    licenseKey,
    plan,
    claimedAt: Date.now(),
  }
  await kvPut(c.env, txKvKey, JSON.stringify(claimed))

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

  const stored = await kvGet(c.env, licenseKvKey(key))
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
    await kvPut(c.env, licenseKvKey(key), JSON.stringify(record))
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
const SPA_ROUTES = new Set([
  '/',
  '/builder',
  '/ats-checker',
  '/dashboard',
  '/documents',
  '/samples',
  '/jobs',
])

// Per-route snippet metadata for the raw shell HTML; copy is identical to
// each page's client-side usePageMeta call.
const SPA_META: Record<string, { title: string; description: string }> = {
  '/builder': {
    title: 'Resume Builder — RezUp',
    description:
      'Build an ATS-friendly resume in your browser: 25 templates, drag-and-drop sections, live ATS match score, free PDF &amp; DOCX download. No account, no subscription.',
  },
  '/ats-checker': {
    title: 'Free ATS Resume Checker — Instant Match Score | RezUp',
    description:
      'Paste your resume and a job description to get an instant ATS match score, missing keywords and format checks. 100% free, no sign-up — runs entirely in your browser.',
  },
  '/dashboard': {
    title: 'My resumes — RezUp',
    description: 'Manage your resume drafts and job-tailored copies. Everything stays in your browser.',
  },
  '/documents': {
    title: 'Career documents — RezUp',
    description:
      'Cover letters, interview prep and resignation letters you saved. Everything stays in your browser.',
  },
  '/samples': {
    title: 'Sample library — RezUp',
    description: 'Start from a proven resume example for your role. Everything stays in your browser.',
  },
  '/jobs': {
    title: 'Job search — RezUp',
    description:
      'Browse remote jobs, track your applications, and target your resume to a posting in one click.',
  },
}

// spa.html carries a Builder modulepreload plus a route→chunk map (injected by
// scripts/prerender.mjs); point the preload at the chunk this route actually
// hydrates, and drop it for routes that hydrate none of the mapped chunks.
function applyRoutePreload(html: string, path: string): string {
  const meta = html.match(/<meta name="route-chunks" content='([^']+)' \/>/)
  if (!meta) return html
  let chunks: Record<string, string>
  try {
    chunks = JSON.parse(meta[1]) as Record<string, string>
  } catch {
    return html
  }
  const fallback = chunks['/builder']
  if (typeof fallback !== 'string') return html
  const chunk = chunks[path.startsWith('/s/') ? '/s/' : path]
  const preload = new RegExp(
    `[^\\S\\n]*<link rel="modulepreload" href="/assets/${fallback.replace(/[.[\]$()*+?^{|}\\]/g, '\\$&')}" \\/>\\n?`
  )
  const out =
    typeof chunk === 'string'
      ? html.replace(preload, (tag) => tag.replace(/href="[^"]+"/, `href="/assets/${chunk}"`))
      : html.replace(preload, '')
  // These routes fetch the example library on mount; preloading it from the HTML
  // takes the 16KB JSON off the JS-execution critical chain. crossorigin matches
  // window.fetch() (mode cors, same-origin credentials) so the preload is reused.
  const withExamples = EXAMPLES_PRELOAD_ROUTES.has(path)
    ? out.replace(
        '</head>',
        '    <link rel="preload" href="/examples/examples.json" as="fetch" crossorigin="anonymous" />\n  </head>'
      )
    : out
  return applyRouteHeader(withExamples, path)
}

// Swap the skeleton's generic heading bar for the route's real h1 + subtitle
// (map injected by scripts/prerender.mjs) so the LCP text paints from the raw
// HTML instead of waiting for hydration. Unknown routes keep the gray bar.
function applyRouteHeader(html: string, path: string): string {
  const meta = html.match(/<meta name="route-headers" content='([^']+)' \/>/)
  if (!meta) return html
  let headers: Record<string, { h1: string; sub: string }>
  try {
    headers = JSON.parse(meta[1].replaceAll('&lt;', '<').replaceAll('&#39;', "'")) as Record<
      string,
      { h1: string; sub: string }
    >
  } catch {
    return html
  }
  const header = headers[path]
  if (!header || typeof header.h1 !== 'string' || typeof header.sub !== 'string') return html
  const block =
    `<div style="margin-bottom:1.5rem"><h1 style="font-size:1.5rem;line-height:2rem;font-weight:700;margin:0">${header.h1}</h1>` +
    `<p style="margin:.25rem 0 0;font-size:.875rem;line-height:1.25rem;color:var(--muted-foreground,#64748b)">${header.sub}</p></div>`
  return html.replace(
    /<!--hcv-route-header--><div class="hcv-sk" style="height:2\.25rem;width:10rem;border-radius:\.375rem;margin-bottom:1\.5rem"><\/div>/,
    block
  )
}

const EXAMPLES_PRELOAD_ROUTES = new Set(['/builder', '/dashboard', '/documents', '/samples'])

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
  // Revoked/expired/unknown share links get an honest 404 status; the SPA
  // shell still renders the branded "no longer available" card either way.
  // When KV cannot be read the link's state is unknown: serve the shell with
  // 200 and the generic share meta, and let the client's /api/share call
  // (which answers 503 then) show the retry card instead of "gone".
  let shareRaw: string | null = null
  let shareUnknown = false
  if (isShare) {
    try {
      shareRaw = await kvGet(c.env, `share:${path.slice(3)}`)
    } catch (e) {
      if (!(e instanceof KvUnavailableError)) throw e
      shareUnknown = true
    }
  }
  const shareLive = shareRaw !== null
  const headers: Record<string, string> = { 'content-type': 'text/html; charset=utf-8' }
  if (path.startsWith('/s/')) {
    headers['X-Robots-Tag'] = 'noindex'
    headers['Cache-Control'] = 'no-store'
  } else if (!SPA_ROUTES.has(path)) {
    headers['X-Robots-Tag'] = 'noindex'
  }
  // The shell inherits the homepage canonical/og:url and title/description;
  // point them at the route being served so the raw HTML doesn't declare
  // every SPA route a duplicate of the homepage.
  let body: BodyInit | null = shell.body
  if (shareRaw !== null) {
    // Live share links get unfurled in chat apps; show the candidate, not
    // the homepage marketing copy. The snapshot was already fetched above.
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const rec = parseShareRecord(shareRaw)
    const contact =
      rec && typeof rec.resume === 'object' && rec.resume !== null
        ? ((rec.resume as { contact?: { fullName?: unknown; title?: unknown } }).contact ?? {})
        : {}
    const fullName = typeof contact.fullName === 'string' ? contact.fullName.trim().slice(0, 120) : ''
    const role = typeof contact.title === 'string' ? contact.title.trim().slice(0, 120) : ''
    const heading = fullName ? (role ? `${fullName} — ${role}` : fullName) : 'Shared resume'
    const title = esc(`${heading} | RezUp`)
    const description = esc(
      fullName
        ? `${fullName}'s resume, shared with you via RezUp.`
        : 'A resume shared with you via RezUp.'
    )
    const url = `https://cv.zalize.com${path}`
    body = applyRoutePreload(await shell.text(), path)
      .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${description}"`)
      .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`)
      .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`)
      .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
  } else if (SPA_ROUTES.has(path) && path !== '/') {
    const url = `https://cv.zalize.com${path}`
    let html = applyRoutePreload(await shell.text(), path)
      .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
      .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
    const meta = SPA_META[path]
    if (meta) {
      html = html
        .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
        .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${meta.description}"`)
        .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${meta.title}"`)
        .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${meta.description}"`)
    }
    body = html
  } else if (!SPA_ROUTES.has(path)) {
    // Unknown routes hydrate into the NotFound page (dead share links into
    // the gone card); say so in the raw shell instead of serving the
    // homepage marketing copy with a canonical/og:url pointing at '/'.
    const meta = path.startsWith('/s/')
      ? { title: 'Shared resume | RezUp', description: 'A resume shared with you via RezUp.' }
      : {
          title: 'Page not found — RezUp',
          description:
            'That page does not exist. Build an ATS-friendly resume or check your ATS match score for free.',
        }
    body = applyRoutePreload(await shell.text(), path)
      .replace(/[^\S\n]*<link rel="canonical" href="[^"]*" \/>\n?/, '')
      .replace(/[^\S\n]*<meta property="og:url" content="[^"]*" \/>\n?/, '')
      .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
      .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${meta.description}"`)
      .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${meta.title}"`)
      .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${meta.description}"`)
  }
  return new Response(body, {
    status: SPA_ROUTES.has(path) || shareLive || shareUnknown ? 200 : 404,
    headers,
  })
})

// Last resort for anything a route did not degrade itself: a KV outage is an
// honest 503 with a retry hint (Lemon Squeezy retries its webhook on 5xx), and
// every other unhandled error stays a 500 but is JSON on the API so the
// clients' `data.error` paths show a sentence instead of "(500)".
app.onError((err, c) => {
  c.header('Cache-Control', 'no-store')
  if (err instanceof KvUnavailableError) {
    c.header('Retry-After', '300')
    console.error('KV unavailable ->', c.req.method, c.req.path)
    return c.json({ error: KV_UNAVAILABLE_MESSAGE, code: 'unavailable' }, 503)
  }
  console.error('unhandled', c.req.method, c.req.path, err instanceof Error ? err.stack ?? err.message : String(err))
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'Something went wrong on our side — please retry.' }, 500)
  }
  return c.text('Internal Server Error', 500)
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
