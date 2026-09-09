import { describe, expect, it } from 'vitest'
import { scoreResumeText } from '../src/lib/ats'
import { parseResumeText } from '../src/lib/importText'
import { buildResumePdf } from '../src/lib/pdf'
import { sampleResume, type Resume } from '../src/lib/resume'
import { TEMPLATES } from '../src/lib/templates'
import { pdfTextOf } from './import/helpers'
import { PRINTED_ORDER, ownSections, printedOrder, reorderedOwnSections, withOwnSections } from './import/ownSections'

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

  it('R804: an education entry with only a graduation year re-imports as one entry from every template', async () => {
    const gradOnly: Resume = { ...src, education: [{ ...src.education[0], startDate: '', endDate: '2021' }] }
    for (const t of TEMPLATES) {
      const { text } = await pdfTextOf(await buildResumePdf({ ...gradOnly, templateId: t.id }))
      const back = parseResumeText(text)
      expect(back.education.map((e) => [e.degree, e.school, e.startDate, e.endDate]), t.id).toEqual([
        [src.education[0].degree, src.education[0].school, '2021', '2021'],
      ])
    }
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

  // Sidebar's narrow column wraps the 78-character roles around their " · "
  // ("… Transformation &" + "Coaching · AT&T", "… Coaching ·" + "Ivanti, San
  // Francisco Bay Area"); the importer rejoins both shapes (R792).
  it('every template re-imports contact, summary and the three entries field for field', async () => {
    for (const t of TEMPLATES) {
      const { text } = await pdfTextOf(await buildResumePdf({ ...src, templateId: t.id }))
      expect(pick(parseResumeText(text)), t.id).toEqual(pick(src))
    }
  })
})

describe('page breaks keep bullets and entry headers whole (R793)', () => {
  // Seven jobs of seven bullets (one to three lines each) run to three or four
  // pages on every template, so each rendering crosses several page bottoms.
  const src = sampleResume()
  const words = ['platform', 'pipeline', 'dashboard', 'service', 'ledger', 'catalog', 'gateway', 'scheduler']
  const sentence = (e: number, b: number, n: number) =>
    Array.from({ length: n }, (_, k) => `${words[(e + b + k) % words.length]} ${e + 1}-${b + 1}-${k + 1}`).join(' ')
  src.experience = Array.from({ length: 7 }, (_, e) => ({
    ...src.experience[0],
    id: `x${e}`,
    role: e % 2 ? 'Staff Engineer' : 'Senior Engineer',
    company: `Company ${String.fromCharCode(65 + e)}`,
    location: 'Austin, TX',
    startDate: `Jan ${2010 + e}`,
    endDate: `Dec ${2010 + e}`,
    ...(e % 2 ? { companyInfo: 'Series B fintech, 200 people' } : {}),
    bullets: Array.from({ length: 7 }, (_, b) => `Delivered the ${sentence(e, b, 4 + ((e + b) % 3) * 9)}.`),
  }))
  const bullets = src.experience.flatMap((e) => e.bullets)
  const headers = new Set(src.experience.map((e) => `${e.role} · ${e.company}, ${e.location}`))

  it('every template re-imports the same bullets and no page ends on an entry header', async () => {
    for (const t of TEMPLATES) {
      const { text } = await pdfTextOf(await buildResumePdf({ ...src, templateId: t.id }))
      const pages = text.split('\n\n')
      expect(pages.length, t.id).toBeGreaterThan(2)
      for (const page of pages.slice(0, -1)) {
        const rows = page.trim().split('\n')
        const last = rows[rows.length - 1]
        expect(headers.has(last) || /^(Jan|Dec) 20\d\d/.test(last) || last === 'Series B fintech, 200 people', `${t.id}: page ends on "${last}"`).toBe(false)
      }
      const back = parseResumeText(text)
      expect(back.experience.map((e) => e.companyInfo ?? ''), t.id).toEqual(src.experience.map((e) => e.companyInfo ?? ''))
      expect(back.experience.flatMap((e) => e.bullets), t.id).toEqual(bullets)
    }
  })
})

describe('the company-info line under an entry header re-imports as companyInfo (R794)', () => {
  const src = sampleResume()
  src.experience = src.experience.map((e, i) => ({
    ...e,
    companyInfo: [
      'Series B fintech, ~200 people, B2B payments',
      'Fortune 500 retailer with 12,000 employees',
      'Early-stage climate startup (YC W21)',
    ][i % 3],
  }))
  const pick = (r: Resume) =>
    r.experience.map(({ role, company, location, startDate, endDate, companyInfo, bullets }) => ({
      role,
      company,
      location,
      startDate,
      endDate,
      companyInfo: companyInfo ?? '',
      bullets,
    }))

  it('every template re-imports the experience entries field for field, company info included', async () => {
    for (const t of TEMPLATES) {
      const { text } = await pdfTextOf(await buildResumePdf({ ...src, templateId: t.id }))
      expect(pick(parseResumeText(text)), t.id).toEqual(pick(src))
    }
  })
})

describe('our own structured sections re-import from every template (R797)', () => {
  const src = withOwnSections(sampleResume())

  it('involvement, coursework, certifications, awards, publications, references and military service come back field for field', async () => {
    for (const t of TEMPLATES) {
      const back = parseResumeText((await pdfTextOf(await buildResumePdf({ ...src, templateId: t.id }))).text)
      expect(ownSections(back), t.id).toEqual(ownSections(src))
      expect(back.customSections, t.id).toEqual([])
    }
  })

  it('R799: the section order the template prints comes back from every template', async () => {
    const ordered = reorderedOwnSections(sampleResume())
    for (const t of TEMPLATES) {
      const back = parseResumeText((await pdfTextOf(await buildResumePdf({ ...ordered, templateId: t.id }))).text)
      expect(printedOrder(back), t.id).toEqual(PRINTED_ORDER)
    }
  })

  // Sidebar hangs every heading in a label column beside its section. With
  // ten of them the extractor took the labels for a text column and emitted
  // them after the whole body (R801): the re-import kept one blank job.
  it('R801: Sidebar\'s label column reads with its sections, not as a second column', async () => {
    const { text, multiColumn } = await pdfTextOf(await buildResumePdf({ ...src, templateId: 'sidebar' }))
    expect(multiColumn).toBe(false)
    const lines = text.split('\n')
    const at = (label: string) => lines.indexOf(label)
    expect(at('EXPERIENCE')).toBeGreaterThan(at('Jordan Reyes'))
    expect(lines[at('EXPERIENCE') + 1]).toMatch(/^Software Engineer · Brightlane/)
    expect(lines[at('EDUCATION') + 1]).toMatch(/^B\.S\. Computer Science/)
    expect(lines[at('REFERENCES') + 1]).toMatch(/^Dana Whitfield/)
    const back = parseResumeText(text)
    expect(back.contact.fullName).toBe('Jordan Reyes')
    expect(back.experience.map((e) => [e.role, e.company, e.bullets.length])).toEqual([
      ['Software Engineer', 'Brightlane', 3],
      ['Junior Developer', 'Nova Retail', 3],
    ])
    expect(back.skills).toEqual(src.skills)
    expect(back.summary).toBe(src.summary)
  })
})
