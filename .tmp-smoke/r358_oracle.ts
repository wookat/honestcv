// R358 oracle: numbered duplicate names in duplicateResumeVersion
const store = new Map<string, string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage

const { duplicateResumeVersion, listResumeVersions, emptyResume } = await import('@/lib/resume')

function seed(names: string[]) {
  store.set(
    'honestcv.resumeVersions',
    JSON.stringify(
      names.map((name, i) => ({
        id: `v${i}`,
        name,
        data: emptyResume(),
        createdAt: i,
        updatedAt: i,
      }))
    )
  )
}

let pass = 0
let fail = 0
function check(desc: string, ok: boolean) {
  if (ok) pass++
  else {
    fail++
    console.error(`FAIL: ${desc}`)
  }
}

seed(['Product Manager'])
let vs = duplicateResumeVersion('v0')
check('first duplicate is "Product Manager (2)"', vs[0].name === 'Product Manager (2)')

seed(['Product Manager', 'Product Manager (2)'])
vs = duplicateResumeVersion('v1')
check('duplicating "(2)" yields "(3)"', vs[0].name === 'Product Manager (3)')

seed(['Product Manager', 'Product Manager (2)'])
vs = duplicateResumeVersion('v0')
check('duplicating base skips taken "(2)" to "(3)"', vs[0].name === 'Product Manager (3)')

seed(['Product Manager', 'Product Manager (3)'])
vs = duplicateResumeVersion('v0')
check('gap filling picks lowest free "(2)"', vs[0].name === 'Product Manager (2)')

seed(['Product Manager (copy)'])
vs = duplicateResumeVersion('v0')
check('legacy "(copy)" suffix stripped → "(2)"', vs[0].name === 'Product Manager (2)')

seed(['Resume'])
duplicateResumeVersion('v0')
check('duplicate persisted first in list', listResumeVersions()[0].name === 'Resume (2)')

seed(['Resume'])
vs = duplicateResumeVersion('missing')
check('unknown id is a no-op', vs.length === 1 && vs[0].name === 'Resume')

console.log(`r358 oracle: ${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
