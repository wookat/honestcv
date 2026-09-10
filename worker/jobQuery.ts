/**
 * Job-search query parsing shared by the Worker (`/api/jobs/search`) and the
 * client (`src/lib/jobs.ts`), so the fold-by-title-relevance on the client uses
 * exactly the terms the API matched on.
 *
 * The query is usually the resume's target role, which people write the way a
 * job ad does — "Senior Frontend Engineer (React)", "Sr. Data Analyst",
 * "UX/UI Designer", "Registered Nurse - ICU". Matched literally, every one of
 * those tokens had to appear somewhere in the posting: "(react)" with its
 * brackets never does, "sr." matches almost nothing, and "ux/ui" only postings
 * that spell it with the slash. The role words are what has to match; the
 * seniority words and bracketed qualifiers only decide the order.
 */

export interface JobQuery {
  /** Every group must match; a group matches when any of its alternatives does. */
  required: string[][]
  /** Title hits on these words rank a posting higher inside its relevance tier. */
  ranking: string[]
  /** Connector / work-arrangement words that neither gate nor rank. */
  dropped: string[]
  /** `required` as a plain string for upstream feed search parameters. */
  upstream: string
}

/** Grade words: never required (a "Senior Frontend Engineer" wants frontend jobs), but rank title hits higher. */
const SENIORITY = new Set([
  'senior',
  'sr',
  'snr',
  'junior',
  'jr',
  'jnr',
  'lead',
  'staff',
  'principal',
  'associate',
  'mid',
  'midlevel',
  'entry',
  'graduate',
  'trainee',
  'head',
  'chief',
  'director',
  'vp',
  'i',
  'ii',
  'iii',
  'iv',
  'v',
  '1',
  '2',
  '3',
])

/** Connectors and work-arrangement words that do not describe the role. */
const DROPPED = new Set([
  'of',
  'and',
  '&',
  'the',
  'a',
  'an',
  'for',
  'in',
  'at',
  'to',
  'with',
  'or',
  'remote',
  'hybrid',
  'onsite',
  'on-site',
  'fulltime',
  'full-time',
  'parttime',
  'part-time',
  'contract',
  'contractor',
  'freelance',
  'permanent',
  'temporary',
  'role',
  'position',
  'job',
  'jobs',
  'level',
])

/** Strips surrounding punctuation ("sr." → "sr") but keeps skill spellings (".net", "node.js", "c++", "c#"). */
const trimToken = (t: string): string => {
  const s = t.replace(/^[,;:'"`]+|[,;:'"`]+$/g, '').replace(/\.+$/, '')
  return s === '.net' ? s : s.replace(/^\.+/, '')
}

/** Compounds ads spell three ways: "frontend" / "front-end" / "front end". */
const COMPOUND_RE = /^(front|back|full)(end|stack)$/

const alternativesOf = (token: string): string[] => {
  if (token.includes('/')) {
    return [...new Set(token.split('/').map(trimToken).filter(Boolean))]
  }
  if (token.includes('-')) {
    return [...new Set([token, token.replace(/-/g, ' '), token.replace(/-/g, '')])]
  }
  const compound = COMPOUND_RE.exec(token)
  if (compound) return [token, `${compound[1]}-${compound[2]}`, `${compound[1]} ${compound[2]}`]
  return [token]
}

export function parseJobQuery(raw: string): JobQuery {
  const lower = raw.normalize('NFKC').toLowerCase()
  // Bracketed qualifiers — "(React)", "[Contract]" — rank, but never gate.
  const bracketed: string[] = []
  const unbracketed = lower.replace(/[([{]([^)\]}]*)[)\]}]/g, (_, inner: string) => {
    bracketed.push(inner)
    return ' '
  })
  const split = (s: string): string[] =>
    s
      .replace(/[,;:|"“”‘’`]+/g, ' ')
      .replace(/\s[-–—]\s|[–—]/g, ' ')
      .split(/\s+/)
      .map(trimToken)
      .filter(Boolean)

  const required: string[][] = []
  const ranking: string[] = []
  const dropped: string[] = []
  for (const token of split(unbracketed)) {
    if (DROPPED.has(token)) {
      dropped.push(token)
      continue
    }
    if (SENIORITY.has(token)) {
      ranking.push(token)
      continue
    }
    const alts = alternativesOf(token).filter((a) => !DROPPED.has(a))
    if (alts.length > 0) required.push(alts)
  }
  for (const inner of bracketed) {
    for (const token of split(inner)) {
      if (DROPPED.has(token)) dropped.push(token)
      else ranking.push(token)
    }
  }
  if (required.length === 0) {
    // "Senior" / "Lead" alone: the grade word is the query.
    for (const token of ranking) required.push([token])
    ranking.length = 0
  }
  const dedupe = (xs: string[]) => [...new Set(xs)]
  const uniqRequired = required.filter((g, i) => required.findIndex((h) => h[0] === g[0]) === i)
  return {
    required: uniqRequired,
    ranking: dedupe(ranking).filter((r) => !uniqRequired.some((g) => g.includes(r))),
    dropped: dedupe(dropped),
    upstream: uniqRequired.map((g) => g[0]).join(' '),
  }
}

/** True when every required group has an alternative inside `haystack` (lower-cased). */
export function matchesJobQuery(query: JobQuery, haystack: string): boolean {
  return query.required.every((group) => group.some((alt) => haystack.includes(alt)))
}

/**
 * Title relevance tier: 2 = every required group is in the title, 1 = some are,
 * 0 = the query only appears in the body / tags / company / location.
 */
export function jobTitleRank(query: JobQuery, title: string): 0 | 1 | 2 {
  if (query.required.length === 0) return 2
  const t = title.toLowerCase()
  const hits = query.required.filter((group) => group.some((alt) => t.includes(alt))).length
  return hits === query.required.length ? 2 : hits > 0 ? 1 : 0
}

/** Abbreviations ads use interchangeably with the grade word. */
const GRADE_FORMS: Record<string, string[]> = {
  senior: ['senior', 'sr'],
  sr: ['senior', 'sr'],
  snr: ['senior', 'snr', 'sr'],
  junior: ['junior', 'jr'],
  jr: ['junior', 'jr'],
  jnr: ['junior', 'jnr', 'jr'],
  vp: ['vp', 'vice president'],
}

/** How many ranking-only words (seniority, bracketed qualifiers) the title carries. */
export function jobRankingHits(query: JobQuery, title: string): number {
  const t = ` ${title.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ')} `
  return query.ranking.filter((r) =>
    (GRADE_FORMS[r] ?? [r]).some((form) => t.includes(form.length <= 3 ? ` ${form} ` : form))
  ).length
}
