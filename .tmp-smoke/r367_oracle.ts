/** R367 oracle: revoke share links when copies are deleted.
 *  Run: npx tsx --tsconfig tsconfig.app.json .tmp-smoke/r367_oracle.ts */

const store = new Map<string, string>()
;(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
}

type FetchCall = { url: string; method?: string; headers?: Record<string, string> }
const calls: FetchCall[] = []
let nextStatus = 200
;(globalThis as { fetch?: unknown }).fetch = async (url: string, init?: RequestInit) => {
  calls.push({ url, method: init?.method, headers: init?.headers as Record<string, string> })
  return { ok: nextStatus < 400, status: nextStatus, json: async () => ({}) } as Response
}

const { hasShareLink, revokeShareLinksFor } = await import('@/lib/share')

let passed = 0
let failed = 0
const check = (name: string, ok: boolean) => {
  if (ok) passed++
  else {
    failed++
    console.error(`FAIL: ${name}`)
  }
}
const links = () => JSON.parse(store.get('honestcv.shareLinks') ?? '{}') as Record<string, unknown>
const seed = () =>
  store.set(
    'honestcv.shareLinks',
    JSON.stringify({
      draft: { id: 'd1', token: 'td', url: 'u/d1', sharedAt: 1 },
      v1: { id: 'a1', token: 'ta', url: 'u/a1', sharedAt: 2 },
      v2: { id: 'b1', token: 'tb', url: 'u/b1', sharedAt: 3 },
    })
  )
const flush = () => new Promise((r) => setTimeout(r, 0))

// hasShareLink peeks without migrating legacy
store.clear()
store.set('honestcv.shareLink', JSON.stringify({ id: 'L', token: 'tL', url: 'u/L' }))
check('hasShareLink false with only legacy key', !hasShareLink('v1'))
check('legacy key untouched by hasShareLink', store.has('honestcv.shareLink'))
check('no scoped map created by hasShareLink', !store.has('honestcv.shareLinks'))

// revoke removes only the deleted scope on success
store.clear()
seed()
calls.length = 0
nextStatus = 200
revokeShareLinksFor(['v1'])
await flush()
check('one DELETE sent', calls.length === 1 && calls[0].method === 'DELETE')
check('DELETE targets the copy id', calls[0].url === '/api/share/a1')
check('DELETE carries stored token', calls[0].headers?.['x-share-token'] === 'ta')
check('v1 entry removed', !('v1' in links()))
check('draft and v2 untouched', 'draft' in links() && 'v2' in links())

// multiple scopes, skipping ones without links
store.clear()
seed()
calls.length = 0
revokeShareLinksFor(['v1', 'v2', 'v-nolink'])
await flush()
check('two DELETEs for two linked scopes', calls.length === 2)
check('no request for unlinked scope', calls.every((c) => c.url !== '/api/share/undefined'))
check('both entries removed, draft kept', !('v1' in links()) && !('v2' in links()) && 'draft' in links())

// failure keeps the record for undo-restored copies
store.clear()
seed()
calls.length = 0
nextStatus = 500
revokeShareLinksFor(['v1'])
await flush()
check('failed revoke keeps the entry', 'v1' in links())

// 404 counts as revoked
store.clear()
seed()
calls.length = 0
nextStatus = 404
revokeShareLinksFor(['v2'])
await flush()
check('404 removes the entry (already gone)', !('v2' in links()))

console.log(`r367 oracle: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
