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
    const lines = new Map<number, { x: number; str: string }[]>()
    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue
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
      line.push({ x: item.transform[4], str: item.str })
    }
    const ordered = [...lines.entries()].sort((a, b) => b[0] - a[0])
    pages.push(
      ordered
        .map(([, items]) =>
          items
            .sort((a, b) => a.x - b.x)
            .map((it) => it.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
        )
        .filter(Boolean)
        .join('\n')
    )
  }
  return pages.join('\n\n').trim()
}

async function extractDocx(file: File): Promise<string> {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()))
  const doc = files['word/document.xml']
  if (!doc) throw new Error('Could not read this DOCX file.')
  const xml = strFromU8(doc)
  const text = xml
    .replace(/<w:tab[^>]*\/>/g, ' ')
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
