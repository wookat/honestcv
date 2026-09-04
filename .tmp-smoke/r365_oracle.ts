/** R365 oracle: duplicateCareerDoc numbered naming + byte preservation. */
const store = new Map<string, string>()
;(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
}

const { duplicateCareerDoc, listCareerDocs } = await import('../src/lib/documents')
import type { CareerDoc } from '../src/lib/documents'

let passed = 0
let failed = 0
function check(name: string, cond: boolean) {
  if (cond) passed++
  else {
    failed++
    console.error(`FAIL: ${name}`)
  }
}

const seed: CareerDoc[] = [
  { id: 'a', kind: 'cover', title: 'Cover letter — Acme', text: 'Dear Acme', updatedAt: 100, signature: 'data:image/png;base64,SIG' },
  { id: 'b', kind: 'interview', title: 'Interview prep — PM', text: 'Q&A', updatedAt: 200 },
]
store.set('honestcv.careerDocs', JSON.stringify(seed))
const before = store.get('honestcv.careerDocs')!

// 1. duplicate: numbered name, copy at top, fields copied
const docs1 = duplicateCareerDoc('a')
check('copy at top', docs1[0].title === 'Cover letter — Acme (2)')
check('new id', docs1[0].id !== 'a')
check('kind/text/signature copied', docs1[0].kind === 'cover' && docs1[0].text === 'Dear Acme' && docs1[0].signature === 'data:image/png;base64,SIG')
check('updatedAt fresh', docs1[0].updatedAt > 200)
check('source byte-untouched', JSON.stringify(docs1.filter((d) => d.id === 'a' || d.id === 'b')) === JSON.stringify(seed))

// 2. duplicate again: gap to (3)
const docs2 = duplicateCareerDoc('a')
check('next number (3)', docs2[0].title === 'Cover letter — Acme (3)')

// 3. duplicating the "(2)" copy strips the suffix and takes smallest free
const id2 = docs2.find((d) => d.title === 'Cover letter — Acme (2)')!.id
const docs3 = duplicateCareerDoc(id2)
check('strip (n) then smallest free', docs3[0].title === 'Cover letter — Acme (4)')

// 4. legacy "(copy)" suffix normalized
store.set('honestcv.careerDocs', JSON.stringify([{ id: 'c', kind: 'resignation', title: 'Resignation (copy)', text: 'Bye', updatedAt: 1 }]))
check('legacy (copy) normalized', duplicateCareerDoc('c')[0].title === 'Resignation (2)')

// 5. unknown id no-op
store.set('honestcv.careerDocs', before)
const docs5 = duplicateCareerDoc('nope')
check('unknown id no-op', JSON.stringify(docs5) === JSON.stringify(seed) && store.get('honestcv.careerDocs') === before)
check('listCareerDocs unchanged', JSON.stringify(listCareerDocs()) === JSON.stringify(seed))

console.log(`r365 oracle: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
