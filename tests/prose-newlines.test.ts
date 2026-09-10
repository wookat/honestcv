import { readFileSync } from 'node:fs'
import path from 'node:path'
import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { buildResumeDocx } from '../src/lib/docx'
import { extractResumeFile } from '../src/lib/extractFile'
import { proseInput, proseKeyDown } from '../src/lib/markShortcuts'
import { buildResumePdf } from '../src/lib/pdf'
import {
  educationDetailLine,
  proseText,
  resumeToMarkdown,
  resumeToPlainText,
  sampleResume,
  type Resume,
} from '../src/lib/resume'
import { pdfTextOf } from './import/helpers'

const read = (rel: string) => readFileSync(path.resolve(import.meta.dirname, rel), 'utf8')

// Summary and certification descriptions are prose: one paragraph on every surface.
// Production (R838/R839 QA, R840 probe) stored the newline a user typed, the preview
// <p> (white-space: normal) and the PDF word-wrapper flattened it, DOCX put the whole
// value in one run (no <w:br/>), TXT / MD printed it. The rule is now explicit and
// shared: line breaks become a single space at the editor and at every renderer.
const SUMMARY =
  'Software engineer with 4 years of experience.\n\nShipped features used by 2M+ users.\r\nStrong in React and TypeScript.'
const SUMMARY_FLAT =
  'Software engineer with 4 years of experience. Shipped features used by 2M+ users. Strong in React and TypeScript.'
const CERT = 'Covers cloud architecture and cost controls.\nRenewed every three years.'
const CERT_FLAT = 'Covers cloud architecture and cost controls. Renewed every three years.'
const EDU = "Dean's List.\nThesis on distributed caches."
const EDU_FLAT = "Dean's List. Thesis on distributed caches."

const withProse = (): Resume => ({
  ...sampleResume(),
  summary: SUMMARY,
  certItems: [
    {
      id: 'cert-1',
      name: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      date: 'Mar 2024',
      description: CERT,
    },
  ],
  certifications: 'PMP\nScrum Master',
  education: sampleResume().education.map((e, i) => (i === 0 ? { ...e, details: EDU } : e)),
})

describe('R840: prose fields are one paragraph on every surface', () => {
  it('proseText joins line breaks (LF, CRLF, blank lines, surrounding spaces) with one space', () => {
    expect(proseText(SUMMARY)).toBe(SUMMARY_FLAT)
    expect(proseText('a \n  b\r\n\r\nc\n')).toBe('a b c')
    expect(proseText('  plain  ')).toBe('plain')
    expect(proseText('')).toBe('')
  })

  it('TXT and Markdown print the paragraph on one line', () => {
    const r = withProse()
    const txt = resumeToPlainText(r)
    expect(txt).toContain('SUMMARY\n' + SUMMARY_FLAT + '\n')
    expect(txt).toContain('\n' + CERT_FLAT + '\n')
    expect(txt).toContain('\nPMP Scrum Master')
    expect(txt).toContain(EDU_FLAT)
    expect(txt).not.toContain(EDU)
    expect(txt).not.toContain('Renewed every three years.\n\n')
    const md = resumeToMarkdown(r)
    expect(md).toContain('\n' + SUMMARY_FLAT + '\n')
    expect(md).toContain('\n' + CERT_FLAT + '\n')
    expect(md).toContain('PMP Scrum Master')
    expect(md).toContain(EDU_FLAT)
    expect(educationDetailLine(r.education[0])).toContain(EDU_FLAT)
  })

  it('PDF text keeps the sentences of a paragraph in one run', async () => {
    const { text } = await pdfTextOf(await buildResumePdf(withProse()))
    const flat = text.replace(/\s+/g, ' ')
    expect(flat).toContain(SUMMARY_FLAT)
    expect(flat).toContain(CERT_FLAT)
    expect(flat).toContain('PMP Scrum Master')
    expect(flat).toContain(EDU_FLAT)
  })

  it('DOCX stores the paragraph as one run and re-extracts on one line', async () => {
    const file = new File([await buildResumeDocx(withProse())], 'jordan-reyes-resume.docx')
    const { text } = await extractResumeFile(file)
    const lines = text.split('\n')
    expect(lines).toContain(SUMMARY_FLAT)
    expect(lines).toContain(CERT_FLAT)
    expect(lines).toContain('PMP Scrum Master')
    expect(lines.some((l) => l.startsWith(EDU_FLAT))).toBe(true)
  })

  it('preview renders summary / certification prose through proseText', () => {
    const src = read('../src/components/ResumePreview.tsx')
    expect(src).toContain('value={proseText(resume.summary)}')
    expect(src).toContain('<p className="text-[11px]">{proseText(c.description)}</p>')
    expect(src).toContain('<p className="text-[11px]">{proseText(resume.certifications)}</p>')
    expect(src).not.toContain('value={resume.summary.trim()}')
    expect(src).not.toContain('>{c.description.trim()}<')
    // the inline editor commits through the same rule, so a stored newline is not re-saved
    expect(src).toContain('onEdit({ ...resume, summary: proseText(v) })')
    expect(src).toContain('value={proseText(e.details)}')
    expect(src).toContain('{ ...x, details: proseText(v) }')
    expect(src).not.toContain('value={e.details.trim()}')
  })

  it('DOCX summary / certification paragraphs carry no <w:br/> while bullets keep their own paragraphs', async () => {
    const bytes = new Uint8Array(await (await buildResumeDocx(withProse())).arrayBuffer())
    const xml = strFromU8(unzipSync(bytes)['word/document.xml'])
    const paragraphs = xml.split('</w:p>')
    const textOf = (p: string) => [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')
    const summaryP = paragraphs.find((p) => textOf(p).includes('Shipped features used by 2M+ users.'))
    const certP = paragraphs.find((p) => textOf(p).includes('Renewed every three years.'))
    expect(summaryP && textOf(summaryP)).toBe(SUMMARY_FLAT)
    expect(certP && textOf(certP)).toBe(CERT_FLAT)
    expect(summaryP).not.toContain('<w:br')
    expect(certP).not.toContain('<w:br')
    const bullets = withProse().experience[0].bullets
    for (const b of bullets) expect(paragraphs.some((p) => textOf(p) === b)).toBe(true)
  })

  it('PDF and DOCX prose paths call proseText, not trim()', () => {
    const pdf = read('../src/lib/pdf.ts')
    expect(pdf).toContain('bodyText(proseText(resume.summary))')
    expect(pdf).toContain('bodyText(proseText(c.description))')
    expect(pdf).toContain('bodyText(proseText(resume.certifications))')
    expect(pdf).not.toContain('bodyText(resume.summary.trim())')
    expect(pdf).not.toContain('bodyText(c.description.trim())')
    const docx = read('../src/lib/docx.ts')
    expect(docx).toContain('body(proseText(resume.summary)')
    expect(docx).toContain('body(proseText(c.description)')
    expect(docx).toContain('body(proseText(resume.certifications)')
    expect(docx).not.toContain('body(resume.summary.trim()')
    expect(docx).not.toContain('body(c.description.trim()')
  })

  it('editor: summary / certification description textareas swallow Enter and store pasted breaks as spaces', () => {
    const builder = read('../src/pages/Builder.tsx')
    const tagAt = (needle: string) => {
      const at = builder.indexOf(needle)
      expect(at).toBeGreaterThan(-1)
      return builder.slice(builder.lastIndexOf('<Textarea', at), builder.indexOf('/>', at) + 2)
    }
    const summary = tagAt('aria-label="Professional summary"')
    expect(summary).toContain('onKeyDown={proseKeyDown}')
    expect(summary).toContain("set('summary', proseInput(e.target.value))")
    const cert = tagAt('id={`cert-${c.id}-description`}')
    expect(cert).toContain('onKeyDown={proseKeyDown}')
    expect(cert).toContain('description: proseInput(ev.target.value)')
    const details = tagAt('id={`edu-${e.id}-details`}')
    expect(details).toContain('onKeyDown={proseKeyDown}')
    expect(details).toContain('details: proseInput(ev.target.value)')
    expect(proseInput('a\r\nb\nc')).toBe('a b c')
  })

  it('proseKeyDown swallows Enter (plain and Shift/Ctrl) and still applies Ctrl/Cmd mark shortcuts', () => {
    type Ev = Parameters<typeof proseKeyDown>[0]
    // markShortcutKeyDown writes through the element prototype's `value` setter (so React's
    // onChange fires); give node a textarea prototype with that accessor.
    class FakeTextArea {
      raw = ''
      selectionStart = 0
      selectionEnd = 0
      get value() {
        return this.raw
      }
      set value(v: string) {
        this.raw = v
      }
      dispatchEvent() {
        return true
      }
      setSelectionRange(s: number, e: number) {
        this.selectionStart = s
        this.selectionEnd = e
      }
    }
    const fakeEvent = (key: string, mods: Partial<Ev> = {}) => {
      let prevented = false
      const el = Object.assign(new FakeTextArea(), { value: 'hello world', selectionEnd: 5 })
      const ev = {
        key,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        ...mods,
        currentTarget: el,
        preventDefault: () => {
          prevented = true
        },
      } as unknown as Ev
      return { ev, el, prevented: () => prevented }
    }
    for (const mods of [{}, { shiftKey: true }, { ctrlKey: true }, { metaKey: true }]) {
      const { ev, prevented } = fakeEvent('Enter', mods)
      proseKeyDown(ev)
      expect(prevented()).toBe(true)
    }
    const plain = fakeEvent('a')
    proseKeyDown(plain.ev)
    expect(plain.prevented()).toBe(false)

    const g = globalThis as unknown as Record<string, unknown>
    const saved = { input: g.HTMLInputElement, textarea: g.HTMLTextAreaElement }
    g.HTMLInputElement = class {}
    g.HTMLTextAreaElement = FakeTextArea
    try {
      const bold = fakeEvent('b', { ctrlKey: true })
      proseKeyDown(bold.ev)
      expect(bold.prevented()).toBe(true)
      expect(bold.el.value).toBe('**hello** world')
    } finally {
      g.HTMLInputElement = saved.input
      g.HTMLTextAreaElement = saved.textarea
    }
  })

  it('free-text certifications is a single-line <Input>: the control itself cannot hold a newline', () => {
    const builder = read('../src/pages/Builder.tsx')
    const at = builder.indexOf('id="certs"')
    expect(at).toBeGreaterThan(-1)
    expect(builder.slice(builder.lastIndexOf('<', at), at)).toBe('<Input\n                ')
  })

  it('description boxes that are one-line-per-item (experience, coursework) keep their newlines', () => {
    const r = withProse()
    const txt = resumeToPlainText(r)
    for (const b of r.experience[0].bullets) expect(txt).toContain(`- ${b}\n`)
  })
})
