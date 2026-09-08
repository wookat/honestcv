import { describe, expect, it } from 'vitest'
import { scoreResumeText } from '../src/lib/ats'
import { parseResumeText } from '../src/lib/importText'
import { buildResumePdf } from '../src/lib/pdf'
import { sampleResume, type Resume } from '../src/lib/resume'
import { TEMPLATES } from '../src/lib/templates'
import { pdfTextOf } from './import/helpers'

const contactRow = (text: string, c: Resume['contact']) =>
  text.split('\n').find((l) => l.includes(c.email) && l.includes(c.location)) ?? ''

describe('our own PDF export re-imported (R784)', () => {
  const src = sampleResume()

  it('prints a separator between contact items and keeps the location on re-import', async () => {
    for (const t of TEMPLATES) {
      const { text } = await pdfTextOf(await buildResumePdf({ ...src, templateId: t.id }))
      const row = contactRow(text, src.contact)
      expect(row, t.id).toContain(`${src.contact.phone} | ${src.contact.location} |`)
      const back = parseResumeText(text)
      expect(back.contact.location, t.id).toBe(src.contact.location)
      expect(back.contact.email, t.id).toBe(src.contact.email)
      expect(back.contact.phone, t.id).toBe(src.contact.phone)
    }
  })

  it('a row too wide for one line falls back to wrapped text and still re-imports', async () => {
    const wide: Resume = {
      ...src,
      contact: {
        ...src.contact,
        website: 'https://www.jordan-reyes-portfolio-and-writing.example.com/projects',
        linkedin: 'https://www.linkedin.com/in/jordan-reyes-software-engineer-austin',
      },
    }
    const { text } = await pdfTextOf(await buildResumePdf(wide))
    const back = parseResumeText(text)
    expect(back.contact.location).toBe(src.contact.location)
    expect(back.contact.linkedin).toContain('linkedin.com/in/jordan-reyes-software-engineer-austin')
  })
})

describe('a wrapped bullet is one extracted line (R786)', () => {
  // Capital-start continuation (no text cue), the only figure and the full stop
  // both land on wrapped lines — the scorer and parser must see one bullet.
  const long =
    'Architected and implemented Azure-based cloud solutions including Azure Functions, App Service and Storage Accounts, integrated into CI/CD workflows via Azure DevOps pipelines for 14 product teams.'
  const src = sampleResume()
  src.experience[0].bullets = [long, 'Built internal design-system components adopted by 5 product teams.']

  it('every template hands the scorer the whole bullet and the parser keeps the next header apart', async () => {
    for (const t of TEMPLATES) {
      const { text } = await pdfTextOf(await buildResumePdf({ ...src, templateId: t.id }))
      const lines = text.split('\n')
      expect(lines.filter((l) => l.startsWith('• ')).length, t.id).toBe(5)
      expect(lines.find((l) => l.startsWith('• Architected')), t.id).toBe(`• ${long}`)
      const back = parseResumeText(text)
      expect(back.experience.map((e) => e.role), t.id).toEqual(['Software Engineer', 'Junior Developer'])
      expect(back.experience[0].bullets, t.id).toEqual(src.experience[0].bullets)
      expect(back.experience[1].bullets, t.id).toEqual(src.experience[1].bullets)
      const quantified = scoreResumeText(text, '').checks.find((c) => c.label === 'Quantified bullet points')
      expect(quantified?.pass, t.id).toBe(true)
    }
  })
})

describe('a LinkedIn-shaped resume survives our PDF export (R787)', () => {
  // Long headline (wraps in every template), region-only location, an entry
  // titled with a section word, same-year tenures printed as a lone year, and a
  // header long enough to wrap inside its "Company, Region" tail.
  const src = sampleResume()
  src.contact = {
    ...src.contact,
    fullName: 'Kenneth Adams',
    title: 'Engineering Manager; Agile Leader - Agile Coach, Scrum Master, CSP, CSM, SAFe Expert; Program Manager at Apple, IBM & more...',
    phone: '',
    location: 'Las Vegas Metropolitan Area',
  }
  src.experience = [
    { ...src.experience[0], role: 'Engineering Team Leader, Senior Scrum Master, Agile Transformation & Coaching', company: 'AT&T', location: '', startDate: '2023', endDate: '2023' },
    { ...src.experience[1], role: 'About Recommendations', company: 'Recommendations', location: '', startDate: '2020', endDate: '2021', bullets: ['Recommendations from clients and colleagues.'] },
    { ...src.experience[0], id: 'x3', role: 'Cloud Engineering, Global Program Manager, Agile Transformation & Coaching', company: 'Ivanti', location: 'San Francisco Bay Area', startDate: '2016', endDate: '2018' },
  ]
  const pick = (r: Resume) => ({
    contact: r.contact,
    summary: r.summary,
    experience: r.experience.map(({ role, company, location, startDate, endDate, bullets }) => ({ role, company, location, startDate, endDate, bullets })),
  })

  // Sidebar's narrow column wraps the 78-character role before its " · " (a
  // header split ahead of the binder) — not rejoined yet; see plan-r787.
  it('every full-width template re-imports contact, summary and the three entries field for field', async () => {
    for (const t of TEMPLATES.filter((t) => t.id !== 'sidebar')) {
      const { text } = await pdfTextOf(await buildResumePdf({ ...src, templateId: t.id }))
      expect(pick(parseResumeText(text)), t.id).toEqual(pick(src))
    }
  })
})
