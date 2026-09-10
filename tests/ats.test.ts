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

describe('dates written in the product languages (R791)', () => {
  const DATES = {
    es: ['feb. 2021', 'oct. 2022', 'ago. 2023', 'Actualidad'],
    fr: ['févr. 2021', 'oct. 2022', 'août 2023', "Aujourd'hui"],
    de: ['Feb. 2021', 'Okt. 2022', 'Aug. 2023', 'Heute'],
    pt: ['fev. 2021', 'out. 2022', 'ago. 2023', 'Atual'],
  } as const
  const withDates = (language: keyof typeof DATES, olderFirst: boolean) => {
    const [s1, e1, s2, e2] = DATES[language]
    const r = { ...sampleResume(), language }
    const [older, ongoing] = [{ startDate: s1, endDate: e1 }, { startDate: s2, endDate: e2 }]
    Object.assign(r.experience[0], olderFirst ? older : ongoing)
    Object.assign(r.experience[1], olderFirst ? ongoing : older)
    return resumeToPlainText(r, { keepLinkUrls: true })
  }
  const check = (text: string, label: string) => scoreResumeText(text, '').checks.find((c) => c.label === label)

  it.each(['es', 'fr', 'de', 'pt'] as const)('%s month words and the ongoing word are dates: every experience check runs', (language) => {
    const text = withDates(language, false)
    expect(scoreResumeText(text, '').checks).toHaveLength(22)
    expect(check(text, 'Experience in reverse-chronological order')?.pass).toBe(true)
    expect(check(text, 'Consistent date formatting')?.pass).toBe(true)
    expect(check(text, 'Dates use a written month')?.pass).toBe(true)
  })

  it.each(['es', 'fr', 'de', 'pt'] as const)('%s: an ongoing role listed after an older one fails reverse-chronological order, like in English', (language) => {
    expect(check(withDates(language, true), 'Experience in reverse-chronological order')?.pass).toBe(false)
    expect(check(withDates('es', true).replace(/ago\. 2023 – Actualidad/, 'Aug 2023 – Present'), 'Experience in reverse-chronological order')?.pass).toBe(false)
  })

  it('a numeric date is still the one flagged, and a month word in a bullet is not a date', () => {
    const text =
      'Ana López\nana@example.com\n\nEXPERIENCIA\nIngeniera · Acme (ene. 2021 – 03/2023)\n- Cerré el proyecto de agosto con 20% de ahorro\n- Lideré 3 personas\n- Shipped\n\nEDUCACIÓN\nGrado, Universidad (2014 – 2018)\n\nHabilidades: TypeScript'
    expect(check(text, 'Consistent date formatting')?.pass).toBe(false)
    expect(check(text, 'Dates use a written month')?.hint).toMatch(/"03\/2023" is numeric/)
  })
})

describe('ATS check on the export of a resume with renamed headings (R796)', () => {
  const JD = 'Requirements:\n- React and TypeScript\n- Node.js, PostgreSQL and AWS'
  const checks = (text: string, sectionHeadings?: Partial<Record<string, string>>) =>
    scoreResumeText(text, JD, { sectionHeadings }).checks.map((c) => `${c.label}=${c.pass}`)
  const base = sampleResume()
  const baseTxt = resumeToPlainText(base, { keepLinkUrls: true })
  const renamed = (sectionHeadings: Partial<Record<string, string>>) => {
    const r = { ...base, sectionHeadings: { ...base.sectionHeadings, ...sectionHeadings } }
    return { r, txt: resumeToPlainText(r, { keepLinkUrls: true }), md: resumeToMarkdown(r) }
  }

  it.each(['Work History', 'Employment History', 'Career History', 'Professional Experience'])(
    'an experience section headed "%s" is read like "Experience" without any hint',
    (label) => {
      const { txt, md } = renamed({ experience: label })
      expect(txt).toMatch(new RegExp(`^${label}$`, 'im'))
      expect(checks(txt)).toEqual(checks(baseTxt))
      expect(checks(md)).toEqual(checks(baseTxt))
    }
  )

  it('an arbitrary experience / education / skills rename runs every check when the ATS checker knows the resume', () => {
    const { r, txt } = renamed({
      experience: 'Where I have worked',
      education: 'Academic Background',
      skills: 'Tools & Technologies',
    })
    const blind = scoreResumeText(txt, JD)
    expect(blind.checks.filter((c) => !c.na)).toHaveLength(17)
    const hinted = scoreResumeText(txt, JD, { sectionHeadings: r.sectionHeadings })
    expect(hinted.checks.filter((c) => !c.na)).toHaveLength(22)
    expect(hinted.checks.map((c) => c.label)).toContain('3–6 bullet points per role')
    const bullets = hinted.checks.find((c) => c.label === '3–6 bullet points per role')
    const baseBullets = scoreResumeText(baseTxt, JD).checks.find((c) => c.label === '3–6 bullet points per role')
    expect(bullets?.pass).toBe(baseBullets?.pass)
    expect(hinted.checks.find((c) => c.label === 'Skills section present')?.pass).toBe(true)
    const headings = hinted.checks.find((c) => c.label === 'Standard section headings')
    expect(headings?.pass).toBe(false)
    expect(headings?.hint).toContain('"Where I have worked"')
    expect(headings?.hint).toContain('"Academic Background"')
    expect(scoreResumeText(txt, JD, { sectionHeadings: r.sectionHeadings }).score).toBeGreaterThan(blind.score)
  })

  it('the hint only names section-heading lines, not prose that repeats the label', () => {
    const plain =
      'Jane Doe\njane@example.com\n\nExperience\nEngineer at Acme (2020 – 2021)\n- Built the Toolbox pipeline for 3 teams\n- Cut costs 20%\n- Led 3 people\n\nEducation\nBSc, Uni (2016 – 2019)\n\nToolbox\nTypeScript, React'
    const hinted = scoreResumeText(plain, '', { sectionHeadings: { skills: 'Toolbox' } })
    expect(hinted.checks.find((c) => c.label === 'Skills section present')?.pass).toBe(true)
    const counts = hinted.checks.find((c) => c.label === '3–6 bullet points per role')
    expect(counts?.pass).toBe(true)
  })

  it('a resume without renamed headings scores exactly as before when a hint is passed', () => {
    expect(checks(baseTxt, base.sectionHeadings ?? {})).toEqual(checks(baseTxt))
    expect(checks(baseTxt, { experience: 'Work History' })).toEqual(checks(baseTxt))
  })
})
