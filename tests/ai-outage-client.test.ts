import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aiRewrite, fetchAiQuota, subscribeAiOutage, type AiOutage } from '../src/lib/api'

// R828: with the relay down, production /builder enabled every AI button and
// said "12 free uses left"; a click failed after ~2 s into a text-only <p> that
// no screen reader announced. The client now keeps the Worker's outage record
// (quota response / failed AI body) so the Builder can show a notice before the
// first click, and clears it on the first usable reply.

const OUTAGE: AiOutage = { since: 1_757_400_000_000, last: 1_757_400_060_000, status: 530 }

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, ...init })

/** `licenseHeaders()` reads the client id / license from localStorage (absent in the node runner). */
function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => {
      m.delete(k)
    },
    setItem: (k: string, v: string) => {
      m.set(k, String(v))
    },
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('R828: client keeps the Worker record of an unreachable AI relay', () => {
  it('quota carrying aiUnavailable publishes it; a quota without it and a usable AI reply clear it', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const seen: (AiOutage | null)[] = []
    const stop = subscribeAiOutage((o) => seen.push(o))
    expect(seen).toEqual([null])

    fetchMock.mockResolvedValueOnce(json({ freeRemaining: 12, aiUnavailable: OUTAGE }))
    expect(await fetchAiQuota()).toBe(12)
    expect(seen.at(-1)).toEqual(OUTAGE)

    // the same record again is not re-published
    fetchMock.mockResolvedValueOnce(json({ freeRemaining: 12, aiUnavailable: { ...OUTAGE } }))
    await fetchAiQuota()
    expect(seen.length).toBe(2)

    // a usable AI reply means the relay is back
    fetchMock.mockResolvedValueOnce(json({ text: 'Led five engineers.', freeRemaining: 11 }))
    await aiRewrite('bullets', 'Led a team of five engineers.', {})
    expect(seen.at(-1)).toBeNull()
    stop()
  })

  it('a failed AI body with aiUnavailable publishes it alongside the thrown error', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const seen: (AiOutage | null)[] = []
    const stop = subscribeAiOutage((o) => seen.push(o))
    fetchMock.mockResolvedValueOnce(
      json({
        error: "The AI service can't be reached right now (530). None of your free AI uses were spent.",
        status: 502,
        aiUnavailable: OUTAGE,
      })
    )
    await expect(aiRewrite('bullets', 'Led a team of five engineers.', {})).rejects.toThrow(/can't be reached/)
    expect(seen.at(-1)).toEqual(OUTAGE)

    // a model-side failure carries no record and leaves the current one alone
    fetchMock.mockResolvedValueOnce(json({ error: 'The AI service is temporarily unavailable (429) — please retry in a minute.', status: 502 }))
    await expect(aiRewrite('bullets', 'Led a team of five engineers.', {})).rejects.toThrow(/429/)
    expect(seen.at(-1)).toEqual(OUTAGE)
    stop()
  })
})

describe('R828: Builder announces AI failures and shows the outage notice', () => {
  const builderSrc = readFileSync(path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'), 'utf8')

  it('every inline AI error paragraph is a live alert', () => {
    const errorParagraphs = builderSrc.match(/<p[^>]*>\s*\{aiError\}\s*<\/p>/g) ?? []
    expect(errorParagraphs.length).toBeGreaterThanOrEqual(3)
    for (const p of errorParagraphs) expect(p, p).toMatch(/role="alert"/)
    expect(builderSrc).toMatch(/aria-describedby=\{[^}]*aiErrorId\(tag\)/)
  })

  it('the Builder subscribes to the outage record and renders a status notice from it', () => {
    expect(builderSrc).toMatch(/useEffect\(\(\) => subscribeAiOutage\(setAiOutage\), \[\]\)/)
    expect(builderSrc).toMatch(/\{aiOutage && <AiOutageNotice outage=\{aiOutage\} \/>\}/)
    const notice = builderSrc.slice(builderSrc.indexOf('function AiOutageNotice'), builderSrc.indexOf('function RovingChipGroup'))
    expect(notice).toMatch(/role="status"/)
    expect(notice).toMatch(/none of your free AI uses are spent/)
    expect(notice).toMatch(/downloads are unaffected/)
  })
})
