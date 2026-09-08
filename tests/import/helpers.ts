import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { leftMargin, pdfPageText, type PdfTextItem } from '../../src/lib/extractFile'

export const FIXTURES = join(import.meta.dirname, 'fixtures')

export const listFixtures = (kind: 'text' | 'pdf') =>
  readdirSync(join(FIXTURES, kind))
    .filter((n) => n.endsWith(kind === 'text' ? '.txt' : '.pdf'))
    .sort()

export const readText = (name: string) => readFileSync(join(FIXTURES, 'text', name), 'utf8')

/** Drops generated ids so a golden compares content, not random identifiers. */
export const normalize = (v: unknown) =>
  JSON.stringify(v, (k, x) => (k === 'id' ? undefined : x), 1) + '\n'

/**
 * The browser's PDF path minus the worker: same pdf.js text layer, same
 * `leftMargin` / `pdfPageText` geometry pass, pages joined with a blank line.
 */
export async function pdfText(name: string): Promise<{ text: string; multiColumn: boolean }> {
  const data = new Uint8Array(readFileSync(join(FIXTURES, 'pdf', name)))
  const doc = await pdfjs.getDocument({ data, useWorkerFetch: false }).promise
  const pages: PdfTextItem[][] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent()
    pages.push(content.items.filter((it) => 'str' in it) as PdfTextItem[])
  }
  const margin = leftMargin(pages)
  const parts = pages.map((items) => pdfPageText(items, margin))
  return {
    text: parts.map((p) => p.text).join('\n\n').trim(),
    multiColumn: parts.some((p) => p.multiColumn),
  }
}
