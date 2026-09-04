import { extractKeywords } from '@/lib/ats'

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

We need someone who knows SQL and knows Kubernetes. Product sense required.
You should understand analytics, be familiar with roadmap planning, and prefer
data-driven decisions. Demonstrated analytics experience. Communicate clearly.
sql kubernetes analytics roadmap planning sense knows product sense`

const kws = extractKeywords(jd)
check('knows excluded', !kws.includes('knows'))
check('sense excluded as bare token', !kws.includes('sense'))
check('understand excluded', !kws.includes('understand'))
check('familiar excluded', !kws.includes('familiar'))
check('prefer excluded', !kws.includes('prefer'))
check('demonstrated excluded', !kws.includes('demonstrated'))
check('communicate excluded', !kws.includes('communicate'))
check('product sense extracted as phrase', kws.includes('product sense'))
check('sql kept', kws.includes('sql'))
check('kubernetes kept', kws.includes('kubernetes'))
check('analytics kept', kws.includes('analytics'))
check('roadmap kept', kws.includes('roadmap'))

const cleanJd = `Backend Engineer. Build rest api services with python, postgres, docker, terraform. Ship microservices. python postgres docker terraform`
const before = ['rest api', 'microservices', 'python', 'postgres', 'docker', 'terraform']
const clean = extractKeywords(cleanJd)
check(
  'JD without new stopwords unaffected',
  before.every((k) => clean.includes(k))
)

console.log(`r357 oracle: ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
