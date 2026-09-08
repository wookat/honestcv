import { strToU8, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { scoreResumeText } from '../src/lib/ats'
import { buildResumeDocx } from '../src/lib/docx'
import { extractResumeFile } from '../src/lib/extractFile'
import { parseResumeText } from '../src/lib/importText'
import { resumeToPlainText, sampleResume } from '../src/lib/resume'

const BULLET_CHECKS = [
  '3–6 bullet points per role',
  'Active voice in bullet points',
  'Strong bullet openers',
  'Quantified bullet points',
  'Punctuated bullet points',
  'Bullet points the right length',
]
const bulletLines = (text: string) => text.split('\n').filter((l) => l.startsWith('• '))
const stripIds = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(stripIds)
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>)
            .filter(([k]) => k !== 'id')
            .map(([k, x]) => [k, stripIds(x)])
        )
      : v

const docxOf = (paragraphs: string[]) =>
  new File(
    [
      zipSync({
        'word/document.xml': strToU8(
          `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs.join('')}</w:body></w:document>`
        ),
      }),
    ],
    'jane-doe-resume.docx'
  )
const p = (text: string, numId?: number) =>
  `<w:p>${numId === undefined ? '' : `<w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr></w:pPr>`}<w:r><w:t>${text}</w:t></w:r></w:p>`

describe('our own DOCX export re-imported (R785)', () => {
  const src = sampleResume()

  it('list paragraphs come back as bullet lines, so the ATS bullet checks run and the fields re-import', async () => {
    const file = new File([await buildResumeDocx(src)], 'jordan-reyes-resume.docx')
    const { text } = await extractResumeFile(file)
    const expected = src.experience.flatMap((e) => e.bullets)
    expect(bulletLines(text)).toEqual(expected.map((b) => `• ${b}`))
    expect(text).toContain('SUMMARY\n' + src.summary)

    const labels = scoreResumeText(text, '').checks.map((c) => c.label)
    for (const l of BULLET_CHECKS) expect(labels).toContain(l)

    const fromDocx = stripIds(parseResumeText(text))
    const fromTxt = stripIds(parseResumeText(resumeToPlainText(src)))
    expect(fromDocx).toEqual(fromTxt)
  })
})

describe('Word list paragraphs (R785)', () => {
  it('marks numbered / bulleted paragraphs and leaves numId 0 (numbering removed) and plain paragraphs alone', async () => {
    const { text } = await extractResumeFile(
      docxOf([
        p('Jane Doe'),
        p('Experience'),
        p('Engineer · Acme (2020 – 2021)'),
        p('Shipped the thing', 1),
        p('Measured the thing', 12),
        p('Not a list any more', 0),
        p('Plain closing line'),
      ])
    )
    expect(text.split('\n')).toEqual([
      'Jane Doe',
      'Experience',
      'Engineer · Acme (2020 – 2021)',
      '• Shipped the thing',
      '• Measured the thing',
      'Not a list any more',
      'Plain closing line',
    ])
  })

  it('a paragraph without numPr right after a list paragraph is not marked', async () => {
    const { text } = await extractResumeFile(
      docxOf([p('First', 1), `<w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:t>Second</w:t></w:r></w:p>`])
    )
    expect(text).toBe('• First\nSecond')
  })
})

describe('the company-info paragraph re-imports as companyInfo (R794)', () => {
  it('DOCX and TXT exports of an entry with company info parse to the same fields', async () => {
    const src = sampleResume()
    src.experience = src.experience.map((e, i) => ({
      ...e,
      companyInfo: ['Series B fintech, ~200 people, B2B payments', 'Fortune 500 retailer with 12,000 employees'][i % 2],
    }))
    const file = new File([await buildResumeDocx(src)], 'jordan-reyes-resume.docx')
    const { text } = await extractResumeFile(file)
    const back = parseResumeText(text)
    expect(back.experience.map((e) => e.companyInfo)).toEqual(src.experience.map((e) => e.companyInfo))
    expect(stripIds(back)).toEqual(stripIds(parseResumeText(resumeToPlainText(src))))
  })
})
