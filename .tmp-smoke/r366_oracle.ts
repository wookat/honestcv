/** R366 oracle: per-copy share links — scoped load/create/revoke + legacy migration. */
import { loadShareLink } from '@/lib/share'

const store = new Map<string, string>()
;(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
}

let passed = 0
let failed = 0
function check(name: string, ok: boolean) {
  if (ok) passed++
  else {
    failed++
    console.error(`FAIL: ${name}`)
  }
}

const linkA = { id: 'aaa', token: 'ta', url: 'https://cv.zalize.com/s/aaa', sharedAt: 111 }
const linkB = { id: 'bbb', token: 'tb', url: 'https://cv.zalize.com/s/bbb', sharedAt: 222 }

// empty store: no link for any scope
check('empty store returns null', loadShareLink('v1') === null && loadShareLink('draft') === null)

// scoped isolation via the map
store.set('honestcv.shareLinks', JSON.stringify({ v1: linkA, draft: linkB }))
check('scope v1 gets its own link', loadShareLink('v1')?.id === 'aaa')
check('scope draft gets its own link', loadShareLink('draft')?.id === 'bbb')
check('unknown scope null', loadShareLink('v2') === null)

// legacy migration: attributed to first-reading scope, legacy key removed
store.clear()
store.set('honestcv.shareLink', JSON.stringify(linkA))
check('legacy attributed to first scope', loadShareLink('v9')?.id === 'aaa')
check('legacy key removed', store.get('honestcv.shareLink') === undefined)
check('migrated link persisted under scope', loadShareLink('v9')?.id === 'aaa')
check('other scopes unaffected by migration', loadShareLink('draft') === null)

// legacy does not clobber an existing scoped link
store.clear()
store.set('honestcv.shareLinks', JSON.stringify({ v1: linkB }))
store.set('honestcv.shareLink', JSON.stringify(linkA))
check('existing scoped link wins over legacy', loadShareLink('v1')?.id === 'bbb')
check('legacy key still removed', store.get('honestcv.shareLink') === undefined)

// malformed data is ignored
store.clear()
store.set('honestcv.shareLinks', '{"v1":{"id":1}}')
check('malformed entry dropped', loadShareLink('v1') === null)
store.clear()
store.set('honestcv.shareLink', 'not json')
check('malformed legacy dropped', loadShareLink('v1') === null && store.get('honestcv.shareLink') === undefined)

console.log(`r366 oracle: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
