import { scoreResume } from '@/lib/ats'
import { priorityFixes, resumeHealth } from '@/lib/guidance'
import { emptyResume } from '@/lib/resume'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean) => {
  if (ok) passed++
  else {
    failed++
    console.error(`FAIL: ${name}`)
  }
}

const r = emptyResume()
r.contact.fullName = 'Test Person'
r.contact.email = 't@example.com'
r.contact.phone = '555-0100'
r.summary = 'Product manager with impact.'
r.skills = 'SQL, Roadmaps'
r.experience = [
  {
    ...r.experience[0],
    id: 'exp-good',
    role: 'Senior PM',
    company: 'Acme',
    startDate: 'Jan 2022',
    endDate: 'Present',
    bullets: ['Shipped 3 features raising retention 12%.', 'Led 5 engineers.', 'Cut churn 8%.'],
  },
  {
    ...r.experience[0],
    id: 'exp-offender',
    role: 'Associate PM',
    company: 'Harborview',
    startDate: 'Jan 2020',
    endDate: 'Dec 2021',
    bullets: ['Did one thing.'],
  },
]

const ats = scoreResume(r, r.jobDescription ?? "")
const bulletCheck = ats.checks.find((c) => c.label === '3–6 bullet points per role')
check('bullet check exists and fails', !!bulletCheck && !bulletCheck.pass)
check('failing bullet check carries offender entryId', bulletCheck?.entryId === 'exp-offender')

const fixes = priorityFixes(ats, resumeHealth(r), 20)
const fix = fixes.find((f) => f.text.startsWith('3–6 bullet points per role'))
check('priority fix carries entryId', fix?.entryId === 'exp-offender')

r.experience[1].bullets = ['One.', 'Two.', 'Three.']
const ats2 = scoreResume(r, r.jobDescription ?? "")
const bulletCheck2 = ats2.checks.find((c) => c.label === '3–6 bullet points per role')
check('passing check has no entryId', !!bulletCheck2 && bulletCheck2.pass && bulletCheck2.entryId === undefined)

console.log(`r359 oracle: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
