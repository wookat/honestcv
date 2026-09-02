/**
 * Text-based PDF export via pdf-lib: real selectable/parseable text
 * (never an image), single-column US Letter or A4 layout, template-aware styling.
 */

import { PDFDocument, PDFFont, PDFPage, PDFString, StandardFonts, rgb } from '@cantoo/pdf-lib'
import * as fontkit from 'fontkit'
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
  sectionSpacingOf,
  sectionHeading,
  skillLines,
  bulletIndentOf,
  contactIconsOf,
  experienceDateRange,
  familyOf,
  textInkOf,
  type FontFamilyKind,
} from '@/lib/resume'
import { CONTACT_ICON_PATHS, type ContactIconKind } from '@/lib/contactIcons'
import { type InlineRun, hasInlineMarks, parseInlineMarks } from '@/lib/marks'
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

/**
 * Width of text as pdf-lib actually draws it. `widthOfTextAtSize` applies AFM
 * kern pairs for standard fonts while `drawText` emits un-kerned advances, so
 * wide lines render several points wider than measured; the per-character sum
 * matches the drawn advances for standard fonts, and embedded fonts measure
 * whole-string exactly, so the max of the two is correct for both.
 */
function drawnWidth(font: PDFFont, text: string, size: number): number {
  let sum = 0
  for (const ch of text) sum += font.widthOfTextAtSize(ch, size)
  return Math.max(sum, font.widthOfTextAtSize(text, size))
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (drawnWidth(font, candidate, size) <= maxWidth) {
      line = candidate
    } else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

interface RunWord {
  text: string
  font: PDFFont
  underline: boolean
  href?: string
  /** Continues the previous word with no whitespace between them in the source. */
  glue: boolean
}

/** Greedy word wrap across mixed-font runs; returns lines of styled words.
 *  Adjacent runs with no whitespace between them (e.g. an underlined word
 *  followed by punctuation) stay glued: no space is drawn between them and
 *  the pair wraps as a single unit. */
function wrapRuns(runs: InlineRun[], fonts: Fonts, size: number, maxWidth: number): RunWord[][] {
  const words: RunWord[] = []
  let pendingGlue = false
  for (const run of runs) {
    if (!run.text) continue
    const font = run.bold ? fonts.bold : run.italic ? fonts.italic : fonts.regular
    const startsWithSpace = /^\s/.test(run.text)
    run.text
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w, i) => {
        words.push({
          text: w,
          font,
          underline: run.underline,
          href: run.href,
          glue: i === 0 && !startsWithSpace && pendingGlue && words.length > 0,
        })
      })
    pendingGlue = !/\s$/.test(run.text)
  }
  // Wrap by cluster (a word plus its glued followers) so glued pairs never split.
  const clusters: RunWord[][] = []
  for (const w of words) {
    if (w.glue && clusters.length) clusters[clusters.length - 1].push(w)
    else clusters.push([w])
  }
  const spaceW = (f: PDFFont) => drawnWidth(f, ' ', size)
  const lines: RunWord[][] = []
  let line: RunWord[] = []
  let lineW = 0
  for (const cluster of clusters) {
    const clusterW = cluster.reduce((acc, w) => acc + drawnWidth(w.font, w.text, size), 0)
    const addW = line.length ? spaceW(cluster[0].font) + clusterW : clusterW
    if (line.length && lineW + addW > maxWidth) {
      lines.push(line)
      line = cluster.map((w, i) => (i === 0 ? { ...w, glue: false } : w))
      lineW = clusterW
    } else {
      line.push(...cluster.map((w, i) => (i === 0 && !line.length ? { ...w, glue: false } : w)))
      lineW += addW
    }
  }
  if (line.length) lines.push(line)
  return lines.length ? lines : [[]]
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
  /** Left edge of section content (moves right of the label gutter for sideLabels templates) */
  x0: number = MARGIN
  /** Font-size multiplier (user text-size setting) */
  fs = 1
  /** Line-height multiplier (user line-spacing setting) */
  lh = 1.35
  /** Section-spacing multiplier (user sections setting) */
  ss = 1
  /** Section divider rule (user override applied over the template) */
  divider: 'line' | 'thick' | 'none' = 'line'
  /** Extra left indent (pt) applied to bullet lists */
  bi = 0

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
      const width = drawnWidth(font, line, size)
      const x = opts.center ? (this.pageW - width) / 2 : this.x0 + indent
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

  /** Line with a bold "Label:" prefix; the rest wraps at the left margin. */
  labelledLine(label: string, rest: string, opts: { size?: number } = {}) {
    const size = (opts.size ?? 10) * this.fs
    const prefix = `${label}: `
    const prefixW = drawnWidth(this.fonts.bold, prefix, size)
    const lineHeight = size * this.lh
    const restLines = wrapText(rest, this.fonts.regular, size, this.contentW - prefixW)
    this.ensure(lineHeight)
    this.y -= lineHeight
    this.page.drawText(prefix, {
      x: this.x0,
      y: this.y,
      size,
      font: this.fonts.bold,
      color: this.ink,
    })
    this.page.drawText(restLines[0], {
      x: this.x0 + prefixW,
      y: this.y,
      size,
      font: this.fonts.regular,
      color: this.ink,
    })
    if (restLines.length > 1)
      this.text(restLines.slice(1).join(' '), { size: size / this.fs })
  }

  gap(h: number) {
    this.y -= h
  }

  /** Entry header: bold left text with right-aligned date on the same
   *  baseline; stacks the date on its own line when the two would collide. */
  titleLine(left: string, right: string, opts: { size?: number } = {}) {
    const size = (opts.size ?? 10.5) * this.fs
    const dateSize = 9 * this.fs
    const rightWidth = right ? drawnWidth(this.fonts.italic, right, dateSize) : 0
    const leftMax = this.contentW - (right ? rightWidth + 12 : 0)
    if (!right || drawnWidth(this.fonts.bold, left, size) > leftMax) {
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
      x: this.x0,
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
   *  wrapped text when the line is too wide for link geometry. With `icons`,
   *  each segment is prefixed by a small stroke icon instead of separators. */
  linkLine(
    segments: { text: string; url?: string; icon?: ContactIconKind }[],
    opts: {
      size?: number
      color?: ReturnType<typeof rgb>
      center?: boolean
      icons?: boolean
    } = {}
  ) {
    const font = this.fonts.regular
    const size = (opts.size ?? 9) * this.fs
    const sep = '  |  '
    const useIcons = opts.icons === true
    const iconSize = size * 0.82
    const iconGap = size * 0.28
    const segGap = size * 0.9
    const segW = (s: { text: string; icon?: ContactIconKind }) =>
      (useIcons && s.icon ? iconSize + iconGap : 0) + drawnWidth(font, s.text, size)
    const totalWidth = useIcons
      ? segments.reduce((a, s) => a + segW(s), 0) + segGap * (segments.length - 1)
      : drawnWidth(font, segments.map((s) => s.text).join(sep), size)
    if (totalWidth > this.contentW) {
      const full = segments.map((s) => s.text).join(sep)
      this.text(full, { size: size / this.fs, color: opts.color, center: opts.center })
      return
    }
    const lineHeight = size * this.lh
    this.ensure(lineHeight)
    this.y -= lineHeight
    let x = opts.center ? (this.pageW - totalWidth) / 2 : this.x0
    segments.forEach((s, i) => {
      const segStart = x
      if (useIcons && s.icon) {
        this.page.drawSvgPath(CONTACT_ICON_PATHS[s.icon], {
          x,
          y: this.y + size * 0.75,
          scale: iconSize / 24,
          borderColor: opts.color ?? this.ink,
          borderWidth: 0.75,
        })
        x += iconSize + iconGap
      }
      this.page.drawText(s.text, {
        x,
        y: this.y,
        size,
        font,
        color: opts.color ?? this.ink,
      })
      const textW = drawnWidth(font, s.text, size)
      if (s.url) {
        const annot = this.doc.context.register(
          this.doc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [segStart, this.y - 2, x + textW, this.y + size + 2],
            Border: [0, 0, 0],
            A: { Type: 'Action', S: 'URI', URI: PDFString.of(s.url) },
          })
        )
        this.page.node.addAnnot(annot)
      }
      x += textW
      if (i < segments.length - 1)
        x += useIcons ? segGap : drawnWidth(font, sep, size)
    })
  }

  heading(label: string) {
    const text = this.tpl.headingCase === 'upper' ? label.toUpperCase() : label
    // heading + divider + first content line, so a heading never sits
    // alone at the bottom of a page
    this.ensure(52)
    this.gap(10 * this.ss)
    if (this.tpl.sideLabels && this.x0 > MARGIN) {
      // Label drawn in the left gutter on the first content baseline; it
      // consumes no vertical space — content flows beside it at x0.
      const gutterW = this.x0 - MARGIN - 10
      let size = 10 * this.fs
      while (size > 7 && drawnWidth(this.fonts.bold, text, size) > gutterW) size -= 0.5
      this.page.drawText(text, {
        x: MARGIN,
        y: this.y - size * this.lh,
        size,
        font: this.fonts.bold,
        color: this.accent,
      })
      return
    }
    if (this.tpl.band) {
      const size = 11 * this.fs
      const bandH = size * this.lh + 6
      this.ensure(bandH)
      this.page.drawRectangle({
        x: this.x0,
        y: this.y - bandH,
        width: this.contentW,
        height: bandH,
        color: hexToRgb(accentTint(this.tpl.accent)),
      })
      this.y -= size * this.lh + 3
      this.page.drawText(text, {
        x: this.x0 + 6,
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
        start: { x: this.x0, y: this.y },
        end: { x: this.pageW - MARGIN, y: this.y },
        thickness,
        color: this.accent,
      })
      this.gap(6)
    } else {
      this.gap(4)
    }
  }

  /** Light hairline between entries (templates with entryDivider) */
  entryRule() {
    this.ensure(10)
    this.gap(4)
    this.page.drawLine({
      start: { x: this.x0, y: this.y },
      end: { x: this.pageW - MARGIN, y: this.y },
      thickness: 0.5,
      color: hexToRgb('#d4d4d4'),
    })
    this.gap(2)
  }

  bullet(text: string) {
    const size = 10 * this.fs
    const font = this.fonts.regular
    const indent = 14 + this.bi
    const lineHeight = size * this.lh
    const marker = (first: boolean) => {
      if (!first) return
      this.page.drawText('•', {
        x: this.x0 + 2 + this.bi,
        y: this.y,
        size,
        font,
        color: this.accent,
      })
    }
    if (hasInlineMarks(text)) {
      this.drawRuns(text, size, indent, marker)
      this.gap(2)
      return
    }
    const lines = wrapText(text, font, size, this.contentW - indent)
    lines.forEach((line, i) => {
      this.ensure(lineHeight)
      this.y -= lineHeight
      marker(i === 0)
      this.page.drawText(line, { x: this.x0 + indent, y: this.y, size, font, color: this.ink })
    })
    this.gap(2)
  }

  /** Paragraph text with inline marks (bold/italic/underline/links). */
  richText(
    text: string,
    size = 10 * this.fs,
    opts: { fonts?: Fonts; color?: ReturnType<typeof rgb>; gap?: number } = {}
  ) {
    this.drawRuns(text, size, 0, () => {}, opts)
    this.gap(opts.gap ?? 2)
  }

  private drawRuns(
    text: string,
    size: number,
    indent: number,
    marker: (first: boolean) => void,
    opts: { fonts?: Fonts; color?: ReturnType<typeof rgb> } = {}
  ) {
    const ink = opts.color ?? this.ink
    const lineHeight = size * this.lh
    const lines = wrapRuns(parseInlineMarks(text), opts.fonts ?? this.fonts, size, this.contentW - indent)
    lines.forEach((words, i) => {
      this.ensure(lineHeight)
      this.y -= lineHeight
      marker(i === 0)
      let x = this.x0 + indent
        words.forEach((w, j) => {
          const spaceW = j > 0 && !w.glue ? drawnWidth(w.font, ' ', size) : 0
          x += spaceW
          this.page.drawText(w.text, {
            x,
            y: this.y,
            size,
            font: w.font,
            color: w.href ? this.accent : ink,
          })
          const wordW = drawnWidth(w.font, w.text, size)
          if (w.underline || w.href) {
            const joinPrev = j > 0 && (words[j - 1].underline || !!words[j - 1].href)
            this.page.drawLine({
              start: { x: joinPrev ? x - spaceW : x, y: this.y - 1.5 },
              end: { x: x + wordW, y: this.y - 1.5 },
              thickness: 0.5,
              color: w.href ? this.accent : ink,
            })
          }
          if (w.href) {
            const joinPrev = j > 0 && words[j - 1].href === w.href
            const annot = this.doc.context.register(
              this.doc.context.obj({
                Type: 'Annot',
                Subtype: 'Link',
                Rect: [joinPrev ? x - spaceW : x, this.y - 2, x + wordW, this.y + size + 2],
                Border: [0, 0, 0],
                A: { Type: 'Action', S: 'URI', URI: PDFString.of(w.href) },
              })
            )
            this.page.node.addAnnot(annot)
          }
          x += wordW
        })
    })
  }
}

const STANDARD_FONTS_BY_KIND = {
  serif: {
    regular: StandardFonts.TimesRoman,
    bold: StandardFonts.TimesRomanBold,
    italic: StandardFonts.TimesRomanItalic,
  },
  sans: {
    regular: StandardFonts.Helvetica,
    bold: StandardFonts.HelveticaBold,
    italic: StandardFonts.HelveticaOblique,
  },
  mono: {
    regular: StandardFonts.Courier,
    bold: StandardFonts.CourierBold,
    italic: StandardFonts.CourierOblique,
  },
} as const

const WEB_FONT_FILES = {
  merriweather: {
    regular: '/fonts/merriweather-regular.ttf',
    bold: '/fonts/merriweather-bold.ttf',
    italic: '/fonts/merriweather-italic.ttf',
  },
  sourcesans: {
    regular: '/fonts/sourcesans3-regular.ttf',
    bold: '/fonts/sourcesans3-bold.ttf',
    italic: '/fonts/sourcesans3-italic.ttf',
  },
  robotomono: {
    regular: '/fonts/robotomono-regular.ttf',
    bold: '/fonts/robotomono-bold.ttf',
    italic: '/fonts/robotomono-italic.ttf',
  },
} as const

const isWebFamily = (f: FontFamilyKind): f is keyof typeof WEB_FONT_FILES =>
  f === 'merriweather' || f === 'sourcesans' || f === 'robotomono'

/** Wide-coverage fallback face (Latin, Greek, Cyrillic, CJK, kana) for text
 *  the WinAnsi-bound standard/Latin faces cannot encode. CJK has no italic,
 *  so italic maps to regular. */
const UNICODE_FONT_FILES = {
  regular: '/fonts/notosanssc-regular.ttf',
  bold: '/fonts/notosanssc-bold.ttf',
} as const

// Characters WinAnsi (cp1252) can encode beyond printable ASCII and Latin-1.
const WINANSI_EXTRAS =
  '\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178'

/** True when any character falls outside the WinAnsi repertoire, meaning the
 *  standard and Latin web fonts would throw on encode. */
export function needsUnicodeFont(text: string): boolean {
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp === 0x09 || cp === 0x0a || cp === 0x0d) continue
    if (cp >= 0x20 && cp <= 0x7e) continue
    if (cp >= 0xa0 && cp <= 0xff) continue
    if (WINANSI_EXTRAS.includes(ch)) continue
    return true
  }
  return false
}

const resumeFontProbe = (resume: Resume): string =>
  JSON.stringify({ ...resume, photo: undefined })

async function embedUnicodeFonts(doc: PDFDocument, probe: string): Promise<Fonts> {
  doc.registerFontkit(fontkit)
  const [regularBytes, boldBytes] = await Promise.all([
    fetchFontBytes(UNICODE_FONT_FILES.regular),
    fetchFontBytes(UNICODE_FONT_FILES.bold),
  ])
  assertFontCoverage(regularBytes, probe)
  const regular = await doc.embedFont(regularBytes, { subset: true })
  const bold = await doc.embedFont(boldBytes, { subset: true })
  return { regular, bold, italic: regular }
}

/** Fail with a clear message instead of emitting invisible .notdef boxes when
 *  the fallback face lacks glyphs for some of the document's characters. */
function assertFontCoverage(fontBytes: Uint8Array, probe: string) {
  // @types/fontkit demands a Node Buffer, but fontkit itself accepts any Uint8Array.
  const create = fontkit.create as unknown as (b: Uint8Array) => {
    hasGlyphForCodePoint(cp: number): boolean
  }
  const face = create(fontBytes)
  const missing = new Set<string>()
  for (const ch of probe) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0xa0) continue
    if (!face.hasGlyphForCodePoint(cp)) missing.add(ch)
  }
  if (missing.size > 0) {
    const sample = [...missing].slice(0, 8).join(' ')
    throw new Error(
      `PDF export does not support some characters in this document yet: ${sample}${missing.size > 8 ? ' \u2026' : ''}. DOCX, TXT and Markdown exports support all characters.`
    )
  }
}

async function fetchFontBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load font ${url}: ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

async function embedFontsFor(
  doc: PDFDocument,
  resume: Resume,
  tplSerif: boolean,
  extraProbe = ''
): Promise<Fonts> {
  const probe = resumeFontProbe(resume) + extraProbe
  if (needsUnicodeFont(probe)) return embedUnicodeFonts(doc, probe)
  const family = familyOf(resume, tplSerif)
  if (isWebFamily(family)) {
    doc.registerFontkit(fontkit)
    const files = WEB_FONT_FILES[family]
    const [regular, bold, italic] = await Promise.all([
      fetchFontBytes(files.regular),
      fetchFontBytes(files.bold),
      fetchFontBytes(files.italic),
    ])
    return {
      regular: await doc.embedFont(regular, { subset: true }),
      bold: await doc.embedFont(bold, { subset: true }),
      italic: await doc.embedFont(italic, { subset: true }),
    }
  }
  const kind = STANDARD_FONTS_BY_KIND[family]
  return {
    regular: await doc.embedFont(kind.regular),
    bold: await doc.embedFont(kind.bold),
    italic: await doc.embedFont(kind.italic),
  }
}

async function composeResumePdf(resume: Resume): Promise<{ doc: PDFDocument; w: PdfWriter }> {
  const tpl = resolveTemplate(resume.templateId, resume.accentColor)
  const doc = await PDFDocument.create()
  const fonts: Fonts = await embedFontsFor(doc, resume, tpl.serif)
  const w = new PdfWriter(doc, fonts, tpl, resume.pageSize === 'a4' ? 'a4' : 'letter')
  w.ink = hexToRgb(textInkOf(resume))
  w.fs = fontScaleOf(resume)
  w.lh = lineSpacingOf(resume)
  w.ss = sectionSpacingOf(resume)
  w.bi = bulletIndentOf(resume) ? 9 : 0
  w.divider = dividerOf(resume, tpl.divider)
  const c = resume.contact

  if (resume.photo) {
    try {
      const bytes = Uint8Array.from(atob(resume.photo.split(',')[1] ?? ''), (ch) =>
        ch.charCodeAt(0)
      )
      const image = resume.photo.startsWith('data:image/png')
        ? await doc.embedPng(bytes)
        : await doc.embedJpg(bytes)
      const size = 48
      w.page.drawImage(image, {
        x: w.pageW - MARGIN - size,
        y: w.pageH - MARGIN - size,
        width: size,
        height: size,
      })
    } catch {
      // unreadable image data — render the resume without the photo
    }
  }

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
  type ContactSegment = { text: string; url?: string; icon: ContactIconKind }
  const rawSegments: (ContactSegment | null)[] = [
    c.email ? { text: c.email, url: `mailto:${c.email}`, icon: 'mail' } : null,
    c.phone ? { text: c.phone, icon: 'phone' } : null,
    c.location ? { text: c.location, icon: 'pin' } : null,
    c.website ? { text: c.website, url: httpUrl(c.website), icon: 'globe' } : null,
    c.linkedin ? { text: c.linkedin, url: httpUrl(c.linkedin), icon: 'linkedin' } : null,
  ]
  const contactSegments = rawSegments.filter((s): s is ContactSegment => s !== null)
  if (contactSegments.length > 0) {
    w.gap(2)
    w.linkLine(contactSegments, {
      size: 9,
      color: w.soft,
      center: centerHeader,
      icons: contactIconsOf(resume),
    })
  }
  w.gap(6)

  if (tpl.sideLabels) {
    // Header spans the full width; section content flows right of the label gutter
    w.x0 = MARGIN + 96
    w.contentW = w.pageW - MARGIN - w.x0
  }

  const entryRule = (i: number) => {
    if (tpl.entryDivider && i > 0) w.entryRule()
  }

  /** Section body text: parses inline marks, plain text otherwise. */
  const bodyText = (t: string) => {
    if (hasInlineMarks(t)) w.richText(t)
    else w.text(t, { size: 10 })
  }

  for (const key of orderedSectionKeys(resume)) {
    if (key === 'summary' && resume.summary.trim()) {
      w.heading(sectionHeading(resume, 'summary'))
      bodyText(resume.summary.trim())
    } else if (key === 'experience' && resume.experience.some((e) => e.company || e.role)) {
      w.heading(sectionHeading(resume, 'experience'))
      let gi = 0
      for (const g of experienceGroups(resume.experience, resume.groupByCompany === 'on')) {
        entryRule(gi++)
        if (g.grouped) {
          w.gap(4)
          w.ensure(34)
          w.titleLine(g.company.trim(), '', { size: 10.5 })
        }
        let ei = 0
        for (const e of g.entries) {
          if (g.grouped) entryRule(ei++)
          w.gap(g.grouped ? 2 : 4)
          w.ensure(34) // keep the entry header with its first bullet
          const dates = experienceDateRange(e.startDate, e.endDate)
          const left = g.grouped
            ? `${e.role || 'Role'}${e.location ? `  ·  ${e.location}` : ''}`
            : `${e.role || 'Role'}  ·  ${e.company}${e.location ? `, ${e.location}` : ''}`
          w.titleLine(left, dates, { size: 10.5 })
          if (e.companyInfo?.trim()) {
            w.gap(1)
            const info = e.companyInfo.trim()
            if (hasInlineMarks(info))
              w.richText(info, 9 * w.fs, {
                fonts: { ...w.fonts, regular: w.fonts.italic },
                color: w.soft,
                gap: 0,
              })
            else w.text(info, { font: w.fonts.italic, size: 9, color: w.soft })
          }
          w.gap(2)
          for (const b of e.bullets) if (b.trim()) w.bullet(b.trim())
        }
      }
    } else if (key === 'projects' && resume.projects.some((p) => p.name)) {
      w.heading(sectionHeading(resume, 'projects'))
      let pi = 0
      for (const p of resume.projects) {
        if (!p.name) continue
        entryRule(pi++)
        w.gap(2)
        w.ensure(30) // keep the project name with its description
        w.titleLine(projectHeadingLine(p), projectDates(p), { size: 10 })
        if (p.description.trim()) {
          w.gap(1)
          bodyText(p.description.trim())
        }
      }
    } else if (key === 'involvement' && involvementEntries(resume).length > 0) {
      w.heading(sectionHeading(resume, 'involvement'))
      let ii = 0
      for (const i of involvementEntries(resume)) {
        entryRule(ii++)
        w.gap(4)
        w.ensure(34)
        w.titleLine(involvementHeadingLine(i), involvementDates(i), { size: 10.5 })
        w.gap(2)
        for (const b of involvementBullets(i)) w.bullet(b)
      }
    } else if (key === 'education' && resume.education.some((e) => e.school)) {
      w.heading(sectionHeading(resume, 'education'))
      let edi = 0
      for (const e of resume.education) {
        if (!e.school) continue
        entryRule(edi++)
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
          bodyText(detail)
        }
      }
    } else if (key === 'coursework' && courseworkEntries(resume).length > 0) {
      w.heading(sectionHeading(resume, 'coursework'))
      let cwi = 0
      for (const cw of courseworkEntries(resume)) {
        entryRule(cwi++)
        w.gap(4)
        w.ensure(34)
        w.titleLine(courseworkHeadingLine(cw), cw.date.trim(), { size: 10.5 })
        w.gap(2)
        for (const b of courseworkBullets(cw)) w.bullet(b)
      }
    } else if (key === 'skills' && resume.skills.trim()) {
      w.heading(sectionHeading(resume, 'skills'))
      for (const line of skillLines(resume)) {
        if (!line.label) bodyText(line.text)
        else if (hasInlineMarks(line.text)) w.richText(`**${line.label}:** ${line.text}`)
        else w.labelledLine(line.label, line.text, { size: 10 })
      }
    } else if (
      key === 'certifications' &&
      (certEntries(resume).length > 0 || resume.certifications.trim())
    ) {
      w.heading(sectionHeading(resume, 'certifications'))
      let cti = 0
      for (const c of certEntries(resume)) {
        entryRule(cti++)
        w.gap(2)
        w.ensure(30)
        w.titleLine(certHeadingLine(c), c.date.trim(), { size: 10 })
        if (c.description.trim()) {
          w.gap(1)
          bodyText(c.description.trim())
        }
      }
      if (resume.certifications.trim()) {
        w.gap(2)
        bodyText(resume.certifications.trim())
      }
    } else if (key === 'awards' && awardEntries(resume).length > 0) {
      w.heading(sectionHeading(resume, 'awards'))
      let awi = 0
      for (const a of awardEntries(resume)) {
        entryRule(awi++)
        w.gap(4)
        w.ensure(34)
        w.titleLine(awardHeadingLine(a), a.date.trim(), { size: 10.5 })
        w.gap(2)
        for (const b of awardBullets(a)) w.bullet(b)
      }
    } else if (key === 'publications' && publicationEntries(resume).length > 0) {
      w.heading(sectionHeading(resume, 'publications'))
      let pbi = 0
      for (const p of publicationEntries(resume)) {
        entryRule(pbi++)
        w.gap(4)
        w.ensure(34)
        w.titleLine(publicationHeadingLine(p), p.date.trim(), { size: 10.5 })
        w.gap(2)
        for (const b of publicationBullets(p)) w.bullet(b)
      }
    } else if (key === 'references' && referenceEntries(resume).length > 0) {
      w.heading(sectionHeading(resume, 'references'))
      let rfi = 0
      for (const x of referenceEntries(resume)) {
        entryRule(rfi++)
        w.gap(4)
        w.ensure(34)
        w.titleLine(referenceHeadingLine(x), '', { size: 10.5 })
        const detail = referenceDetailLine(x)
        if (detail) {
          w.gap(2)
          bodyText(detail)
        }
      }
    } else if (key === 'military' && militaryEntries(resume).length > 0) {
      w.heading(sectionHeading(resume, 'military'))
      let mli = 0
      for (const m of militaryEntries(resume)) {
        entryRule(mli++)
        w.gap(4)
        w.ensure(34)
        w.titleLine(militaryHeadingLine(m), militaryDates(m), { size: 10.5 })
        w.gap(2)
        for (const b of militaryBullets(m)) w.bullet(b)
      }
    } else if (key === 'agents' && agentEntries(resume).length > 0) {
      w.heading(sectionHeading(resume, 'agents'))
      let agi = 0
      for (const a of agentEntries(resume)) {
        entryRule(agi++)
        w.gap(4)
        w.ensure(34)
        w.titleLine(a.name.trim(), a.date.trim(), { size: 10.5 })
        w.gap(2)
        for (const b of agentBullets(a)) w.bullet(b)
      }
    } else if (key.startsWith('custom:')) {
      const s = resume.customSections.find((x) => `custom:${x.id}` === key)
      if (!s || (!s.title.trim() && !s.bullets.some((b) => b.trim()))) continue
      w.heading(s.title.trim() || 'Additional')
      for (const b of s.bullets) if (b.trim()) w.bullet(b.trim())
    }
  }

  return { doc, w }
}

export async function buildResumePdf(resume: Resume): Promise<Uint8Array> {
  return (await composeResumePdf(resume)).doc.save()
}

export interface ResumeLength {
  pages: number
  /** Fractional length in pages, e.g. 0.31 or 1.4 — (pages − 1) + fill of the last page. */
  length: number
}

/** Fractional length of the exported PDF — drives the length meter in the builder. */
export async function measureResumePdf(resume: Resume): Promise<ResumeLength> {
  const { doc, w } = await composeResumePdf(resume)
  const pages = doc.getPageCount()
  const usable = w.pageH - MARGIN * 2
  const fill = Math.min(1, Math.max(0, (w.pageH - MARGIN - w.y) / usable))
  return { pages, length: pages - 1 + fill }
}

/** Page count of the exported PDF — drives auto-fit. */
export async function countResumePdfPages(resume: Resume): Promise<number> {
  return (await measureResumePdf(resume)).pages
}

export async function downloadResumePdf(resume: Resume, filename: string) {
  const bytes = await buildResumePdf(resume)
  downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), filename)
}

/** Generic text PDF (cover letter / interview brief) */
export async function downloadTextPdf(title: string, text: string, filename: string) {
  const doc = await PDFDocument.create()
  const fonts: Fonts = needsUnicodeFont(`${title}\n${text}`)
    ? await embedUnicodeFonts(doc, `${title}\n${text}`)
    : {
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
  const fonts: Fonts = await embedFontsFor(doc, resume, tpl.serif, body)
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
