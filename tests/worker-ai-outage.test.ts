import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../worker/index'

// R828: the relay behind LLM_RELAY_BASE_URL was unreachable for hours (registry
// hold on its domain → NXDOMAIN → the Worker's fetch got a 530). Every AI
// button stayed enabled, /api/ai/quota said "12 free uses left", and each click
// ended after ~2 s in "temporarily unavailable — retry in a minute". These
// tests drive the real Worker against a relay that answers a gateway status and
// pin: the failure names the outage and carries `aiUnavailable`, the record is
// kept in KV so /api/ai/quota and /api/health disclose it before the next
// click, a usable reply clears it, and a model-side failure does not mark it.

function memoryKv(seed: Record<string, string> = {}): KVNamespace & { store: Map<string, string> } {
  const store = new Map(Object.entries(seed))
  return {
    store,
    get: (key: string) => Promise.resolve(store.get(key) ?? null),
    put: (key: string, value: string) => {
      store.set(key, value)
      return Promise.resolve()
    },
    delete: (key: string) => {
      store.delete(key)
      return Promise.resolve()
    },
  } as unknown as KVNamespace & { store: Map<string, string> }
}

function brokenKv(): KVNamespace {
  const fail = () => Promise.reject(new Error('KV get() limit exceeded for the day.'))
  return { get: fail, put: fail, delete: fail, list: fail, getWithMetadata: fail } as unknown as KVNamespace
}

const assets: Fetcher = {
  fetch: () => Promise.resolve(new Response('not found', { status: 404 })),
} as unknown as Fetcher

function env(kv: KVNamespace) {
  return {
    KV: kv,
    ASSETS: assets,
    FREE_MODE: 'true',
    LLM_RELAY_BASE_URL: 'https://relay.example.test',
    LLM_RELAY_API_KEY: 'test-key',
    LLM_MODEL: 'test-model',
  }
}

const ctx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as unknown as ExecutionContext

const HEADERS = {
  'content-type': 'application/json',
  'cf-connecting-ip': '203.0.113.9',
  'x-client-id': 'qa-r828-client-0001',
}

const call = (kv: KVNamespace, path: string, init?: RequestInit) =>
  worker.fetch(new Request(`https://cv.zalize.com${path}`, init), env(kv) as never, ctx)

const rewrite = (kv: KVNamespace) =>
  call(kv, '/api/ai/rewrite', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ kind: 'bullets', text: 'Led a team of five engineers.' }),
  })

/** Buffered AI replies are keep-alive spaces followed by one JSON document. */
const aiBody = async (res: Response) =>
  JSON.parse((await res.text()).trim()) as {
    error?: string
    status?: number
    aiUnavailable?: { since: number; last: number; status: number }
    text?: string
  }

type Relay = (req: Request) => Response | Promise<Response>

/** Route relay calls to `relay`; anything else (there should be nothing else) fails loudly. */
function stubRelay(relay: Relay) {
  const calls: Request[] = []
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(String(input), init)
    if (!req.url.startsWith('https://relay.example.test/')) {
      return Promise.reject(new Error(`unexpected fetch ${req.url}`))
    }
    calls.push(req)
    return Promise.resolve(relay(req))
  })
  return calls
}

const gateway = (status: number) => () => new Response('origin unreachable', { status })

const okReply = () =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: '["Led five engineers to ship the release on time."]' }, finish_reason: 'stop' }],
    }),
    { headers: { 'content-type': 'application/json' } }
  )

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('AI relay unreachable: the Worker records it and says so', () => {
  it('a gateway status from the relay names the outage and carries aiUnavailable; the record lands in KV', async () => {
    const kv = memoryKv()
    const calls = stubRelay(gateway(530))
    const before = Date.now()
    const res = await rewrite(kv)
    expect(res.status).toBe(200)
    const body = await aiBody(res)
    expect(body.status).toBe(502)
    expect(body.error).toMatch(/can't be reached right now \(530\)/)
    expect(body.error).not.toMatch(/retry in a minute/)
    expect(body.error).toMatch(/None of your free AI uses were spent/)
    expect(body.aiUnavailable).toBeDefined()
    expect(body.aiUnavailable?.status).toBe(530)
    expect(body.aiUnavailable?.since).toBeGreaterThanOrEqual(before)
    expect(body.aiUnavailable?.last).toBeGreaterThanOrEqual(body.aiUnavailable?.since ?? 0)
    expect(calls.length).toBeGreaterThanOrEqual(1)

    const stored = JSON.parse(kv.store.get('llm:down') ?? 'null') as { since: number; status: number } | null
    expect(stored?.status).toBe(530)
    expect(stored?.since).toBe(body.aiUnavailable?.since)
    // the free use is not spent
    expect(kv.store.has('quota:ai:qa-r828-client-0001')).toBe(false)
  }, 15_000)

  it('/api/ai/quota and /api/health disclose the recorded outage before the next click', async () => {
    const since = Date.now() - 3 * 60 * 60 * 1000
    const kv = memoryKv({ 'llm:down': JSON.stringify({ since, last: since + 60_000, status: 530 }) })
    stubRelay(gateway(530))

    const quota = await call(kv, '/api/ai/quota', { headers: { 'x-client-id': 'qa-r828-client-0001' } })
    expect(quota.status).toBe(200)
    expect(await quota.json()).toEqual({
      freeRemaining: 12,
      aiUnavailable: { since, last: since + 60_000, status: 530 },
    })
    expect(quota.headers.get('Cache-Control')).toBe('no-store')

    const health = await call(kv, '/api/health')
    expect(health.status).toBe(200)
    expect(await health.json()).toEqual({ ok: true, llmConfigured: true, llmUnreachableSince: since })
  })

  it('a later failure keeps the original `since`; a usable reply clears the record', async () => {
    const since = Date.now() - 10 * 60 * 1000
    const kv = memoryKv({ 'llm:down': JSON.stringify({ since, last: since, status: 530 }) })
    stubRelay(gateway(502))
    const failed = await aiBody(await rewrite(kv))
    expect(failed.aiUnavailable?.since).toBe(since)
    expect(failed.aiUnavailable?.status).toBe(502)
    expect(failed.aiUnavailable?.last).toBeGreaterThan(since)

    vi.unstubAllGlobals()
    stubRelay(okReply)
    const ok = await aiBody(await rewrite(kv))
    expect(ok.error).toBeUndefined()
    expect(kv.store.has('llm:down')).toBe(false)

    const quota = await call(kv, '/api/ai/quota', { headers: { 'x-client-id': 'qa-r828-client-0001' } })
    expect(await quota.json()).toEqual({ freeRemaining: 11 })
    const health = await call(kv, '/api/health')
    expect(await health.json()).toEqual({ ok: true, llmConfigured: true, llmUnreachableSince: null })
  }, 15_000)

  it('a model-side failure (429 / 500) keeps the existing wording and does not mark an outage', async () => {
    const kv = memoryKv()
    stubRelay(gateway(429))
    const limited = await aiBody(await rewrite(kv))
    expect(limited.error).toMatch(/temporarily unavailable \(429\)/)
    expect(limited.aiUnavailable).toBeUndefined()
    expect(kv.store.has('llm:down')).toBe(false)

    vi.unstubAllGlobals()
    stubRelay(gateway(500))
    const model = await aiBody(await rewrite(kv))
    expect(model.error).toMatch(/temporarily unavailable \(500\)/)
    expect(model.aiUnavailable).toBeUndefined()
    expect(kv.store.has('llm:down')).toBe(false)
  }, 15_000)

  it('/api/health stays 200 and the failed reply still arrives when KV itself is unavailable', async () => {
    stubRelay(gateway(530))
    const health = await call(brokenKv(), '/api/health')
    expect(health.status).toBe(200)
    expect(await health.json()).toEqual({ ok: true, llmConfigured: true, llmUnreachableSince: null })
  })
})
