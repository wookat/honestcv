/**
 * Export the resume as a real .docx using the `docx` library.
 * Single-column, text-only layout so ATS parsers read it cleanly.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  Tab,
  TabStopType,
  TextRun,
} from 'docx'
import { downloadBlob } from '@/lib/download'
import { type Resume, orderedSectionKeys } from '@/lib/resume'
import { resolveTemplate } from '@/lib/templates'

const FONT_SERIF = 'Georgia'
const FONT_SANS = 'Calibri'
// Page width in twips minus the 864-twip left/right margins
const PAGE_TWIPS = {
  letter: { width: 12240, height: 15840 },
  a4: { width: 11906, height: 16838 },
} as const

export async function downloadResumeDocx(resume: Resume, filename: string) {
  const tpl = resolveTemplate(resume.templateId, resume.accentColor)
  const font = tpl.serif ? FONT_SERIF : FONT_SANS
  const pageSize = PAGE_TWIPS[resume.pageSize === 'a4' ? 'a4' : 'letter']
  const rightTab = pageSize.width - 864 * 2
  const accent = tpl.accent.replace('#', '')
  const heading = (text: string) =>
    new Paragraph({
      spacing: { before: 240, after: 80 },
      border:
        tpl.divider === 'none'
          ? undefined
          : {
              bottom: {
                style: BorderStyle.SINGLE,
                size: tpl.divider === 'thick' ? 12 : 4,
                color: accent,
              },
            },
      children: [
        new TextRun({
          text: tpl.headingCase === 'upper' ? text.toUpperCase() : text,
          bold: true,
          size: 22,
          color: accent,
          font,
        }),
      ],
    })
  const body = (
    text: string,
    opts: { bold?: boolean; italic?: boolean; bullet?: boolean; after?: number } = {}
  ) =>
    new Paragraph({
      spacing: { after: opts.after ?? 60 },
      bullet: opts.bullet ? { level: 0 } : undefined,
      children: [
        new TextRun({
          text,
          bold: opts.bold,
          italics: opts.italic,
          size: 21,
          font,
        }),
      ],
    })

  const children: Paragraph[] = []
  const c = resume.contact

  const headerAlignment =
    tpl.headerAlign === 'left' ? AlignmentType.LEFT : AlignmentType.CENTER
  const name =
    tpl.nameCase === 'upper'
      ? (c.fullName || 'Your Name').toUpperCase()
      : c.fullName || 'Your Name'
  children.push(
    new Paragraph({
      alignment: headerAlignment,
      spacing: { after: 40 },
      children: [new TextRun({ text: name, bold: true, size: 40, font })],
    })
  )
  if (c.title) {
    children.push(
      new Paragraph({
        alignment: headerAlignment,
        spacing: { after: 40 },
        children: [new TextRun({ text: c.title, size: 24, color: accent, font })],
      })
    )
  }
  const httpUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`)
  const contactSegments = [
    c.email ? { text: c.email, url: `mailto:${c.email}` } : null,
    c.phone ? { text: c.phone } : null,
    c.location ? { text: c.location } : null,
    c.website ? { text: c.website, url: httpUrl(c.website) } : null,
    c.linkedin ? { text: c.linkedin, url: httpUrl(c.linkedin) } : null,
  ].filter((s): s is { text: string; url?: string } => s !== null)
  if (contactSegments.length > 0) {
    const runs: (TextRun | ExternalHyperlink)[] = []
    contactSegments.forEach((s, i) => {
      if (i > 0) runs.push(new TextRun({ text: '  |  ', size: 19, font }))
      runs.push(
        s.url
          ? new ExternalHyperlink({
              link: s.url,
              children: [new TextRun({ text: s.text, size: 19, font, style: 'Hyperlink' })],
            })
          : new TextRun({ text: s.text, size: 19, font })
      )
    })
    children.push(
      new Paragraph({
        alignment: headerAlignment,
        spacing: { after: 120 },
        children: runs,
      })
    )
  }

  for (const key of orderedSectionKeys(resume)) {
    if (key === 'summary' && resume.summary.trim()) {
      children.push(heading('Summary'), body(resume.summary.trim(), { after: 100 }))
    } else if (key === 'experience' && resume.experience.some((e) => e.company || e.role)) {
      children.push(heading('Experience'))
      for (const e of resume.experience) {
        if (!e.company && !e.role) continue
        const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ')
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
            children: [
              new TextRun({ text: e.role || 'Role', bold: true, size: 22, font }),
              new TextRun({
                text: `  ·  ${e.company}${e.location ? `, ${e.location}` : ''}`,
                size: 21,
                font,
              }),
              ...(dates
                ? [new TextRun({ children: [new Tab(), dates], italics: true, size: 19, font })]
                : []),
            ],
          })
        )
        for (const b of e.bullets) {
          if (b.trim()) children.push(body(b.trim(), { bullet: true }))
        }
      }
    } else if (key === 'projects' && resume.projects.some((p) => p.name)) {
      children.push(heading('Projects'))
      for (const p of resume.projects) {
        if (!p.name) continue
        children.push(
          body(`${p.name}${p.link ? ` — ${p.link}` : ''}`, { bold: true, after: 20 })
        )
        if (p.description.trim()) children.push(body(p.description.trim(), { after: 80 }))
      }
    } else if (key === 'education' && resume.education.some((e) => e.school)) {
      children.push(heading('Education'))
      for (const e of resume.education) {
        if (!e.school) continue
        const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ')
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 20 },
            tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
            children: [
              new TextRun({ text: e.degree || 'Degree', bold: true, size: 21, font }),
              new TextRun({
                text: `  ·  ${e.school}${e.location ? `, ${e.location}` : ''}`,
                size: 21,
                font,
              }),
              ...(dates
                ? [new TextRun({ children: [new Tab(), dates], italics: true, size: 19, font })]
                : []),
            ],
          })
        )
        if (e.details.trim()) children.push(body(e.details.trim()))
      }
    } else if (key === 'skills' && resume.skills.trim()) {
      children.push(heading('Skills'), body(resume.skills.trim(), { after: 100 }))
    } else if (key === 'certifications' && resume.certifications.trim()) {
      children.push(
        heading('Certifications'),
        body(resume.certifications.trim(), { after: 100 })
      )
    } else if (key.startsWith('custom:')) {
      const s = resume.customSections.find((x) => `custom:${x.id}` === key)
      if (!s || (!s.title.trim() && !s.bullets.some((b) => b.trim()))) continue
      children.push(heading(s.title.trim() || 'Additional'))
      for (const b of s.bullets) {
        if (b.trim()) children.push(body(b.trim(), { bullet: true }))
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: pageSize,
            margin: { top: 720, bottom: 720, left: 864, right: 864 },
          },
        },
        children,
      },
    ],
  })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, filename)
}

/** Generic text document (cover letter / interview brief) */
export async function downloadTextDocx(
  title: string,
  text: string,
  filename: string
) {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { after: 300 },
      children: [new TextRun({ text: title, bold: true, size: 30, font: FONT_SANS })],
    }),
  ]
  for (const block of text.split(/\n{2,}/)) {
    const t = block.trim()
    if (!t) continue
    paragraphs.push(
      new Paragraph({
        spacing: { after: 200, line: 340 },
        children: t
          .split('\n')
          .map(
            (line, i) =>
              new TextRun({ text: line, size: 22, font: FONT_SANS, break: i > 0 ? 1 : 0 })
          ),
      })
    )
  }
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, filename)
}
