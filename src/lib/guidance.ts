/**
 * Rule-based bullet quality checks — runs locally, no AI calls.
 * Flags weak openers, missing quantification, and length problems.
 */
import { resumeToPlainText, type Resume } from '@/lib/resume'
import { findPassive, WEAK_OPENERS, type AtsResult, type SectionAnchor } from '@/lib/ats'
import { stripInlineMarks, unfinishedLinks } from '@/lib/marks'

const FILLER_WORDS = ['various', 'several', 'stuff', 'things', 'etc']

export interface BulletIssue {
  kind:
    | 'weak-opener'
    | 'no-metric'
    | 'too-long'
    | 'too-short'
    | 'filler'
    | 'first-person'
    | 'buzzword'
    | 'passive'
    | 'punctuation'
  message: string
}

export function checkBullet(bullet: string): BulletIssue[] {
  const text = stripInlineMarks(bullet).trim()
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
  const buzz = BUZZWORDS.find((w) => new RegExp(`\\b${w}\\b`).test(lower))
  if (buzz) {
    issues.push({
      kind: 'buzzword',
      message: `"${buzz}" is an empty claim — replace it with a concrete, checkable fact`,
    })
  }
  const passive = findPassive(text)
  if (passive) {
    issues.push({
      kind: 'passive',
      message: `Passive voice ("${passive}") hides who did the work — rewrite with an active verb`,
    })
  }
  if (!/^[A-Z0-9]/.test(text) || !/[.!?]$/.test(text)) {
    issues.push({
      kind: 'punctuation',
      message: 'Capitalize the first letter and end with a period',
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

/** Action-verb library grouped by what the bullet demonstrates. */
export const ACTION_VERBS: { group: string; verbs: string[] }[] = [
  { group: 'Achievement', verbs: ['Achieved', 'Exceeded', 'Delivered', 'Won', 'Earned', 'Surpassed'] },
  { group: 'Leadership', verbs: ['Led', 'Directed', 'Mentored', 'Coordinated', 'Oversaw', 'Chaired'] },
  { group: 'Building', verbs: ['Built', 'Designed', 'Developed', 'Launched', 'Created', 'Implemented'] },
  { group: 'Improvement', verbs: ['Improved', 'Increased', 'Reduced', 'Cut', 'Streamlined', 'Accelerated'] },
  { group: 'Analysis', verbs: ['Analyzed', 'Evaluated', 'Identified', 'Researched', 'Measured', 'Forecast'] },
  { group: 'Communication', verbs: ['Presented', 'Negotiated', 'Authored', 'Persuaded', 'Trained', 'Advised'] },
  { group: 'Initiative', verbs: ['Initiated', 'Pioneered', 'Introduced', 'Founded', 'Spearheaded', 'Proposed'] },
]

/**
 * Per-line issues for a bullet list. Quantification (`no-metric`) is excluded
 * here — a bullet list needs a balanced mix of descriptive and key-number
 * bullets, not a number on every line; see {@link bulletMix}.
 */
export function checkBullets(bullets: string[]): { index: number; issues: BulletIssue[] }[] {
  return bullets
    .map((b, index) => ({
      index,
      issues: checkBullet(b).filter((i) => i.kind !== 'no-metric'),
    }))
    .filter((r) => r.issues.length > 0)
}

/**
 * Entry-level key-number mix: balanced when at least one bullet in three
 * (minimum one) carries a digit — %, $, count or timeframe.
 */
export function bulletMix(bullets: string[]): {
  total: number
  quantified: number
  balanced: boolean
} {
  const lines = bullets.map((b) => b.trim()).filter(Boolean)
  const quantified = lines.filter((l) => /\d/.test(l)).length
  const total = lines.length
  return {
    total,
    quantified,
    balanced: total === 0 || quantified >= Math.max(1, Math.ceil(total / 3)),
  }
}

const STRONG_VERB_SET = new Set(
  ACTION_VERBS.flatMap((g) => g.verbs.map((v) => v.toLowerCase()))
)

const BUZZWORDS = [
  'synergy',
  'go-getter',
  'think outside the box',
  'team player',
  'hard worker',
  'detail-oriented',
  'results-driven',
  'self-starter',
  'dynamic',
  'proactive',
  'passionate',
  'motivated',
]

export interface HealthFinding {
  text: string
  /** Experience entry the finding points at, when it comes from one entry */
  entryId?: string
  entryLabel?: string
}

export interface HealthDimension {
  id: string
  label: string
  /** 0–100 */
  score: number
  /** One-line summary of the dimension state */
  summary: string
  /** Plain-language "why it matters" for readers new to resume advice */
  plain: string
  /** Specific findings, worst first */
  findings: string[]
  /** Findings with entry references, parallel to `findings` when present */
  richFindings?: HealthFinding[]
  /** Builder editor section that fixes the findings, when they all live in one section */
  anchor?: SectionAnchor
}

export interface HealthReport {
  /** 0–100 weighted overall */
  score: number
  dimensions: HealthDimension[]
}

/**
 * Multi-dimension rule-based health report — no AI calls, runs locally.
 * Complements resumeStrength (completeness) with writing-quality signals.
 */
export function resumeHealth(r: Resume): HealthReport {
  const bullets = r.experience.flatMap((e) =>
    e.bullets.filter((b) => b.trim()).map((b) => ({
      role: stripInlineMarks(e.role || e.company),
      text: b.trim(),
      entryId: e.id,
      entryLabel: [e.role, e.company].map(stripInlineMarks).filter((x) => x.trim()).join(', '),
    }))
  )
  const label = (b: { role: string; text: string }) => {
    const plain = stripInlineMarks(b.text)
    return `${b.role ? `[${b.role}] ` : ''}"${plain.length > 60 ? plain.slice(0, 57) + '…' : plain}"`
  }

  // 1. Quantification — % of bullets carrying a number
  const quantified = bullets.filter((b) => /\d/.test(b.text))
  const quantScore = bullets.length === 0 ? 0 : Math.round((quantified.length / bullets.length) * 100)
  const quantFindings: HealthFinding[] = bullets
    .filter((b) => !/\d/.test(b.text))
    .slice(0, 5)
    .map((b) => ({ text: `No number: ${label(b)}`, entryId: b.entryId, entryLabel: b.entryLabel }))
  const quantification: HealthDimension = {
    id: 'quantification',
    label: 'Quantified impact',
    plain: 'Numbers make claims believable — “cut costs 18%” beats “reduced costs” every time.',
    score: quantScore,
    summary:
      bullets.length === 0
        ? 'No experience bullets yet'
        : `${quantified.length} of ${bullets.length} bullets carry a real number`,
    findings: quantFindings.map((f) => f.text),
    richFindings: quantFindings,
    anchor: 'experience',
  }

  // 2. Verb strength — bullets opening with a strong action verb
  const weakOnes = bullets.filter((b) => {
    const lower = b.text.toLowerCase()
    return WEAK_OPENERS.some((w) => lower.startsWith(w)) || /^(i|my|we|our)\b/.test(lower)
  })
  const strongOnes = bullets.filter((b) => {
    const first = b.text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? ''
    return STRONG_VERB_SET.has(first) || (/^[a-z]+ed$/.test(first) && !weakOnes.includes(b))
  })
  const verbScore =
    bullets.length === 0
      ? 0
      : Math.round(
          Math.max(0, (strongOnes.length - weakOnes.length * 0.5) / bullets.length) * 100
        )
  const verbFindings: HealthFinding[] = weakOnes
    .slice(0, 5)
    .map((b) => ({ text: `Weak opener: ${label(b)}`, entryId: b.entryId, entryLabel: b.entryLabel }))
  const verbs: HealthDimension = {
    id: 'verbs',
    label: 'Action verbs',
    plain: 'Opening with a strong verb (“Built”, “Led”) reads as achievement; “responsible for” reads as a job description.',
    score: Math.min(100, verbScore),
    summary:
      bullets.length === 0
        ? 'No experience bullets yet'
        : `${strongOnes.length} of ${bullets.length} bullets open with a strong verb`,
    findings: verbFindings.map((f) => f.text),
    richFindings: verbFindings,
    anchor: 'experience',
  }

  // 3. Brevity — bullet and summary length discipline
  const tooLong = bullets.filter((b) => b.text.split(/\s+/).length > 30)
  const summaryWords = r.summary.trim() ? r.summary.trim().split(/\s+/).length : 0
  const brevityFindings: HealthFinding[] = tooLong
    .slice(0, 4)
    .map((b) => ({
      text: `${b.text.split(/\s+/).length} words: ${label(b)}`,
      entryId: b.entryId,
      entryLabel: b.entryLabel,
    }))
  if (summaryWords > 80)
    brevityFindings.unshift({ text: `Summary is ${summaryWords} words — aim for under 60` })
  const brevityScore =
    bullets.length === 0
      ? summaryWords > 0 && summaryWords <= 80
        ? 100
        : 50
      : Math.round(
          Math.max(0, 1 - (tooLong.length + (summaryWords > 80 ? 1 : 0)) / (bullets.length + 1)) * 100
        )
  const brevity: HealthDimension = {
    id: 'brevity',
    label: 'Brevity',
    plain: 'Recruiters skim each resume in seconds — long bullets get skipped, not read.',
    score: brevityScore,
    summary:
      brevityFindings.length === 0
        ? 'Bullets and summary are concise'
        : `${brevityFindings.length} item${brevityFindings.length === 1 ? ' is' : 's are'} running long`,
    findings: brevityFindings.map((f) => f.text),
    richFindings: brevityFindings,
  }

  // 4. Buzzwords & filler — vague words that carry no evidence
  const wholeText = [r.summary, ...bullets.map((b) => b.text)].join('\n').toLowerCase()
  const foundBuzz = BUZZWORDS.filter((w) => wholeText.includes(w))
  const foundFiller = FILLER_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(wholeText))
  const buzzHits = foundBuzz.length + foundFiller.length
  const buzzwords: HealthDimension = {
    id: 'buzzwords',
    label: 'Buzzword-free',
    plain: 'Words like “team player” claim a trait without proof — a concrete fact is always stronger.',
    score: Math.max(0, 100 - buzzHits * 20),
    summary:
      buzzHits === 0
        ? 'No empty buzzwords detected'
        : `${buzzHits} vague term${buzzHits === 1 ? '' : 's'} that a bullet should prove instead`,
    findings: [...foundBuzz, ...foundFiller].slice(0, 6).map((w) => `Replace "${w}" with a concrete, checkable fact`),
  }

  // 5. Consistency — tense discipline and unreplaced placeholders
  const consistencyFindings: HealthFinding[] = []
  for (const e of r.experience) {
    const isCurrent = /present|current/i.test(e.endDate)
    for (const b of e.bullets) {
      const plain = stripInlineMarks(b).trim()
      const first = plain.split(/\s+/)[0]?.toLowerCase() ?? ''
      if (!first) continue
      if (!isCurrent && e.endDate && /^[a-z]+(s|ing)$/.test(first) && !/^[a-z]+ss$/.test(first)) {
        consistencyFindings.push({
          text: `Past role at ${e.company || 'a previous employer'} uses present tense: "${plain.slice(0, 50)}…"`,
          entryId: e.id,
          entryLabel: [e.role, e.company].map(stripInlineMarks).filter((x) => x.trim()).join(', '),
        })
      }
    }
  }
  const rawBody = [r.summary, ...bullets.map((b) => b.text)].join('\n')
  const brokenLinks = unfinishedLinks(resumeToPlainText(r))
  if (brokenLinks.length > 0)
    consistencyFindings.unshift({
      text: `${brokenLinks.length} link${brokenLinks.length === 1 ? '' : 's'} like [${brokenLinks[0].label}](${brokenLinks[0].target}) still point${brokenLinks.length === 1 ? 's' : ''} at a placeholder — replace "${brokenLinks[0].target}" with a real web address`,
    })
  let placeholderBody = rawBody
  for (const l of brokenLinks) placeholderBody = placeholderBody.split(l.token).join('')
  const placeholders = placeholderBody
    .split('\n')
    .map(stripInlineMarks)
    .join('\n')
    .match(/\[[^\]\n]{1,60}\]/g)
  if (placeholders && placeholders.length > 0)
    consistencyFindings.unshift({
      text: `${placeholders.length} bracket placeholder${placeholders.length === 1 ? '' : 's'} like ${placeholders[0]} still unreplaced`,
    })
  const consistency: HealthDimension = {
    id: 'consistency',
    label: 'Consistency',
    plain: 'Mixed tenses and leftover [placeholders] look careless and can cost an interview.',
    score: Math.max(0, 100 - consistencyFindings.length * 25),
    summary:
      consistencyFindings.length === 0
        ? 'Tenses and placeholders look clean'
        : `${consistencyFindings.length} consistency issue${consistencyFindings.length === 1 ? '' : 's'}`,
    findings: consistencyFindings.slice(0, 5).map((f) => f.text),
    richFindings: consistencyFindings.slice(0, 5),
  }

  // 6. Completeness — reuse the strength meter
  const strength = resumeStrength(r)
  const completeness: HealthDimension = {
    id: 'completeness',
    label: 'Completeness',
    plain: 'Empty sections make a resume look unfinished — recruiters move on to the next one.',
    score: strength.score,
    summary:
      strength.missing.length === 0
        ? 'All core sections filled in'
        : `${strength.missing.length} section${strength.missing.length === 1 ? '' : 's'} still to fill`,
    findings: strength.missing.slice(0, 5),
  }

  const dimensions = [completeness, quantification, verbs, brevity, buzzwords, consistency]
  const score = Math.round(
    dimensions.reduce((s, d) => s + d.score * (HEALTH_WEIGHTS[d.id] ?? 0), 0)
  )
  return { score, dimensions }
}

/** Weight of each health dimension in the overall writing score */
export const HEALTH_WEIGHTS: Record<string, number> = {
  completeness: 0.3,
  quantification: 0.2,
  verbs: 0.2,
  brevity: 0.1,
  buzzwords: 0.1,
  consistency: 0.1,
}

export interface PriorityFix {
  text: string
  impact: 'high' | 'medium'
  /** Score points recoverable by fixing this item */
  points: number
  anchor?: SectionAnchor
  entryId?: string
  entryLabel?: string
}

/**
 * Cross-dimension triage: the top fixes ranked by how many score points each
 * one recovers, computed from the existing ATS and health formulas.
 */
export function priorityFixes(ats: AtsResult, health: HealthReport, limit = 5): PriorityFix[] {
  const fixes: PriorityFix[] = []

  const structureWeight = ats.keywordScore !== null ? 30 : 100
  const perCheck = structureWeight / ats.checks.length
  for (const check of ats.checks) {
    if (check.pass) continue
    fixes.push({
      text: `${check.label} — ${check.hint}`,
      impact: perCheck >= 10 ? 'high' : 'medium',
      points: Math.round(perCheck * 10) / 10,
      anchor: check.anchor,
    })
  }

  if (ats.keywordScore !== null && ats.missing.length > 0) {
    const total = ats.matched.length + ats.missing.length
    const points = Math.round((70 * ats.missing.length) / total)
    const named = ats.missing.slice(0, 3).map((k) => `"${k}"`).join(', ')
    fixes.push({
      text: `Add missing job keywords — ${ats.missing.length} of ${total} posting keywords are absent (${named}${ats.missing.length > 3 ? '…' : ''})`,
      impact: points >= 10 || ats.keywordScore < 50 ? 'high' : 'medium',
      points,
    })
  }

  for (const d of health.dimensions) {
    if (d.score >= 80) continue
    const points = Math.round((100 - d.score) * (HEALTH_WEIGHTS[d.id] ?? 0))
    if (points < 1) continue
    const first = d.richFindings?.[0]
    fixes.push({
      text: `${d.label} — ${d.findings[0] ?? d.summary}`,
      impact: points >= 10 || d.score < 50 ? 'high' : 'medium',
      points,
      anchor: d.anchor,
      entryId: first?.entryId,
      entryLabel: first?.entryLabel,
    })
  }

  return fixes.sort((a, b) => b.points - a.points).slice(0, limit)
}

/**
 * Locally composed assistant reply for the "Improve my ATS score" quick task:
 * the score plus the ranked priority fixes, no AI round trip.
 */
export function improveScoreReply(
  score: number,
  fixes: PriorityFix[],
  hasJd: boolean,
): string {
  if (fixes.length === 0) {
    return (
      `Your ATS score is ${score}/100 — no priority fixes right now. ` +
      (hasJd
        ? 'Nice work — ask me anything you\u2019d like to sharpen.'
        : 'Add a job description in the Target job panel and I can point out missing keywords too.')
    )
  }
  return (
    `Your ATS score is ${score}/100. Highest-impact fixes first:\n` +
    fixes.map((f, i) => `${i + 1}. ${f.text} (~${f.points} pts, ${f.impact} impact)`).join('\n') +
    '\n\nApply a fix and your score updates instantly. The Score breakdown has one-click jumps to each spot.'
  )
}

export interface StrengthResult {
  /** 0–100 completeness score */
  score: number
  /** What's still missing, in fix-first order */
  missing: string[]
}

/** Rule-based resume completeness meter — no AI, mirrors what recruiters scan for. */
export function resumeStrength(r: Resume): StrengthResult {
  const allBullets = r.experience.flatMap((e) => e.bullets.filter((b) => b.trim()))
  const checks: [boolean, string, number][] = [
    [Boolean(r.contact.fullName.trim()), 'Add your name', 10],
    [Boolean(r.contact.email.trim()), 'Add an email address', 10],
    [Boolean(r.contact.title.trim()), 'Add a professional title', 5],
    [r.summary.trim().length >= 60, 'Write a 2–3 sentence summary', 10],
    [r.experience.length > 0, 'Add at least one experience entry', 15],
    [allBullets.length >= 3, 'Add 3+ achievement bullets across your roles', 15],
    [allBullets.some((b) => /\d/.test(b)), 'Put a real number in at least one bullet', 10],
    [r.education.length > 0, 'Add your education', 10],
    [
      r.skills.split(/[,\n]/).filter((s) => s.trim()).length >= 5,
      'List at least 5 skills',
      10,
    ],
    [Boolean(r.jobDescription.trim()), 'Paste a job description to tailor against', 5],
  ]
  let score = 0
  const missing: string[] = []
  for (const [pass, hint, weight] of checks) {
    if (pass) score += weight
    else missing.push(hint)
  }
  return { score, missing }
}

/**
 * Split a rewrite candidate into whitespace-preserving chunks, marking words
 * that don't appear in the original text (normalized: lowercased, inline marks
 * and edge punctuation stripped) so changes are scannable at a glance.
 */
export function diffNewWords(
  original: string,
  candidate: string
): { text: string; added: boolean }[] {
  const norm = (w: string) =>
    stripInlineMarks(w)
      .toLowerCase()
      .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
  const have = new Set(
    stripInlineMarks(original)
      .split(/\s+/)
      .map(norm)
      .filter(Boolean)
  )
  return candidate
    .split(/(\s+)/)
    .filter((c) => c.length > 0)
    .map((chunk) => {
      const w = norm(chunk)
      return { text: chunk, added: w.length > 0 && !have.has(w) }
    })
}
