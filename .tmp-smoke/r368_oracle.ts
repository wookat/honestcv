/* R368 oracle: keepTargetOnImport preserves targeting; followUpEmail trims. */
import { keepTargetOnImport, parseResumeText } from '../src/lib/importText'
import { emptyResume } from '../src/lib/resume'
import { followUpEmail, type PipelineEntry } from '../src/lib/jobs'

let passed = 0
let failed = 0
function check(name: string, ok: boolean) {
  if (ok) passed++
  else {
    failed++
    console.error(`FAIL: ${name}`)
  }
}

// keepTargetOnImport
const prev = emptyResume()
prev.targetRole = 'Product Designer'
prev.jobDescription = 'We need Figma and prototyping.'
prev.experienceLevel = 'senior'
prev.targetCompany = 'Acme'
prev.ignoredKeywords = ['figma']
prev.language = 'es'
prev.summary = 'Old summary that must be replaced'

const parsed = parseResumeText(
  'Jordan Blake\njordan@example.com | 555-0100 | Austin TX\n\nEXPERIENCE\nEngineer at Corp (Jun 2023 – Present)\n- Shipped things'
)
const merged = keepTargetOnImport(prev, parsed)
check('targetRole preserved', merged.targetRole === 'Product Designer')
check('jobDescription preserved', merged.jobDescription === prev.jobDescription)
check('experienceLevel preserved', merged.experienceLevel === 'senior')
check('targetCompany preserved', merged.targetCompany === 'Acme')
check('ignoredKeywords preserved', merged.ignoredKeywords?.[0] === 'figma')
check('language preserved', merged.language === 'es')
check('content comes from parse (contact)', merged.contact.email === 'jordan@example.com')
check('content comes from parse (summary replaced)', merged.summary !== prev.summary)
check('experience from parse', merged.experience.length === 1)

// parseResumeText itself never sets targeting
check('parse leaves targetRole empty', parsed.targetRole === '')
check('parse leaves jobDescription empty', parsed.jobDescription === '')

// keepTargetOnImport carries empty prev targeting verbatim (no invented values)
const blankPrev = emptyResume()
const merged2 = keepTargetOnImport(blankPrev, parsed)
check('empty prev stays empty', merged2.targetRole === '' && merged2.targetCompany === undefined)

// followUpEmail trims untrimmed company/title
const entry: PipelineEntry = {
  job: {
    id: '1',
    title: 'Freelance Copywriter ',
    company: 'Coalition Technologies ',
    category: '',
    type: '',
    location: 'Remote',
    postedAt: '',
    salary: '',
    url: 'https://example.com',
    description: '',
  },
  status: 'applied',
  updatedAt: Date.now() - 9 * 86_400_000,
  history: [{ status: 'applied', at: Date.now() - 9 * 86_400_000 }],
}
const email = followUpEmail(entry, 'Jordan')
check('greeting single-spaced', email.body.startsWith('Hi Coalition Technologies hiring team,'))
check('subject has no double space', !email.subject.includes('  '))
check(
  'subject trimmed title',
  email.subject === 'Following up on my Freelance Copywriter application at Coalition Technologies'
)

console.log(`r368 oracle: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
