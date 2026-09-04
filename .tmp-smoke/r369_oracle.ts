// R369 oracle: new saved copies get a unique numbered name on collision.
// Run: npx tsx --tsconfig tsconfig.app.json .tmp-smoke/r369_oracle.ts
import {
  saveResumeVersion,
  createResumeVersion,
  renameResumeVersion,
  emptyResume,
  listResumeVersions,
} from '../src/lib/resume'

const store = new Map<string, string>()
;(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
}

let passed = 0
let failed = 0
function check(label: string, cond: boolean) {
  if (cond) passed++
  else {
    failed++
    console.error(`FAIL: ${label}`)
  }
}

const r = emptyResume()

// 1. First save keeps the name byte-identical.
saveResumeVersion('Untitled copy', r)
check('first name untouched', listResumeVersions()[0].name === 'Untitled copy')

// 2-3. Collisions get (2), (3).
saveResumeVersion('Untitled copy', r)
check('second gets (2)', listResumeVersions()[0].name === 'Untitled copy (2)')
saveResumeVersion('Untitled copy', r)
check('third gets (3)', listResumeVersions()[0].name === 'Untitled copy (3)')

// 4. Name ending in " (2)" that collides continues numbering from its base.
saveResumeVersion('Untitled copy (2)', r)
check('"(2)" collision renumbers', listResumeVersions()[0].name === 'Untitled copy (4)')

// 5. Non-colliding name with parens suffix stays as typed.
saveResumeVersion('Google — SWE II (2)', r)
check('free name as typed', listResumeVersions()[0].name === 'Google — SWE II (2)')

// 6. createResumeVersion applies the same rule (Jobs targeted copies path).
createResumeVersion('PM — Acme', r, 'Job applications')
const v2 = createResumeVersion('PM — Acme', r, 'Job applications')
check('createResumeVersion numbers collision', v2.name === 'PM — Acme (2)')
check('createResumeVersion keeps folder', v2.folder === 'Job applications')

// 7. Gap-fill: delete/rename frees a number for reuse.
const dupId = listResumeVersions().find((v) => v.name === 'Untitled copy (2)')!.id
renameResumeVersion(dupId, 'Kept name')
saveResumeVersion('Untitled copy', r)
check('freed (2) reused', listResumeVersions()[0].name === 'Untitled copy (2)')

// 8. rename itself is untouched: explicit renames may collide.
renameResumeVersion(dupId, 'Untitled copy')
check(
  'rename allows collision',
  listResumeVersions().filter((v) => v.name === 'Untitled copy').length === 2
)

console.log(`r369 oracle: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
