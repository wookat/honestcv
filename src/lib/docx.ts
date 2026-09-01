/**
 * Export the resume as a real .docx using the `docx` library.
 * Single-column, text-only layout so ATS parsers read it cleanly.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  LineRuleType,
  ExternalHyperlink,
  Packer,
  Paragraph,
  ShadingType,
  Tab,
  TabStopType,
  TextRun,
} from 'docx'
import { downloadBlob } from '@/lib/download'
import { parseInlineMarks } from '@/lib/marks'
import {
  type Resume,
  awardBullets,
  awardEntries,
  publicationBullets,
  publicationEntries,
  referenceDetailLine,
  referenceEntries,
  certEntries,
  certHeadingLine,
  courseworkBullets,
  courseworkEntries,
  involvementBullets,
  involvementDates,
  involvementEntries,
  militaryBullets,
  militaryDates,
  militaryEntries,
  agentBullets,
  agentEntries,
  dividerOf,
  educationDetailLine,
  experienceGroups,
  fontScaleOf,
  lineSpacingOf,
  orderedSectionKeys,
  projectDates,
  projectHeadingLine,
  sectionHeading,
  sectionSpacingOf,
  skillLines,
  bulletIndentOf,
  familyOf,
  TEXT_INKS,
  textInkOf,
} from '@/lib/resume'
import { accentTint, resolveTemplate } from '@/lib/templates'

const FONT_BY_KIND = {
  serif: 'Georgia',
  sans: 'Calibri',
  mono: 'Courier New',
  merriweather: 'Merriweather',
  sourcesans: 'Source Sans 3',
  robotomono: 'Roboto Mono',
} as const
// Page width in twips minus the 864-twip left/right margins
const PAGE_TWIPS = {
  letter: { width: 12240, height: 15840 },
  a4: { width: 11906, height: 16838 },
} as const

export async function downloadResumeDocx(resume: Resume, filename: string) {
  const tpl = resolveTemplate(resume.templateId, resume.accentColor)
  const font = FONT_BY_KIND[familyOf(resume, tpl.serif)]
  const pageSize = PAGE_TWIPS[resume.pageSize === 'a4' ? 'a4' : 'letter']
  const rightTab = pageSize.width - 864 * 2
  const accent = tpl.accent.replace('#', '')
  const fs = fontScaleOf(resume)
  const sz = (n: number) => Math.round(n * fs)
  // docx line spacing: 240 twips = single; scale by the user's line-spacing setting
  const lineTwips = Math.round(240 * (lineSpacingOf(resume) / 1.35))
  const divider = dividerOf(resume, tpl.divider)
  const ink = textInkOf(resume)
  const headingBefore = Math.round(240 * sectionSpacingOf(resume))
  const bulletInd = bulletIndentOf(resume) ? { left: 920, hanging: 360 } : undefined
  const heading = (text: string) =>
    new Paragraph({
      spacing: { before: headingBefore, after: 80 },
      keepNext: true,
      shading: tpl.band
        ? { type: ShadingType.CLEAR, fill: accentTint(tpl.accent).replace('#', '') }
        : undefined,
      border:
        divider === 'none' || tpl.band
          ? undefined
          : {
              bottom: {
                style: BorderStyle.SINGLE,
                size: divider === 'thick' ? 12 : 4,
                color: accent,
              },
            },
      children: [
        new TextRun({
          text: tpl.headingCase === 'upper' ? text.toUpperCase() : text,
          bold: true,
          size: sz(22),
          color: accent,
          font,
        }),
      ],
    })
  const body = (
    text: string,
    opts: {
      bold?: boolean
      italic?: boolean
      bullet?: boolean
      after?: number
      keepNext?: boolean
    } = {}
  ) =>
    new Paragraph({
      spacing: { after: opts.after ?? 60, line: lineTwips, lineRule: LineRuleType.AUTO },
      keepNext: opts.keepNext,
      bullet: opts.bullet ? { level: 0 } : undefined,
      indent: opts.bullet ? bulletInd : undefined,
      children: parseInlineMarks(text).map((r) => {
        const run = new TextRun({
          text: r.text,
          bold: opts.bold || r.bold,
          italics: opts.italic || r.italic,
          underline: r.underline ? {} : undefined,
          style: r.href ? 'Hyperlink' : undefined,
          size: sz(21),
          font,
        })
        return r.href ? new ExternalHyperlink({ link: r.href, children: [run] }) : run
      }),
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
      children: [new TextRun({ text: name, bold: true, size: sz(40), font })],
    })
  )
  if (c.title) {
    children.push(
      new Paragraph({
        alignment: headerAlignment,
        spacing: { after: 40 },
        children: [new TextRun({ text: c.title, size: sz(24), color: accent, font })],
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
      if (i > 0) runs.push(new TextRun({ text: '  |  ', size: sz(19), font }))
      runs.push(
        s.url
          ? new ExternalHyperlink({
              link: s.url,
              children: [new TextRun({ text: s.text, size: sz(19), font, style: 'Hyperlink' })],
            })
          : new TextRun({ text: s.text, size: sz(19), font })
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
      children.push(heading(sectionHeading(resume, 'summary')), body(resume.summary.trim(), { after: 100 }))
    } else if (key === 'experience' && resume.experience.some((e) => e.company || e.role)) {
      children.push(heading(sectionHeading(resume, 'experience')))
      for (const g of experienceGroups(resume.experience, resume.groupByCompany === 'on')) {
        if (g.grouped) {
          children.push(
            new Paragraph({
              spacing: { before: 100, after: 20 },
              keepNext: true,
              children: [new TextRun({ text: g.company.trim(), bold: true, size: sz(22), font })],
            })
          )
        }
        for (const e of g.entries) {
          const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ')
          children.push(
            new Paragraph({
              spacing: { before: g.grouped ? 40 : 100, after: 20 },
              keepNext: true,
              tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
              children: [
                new TextRun({ text: e.role || 'Role', bold: true, size: sz(22), font }),
                ...(g.grouped
                  ? e.location
                    ? [new TextRun({ text: `  ·  ${e.location}`, size: sz(21), font })]
                    : []
                  : [
                      new TextRun({
                        text: `  ·  ${e.company}${e.location ? `, ${e.location}` : ''}`,
                        size: sz(21),
                        font,
                      }),
                    ]),
                ...(dates
                  ? [
                      new TextRun({
                        children: [new Tab(), dates],
                        italics: true,
                        size: sz(19),
                        font,
                      }),
                    ]
                  : []),
              ],
            })
          )
          for (const b of e.bullets) {
            if (b.trim()) children.push(body(b.trim(), { bullet: true }))
          }
        }
      }
    } else if (key === 'projects' && resume.projects.some((p) => p.name)) {
      children.push(heading(sectionHeading(resume, 'projects')))
      for (const p of resume.projects) {
        if (!p.name) continue
        const dates = projectDates(p)
        children.push(
          body(`${projectHeadingLine(p)}${dates ? `  (${dates})` : ''}`, {
            bold: true,
            after: 20,
            keepNext: true,
          })
        )
        if (p.description.trim()) children.push(body(p.description.trim(), { after: 80 }))
      }
    } else if (key === 'involvement' && involvementEntries(resume).length > 0) {
      children.push(heading(sectionHeading(resume, 'involvement')))
      for (const i of involvementEntries(resume)) {
        const dates = involvementDates(i)
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            keepNext: true,
            tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
            children: [
              new TextRun({ text: i.role.trim() || 'Role', bold: true, size: sz(22), font }),
              ...(i.organization.trim()
                ? [
                    new TextRun({
                      text: `  ·  ${i.organization.trim()}${i.location.trim() ? `, ${i.location.trim()}` : ''}`,
                      size: sz(21),
                      font,
                    }),
                  ]
                : []),
              ...(dates
                ? [new TextRun({ children: [new Tab(), dates], italics: true, size: sz(19), font })]
                : []),
            ],
          })
        )
        for (const b of involvementBullets(i)) children.push(body(b, { bullet: true }))
      }
    } else if (key === 'education' && resume.education.some((e) => e.school)) {
      children.push(heading(sectionHeading(resume, 'education')))
      for (const e of resume.education) {
        if (!e.school) continue
        const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ')
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 20 },
            keepNext: true,
            tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
            children: [
              new TextRun({ text: e.degree || 'Degree', bold: true, size: sz(21), font }),
              new TextRun({
                text: `  ·  ${e.school}${e.location ? `, ${e.location}` : ''}`,
                size: sz(21),
                font,
              }),
              ...(dates
                ? [new TextRun({ children: [new Tab(), dates], italics: true, size: sz(19), font })]
                : []),
            ],
          })
        )
        const detail = educationDetailLine(e)
        if (detail) children.push(body(detail))
      }
    } else if (key === 'coursework' && courseworkEntries(resume).length > 0) {
      children.push(heading(sectionHeading(resume, 'coursework')))
      for (const cw of courseworkEntries(resume)) {
        const date = cw.date.trim()
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            keepNext: true,
            tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
            children: [
              new TextRun({ text: cw.name.trim() || 'Course', bold: true, size: sz(22), font }),
              ...(cw.institution.trim()
                ? [
                    new TextRun({
                      text: `  ·  ${cw.institution.trim()}`,
                      size: sz(21),
                      font,
                    }),
                  ]
                : []),
              ...(date
                ? [new TextRun({ children: [new Tab(), date], italics: true, size: sz(19), font })]
                : []),
            ],
          })
        )
        for (const b of courseworkBullets(cw)) children.push(body(b, { bullet: true }))
      }
    } else if (key === 'skills' && resume.skills.trim()) {
      children.push(heading(sectionHeading(resume, 'skills')))
      const lines = skillLines(resume)
      lines.forEach((line, i) => {
        const after = i === lines.length - 1 ? 100 : 60
        if (!line.label) {
          children.push(body(line.text, { after }))
          return
        }
        children.push(
          new Paragraph({
            spacing: { after, line: lineTwips, lineRule: LineRuleType.AUTO },
            children: [
              new TextRun({ text: `${line.label}: `, bold: true, size: sz(21), font }),
              new TextRun({ text: line.text, size: sz(21), font }),
            ],
          })
        )
      })
    } else if (
      key === 'certifications' &&
      (certEntries(resume).length > 0 || resume.certifications.trim())
    ) {
      children.push(heading(sectionHeading(resume, 'certifications')))
      for (const c of certEntries(resume)) {
        const date = c.date.trim()
        children.push(
          body(`${certHeadingLine(c)}${date ? `  (${date})` : ''}`, {
            bold: true,
            after: 20,
            keepNext: true,
          })
        )
        if (c.description.trim()) children.push(body(c.description.trim(), { after: 80 }))
      }
      if (resume.certifications.trim())
        children.push(body(resume.certifications.trim(), { after: 100 }))
    } else if (key === 'awards' && awardEntries(resume).length > 0) {
      children.push(heading(sectionHeading(resume, 'awards')))
      for (const a of awardEntries(resume)) {
        const date = a.date.trim()
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            keepNext: true,
            tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
            children: [
              new TextRun({ text: a.name.trim() || 'Award', bold: true, size: sz(22), font }),
              ...(a.organization.trim()
                ? [
                    new TextRun({
                      text: ` — ${a.organization.trim()}`,
                      size: sz(21),
                      font,
                    }),
                  ]
                : []),
              ...(date
                ? [new TextRun({ children: [new Tab(), date], italics: true, size: sz(19), font })]
                : []),
            ],
          })
        )
        for (const b of awardBullets(a)) children.push(body(b, { bullet: true }))
      }
    } else if (key === 'publications' && publicationEntries(resume).length > 0) {
      children.push(heading(sectionHeading(resume, 'publications')))
      for (const p of publicationEntries(resume)) {
        const date = p.date.trim()
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            keepNext: true,
            tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
            children: [
              new TextRun({
                text: p.title.trim() || 'Publication',
                bold: true,
                size: sz(22),
                font,
              }),
              ...(p.venue.trim()
                ? [new TextRun({ text: ` — ${p.venue.trim()}`, size: sz(21), font })]
                : []),
              ...((p.kind ?? '').trim()
                ? [new TextRun({ text: ` (${(p.kind ?? '').trim()})`, italics: true, size: sz(21), font })]
                : []),
              ...(date
                ? [new TextRun({ children: [new Tab(), date], italics: true, size: sz(19), font })]
                : []),
            ],
          })
        )
        for (const b of publicationBullets(p)) children.push(body(b, { bullet: true }))
      }
    } else if (key === 'references' && referenceEntries(resume).length > 0) {
      children.push(heading(sectionHeading(resume, 'references')))
      for (const x of referenceEntries(resume)) {
        const role = [x.title.trim(), x.employer.trim()].filter(Boolean).join(', ')
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            keepNext: true,
            children: [
              new TextRun({ text: x.name.trim(), bold: true, size: sz(22), font }),
              ...(role
                ? [new TextRun({ text: ` — ${role}`, size: sz(21), font })]
                : []),
            ],
          })
        )
        const detail = referenceDetailLine(x)
        if (detail) children.push(body(detail))
      }
    } else if (key === 'military' && militaryEntries(resume).length > 0) {
      children.push(heading(sectionHeading(resume, 'military')))
      for (const m of militaryEntries(resume)) {
        const dates = militaryDates(m)
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            keepNext: true,
            tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
            children: [
              new TextRun({ text: m.rank.trim() || 'Rank', bold: true, size: sz(22), font }),
              ...(m.branch.trim()
                ? [
                    new TextRun({
                      text: `  ·  ${m.branch.trim()}${m.location.trim() ? `, ${m.location.trim()}` : ''}`,
                      size: sz(21),
                      font,
                    }),
                  ]
                : []),
              ...(dates
                ? [new TextRun({ children: [new Tab(), dates], italics: true, size: sz(19), font })]
                : []),
            ],
          })
        )
        for (const b of militaryBullets(m)) children.push(body(b, { bullet: true }))
      }
    } else if (key === 'agents' && agentEntries(resume).length > 0) {
      children.push(heading(sectionHeading(resume, 'agents')))
      for (const a of agentEntries(resume)) {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 20 },
            keepNext: true,
            tabStops: [{ type: TabStopType.RIGHT, position: rightTab }],
            children: [
              new TextRun({ text: a.name.trim(), bold: true, size: sz(22), font }),
              ...(a.date.trim()
                ? [
                    new TextRun({
                      children: [new Tab(), a.date.trim()],
                      italics: true,
                      size: sz(19),
                      font,
                    }),
                  ]
                : []),
            ],
          })
        )
        for (const b of agentBullets(a)) children.push(body(b, { bullet: true }))
      }
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
    styles:
      ink === TEXT_INKS.default
        ? undefined
        : { default: { document: { run: { color: ink.replace('#', '') } } } },
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
      children: [new TextRun({ text: title, bold: true, size: 30, font: FONT_BY_KIND.sans })],
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
              new TextRun({ text: line, size: 22, font: FONT_BY_KIND.sans, break: i > 0 ? 1 : 0 })
          ),
      })
    )
  }
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, filename)
}

/** Letter (cover / resignation) with the sender's letterhead, matching the
 *  resume's template accent, font family and page size. */
export async function downloadLetterDocx(resume: Resume, body: string, filename: string) {
  const tpl = resolveTemplate(resume.templateId, resume.accentColor)
  const font = FONT_BY_KIND[familyOf(resume, tpl.serif)]
  const pageSize = PAGE_TWIPS[resume.pageSize === 'a4' ? 'a4' : 'letter']
  const accent = tpl.accent.replace('#', '')
  const c = resume.contact
  const paragraphs: Paragraph[] = []

  if (c.fullName.trim()) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: c.fullName.trim(), bold: true, size: 30, font })],
      })
    )
  }
  const httpUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`)
  const contactSegments = [
    c.email ? { text: c.email, url: `mailto:${c.email}` } : null,
    c.phone ? { text: c.phone } : null,
    c.location ? { text: c.location } : null,
    c.website ? { text: c.website, url: httpUrl(c.website) } : null,
  ].filter((s): s is { text: string; url?: string } => s !== null)
  if (c.fullName.trim().length > 0 || contactSegments.length > 0) {
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
    paragraphs.push(
      new Paragraph({
        spacing: { after: 240 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: accent },
        },
        children: runs,
      })
    )
  }
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  paragraphs.push(
    new Paragraph({
      spacing: { after: 300 },
      children: [new TextRun({ text: date, size: 21, font })],
    })
  )
  for (const block of body.split(/\n{2,}/)) {
    const t = block.trim()
    if (!t) continue
    paragraphs.push(
      new Paragraph({
        spacing: { after: 200, line: 340 },
        children: t
          .split('\n')
          .map(
            (line, i) =>
              new TextRun({ text: line, size: 22, font, break: i > 0 ? 1 : 0 })
          ),
      })
    )
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
        children: paragraphs,
      },
    ],
  })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, filename)
}
