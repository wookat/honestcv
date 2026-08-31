/**
 * Text-based PDF export via pdf-lib: real selectable/parseable text
 * (never an image), single-column US Letter or A4 layout, template-aware styling.
 */

import { PDFDocument, PDFFont, PDFPage, PDFString, StandardFonts, rgb } from 'pdf-lib'
import { downloadBlob } from '@/lib/download'
import {
  type Resume,
  awardBullets,
  awardEntries,
  awardHeadingLine,
  publicationBullets,
  publicationEntries,
  publicationHeadingLine,
  referenceDetailLine,
  referenceEntries,
  referenceHeadingLine,
  certEntries,
  certHeadingLine,
  courseworkBullets,
  courseworkEntries,
  courseworkHeadingLine,
  involvementBullets,
  involvementDates,
  involvementEntries,
  involvementHeadingLine,
  militaryBullets,
  militaryDates,
  militaryEntries,
  militaryHeadingLine,
  dividerOf,
  educationDetailLine,
  fontScaleOf,
  lineSpacingOf,
  orderedSectionKeys,
  projectDates,
  projectHeadingLine,
  sectionSpacingOf,
  serifOf,
} from '@/lib/resume'
import { accentTint, getTemplate, resolveTemplate, type TemplateMeta } from '@/lib/templates'

const PAGE_SIZES = {
  letter: { w: 612, h: 792 },
  a4: { w: 595.28, h: 841.89 },
} as const
const MARGIN = 54

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

interface Fonts {
  regular: PDFFont
  bold: PDFFont
  italic: PDFFont
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate
    } else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

class PdfWriter {
  doc: PDFDocument
  page: PDFPage
  y: number
  fonts: Fonts
  tpl: TemplateMeta
  accent: ReturnType<typeof rgb>
  ink = rgb(0.12, 0.12, 0.12)
  soft = rgb(0.35, 0.35, 0.35)
  pageW: number
  pageH: number
  contentW: number
  /** Font-size multiplier (user text-size setting) */
  fs = 1
  /** Line-height multiplier (user line-spacing setting) */
  lh = 1.35
  /** Section-spacing multiplier (user sections setting) */
  ss = 1
  /** Section divider rule (user override applied over the template) */
  divider: 'line' | 'thick' | 'none' = 'line'

  constructor(doc: PDFDocument, fonts: Fonts, tpl: TemplateMeta, size: 'letter' | 'a4') {
    this.doc = doc
    this.fonts = fonts
    this.tpl = tpl
    this.accent = hexToRgb(tpl.accent)
    this.pageW = PAGE_SIZES[size].w
    this.pageH = PAGE_SIZES[size].h
    this.contentW = this.pageW - MARGIN * 2
    this.page = doc.addPage([this.pageW, this.pageH])
    this.y = this.pageH - MARGIN
    this.divider = tpl.divider
  }

  ensure(height: number) {
    if (this.y - height < MARGIN) {
      this.page = this.doc.addPage([this.pageW, this.pageH])
      this.y = this.pageH - MARGIN
    }
  }

  text(
    text: string,
    opts: {
      font?: PDFFont
      size?: number
      color?: ReturnType<typeof rgb>
      indent?: number
      lineGap?: number
      center?: boolean
      maxWidth?: number
    } = {}
  ) {
    const font = opts.font ?? this.fonts.regular
    const size = (opts.size ?? 10) * this.fs
    const indent = opts.indent ?? 0
    const maxWidth = opts.maxWidth ?? this.contentW - indent
    const lineHeight = size * this.lh + (opts.lineGap ?? 0)
    for (const line of wrapText(text, font, size, maxWidth)) {
      this.ensure(lineHeight)
      const width = font.widthOfTextAtSize(line, size)
      const x = opts.center ? (this.pageW - width) / 2 : MARGIN + indent
      this.y -= lineHeight
      this.page.drawText(line, {
        x,
        y: this.y,
        size,
        font,
        color: opts.color ?? this.ink,
      })
    }
  }

  gap(h: number) {
    this.y -= h
  }

  /** Entry header: bold left text with right-aligned date on the same
   *  baseline; stacks the date on its own line when the two would collide. */
  titleLine(left: string, right: string, opts: { size?: number } = {}) {
    const size = (opts.size ?? 10.5) * this.fs
    const dateSize = 9 * this.fs
    const rightWidth = right ? this.fonts.italic.widthOfTextAtSize(right, dateSize) : 0
    const leftMax = this.contentW - (right ? rightWidth + 12 : 0)
    if (!right || this.fonts.bold.widthOfTextAtSize(left, size) > leftMax) {
      this.text(left, { font: this.fonts.bold, size: size / this.fs })
      if (right) {
        this.gap(1)
        this.text(right, { font: this.fonts.italic, size: dateSize / this.fs, color: this.soft })
      }
      return
    }
    const lineHeight = size * this.lh
    this.ensure(lineHeight)
    this.y -= lineHeight
    this.page.drawText(left, {
      x: MARGIN,
      y: this.y,
      size,
      font: this.fonts.bold,
      color: this.ink,
    })
    this.page.drawText(right, {
      x: this.pageW - MARGIN - rightWidth,
      y: this.y,
      size: dateSize,
      font: this.fonts.italic,
      color: this.soft,
    })
  }

  /** One line of segments where some are clickable links; falls back to plain
   *  wrapped text when the line is too wide for link geometry. */
  linkLine(
    segments: { text: string; url?: string }[],
    opts: { size?: number; color?: ReturnType<typeof rgb>; center?: boolean } = {}
  ) {
    const font = this.fonts.regular
    const size = (opts.size ?? 9) * this.fs
    const sep = '  |  '
    const full = segments.map((s) => s.text).join(sep)
    const totalWidth = font.widthOfTextAtSize(full, size)
    if (totalWidth > this.contentW) {
      this.text(full, { size: size / this.fs, color: opts.color, center: opts.center })
      return
    }
    const lineHeight = size * this.lh
    this.ensure(lineHeight)
    this.y -= lineHeight
    let x = opts.center ? (this.pageW - totalWidth) / 2 : MARGIN
    segments.forEach((s, i) => {
      const withSep = i < segments.length - 1 ? s.text + sep : s.text
      this.page.drawText(s.text, {
        x,
        y: this.y,
        size,
        font,
        color: opts.color ?? this.ink,
      })
      if (s.url) {
        const w = font.widthOfTextAtSize(s.text, size)
        const annot = this.doc.context.register(
          this.doc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [x, this.y - 2, x + w, this.y + size + 2],
            Border: [0, 0, 0],
            A: { Type: 'Action', S: 'URI', URI: PDFString.of(s.url) },
          })
        )
        this.page.node.addAnnot(annot)
      }
      x += font.widthOfTextAtSize(withSep, size)
    })
  }

  heading(label: string) {
    const text = this.tpl.headingCase === 'upper' ? label.toUpperCase() : label
    // heading + divider + first content line, so a heading never sits
    // alone at the bottom of a page
    this.ensure(52)
    this.gap(10 * this.ss)
    if (this.tpl.band) {
      const size = 11 * this.fs
      const bandH = size * this.lh + 6
      this.ensure(bandH)
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - bandH,
        width: this.contentW,
        height: bandH,
        color: hexToRgb(accentTint(this.tpl.accent)),
      })
      this.y -= size * this.lh + 3
      this.page.drawText(text, {
        x: MARGIN + 6,
        y: this.y,
        size,
        font: this.fonts.bold,
        color: this.accent,
      })
      this.y -= 3
      this.gap(5)
      return
    }
    this.text(text, { font: this.fonts.bold, size: 11, color: this.accent })
    if (this.divider !== 'none') {
      const thickness = this.divider === 'thick' ? 2 : 0.75
      this.gap(3)
      this.page.drawLine({
        start: { x: MARGIN, y: this.y },
        end: { x: this.pageW - MARGIN, y: this.y },
        thickness,
        color: this.accent,
      })
      this.gap(6)
    } else {
      this.gap(4)
    }
  }

  bullet(text: string) {
    const size = 10 * this.fs
    const font = this.fonts.regular
    const indent = 14
    const lines = wrapText(text, font, size, this.contentW - indent)
    const lineHeight = size * this.lh
    lines.forEach((line, i) => {
      this.ensure(lineHeight)
      this.y -= lineHeight
      if (i === 0) {
        this.page.drawText('•', {
          x: MARGIN + 2,
          y: this.y,
          size,
          font,
          color: this.accent,
        })
      }
      this.page.drawText(line, { x: MARGIN + indent, y: this.y, size, font, color: this.ink })
    })
    this.gap(2)
  }
}

async function composeResumePdf(resume: Resume): Promise<PDFDocument> {
  const tpl = resolveTemplate(resume.templateId, resume.accentColor)
  const doc = await PDFDocument.create()
  const fonts: Fonts = serifOf(resume, tpl.serif)
    ? {
        regular: await doc.embedFont(StandardFonts.TimesRoman),
        bold: await doc.embedFont(StandardFonts.TimesRomanBold),
        italic: await doc.embedFont(StandardFonts.TimesRomanItalic),
      }
    : {
        regular: await doc.embedFont(StandardFonts.Helvetica),
        bold: await doc.embedFont(StandardFonts.HelveticaBold),
        italic: await doc.embedFont(StandardFonts.HelveticaOblique),
      }
  const w = new PdfWriter(doc, fonts, tpl, resume.pageSize === 'a4' ? 'a4' : 'letter')
  w.fs = fontScaleOf(resume)
  w.lh = lineSpacingOf(resume)
  w.ss = sectionSpacingOf(resume)
  w.divider = dividerOf(resume, tpl.divider)
  const c = resume.contact

  const centerHeader = tpl.headerAlign !== 'left'
  const name =
    tpl.nameCase === 'upper'
      ? (c.fullName || 'Your Name').toUpperCase()
      : c.fullName || 'Your Name'
  w.text(name, { font: fonts.bold, size: 22, center: centerHeader })
  if (c.title) {
    w.gap(2)
    w.text(c.title, { size: 12, color: w.accent, center: centerHeader })
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
    w.gap(2)
    w.linkLine(contactSegments, { size: 9, color: w.soft, center: centerHeader })
  }
  w.gap(6)

  for (const key of orderedSectionKeys(resume)) {
    if (key === 'summary' && resume.summary.trim()) {
      w.heading('Summary')
      w.text(resume.summary.trim(), { size: 10 })
    } else if (key === 'experience' && resume.experience.some((e) => e.company || e.role)) {
      w.heading('Experience')
      for (const e of resume.experience) {
        if (!e.company && !e.role) continue
        w.gap(4)
        w.ensure(34) // keep the entry header with its first bullet
        const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ')
        const left = `${e.role || 'Role'}  ·  ${e.company}${e.location ? `, ${e.location}` : ''}`
        w.titleLine(left, dates, { size: 10.5 })
        w.gap(2)
        for (const b of e.bullets) if (b.trim()) w.bullet(b.trim())
      }
    } else if (key === 'projects' && resume.projects.some((p) => p.name)) {
      w.heading('Projects')
      for (const p of resume.projects) {
        if (!p.name) continue
        w.gap(2)
        w.ensure(30) // keep the project name with its description
        w.titleLine(projectHeadingLine(p), projectDates(p), { size: 10 })
        if (p.description.trim()) {
          w.gap(1)
          w.text(p.description.trim(), { size: 10 })
        }
      }
    } else if (key === 'involvement' && involvementEntries(resume).length > 0) {
      w.heading('Involvement')
      for (const i of involvementEntries(resume)) {
        w.gap(4)
        w.ensure(34)
        w.titleLine(involvementHeadingLine(i), involvementDates(i), { size: 10.5 })
        w.gap(2)
        for (const b of involvementBullets(i)) w.bullet(b)
      }
    } else if (key === 'education' && resume.education.some((e) => e.school)) {
      w.heading('Education')
      for (const e of resume.education) {
        if (!e.school) continue
        w.gap(2)
        w.ensure(34)
        const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ')
        w.titleLine(
          `${e.degree || 'Degree'}  ·  ${e.school}${e.location ? `, ${e.location}` : ''}`,
          dates,
          { size: 10 }
        )
        const detail = educationDetailLine(e)
        if (detail) {
          w.gap(1)
          w.text(detail, { size: 10 })
        }
      }
    } else if (key === 'coursework' && courseworkEntries(resume).length > 0) {
      w.heading('Coursework')
      for (const cw of courseworkEntries(resume)) {
        w.gap(4)
        w.ensure(34)
        w.titleLine(courseworkHeadingLine(cw), cw.date.trim(), { size: 10.5 })
        w.gap(2)
        for (const b of courseworkBullets(cw)) w.bullet(b)
      }
    } else if (key === 'skills' && resume.skills.trim()) {
      w.heading('Skills')
      w.text(resume.skills.trim(), { size: 10 })
    } else if (
      key === 'certifications' &&
      (certEntries(resume).length > 0 || resume.certifications.trim())
    ) {
      w.heading('Certifications')
      for (const c of certEntries(resume)) {
        w.gap(2)
        w.ensure(30)
        w.titleLine(certHeadingLine(c), c.date.trim(), { size: 10 })
        if (c.description.trim()) {
          w.gap(1)
          w.text(c.description.trim(), { size: 10 })
        }
      }
      if (resume.certifications.trim()) {
        w.gap(2)
        w.text(resume.certifications.trim(), { size: 10 })
      }
    } else if (key === 'awards' && awardEntries(resume).length > 0) {
      w.heading('Awards & Honors')
      for (const a of awardEntries(resume)) {
        w.gap(4)
        w.ensure(34)
        w.titleLine(awardHeadingLine(a), a.date.trim(), { size: 10.5 })
        w.gap(2)
        for (const b of awardBullets(a)) w.bullet(b)
      }
    } else if (key === 'publications' && publicationEntries(resume).length > 0) {
      w.heading('Publications')
      for (const p of publicationEntries(resume)) {
        w.gap(4)
        w.ensure(34)
        w.titleLine(publicationHeadingLine(p), p.date.trim(), { size: 10.5 })
        w.gap(2)
        for (const b of publicationBullets(p)) w.bullet(b)
      }
    } else if (key === 'references' && referenceEntries(resume).length > 0) {
      w.heading('References')
      for (const x of referenceEntries(resume)) {
        w.gap(4)
        w.ensure(34)
        w.titleLine(referenceHeadingLine(x), '', { size: 10.5 })
        const detail = referenceDetailLine(x)
        if (detail) {
          w.gap(2)
          w.text(detail, { size: 10 })
        }
      }
    } else if (key === 'military' && militaryEntries(resume).length > 0) {
      w.heading('Military service')
      for (const m of militaryEntries(resume)) {
        w.gap(4)
        w.ensure(34)
        w.titleLine(militaryHeadingLine(m), militaryDates(m), { size: 10.5 })
        w.gap(2)
        for (const b of militaryBullets(m)) w.bullet(b)
      }
    } else if (key.startsWith('custom:')) {
      const s = resume.customSections.find((x) => `custom:${x.id}` === key)
      if (!s || (!s.title.trim() && !s.bullets.some((b) => b.trim()))) continue
      w.heading(s.title.trim() || 'Additional')
      for (const b of s.bullets) if (b.trim()) w.bullet(b.trim())
    }
  }

  return doc
}

export async function buildResumePdf(resume: Resume): Promise<Uint8Array> {
  return (await composeResumePdf(resume)).save()
}

/** Page count of the exported PDF — drives the page indicator in the builder. */
export async function countResumePdfPages(resume: Resume): Promise<number> {
  return (await composeResumePdf(resume)).getPageCount()
}

export async function downloadResumePdf(resume: Resume, filename: string) {
  const bytes = await buildResumePdf(resume)
  downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), filename)
}

/** Generic text PDF (cover letter / interview brief) */
export async function downloadTextPdf(title: string, text: string, filename: string) {
  const doc = await PDFDocument.create()
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  }
  const tpl = getTemplate('modern')
  const w = new PdfWriter(doc, fonts, tpl, 'letter')
  w.text(title, { font: fonts.bold, size: 16 })
  w.gap(10)
  for (const block of text.split(/\n{2,}/)) {
    const t = block.trim()
    if (!t) continue
    for (const line of t.split('\n')) {
      w.text(line, { size: 10.5, lineGap: 1 })
    }
    w.gap(8)
  }
  const bytes = await doc.save()
  downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), filename)
}

/** Letter (cover / resignation) with the sender's letterhead, matching the
 *  resume's template accent, font family and page size. */
export async function downloadLetterPdf(resume: Resume, body: string, filename: string) {
  const tpl = resolveTemplate(resume.templateId, resume.accentColor)
  const doc = await PDFDocument.create()
  const fonts: Fonts = serifOf(resume, tpl.serif)
    ? {
        regular: await doc.embedFont(StandardFonts.TimesRoman),
        bold: await doc.embedFont(StandardFonts.TimesRomanBold),
        italic: await doc.embedFont(StandardFonts.TimesRomanItalic),
      }
    : {
        regular: await doc.embedFont(StandardFonts.Helvetica),
        bold: await doc.embedFont(StandardFonts.HelveticaBold),
        italic: await doc.embedFont(StandardFonts.HelveticaOblique),
      }
  const w = new PdfWriter(doc, fonts, tpl, resume.pageSize === 'a4' ? 'a4' : 'letter')
  const c = resume.contact
  if (c.fullName.trim()) {
    w.text(c.fullName.trim(), { font: fonts.bold, size: 16 })
    w.gap(2)
  }
  const httpUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`)
  const contactSegments = [
    c.email ? { text: c.email, url: `mailto:${c.email}` } : null,
    c.phone ? { text: c.phone } : null,
    c.location ? { text: c.location } : null,
    c.website ? { text: c.website, url: httpUrl(c.website) } : null,
  ].filter((s): s is { text: string; url?: string } => s !== null)
  if (contactSegments.length > 0) {
    w.linkLine(contactSegments, { size: 9, color: w.soft })
  }
  if (c.fullName.trim() || contactSegments.length > 0) {
    w.gap(6)
    w.page.drawLine({
      start: { x: MARGIN, y: w.y },
      end: { x: w.pageW - MARGIN, y: w.y },
      thickness: 1,
      color: w.accent,
    })
    w.gap(14)
  }
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  w.text(date, { size: 10.5, color: w.soft })
  w.gap(12)
  for (const block of body.split(/\n{2,}/)) {
    const t = block.trim()
    if (!t) continue
    for (const line of t.split('\n')) {
      w.text(line, { size: 10.5, lineGap: 1 })
    }
    w.gap(8)
  }
  const bytes = await doc.save()
  downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), filename)
}
