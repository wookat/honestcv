/* R372 oracle: anytime follow-up drafting — day phrasing, offer thank-you variant. */
import { followUpEmail, daysSinceLastStep, type PipelineEntry, type JobListing } from '@/lib/jobs'

let passed = 0
let failed = 0
function check(name: string, ok: boolean) {
  if (ok) passed++
  else {
    failed++
    console.error(`FAIL: ${name}`)
  }
}

const job: JobListing = {
  id: 'j1',
  title: 'Senior Copywriter',
  company: 'Acme Corp',
  category: 'writing',
  type: 'full_time',
  location: 'Remote',
  postedAt: '',
  salary: '',
  url: '',
  description: '',
}
const ago = (d: number) => Date.now() - d * 86_400_000
const entry = (status: PipelineEntry['status'], atDaysAgo: number, extra: Partial<PipelineEntry> = {}): PipelineEntry => ({
  job,
  status,
  updatedAt: ago(atDaysAgo),
  history: [{ status, at: ago(atDaysAgo) }],
  ...extra,
})

check('daysSince 10', daysSinceLastStep(entry('applied', 10)) === 10)
check('daysSince 0', daysSinceLastStep(entry('applied', 0)) === 0)

// applied phrasing
check('applied today', followUpEmail(entry('applied', 0)).body.includes('position today and wanted'))
check('applied yesterday', followUpEmail(entry('applied', 1)).body.includes('position yesterday and wanted'))
const applied10 = followUpEmail(entry('applied', 10), 'Jordan QA')
check('applied 10 days unchanged', applied10.body.includes('position 10 days ago and wanted to follow up on the status of my application.'))
check('applied subject unchanged', applied10.subject === 'Following up on my Senior Copywriter application at Acme Corp')

// interviewing phrasing
const d1 = entry('interviewing', 1)
const dateOf = (e: PipelineEntry) =>
  new Date(e.history![e.history!.length - 1].at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
check('interviewing fresh form', followUpEmail(d1).body.includes(`We spoke about the Senior Copywriter position on ${dateOf(d1)},`))
const d12 = entry('interviewing', 12)
check('interviewing 12d unchanged', followUpEmail(d12).body.includes(`It has been 12 days since we last spoke about the Senior Copywriter position on ${dateOf(d12)},`))

// offer variant
const offer = followUpEmail(entry('offer', 2, { resumeVersionId: 'v1', notes: 'Recruiter: Dana Smith' }))
check('offer subject', offer.subject === 'Thank you for the Senior Copywriter offer at Acme Corp')
check('offer opener', offer.body.includes('Thank you again for the offer for the Senior Copywriter position.'))
check('offer middle', offer.body.includes('I am very excited about the opportunity'))
check('offer no tailored line', !offer.body.includes('tailored specifically'))
check('offer recruiter greeting', offer.body.startsWith('Hi Dana,'))

// tailored line still applies to applied
check('applied tailored', followUpEmail(entry('applied', 3, { resumeVersionId: 'v1' })).body.includes('tailored specifically to this position'))

console.log(`r372 oracle: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
