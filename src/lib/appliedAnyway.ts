/**
 * AI drafts the user applied while a grounding note was showing. Their exact text
 * is kept out of the resume evidence every later grounding check runs against, so
 * accepting one borrowed phrase does not make the same phrase read as "on your
 * resume" for the next draft. Editing the line (so it no longer matches verbatim)
 * makes it count again — the user has taken ownership of the wording.
 */
const KEY = 'honestcv.appliedAnyway'
const LIMIT = 100

export function appliedAnyway(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

export function recordAppliedAnyway(text: string): void {
  const t = text.trim()
  if (!t) return
  const next = [t, ...appliedAnyway().filter((s) => s !== t)].slice(0, LIMIT)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable — the check simply runs against the full resume */
  }
}

/** Resume text with every recorded draft removed where it still appears verbatim. */
export function evidenceText(resumeText: string): string {
  let out = resumeText
  for (const t of appliedAnyway()) {
    if (out.includes(t)) out = out.split(t).join(' ')
  }
  return out
}
