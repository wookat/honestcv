import { useEffect, useRef, useState } from 'react'
import type { ResumeLength } from './pdf'
import type { Resume } from './resume'

let pdfMeasureIdle: Promise<void> | null = null
/** Resolves once the page has loaded and the main thread is idle, so the
 * heavy PDF engine never competes with page startup. */
export function whenIdleForPdfMeasure(): Promise<void> {
  pdfMeasureIdle ??= new Promise((resolve) => {
    const idle = () => {
      if (typeof window.requestIdleCallback === 'function')
        window.requestIdleCallback(() => resolve(), { timeout: 4000 })
      else window.setTimeout(resolve, 1500)
    }
    if (document.readyState === 'complete') idle()
    else window.addEventListener('load', idle, { once: true })
  })
  return pdfMeasureIdle
}

/** One measurement per resume object: every surface showing the same stored copy
 * (dashboard card, row, builder copies dialog) shares it, and re-mounting a list
 * does not compose the PDFs again. A failed measurement is not cached. */
const measured = new WeakMap<Resume, Promise<ResumeLength>>()

export function measurePdfOnceIdle(resume: Resume): Promise<ResumeLength> {
  let p = measured.get(resume)
  if (!p) {
    p = whenIdleForPdfMeasure()
      .then(() => import('./pdf'))
      .then((m) => m.measureResumePdf(resume))
    p.catch(() => {
      if (measured.get(resume) === p) measured.delete(resume)
    })
    measured.set(resume, p)
  }
  return p
}

/** `null` while the PDF is being measured, `'unavailable'` when the measurement failed. */
type PdfMeasure = ResumeLength | null | 'unavailable'

function usePdfMeasure(resume: Resume, delayMs: number): PdfMeasure {
  const [len, setLen] = useState<PdfMeasure>(null)
  const seq = useRef(0)
  useEffect(() => {
    const id = ++seq.current
    const t = window.setTimeout(() => {
      measurePdfOnceIdle(resume).then(
        (n) => {
          if (seq.current === id) setLen(n)
        },
        () => {
          if (seq.current === id) setLen((prev) => (prev === null ? 'unavailable' : prev))
        }
      )
    }, delayMs)
    return () => window.clearTimeout(t)
  }, [resume, delayMs])
  return len
}

/** Debounced fractional length of the exported PDF, shown next to the preview;
 * `null` until measured (and if the measurement fails). */
export function usePdfLength(resume: Resume): ResumeLength | null {
  const m = usePdfMeasure(resume, 800)
  return m === 'unavailable' ? null : m
}

/** Page count of the exported PDF — the number the ATS page-length check scores.
 * `undefined` until measured; `null` when the PDF could not be measured, in which case
 * the check is not applicable (the same as the Builder before its first measurement). */
export function usePdfPages(resume: Resume, delayMs = 0): number | null | undefined {
  const m = usePdfMeasure(resume, delayMs)
  if (m === null) return undefined
  if (m === 'unavailable') return null
  return m.pages
}
