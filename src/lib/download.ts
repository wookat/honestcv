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
