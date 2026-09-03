import { analyzeAnswer, sessionReport } from '@/lib/interviewAnalysis'

const jd =
  'Senior Software Engineer at Initech. Kubernetes and Terraform used daily. Strong knowledge of PostgreSQL and Python required. Excellent communication skills.'

let pass = 0
let total = 0
const check = (name: string, ok: boolean) => {
  total++
  console.log(ok ? 'PASS' : 'FAIL', name)
  if (ok) pass++
}

const a = analyzeAnswer(
  'In my last project I deployed services with kubernetes and wrote terraform modules, which resulted in faster releases and measurable impact for the team overall today.',
  jd
)
const all = [...(a.keywords?.covered ?? []), ...(a.keywords?.missing ?? [])]
check('no title words in keyword universe', !all.some((k) => ['senior', 'engineer', 'software'].includes(k) && !k.includes(' ')))
check('no generic filler words', !all.some((k) => ['used', 'daily', 'strong', 'knowledge', 'skills', 'excellent'].includes(k)))
check('real skills kept', all.includes('kubernetes') && all.includes('terraform') && all.includes('postgresql') && all.includes('python'))
check('covered detects used skills', (a.keywords?.covered ?? []).includes('kubernetes') && (a.keywords?.covered ?? []).includes('terraform'))
check('highPriorityMissing subset of missing', (a.keywords?.highPriorityMissing ?? []).every((k) => (a.keywords?.missing ?? []).includes(k)))

const report = sessionReport(
  [{ q: 'Q', a: 'In my project I used kubernetes to ship the platform and the result was a large improvement in reliability for everyone involved across the year.' }],
  jd
)
check('report has keyword line', report.includes('Keywords covered across the session'))
check('report tiers free of filler words', !/(High Priority|Remaining) [^\n]*\b(used|daily|senior|engineer|skills)\b/.test(report))

const none = analyzeAnswer('word '.repeat(50).trim(), 'Senior engineer role, strong skills, daily work.')
check('all-filler JD degrades to no keyword panel', none.keywords === null)

console.log(`${pass}/${total}`)
if (pass !== total) process.exit(1)
