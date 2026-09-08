export const IMPORT_ACCEPT = '.pdf,.docx,.txt'

/** File-level ATS compatibility check on an uploaded resume file. */
export type FileCheck = { label: string; pass: boolean; hint: string }

export type ExtractedResumeFile = { text: string; checks: FileCheck[] }

const MAX_FILE_BYTES = 2 * 1024 * 1024

// Icon fonts (FontAwesome bullets, star ratings…) map glyphs into the
// Unicode Private Use Area — ATS parsers read them as unreadable boxes.
const PUA_RE = /[\uE000-\uF8FF]/

const iconGlyphCheck = (text: string): FileCheck => ({
  label: 'No icon-font glyphs',
  pass: !PUA_RE.test(text),
  hint: 'Icon-font characters (e.g. symbol bullets, rating stars) were detected — ATS parsers read them as unreadable boxes; use plain text characters instead.',
})

/** Share of characters below 9pt — more than 25% fails the check. */
const fontSizeCheck = (smallChars: number, totalChars: number): FileCheck => {
  const share = totalChars > 0 ? smallChars / totalChars : 0
  return {
    label: 'Body text at least 9pt',
    pass: share <= 0.25,
    hint: `${Math.round(share * 100)}% of the text is smaller than 9pt — many ATS parsers and recruiters struggle with tiny type; use 10–12pt body text.`,
  }
}

const JUNK_NAME_TOKENS = new Set([
  'untitled', 'document', 'doc', 'copy', 'final', 'draft', 'new', 'updated',
  'latest', 'edit', 'edited', 'version',
])

/** Professional file name: full name plus "resume" reads best in a recruiter inbox. */
const fileNameCheck = (file: File): FileCheck => {
  const base = file.name.replace(/\.[^.]+$/, '')
  const tokens = base.toLowerCase().split(/[-_ .,()+]+/).filter(Boolean)
  const junk = tokens.some(
    (t) => JUNK_NAME_TOKENS.has(t) || /^v\d{1,2}$/.test(t) || /^\d{1,2}$/.test(t)
  )
  const hasKeyword = tokens.includes('resume') || tokens.includes('cv')
  const pass = hasKeyword && !junk
  return {
    label: 'Professional file name',
    pass,
    hint: pass
      ? 'The file name looks simple and professional — recruiters and portals see it first.'
      : `Rename "${file.name}" to your full name plus "resume" (e.g. "Jane-Doe-Resume.pdf") — recruiters and portals see the file name first.`,
  }
}

const sizeCheck = (file: File): FileCheck => ({
  label: 'File size under 2 MB',
  pass: file.size <= MAX_FILE_BYTES,
  hint: `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB — many application portals reject large uploads; remove photos or heavy graphics.`,
})

/**
 * The PDF/DOCX parsing engines live in lazy chunks fetched on first upload.
 * If that fetch fails (offline, flaky network), the raw import error is a
 * technical "Failed to fetch dynamically imported module…" string — surface
 * a friendly, actionable message instead.
 */
async function loadEngine<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load()
  } catch {
    throw new Error(
      'Could not load the file reader — check your connection and try again, or paste the text instead.'
    )
  }
}

/**
 * Extracts plain text from an uploaded resume file (.pdf, .docx or .txt),
 * entirely in the browser. The result feeds parseResumeText / the ATS checker.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return (await extractResumeFile(file)).text
}

/**
 * Extracts text plus file-level ATS format checks (tables, images, headers,
 * multi-column layout, page count, size) from an uploaded resume file.
 */
export async function extractResumeFile(file: File): Promise<ExtractedResumeFile> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return extractPdf(file)
  if (name.endsWith('.docx')) return extractDocx(file)
  if (name.endsWith('.txt') || file.type.startsWith('text/'))
    return { text: await file.text(), checks: [sizeCheck(file), fileNameCheck(file)] }
  throw new Error('Unsupported file type — please upload a PDF, DOCX or TXT file.')
}

const GAP_EMS = 2.5

export interface PdfTextItem {
  str: string
  transform: number[]
  width: number
}

type LineItem = { x: number; w: number; size: number; str: string }
type Segment = { x: number; end: number; y: number; size: number; text: string; tags: number; tagText: string }

/**
 * Split each visual line into segments at wide gaps (e.g. a right-aligned
 * date after an entry header, a section label in a left column, or a
 * sidebar next to the main column). Measured in the text's own size: word
 * and separator gaps stay under 1.5em even in justified prose, while a
 * layout gap is several ems wide however narrow the column. A known column
 * gutter also splits, so a left cell that runs up to the gutter is not glued
 * to the cell beside it. Three or more items spaced by 1.5–2.5em gaps are a
 * row of tags ("Kubernetes  Helm  Rust"), joined with commas; two items so
 * spaced are only counted (`tags`), since a role beside a company has the
 * same shape — they join a tag list only as its wrapped tail (see `inOrder`).
 */
function isTagRow(items: LineItem[]): boolean {
  if (items.length < 2) return false
  const gaps = items.slice(1).map((it, i) => (it.x - (items[i].x + items[i].w)) / Math.max(it.size, items[i].size))
  return Math.min(...gaps) >= 1.5 && Math.max(...gaps) <= GAP_EMS
}

function segmentOf(items: LineItem[], y: number): Segment {
  const last = items[items.length - 1]
  const tags = isTagRow(items) ? items.length : 0
  const tagText = items.map((it) => it.str).join(', ')
  return {
    x: items[0].x,
    end: last.x + last.w,
    y,
    size: Math.max(...items.map((it) => it.size)),
    text: tags >= 3 ? tagText : items.map((it) => it.str).join(' '),
    tags,
    tagText,
  }
}

function lineSegments(lines: Map<number, LineItem[]>, gutter: number | null, margin: number | null = null): Segment[] {
  const segments: Segment[] = []
  for (const [y, lineItems] of lines) {
    const sorted = lineItems.sort((a, b) => a.x - b.x)
    let cell: LineItem[] = []
    for (const it of sorted) {
      const prev = cell[cell.length - 1]
      const prevEnd = prev ? prev.x + prev.w : -Infinity
      const atGutter = gutter !== null && it.x >= gutter - 3 && prevEnd < gutter - 1
      const atMargin =
        margin !== null &&
        prevEnd < margin - 1 &&
        Math.abs(it.x - margin) <= 3 &&
        prev !== undefined &&
        it.x - prevEnd >= 0.75 * Math.min(it.size, prev.size) &&
        /[A-Za-z].*[A-Za-z]/.test(cell.map((c) => c.str).join(' '))
      if (prev && (it.x - prevEnd > GAP_EMS * Math.max(it.size, prev.size) || atGutter || atMargin)) {
        segments.push(segmentOf(cell, y))
        cell = []
      }
      cell.push(it)
    }
    if (cell.length) segments.push(segmentOf(cell, y))
  }
  return segments
}

/**
 * The x where the document's lines begin: the leftmost start shared by at
 * least three lines and one line in twenty. A label hanging in the left gutter
 * ("Work" beside "Senior Software Engineer", right-aligned short of the margin)
 * ends before it; a bullet glyph or a date column is itself the start of its
 * lines and so sets the margin instead of falling left of it.
 */
export function leftMargin(pages: PdfTextItem[][]): number | null {
  const starts = new Map<number, number>()
  let total = 0
  for (const items of pages) {
    const lines = new Map<number, number>()
    for (const item of items) {
      if (!item.str.trim()) continue
      const y = Math.round(item.transform[5])
      const key = [...lines.keys()].find((k) => Math.abs(k - y) <= 2) ?? y
      lines.set(key, Math.min(lines.get(key) ?? Infinity, item.transform[4]))
    }
    for (const x of lines.values()) {
      const k = Math.round(x)
      starts.set(k, (starts.get(k) ?? 0) + 1)
      total++
    }
  }
  const shared = [...starts.entries()].filter(([, n]) => n >= 3 && n * 20 >= total).map(([x]) => x)
  return shared.length ? Math.min(...shared) : null
}

/** One page's text in reading order, assembled from pdf.js text items. */
export function pdfPageText(items: PdfTextItem[], margin: number | null = null): {
  text: string
  multiColumn: boolean
  smallChars: number
  totalChars: number
} {
  let smallChars = 0
  let totalChars = 0
  // Group items into lines by their y coordinate so the structure survives.
  const lines = new Map<number, { x: number; w: number; size: number; str: string }[]>()
  for (const item of items) {
    if (!item.str.trim()) continue
    const chars = item.str.trim().length
    const size = Math.hypot(item.transform[0], item.transform[1])
    totalChars += chars
    if (size < 9) smallChars += chars
    const y = Math.round(item.transform[5])
    let line = lines.get(y)
    if (!line) {
      for (const key of lines.keys()) {
        if (Math.abs(key - y) <= 2) {
          line = lines.get(key)
          break
        }
      }
    }
    if (!line) {
      line = []
      lines.set(y, line)
    }
    line.push({ x: item.transform[4], w: item.width, size, str: item.str })
  }
  let segments = lineSegments(lines, null, margin)
  // A tag flow that wraps ("Bash Java Perl Golang C" over "Python Rust
  // Javascript": same start, same size, the next row down) is one list; a
  // two-item row alone is not one (a role beside a company).
  const continuesTags = (prev: Segment, s: Segment) =>
    prev.tags >= 3 &&
    s.tags >= 2 &&
    Math.abs(s.x - prev.x) <= 2 &&
    Math.abs(s.size - prev.size) <= 0.25 &&
    prev.y - s.y <= 2.5 * s.size
  const inOrder = (segs: Segment[]) => {
    const sorted = [...segs].sort((a, b) => b.y - a.y || a.x - b.x)
    const rows: Segment[] = []
    for (const s of sorted) {
      const prev = rows[rows.length - 1]
      if (prev && continuesTags(prev, s)) rows[rows.length - 1] = { ...prev, y: s.y, text: `${prev.text}, ${s.tagText}` }
      else rows.push(s)
    }
    return rows.map((s) => s.text.replace(/\s+/g, ' ').trim()).filter(Boolean)
  }
  // Text beside other text would interleave when read purely top-to-bottom.
  // A page-high sidebar (LinkedIn exports, sidebar templates) is emitted as
  // main column then sidebar; a local two-column block (a skills grid) is
  // emitted left cells then right cells in its place, so headings stay
  // grouped with their content either way.
  const layout = columnLayout(lines, segments)
  if (!layout) return { text: inOrder(segments).join('\n'), multiColumn: false, smallChars, totalChars }
  segments = lineSegments(lines, layout.gutter, margin)
  const isLeft = (s: Segment) => s.x < layout.gutter - 3
  if (layout.sidebar) {
    const left = segments.filter(isLeft)
    const right = segments.filter((s) => !isLeft(s))
    const chars = (segs: Segment[]) => segs.reduce((n, s) => n + s.text.length, 0)
    const [main, side] = chars(right) >= chars(left) ? [right, left] : [left, right]
    return {
      text: [...inOrder(main), ...unwrapSidebar(side)].join('\n'),
      multiColumn: true,
      smallChars,
      totalChars,
    }
  }
  const out: string[] = []
  let rest = segments
  for (const [top, bottom] of layout.bands) {
    const above = rest.filter((s) => s.y > top + 1)
    const inBand = rest.filter((s) => s.y <= top + 1 && s.y >= bottom - 1)
    rest = rest.filter((s) => s.y < bottom - 1)
    out.push(...inOrder(above), ...inOrder(inBand.filter(isLeft)), ...inOrder(inBand.filter((s) => !isLeft(s))))
  }
  out.push(...inOrder(rest))
  return { text: out.join('\n'), multiColumn: true, smallChars, totalChars }
}

/**
 * A narrow sidebar wraps its items, and the lines of one item sit closer
 * together than one item sits to the next (a LinkedIn export: 1.2em within a
 * certification or publication, 1.7em between them). Where a run of same-size
 * lines shows both pitches, the close ones are wraps and are joined; a run
 * with a single pitch (contact rows, a skills list) is left as it is.
 */
function unwrapSidebar(segs: Segment[]): string[] {
  const rows = [...segs]
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .map((s) => ({ ...s, text: s.text.replace(/\s+/g, ' ').trim() }))
    .filter((s) => s.text)
  const out: string[] = []
  let i = 0
  while (i < rows.length) {
    let j = i + 1
    while (j < rows.length && Math.abs(rows[j].size - rows[i].size) <= 0.25) j++
    const block = rows.slice(i, j)
    // 0 for a second segment on the same line (never a wrap)
    const pitch = block.slice(1).map((r, k) => (block[k].y - r.y) / r.size)
    const tight = (p: number) => p > 0.5 && p <= 1.3
    const wrapped = pitch.some(tight) && pitch.some((p) => p >= 1.5)
    for (const [k, r] of block.entries()) {
      if (wrapped && k > 0 && tight(pitch[k - 1]) && Math.abs(r.x - block[k - 1].x) <= 2) {
        const prev = out[out.length - 1]
        out[out.length - 1] = prev.endsWith('/') ? prev + r.text : `${prev} ${r.text}`
      } else out.push(r.text)
    }
    i = j
  }
  return out
}

async function extractPdf(file: File): Promise<ExtractedResumeFile> {
  // legacy build ships polyfills, so it works on browsers without the newest APIs
  const pdfjs = await loadEngine(() => import('pdfjs-dist/legacy/build/pdf.mjs'))
  const worker = await loadEngine(() => import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'))
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise.catch(() => {
    throw new Error(
      'Could not read this PDF — the file may be damaged. Re-export it or paste the text instead.'
    )
  })
  const pages: string[] = []
  let hasImages = false
  let multiColumn = false
  let smallChars = 0
  let totalChars = 0
  const pageItems: PdfTextItem[][] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const ops = await page.getOperatorList()
    if (
      ops.fnArray.includes(pdfjs.OPS.paintImageXObject) ||
      ops.fnArray.includes(pdfjs.OPS.paintInlineImageXObject)
    )
      hasImages = true
    const content = await page.getTextContent()
    pageItems.push(content.items.filter((item) => 'str' in item))
  }
  const margin = leftMargin(pageItems)
  for (const items of pageItems) {
    const pageText = pdfPageText(items, margin)
    if (pageText.multiColumn) multiColumn = true
    smallChars += pageText.smallChars
    totalChars += pageText.totalChars
    pages.push(pageText.text)
  }
  const checks: FileCheck[] = [
    sizeCheck(file),
    fileNameCheck(file),
    {
      label: 'Two pages or fewer',
      pass: doc.numPages <= 2,
      hint: `This PDF has ${doc.numPages} pages — recruiters expect 1-2; trim older or less relevant entries.`,
    },
    {
      label: 'Single-column layout',
      pass: !multiColumn,
      hint: 'A multi-column layout was detected — many ATS parsers read columns in the wrong order; use a single column.',
    },
    {
      label: 'No embedded images',
      pass: !hasImages,
      hint: 'Images (photos, icons, charts) were detected — ATS parsers skip them, and any text inside is lost.',
    },
    fontSizeCheck(smallChars, totalChars),
    iconGlyphCheck(pages.join('\n')),
  ]
  return { text: pages.join('\n\n').trim(), checks }
}

const DATE_LIKE_RE = /\b(?:19|20)\d{2}\b|\bpresent\b/i

type ColumnLayout = {
  /** x where the right column's lines start */
  gutter: number
  /** y ranges (top ≥ bottom, PDF coordinates) where both columns carry text */
  bands: [number, number][]
  /** the bands cover most of the page: a sidebar, not a local grid */
  sidebar: boolean
}

/**
 * A second text column starts at an x where several lines begin and which no
 * line from the left crosses. Right-aligned dates fail that test (the bullets
 * beneath them run past the date's x) and so does a date column beside the
 * entries (its cells are dates on the entries' own rows); both keep the plain
 * top-to-bottom order.
 */
function columnLayout(lines: Map<number, LineItem[]>, segments: Segment[]): ColumnLayout | null {
  const rowsY = [...new Set(segments.map((s) => s.y))].sort((a, b) => b - a)
  if (rowsY.length < 8) return null
  const gaps = rowsY.slice(1).map((y, i) => rowsY[i] - y).sort((a, b) => a - b)
  const pitch = gaps[Math.floor(gaps.length / 2)] || 12
  const minX = Math.min(...segments.map((s) => s.x))
  // Where lines begin: segment starts, plus the cells of a tag row (spaced
  // 1.5–2.5em, one segment) — a grid column may start inside such a row.
  const starts = new Map<number, number>()
  const count = (x: number) => starts.set(Math.round(x), (starts.get(Math.round(x)) ?? 0) + 1)
  for (const s of segments) count(s.x)
  for (const lineItems of lines.values()) {
    const sorted = [...lineItems].sort((a, b) => a.x - b.x)
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const gap = (sorted[i].x - (prev.x + prev.w)) / Math.max(sorted[i].size, prev.size)
      if (gap >= 1.5 && gap <= GAP_EMS) count(sorted[i].x)
    }
  }
  // A column's headings and its indented items begin within a few points of
  // each other: starts within 8pt form one candidate, anchored at the leftmost.
  const xs = [...starts.keys()].sort((a, b) => a - b)
  const candidates = xs.map((x) => {
    const group = xs.filter((o) => o >= x && o <= x + 8)
    return { gutter: x, spread: group[group.length - 1] - x, n: group.reduce((t, o) => t + (starts.get(o) ?? 0), 0) }
  })
  const dateHeavy = (segs: Segment[]) => segs.filter((s) => DATE_LIKE_RE.test(s.text)).length * 2 >= segs.length
  let best: { gutter: number; bands: [number, number][]; rightSegs: number } | null = null
  for (const { gutter, spread, n } of candidates) {
    if (n < 4 || gutter < minX + 60) continue
    const split = lineSegments(lines, gutter)
    const anchors = rowsY.filter((y) =>
      split.some((s) => s.y === y && s.x >= gutter - 3 && s.x <= gutter + spread + 3),
    )
    const clusters: [number, number][] = []
    for (const y of anchors) {
      const last = clusters[clusters.length - 1]
      if (last && last[1] - y <= 4 * pitch) last[1] = y
      else clusters.push([y, y])
    }
    const bands: [number, number][] = []
    let rightSegs = 0
    for (const [top, bottom] of clusters) {
      const inBand = split.filter((s) => s.y <= top + 1 && s.y >= bottom - 1)
      const wordy = (s: Segment) => /[A-Za-z]{3}/.test(s.text)
      const left = inBand.filter((s) => s.x < gutter - 3 && wordy(s))
      const right = inBand.filter((s) => s.x >= gutter - 3 && wordy(s))
      const bandRows = new Set(inBand.map((s) => s.y)).size
      const rows = (segs: Segment[]) => new Set(segs.map((s) => s.y)).size
      // Both columns carry worded lines of their own on most rows — bullet
      // glyphs, section labels or dates beside the entries are not a column.
      if (Math.min(left.length, right.length) < 6) continue
      if (rows(left) * 4 < bandRows || rows(right) * 4 < bandRows) continue
      if (left.filter((s) => s.end > gutter + 3).length > Math.max(1, bandRows * 0.05)) continue
      if (dateHeavy(left) || dateHeavy(right)) continue
      bands.push([top, bottom])
      rightSegs += right.length
    }
    if (bands.length && (!best || rightSegs > best.rightSegs)) best = { gutter, bands, rightSegs }
  }
  if (!best) return null
  const pageSpan = rowsY[0] - rowsY[rowsY.length - 1]
  const covered = best.bands.reduce((n, [top, bottom]) => n + (top - bottom), 0)
  return { gutter: best.gutter, bands: best.bands, sidebar: covered * 2 >= pageSpan }
}

async function extractDocx(file: File): Promise<ExtractedResumeFile> {
  const { unzipSync, strFromU8 } = await loadEngine(() => import('fflate'))
  let files: ReturnType<typeof unzipSync>
  try {
    files = unzipSync(new Uint8Array(await file.arrayBuffer()))
  } catch {
    throw new Error(
      'Could not read this DOCX file — it may be damaged. Re-export it or paste the text instead.'
    )
  }
  const doc = files['word/document.xml']
  if (!doc) throw new Error('Could not read this DOCX file.')
  const xml = strFromU8(doc)
  // Text living in Word headers/footers is invisible to most ATS parsers.
  const headerFooterText = Object.keys(files)
    .filter((n) => /^word\/(header|footer)\d*\.xml$/.test(n))
    .map((n) => strFromU8(files[n]))
    .some((x) => /<w:t[^>]*>[^<]*\S[^<]*<\/w:t>/.test(x))
  const checks: FileCheck[] = [
    sizeCheck(file),
    fileNameCheck(file),
    {
      label: 'No tables',
      pass: !/<w:tbl[ >]/.test(xml),
      hint: 'Tables were detected — ATS parsers often scramble or drop table contents; use plain paragraphs.',
    },
    {
      label: 'No text boxes',
      pass: !/<w:txbxContent[ >]/.test(xml),
      hint: 'Text boxes were detected — many ATS parsers cannot read text inside them.',
    },
    {
      label: 'No embedded images',
      pass: !/<w:drawing[ >]/.test(xml),
      hint: 'Images (photos, icons, charts) were detected — ATS parsers skip them, and any text inside is lost.',
    },
    {
      label: 'No text in headers or footers',
      pass: !headerFooterText,
      hint: 'Text was found in the Word header/footer — contact info there is invisible to many ATS parsers; move it into the document body.',
    },
  ]
  // Weight each run's text by its explicit font size (w:sz is in half-points;
  // runs without w:sz inherit the document default and are assumed fine).
  let smallChars = 0
  let totalChars = 0
  let bodyText = ''
  for (const run of xml.match(/<w:r\b[\s\S]*?<\/w:r>/g) ?? []) {
    const text = (run.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [])
      .map((t) => t.replace(/<[^>]+>/g, ''))
      .join('')
    const chars = text.trim().length
    if (!chars) continue
    bodyText += text
    totalChars += chars
    const sz = run.match(/<w:sz\b[^>]*w:val="(\d+)"/)
    if (sz && Number(sz[1]) < 18) smallChars += chars
  }
  checks.push(fontSizeCheck(smallChars, totalChars), iconGlyphCheck(bodyText))
  const text = xml
    // Word keeps list glyphs in numbering.xml, not in the paragraph text;
    // mark list paragraphs so bullets read like they do in PDF/plain text.
    .replace(/<w:pPr>(?:(?!<\/w:pPr>)[\s\S])*?<w:numPr>[\s\S]*?<\/w:numPr>[\s\S]*?<\/w:pPr>/g, (pPr) =>
      /<w:numId\b[^>]*w:val="0*[1-9]\d*"/.test(pPr) ? `${pPr}<w:t>• </w:t>` : pPr
    )
    // Tabs typically separate a header from a right-aligned date; a line
    // break keeps them as separate fields for the import parser.
    .replace(/<w:tab[^>]*\/>/g, '\n')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
  return {
    text: text
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    checks,
  }
}
