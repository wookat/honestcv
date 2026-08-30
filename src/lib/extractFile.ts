import { unzipSync, strFromU8 } from 'fflate'

export const IMPORT_ACCEPT = '.pdf,.docx,.txt'

/**
 * Extracts plain text from an uploaded resume file (.pdf, .docx or .txt),
 * entirely in the browser. The result feeds parseResumeText / the ATS checker.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return extractPdf(file)
  if (name.endsWith('.docx')) return extractDocx(file)
  if (name.endsWith('.txt') || file.type.startsWith('text/')) return file.text()
  throw new Error('Unsupported file type — please upload a PDF, DOCX or TXT file.')
}

async function extractPdf(file: File): Promise<string> {
  // legacy build ships polyfills, so it works on browsers without the newest APIs
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    // Group items into lines by their y coordinate so the structure survives.
    const lines = new Map<number, { x: number; w: number; str: string }[]>()
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
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
      line.push({ x: item.transform[4], w: item.width, str: item.str })
    }
    // Split each visual line into segments at wide gaps (e.g. a right-aligned
    // date after an entry header, or a sidebar next to the main column).
    const segments: { x: number; y: number; text: string }[] = []
    for (const [y, items] of lines) {
      const sorted = items.sort((a, b) => a.x - b.x)
      let start = sorted[0].x
      let text = ''
      let prevEnd = -Infinity
      for (const it of sorted) {
        if (text && it.x - prevEnd > 40) {
          segments.push({ x: start, y, text })
          text = ''
          start = it.x
        } else if (text) {
          text += ' '
        }
        text += it.str
        prevEnd = it.x + it.w
      }
      if (text) segments.push({ x: start, y, text })
    }
    // Two-column layouts (like LinkedIn profile exports: sidebar + main
    // column) would interleave when read purely top-to-bottom. Detect a wide
    // gap between segment start positions and emit each column in one block
    // so headings stay grouped with their content.
    const split = detectColumnSplit(segments)
    const inOrder = (segs: typeof segments) =>
      segs
        .sort((a, b) => b.y - a.y || a.x - b.x)
        .map((s) => s.text.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
    if (split === null) {
      pages.push(inOrder(segments))
    } else {
      const left = segments.filter((s) => s.x <= split)
      const right = segments.filter((s) => s.x > split)
      const chars = (segs: typeof segments) => segs.reduce((n, s) => n + s.text.length, 0)
      // Main column (the one with more text) first, sidebar after, so the
      // name/headline stay at the top and headings stay with their content.
      const [main, side] = chars(right) >= chars(left) ? [right, left] : [left, right]
      pages.push([inOrder(main), inOrder(side)].filter(Boolean).join('\n'))
    }
  }
  return pages.join('\n\n').trim()
}

/**
 * x midpoint of the gap between two text columns, or null for single-column
 * pages. Both sides must carry real prose (several long segments) so that
 * right-aligned dates in a single-column resume don't register as a column.
 */
function detectColumnSplit(segments: { x: number; text: string }[]): number | null {
  if (segments.length < 40) return null
  const xs = [...new Set(segments.map((s) => Math.round(s.x)))].sort((a, b) => a - b)
  let best = 0
  let at = 0
  for (let i = 1; i < xs.length; i++) {
    if (xs[i] - xs[i - 1] > best) {
      best = xs[i] - xs[i - 1]
      at = (xs[i] + xs[i - 1]) / 2
    }
  }
  if (best < 80) return null
  const left = segments.filter((s) => s.x <= at)
  const right = segments.filter((s) => s.x > at)
  if (left.length < 8 || right.length < 8) return null
  const longCount = (segs: typeof segments) => segs.filter((s) => s.text.length > 30).length
  if (longCount(left) < 4 || longCount(right) < 4) return null
  return at
}

async function extractDocx(file: File): Promise<string> {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()))
  const doc = files['word/document.xml']
  if (!doc) throw new Error('Could not read this DOCX file.')
  const xml = strFromU8(doc)
  const text = xml
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
  return text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
