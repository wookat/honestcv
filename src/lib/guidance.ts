/**
 * Rule-based bullet quality checks — runs locally, no AI calls.
 * Flags weak openers, missing quantification, and length problems.
 */

const WEAK_OPENERS = [
  'responsible for',
  'worked on',
  'helped with',
  'helped to',
  'duties included',
  'tasked with',
  'in charge of',
  'assisted with',
  'participated in',
]

const FILLER_WORDS = ['various', 'several', 'stuff', 'things', 'etc']

export interface BulletIssue {
  kind: 'weak-opener' | 'no-metric' | 'too-long' | 'too-short' | 'filler' | 'first-person'
  message: string
}

export function checkBullet(bullet: string): BulletIssue[] {
  const text = bullet.trim()
  if (!text) return []
  const lower = text.toLowerCase()
  const issues: BulletIssue[] = []

  const opener = WEAK_OPENERS.find((w) => lower.startsWith(w))
  if (opener) {
    issues.push({
      kind: 'weak-opener',
      message: `Starts with "${opener}" — open with a strong action verb instead (Led, Built, Cut…)`,
    })
  }
  if (/^(i|my|we|our)\b/.test(lower)) {
    issues.push({
      kind: 'first-person',
      message: 'Drop first-person pronouns — resumes use implied first person',
    })
  }
  if (!/\d/.test(text)) {
    issues.push({
      kind: 'no-metric',
      message: 'No numbers — add a %, $, count or timeframe to show impact',
    })
  }
  const filler = FILLER_WORDS.find((w) => new RegExp(`\\b${w}\\b`).test(lower))
  if (filler) {
    issues.push({
      kind: 'filler',
      message: `"${filler}" is vague — name the specific tools or outcomes`,
    })
  }
  const words = text.split(/\s+/).length
  if (words > 30) {
    issues.push({ kind: 'too-long', message: `${words} words — aim for under 25` })
  } else if (words < 4) {
    issues.push({ kind: 'too-short', message: 'Very short — describe what you did and the result' })
  }
  return issues
}

export function checkBullets(bullets: string[]): { index: number; issues: BulletIssue[] }[] {
  return bullets
    .map((b, index) => ({ index, issues: checkBullet(b) }))
    .filter((r) => r.issues.length > 0)
}
