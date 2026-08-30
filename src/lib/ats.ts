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
opportunity employer diverse remote hybrid onsite full-time part-time`.split(/\s+/)
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
  /** Keyword coverage 0-100, or null when no JD was provided */
  keywordScore: number | null
  /** Structure/best-practices sub-score 0-100 */
  structureScore: number
  /** Structural checks independent of the JD */
  checks: { label: string; pass: boolean; hint: string }[]
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
    },
    {
      label: 'Phone number found',
      pass: /(\+?\d[\d\s().-]{7,})/.test(resumeText),
      hint: 'Include a phone number recruiters can call.',
    },
    {
      label: 'Standard section headings',
      pass:
        /^\s*(work |professional |employment )?experience\s*:?\s*$/m.test(resumeText) &&
        /^\s*education\s*:?\s*$/m.test(resumeText),
      hint: 'Use standard headings like "Experience" and "Education" so parsers find them.',
    },
    {
      label: 'Skills section present',
      pass: /^\s*(technical |core |key )?skills\s*:?\s*$/m.test(resumeText) || /skills:/.test(resumeText),
      hint: 'A dedicated skills list is the easiest keyword match for ATS.',
    },
    {
      label: 'Quantified achievements',
      pass: /\d+(%|\+| percent|k\b|x\b)|\$\d/.test(resumeText),
      hint: 'Numbers (%, $, counts) make bullets stand out to recruiters.',
    },
    {
      label: 'Employment dates found',
      pass: /\b(19|20)\d{2}\b/.test(resumeText),
      hint: 'ATS parsers build your work timeline from dates — include years for every role.',
    },
    {
      label: 'Enough content to parse',
      pass: resumeTextRaw.trim().length >= 400,
      hint: 'Very short resumes give ATS systems too little to match on.',
    },
  ]

  return finalize(keywords, matched, missing, checks, keywordDetailFor(keywords, resumeText, resumeTokenList, jd))
}

function finalize(
  keywords: string[],
  matched: string[],
  missing: string[],
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
  return { score, matched, missing, keywordDetail, keywordScore, structureScore, checks }
}

import type { Resume } from './resume'
import { resumeToPlainText } from './resume'

export function scoreResume(resume: Resume, jd: string): AtsResult {
  const resumeText = resumeToPlainText(resume).toLowerCase()
  const resumeTokenList = tokenize(resumeText)
  const resumeTokens = new Set(resumeTokenList)

  const keywords = jd.trim() ? extractKeywords(jd) : []
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
    },
    {
      label: 'Professional summary present',
      pass: resume.summary.trim().length >= 40,
      hint: 'A 2-3 sentence summary gives ATS keyword context at the top.',
    },
    {
      label: 'Work experience with bullets',
      pass: bulletCount >= 3,
      hint: 'Use 2-4 bullet points per role describing impact.',
    },
    {
      label: 'Quantified achievements',
      pass: quantified,
      hint: 'Numbers (%, $, counts) make bullets stand out to recruiters.',
    },
    {
      label: 'Employment dates listed',
      pass: resume.experience
        .filter((e) => e.role.trim() || e.company.trim())
        .every((e) => e.startDate.trim()),
      hint: 'ATS parsers build your work timeline from dates — add a start date to every role.',
    },
    {
      label: 'Skills section filled',
      pass: resume.skills.trim().length >= 10,
      hint: 'A dedicated skills list is the easiest keyword match for ATS.',
    },
    {
      label: 'Education listed',
      pass: resume.education.some((e) => e.school.trim()),
      hint: 'Most ATS templates expect an education section.',
    },
  ]

  return finalize(keywords, matched, missing, checks, keywordDetailFor(keywords, resumeText, resumeTokenList, jd))
}
