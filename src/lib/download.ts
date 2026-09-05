import { trackEvent } from '@/lib/track'

/** Build a clear, professional export filename: lowercase hyphenated parts,
 *  blanks dropped. Letters and digits in any script are kept so non-Latin
 *  names survive into the filename. */
export function professionalFileName(parts: (string | undefined | null)[], ext: string) {
  const slug = parts
    .map((p) =>
      (p ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
    )
    .filter(Boolean)
    .join('-')
  return `${slug || 'document'}.${ext}`
}

/**
 * The PDF/DOCX export engines live in lazy chunks fetched on first download.
 * If that fetch fails (offline, flaky network), the raw import error is a
 * technical "Failed to fetch dynamically imported module…" string — surface
 * a friendly, actionable message instead. Chrome caches the failed import
 * for the document, so recovery needs a reload.
 */
export async function loadExporter<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load()
  } catch {
    throw new Error(
      'Could not load the download component — check your connection, then reload and try again.'
    )
  }
}

/** Trigger a browser download of text content */
export function downloadText(content: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  downloadBlob(blob, filename)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  trackEvent('export')
}
