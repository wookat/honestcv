import { describe, expect, it } from 'vitest'
import { scoreResumeText } from '../src/lib/ats'
import { resumeToMarkdown, resumeToPlainText, sampleResume } from '../src/lib/resume'

const failing = (text: string, jd = '') =>
  scoreResumeText(text, jd)
    .checks.filter((c) => !c.pass)
    .map((c) => c.label)

describe('ATS check on pasted text (R783)', () => {
  it('our own Markdown export scores like our own TXT export', () => {
    const src = sampleResume()
    const txt = resumeToPlainText(src, { keepLinkUrls: true })
    const md = resumeToMarkdown(src)
    expect(failing(md)).toEqual(failing(txt))
    expect(failing(md)).not.toContain('Standard section headings')
    expect(failing(md)).not.toContain('Skills section present')
    expect(scoreResumeText(md, '').score).toBe(scoreResumeText(txt, '').score)
  })

  it('a plain-text resume with one "#" line is scored as typed', () => {
    const plain = 'Jane Doe\njane@example.com\n\nExperience\nEngineer at Acme (2020 – 2021)\n- Shipped\n\nEducation\nBSc, Uni (2016 – 2019)\n\nSkills\nTypeScript'
    expect(failing(`# ${plain}`)).toEqual(failing(plain))
  })
})

describe('ATS check on pasted text in the product languages (R790)', () => {
  const JD = 'Requirements:\n- React and TypeScript\n- Node.js, PostgreSQL and AWS'
  const checks = (text: string) => scoreResumeText(text, JD).checks.map((c) => `${c.label}=${c.pass}`)

  it.each(['es', 'fr', 'de', 'pt'] as const)(
    'our own %s TXT / Markdown exports run every check the English export runs, with the same result',
    (language) => {
      const en = sampleResume()
      const loc = { ...sampleResume(), language }
      const enTxt = resumeToPlainText(en, { keepLinkUrls: true })
      const locTxt = resumeToPlainText(loc, { keepLinkUrls: true })
      const locMd = resumeToMarkdown(loc)
      expect(locTxt).not.toMatch(/^Experience$/m)
      expect(checks(locTxt)).toEqual(checks(enTxt))
      expect(checks(locMd)).toEqual(checks(enTxt))
      expect(checks(enTxt)).toHaveLength(22)
      expect(scoreResumeText(locTxt, JD).score).toBe(scoreResumeText(enTxt, JD).score)
    }
  )

  it('a localized heading in capitals and an inline localized skills label count', () => {
    const es =
      'Ana López\nana@example.com · +34 600 000 000\n\nEXPERIENCIA\nIngeniera · Acme (Jun 2020 – Present)\n- Shipped the thing\n- Cut costs 20%\n- Led 3 people\n\nEDUCACIÓN\nGrado, Universidad (2014 – 2018)\n\nHabilidades: TypeScript, React'
    expect(failing(es)).not.toContain('Standard section headings')
    expect(failing(es)).not.toContain('Skills section present')
    expect(scoreResumeText(es, '').checks.map((c) => c.label)).toContain('3–6 bullet points per role')
  })

  it('an English resume whose bullets mention section words in other languages is unchanged', () => {
    const plain =
      'Jane Doe\njane@example.com\n\nExperience\nEngineer at Acme (2020 – 2021)\n- Ran the Formation programme for the Kenntnisse team\n- Wrote the Educación curriculum\n\nEducation\nBSc, Uni (2016 – 2019)\n\nSkills\nTypeScript'
    expect(failing(plain)).not.toContain('Standard section headings')
    const counts = scoreResumeText(plain, '').checks.find((c) => c.label === '3–6 bullet points per role')
    expect(counts?.hint).toMatch(/2 bullet/)
  })
})
