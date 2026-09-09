import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ResumePreview } from '../src/components/ResumePreview'
import { scoreResume } from '../src/lib/ats'
import { buildResumeDocx } from '../src/lib/docx'
import { extractResumeFile } from '../src/lib/extractFile'
import { parseResumeText } from '../src/lib/importText'
import { buildResumePdf } from '../src/lib/pdf'
import {
  educationEntries,
  emptyEducation,
  resumeToMarkdown,
  resumeToPlainText,
  sampleResume,
  type EducationItem,
  type Resume,
} from '../src/lib/resume'
import { pdfTextOf } from './import/helpers'

const HONOURS = 'First Class Honours. Final project: a journey planner.'
const edu = (fields: Partial<EducationItem>): EducationItem => ({ ...emptyEducation(), id: 'edu-r808', ...fields })
const withEducation = (e: EducationItem): Resume => ({ ...sampleResume(), education: [e] })
const preview = (r: Resume, editable = false) =>
  renderToStaticMarkup(createElement(ResumePreview, { resume: r, onEdit: editable ? () => {} : undefined }))
const norm = (s: string) => s.replace(/\s+/g, ' ')
/** The rendered Education block alone (heading through the next section heading) */
const eduBlock = (html: string) => {
  const i = html.search(/>Education(<\/span>)?<\/h3>/)
  if (i < 0) return ''
  const rest = html.slice(i)
  const j = rest.indexOf('<h3', 1)
  return j < 0 ? rest : rest.slice(0, j)
}

/** Every shape the Builder stores that has something to print, with the text each output must carry */
const PRINTABLE: { name: string; e: EducationItem; expect: string[] }[] = [
  { name: 'dates only', e: edu({ startDate: '2017', endDate: 'Jun 2020' }), expect: ['2017 – Jun 2020'] },
  { name: 'details only', e: edu({ details: HONOURS }), expect: [HONOURS] },
  { name: 'dates + details (R807 import shape)', e: edu({ startDate: '2017', endDate: 'Jun 2020', details: HONOURS }), expect: ['2017 – Jun 2020', HONOURS] },
  { name: 'GPA only', e: edu({ gpa: '3.9' }), expect: ['GPA: 3.9'] },
  { name: 'degree only (R772)', e: edu({ degree: 'BS Computer Science' }), expect: ['BS Computer Science'] },
  { name: 'school only (R772)', e: edu({ school: 'State University' }), expect: ['State University'] },
]

describe('education entries with no degree or school still print (R808)', () => {
  it('educationEntries keeps any row with a degree, school, date or detail and drops only an all-blank row', () => {
    for (const { name, e } of PRINTABLE) expect(educationEntries(withEducation(e)), name).toHaveLength(1)
    expect(educationEntries(withEducation(edu({})))).toHaveLength(0)
    expect(educationEntries(withEducation(edu({ degree: '  ', school: '\t', details: ' ' })))).toHaveLength(0)
  })

  it('TXT and Markdown print the section with the dates as the heading line and the details below it', () => {
    for (const { name, e, expect: want } of PRINTABLE) {
      const r = withEducation(e)
      const txt = resumeToPlainText(r)
      const md = resumeToMarkdown(r)
      expect(txt, name).toContain('\nEDUCATION\n')
      expect(md, name).toContain('\n## Education\n')
      for (const w of want) {
        expect(txt, name).toContain(w)
        expect(md, name).toContain(w)
      }
    }
    const dated = resumeToPlainText(withEducation(PRINTABLE[2].e)).split('\n')
    const i = dated.indexOf('EDUCATION')
    expect(dated.slice(i + 1, i + 3)).toEqual(['2017 – Jun 2020', HONOURS])
    expect(resumeToMarkdown(withEducation(PRINTABLE[2].e))).toContain(`### 2017 – Jun 2020\n\n${HONOURS}`)
    expect(resumeToMarkdown(withEducation(PRINTABLE[1].e))).not.toContain('### \n')
    expect(resumeToPlainText(withEducation(PRINTABLE[1].e))).not.toMatch(/EDUCATION\n\n/)
    const blank = resumeToPlainText(withEducation(edu({})))
    expect(blank).not.toContain('EDUCATION')
    expect(resumeToMarkdown(withEducation(edu({})))).not.toContain('## Education')
  })

  it('our own TXT / Markdown of a nameless dated entry re-import as one nameless dated entry with its details', () => {
    const r = withEducation(PRINTABLE[2].e)
    for (const text of [resumeToPlainText(r), resumeToMarkdown(r)]) {
      const back = parseResumeText(text).education.map((e) => [e.degree, e.school, e.startDate, e.endDate, e.details])
      expect(back).toEqual([['', '', '2017', 'Jun 2020', HONOURS]])
    }
  })

  it('the read-only preview prints the section (no blank heading row, no placeholder, no separator to nothing)', () => {
    for (const { name, e, expect: want } of PRINTABLE) {
      const html = preview(withEducation(e))
      expect(html, name).toContain('Education')
      for (const w of want) expect(norm(html), name).toContain(norm(w).replace(/&/g, '&amp;'))
      expect(eduBlock(html), name).not.toBe('')
      expect(eduBlock(html), name).not.toContain('Degree')
      expect(eduBlock(html), name).not.toContain('School')
      expect(eduBlock(html), name).not.toContain('·')
      expect(html, name).not.toContain('<p class="text-[11px] font-bold"></p>')
    }
    expect(preview(withEducation(edu({})))).not.toContain('Education')
    expect(norm(preview(withEducation(edu({ degree: 'BS Computer Science', school: 'State University' }))))).toContain(
      'BS Computer Science<span class="font-normal"> · State University</span>'
    )
  })

  it('the editor never shows a separator followed by nothing: both sides are typed values or click-to-type placeholders', () => {
    const text = (html: string) => norm(html.replace(/<[^>]+>/g, '')).trim()
    const heading = (html: string) => text(eduBlock(html).match(/<p class="text-\[11px\] font-bold">(.*?)<\/p>/)?.[1] ?? '')
    expect(heading(preview(withEducation(PRINTABLE[1].e), true))).toBe('Degree · School')
    expect(heading(preview(withEducation(PRINTABLE[4].e), true))).toBe('BS Computer Science · School')
    expect(heading(preview(withEducation(PRINTABLE[5].e), true))).toBe('Degree · State University')
    expect(heading(preview(withEducation(edu({ school: 'State University', location: 'Austin, TX' })), true))).toBe(
      'Degree · State University, Austin, TX'
    )
    const editable = preview(withEducation(PRINTABLE[2].e), true)
    expect(editable).toContain('2017 – Jun 2020')
    expect(editable).toContain(HONOURS.replace(/'/g, '&#x27;'))
    expect(eduBlock(editable)).not.toMatch(/·\s*<\/span>/)
  })

  it('PDF and DOCX print the section for every shape and stay silent for an all-blank row', async () => {
    for (const { name, e, expect: want } of PRINTABLE) {
      const r = withEducation(e)
      const { text: pdf } = await pdfTextOf(await buildResumePdf(r))
      const docx = (await extractResumeFile(new File([await buildResumeDocx(r)], 'r808.docx'))).text
      expect(pdf, name).toMatch(/\nEDUCATION\n/i)
      expect(docx, name).toMatch(/\nEDUCATION\n/i)
      for (const w of want) {
        expect(norm(pdf), name).toContain(w)
        expect(norm(docx), name).toContain(w)
      }
    }
    const blank = withEducation(edu({}))
    expect((await pdfTextOf(await buildResumePdf(blank))).text).not.toMatch(/EDUCATION/i)
    expect((await extractResumeFile(new File([await buildResumeDocx(blank)], 'r808.docx'))).text).not.toMatch(/EDUCATION/i)
  }, 60_000)

  it('the ATS "Education listed" check counts a nameless dated / detailed entry and not an all-blank row', () => {
    const listed = (r: Resume) => scoreResume(r, '').checks.find((c) => c.label === 'Education listed')?.pass
    for (const { name, e } of PRINTABLE) expect(listed(withEducation(e)), name).toBe(true)
    expect(listed(withEducation(edu({})))).toBe(false)
  })
})
