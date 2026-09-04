import { analyzeAnswer, sessionReport } from '@/lib/interviewAnalysis'

let pass = 0
let fail = 0
function check(name: string, ok: boolean) {
  if (ok) pass++
  else {
    fail++
    console.log('FAIL', name)
  }
}

const jd = `Product Manager

We are hiring a Product Manager to own the roadmap. You will use sql daily, define the product roadmap, drive kubernetes adoption, and partner with engineering. Requirements: sql, roadmap, kubernetes, product strategy, stakeholder management. Product product product roadmap sql kubernetes.`

const answer =
  'In my last project I owned the roadmap and used sql to size opportunities, then led the kubernetes migration; as a result adoption grew 40% and stakeholder management improved across teams.'

const withRole = analyzeAnswer(answer, jd, [], 'Product Manager')
const noRole = analyzeAnswer(answer, jd, [])
const all = (a: ReturnType<typeof analyzeAnswer>) => [
  ...(a.keywords?.covered ?? []),
  ...(a.keywords?.missing ?? []),
]

check('role: product excluded', !all(withRole).includes('product'))
check('role: manager excluded (static list)', !all(withRole).includes('manager'))
check('role: roadmap kept', all(withRole).includes('roadmap'))
check('role: sql kept', all(withRole).includes('sql'))
check('role: kubernetes kept', all(withRole).includes('kubernetes'))
check(
  'role: multi-word phrases kept even with role token',
  all(withRole).some((k) => k.includes(' '))
)
check('no role: behavior unchanged (product still listed)', all(noRole).includes('product'))
check(
  'ignoredKeywords still respected',
  !all(analyzeAnswer(answer, jd, ['sql'], 'Product Manager')).includes('sql')
)

const report = sessionReport([{ q: 'Q', a: answer }], jd, [], 'Product Manager')
check('report: no bare product keyword', !/[ :](product)(,|\s*$)/m.test(report.split('\n').filter((l) => l.includes('Keywords') || l.includes('keywords')).join('\n')))
check('report: roadmap present', report.includes('roadmap'))
const reportNoRole = sessionReport([{ q: 'Q', a: answer }], jd)
check('report no role: unchanged product listed', reportNoRole.includes('product'))

console.log(`r356 oracle: ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
