import { extractKeywords, highPriorityKeywords } from './ats'
import type { Resume } from './resume'

export interface AnswerAnalysis {
  words: number
  lengthBand: 'short' | 'ideal' | 'long'
  lengthHint: string
  star: { context: boolean; action: boolean; result: boolean }
  keywords: { covered: string[]; missing: string[]; highPriorityMissing: string[] } | null
  fillers: string[]
  weHeavy: boolean
  score: number
}

export interface DeliveryAnalysis {
  wpm: number
  paceBand: 'slow' | 'ideal' | 'fast'
  paceHint: string
  windowPct: number
  windowBand: 'under' | 'ideal' | 'over'
  windowHint: string
}

export const RESPONSE_WINDOW_SECONDS = 120

/** Deterministic pace + speaking-time read on a timed answer — no AI, no network. */
export function analyzeDelivery(
  answer: string,
  elapsedSeconds: number,
  windowSeconds: number = RESPONSE_WINDOW_SECONDS
): DeliveryAnalysis | null {
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0
  if (elapsedSeconds < 5 || words < 10) return null

  const wpm = Math.round(words / (elapsedSeconds / 60))
  const paceBand: DeliveryAnalysis['paceBand'] = wpm < 120 ? 'slow' : wpm > 140 ? 'fast' : 'ideal'
  const paceHint =
    paceBand === 'slow'
      ? 'Below the 120–140 wpm conversational range — practice delivering with fewer pauses.'
      : paceBand === 'fast'
        ? 'Above the 120–140 wpm range — slow down so interviewers can follow.'
        : 'In the 120–140 wpm conversational range.'

  const windowPct = Math.round((Math.min(elapsedSeconds, windowSeconds) / windowSeconds) * 100)
  const windowBand: DeliveryAnalysis['windowBand'] =
    elapsedSeconds >= windowSeconds ? 'over' : windowPct < 60 ? 'under' : 'ideal'
  const windowHint =
    windowBand === 'under'
      ? 'Underdeveloped — aim to own 60%+ of the response window with context, action and outcome.'
      : windowBand === 'over'
        ? 'Overextended — the window ran out; land the outcome sooner.'
        : 'Appropriately complete — you owned the window without running it out.'

  return { wpm, paceBand, paceHint, windowPct, windowBand, windowHint }
}

export interface QuickFillerHit {
  phrase: string
  count: number
  atStart: number
}

export interface QuickFillerAnalysis {
  hits: QuickFillerHit[]
  total: number
  perMinute: number | null
}

const QUICK_FILLER_PHRASES = [
  'kind of',
  'sort of',
  'i think',
  'i guess',
  'i mean',
  'you know',
  'at the end of the day',
  'maybe',
  'basically',
  'honestly',
  'stuff',
  'things like that',
]

/** Deterministic quick-filler frequency and placement read — no AI, no network. */
export function analyzeQuickFillers(answer: string, elapsedSeconds?: number): QuickFillerAnalysis {
  const hits: QuickFillerHit[] = []
  for (const phrase of QUICK_FILLER_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(^|[.!?]\\s+)?\\b${escaped}\\b`, 'gi')
    let count = 0
    let atStart = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(answer)) !== null) {
      count++
      if (m.index === 0 || m[1] !== undefined) atStart++
      if (m.index === re.lastIndex) re.lastIndex++
    }
    if (count > 0) hits.push({ phrase, count, atStart })
  }
  const total = hits.reduce((sum, h) => sum + h.count, 0)
  const perMinute =
    elapsedSeconds !== undefined && elapsedSeconds >= 5 && total > 0
      ? Math.round((total / (elapsedSeconds / 60)) * 10) / 10
      : null
  return { hits, total, perMinute }
}

export interface FillerSoundHit {
  sound: string
  count: number
}

export interface FillerSoundAnalysis {
  hits: FillerSoundHit[]
  total: number
  perMinute: number | null
  band: 'good' | 'high' | null
}

const FILLER_SOUNDS = ['um', 'uhm', 'uh', 'er', 'ah', 'hm', 'hmm']

/** Deterministic filler-sound (um/uh/er/ah/hm) frequency read — no AI, no network. */
export function analyzeFillerSounds(answer: string, elapsedSeconds?: number): FillerSoundAnalysis {
  const hits: FillerSoundHit[] = []
  for (const sound of FILLER_SOUNDS) {
    const re = new RegExp(`\\b${sound}\\b`, 'gi')
    const count = (answer.match(re) ?? []).length
    if (count > 0) hits.push({ sound, count })
  }
  const total = hits.reduce((sum, h) => sum + h.count, 0)
  const perMinute =
    elapsedSeconds !== undefined && elapsedSeconds >= 5 && total > 0
      ? Math.round((total / (elapsedSeconds / 60)) * 10) / 10
      : null
  const band: FillerSoundAnalysis['band'] = perMinute === null ? null : perMinute <= 2 ? 'good' : 'high'
  return { hits, total, perMinute, band }
}

export interface ToneDimension {
  good: boolean
  detail: string
}

export interface ToneAnalysis {
  clarity: ToneDimension
  confidence: ToneDimension
  enthusiasm: ToneDimension
}

const HEDGE_PHRASES = [
  'i think',
  'i guess',
  'i suppose',
  'maybe',
  'perhaps',
  'probably',
  'hopefully',
  "i'm not sure",
  'it seems',
  'i feel like',
]

const ENGAGEMENT_RE =
  /\b(enjoy(?:ed|s)?|excited|exciting|loved?|proud|satisfying|motivat(?:es|ed|or|ing)|passion(?:ate)?|fascinating|rewarding|care about)\b/i

/** Deterministic text-proxy tone read (clarity / confidence / enthusiasm) — no AI, no network. */
export function analyzeTone(answer: string): ToneAnalysis | null {
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0
  if (words < 10) return null

  const sentences = answer
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const longest = sentences.reduce((max, s) => Math.max(max, s.split(/\s+/).length), 0)
  const clarity: ToneDimension =
    longest > 40
      ? { good: false, detail: `longest sentence runs ${longest} words; keep one idea per sentence` }
      : { good: true, detail: 'focused sentences' }

  const hedgeHits: { phrase: string; count: number }[] = []
  for (const phrase of HEDGE_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const count = (answer.match(new RegExp(`\\b${escaped}\\b`, 'gi')) ?? []).length
    if (count > 0) hedgeHits.push({ phrase, count })
  }
  const hedgeTotal = hedgeHits.reduce((sum, h) => sum + h.count, 0)
  const confidence: ToneDimension =
    hedgeTotal >= 2
      ? {
          good: false,
          detail: `hedged (${hedgeHits.map((h) => `“${h.phrase}” ×${h.count}`).join(', ')}); state it directly`,
        }
      : { good: true, detail: 'decisive' }

  const enthusiasm: ToneDimension =
    words >= 40 && !ENGAGEMENT_RE.test(answer)
      ? { good: false, detail: 'flat; add a line on why it mattered to you' }
      : { good: true, detail: 'engaged' }

  return { clarity, confidence, enthusiasm }
}

const CONTEXT_RE =
  /\b(when|while|during|at the time|last (?:year|quarter|month)|my (?:team|role|company|manager)|our (?:team|product|client)|we (?:were|had|needed)|the (?:project|problem|challenge|situation|goal|deadline)|i was (?:working|responsible|tasked|asked))\b/i

const ACTION_RE =
  /\bi\b[^.!?]{0,60}?\b(led|built|designed|created|developed|implemented|migrated|launched|shipped|wrote|refactored|automated|negotiated|organized|coordinated|analyzed|analysed|debugged|fixed|resolved|proposed|presented|owned|drove|managed|mentored|prioritized|prioritised|decided|architected|tested|deployed|optimized|optimised|reduced|increased|improved|delivered)\b/i

const RESULT_RE =
  /(\d+(?:[.,]\d+)?\s*%|\$\s?\d|\b\d{2,}\b|\b(result(?:ed|s)? in|increased|reduced|cut|saved|improved|grew|doubled|halved|delivered|shipped|launched|which (?:led|meant|allowed)|so (?:that )?we|outcome)\b)/i

const FILLER_PHRASES = [
  'kind of',
  'sort of',
  'i think',
  'i guess',
  'maybe',
  'basically',
  'you know',
  'honestly',
  'stuff',
  'things like that',
]

function tokens(text: string): Set<string> {
  return new Set(
    (
      text
        .toLowerCase()
        .replace(/[^a-z0-9+#./ -]/g, ' ')
        .match(/[a-z0-9+#][a-z0-9+#./-]*/g) ?? []
    ).map((t) => t.replace(/[./-]+$/, ''))
  )
}

/** Deterministic, local analysis of a practice interview answer — no AI, no network. */
export function analyzeAnswer(
  answer: string,
  jobDescription: string,
  ignoredKeywords: string[] = []
): AnswerAnalysis {
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const lengthBand: AnswerAnalysis['lengthBand'] = words < 40 ? 'short' : words > 250 ? 'long' : 'ideal'
  const lengthHint =
    lengthBand === 'short'
      ? 'Too short — aim for 60–200 words (roughly 30–90 seconds spoken).'
      : lengthBand === 'long'
        ? 'Long — trim toward ~200 words; interviewers lose the thread past two minutes.'
        : 'Good length for a spoken answer.'

  const star = {
    context: CONTEXT_RE.test(answer),
    action: ACTION_RE.test(answer),
    result: RESULT_RE.test(answer),
  }

  const lower = answer.toLowerCase()
  const fillers = FILLER_PHRASES.filter((p) => lower.includes(p))
  const iCount = (lower.match(/\bi\b/g) ?? []).length
  const weCount = (lower.match(/\bwe\b/g) ?? []).length
  const weHeavy = weCount > iCount && weCount >= 3

  let keywords: AnswerAnalysis['keywords'] = null
  if (jobDescription.trim()) {
    const ignored = new Set(ignoredKeywords.map((k) => k.toLowerCase()))
    const kws = extractKeywords(jobDescription).filter((k) => !ignored.has(k))
    if (kws.length > 0) {
      const toks = tokens(answer)
      const covered: string[] = []
      const missing: string[] = []
      for (const kw of kws) {
        if (kw.includes(' ') ? lower.includes(kw) : toks.has(kw)) covered.push(kw)
        else missing.push(kw)
      }
      const high = highPriorityKeywords(jobDescription, kws)
      keywords = { covered, missing, highPriorityMissing: missing.filter((k) => high.has(k)) }
    }
  }

  const lengthPts = lengthBand === 'ideal' ? 25 : lengthBand === 'long' ? 15 : Math.round((words / 40) * 15)
  const starPts = (star.context ? 10 : 0) + (star.action ? 10 : 0) + (star.result ? 10 : 0)
  const deliveryPts = (fillers.length <= 1 ? 8 : fillers.length <= 3 ? 4 : 0) + (weHeavy ? 0 : 7)
  let score: number
  if (keywords) {
    const total = keywords.covered.length + keywords.missing.length
    const kwPts = Math.round((keywords.covered.length / total) * 30)
    score = lengthPts + starPts + kwPts + deliveryPts
  } else {
    score = Math.round(((lengthPts + starPts + deliveryPts) / 70) * 100)
  }
  return { words, lengthBand, lengthHint, star, keywords, fillers, weHeavy, score: Math.min(100, score) }
}

/** Session-level feedback report over a finished practice session — no AI, no network. */
export function sessionReport(
  entries: { q: string; a: string }[],
  jobDescription: string,
  ignoredKeywords: string[] = []
): string {
  const scored = entries
    .map((e, i) => ({ index: i + 1, analysis: analyzeAnswer(e.a, jobDescription, ignoredKeywords) }))
    .filter((s) => s.analysis.words >= 10)
  if (scored.length === 0) return ''

  const average = Math.round(scored.reduce((sum, s) => sum + s.analysis.score, 0) / scored.length)
  const lines = [
    'Session report',
    `Scored ${scored.length} of ${entries.length} answers · average practice score ${average}/100`,
    scored.map((s) => `Q${s.index} ${s.analysis.score}/100`).join(' · '),
  ]

  if (scored[0].analysis.keywords) {
    const coveredUnion = new Set<string>()
    for (const s of scored) for (const kw of s.analysis.keywords?.covered ?? []) coveredUnion.add(kw)
    const ignored = new Set(ignoredKeywords.map((k) => k.toLowerCase()))
    const kws = extractKeywords(jobDescription).filter((k) => !ignored.has(k))
    const covered = kws.filter((k) => coveredUnion.has(k))
    const missing = kws.filter((k) => !coveredUnion.has(k))
    const high = highPriorityKeywords(jobDescription, kws)
    const cap = (list: string[]) =>
      list.slice(0, 8).join(', ') + (list.length > 8 ? ` +${list.length - 8} more` : '')
    lines.push(
      `Keywords covered across the session: ${covered.length > 0 ? cap(covered) : 'none'} (${covered.length} of ${kws.length})`
    )
    const highMissing = missing.filter((k) => high.has(k))
    const remaining = missing.filter((k) => !high.has(k))
    if (highMissing.length > 0) lines.push(`High Priority Words still missing: ${cap(highMissing)}`)
    if (remaining.length > 0) lines.push(`Remaining Keywords still missing: ${cap(remaining)}`)
  }
  return lines.join('\n')
}

/** Role-specific practice questions built from the resume and target job — no AI, no network. */
export function localInterviewQuestions(resume: Resume): string[] {
  const role = resume.targetRole.trim()
  const company = (resume.targetCompany ?? '').trim()
  const questions: string[] = [
    role
      ? `Walk me through your background — why are you a fit for the ${role} role${company ? ` at ${company}` : ''}?`
      : 'Walk me through your background — what kind of role are you looking for next?',
  ]
  for (const item of resume.experience.filter((e) => !e.hidden && e.role.trim()).slice(0, 2)) {
    questions.push(
      `Tell me about your time as ${item.role.trim()}${item.company.trim() ? ` at ${item.company.trim()}` : ''}. What result are you most proud of from that role?`
    )
  }
  const jd = resume.jobDescription
  if (jd.trim()) {
    const keywords = extractKeywords(jd)
    const high = highPriorityKeywords(jd, keywords)
    for (const kw of keywords.filter((k) => high.has(k)).slice(0, 2)) {
      questions.push(
        `This role emphasizes ${kw}. Describe a specific project where you used it and what the outcome was.`
      )
    }
  }
  questions.push(
    'Tell me about a time something went wrong at work. What did you do, and what changed afterwards?'
  )
  return questions.slice(0, 6)
}
