import { describe, expect, it } from 'vitest'
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
