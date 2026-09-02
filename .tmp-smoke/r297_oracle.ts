import { parseResumeText } from '../src/lib/importText'

const docxText = `王小明 QA
Senior Platform Engineer
qa@example.com | 555-0100 | Taipei
SUMMARY
Engineer with impact and drive shipping platforms.
EXPERIENCE

Platform Engineer · Acme
Mar 2021 – Present
Led migration of 40 services to Kubernetes, cutting infra cost 25%.
Built CI/CD pipeline adopted by 12 teams.

SRE · Beta Corp
Jan 2018 – Feb 2021
Ran on-call rotation for 200 microservices.
Cut MTTR from 45 to 12 minutes.
PROJECTS
Deploybot
Shipped v1 to 300 users.
Open-sourced under MIT.
INVOLVEMENT

Mentor · CodeClub
Ran weekly sessions.
EDUCATION

BS CS · NTU
2017
SKILLS
Docker, Kubernetes, Terraform, Go
PATENTS
US-1234567 automated rollout system.`

let fails = 0
const check = (name: string, ok: boolean, detail?: unknown) => {
  if (!ok) { fails++; console.log('FAIL', name, JSON.stringify(detail)) } else console.log('ok  ', name)
}

const r = parseResumeText(docxText)
check('2 experience entries', r.experience.length === 2, r.experience.map(e => e.role))
check('exp1 role/company', r.experience[0]?.role === 'Platform Engineer' && r.experience[0]?.company === 'Acme')
check('exp1 bullets', JSON.stringify(r.experience[0]?.bullets) === JSON.stringify([
  'Led migration of 40 services to Kubernetes, cutting infra cost 25%.',
  'Built CI/CD pipeline adopted by 12 teams.',
]), r.experience[0]?.bullets)
check('exp2 role/company', r.experience[1]?.role === 'SRE' && r.experience[1]?.company === 'Beta Corp')
check('exp2 bullets', JSON.stringify(r.experience[1]?.bullets) === JSON.stringify([
  'Ran on-call rotation for 200 microservices.',
  'Cut MTTR from 45 to 12 minutes.',
]), r.experience[1]?.bullets)
check('1 project', r.projects.length === 1, r.projects.map(p => p.name))
check('project description merged', r.projects[0]?.description === 'Shipped v1 to 300 users. Open-sourced under MIT.', r.projects[0]?.description)

// Regression: bulleted plain-text import unchanged
const bulleted = `Jane Doe
Engineer
jane@x.com
EXPERIENCE
Engineer — Acme, Austin, TX
Jan 2020 – Present
• Shipped things fast.
• Cut costs 10%.
SRE at Beta
2018 – 2020
- Kept things up.
PROJECTS
Widget
• Built a widget used by 5 teams.`
const b = parseResumeText(bulleted)
check('bulleted: 2 entries', b.experience.length === 2, b.experience.map(e => e.role))
check('bulleted: exp1 bullets', JSON.stringify(b.experience[0]?.bullets) === JSON.stringify(['Shipped things fast.', 'Cut costs 10%.']), b.experience[0]?.bullets)
check('bulleted: exp2 bullets', JSON.stringify(b.experience[1]?.bullets) === JSON.stringify(['Kept things up.']), b.experience[1]?.bullets)
check('bulleted: project desc', b.projects[0]?.description === 'Built a widget used by 5 teams.', b.projects[0]?.description)

// Regression: two-line header (company on its own line, no punctuation) still a header
const twoLine = `John Roe
EXPERIENCE
Senior Analyst
Globex
Jan 2019 – Dec 2021
Analyzed markets across 14 regions daily.`
const t = parseResumeText(twoLine)
check('two-line header: 1 entry', t.experience.length === 1, t.experience.map(e => [e.role, e.company]))
check('two-line header: company', t.experience[0]?.company === 'Globex', t.experience[0]?.company)
check('two-line header: bullet', JSON.stringify(t.experience[0]?.bullets) === JSON.stringify(['Analyzed markets across 14 regions daily.']), t.experience[0]?.bullets)

console.log(fails === 0 ? 'ALL GREEN' : `${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
