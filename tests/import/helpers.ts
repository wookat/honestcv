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

/**
 * Drops generated ids so a golden compares content, not random identifiers;
 * `sectionOrder` names a custom section by its title instead of its id.
 */
export const normalize = (v: unknown) => {
  const r = v as { customSections?: { id: string; title: string }[] }
  const titles = new Map((r.customSections ?? []).map((s) => [`custom:${s.id}`, `custom:${s.title}`]))
  return (
    JSON.stringify(
      v,
      (k, x: unknown) =>
        k === 'id' ? undefined : k === 'sectionOrder' && Array.isArray(x) ? (x as string[]).map((key) => titles.get(key) ?? key) : x,
      1
    ) + '\n'
  )
}

/**
 * The browser's PDF path minus the worker: same pdf.js text layer, same
 * `leftMargin` / `pdfPageText` geometry pass, pages joined with a blank line.
 */
export const pdfText = (name: string) =>
  pdfTextOf(new Uint8Array(readFileSync(join(FIXTURES, 'pdf', name))))

export async function pdfTextOf(data: Uint8Array): Promise<{ text: string; multiColumn: boolean }> {
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
