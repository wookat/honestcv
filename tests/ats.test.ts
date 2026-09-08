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
