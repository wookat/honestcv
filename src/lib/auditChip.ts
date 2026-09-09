export type AuditFinding = { category: string; line?: number }

export const AUDIT_EXPLANATION: Record<string, string> = {
  'Weak bullet points': 'Open each bullet with a strong action verb instead of "worked" or "was".',
  'Quantified bullet points': 'Add a number that shows scale or impact — team size, %, time or money.',
  'Personal pronouns': 'Drop I / me / my — resume bullets are written without pronouns.',
  'Filler words': 'Cut empty phrases like "responsible for" or "various" — say what you did.',
  Buzzwords: 'Swap vague buzzwords for the concrete skill or result behind them.',
  'Passive voice': 'Rewrite in active voice so you — not the task — are the subject.',
  'Punctuation & capitalization': 'Start with a capital letter and keep end punctuation consistent.',
  'Bullet length': 'Keep each bullet roughly one line — long enough to be specific, short enough to scan.',
  'Number of bullet points': 'Aim for 3–6 bullets per role — enough evidence without padding.',
  'Dates are missing': 'Recruiters need dates to place this on your timeline and verify experience.',
}

/** `hot`: pointer over / keyboard focus on the chip. `pinned`: toggled open by a
 * click or tap. `dismissed`: Escape closed the hover panel until the next reveal. */
export type AuditChipState = { hot: boolean; pinned: boolean; dismissed: boolean }
export type AuditChipEvent = 'enter' | 'leave' | 'focus' | 'blur' | 'toggle' | 'escape' | 'outside'

export const AUDIT_CHIP_IDLE: AuditChipState = { hot: false, pinned: false, dismissed: false }

export function auditChipReducer(s: AuditChipState, e: AuditChipEvent): AuditChipState {
  switch (e) {
    case 'enter':
    case 'focus':
      return { ...s, hot: true, dismissed: false }
    case 'leave':
      return { ...s, hot: false }
    case 'blur':
    case 'outside':
      return { ...s, hot: false, pinned: false }
    case 'toggle':
      return s.pinned
        ? { ...s, pinned: false, dismissed: true }
        : { ...s, pinned: true, dismissed: false }
    case 'escape':
      return { ...s, pinned: false, dismissed: true }
  }
}

export const auditChipVisible = (s: AuditChipState): boolean => s.pinned || (s.hot && !s.dismissed)
