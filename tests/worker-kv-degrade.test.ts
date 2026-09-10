import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../worker/index'

// The account's KV namespace is shared with other Workers; when its free-plan
// daily read cap is hit the binding throws on every read ("KV get() limit
// exceeded for the day") for the rest of the UTC day. Production answered 500
// on /api/ai/quota, /api/jobs/search, /api/share/:id and /s/:id while
// /api/health stayed 200. These tests drive the Worker with a KV that throws
// and pin the degraded answers.

const KV_ERROR = 'KV get() limit exceeded for the day.'

function brokenKv(): KVNamespace {
  const fail = () => Promise.reject(new Error(KV_ERROR))
  return { get: fail, put: fail, delete: fail, list: fail, getWithMetadata: fail } as unknown as KVNamespace
}

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

const SHELL = '<!doctype html><html><head><title>RezUp</title><meta name="description" content="x"><link rel="canonical" href="https://cv.zalize.com/" /><meta property="og:url" content="https://cv.zalize.com/" /><meta property="og:title" content="RezUp"><meta property="og:description" content="x"></head><body><div id="root"></div></body></html>'

const assets: Fetcher = {
  fetch: (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.pathname === '/spa.html') {
      return Promise.resolve(new Response(SHELL, { headers: { 'content-type': 'text/html' } }))
    }
    return Promise.resolve(new Response('not found', { status: 404 }))
  },
} as unknown as Fetcher

/** Minimal Cache API: the Worker uses `caches.default` for its HTML edge cache and the job-search shadow. */
function memoryCaches() {
  const store = new Map<string, { body: string; headers: [string, string][] }>()
  const cache = {
    match: (req: Request) => {
      const hit = store.get(req.url)
      return Promise.resolve(hit ? new Response(hit.body, { headers: hit.headers }) : undefined)
    },
    put: async (req: Request, res: Response) => {
      store.set(req.url, { body: await res.text(), headers: [...res.headers.entries()] })
    },
  }
  return { default: cache, store }
}

function env(kv: KVNamespace) {
  return {
    KV: kv,
    ASSETS: assets,
    FREE_MODE: 'true',
    LICENSE_SIGNING_SECRET: 'test-secret-test-secret-test-secret',
  }
}

const pending: Promise<unknown>[] = []
const ctx = {
  waitUntil: (p: Promise<unknown>) => {
    pending.push(p)
  },
  passThroughOnException: () => {},
} as unknown as ExecutionContext

const settle = () => Promise.allSettled(pending.splice(0))

const call = (kv: KVNamespace, path: string, init?: RequestInit) =>
  worker.fetch(new Request(`https://cv.zalize.com${path}`, init), env(kv) as never, ctx)

let caches: ReturnType<typeof memoryCaches>

beforeEach(() => {
  caches = memoryCaches()
  vi.stubGlobal('caches', caches)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(async () => {
  await settle()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('KV outage: routes degrade truthfully instead of answering 500', () => {
  it('/api/health is untouched by KV', async () => {
    const res = await call(brokenKv(), '/api/health')
    expect(res.status).toBe(200)
  })

  it('/api/ai/quota answers freeRemaining: null (the client shows no count) rather than 500', async () => {
    const res = await call(brokenKv(), '/api/ai/quota', {
      headers: { 'x-client-id': 'qa-r822-client-0001' },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ freeRemaining: null })
    expect(res.headers.get('Cache-Control')).toBe('no-store')

    const ok = await call(memoryKv(), '/api/ai/quota', {
      headers: { 'x-client-id': 'qa-r822-client-0001' },
    })
    expect(await ok.json()).toEqual({ freeRemaining: 12 })
  })

  it('an unlicensed AI call is paused with 503 + Retry-After and no free use spent, never a 500', async () => {
    const res = await call(brokenKv(), '/api/ai/rewrite', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '203.0.113.7',
        'x-client-id': 'qa-r822-client-0001',
      },
      body: JSON.stringify({ text: 'Led a team of five engineers.' }),
    })
    expect(res.status).toBe(503)
    expect(res.headers.get('Retry-After')).toBe('300')
    const body = (await res.json()) as { error: string; code: string }
    expect(body.code).toBe('unavailable')
    expect(body.error).toMatch(/None of your free uses were spent/)
  })

  it('/api/share/:id answers 503 with a "not a revoked link" message — a 404 would tell the recipient the link is gone', async () => {
    const res = await call(brokenKv(), '/api/share/nonexistent123')
    expect(res.status).toBe(503)
    expect(res.headers.get('Retry-After')).toBe('300')
    const body = (await res.json()) as { error: string; code: string }
    expect(body.code).toBe('unavailable')
    expect(body.error).toMatch(/not a revoked link/)

    const gone = await call(memoryKv(), '/api/share/nonexistent123')
    expect(gone.status).toBe(404)
  })

  it('/s/:id serves the SPA shell with 200 and generic share meta when the link state is unknown', async () => {
    const res = await call(brokenKv(), '/s/nonexistent123')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/html/)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex')
    const html = await res.text()
    expect(html).toContain('<title>Shared resume | RezUp</title>')
    expect(html).toContain('<div id="root"></div>')

    // With KV readable the unknown link keeps its honest 404 shell.
    const gone = await call(memoryKv(), '/s/nonexistent123')
    expect(gone.status).toBe(404)
    expect(await gone.text()).toContain('<title>Shared resume | RezUp</title>')
  })

  it('/api/jobs/search falls back to the Cache API shadow of the last assembled payload', async () => {
    // Warm: KV fine, upstream boards return nothing useful except Jobicy.
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input instanceof Request ? input.url : input)
      if (url.startsWith('https://jobicy.com/')) {
        return Promise.resolve(
          Response.json({
            jobs: [
              {
                id: 1,
                jobTitle: 'Software Engineer',
                companyName: 'Acme',
                url: 'https://jobicy.com/jobs/1',
                jobGeo: 'Anywhere',
                jobIndustry: ['Engineering'],
                jobType: ['full-time'],
                jobDescription: 'Build software as an engineer.',
                pubDate: '2026-09-01 10:00:00',
              },
            ],
          })
        )
      }
      return Promise.resolve(new Response('upstream down', { status: 503 }))
    })
    const kv = memoryKv()
    const warm = await call(kv, '/api/jobs/search?q=engineer')
    expect(warm.status).toBe(200)
    const payload = (await warm.json()) as { jobs: { title: string }[]; sources: string[] }
    expect(payload.jobs.map((j) => j.title)).toEqual(['Software Engineer'])
    await settle()
    const jobsKeys = [...kv.store.keys()].filter((k) => k.startsWith('jobs:v'))
    expect(jobsKeys.length).toBeGreaterThan(0)
    // The same payload was shadowed into the Cache API.
    expect([...caches.store.keys()].some((u) => u.includes(encodeURIComponent(jobsKeys[0])))).toBe(true)

    // Outage: KV throws on every read, upstream is down too — the shadow answers.
    fetchSpy.mockImplementation(() => Promise.resolve(new Response('upstream down', { status: 503 })))
    const degraded = await call(brokenKv(), '/api/jobs/search?q=engineer')
    expect(degraded.status).toBe(200)
    expect(await degraded.json()).toEqual(payload)
  })

  it('/api/jobs/search with no shadow and dead upstreams answers the existing 502 sentence, not a bare 500', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response('upstream down', { status: 503 }))
    )
    const res = await call(brokenKv(), '/api/jobs/search?q=engineer')
    expect(res.status).toBe(502)
    expect(((await res.json()) as { error: string }).error).toMatch(/Job search is unavailable right now/)
  })

  it('any other KV-backed API route answers a 503 JSON sentence via onError (POST /api/share here)', async () => {
    const res = await call(brokenKv(), '/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-client-id': 'qa-r822-client-0001' },
      body: JSON.stringify({ resume: {} }),
    })
    expect(res.status).toBe(503)
    expect(res.headers.get('Retry-After')).toBe('300')
    const body = (await res.json()) as { error: string; code: string }
    expect(body.code).toBe('unavailable')
    expect(body.error).toMatch(/temporarily unavailable on our side/)
    // Security headers still applied to error responses.
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })
})
