/**
 * Client-side ATS match scoring: extract keywords from a job description and
 * measure how many appear in the resume. Free forever — runs entirely in the
 * browser; the JD and resume never leave the device for scoring.
 */

const STOPWORDS = new Set(
  `a about above after again all also am an and any are as at be because been
before being below between both but by can could did do does doing down during
each few for from further had has have having he her here hers herself him
himself his how i if in into is it its itself just me more most my myself no
nor not now of off on once only or other our ours ourselves out over own same
she should so some such than that the their theirs them themselves then there
these they this those through to too under until up very was we were what when
where which while who whom why will with you your yours yourself yourselves
work working job candidate ideal role position company team years experience
experienced strong ability able etc including include includes preferred plus
required requirements responsibilities qualifications skills apply applicants
must may new us we're you'll looking join per day help make take across within
using use based least good great well knowledge understanding familiarity
excellent communication written verbal bonus nice benefits salary equal
opportunity employer diverse remote hybrid onsite full-time part-time
need needs needed want wants wanted seek seeking hire hiring hires hired
offer offers offering
candidates applicant someone person people employees staff opportunities
career mission culture location office schedule compensation pay perks
package eligible employment key core top best right related relevant similar
many multiple several various successful proven passionate motivated driven
day days week weeks month months`.split(/\s+/)
)

/** Multi-word tech/business phrases worth matching as units */
const KNOWN_PHRASES = [
  'machine learning', 'data science', 'project management', 'product management',
  'customer service', 'supply chain', 'quality assurance', 'user experience',
  'user research', 'business development', 'data analysis', 'data analytics',
  'cloud computing', 'web development', 'software development', 'agile',
  'continuous integration', 'version control', 'unit testing', 'rest api',
  'restful api', 'microservices', 'design system', 'a/b testing',
  'stakeholder management', 'cross-functional', 'problem solving',
  'social media', 'content marketing', 'search engine optimization',
  'account management', 'digital marketing', 'financial analysis',
  'risk management', 'change management', 'human resources',
]

/** Builder editor section that fixes a failing structural check */
export type SectionAnchor =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'skills'
  | 'education'

export interface KeywordDetail {
  keyword: string
  inResume: number
  inJobAd: number
}

export interface AtsResult {
  score: number
  matched: string[]
  missing: string[]
  /** Per-keyword occurrence counts (resume vs job ad), missing keywords first */
  keywordDetail: KeywordDetail[]
  /** JD keywords the user marked not relevant — excluded from coverage */
  ignored: string[]
  /** Keyword coverage 0-100, or null when no JD was provided */
  keywordScore: number | null
  /** Structure/best-practices sub-score 0-100 */
  structureScore: number
  /** Structural checks independent of the JD */
  checks: { label: string; pass: boolean; hint: string; anchor?: SectionAnchor }[]
}

function countOccurrences(haystack: string, tokens: string[], kw: string): number {
  if (kw.includes(' ')) {
    let n = 0
    let i = haystack.indexOf(kw)
    while (i !== -1) {
      n++
      i = haystack.indexOf(kw, i + kw.length)
    }
    return n
  }
  return tokens.filter((t) => t === kw).length
}

function keywordDetailFor(
  keywords: string[],
  resumeText: string,
  resumeTokens: string[],
  jd: string
): KeywordDetail[] {
  const jdLower = jd.toLowerCase()
  const jdTokens = tokenize(jd)
  return keywords
    .map((kw) => ({
      keyword: kw,
      inResume: countOccurrences(resumeText, resumeTokens, kw),
      inJobAd: countOccurrences(jdLower, jdTokens, kw),
    }))
    .sort((a, b) => (a.inResume === 0 ? 0 : 1) - (b.inResume === 0 ? 0 : 1) || b.inJobAd - a.inJobAd)
}

const WORD_COUNT_MIN = 400
const WORD_COUNT_MAX = 800

const REVERSE_CHRON_LABEL = 'Experience in reverse-chronological order'
const REVERSE_CHRON_PASS_HINT =
  'Most recent role first — the reverse-chronological layout recruiters and ATS parsers expect.'

/**
 * Reverse-chronological check over dated periods listed top to bottom.
 * Ranks like sortEntriesByDate: ongoing = now, else end date (falling back to
 * start); undated periods are skipped, fewer than 2 dated periods pass.
 */
function reverseChronCheck(
  periods: { name: string; start: string; end: string }[]
): AtsResult['checks'][number] {
  const keyed = periods
    .map((p) => ({
      name: p.name,
      primary: ONGOING_RE.test(p.end)
        ? Number.MAX_SAFE_INTEGER
        : (dateSortValue(p.end) ?? dateSortValue(p.start)),
      start: dateSortValue(p.start),
    }))
    .filter((p) => p.primary !== null)
  let offender = ''
  for (let i = 1; i < keyed.length && !offender; i++) {
    const prev = keyed[i - 1]
    const cur = keyed[i]
    if (
      cur.primary! > prev.primary! ||
      (cur.primary === prev.primary &&
        cur.start !== null &&
        prev.start !== null &&
        cur.start > prev.start)
    ) {
      offender = cur.name
    }
  }
  return {
    label: REVERSE_CHRON_LABEL,
    pass: !offender,
    hint: offender
      ? `"${offender}" appears below a less recent role — list your most recent position first (the Sort-by-date toggle fixes this in one click).`
      : REVERSE_CHRON_PASS_HINT,
    anchor: 'experience',
  }
}

const EXPERIENCE_HEADING_RE = /^\s*(work |professional |employment )?experience\s*:?\s*$/im
const NEXT_SECTION_RE =
  /^\s*(education|(technical |core |key )?skills|projects|certifications?|awards|publications|languages|interests|volunteer(ing)?|involvement)\s*:?\s*$/im
const DATE_RANGE_RE =
  /((?:19|20)\d{2}|[a-z]{3,9}[ ./-]*(?:19|20)\d{2}|\d{1,2}[/.-](?:19|20)\d{2})\s*(?:[–—-]|to)\s*((?:19|20)\d{2}|[a-z]{3,9}[ ./-]*(?:19|20)\d{2}|\d{1,2}[/.-](?:19|20)\d{2}|present|current|now|ongoing)/gi

/** Experience block of pasted text: from the experience heading to the next standard heading */
function experienceBlock(raw: string): string | null {
  const heading = EXPERIENCE_HEADING_RE.exec(raw)
  if (!heading) return null
  const after = raw.slice(heading.index + heading[0].length)
  const next = NEXT_SECTION_RE.exec(after)
  return next ? after.slice(0, next.index) : after
}

/** Pasted text split at the experience heading: summary-ish head, experience-onward tail */
function textPronounSegments(raw: string): { text: string; anchor: SectionAnchor }[] {
  const heading = EXPERIENCE_HEADING_RE.exec(raw)
  if (!heading) return [{ text: raw, anchor: 'summary' }]
  return [
    { text: raw.slice(0, heading.index), anchor: 'summary' },
    { text: raw.slice(heading.index), anchor: 'experience' },
  ]
}

/** Date ranges ("Jun 2023 – Present", "2019-2021") in the experience block of pasted text */
function textDateRanges(raw: string): { name: string; start: string; end: string }[] {
  const block = experienceBlock(raw)
  if (block === null) return []
  const ranges: { name: string; start: string; end: string }[] = []
  for (const m of block.matchAll(DATE_RANGE_RE)) {
    ranges.push({ name: m[0], start: m[1], end: m[2] })
  }
  return ranges
}

const BULLET_LINE_RE = /^\s*[-–—•*▪◦·]\s*\S/

const countBulletLines = (text: string) =>
  text.split(/\n/).filter((l) => BULLET_LINE_RE.test(l)).length

/**
 * Bullet-line counts per experience entry in pasted text. Entries are the
 * segments between consecutive date ranges, named by their date range.
 * Empty when there is no experience heading, no date range, or no
 * bullet-marker lines at all (pasting often strips markers).
 */
function textBulletCounts(raw: string): { name: string; count: number }[] {
  const block = experienceBlock(raw)
  if (block === null || countBulletLines(block) === 0) return []
  const matches = [...block.matchAll(DATE_RANGE_RE)]
  return matches.map((m, i) => {
    const from = m.index + m[0].length
    const to = i + 1 < matches.length ? matches[i + 1].index : block.length
    return { name: m[0], count: countBulletLines(block.slice(from, to)) }
  })
}

const MONTH_YEAR_RE = /^[a-z]{3,9}\.?[ ,./-]*(?:19|20)\d{2}$/i
const NUMERIC_DATE_RE = /^\d{1,2}[/.-](?:19|20)\d{2}$/

/** Date style: named month + year vs numeric month + year; anything else is skipped */
function dateStyle(text: string): 'month-year' | 'numeric' | null {
  const t = text.trim()
  if (!t || ONGOING_RE.test(t)) return null
  if (MONTH_YEAR_RE.test(t)) return 'month-year'
  if (NUMERIC_DATE_RE.test(t)) return 'numeric'
  return null
}

/** Consistent date formatting: fails only on an unambiguous named/numeric month mix */
function dateFormatCheck(dates: string[]): AtsResult['checks'][number] {
  let monthYear = ''
  let numeric = ''
  for (const d of dates) {
    const style = dateStyle(d)
    if (style === 'month-year' && !monthYear) monthYear = d.trim()
    if (style === 'numeric' && !numeric) numeric = d.trim()
  }
  const pass = !(monthYear && numeric)
  return {
    label: 'Consistent date formatting',
    pass,
    hint: pass
      ? 'Dates use one format — ATS parsers read your timeline consistently.'
      : `Dates mix formats ("${monthYear}" vs "${numeric}") — pick one style so ATS parsers read your timeline consistently.`,
    anchor: 'experience',
  }
}

/**
 * "I" only counts followed by an apostrophe (I'm) or a lowercase word that is
 * not a conjunction/preposition — subject "I" precedes a verb, so "I/O",
 * "Part I" and "Phase I of" never match.
 */
const PRONOUN_RE =
  /\b(?:[Mm]e|[Mm]y|[Mm]yself)\b|\bI(?=['’][a-z]|\s+(?!(?:of|and|or|in|at|on|to|for|the|an?)\b)[a-z])/

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Written form suggested for a numeric date, e.g. "08/2021" → "Aug 2021" */
function namedMonthSuggestion(numericDate: string): string {
  const m = /^(\d{1,2})[/.-]((?:19|20)\d{2})$/.exec(numericDate)
  const month = m ? Number(m[1]) : 0
  return month >= 1 && month <= 12 ? `${MONTH_ABBR[month - 1]} ${m![2]}` : 'a written month like Jan 2021'
}

/** Dates use a written month: named months read faster than numeric ones */
function namedMonthDatesCheck(dates: string[]): AtsResult['checks'][number] {
  const offender = dates.map((d) => d.trim()).find((d) => dateStyle(d) === 'numeric')
  return {
    label: 'Dates use a written month',
    pass: !offender,
    hint: offender
      ? `"${offender}" is numeric — write dates with a month name ("${namedMonthSuggestion(offender)}") so employers grasp your timeline at a glance.`
      : 'Dates use written month names — employers grasp your timeline at a glance.',
    anchor: 'experience',
  }
}

/** No first-person pronouns: resumes are written in the implied first person */
function pronounCheck(
  segments: { text: string; anchor: SectionAnchor }[]
): AtsResult['checks'][number] {
  let found = ''
  let anchor: SectionAnchor = 'summary'
  for (const seg of segments) {
    const m = PRONOUN_RE.exec(seg.text)
    if (m) {
      found = m[0]
      anchor = seg.anchor
      break
    }
  }
  return {
    label: 'No first-person pronouns',
    pass: !found,
    hint: found
      ? `Found "${found}" — drop first-person pronouns ("I", "me", "my") and lead with the action itself: "Led a team of 8", not "I led my team".`
      : 'Written in the implied first person — no "I", "me" or "my" for recruiters to trip over.',
    anchor,
  }
}

/** LinkedIn URL: recruiters use it to verify and expand on the resume */
function linkedinCheck(pass: boolean): AtsResult['checks'][number] {
  return {
    label: 'LinkedIn URL',
    pass,
    hint: pass
      ? 'LinkedIn URL found — recruiters can verify and expand on your resume.'
      : 'Add your LinkedIn URL (linkedin.com/in/yourname) — recruiters use it to verify and expand on your resume.',
    anchor: 'contact',
  }
}

const ENTRY_LOCATIONS_LABEL = 'Locations on each entry'
const ENTRY_LOCATIONS_PASS_HINT =
  'Every entry lists a location — employers can validate your experience at a glance.'

/** Locations on each entry: work, involvement and education entries should carry one */
function entryLocationsCheck(
  entries: { name: string; located: boolean; anchor: SectionAnchor }[]
): AtsResult['checks'][number] {
  const offender = entries.find((e) => !e.located)
  return {
    label: ENTRY_LOCATIONS_LABEL,
    pass: !offender,
    hint: offender
      ? `"${offender.name}" has no location — add a city (or "Remote") to every entry so employers can validate your experience.`
      : ENTRY_LOCATIONS_PASS_HINT,
    anchor: offender?.anchor ?? 'experience',
  }
}

const LOCATION_LIKE_RE =
  /\b(?:Remote|Hybrid)\b|\b[A-Z][A-Za-z.]+,\s*(?:[A-Z]{2}\b|[A-Z][A-Za-z]+)/

/**
 * Per-entry location presence in pasted text. Each entry's segment runs from
 * up to two lines above its date range (role/company header lines often carry
 * the location, e.g. "Company — Austin, TX" above the dates) to the next
 * range's header, never reaching into the previous entry. Empty when there is
 * no experience heading or no date ranges (never false-alarm on unparseable
 * text).
 */
function textEntryLocations(
  raw: string
): { name: string; located: boolean; anchor: SectionAnchor }[] {
  const block = experienceBlock(raw)
  if (block === null) return []
  const matches = [...block.matchAll(DATE_RANGE_RE)]
  const headerStart = (m: RegExpExecArray | RegExpMatchArray, floor: number) => {
    let start = block.lastIndexOf('\n', m.index!) + 1
    for (let up = 0; up < 2 && start - 1 > floor; up++) {
      start = block.lastIndexOf('\n', start - 2) + 1
    }
    return Math.max(start, floor)
  }
  return matches.map((m, i) => {
    const prevEnd = i > 0 ? matches[i - 1].index! + matches[i - 1][0].length : 0
    const from = headerStart(m, prevEnd)
    const to = i + 1 < matches.length ? headerStart(matches[i + 1], m.index! + m[0].length) : block.length
    return {
      name: m[0],
      located: LOCATION_LIKE_RE.test(block.slice(from, to)),
      anchor: 'experience' as const,
    }
  })
}

const BULLETS_PER_ENTRY_LABEL = '3–6 bullet points per role'

/** Per-entry bullet-count check: every role should carry 3–6 bullet points */
function bulletsPerEntryCheck(
  entries: { name: string; count: number }[]
): AtsResult['checks'][number] {
  const offender = entries.find((e) => e.count < 3 || e.count > 6)
  return {
    label: BULLETS_PER_ENTRY_LABEL,
    pass: !offender,
    hint: offender
      ? `"${offender.name}" has ${offender.count} bullet point${offender.count === 1 ? '' : 's'} — aim for 3–6 per role so each entry shows enough impact without overwhelming the reader.`
      : 'Every role carries 3–6 bullet points — enough detail without overwhelming the reader.',
    anchor: 'experience',
  }
}

function wordCountCheck(text: string, anchor?: SectionAnchor): AtsResult['checks'][number] {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const pass = words >= WORD_COUNT_MIN && words <= WORD_COUNT_MAX
  const hint = pass
    ? `${words} words — within the ${WORD_COUNT_MIN}–${WORD_COUNT_MAX} range recruiters expect.`
    : words < WORD_COUNT_MIN
      ? `Your resume is ${words} words — recruiters and ATS systems expect at least ~${WORD_COUNT_MIN}; expand your experience bullets.`
      : `Your resume is ${words} words — trim to under ~${WORD_COUNT_MAX} so recruiters can scan it.`
  return { label: 'Word count in recommended range', pass, hint, anchor }
}

function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#./ -]/g, ' ')
      .match(/[a-z0-9+#][a-z0-9+#./-]*/g) ?? []
  ).map((t) => t.replace(/[./-]+$/, ''))
}

/** Extract ranked keywords (words + known phrases) from a job description */
export function extractKeywords(jd: string, limit = 30): string[] {
  const lower = jd.toLowerCase()
  const found = new Map<string, number>()
  for (const phrase of KNOWN_PHRASES) {
    if (lower.includes(phrase)) found.set(phrase, 5)
  }
  const counts = new Map<string, number>()
  for (const tok of tokenize(jd)) {
    if (tok.length < 2 || STOPWORDS.has(tok) || /^\d+$/.test(tok)) continue
    counts.set(tok, (counts.get(tok) ?? 0) + 1)
  }
  const ranked = [...counts.entries()]
    .filter(([, n]) => n >= 2 || counts.size < 40)
    .sort((a, b) => b[1] - a[1])
  for (const [word, n] of ranked) {
    if ([...found.keys()].some((p) => p.includes(word))) continue
    found.set(word, n)
  }
  return [...found.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k)
}

const REQUIREMENTS_HEADING_RE =
  /^.*\b(requirements|qualifications|must[- ]haves?|what you.ll need|what we.re looking for|who you are)\b.*$/im

/**
 * JD keywords worth prioritizing: known multi-word phrases, keywords repeated
 * ≥3 times, keywords in the requirements/qualifications block, and keywords in
 * the JD's first line (usually the job title).
 */
export function highPriorityKeywords(jd: string, keywords: string[]): Set<string> {
  const high = new Set<string>()
  if (!jd.trim() || keywords.length === 0) return high
  const lower = jd.toLowerCase()
  const jdTokens = tokenize(jd)
  const firstLine = (jd.trim().split(/\n/, 1)[0] ?? '').toLowerCase()
  const firstLineTokens = new Set(tokenize(firstLine))
  const headingMatch = REQUIREMENTS_HEADING_RE.exec(jd)
  const reqBlock = headingMatch
    ? lower.slice(headingMatch.index + headingMatch[0].length)
    : ''
  const reqTokens = new Set(tokenize(reqBlock))
  for (const kw of keywords) {
    const phrase = kw.includes(' ')
    if (phrase && lower.includes(kw)) {
      high.add(kw)
      continue
    }
    if (countOccurrences(lower, jdTokens, kw) >= 3) {
      high.add(kw)
      continue
    }
    if (phrase ? reqBlock.includes(kw) : reqTokens.has(kw)) {
      high.add(kw)
      continue
    }
    if (phrase ? firstLine.includes(kw) : firstLineTokens.has(kw)) high.add(kw)
  }
  return high
}

/** Percentage of a job description's keywords found in the resume text */
export function matchScore(resumeTextRaw: string, jd: string): number | null {
  const keywords = jd.trim() ? extractKeywords(jd) : []
  if (keywords.length === 0) return null
  const resumeText = resumeTextRaw.toLowerCase()
  const resumeTokens = new Set(tokenize(resumeText))
  let matched = 0
  for (const kw of keywords) {
    if (kw.includes(' ') ? resumeText.includes(kw) : resumeTokens.has(kw)) matched++
  }
  return Math.round((matched / keywords.length) * 100)
}

/** Score pasted resume text (standalone ATS checker page) */
export function scoreResumeText(resumeTextRaw: string, jd: string): AtsResult {
  const resumeText = resumeTextRaw.toLowerCase()
  const resumeTokenList = tokenize(resumeText)
  const resumeTokens = new Set(resumeTokenList)

  const keywords = jd.trim() ? extractKeywords(jd) : []
  const matched: string[] = []
  const missing: string[] = []
  for (const kw of keywords) {
    const hit = kw.includes(' ') ? resumeText.includes(kw) : resumeTokens.has(kw)
    if (hit) matched.push(kw)
    else missing.push(kw)
  }

  const checks: AtsResult['checks'] = [
    {
      label: 'Email address found',
      pass: /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(resumeText),
      hint: 'ATS parsers look for an email in the header.',
      anchor: 'contact',
    },
    {
      label: 'Phone number found',
      pass: /(\+?\d[\d\s().-]{7,})/.test(resumeText),
      hint: 'Include a phone number recruiters can call.',
      anchor: 'contact',
    },
    {
      label: 'Standard section headings',
      pass:
        /^\s*(work |professional |employment )?experience\s*:?\s*$/m.test(resumeText) &&
        /^\s*education\s*:?\s*$/m.test(resumeText),
      hint: 'Use standard headings like "Experience" and "Education" so parsers find them.',
      anchor: 'experience',
    },
    {
      label: 'Skills section present',
      pass: /^\s*(technical |core |key )?skills\s*:?\s*$/m.test(resumeText) || /skills:/.test(resumeText),
      hint: 'A dedicated skills list is the easiest keyword match for ATS.',
      anchor: 'skills',
    },
    {
      label: 'Quantified achievements',
      pass: /\d+(%|\+| percent|k\b|x\b)|\$\d/.test(resumeText),
      hint: 'Numbers (%, $, counts) make bullets stand out to recruiters.',
      anchor: 'experience',
    },
    {
      label: 'Employment dates found',
      pass: /\b(19|20)\d{2}\b/.test(resumeText),
      hint: 'ATS parsers build your work timeline from dates — include years for every role.',
      anchor: 'experience',
    },
    {
      label: 'Enough content to parse',
      pass: resumeTextRaw.trim().length >= 400,
      hint: 'Very short resumes give ATS systems too little to match on.',
      anchor: 'experience',
    },
    wordCountCheck(resumeTextRaw, 'experience'),
    reverseChronCheck(textDateRanges(resumeTextRaw)),
    bulletsPerEntryCheck(textBulletCounts(resumeTextRaw)),
    dateFormatCheck(textDateRanges(resumeTextRaw).flatMap((r) => [r.start, r.end])),
    namedMonthDatesCheck(textDateRanges(resumeTextRaw).flatMap((r) => [r.start, r.end])),
    pronounCheck(textPronounSegments(resumeTextRaw)),
    linkedinCheck(/linkedin\.com\//i.test(resumeTextRaw)),
    entryLocationsCheck(textEntryLocations(resumeTextRaw)),
  ]

  return finalize(keywords, matched, missing, [], checks, keywordDetailFor(keywords, resumeText, resumeTokenList, jd))
}

function finalize(
  keywords: string[],
  matched: string[],
  missing: string[],
  ignored: string[],
  checks: AtsResult['checks'],
  keywordDetail: KeywordDetail[]
): AtsResult {
  const structureRatio = checks.filter((c) => c.pass).length / checks.length
  const structureScore = Math.round(structureRatio * 100)
  const keywordScore =
    keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : null
  const score =
    keywordScore !== null
      ? Math.round((keywordScore * 70 + structureScore * 30) / 100)
      : structureScore
  return { score, matched, missing, ignored, keywordDetail, keywordScore, structureScore, checks }
}

/**
 * Pick the entry (e.g. experience) that best fits a JD keyword: keyword-token
 * occurrences weigh most, other JD keywords found in the entry add context fit,
 * ties keep resume order. Returns null when there are no entries.
 */
export function bestExperienceForKeyword(
  entries: readonly { id: string; text: string }[],
  keyword: string,
  jd: string
): string | null {
  if (entries.length === 0) return null
  const kw = keyword.toLowerCase()
  const kwTokens = tokenize(kw)
  const jdKeywords = jd.trim() ? extractKeywords(jd).filter((k) => k !== kw) : []
  let bestId = entries[0].id
  let bestScore = -1
  for (const entry of entries) {
    const text = entry.text.toLowerCase()
    const tokens = new Set(tokenize(text))
    let score = 0
    if (kw.includes(' ') && text.includes(kw)) score += 3
    for (const t of kwTokens) if (tokens.has(t)) score += 3
    for (const k of jdKeywords) {
      if (k.includes(' ') ? text.includes(k) : tokens.has(k)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      bestId = entry.id
    }
  }
  return bestId
}

import type { Resume } from './resume'
import { ONGOING_RE, dateSortValue, resumeToPlainText, skillLines } from './resume'

export function scoreResume(resume: Resume, jd: string): AtsResult {
  const resumeText = resumeToPlainText(resume).toLowerCase()
  const resumeTokenList = tokenize(resumeText)
  const resumeTokens = new Set(resumeTokenList)

  const ignoredSet = new Set((resume.ignoredKeywords ?? []).map((k) => k.toLowerCase()))
  const allKeywords = jd.trim() ? extractKeywords(jd) : []
  const ignored = allKeywords.filter((kw) => ignoredSet.has(kw))
  const keywords = allKeywords.filter((kw) => !ignoredSet.has(kw))
  const matched: string[] = []
  const missing: string[] = []
  for (const kw of keywords) {
    const hit = kw.includes(' ')
      ? resumeText.includes(kw)
      : resumeTokens.has(kw)
    if (hit) matched.push(kw)
    else missing.push(kw)
  }

  const bulletCount = resume.experience.reduce(
    (n, e) => n + e.bullets.filter((b) => b.trim()).length,
    0
  )
  const quantified = resume.experience.some((e) =>
    e.bullets.some((b) => /\d/.test(b))
  )
  const checks: AtsResult['checks'] = [
    {
      label: 'Contact info complete',
      pass: Boolean(resume.contact.fullName && resume.contact.email && resume.contact.phone),
      hint: 'Name, email and phone are the minimum ATS parsers look for.',
      anchor: 'contact',
    },
    {
      label: 'Professional summary present',
      pass: resume.summary.trim().length >= 40,
      hint: 'A 2-3 sentence summary gives ATS keyword context at the top.',
      anchor: 'summary',
    },
    {
      label: 'Work experience with bullets',
      pass: bulletCount >= 3,
      hint: 'Use 3-6 bullet points per role describing impact.',
      anchor: 'experience',
    },
    {
      label: 'Quantified achievements',
      pass: quantified,
      hint: 'Numbers (%, $, counts) make bullets stand out to recruiters.',
      anchor: 'experience',
    },
    {
      label: 'Employment dates listed',
      pass: resume.experience
        .filter((e) => e.role.trim() || e.company.trim())
        .every((e) => e.startDate.trim()),
      hint: 'ATS parsers build your work timeline from dates — add a start date to every role.',
      anchor: 'experience',
    },
    {
      label: 'Skills section filled',
      pass: resume.skills.trim().length >= 10,
      hint: 'A dedicated skills list is the easiest keyword match for ATS.',
      anchor: 'skills',
    },
    {
      label: 'Skills grouped into categories',
      pass:
        resume.skills.split(/[,\n]/).filter((s) => s.trim()).length < 8 ||
        skillLines(resume).some((l) => l.label),
      hint: 'Condense long skill lists into categories (e.g. "Languages: …", "Cloud: …") so recruiters can scan them.',
      anchor: 'skills',
    },
    {
      label: 'Education listed',
      pass: resume.education.some((e) => e.school.trim()),
      hint: 'Most ATS templates expect an education section.',
      anchor: 'education',
    },
    wordCountCheck(resumeText, 'experience'),
    reverseChronCheck(
      resume.experience
        .filter((e) => !e.hidden)
        .map((e) => ({
          name: [e.role.trim(), e.company.trim()].filter(Boolean).join(' at ') || 'Untitled role',
          start: e.startDate,
          end: e.endDate,
        }))
    ),
    bulletsPerEntryCheck(
      resume.experience
        .filter((e) => !e.hidden && (e.role.trim() || e.company.trim()))
        .map((e) => ({
          name: [e.role.trim(), e.company.trim()].filter(Boolean).join(' at '),
          count: e.bullets.filter((b) => b.trim()).length,
        }))
    ),
    dateFormatCheck(
      [...resume.experience, ...resume.education]
        .filter((e) => !e.hidden)
        .flatMap((e) => [e.startDate, e.endDate])
    ),
    namedMonthDatesCheck(
      [...resume.experience, ...resume.education]
        .filter((e) => !e.hidden)
        .flatMap((e) => [e.startDate, e.endDate])
    ),
    pronounCheck([
      { text: resume.summary, anchor: 'summary' },
      {
        text: [
          ...resume.experience.filter((e) => !e.hidden).flatMap((e) => e.bullets),
          ...resume.projects.filter((p) => !p.hidden).map((p) => p.description),
          ...(resume.involvement ?? []).filter((i) => !i.hidden).map((i) => i.description),
          ...resume.customSections.flatMap((s) => s.bullets),
        ].join('\n'),
        anchor: 'experience',
      },
    ]),
    linkedinCheck(
      Boolean(resume.contact.linkedin.trim()) &&
        !(resume.hiddenContact ?? []).includes('linkedin')
    ),
    entryLocationsCheck([
      ...resume.experience
        .filter((e) => !e.hidden && (e.role.trim() || e.company.trim()))
        .map((e) => ({
          name: [e.role.trim(), e.company.trim()].filter(Boolean).join(' at '),
          located: Boolean(e.location.trim()),
          anchor: 'experience' as const,
        })),
      ...(resume.involvement ?? [])
        .filter((i) => !i.hidden && (i.role.trim() || i.organization.trim()))
        .map((i) => ({
          name: [i.role.trim(), i.organization.trim()].filter(Boolean).join(' at '),
          located: Boolean(i.location.trim()),
          anchor: 'experience' as const,
        })),
      ...resume.education
        .filter((e) => !e.hidden && e.school.trim())
        .map((e) => ({
          name: e.school.trim(),
          located: Boolean(e.location.trim()),
          anchor: 'education' as const,
        })),
    ]),
  ]

  return finalize(keywords, matched, missing, ignored, checks, keywordDetailFor(keywords, resumeText, resumeTokenList, jd))
}

/**
 * Deterministic plain-text report of an ATS result, sent to the resume
 * assistant so score answers cite the same numbers and checks the editor
 * shows instead of guessing.
 */
export function atsScoreSummary(ats: AtsResult): string {
  const lines: string[] = [`Total ATS score: ${ats.score}/100`]
  lines.push(
    ats.keywordScore !== null
      ? `Sub-scores: keyword match ${ats.keywordScore}/100 (70% weight), structure ${ats.structureScore}/100 (30% weight)`
      : `Structure score: ${ats.structureScore}/100 (no target job description provided, so no keyword score)`
  )
  const failing = ats.checks.filter((c) => !c.pass)
  lines.push(
    failing.length > 0
      ? `Failing checks:\n${failing.map((c) => `- ${c.label}: ${c.hint}`).join('\n')}`
      : 'All structure checks pass.'
  )
  if (ats.keywordScore !== null) {
    lines.push(
      `Job keywords matched (${ats.matched.length}): ${ats.matched.slice(0, 20).join(', ') || 'none'}`
    )
    lines.push(
      `Job keywords missing (${ats.missing.length}): ${ats.missing.slice(0, 20).join(', ') || 'none'}`
    )
    if (ats.ignored.length > 0) {
      lines.push(`Keywords the user marked not relevant (excluded): ${ats.ignored.join(', ')}`)
    }
  }
  return lines.join('\n').slice(0, 2000)
}
