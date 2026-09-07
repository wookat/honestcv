/**
 * Client-side ATS match scoring: extract keywords from a job description and
 * measure how many appear in the resume. Free forever — runs entirely in the
 * browser; the JD and resume never leave the device for scoring.
 */
import { stemmer } from 'stemmer'

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
day days week weeks month months daily weekly monthly
used uses worked works helps helping helped offered require requires
requirement skill year jobs roles positions companies experiences seeks
sought know knows knowing understand understands understood familiar
prefer prefers preferably communicate communicates demonstrate demonstrates
demonstrated demonstrable sense
build builds building built create creates creating created
deliver delivers delivering delivered ensure ensures ensuring ensured
improve improves improving improved provide provides providing provided
maintain maintains maintaining maintained develop develops developing developed
manage manages managing managed
turn turns turning run runs running write writes writing present presents
presenting bring brings bringing ship ships shipping reduce reduces reducing
against comfort comfortable hands-on welcome fundamentals own owns owning owned
expect expects expected fluency fluent solid grasp expertise
ideally highly strongly closely actively effectively successfully independently
proactively especially particularly primarily typically regularly currently
previously additionally directly record track
like one come get sure real together please notice believe think keep without
rather something way ways everyone actually even less see hear stay feel life
hours time part every world around possible future outside meet e.g i.e u.s
sponsorship visa`.split(/\s+/)
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
  'risk management', 'change management', 'human resources', 'product sense',
]

/**
 * Hard skills, tools and methods that matter even when a job ad names them
 * only once ("GraphQL and Next.js experience is a plus"). Lower-case tokens
 * as produced by `tokenize`.
 */
const KNOWN_SKILLS = new Set(
  `javascript typescript python java kotlin objective-c golang rust ruby php c++
c# scala elixir erlang haskell clojure dart lua perl matlab sql nosql plsql
t-sql graphql html html5 css css3 sass scss tailwind react react.js reactjs
next.js nextjs vue vue.js nuxt angular svelte sveltekit gatsby astro backbone
jquery redux mobx zustand rxjs node node.js nodejs deno nestjs fastify koa
django flask fastapi rails laravel symfony hibernate .net asp.net dotnet
blazor android ios flutter react-native xamarin ionic electron webpack vite
rollup esbuild babel eslint prettier storybook jest vitest mocha cypress
playwright selenium puppeteer testing-library junit pytest rspec xunit nunit
postman aws azure gcp ec2 s3 rds dynamodb cloudfront route53 iam eks ecs
kubernetes k8s docker helm terraform pulumi ansible vagrant linux unix bash
powershell nginx apache jenkins circleci gitlab github bitbucket git svn ci/cd
devops sre observability prometheus grafana datadog splunk sentry newrelic elk
kibana logstash opentelemetry kafka rabbitmq sqs redis memcached elasticsearch
solr postgresql postgres mysql mariadb sqlite mongodb cassandra couchdb neo4j
oracle mssql snowflake bigquery redshift databricks spark hadoop airflow dbt
pandas numpy scipy scikit-learn sklearn tensorflow pytorch keras mlops llm
llms openai langchain huggingface nlp opencv tableau powerbi looker vba sas
spss stata restful soap grpc websockets oauth oauth2 jwt saml sso openid
microservices serverless monorepo agile scrum kanban jira confluence trello
asana figma adobe photoshop illustrator indesign xd invision zeplin wcag
accessibility a11y i18n l10n localization seo salesforce hubspot marketo
zendesk servicenow sap netsuite workday analytics ga4 mixpanel optimizely
shopify magento woocommerce stripe paypal autocad solidworks revit sketchup
labview cpa cfa pmp csm cissp ccna aws-certified hipaa gdpr soc2 pci iso27001
profiling caching cdn graphql-federation lightroom after-effects blender`.split(/\s+/)
)

/** Tokens shaped like a technology name: "next.js", "c++", "c#", "html5", "asp.net". */
const TECH_SHAPE_RE = /\.(js|ts|net|py|rb)$|^[a-z]+[+#]+$|^[a-z]{2,}\d{1,2}$/

function looksLikeSkill(tok: string): boolean {
  return KNOWN_SKILLS.has(tok) || TECH_SHAPE_RE.test(tok)
}

/** Builder editor section that fixes a failing structural check */
export type SectionAnchor =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'skills'
  | 'education'
  | 'involvement'
  | 'projects'
  | 'custom'

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
  /** Matched keywords the resume words differently from the posting (PostgreSQL → "postgres") */
  variants: KeywordVariant[]
  /** Structural checks independent of the JD */
  checks: {
    label: string
    pass: boolean
    hint: string
    anchor?: SectionAnchor
    category: CheckCategory
    /** Builder entry the failing check points at, when it comes from one entry */
    entryId?: string
    /** Not applicable — the check had no content to inspect; dropped from scoring */
    na?: boolean
  }[]
}

/** Rezi-style scoring categories the structure checks are grouped under */
export type CheckCategory = 'content' | 'format' | 'bestPractices'

/** Category display order and labels for the score breakdown UIs */
export const CHECK_CATEGORIES: { key: CheckCategory; label: string }[] = [
  { key: 'content', label: 'Content' },
  { key: 'format', label: 'Format' },
  { key: 'bestPractices', label: 'Best practices' },
]

const COMPOUND_SEP_RE = /[/-]/

const tokenMatches = (t: string, kw: string): boolean =>
  t === kw || (COMPOUND_SEP_RE.test(t) && t.split(COMPOUND_SEP_RE).includes(kw))

/** Tokens plus the hyphen/slash-separated parts of compound tokens, so
    "terraform-managed" or "ci/cd" also match their component keywords. */
export function matchTokenSet(tokens: Iterable<string>): Set<string> {
  const set = new Set<string>()
  for (const t of tokens) {
    set.add(t)
    if (COMPOUND_SEP_RE.test(t)) for (const part of t.split(COMPOUND_SEP_RE)) if (part) set.add(part)
  }
  return set
}

/** UK spellings folded to US before stemming so "analysing" and "analyzed" share a stem. */
const UK_US_SUFFIXES: [RegExp, string][] = [
  [/isation$/, 'ization'],
  [/ising$/, 'izing'],
  [/ised$/, 'ized'],
  [/ise$/, 'ize'],
  [/ysation$/, 'yzation'],
  [/ysing$/, 'yzing'],
  [/ysed$/, 'yzed'],
  [/yse$/, 'yze'],
  [/(.{3,})our$/, '$1or'],
  [/(.{3,})mme(s?)$/, '$1m$2'],
]

/** Porter stem of a plain word; tokens with digits or symbols (c++, k8s, ci/cd) stay as written. */
function stemToken(t: string): string {
  if (t.length < 4 || !/^[a-z]+$/.test(t)) return t
  let w = t
  for (const [re, rep] of UK_US_SUFFIXES) {
    if (re.test(w)) {
      w = w.replace(re, rep)
      break
    }
  }
  return stemmer(w)
}

/**
 * Spellings recruiters and candidates use interchangeably. Only forms that
 * are unambiguous on a resume are listed — bare "go", "express" or "excel"
 * are ordinary words and would produce false matches.
 */
const ALIAS_GROUPS: string[][] = [
  ['javascript', 'js'],
  ['typescript', 'ts'],
  ['node.js', 'nodejs', 'node'],
  ['react.js', 'reactjs', 'react'],
  ['vue.js', 'vuejs', 'vue'],
  ['next.js', 'nextjs'],
  ['nuxt.js', 'nuxt'],
  ['angular.js', 'angularjs', 'angular'],
  ['express.js', 'expressjs'],
  ['postgresql', 'postgres'],
  ['mongodb', 'mongo'],
  ['kubernetes', 'k8s'],
  ['gcp', 'google cloud', 'google cloud platform'],
  ['aws', 'amazon web services'],
  ['azure', 'microsoft azure'],
  ['ci/cd', 'ci cd', 'continuous integration', 'continuous delivery', 'continuous deployment'],
  ['machine learning', 'ml'],
  ['artificial intelligence', 'ai'],
  ['natural language processing', 'nlp'],
  ['large language models', 'large language model', 'llms', 'llm'],
  ['a/b testing', 'a/b tests', 'a/b test', 'ab testing', 'split testing'],
  ['user experience', 'ux'],
  ['user interface', 'ui'],
  ['quality assurance', 'qa'],
  ['rest api', 'rest apis', 'restful api', 'restful apis', 'restful'],
  ['sql server', 'mssql', 'microsoft sql server'],
  ['c#', 'csharp'],
  ['c++', 'cpp'],
  ['.net', 'dotnet'],
  ['object-oriented', 'object oriented', 'oop'],
  ['test-driven development', 'test driven development', 'tdd'],
  ['infrastructure as code', 'iac'],
  ['search engine optimization', 'search engine optimisation', 'seo'],
  ['customer relationship management', 'crm'],
  ['key performance indicators', 'kpis', 'kpi'],
  ['software as a service', 'saas'],
  ['business to business', 'b2b'],
  ['registered nurse', 'rn'],
  ['intensive care', 'icu', 'critical care'],
  ['basic life support', 'bls'],
  ['advanced cardiac life support', 'acls'],
  ['power bi', 'powerbi'],
]
const ALIASES = new Map<string, string[]>()
for (const group of ALIAS_GROUPS) for (const form of group) ALIASES.set(form, group)

/** Resume text prepared once for keyword lookups: surface tokens, their stems, and the compound-part set. */
export interface ResumeIndex {
  text: string
  tokens: string[]
  tokenSet: Set<string>
  stems: string[]
}

export function indexResumeText(resumeTextRaw: string): ResumeIndex {
  const text = resumeTextRaw.toLowerCase()
  const tokens = tokenize(text)
  const stems = tokens.map(stemToken)
  return { text, tokens, tokenSet: matchTokenSet(tokens), stems }
}

/** Resume wording that matched `needle` exactly ('' when written as-is), or null. */
function findForm(needle: string, idx: ResumeIndex): string | null {
  if (needle.includes(' ')) {
    if (idx.text.includes(needle)) return ''
    const parts = tokenize(needle).map(stemToken)
    outer: for (let i = 0; i + parts.length <= idx.stems.length; i++) {
      for (let j = 0; j < parts.length; j++) if (idx.stems[i + j] !== parts[j]) continue outer
      return idx.tokens.slice(i, i + parts.length).join(' ')
    }
    return null
  }
  if (idx.tokenSet.has(needle)) return ''
  const at = idx.stems.indexOf(stemToken(needle))
  return at >= 0 ? idx.tokens[at] : null
}

/**
 * Whether the resume contains `kw` — as written, as an inflection/spelling
 * variant (dashboards / dashboard, analysing / analyzed) or as a known alias
 * (Postgres for PostgreSQL). `found` is the resume's wording when it differs.
 */
export function keywordHit(
  kw: string,
  idx: ResumeIndex
): { hit: boolean; found: string } {
  const own = findForm(kw, idx)
  if (own !== null) return { hit: true, found: own }
  for (const alias of ALIASES.get(kw) ?? []) {
    if (alias === kw) continue
    const f = findForm(alias, idx)
    if (f !== null) return { hit: true, found: f || alias }
  }
  return { hit: false, found: '' }
}

/** JD keywords the resume states in different wording, e.g. PostgreSQL → "postgres". */
export interface KeywordVariant {
  keyword: string
  found: string
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
  return tokens.filter((t) => tokenMatches(t, kw)).length
}

function keywordDetailFor(
  keywords: string[],
  idx: ResumeIndex,
  jd: string,
  variants: KeywordVariant[]
): KeywordDetail[] {
  const jdLower = jd.toLowerCase()
  const jdTokens = tokenize(jd)
  const wording = new Map(variants.map((v) => [v.keyword, v.found]))
  return keywords
    .map((kw) => {
      const found = wording.get(kw)
      const n = countOccurrences(idx.text, idx.tokens, found ?? kw)
      return {
        keyword: kw,
        inResume: found ? Math.max(1, n) : n,
        inJobAd: countOccurrences(jdLower, jdTokens, kw),
      }
    })
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
    na: keyed.length === 0 || undefined,
    hint: offender
      ? `"${offender}" appears below a less recent role — list your most recent position first (the Sort-by-date toggle fixes this in one click).`
      : REVERSE_CHRON_PASS_HINT,
    anchor: 'experience',
    category: 'format',
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
    na: dates.every((d) => !d.trim()) || undefined,
    hint: pass
      ? 'Dates use one format — ATS parsers read your timeline consistently.'
      : `Dates mix formats ("${monthYear}" vs "${numeric}") — pick one style so ATS parsers read your timeline consistently.`,
    anchor: 'experience',
    category: 'format',
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
    na: dates.every((d) => !d.trim()) || undefined,
    hint: offender
      ? `"${offender}" is numeric — write dates with a month name ("${namedMonthSuggestion(offender)}") so employers grasp your timeline at a glance.`
      : 'Dates use written month names — employers grasp your timeline at a glance.',
    anchor: 'experience',
    category: 'bestPractices',
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
    na: segments.every((s) => !s.text.trim()) || undefined,
    hint: found
      ? `Found "${found}" — drop first-person pronouns ("I", "me", "my") and lead with the action itself: "Led a team of 8", not "I led my team".`
      : 'Written in the implied first person — no "I", "me" or "my" for recruiters to trip over.',
    anchor,
    category: 'content',
  }
}

/** Irregular participles; the first group also matches prefixed forms (rebuilt, rewritten). */
const IRREGULAR_PARTICIPLES =
  '[a-z]*(?:built|made|given|done|taken|chosen|driven|written|held|kept|brought|taught|seen|shown|known|grown|sent|found|paid|sold|told)|led|won|run|set|put'

const PASSIVE_RE = new RegExp(
  `\\b(was|were|is|are|been|being)\\s+(?:\\w+ly\\s+)?([a-z]{2,}ed|${IRREGULAR_PARTICIPLES})\\b`,
  'i'
)

/** Returns the matched passive phrase (e.g. "was built"), or null. */
export function findPassive(text: string): string | null {
  const m = PASSIVE_RE.exec(text)
  return m ? m[0].replace(/\s+/g, ' ') : null
}

/** A bullet line with the editor section (and entry, when structured) it came from */
interface BulletSource {
  text: string
  anchor: SectionAnchor
  id?: string
}

/** Active voice in bullet points: passive voice hides who did the work */
function activeVoiceCheck(lines: BulletSource[]): AtsResult['checks'][number] {
  let phrase = ''
  let line = ''
  let offender: BulletSource | undefined
  for (const l of lines) {
    const p = findPassive(l.text)
    if (p) {
      phrase = p
      line = l.text.trim()
      offender = l
      break
    }
  }
  return {
    entryId: offender?.id,
    label: 'Active voice in bullet points',
    pass: !phrase,
    na: lines.every((l) => !l.text.trim()) || undefined,
    hint: phrase
      ? `"${phrase}" is passive voice ("${line.length > 60 ? `${line.slice(0, 60)}…` : line}") — lead with an active verb so employers see your specific contribution.`
      : 'Bullets use active voice — employers see your specific contributions.',
    anchor: offender?.anchor ?? 'experience',
    category: 'content',
  }
}

/** Weak bullet openers — shared by the per-bullet guidance and the scored check. */
export const WEAK_OPENERS = [
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

/** Strong bullet openers: weak openers hide the action and the impact */
function weakOpenerCheck(lines: BulletSource[]): AtsResult['checks'][number] {
  let opener = ''
  let line = ''
  let offender: BulletSource | undefined
  for (const l of lines) {
    const t = l.text.trim()
    const lower = t.toLowerCase()
    const hit = WEAK_OPENERS.find((w) => lower.startsWith(w))
    if (hit) {
      opener = hit
      line = t
      offender = l
      break
    }
  }
  return {
    entryId: offender?.id,
    label: 'Strong bullet openers',
    pass: !opener,
    na: lines.every((l) => !l.text.trim()) || undefined,
    hint: opener
      ? `"${line.length > 60 ? `${line.slice(0, 60)}…` : line}" opens with "${opener}" — lead with a strong action verb (Led, Built, Cut…) so employers see your impact first.`
      : 'Bullets open with strong action verbs — employers see your impact first.',
    anchor: offender?.anchor ?? 'experience',
    category: 'content',
  }
}

/**
 * Clearly-empty buzzword claims for the scored check. Ambiguous single
 * adjectives (dynamic, proactive, passionate, motivated) are excluded here —
 * "dynamic programming" is legitimate content — and stay in the per-bullet
 * guidance list only.
 */
const SCORED_BUZZWORDS = [
  'synergy',
  'go-getter',
  'think outside the box',
  'team player',
  'hard worker',
  'detail-oriented',
  'results-driven',
  'self-starter',
]

/** No empty buzzwords: generic claims crowd out concrete, checkable facts */
function buzzwordCheck(
  segments: { text: string; anchor: SectionAnchor }[]
): AtsResult['checks'][number] {
  let found = ''
  let anchor: SectionAnchor = 'summary'
  for (const seg of segments) {
    const hit = SCORED_BUZZWORDS.find((w) => new RegExp(`\\b${w}\\b`, 'i').test(seg.text))
    if (hit) {
      found = hit
      anchor = seg.anchor
      break
    }
  }
  return {
    label: 'No empty buzzwords',
    pass: !found,
    na: segments.every((s) => !s.text.trim()) || undefined,
    hint: found
      ? `"${found}" is an empty claim — replace it with a concrete, checkable fact (what you did, for whom, with what result).`
      : 'No generic buzzwords — your claims stay concrete and checkable.',
    anchor,
    category: 'content',
  }
}

/**
 * Filler words for the scored check: Rezi's named examples (just, very,
 * really) plus the per-bullet guidance list. "stuff" and "things" match
 * lowercase only so proper nouns ("Internet of Things") don't trigger.
 */
const SCORED_FILLERS: { word: string; re: RegExp }[] = [
  { word: 'just', re: /\bjust\b/i },
  { word: 'very', re: /\bvery\b/i },
  { word: 'really', re: /\breally\b/i },
  { word: 'various', re: /\bvarious\b/i },
  { word: 'several', re: /\bseveral\b/i },
  { word: 'stuff', re: /\bstuff\b/ },
  { word: 'things', re: /\bthings\b/ },
  { word: 'etc', re: /\betc\b/i },
]

/** No filler words: they dilute impact and read less confident */
function fillerWordCheck(
  segments: { text: string; anchor: SectionAnchor }[]
): AtsResult['checks'][number] {
  let found = ''
  let anchor: SectionAnchor = 'summary'
  for (const seg of segments) {
    const hit = SCORED_FILLERS.find((f) => f.re.test(seg.text))
    if (hit) {
      found = hit.word
      anchor = seg.anchor
      break
    }
  }
  return {
    label: 'No filler words',
    pass: !found,
    na: segments.every((s) => !s.text.trim()) || undefined,
    hint: found
      ? `"${found}" is a filler word — cut it and state the concrete fact directly ("Cut load time 40%", not "really improved various things").`
      : 'No filler words — every word carries weight and reads confident.',
    anchor,
    category: 'content',
  }
}

/** Quantified bullet points: at least a third of bullets should carry a real number */
function quantifiedBulletsCheck(lines: BulletSource[]): AtsResult['checks'][number] {
  const total = lines.length
  const quantified = lines.filter((l) => /\d/.test(l.text)).length
  const needed = Math.max(1, Math.ceil(total / 3))
  const pass = total === 0 || quantified >= needed
  return {
    label: 'Quantified bullet points',
    pass,
    na: lines.every((l) => !l.text.trim()) || undefined,
    hint: pass
      ? 'Enough bullets carry real numbers — your achievements are concrete and comparable.'
      : `Only ${quantified} of ${total} bullets ${quantified === 1 ? 'carries' : 'carry'} a number — quantify at least a third (scope, scale, %, time or money) so achievements are concrete.`,
    anchor: 'experience',
    category: 'content',
  }
}

/** Punctuated bullet points: capitalized start and terminal punctuation */
function punctuatedBulletsCheck(lines: BulletSource[]): AtsResult['checks'][number] {
  const offender = lines
    .map((l) => ({ ...l, text: stripInlineMarks(l.text).trim() }))
    .find((l) => l.text.length > 0 && (!/^[A-Z0-9]/.test(l.text) || !/[.!?]$/.test(l.text)))
  return {
    entryId: offender?.id,
    label: 'Punctuated bullet points',
    pass: !offender,
    na: lines.every((l) => !l.text.trim()) || undefined,
    hint: offender
      ? `"${offender.text.length > 60 ? `${offender.text.slice(0, 60)}…` : offender.text}" — start each bullet with a capital letter and end it with a period so your resume reads professionally.`
      : 'Bullets are properly punctuated — capitalized starts and terminal periods read professionally.',
    anchor: offender?.anchor ?? 'experience',
    category: 'content',
  }
}

/** Bullet length: enough detail to communicate, short enough to scan */
function bulletLengthCheck(lines: BulletSource[]): AtsResult['checks'][number] {
  const trimmed = lines
    .map((l) => ({ ...l, text: stripInlineMarks(l.text).trim() }))
    .filter((l) => l.text.length > 0)
  const offender = trimmed.find((l) => {
    const words = l.text.split(/\s+/).length
    return words < 4 || words > 30
  })
  const words = offender ? offender.text.split(/\s+/).length : 0
  const quoted = offender
    ? offender.text.length > 60
      ? `${offender.text.slice(0, 60)}…`
      : offender.text
    : ''
  return {
    entryId: offender?.id,
    label: 'Bullet points the right length',
    pass: !offender,
    na: trimmed.length === 0 || undefined,
    hint: offender
      ? words < 4
        ? `"${quoted}" is only ${words} word${words === 1 ? '' : 's'} — describe what you did and the result (aim for 8–25 words).`
        : `"${quoted}" runs ${words} words — tighten it to under 25 words so it scans in a single glance.`
      : 'Bullets are the right length — detailed enough to communicate, short enough to scan.',
    anchor: offender?.anchor ?? 'experience',
    category: 'content',
  }
}

/** Page length: one page, or two for executives with more experience to share */
function pageLengthCheck(
  pages: number | null | undefined,
  level: Resume['experienceLevel']
): AtsResult['checks'][number] {
  const allowed = level === 'executive' || level === 'director' ? 2 : 1
  if (pages == null || pages < 1) {
    return {
      label: 'Fits the recommended page count',
      pass: true,
      na: true,
      hint: 'Page count is measured from the live PDF preview in the builder.',
      anchor: 'experience',
      category: 'format',
    }
  }
  const pass = pages <= allowed
  return {
    label: 'Fits the recommended page count',
    pass,
    hint: pass
      ? `${pages} page${pages === 1 ? '' : 's'} — within the ${allowed}-page length recruiters expect${allowed === 2 ? ' at director/executive level' : ''}.`
      : `Your resume runs ${pages} pages — recruiters expect ${allowed}${allowed === 1 ? ' (two only at director/executive level)' : ''}; use Auto-fit or trim older roles and long bullets.`,
    anchor: 'experience',
    category: 'format',
  }
}

/** Bullet-marked lines anywhere in pasted text, markers stripped */
function textBulletLines(raw: string): string[] {
  return raw
    .split(/\n/)
    .filter((l) => BULLET_LINE_RE.test(l))
    .map((l) => l.replace(/^\s*[-\u2013\u2014\u2022*\u25aa\u25e6\u00b7]\s*/, ''))
}

/** Text-path bullets have no structured entries — section-level experience anchor */
function textBulletSources(raw: string): BulletSource[] {
  return textBulletLines(raw).map((text) => ({ text, anchor: 'experience' as const }))
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
    category: 'bestPractices',
  }
}

const ENTRY_LOCATIONS_LABEL = 'Locations on each entry'
const ENTRY_LOCATIONS_PASS_HINT =
  'Every entry lists a location — employers can validate your experience at a glance.'

/** Locations on each entry: work, involvement and education entries should carry one */
function entryLocationsCheck(
  entries: { name: string; located: boolean; anchor: SectionAnchor; id?: string }[]
): AtsResult['checks'][number] {
  const offender = entries.find((e) => !e.located)
  return {
    entryId: offender?.id,
    label: ENTRY_LOCATIONS_LABEL,
    pass: !offender,
    na: entries.length === 0 || undefined,
    hint: offender
      ? `"${offender.name}" has no location — add a city (or "Remote") to every entry so employers can validate your experience.`
      : ENTRY_LOCATIONS_PASS_HINT,
    anchor: offender?.anchor ?? 'experience',
    category: 'bestPractices',
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
  entries: { name: string; count: number; id?: string }[]
): AtsResult['checks'][number] {
  const offender = entries.find((e) => e.count < 3 || e.count > 6)
  return {
    entryId: offender?.id,
    label: BULLETS_PER_ENTRY_LABEL,
    pass: !offender,
    na: entries.length === 0 || undefined,
    hint: offender
      ? `"${offender.name}" has ${offender.count} bullet point${offender.count === 1 ? '' : 's'} — aim for 3–6 per role so each entry shows enough impact without overwhelming the reader.`
      : 'Every role carries 3–6 bullet points — enough detail without overwhelming the reader.',
    anchor: 'experience',
    category: 'content',
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
  return { label: 'Word count in recommended range', pass, hint, anchor, category: 'bestPractices' }
}

function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      .replace(/\b[a-z]+n[’']t\b/g, ' not ')
      .replace(/[’']([a-z]{1,2})\b/g, '')
      .replace(/[^a-z0-9+#./ -]/g, ' ')
      .match(/[a-z0-9+#][a-z0-9+#./-]*/g) ?? []
  ).map((t) => t.replace(/[./-]+$/, ''))
}

/** Fewest keywords worth scoring against; short ads are topped up to this many. */
const MIN_KEYWORDS = 15

const EMPLOYER_NAME = String.raw`([A-Z][\w&.'-]*(?: [A-Z][\w&.'-]*){0,2})`
const EMPLOYER_NAME_RES = [
  new RegExp(`^\\W*About ${EMPLOYER_NAME}\\W*$`, 'm'),
  new RegExp(`\\bAt ${EMPLOYER_NAME},`),
  new RegExp(`^${EMPLOYER_NAME} is (?:a|an|the|one|on a mission|building|looking|hiring)\\b`, 'm'),
  new RegExp(`\\b(?:Join|Life at|Working at|Why) ${EMPLOYER_NAME}\\b`),
]
const NOT_AN_EMPLOYER = new Set(
  'us this the opportunity role job position team company our you'.split(' ')
)

/**
 * Tokens that name the employer — the company passed in, plus the name the ad
 * itself introduces ("About Acme", "At Acme, we…", "Acme is a…"). Inferred
 * names never take a known skill or a common word with them.
 */
function employerTokens(jd: string, company: string | undefined): Set<string> {
  const out = new Set<string>()
  for (const tok of tokenize(company ?? '')) {
    for (const part of [tok, ...tok.split(/[./-]/)]) if (part.length >= 3) out.add(part)
  }
  for (const re of EMPLOYER_NAME_RES) {
    const m = re.exec(jd)
    if (!m) continue
    const toks = tokenize(m[1])
    if (toks.some((t) => NOT_AN_EMPLOYER.has(t) || STOPWORDS.has(t))) continue
    for (const t of toks) if (t.length >= 3 && !looksLikeSkill(t)) out.add(t)
    break
  }
  return out
}

/** "www.acme.com", "acme.co.uk", "careers.acme.io" — never a skill (".net" / "next.js" are). */
const URL_TOKEN_RE = /^www\.|\.(?:com|co|io|org|ai|de|uk|us|fr|eu|nl|es|it)$/

const BOILERPLATE_HEADING_RE =
  /^(?:(?:a bit |more )?about (?!(?:the |this )?(?:role|job|position|opportunity|team)\b|you\b).+|who we are|our (?:story|mission|values|culture|benefits|perks|commitment.*|hiring process|interview process|offer|way of working)|how we work|what we offer|what.s in it for you|what you.ll get|you.ll get|we offer|in return|rewards?|your benefits|why (?:join|work|you.ll love|us).*|the (?:perks|benefits|package)|(?:perks|benefits)(?: (?:&|and) (?:perks|benefits))?|compensation.*|salary.*|equal (?:employment )?opportunity.*|diversity.*|inclusion.*|how to apply|application process|interview process|hiring process|the process|next steps|what to expect|.*recruitment scams?.*|life at .*|the company|company (?:overview|description)|working at .*|what we do|join us)$/i

const LIST_ITEM_LINE_RE = /^\s*(?:[-–—•*▪◦·]|\d+[.)])\s/

/** A short, non-bullet, non-sentence line — how sections are titled in job ads. */
function isHeadingLine(line: string): boolean {
  const t = line.trim()
  return (
    t.length > 0 &&
    t.length <= 60 &&
    !LIST_ITEM_LINE_RE.test(line) &&
    !/[.,;!?]$/.test(t) &&
    t.split(/\s+/).length <= 6
  )
}

/**
 * Splits the ad into the text that describes the job and its "About us" /
 * "Benefits" / "Equal opportunity" / "How to apply" sections, whose repeated
 * words describe the employer. Nothing is split off when the ad has no such
 * section or what would be left is too short to score on its own.
 */
function splitBoilerplate(jd: string): { job: string; boilerplate: string } {
  const lines = jd.split(/\n/)
  const job: string[] = []
  const boilerplate: string[] = []
  let inBoiler = false
  for (const line of lines) {
    if (isHeadingLine(line)) {
      inBoiler = BOILERPLATE_HEADING_RE.test(line.trim().replace(/[:\s]+$/, ''))
      if (inBoiler) continue
    }
    ;(inBoiler ? boilerplate : job).push(line)
  }
  const text = job.join('\n')
  if (boilerplate.length === 0 || tokenize(text).length < 40) return { job: jd, boilerplate: '' }
  return { job: text, boilerplate: boilerplate.join('\n') }
}

/**
 * The ad with each verbatim-repeated paragraph kept once. Some feeds paste the
 * same duty paragraph twice; counting it twice would make every word in it a
 * "repeated" keyword.
 */
function withoutRepeatedParagraphs(jd: string): string {
  const seen = new Set<string>()
  return jd
    .split(/\n/)
    .filter((line) => {
      const key = line.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
      if (key.split(' ').length < 8) return true
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join('\n')
}

/**
 * Extract ranked keywords (words + known phrases) from a job description.
 * `company` is the employer the ad is for, when known — its name is never a
 * keyword, however often the ad repeats it.
 */
export function extractKeywords(jdRaw: string, limit = 30, company?: string): string[] {
  const jd = withoutRepeatedParagraphs(jdRaw)
  const lower = jd.toLowerCase()
  const found = new Map<string, number>()
  const { job, boilerplate } = splitBoilerplate(jd)
  // A phrase in the employer's own sections ("our verified social media
  // channels" in a recruitment-scam notice) describes the employer, not the job.
  const jobLower = job.toLowerCase()
  for (const phrase of KNOWN_PHRASES) {
    if (jobLower.includes(phrase)) found.set(phrase, 5)
  }
  const employer = employerTokens(jd, company)
  const isEmployer = (tok: string) =>
    employer.has(tok) || tok.split(/[./-]/).some((part) => part.length >= 3 && employer.has(part))
  const counts = new Map<string, number>()
  // Ordinary words count only where the ad describes the job; a skill named in
  // "About us" ("we build Next.js") still counts.
  for (const tok of [...tokenize(job), ...tokenize(boilerplate).filter(looksLikeSkill)]) {
    if (tok.length < 2 || STOPWORDS.has(tok) || !/[a-z]/.test(tok)) continue
    if (isEmployer(tok)) continue
    if (URL_TOKEN_RE.test(tok) && !KNOWN_SKILLS.has(tok)) continue
    counts.set(tok, (counts.get(tok) ?? 0) + 1)
  }
  const reqTokens = new Set(tokenize(requirementsBlock(lower)))
  const score = (tok: string, n: number) =>
    (looksLikeSkill(tok) ? n + 2 : n) + (reqTokens.has(tok) ? 0.5 : 0)
  const entries = [...counts.entries()]
  const core = entries
    .filter(([tok, n]) => n >= 2 || looksLikeSkill(tok))
    .map(([tok, n]) => [tok, score(tok, n)] as const)
    .sort((a, b) => b[1] - a[1])
  // Short ads rarely repeat anything: top up from single-mention words, the
  // requirements block first, then the rest in reading order.
  const header = headerLineTokens(jd)
  const fill = entries
    .filter(([tok, n]) => n < 2 && !looksLikeSkill(tok) && !header.has(tok))
    .sort((a, b) => Number(reqTokens.has(b[0])) - Number(reqTokens.has(a[0])))
    .map(([tok, n]) => [tok, score(tok, n) - 1] as const)
  const add = ([word, n]: readonly [string, number]) => {
    if ([...found.keys()].some((p) => p.includes(word))) return
    found.set(word, n)
  }
  core.forEach(add)
  for (const entry of fill) {
    if (found.size >= MIN_KEYWORDS) break
    add(entry)
  }
  return [...found.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k)
}

/** Tokens of the user's own target job title — noise as resume keywords, not skills. */
function roleTokensOf(role: string): Set<string> {
  return new Set(role.toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean))
}

/**
 * Drop single-word keywords that are just the target role's title words;
 * phrases and skills named in the title ("Python Developer") always stay.
 */
function withoutRoleTokens(keywords: string[], targetRole: string): string[] {
  const roleTokens = roleTokensOf(targetRole.trim())
  if (roleTokens.size === 0) return keywords
  return keywords.filter((kw) => kw.includes(' ') || looksLikeSkill(kw) || !roleTokens.has(kw))
}

const REQUIREMENTS_HEADING_RE =
  /^.*\b(requirements|qualifications|must[- ]haves?|what you.ll need|what we.re looking for|who you are|about you|what you bring|you.ll bring|you bring|ideal candidate|your profile|your background)\b.*$/im

/**
 * Text from the requirements heading onwards. An inline "Requirements: …" list
 * starts after the colon; a long sentence such as "You bring 4+ years of …" is
 * itself part of the block, a short heading line is not.
 */
function requirementsBlock(lower: string): string {
  const m = REQUIREMENTS_HEADING_RE.exec(lower)
  if (!m) return ''
  const colon = m[0].indexOf(':')
  const start = colon >= 0 ? colon + 1 : m[0].length > 60 ? 0 : m[0].length
  return lower.slice(m.index + start)
}

/**
 * Tokens of the short line under the title — usually "Company — City, Country"
 * — which name neither a skill nor a duty.
 */
function headerLineTokens(jd: string): Set<string> {
  const lines = jd.trim().split(/\n/)
  if (lines.length < 3) return new Set()
  const toks = tokenize(lines[1] ?? '')
  return new Set(toks.length <= 12 ? toks : [])
}

/**
 * Words that one in ten job ads repeats whatever the role (measured over 85 real
 * ads from the /jobs feeds — engineering, nursing, teaching, accounting, sales).
 * Repeating them says nothing about this job; they are still prioritized when
 * the ad's requirements list or title names them.
 */
const COMMON_AD_WORDS = new Set(
  `support product products systems tools engineering engineers design technical
teams data growth drive business process complex solutions learning performance
development platform workflows senior success personal technology analytics lead
global customers customer revenue content market training enterprise`.split(/\s+/)
)

/**
 * JD keywords worth prioritizing: known multi-word phrases, keywords repeated
 * ≥3 times (unless every ad repeats them), keywords in the
 * requirements/qualifications block, and keywords in the JD's first line
 * (usually the job title).
 */
export function highPriorityKeywords(jdRaw: string, keywords: string[]): Set<string> {
  const high = new Set<string>()
  if (!jdRaw.trim() || keywords.length === 0) return high
  const jd = withoutRepeatedParagraphs(jdRaw)
  const lower = jd.toLowerCase()
  const jdTokens = tokenize(jd)
  const firstLine = (jd.trim().split(/\n/, 1)[0] ?? '').toLowerCase()
  const firstLineTokens = new Set(tokenize(firstLine))
  const reqBlock = requirementsBlock(lower)
  const reqTokens = new Set(tokenize(reqBlock))
  for (const kw of keywords) {
    const phrase = kw.includes(' ')
    if (phrase && lower.includes(kw)) {
      high.add(kw)
      continue
    }
    if (!COMMON_AD_WORDS.has(kw) && countOccurrences(lower, jdTokens, kw) >= 3) {
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
export function matchScore(resumeTextRaw: string, jd: string, company?: string): number | null {
  const keywords = jd.trim() ? extractKeywords(jd, 30, company) : []
  if (keywords.length === 0) return null
  const idx = indexResumeText(resumeTextRaw)
  let matched = 0
  for (const kw of keywords) if (keywordHit(kw, idx).hit) matched++
  return Math.round((matched / keywords.length) * 100)
}

export interface MatchReport {
  pct: number
  covered: string[]
  missing: string[]
  highPriorityMissing: string[]
  /** Covered keywords the resume words differently from the posting */
  variants: KeywordVariant[]
}

/** Per-keyword breakdown behind matchScore — same extraction, matching and rounding. */
export function matchReport(
  resumeTextRaw: string,
  jd: string,
  targetRole = '',
  company?: string
): MatchReport | null {
  const keywords = withoutRoleTokens(jd.trim() ? extractKeywords(jd, 30, company) : [], targetRole)
  if (keywords.length === 0) return null
  const idx = indexResumeText(resumeTextRaw)
  const covered: string[] = []
  const missing: string[] = []
  const variants: KeywordVariant[] = []
  for (const kw of keywords) {
    const { hit, found } = keywordHit(kw, idx)
    if (!hit) missing.push(kw)
    else {
      covered.push(kw)
      if (found) variants.push({ keyword: kw, found })
    }
  }
  const high = highPriorityKeywords(jd, keywords)
  return {
    pct: Math.round((covered.length / keywords.length) * 100),
    covered,
    missing,
    highPriorityMissing: missing.filter((k) => high.has(k)),
    variants,
  }
}

/** Score pasted resume text (standalone ATS checker page) */
export function scoreResumeText(resumeTextRaw: string, jd: string): AtsResult {
  const idx = indexResumeText(resumeTextRaw)
  const resumeText = idx.text

  const keywords = jd.trim() ? extractKeywords(jd) : []
  const { matched, missing, variants } = splitKeywords(keywords, idx)

  const checks: AtsResult['checks'] = [
    {
      label: 'Email address found',
      pass: /[^\s@]+@[^\s@]+\.[^\s@]{2,}/.test(resumeText),
      hint: 'ATS parsers look for an email in the header.',
      anchor: 'contact',
      category: 'bestPractices',
    },
    {
      label: 'Phone number found',
      pass: /(\+?\d[\d\s().-]{7,})/.test(resumeText),
      hint: 'Include a phone number recruiters can call.',
      anchor: 'contact',
      category: 'bestPractices',
    },
    {
      label: 'Standard section headings',
      pass:
        /^\s*(work |professional |employment )?experience\s*:?\s*$/m.test(resumeText) &&
        /^\s*education\s*:?\s*$/m.test(resumeText),
      hint: 'Use standard headings like "Experience" and "Education" so parsers find them.',
      anchor: 'experience',
      category: 'format',
    },
    {
      label: 'Skills section present',
      pass: /^\s*(technical |core |key )?skills\s*:?\s*$/m.test(resumeText) || /skills:/.test(resumeText),
      hint: 'A dedicated skills list is the easiest keyword match for ATS.',
      anchor: 'skills',
      category: 'bestPractices',
    },
    {
      label: 'Quantified achievements',
      pass: /\d+(%|\+| percent|k\b|x\b)|\$\d/.test(resumeText),
      hint: 'Numbers (%, $, counts) make bullets stand out to recruiters.',
      anchor: 'experience',
      category: 'content',
    },
    {
      label: 'Employment dates found',
      pass: /\b(19|20)\d{2}\b/.test(resumeText),
      hint: 'ATS parsers build your work timeline from dates — include years for every role.',
      anchor: 'experience',
      category: 'format',
    },
    {
      label: 'Enough content to parse',
      pass: resumeTextRaw.trim().length >= 400,
      hint: 'Very short resumes give ATS systems too little to match on.',
      anchor: 'experience',
      category: 'content',
    },
    wordCountCheck(resumeTextRaw, 'experience'),
    reverseChronCheck(textDateRanges(resumeTextRaw)),
    bulletsPerEntryCheck(textBulletCounts(resumeTextRaw)),
    dateFormatCheck(textDateRanges(resumeTextRaw).flatMap((r) => [r.start, r.end])),
    namedMonthDatesCheck(textDateRanges(resumeTextRaw).flatMap((r) => [r.start, r.end])),
    pronounCheck(textPronounSegments(resumeTextRaw)),
    activeVoiceCheck(textBulletSources(resumeTextRaw)),
    weakOpenerCheck(textBulletSources(resumeTextRaw)),
    quantifiedBulletsCheck(textBulletSources(resumeTextRaw)),
    punctuatedBulletsCheck(textBulletSources(resumeTextRaw)),
    bulletLengthCheck(textBulletSources(resumeTextRaw)),
    buzzwordCheck(textPronounSegments(resumeTextRaw)),
    fillerWordCheck(textPronounSegments(resumeTextRaw)),
    linkedinCheck(/linkedin\.com\//i.test(resumeTextRaw)),
    entryLocationsCheck(textEntryLocations(resumeTextRaw)),
  ]

  return finalize(keywords, matched, missing, [], checks, keywordDetailFor(keywords, idx, jd, variants), variants)
}

function splitKeywords(
  keywords: string[],
  idx: ResumeIndex
): { matched: string[]; missing: string[]; variants: KeywordVariant[] } {
  const matched: string[] = []
  const missing: string[] = []
  const variants: KeywordVariant[] = []
  for (const kw of keywords) {
    const { hit, found } = keywordHit(kw, idx)
    if (!hit) missing.push(kw)
    else {
      matched.push(kw)
      if (found) variants.push({ keyword: kw, found })
    }
  }
  return { matched, missing, variants }
}

function finalize(
  keywords: string[],
  matched: string[],
  missing: string[],
  ignored: string[],
  checks: AtsResult['checks'],
  keywordDetail: KeywordDetail[],
  variants: KeywordVariant[]
): AtsResult {
  const applicable = checks.filter((c) => !c.na)
  const structureRatio = applicable.filter((c) => c.pass).length / applicable.length
  const structureScore = Math.round(structureRatio * 100)
  const keywordScore =
    keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : null
  const score =
    keywordScore !== null
      ? Math.round((keywordScore * 70 + structureScore * 30) / 100)
      : structureScore
  return { score, matched, missing, ignored, keywordDetail, keywordScore, structureScore, checks: applicable, variants }
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
    const tokens = matchTokenSet(tokenize(text))
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
import { stripInlineMarks } from './marks'

export function scoreResume(
  resume: Resume,
  jd: string,
  pdfPages?: number | null
): AtsResult {
  const idx = indexResumeText(resumeToPlainText(resume))
  const resumeText = idx.text

  const ignoredSet = new Set((resume.ignoredKeywords ?? []).map((k) => k.toLowerCase()))
  const allKeywords = withoutRoleTokens(
    jd.trim() ? extractKeywords(jd, 30, resume.targetCompany) : [],
    resume.targetRole
  )
  const ignored = allKeywords.filter((kw) => ignoredSet.has(kw))
  const keywords = allKeywords.filter((kw) => !ignoredSet.has(kw))
  const { matched, missing, variants } = splitKeywords(keywords, idx)

  const bulletCount = resume.experience.reduce(
    (n, e) => n + e.bullets.filter((b) => b.trim()).length,
    0
  )
  const quantified = resume.experience.some((e) =>
    e.bullets.some((b) => /\d/.test(b))
  )
  const bulletSources: BulletSource[] = [
    ...resume.experience
      .filter((e) => !e.hidden)
      .flatMap((e) =>
        e.bullets.map((text) => ({ text, anchor: 'experience' as const, id: e.id }))
      ),
    ...resume.projects
      .filter((p) => !p.hidden)
      .map((p) => ({ text: p.description, anchor: 'projects' as const, id: p.id })),
    ...(resume.involvement ?? [])
      .filter((i) => !i.hidden)
      .map((i) => ({ text: i.description, anchor: 'involvement' as const, id: i.id })),
    ...resume.customSections.flatMap((s) =>
      s.bullets.map((text) => ({ text, anchor: 'custom' as const, id: s.id }))
    ),
  ]
  const checks: AtsResult['checks'] = [
    {
      label: 'Contact info complete',
      pass: Boolean(resume.contact.fullName && resume.contact.email && resume.contact.phone),
      hint: 'Name, email and phone are the minimum ATS parsers look for.',
      anchor: 'contact',
      category: 'bestPractices',
    },
    {
      label: 'Professional summary present',
      pass: resume.summary.trim().length >= 40,
      hint: 'A 2-3 sentence summary gives ATS keyword context at the top.',
      anchor: 'summary',
      category: 'content',
    },
    {
      label: 'Work experience with bullets',
      pass: bulletCount >= 3,
      hint: 'Use 3-6 bullet points per role describing impact.',
      anchor: 'experience',
      category: 'content',
    },
    {
      label: 'Quantified achievements',
      pass: quantified,
      hint: 'Numbers (%, $, counts) make bullets stand out to recruiters.',
      anchor: 'experience',
      category: 'content',
    },
    {
      label: 'Employment dates listed',
      pass: resume.experience
        .filter((e) => e.role.trim() || e.company.trim())
        .every((e) => e.startDate.trim()),
      na:
        !resume.experience.some((e) => e.role.trim() || e.company.trim()) || undefined,
      hint: 'ATS parsers build your work timeline from dates — add a start date to every role.',
      anchor: 'experience',
      category: 'format',
    },
    {
      label: 'Skills section filled',
      pass: resume.skills.trim().length >= 10,
      hint: 'A dedicated skills list is the easiest keyword match for ATS.',
      anchor: 'skills',
      category: 'bestPractices',
    },
    {
      label: 'Skills grouped into categories',
      na: !resume.skills.trim() || undefined,
      pass:
        resume.skills.split(/[,\n]/).filter((s) => s.trim()).length < 8 ||
        skillLines(resume).some((l) => l.label),
      hint: 'Condense long skill lists into categories (e.g. "Languages: …", "Cloud: …") so recruiters can scan them.',
      anchor: 'skills',
      category: 'bestPractices',
    },
    {
      label: 'Education listed',
      pass: resume.education.some((e) => e.school.trim()),
      hint: 'Most ATS templates expect an education section.',
      anchor: 'education',
      category: 'format',
    },
    wordCountCheck(resumeText, 'experience'),
    reverseChronCheck(
      resume.experience
        .filter((e) => !e.hidden)
        .map((e) => ({
          name: [stripInlineMarks(e.role).trim(), stripInlineMarks(e.company).trim()].filter(Boolean).join(' at ') || 'Untitled role',
          start: e.startDate,
          end: e.endDate,
        }))
    ),
    bulletsPerEntryCheck(
      resume.experience
        .filter((e) => !e.hidden && (e.role.trim() || e.company.trim()))
        .map((e) => ({
          name: [stripInlineMarks(e.role).trim(), stripInlineMarks(e.company).trim()].filter(Boolean).join(' at '),
          count: e.bullets.filter((b) => b.trim()).length,
          id: e.id,
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
    activeVoiceCheck(bulletSources),
    weakOpenerCheck(bulletSources),
    quantifiedBulletsCheck(bulletSources),
    punctuatedBulletsCheck(bulletSources),
    bulletLengthCheck(bulletSources),
    buzzwordCheck([
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
    fillerWordCheck([
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
    pageLengthCheck(pdfPages, resume.experienceLevel),
    linkedinCheck(
      Boolean(resume.contact.linkedin.trim()) &&
        !(resume.hiddenContact ?? []).includes('linkedin')
    ),
    entryLocationsCheck([
      ...resume.experience
        .filter((e) => !e.hidden && (e.role.trim() || e.company.trim()))
        .map((e) => ({
          name: [stripInlineMarks(e.role).trim(), stripInlineMarks(e.company).trim()].filter(Boolean).join(' at '),
          located: Boolean(e.location.trim()),
          anchor: 'experience' as const,
          id: e.id,
        })),
      ...(resume.involvement ?? [])
        .filter((i) => !i.hidden && (i.role.trim() || i.organization.trim()))
        .map((i) => ({
          name: [stripInlineMarks(i.role).trim(), stripInlineMarks(i.organization).trim()].filter(Boolean).join(' at '),
          located: Boolean(i.location.trim()),
          anchor: 'involvement' as const,
          id: i.id,
        })),
      ...resume.education
        .filter((e) => !e.hidden && e.school.trim())
        .map((e) => ({
          name: e.school.trim(),
          located: Boolean(e.location.trim()),
          anchor: 'education' as const,
          id: e.id,
        })),
    ]),
  ]

  return finalize(keywords, matched, missing, ignored, checks, keywordDetailFor(keywords, idx, jd, variants), variants)
}

export type ReadinessTier = 'ready' | 'almost' | 'not-yet'

export interface ApplicationReadiness {
  tier: ReadinessTier
  blockers: string[]
}

/**
 * Rezi-style "Application Ready" roll-up: a readiness verdict derived from the
 * overall score (90+ ready, 50–89 almost, <50 not yet) plus the plain-language
 * reasons holding it back. Pure derivation — no new scoring.
 */
export function applicationReadiness(ats: AtsResult): ApplicationReadiness {
  const tier: ReadinessTier = ats.score >= 90 ? 'ready' : ats.score >= 50 ? 'almost' : 'not-yet'
  const blockers: string[] = []
  for (const cat of CHECK_CATEGORIES) {
    const failing = ats.checks.filter((c) => c.category === cat.key && !c.pass).length
    if (failing > 0)
      blockers.push(`${failing} ${cat.label.toLowerCase()} check${failing === 1 ? '' : 's'} failing`)
  }
  if (ats.keywordScore !== null && ats.keywordScore < 70)
    blockers.push(`keyword match at ${ats.keywordScore}% (${ats.missing.length} missing)`)
  return { tier, blockers: blockers.slice(0, 3) }
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
