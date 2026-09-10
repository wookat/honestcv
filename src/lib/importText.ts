/**
 * Heuristic plain-text resume import: paste text (from an old resume, a PDF
 * copy, or LinkedIn) and get a pre-filled Resume to review. Runs entirely in
 * the browser.
 */

import {
  MONTH_WORD_ALTERNATION,
  ONGOING_WORD_ALTERNATION,
  type CertificationItem,
  type CustomSection,
  type EducationItem,
  type ExperienceItem,
  type ReferenceKind,
  type Resume,
  defaultSectionLabels,
  emptyAgent,
  emptyAward,
  emptyCertification,
  emptyCoursework,
  emptyEducation,
  emptyExperience,
  emptyInvolvement,
  emptyMilitaryService,
  emptyPublication,
  emptyReference,
  emptyResume,
  newId,
  orderedSectionKeys,
} from './resume'
import { markdownSectionHeadings, plainResumeText } from './markdownText'
import { ACTION_VERBS } from './guidance'
import { isKnownPlace } from './places'
import {
  CREDENTIAL_TITLE_RE,
  CUSTOM_HEADING_RE,
  JOB_TITLE_NOUN_RE,
  SECTION_WORDS,
  type CoreSectionName as SectionName,
  looksLikeHeadingShape,
} from './sectionWords'

const EMAIL_RE = /[^\s@|,;]+@[^\s@|,;]+\.[a-z]{2,}/i
const PHONE_RE = /(\+?\(?\d[\d\s().-]{5,}\d)/
const US_STATES = new Set(
  ('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS ' +
    'MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV ' +
    'WI WY DC PR').split(' ')
)
const LINKEDIN_RE = /linkedin\.com\/[^\s|,;)]+/i
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s|,;)]*)?/i
// A month word in any resume language: English stems take a suffix ("Sept", "January"), the rest match whole.
const MONTH = String.raw`(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|${MONTH_WORD_ALTERNATION})`
const DATE_RANGE_RE = new RegExp(
  String.raw`(${MONTH}\.?\s*\d{4}|\d{4})\s*(?:[–—-]|to)\s*(${MONTH}\.?\s*\d{4}|\d{4}|${ONGOING_WORD_ALTERNATION})`,
  'i'
)
// "Skin Bliss, Micro-Intern (1 week); Dec 2023" — a one-off engagement dated
// with a single month after a separator at the end of the header.
const SINGLE_DATE_RE = new RegExp(String.raw`[;|,(–—-]\s*(${MONTH}\.?\s+\d{4})\)?\s*$`, 'i')
// "Dec 2023" alone on the line under a header: the one-off's date.
const BARE_MONTH_RE = new RegExp(String.raw`^\(?(${MONTH}\.?\s+\d{4})\)?$`, 'i')
// "Senior Scrum Master at Adobe, San Jose, CA (2019)" — a year alone in
// parentheses closing a header (our own TXT / MD exports print a same-year
// tenure this way); a bare year elsewhere on the line is not a date.
const TRAILING_YEAR_RE = /\s\(((?:19|20)\d{2})\)$/
const BARE_YEAR_LINE_RE = /^\(?((?:19|20)\d{2})\)?$/

const SECTION_HEADINGS: [RegExp, SectionName][] = [
  [/^(professional\s+)?(summary|profile|objective|about)\b/i, 'summary'],
  [/^((work|professional)\s+)?(experience|employment|work\s+history)\b/i, 'experience'],
  [/^work$/i, 'experience'],
  [/^education\b/i, 'education'],
  [/^(technical\s+)?skills?\b/i, 'skills'],
  [/^projects?\b/i, 'projects'],
  [/^(certifications?|certificates|licenses)\b/i, 'certifications'],
]

// The headings our own previews / PDF / DOCX / TXT / MD print (SECTION_LABELS in
// every language) read back as the section they were printed for: the six core
// sections by field, the rest (Involvement, Coursework, Military service, …) as a
// custom section titled with the canonical label. Keyed lower-cased and, for
// letter-spaced headings, with the spaces removed.
const CORE_SECTION_KEYS: Record<string, SectionName> = {
  summary: 'summary',
  experience: 'experience',
  education: 'education',
  skills: 'skills',
  projects: 'projects',
  certifications: 'certifications',
}
type OwnHeading = { section: SectionName } | { custom: string; key: string }
const OWN_HEADINGS = new Map<string, OwnHeading>()
for (const { key, label } of defaultSectionLabels()) {
  const own: OwnHeading = key in CORE_SECTION_KEYS ? { section: CORE_SECTION_KEYS[key] } : { custom: label, key }
  OWN_HEADINGS.set(label.toLowerCase(), own)
  OWN_HEADINGS.set(label.toLowerCase().replace(/\s+/g, ''), own)
}
// The headings the reader renamed in the Builder ("Where I have worked"), for the
// duration of one parse — its own export reads back into the sections it came from.
let readerHeadings: Map<string, OwnHeading> | null = null
function readerHeadingMap(sectionHeadings: Partial<Record<string, string>>): Map<string, OwnHeading> | null {
  const map = new Map<string, OwnHeading>()
  for (const [key, label] of Object.entries(sectionHeadings)) {
    const t = label?.trim()
    if (!t) continue
    const own: OwnHeading = key in CORE_SECTION_KEYS ? { section: CORE_SECTION_KEYS[key] } : { custom: t, key }
    map.set(t.toLowerCase(), own)
    map.set(t.toLowerCase().replace(/\s+/g, ''), own)
  }
  return map.size ? map : null
}
const ownHeading = (t: string) => {
  const k = t.trim().replace(/\s+/g, ' ').toLowerCase()
  return readerHeadings?.get(k) ?? OWN_HEADINGS.get(k)
}
// Lines a Markdown document marked `## …` — headings by declaration, so a custom
// section titled in mixed case ("UX Research Work") is one on re-import too.
let markedHeadings: Set<string> | null = null
// "P R O F E S S I O N A L E X P E R I E N C E" — tracked (letter-spaced) headings
// reach text extraction with a space after every letter.
const LETTER_SPACED_RE = /^(?:[A-Za-z&/] ){3,}[A-Za-z&/]$/
// "Role · Company" / "Role at Company" / "Role — Company" — the binders our
// own PDF / TXT / MD exports and Role·Company headers use between two names.
const ENTRY_HEADER_BINDER_RE = /\S\s(?:·|at|—)\s[A-Z0-9]/

// Word's default list glyph is ● (U+25CF); Symbol-font bullets reach text
// extraction as a lone Private Use Area character.
const BULLET_MARK_RE = /^[-–—•*·▪▫◦●○■□◆◇❖➢➤►▶✓✔→\uE000-\uF8FF]\s+/
const isBullet = (line: string) => BULLET_MARK_RE.test(line)
const stripBullet = (line: string) => line.replace(BULLET_MARK_RE, '').trim()

// "Giggling Platypus Co." / "Acme Inc." — a capitalised name whose period
// closes an abbreviation, not a sentence.
const ABBREV_END_RE =
  /\b(?:co|inc|ltd|corp|llc|plc|pvt|bros|gmbh|s\.a|l\.?p|jr|sr|st|dept|univ|assoc|intl)\.$/i
const ORG_WORD_RE = /^(?:[A-Z0-9&][\w&.'’-]*|and|of|the|de|du|&)$/
const looksLikeOrgName = (line: string) => {
  if (!ABBREV_END_RE.test(line)) return false
  const words = line.split(/\s+/)
  return words.length <= 6 && words.every((w) => ORG_WORD_RE.test(w))
}

// A sentence-like description line without a bullet marker (plain-text and
// DOCX exports often drop the markers): ends in sentence punctuation or is
// too long to be an entry header.
const looksLikeBodyLine = (line: string) =>
  (/[.!?;]$/.test(line) && !looksLikeOrgName(line)) || line.length > 60

// "Role (long qualifier) · Company," — a header long enough to wrap: the
// middle dot binds role and company and prose never ends a line with it.
const looksLikeWrappedHeader = (line: string) =>
  line.length <= 120 && /\s·\s/.test(line) && /,$/.test(line)
// "Publicity Officer · Oxford University Personalised Medicine Society" — a
// role · company header long enough to pass for prose by length alone; prose
// does not carry a middle dot and a header does not end in sentence punctuation.
const looksLikeDotHeader = (line: string) =>
  line.length <= 120 &&
  /\s·\s/.test(line) &&
  !/[.!?;:]$/.test(line) &&
  line.split(/\s+/).length <= 18

// PDF text extraction yields one line per visual line, so a bullet that wraps
// arrives as "Reduced load time from 3.2" + "seconds to 1.8 seconds.": a
// marker-less line starting in lowercase (or with a figure / currency amount)
// after a line with no terminal punctuation continues that line, and so does
// any marker-less line after one that ends mid-phrase ("… security best
// practices, and" + "TypeScript — raising standards"). A line that opens with
// a year is a date, not a continuation.
const OPEN_PHRASE_END_RE =
  /(?:,|\/|\b(?:and|or|but|with|for|to|of|in|on|by|at|as|from|into|via|using|across|through|including|the|a|an))$/i
const continuesPrevious = (prev: string | undefined, line: string) =>
  !!prev &&
  !/[.!?:;]$/.test(prev) &&
  !isBullet(line) &&
  (/^[a-zà-ÿ$€£0-9]/.test(line) || OPEN_PHRASE_END_RE.test(prev)) &&
  !/^\(?\d{4}\b/.test(line) &&
  !DATE_RANGE_RE.test(line)
// A line broken inside a hyphenated word ("multi-" + "tenant") rejoins without
// a space; every other wrap rejoins with one.
const joinWrapped = (prev: string, line: string) =>
  /[A-Za-zà-ÿ]-$/.test(prev) && /^[a-zà-ÿ]/.test(line) ? `${prev}${line}` : `${prev} ${line}`
const joinWrappedLines = (lines: string[]) =>
  lines.reduce((acc, l) => (acc ? joinWrapped(acc, l) : l), '')

// "Mumbai, India" / "Austin, TX" / "Remote" — a place, nothing else.
const PLACE_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'’-]{0,30}(?:,\s*[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'’-]{0,30}){0,2}$/
// "Location: London" / "Based in Berlin" / "Address — Austin, TX"
const HEADER_PLACE_LABEL_RE = /^(?:(?:location|address)\s*[:—–-]|(?:based|lives) in)\s*(\S.*)$/i

const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s|,;)]+/i

// "Languages: TypeScript, Go" — a category label (no comma, no URL scheme) before its items.
const SKILL_LABEL_RE = /^([A-Za-z][^:,]{0,39}):\s+(.+)$/
const tidySkillItems = (items: string) =>
  items.split(',').map((s) => s.trim()).filter(Boolean).join(', ')

// A skills grid lays each category label on its own line above its items
// ("Languages" + "Python, TypeScript, SQL"). Two or more such pairs in a
// block are folded to "Label: items" lines; a single pair could be a flat
// list that happens to hold one comma line and is left alone.
const SKILL_GRID_LABEL_RE = /^[A-Za-z][A-Za-z&/ '’-]{1,39}$/
const isGridLabel = (l: string) =>
  SKILL_GRID_LABEL_RE.test(l) && l !== l.toUpperCase() && l.split(/\s+/).length <= 4
function foldSkillGrid(lines: string[]): string[] {
  const pairAt = (i: number) =>
    isGridLabel(lines[i]) &&
    i + 1 < lines.length &&
    lines[i + 1].includes(',') &&
    !SKILL_LABEL_RE.test(lines[i + 1])
  let pairs = 0
  for (let i = 0; i < lines.length; i++) if (pairAt(i)) pairs++
  if (pairs < 2) return lines
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    if (pairAt(i)) {
      out.push(`${lines[i]}: ${lines[i + 1]}`)
      i++
    } else out.push(lines[i])
  }
  return out
}

// A skills block written as one "Category: a, b" line per category keeps one
// line per category (the format skillLines() renders with bold labels). A
// marker-less line under a labelled line is that line's PDF wrap when it starts
// in lowercase or the label line ends in a comma or is long enough to have
// wrapped; a short labelled line followed by a plain one is a mixed block and
// the plain line stays its own row. Blocks without labels stay a flat list.
function joinSkillLines(lines: string[]): string {
  const cleaned = foldSkillGrid(
    lines.map((l) => stripBullet(l).replace(/[•·▪◦|]/g, ',').trim()).filter(Boolean)
  )
  if (!cleaned.some((l) => SKILL_LABEL_RE.test(l))) return tidySkillItems(cleaned.join(','))
  const out: string[] = []
  let prevRaw = ''
  for (const line of cleaned) {
    const m = SKILL_LABEL_RE.exec(line)
    const wraps =
      !m &&
      SKILL_LABEL_RE.test(prevRaw) &&
      (/^[a-zà-ÿ]/.test(line) || /,$/.test(prevRaw) || prevRaw.length >= 45)
    if (wraps) {
      prevRaw = `${prevRaw} ${line}`
    } else {
      out.push('')
      prevRaw = line
    }
    const lm = SKILL_LABEL_RE.exec(prevRaw)
    out[out.length - 1] = lm
      ? `${lm[1].trim()}: ${tidySkillItems(lm[2])}`
      : tidySkillItems(prevRaw)
  }
  return out.join('\n')
}

// LinkedIn "Profile → More → Save to PDF" export markers: a `handle (LinkedIn)`
// contact line, the sidebar's "Top Skills" heading, or page footers.
const LI_PAGE_RE = /^page \d+ of \d+$/i
const LI_DURATION_RE = /\s*\((?:less than a year|\d+\s+years?(?:\s+\d+\s+months?)?|\d+\s+months?)\)\s*$/i

/**
 * A LinkedIn "Save to PDF" export (or its pasted text) carries the profile URL,
 * a `<user> (LinkedIn)` contact row, a Top Skills sidebar and page footers; a
 * résumé that merely lists `<user> (LinkedIn)` among its links has one of them.
 */
export function looksLikeLinkedInExport(raw: string): boolean {
  const lines = raw.split(/\r?\n/).map((l) => l.trim())
  const markers = [
    lines.some((l) => /^\S+\s+\(LinkedIn\)$/i.test(l)),
    lines.some((l) => /^top skills$/i.test(l)),
    lines.some((l) => LI_PAGE_RE.test(l)),
    LINKEDIN_RE.test(raw),
  ].filter(Boolean).length
  return markers >= 2
}

/** First phone-like match that isn't actually a year range like "2010 - 2014". */
function findPhone(text: string): string {
  const re = new RegExp(PHONE_RE.source, 'g')
  for (const line of text.split(/\r?\n/)) {
    for (const m of line.matchAll(re)) {
      const candidate = m[0].trim()
      if (/\d{4}\s*[–—-]\s*\d{4}/.test(candidate)) continue
      if (candidate.replace(/\D/g, '').length < 7) continue
      return candidate
    }
  }
  return ''
}

function matchHeading(line: string): SectionName | null {
  let t = line.trim().replace(/[:：]$/, '')
  const own = ownHeading(t)
  if (own) return 'section' in own ? own.section : null
  if (LETTER_SPACED_RE.test(t)) {
    const word = t.replace(/ /g, '')
    const spaced = ownHeading(word)
    if (spaced) return 'section' in spaced ? spaced.section : null
    for (const [re, name] of SECTION_WORDS) if (re.test(word)) return name
    return null
  }
  // "WORK EXPERIENCE (most impressive first)" — an aside after the heading
  t = t.replace(/\s*\([^)]*\)$/, '')
  if (JOB_TITLE_NOUN_RE.test(t) || CREDENTIAL_TITLE_RE.test(t)) return null
  // "About Recommendations · Recommendations" / "Profile Lead at Acme" — an
  // entry header that happens to open with a section word; a section heading
  // never binds two names with a middle dot or "at".
  if (ENTRY_HEADER_BINDER_RE.test(t)) return null
  if (t.length <= 40) for (const [re, name] of SECTION_HEADINGS) if (re.test(t)) return name
  if (CUSTOM_HEADING_RE.test(t) || !looksLikeHeadingShape(t)) return null
  for (const [re, name] of SECTION_WORDS) if (new RegExp(`\\b(?:${re.source})\\b`, 'i').test(t)) return name
  return null
}

// "Technical Skills: Java, SQL" — a standard heading that carries its first line.
const INLINE_HEADING_RE = /^([^:：]{1,40})[:：]\s+(\S.*)$/
function matchInlineHeading(line: string): { heading: SectionName; rest: string } | null {
  const m = INLINE_HEADING_RE.exec(line)
  if (!m || JOB_TITLE_NOUN_RE.test(m[1])) return null
  const own = ownHeading(m[1])
  if (own) return 'section' in own ? { heading: own.section, rest: m[2] } : null
  for (const [re, name] of SECTION_HEADINGS) if (re.test(m[1].trim())) return { heading: name, rest: m[2] }
  return null
}

// Two to four words, the first capitalised, before a " — ": the name half of
// our own "Name — Title" header line.
const NAME_HEAD_RE = /^[A-ZÀ-Þ][\p{L}.'’-]*(?:\s+[\p{L}.'’-]+){1,3}$/u
// A header-row segment that is a link ("github.com/jane", "linkedin.com/in/jane",
// "www.jane.dev"), as opposed to a title that merely contains a dot ("Node.js Developer")
const isUrlSegment = (seg: string) =>
  LINKEDIN_RE.test(seg) ||
  /^(?:https?:\/\/|www\.)/i.test(seg) ||
  /\b[a-z0-9-]+\.(?:com|dev|io|me|net|org|co|ai|design|xyz)(?:\/|$)/i.test(seg)
// Document title printed above the name ("Curriculum Vitae", "Résumé") in
// English or a product language (ES / FR / DE / PT: "Lebenslauf",
// "Currículum Vitae", "Hoja de Vida", "Currículo", "Persönliche Daten" …)
const DOC_TITLE_RE =
  /^(?:curr[ií]cul[ou]m?(?:\s+vit[aæ]e?)?|cv|r[ée]sum[ée]|lebenslauf|hoja\s+de\s+vida|personal\s+(?:details|information)|pers[öo]nliche\s+(?:daten|angaben)|angaben\s+zur\s+person|datos\s+personales|informaci[óo]n\s+personal|dados\s+pessoais|informa[çc][õo]es\s+pessoais|coordonn[ée]es|informations\s+personnelles|[ée]tat\s+civil)\s*:?$/iu
// "Senior Engineer · Acme Corp" / "Senior Engineer | Acme Corp" over its
// dates or its bullets — an entry header pasted without any heading above it.
// A contact row uses the same binders but carries an e-mail / phone / URL,
// and a "Name | Title" row has neither a date line nor a bullet under it.
// "Senior Engineer at Acme Corp" / "Senior Engineer — Acme Corp" bind the same
// way, but "at" and a dash also occur in prose ("8 years at scale-ups — mostly
// fintech"), so those need a job-title noun on the left and a header shape.
const AT_DASH_BINDER_RE = /[\p{L})]\s(?:at|—|–)\s[A-Z0-9]/u
const bindsEntryHeader = (line: string) => {
  if (/\S\s(?:·|\|)\s\S/.test(line)) return true
  if (!AT_DASH_BINDER_RE.test(line) || looksLikeBodyLine(line)) return false
  const { role } = splitRoleCompanyRaw(line)
  return JOB_TITLE_NOUN_RE.test(role) && !/\d/.test(role) && role.split(/\s+/).length <= 6
}
const isHeadlessEntryHeader = (line: string, next: string) =>
  bindsEntryHeader(line) &&
  !isContactRow(line) &&
  (bareDate(next) !== null || isBullet(next) || (!!extractDates(line).start && !!extractDates(line).rest))
// "• Led the migration of the billing platform to the new" + "Kubernetes
// cluster, cutting p99 latency by 40%.": the second visual line of a bullet
// opens with a capitalised word, so `continuesPrevious` (lowercase / figure /
// open phrase) does not see the wrap — a page break in our own PDF export, or
// a paste that kept its line breaks. It continues the bullet when that bullet
// carried a marker in the source (marker-less bullet lists — Canva — end
// without punctuation and each line is its own item), still ends
// mid-sentence, and this marker-less line reads as prose rather than as an
// entry header, a date line, a tag row or a bullet that lost its marker (it
// opens with an action verb — "Shipped the redesign …").
const openedWithMarker = (lines: string[], i: number, bullet: string) => {
  for (let p = i - 1; p >= 0; p--) {
    const src = lines[p]
    if (!src) continue
    if (isBullet(src)) return bullet.startsWith(stripBullet(src))
    if (!bullet.includes(src.trim())) return false
  }
  return false
}
const continuesOpenBullet = (lines: string[], i: number, bullet: string | undefined, line: string) =>
  !!bullet &&
  !/[.!?:;]$/.test(bullet) &&
  !isBullet(line) &&
  /^[A-ZÀ-Þ]/.test(line) &&
  looksLikeBodyLine(line) &&
  !opensWithActionVerb(line) &&
  !bindsEntryHeader(line) &&
  !isTagList(line) &&
  !DATE_RANGE_RE.test(line) &&
  !extractDates(line).start &&
  openedWithMarker(lines, i, bullet)
// The document's body has begun: a dated line, a bullet or an entry header.
// A name never follows these, so the name scan stops here.
const startsBody = (line: string, next: string) =>
  isBullet(line) ||
  bareDate(line) !== null ||
  !!extractDates(line).start ||
  isHeadlessEntryHeader(line, next)

// Templates (four of ours, Pages, Word) print the name in capitals; the case is
// typography, not the name. Only a fully upper-case name is recased: mixed case
// ("MacKenzie", "alex morgan") is left as the document had it.
const NAME_PARTICLE_RE = /^(?:de|da|del|della|di|du|la|le|van|von|der|den|bin|ibn|al|el|y|e)$/i
const NAME_NUMERAL_RE = /^(?:II|III|IV)$/
export function humanNameCase(name: string): string {
  const letters = name.replace(/\P{L}/gu, '')
  if (letters.length < 4 || letters !== letters.toUpperCase()) return name
  return name
    .split(/(\s+)/)
    .map((tok, i) => {
      if (i % 2 === 1 || NAME_NUMERAL_RE.test(tok) || /^\p{L}\.?$/u.test(tok)) return tok
      if (i > 0 && NAME_PARTICLE_RE.test(tok)) return tok.toLowerCase()
      return tok.replace(/\p{L}+/gu, (run) =>
        /^MC\p{L}/u.test(run)
          ? `Mc${run[2]}${run.slice(3).toLowerCase()}`
          : run[0] + run.slice(1).toLowerCase()
      )
    })
    .join('')
}

// 15 of our 25 templates (and TXT / DOCX) print section headings in capitals;
// the case is typography, not the title. A fully upper-case custom heading is
// stored in title case — small words lower-cased after the first, short
// vowel-less runs (IT / UX / SQL / CSS) kept as acronyms. Mixed case is kept.
const HEADING_SMALL_WORD_RE = /^(?:and|or|of|the|for|in|on|at|to|a|an|with|de|y|et|und|e)$/i
export function headingCase(title: string): string {
  const letters = title.replace(/\P{L}/gu, '')
  if (letters.length < 4 || letters !== letters.toUpperCase()) return title
  let first = true
  return title.replace(/\p{L}+/gu, (run) => {
    const lead = first
    first = false
    if (HEADING_SMALL_WORD_RE.test(run)) return lead ? run[0] + run.slice(1).toLowerCase() : run.toLowerCase()
    if (run.length <= 2 || (run.length <= 3 && !/[AEIOUY]/.test(run))) return run
    return run[0] + run.slice(1).toLowerCase()
  })
}

// Gutter layouts print the section label beside the section's first line, and
// layout-preserving extraction (Chrome's PDF copy, pdftotext -layout) keeps them
// on one line: "EXPERIENCE Senior Software Engineer · Northstar Digital, London".
// The leading ALL-CAPS run (longest first) must be a known section name and
// the remainder must be content: not a template aside "(for early-career …)"
// and not another heading "OBJECTIVE or PROFESSIONAL SUMMARY".
const CAPS_TOKEN_RE = /^(?:\p{Lu}[\p{Lu}&/]*|&)$/u
type GutterLabel = { heading: SectionName; rest: string } | { custom: string; rest: string }
function matchGutterLabel(line: string): GutterLabel | null {
  const words = line.trim().split(/\s+/)
  let caps = 0
  while (caps < words.length - 1 && CAPS_TOKEN_RE.test(words[caps])) caps++
  for (let k = caps; k >= 1; k--) {
    const label = words.slice(0, k).join(' ')
    const rest = words.slice(k).join(' ')
    if (!/^[\p{L}0-9•·\-–]/u.test(rest) || !/\p{Ll}/u.test(rest.replace(/^(?:or|and)\s+/i, ''))) return null
    if (JOB_TITLE_NOUN_RE.test(label) || CREDENTIAL_TITLE_RE.test(label)) return null
    const own = ownHeading(label)
    if (own) return 'section' in own ? { heading: own.section, rest } : { custom: own.custom, rest }
    for (const [re, name] of SECTION_HEADINGS) if (label.replace(re, '') === '') return { heading: name, rest }
    if (label.replace(CUSTOM_HEADING_RE, '') === '') return { custom: label, rest }
  }
  return null
}

// "Languages: English, German" / "Leadership, Negotiation" — a custom section
// word that carries its own list is a labelled line, not a heading.
const CUSTOM_LIST_RE = /^([A-Za-z][A-Za-z &/'’-]{0,30}?)\s*[:：]\s+(\S.*)$/
function matchInlineCustomHeading(line: string): { title: string; rest: string } | null {
  const m = CUSTOM_LIST_RE.exec(line.trim())
  if (!m || !CUSTOM_HEADING_RE.test(m[1].trim())) return null
  return { title: m[1].trim(), rest: m[2].trim() }
}

/** Heading for a section we don't have a dedicated field for (Awards, Languages…) */
function matchCustomHeading(line: string): string | null {
  const t = line.trim().replace(/[:：]$/, '')
  if (/[:：,;]\s*\S/.test(t)) return null
  const own = ownHeading(LETTER_SPACED_RE.test(t) ? t.replace(/ /g, '') : t)
  if (own) return 'custom' in own ? own.custom : null
  if (LETTER_SPACED_RE.test(t)) {
    // Tracked heading of a section we have no field for; the last word is
    // recoverable when it is a known section word ("EXTRACURRICULAR ACTIVITIES").
    return unglueHeading(t.replace(/ /g, '')).toUpperCase()
  }
  if (markedHeadings?.has(t)) return t
  if (t.length > 32) return null
  if (CUSTOM_HEADING_RE.test(t)) return t
  // Generic short ALL-CAPS heading like "PRO BONO WORK" — a lone short
  // acronym (CSS / AWS / SQL, a wrapped skill) is not one.
  if (/^[A-Z][A-Z &/'-]+$/.test(t) && t.split(/\s+/).filter((w) => w !== '&').length <= 3 && (t.length >= 6 || t.includes(' ')))
    return unglueHeading(t)
  return null
}

// A tracked heading whose spaces the extractor dropped ("TECHNICALWRITING"):
// the last word is recoverable when it is a known section word.
const unglueHeading = (t: string) =>
  t.replace(
    /^([A-Za-z]{5,})(awards?|honors?|achievements?|publications?|activities|interests?|languages?|leadership|work|writing|involvement|experience)$/i,
    '$1 $2',
  )

// Trailing separators left where the dates were; a bracket only when the
// dates were the bracket's content ("Role (Jan 2020 – Present)" → "Role ("
// or, when the slice kept both halves, "Role at Acme ()").
const stripDateRest = (s: string) => {
  const t = s.replace(/\(\s*\)/g, ' ').replace(/[\s|,;–—-]+$/, '')
  const open = (t.match(/\(/g) ?? []).length
  const close = (t.match(/\)/g) ?? []).length
  if (open > close && /\($/.test(t)) return stripDateRest(t.slice(0, -1))
  if (close > open && /\)$/.test(t)) return stripDateRest(t.slice(0, -1))
  return t.trim()
}
function extractDates(line: string): { rest: string; start: string; end: string } {
  const m = line.match(DATE_RANGE_RE)
  if (!m) {
    const bare = line.match(BARE_MONTH_RE)
    if (bare) return { rest: '', start: bare[1].trim(), end: bare[1].trim() }
    const s = line.match(SINGLE_DATE_RE)
    if (!s || (s.index ?? 0) === 0 || (s.index ?? 0) > 80) {
      const y = line.match(TRAILING_YEAR_RE)
      const head = y ? line.slice(0, y.index).trim() : ''
      // a sentence's year ("… shipped the platform. (2023)") is not a tenure;
      // an abbreviation's period ("Cox Automotive Inc. (2018)") is
      if (!y || !head || /[!?;]$/.test(head) || (/\.$/.test(head) && !ABBREV_END_RE.test(head)))
        return { rest: line, start: '', end: '' }
      return { rest: stripDateRest(line.slice(0, y.index)), start: y[1], end: y[1] }
    }
    // a blank end date renders "start – Present", so a one-off keeps both ends
    return { rest: stripDateRest(line.slice(0, s.index)), start: s[1].trim(), end: s[1].trim() }
  }
  return {
    rest: stripDateRest(line.slice(0, m.index) + line.slice((m.index ?? 0) + m[0].length)),
    start: m[1].trim(),
    end: m[2].trim(),
  }
}

// "Arowwai Industries, Operations Manager" — employer-first headers (UK CVs,
// Canva templates): the side that names a job title is the role.
function orientRoleCompany<T extends { role: string; company: string }>(h: T): T {
  if (h.company && !JOB_TITLE_NOUN_RE.test(h.role) && JOB_TITLE_NOUN_RE.test(h.company))
    return { ...h, role: h.company, company: h.role }
  return h
}

/** Split "Role · Company" / "Role at Company" / "Role — Company" / "Role, Company" / "Role | Company" */
function splitRoleCompany(text: string): { role: string; company: string; location: string } {
  return orientRoleCompany(splitRoleCompanyRaw(text))
}
function splitRoleCompanyRaw(text: string): { role: string; company: string; location: string } {
  // "Role · Company, Location" — the middle-dot binds role/company; a
  // comma after it introduces a location, not another separator.
  const dot = text.split(/\s*·\s*/)
  if (dot.length >= 2 && dot[0].trim() && dot[1].trim()) {
    const rest = dot.slice(1).join(' · ').trim()
    const comma = rest.indexOf(', ')
    if (comma > 0) {
      return {
        role: dot[0].trim(),
        company: rest.slice(0, comma).trim(),
        location: rest.slice(comma + 2).trim(),
      }
    }
    return { role: dot[0].trim(), company: rest, location: '' }
  }
  const seps = [/\s+at\s+/i, /\s*[—–|]\s*/, /,\s+/]
  for (const sep of seps) {
    const parts = text.split(sep)
    if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
      // "Software Engineer III, Team Leader" — two titles, no employer
      if (sep.source.includes(',') && parts.every((p) => JOB_TITLE_NOUN_RE.test(p))) break
      // "B.S. Computer Science, University of Texas at Austin" / "University at
      // Buffalo" — the "at" is part of the school's name, not a separator
      if (sep.source.includes('at') && SCHOOL_RE.test(parts[0]) && !parts.slice(1).some((p) => SCHOOL_RE.test(p)))
        continue
      const company = parts.slice(1).join(', ').trim()
      // "Role — Company, City, ST" / "Role at Company, London, UK" /
      // "Degree, School, City, ST" — peel a trailing location off the company
      const loc =
        company.match(/,\s*([A-Za-z .'-]+,\s*[A-Z]{2}|Remote)$/) ??
        placeTail(company) ??
        company.match(REGION_TAIL_RE)
      if (loc && (!sep.source.includes(',') || parts.length >= 3) && (loc.index ?? 0) > 0)
        return {
          role: parts[0].trim(),
          company: company.slice(0, loc.index).trim(),
          location: loc[1].trim(),
        }
      return { role: parts[0].trim(), company, location: '' }
    }
  }
  return { role: text.trim(), company: '', location: '' }
}

// "Ivanti, San Francisco Bay Area" / "CGS, Greater Philadelphia Area" — the
// region labels LinkedIn prints (and our exports carry) as the location.
const REGION_RE = /(?:[A-Z][A-Za-z.'-]*\s+){1,4}(?:Area|Region|Metropolitan Area)/
const REGION_TAIL_RE = new RegExp(`,\\s*(${REGION_RE.source})$`)
const REGION_LINE_RE = new RegExp(`^${REGION_RE.source}$`)
// up to three capitalised words: the tail of a header wrapped inside its location
const HEADER_TAIL_RE = /^[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,2}$/

// "Acme, Berlin, Germany" → the last two comma parts when they read as a place
// and something is left for the company.
function placeTail(company: string): RegExpMatchArray | null {
  const m = company.match(/,\s*([^,]+,\s*[^,]+)$/)
  return m && (m.index ?? 0) > 0 && isExpPlaceLine(m[1].trim()) && !/\b(?:present|current|year|month)\b/i.test(m[1])
    ? m
    : null
}

/** Undated honors/coursework line under an education entry — details, not a new school */
const EDU_DETAIL_RE =
  /\b(gpa|cgpa|dean'?s list|cum laude|hono(?:u?rs)|minor|major|coursework|thesis|dissertation|scholar(?:ship)?|bursary|award|grade|modules?|a[- ]levels?|gcses?|distinction|merit|first[- ]class)\b/i
// "Modules: Proteins; Quantum Mechanics" / "A Levels: Chemistry A*" — a labelled
// line under a school is its detail unless the label itself names a degree.
const EDU_DEGREE_LABEL_RE =
  /\b(b\.?s\.?c?|b\.?a|m\.?s\.?c?|m\.?a|m\.?eng|b\.?eng|bachelor|master|ph\.?d|mba|diploma|certificate|degree)\b/i
// "Chemistry A*, Mathematics A*" / "Maths 9, Physics 8" — subjects each ending in
// a grade are results, not a "Degree, School" header.
const GRADE_ITEM_RE = /^[A-Za-z][A-Za-z &/()-]{1,40}\s+(?:A\*|[A-E]\*?|[1-9])$/
const isGradeList = (line: string) => {
  const items = line.split(/[,;]/).map((s) => s.trim())
  return items.every((s) => GRADE_ITEM_RE.test(s)) && (items.length >= 2 || /A\*$/.test(line))
}
const isEduDetailLine = (line: string) => {
  if (EDU_DETAIL_RE.test(line) || isGradeList(line)) return true
  const m = SKILL_LABEL_RE.exec(line)
  return !!m && !EDU_DEGREE_LABEL_RE.test(m[1]) && !CUSTOM_HEADING_RE.test(m[1].trim())
}

// Career-centre layouts put each education field on its own line
// ("University of Florida | Gainesville, FL" / "Bachelor of Science in …" /
// "Expected May 2026"); these classify a line so it fills the open entry
// instead of opening a school per line.
const EDU_DEGREE_RE =
  /\b(b\.?s\.?c?|b\.?a|b\.?e|b\.?tech|m\.?s\.?c?|m\.?a|m\.?eng|b\.?eng|m\.?tech|m\.?phil|bachelor|master|ph\.?d|mba|diploma|certificate|degree|associate|btec|hnd|baccalaur[eé]at|abitur|laurea|licenciatura)\b/i
const SCHOOL_RE =
  /\b(university|universit[aä]t|universidad|universit[eé]|college|school|institute|instituto|academy|polytechnic|lyc[eé]e|gymnasium|hochschule|conservatoire|conservatory|faculty|escuela)\b/i
const EDU_GRAD_RE = /^(?:expected|anticipated|graduat(?:ed|ing|ion))\b|\b(?:expected|anticipated) graduation\b/i
const isEduPlaceLine = (line: string) =>
  PLACE_RE.test(line) && line.includes(',') && !SCHOOL_RE.test(line) && !EDU_DEGREE_RE.test(line)
// "Buffalo, NY" / "Berlin, Germany" — never an employer ("Acme, Inc") or a title
const isExpPlaceLine = (line: string) =>
  isEduPlaceLine(line) &&
  line.length <= 40 &&
  line.split(',').every((p) => /^\s*[A-ZÀ-Þ]/.test(p)) &&
  !JOB_TITLE_NOUN_RE.test(line) &&
  !/\b(?:inc|llc|ltd|gmbh|corp|co|plc|limited|sa|ag|pty)\b\.?$/i.test(line)
// "Kubernetes, Minikube, Helm, Rust" — three or more short comma-separated names
const isTagList = (line: string) => {
  const parts = line.split(',').map((p) => p.trim())
  return parts.length >= 3 && !/[.:;!?]$/.test(line) && parts.every((p) => p && p.split(/\s+/).length <= 3)
}
// "Next.js · TypeScript · Vanilla CSS · React · Vercel" — a project's stack row
const isStackRow = (line: string) => {
  const parts = line.split(/\s[·|]\s/).map((p) => p.trim())
  return parts.length >= 3 && !/[.:;!?]$/.test(line) && parts.every((p) => p && p.split(/\s+/).length <= 3)
}
// "Next.js" / "index.html" match URL_RE but name code, not a site
const CODE_NAME_RE = /^[a-z0-9-]+\.(?:js|ts|jsx|tsx|py|rs|go|css|cs|sh|rb|md|cpp|html?|json|ya?ml)$/i
// A line that names a degree and is not a "Label: items" detail row
const isDegreeLine = (text: string) => {
  const label = SKILL_LABEL_RE.exec(text)
  if (label && !EDU_DEGREE_LABEL_RE.test(label[1])) return false
  return EDU_DEGREE_RE.test(text)
}
// "BA Economics; GPA: 3.8" / "MSc Data Science, Columbia University | New York, NY" —
// the degree keeps its commas ("Bachelor of Science, Computer Science"); a school
// noun after the first comma, or anything after a dash / pipe, is the school.
const splitDegreeLine = (text: string) => {
  const parts = text.split(/\s*[—–|]\s*/).filter(Boolean)
  let head = parts[0] ?? ''
  let school = parts.slice(1).join(', ')
  let location = ''
  if (!school) {
    const comma = head.indexOf(', ')
    if (comma > 0 && SCHOOL_RE.test(head.slice(comma + 2)) && !SCHOOL_RE.test(head.slice(0, comma))) {
      school = head.slice(comma + 2).trim()
      head = head.slice(0, comma)
    }
  }
  const loc = school.match(/,\s*([A-Za-z .'-]+,\s*[A-Z]{2}|[A-Za-z .'-]+,\s*[A-Za-z .'-]+|Remote)$/)
  if (loc && SCHOOL_RE.test(school.slice(0, loc.index))) {
    location = loc[1].trim()
    school = school.slice(0, loc.index).trim()
  }
  const [degree, ...more] = head.split(/;\s*/)
  return { degree: degree.trim(), school: school.trim(), location, details: more.join('; ').trim() }
}
// A one- or two-word label the heading vocabulary does not know
// ("Zusammenfassung", "Über mich") sitting over a prose line: a heading in a
// language the product does not print, not a title or a sentence.
const isUnknownSectionLabel = (line: string, next: string) =>
  /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ-]*(?:\s[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ-]*)?$/.test(line) &&
  line.length <= 30 &&
  !matchHeading(line) &&
  (next.length >= 40 || looksLikeBodyLine(next)) &&
  !isBullet(next) &&
  /^[A-Za-zÀ-ÿ"'“]/.test(next)

const prevNonEmpty = (lines: string[], i: number) => {
  for (let p = i - 1; p >= 0; p--) if (lines[p]) return lines[p]
  return ''
}
const nextNonEmptyIndex = (lines: string[], i: number) => {
  for (let n = i + 1; n < lines.length; n++) if (lines[n]) return n
  return lines.length
}
// A long "Role · Company, Location" header wraps at a space in a narrow
// column, so PDF text delivers it as two lines that break either right after
// the binder ("… Transformation & Coaching ·" + "Ivanti, San Francisco Bay Area")
// or just before it ("… Agile Transformation &" + "Coaching · AT&T"). Neither
// half is prose: the first ends mid-phrase with no sentence punctuation and the
// pair reads as one header. A bare date line is never the second half.
const HEADER_OPEN_END_RE = /(?:[&/,]|\s(?:and|or))$/i
const joinWrappedHeader = (line: string, next: string | undefined): string | null => {
  if (!next || isBullet(line) || isBullet(next)) return null
  const nextDates = extractDates(next)
  if (nextDates.start && !nextDates.rest) return null
  const joined = `${line} ${next}`
  if (/\s·$/.test(line)) return looksLikeDotHeader(joined) ? joined : null
  if (
    HEADER_OPEN_END_RE.test(line) &&
    !/\s·\s/.test(line) &&
    !/^[a-z]/.test(line) &&
    line.split(/\s+/).length <= 14 &&
    !extractDates(line).start &&
    looksLikeDotHeader(next) &&
    looksLikeDotHeader(joined)
  )
    return joined
  return null
}
// "Series B fintech, ~200 people, B2B payments" — the one-line company
// description the product prints (PDF / DOCX / TXT / MD) right under a
// complete entry header, before the bullets. It is a noun phrase with several
// ordinary lowercase words — not a "Role · Company" / "Role at Company"
// header (whose lowercase words are only binders), not a sentence (no
// terminal punctuation), not a bullet (does not open with an action verb), and
// the line after it is a marked bullet, a dated header, a heading or the end
// of the text — never another marker-less prose line, which is how a
// marker-less bullet list starts.
const BINDER_WORD_RE = /^(?:at|of|the|and|or|for|de|du|da|del|la|le|von|van|&|-|–|—|to|in)$/
const STRONG_VERBS = new Set(ACTION_VERBS.flatMap((g) => g.verbs.map((v) => v.toLowerCase())))
function opensWithActionVerb(line: string) {
  const first = line.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '')
  return STRONG_VERBS.has(first) || /^[a-z]+ed$/.test(first)
}
const isCompanyInfoLine = (line: string, next: string | undefined) => {
  if (line.length > 90 || /[.!?;:]$/.test(line)) return false
  if (/\s[·|]\s|\s[—–]\s|\bat\s+[A-Z]/.test(line)) return false
  if (isBullet(line) || extractDates(line).start || isExpPlaceLine(line)) return false
  if (opensWithActionVerb(line)) return false
  const lower = line
    .split(/\s+/)
    .filter((w) => /^[a-zà-ÿ]/.test(w) && !BINDER_WORD_RE.test(w.replace(/[,()]/g, '')))
  if (lower.length < 2) return false
  return (
    next === undefined ||
    isBullet(next) ||
    !!extractDates(next).start ||
    !!matchHeading(next) ||
    !!matchCustomHeading(next)
  )
}
// "email | phone | City, ST | linkedin" — the header's contact row
const isContactRow = (line: string) =>
  EMAIL_RE.test(line) || PHONE_RE.test(line) || LINKEDIN_RE.test(line) || URL_RE.test(line)
// the short tail of a headline wrapped by a renderer ("Manager at Apple, IBM & more...")
const isTitleWrap = (line: string) =>
  line.length > 0 &&
  line.length <= 60 &&
  !isBullet(line) &&
  !isContactRow(line) &&
  !matchHeading(line) &&
  !/[.!?]$/.test(line.replace(/(?:\.{3}|…)$/, ''))
const appendDetails = (edu: EducationItem, extra: string) => {
  edu.details = [edu.details, extra].filter(Boolean).join('; ')
}
// "… from a low socio-economic" + "background)": the wrapped rest of the line
// above goes back onto the field that line filled.
const continueEduLine = (edu: EducationItem, prev: string, line: string) => {
  const tail = prev.trim()
  for (const key of ['details', 'degree', 'school'] as const) {
    if (edu[key].endsWith(tail)) {
      edu[key] = joinWrapped(edu[key], line)
      return
    }
  }
  appendDetails(edu, line)
}

/**
 * Pasted resume text can't express the target job or resume settings, so a
 * content-replacing import carries them over from the resume being replaced.
 */
export function keepTargetOnImport(prev: Resume, parsed: Resume): Resume {
  return {
    ...parsed,
    targetRole: prev.targetRole,
    jobDescription: prev.jobDescription,
    experienceLevel: prev.experienceLevel,
    targetCompany: prev.targetCompany,
    ignoredKeywords: prev.ignoredKeywords,
    language: prev.language,
  }
}

/**
 * Template, colours, paper and typography live in the editor, not in the
 * file, so a content-replacing import keeps the replaced resume's design.
 */
export function keepDesignOnImport(prev: Resume, parsed: Resume): Resume {
  return {
    ...parsed,
    templateId: prev.templateId,
    accentColor: prev.accentColor,
    pageSize: prev.pageSize,
    fontScale: prev.fontScale,
    lineSpacing: prev.lineSpacing,
    fontFamily: prev.fontFamily,
    sectionSpacing: prev.sectionSpacing,
    pageMargins: prev.pageMargins,
    sectionDivider: prev.sectionDivider,
    bulletIndent: prev.bulletIndent,
    contactIcons: prev.contactIcons,
    groupByCompany: prev.groupByCompany,
    textColor: prev.textColor,
    sectionHeadings: prev.sectionHeadings,
    autoSortByDate: prev.autoSortByDate,
  }
}

export type ParseOptions = {
  /** The reader's own section headings (Builder renames), so its export reads back into the same sections */
  sectionHeadings?: Partial<Record<string, string>>
}

export function parseResumeText(input: string, options: ParseOptions = {}): Resume {
  const previous = readerHeadings
  const previousMarked = markedHeadings
  readerHeadings = options.sectionHeadings ? readerHeadingMap(options.sectionHeadings) : null
  const marked = markdownSectionHeadings(input)
  markedHeadings = marked.length ? new Set(marked) : null
  try {
    return parseResumeTextInner(input)
  } finally {
    readerHeadings = previous
    markedHeadings = previousMarked
  }
}

function parseResumeTextInner(input: string): Resume {
  // A LinkedIn export whose headings are in a language the LinkedIn parser
  // does not read: the header still ends at a section label, never at a
  // one-word headline, so the generic parser must not take that label as
  // the title.
  const linkedInLayout = looksLikeLinkedInExport(input)
  if (linkedInLayout) {
    const linkedIn = parseLinkedInText(input)
    if (linkedIn) return linkedIn
  }
  const raw = plainResumeText(input)
  const resume = emptyResume()
  resume.experience = []
  resume.education = []

  const lines = raw.split(/\r?\n/).map((l) => l.trim())
  const nonEmpty = lines.filter(Boolean)
  const text = raw

  // A narrow column wraps "kenslinkedin2@kennethadams." over "com"
  const email =
    text.match(EMAIL_RE)?.[0] ??
    text.match(/([^\s@|,;]+@[^\s@|,;]+\.)[ \t]*\r?\n\s*([a-z]{2,6})(?=\s|$)/i)?.slice(1).join('') ??
    ''
  // "ronstr8 (LinkedIn)" — a profile named by its handle (JSON Resume themes)
  const handle = text.match(/^([A-Za-z0-9][A-Za-z0-9._-]{2,})\s+\(LinkedIn\)$/im)?.[1]
  const linkedinUrl = text.match(LINKEDIN_RE)?.[0] ?? ''
  // A narrow column wraps "www.linkedin.com/in/" over "handle (LinkedIn)"
  const linkedin =
    linkedinUrl && !/linkedin\.com\/in\/?$/i.test(linkedinUrl)
      ? linkedinUrl
      : handle
        ? `linkedin.com/in/${handle}`
        : linkedinUrl
  const phone = findPhone(text)
  resume.contact.email = email
  resume.contact.phone = phone
  resume.contact.linkedin = linkedin
  // Header URL that is not LinkedIn (GitHub / portfolio) → website. The
  // header runs to the first section heading (an unheaded summary can push
  // the contact block down), capped at 20 lines.
  const firstHeading = nonEmpty.findIndex((l, i) => i > 0 && (!!matchHeading(l) || !!matchGutterLabel(l)))
  const headerLines = Math.max(6, Math.min(20, firstHeading < 0 ? 6 : firstHeading))
  const headerText = nonEmpty
    .slice(0, headerLines)
    .join('\n')
    .replace(new RegExp(EMAIL_RE.source, 'gi'), ' ')
  resume.contact.website =
    headerText.match(GITHUB_RE)?.[0] ??
    [...headerText.matchAll(new RegExp(URL_RE.source, 'gi'))]
      .map((m) => m[0])
      .find(
        (u) =>
          !LINKEDIN_RE.test(u) &&
          (/^(https?:\/\/|www\.)/i.test(u) || /\.(com|dev|io|me|net|org|co|ai|design|xyz)(\/|$)/i.test(u))
      ) ??
    ''

  // A header line that is nothing but a place — "London", "United Kingdom",
  // "London UK", "Location: London", "Based in Berlin", "Remote" — is the
  // location, never the name or the title. Fail-closed on the place
  // vocabulary: "Engineer" / "Springfield" are left to the title rule.
  const headerPlace = (line: string): string => {
    const body = (line.match(HEADER_PLACE_LABEL_RE)?.[1] ?? line).trim()
    if (isExpPlaceLine(body) || REGION_LINE_RE.test(body)) return body
    if (/^remote$/i.test(body)) return 'Remote'
    if (!PLACE_RE.test(body) || body.includes(',')) return ''
    if (isKnownPlace(body)) return body
    const words = body.split(/\s+/)
    return words.length >= 2 &&
      isKnownPlace(words.slice(0, -1).join(' ')) &&
      isKnownPlace(words[words.length - 1])
      ? body
      : ''
  }

  // Name: first short non-empty line without contact info or a heading,
  // above the first line of body
  let nameLine = ''
  for (const [n, line] of nonEmpty.slice(0, 5).entries()) {
    // "Name — Title" header lines carry the professional title too; the
    // title may run long (a LinkedIn headline), the name never does
    const dash = line.split(/\s+[—–]\s+/)
    let parts = dash
    let named = dash.length > 1 && NAME_HEAD_RE.test(dash[0])
    if (!named && startsBody(line, nonEmpty[n + 1] ?? '')) break
    // "Name | Title", "Name | e-mail | phone", "Name · City, ST": one header
    // row bound by | or · that opens with the name. An entry header
    // ("Role · Company" over its dates) has already ended the scan above.
    if (!named) {
      const row = line.split(/\s+[|·•]\s+/)
      if (row.length > 1 && NAME_HEAD_RE.test(row[0]) && !isExpPlaceLine(row[0])) {
        parts = row
        named = true
      }
    }
    // "Jane Doe, Senior Engineer": a name, then a job title. "Jane Doe, PhD"
    // (no title noun), "Director, Engineering" (title noun on the left) and
    // "City, ST" keep their comma.
    if (!named) {
      const comma = line.split(/,\s+/)
      if (
        comma.length === 2 &&
        NAME_HEAD_RE.test(comma[0]) &&
        !JOB_TITLE_NOUN_RE.test(comma[0]) &&
        !isExpPlaceLine(line) &&
        JOB_TITLE_NOUN_RE.test(comma[1]) &&
        !/\d/.test(comma[1]) &&
        comma[1].split(/\s+/).length <= 6
      ) {
        parts = comma
        named = true
      }
    }
    const head = named ? parts[0] : line
    if (matchHeading(line) || matchGutterLabel(line)) break
    if (!named && (isExpPlaceLine(line) || headerPlace(line) || DOC_TITLE_RE.test(line))) continue
    if (
      head.length <= 60 &&
      !EMAIL_RE.test(head) &&
      !PHONE_RE.test(head) &&
      !matchHeading(line) &&
      head.split(/\s+/).length <= 6
    ) {
      nameLine = line
      resume.contact.fullName = humanNameCase(head.trim())
      const title = parts
        .slice(1)
        .filter((p) => !EMAIL_RE.test(p) && !PHONE_RE.test(p) && !isUrlSegment(p) && !isExpPlaceLine(p))
      if (title.length) resume.contact.title = title.join(parts === dash ? ' — ' : ' · ').trim()
      break
    }
  }

  // Location: a "City, ST" segment on one of the header contact lines
  // (comma optional when the trailing token is a real USPS state code). A
  // row without separators (icon-led contact rows) is read with its e-mail /
  // phone / URL tokens removed.
  const contactPlace = (seg: string) => {
    if (REGION_LINE_RE.test(seg)) return seg
    const m = seg.match(/^([A-Za-z .'-]+?)(?:,\s*|\s+)([A-Z]{2})$/)
    return m && (seg.includes(',') || US_STATES.has(m[2])) ? seg : ''
  }
  const contactTokens = new RegExp(
    `${EMAIL_RE.source}|${LINKEDIN_RE.source}|${URL_RE.source}|${PHONE_RE.source}`,
    'gi'
  )
  // "jane@example.com | +44 20 7946 0000 | London": a bare city or country is
  // the location only on a row that also carries an e-mail / phone / URL, and
  // only when the place vocabulary knows it — never a title word.
  const bareKnownPlace = (seg: string, line: string) =>
    PLACE_RE.test(seg) &&
    !seg.includes(',') &&
    seg.toLowerCase() !== resume.contact.fullName.toLowerCase() &&
    isKnownPlace(seg) &&
    new RegExp(contactTokens.source, 'i').test(line)
      ? seg
      : ''
  for (const line of nonEmpty.slice(0, 5)) {
    if (matchHeading(line)) break
    for (const raw of line.split(/\s*[|•·]\s*/)) {
      const seg = raw.trim()
      const place =
        contactPlace(seg) ||
        contactPlace(seg.replace(contactTokens, ' ').replace(/\s+/g, ' ').trim()) ||
        bareKnownPlace(seg, line)
      if (place) {
        resume.contact.location = place
        break
      }
    }
    if (resume.contact.location) break
  }
  // "Williamsville, United States" / "London" / "Location: London" on its own
  // header line — above the first section heading, so a "React, TypeScript"
  // skills row is never the location
  if (!resume.contact.location) {
    const place = nonEmpty
      .slice(0, firstHeading < 0 ? headerLines : Math.min(headerLines, firstHeading))
      .filter((l) => l !== nameLine && !matchHeading(l))
      .map((l) => (isExpPlaceLine(l) ? l : headerPlace(l)))
      .find(Boolean)
    if (place) resume.contact.location = place
  }

  let section: SectionName | 'custom' | null = null
  let currentExp: ExperienceItem | null = null
  let currentEdu: EducationItem | null = null
  let currentCustom: CustomSection | null = null
  const summaryLines: string[] = []
  const skillLines: string[] = []
  const certLines: string[] = []
  let headerProse = false
  // an unknown section label has opened the profile paragraph
  let underLabel = false
  let expHeaderRaw = ''
  // Each custom section's lines as the document had them (bullet marks kept),
  // so a section we printed ourselves can be read back into its fields.
  const customRaw = new WeakMap<CustomSection, string[]>()
  // Section keys in the order the document's headings introduce them
  const headingOrder: string[] = []
  const noteSection = (key: string) => {
    if (!headingOrder.includes(key)) headingOrder.push(key)
  }
  const openCustom = (title: string, first?: string): CustomSection => {
    const s: CustomSection = {
      id: newId(),
      title: headingCase(title),
      bullets: first === undefined ? [] : [stripBullet(first)],
    }
    customRaw.set(s, first === undefined ? [] : [first])
    resume.customSections.push(s)
    noteSection(`custom:${s.id}`)
    return s
  }
  const pushCustom = (s: CustomSection, line: string) => {
    s.bullets.push(stripBullet(line))
    customRaw.get(s)?.push(line)
  }
  const joinCustom = (s: CustomSection, line: string) => {
    const last = s.bullets.length - 1
    s.bullets[last] = joinWrapped(s.bullets[last], line)
    const raw = customRaw.get(s)
    if (raw) raw[last] = joinWrapped(raw[last], line)
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (!line) continue
    const gutter = matchGutterLabel(line)
    if (gutter && 'custom' in gutter) {
      section = 'custom'
      currentExp = null
      currentEdu = null
      currentCustom = openCustom(gutter.custom, gutter.rest)
      continue
    }
    const inline = gutter ?? matchInlineHeading(line)
    const heading = inline?.heading ?? matchHeading(line)
    if (heading) {
      section = heading
      noteSection(heading)
      currentExp = null
      currentEdu = null
      currentCustom = null
      if (!inline) continue
      line = inline.rest
    }
    if (line === nameLine) continue
    if (section === null && isHeadlessEntryHeader(line, lines[nextNonEmptyIndex(lines, i)] ?? '')) {
      // A pasted experience block with no heading: "Role · Company" over its
      // dates is the first entry, not the professional title
      section = 'experience'
      noteSection('experience')
    }
    if (section !== null) {
      // "Languages: English, German" under Skills stays a categorised skill line
      // and "Honors: Dean's List" under a school stays its detail; anywhere else
      // the line opens the section with the list as its first item.
      const inlineCustom =
        section === 'skills' || (section === 'education' && isEduDetailLine(line))
          ? null
          : matchInlineCustomHeading(line)
      if (inlineCustom) {
        section = 'custom'
        currentExp = null
        currentEdu = null
        currentCustom = openCustom(inlineCustom.title, inlineCustom.rest)
        continue
      }
      const customTitle = matchCustomHeading(line)
      // "Languages" above "Python, TypeScript, SQL" inside Skills is a grid
      // label (folded by joinSkillLines), not a Languages section.
      const gridLabel =
        section === 'skills' &&
        isGridLabel(line) &&
        !!lines[i + 1] &&
        lines[i + 1].includes(',') &&
        !matchHeading(lines[i + 1])
      if (customTitle && !gridLabel) {
        section = 'custom'
        currentExp = null
        currentEdu = null
        currentCustom = openCustom(customTitle)
        continue
      }
    }

    switch (section) {
      case 'summary':
        summaryLines.push(line)
        break
      case 'skills':
        skillLines.push(line)
        break
      case 'certifications':
        certLines.push(line)
        break
      case 'custom':
        if (!currentCustom) break
        if (
          continuesPrevious(currentCustom.bullets[currentCustom.bullets.length - 1], line) &&
          !isReferenceDetail(line)
        )
          joinCustom(currentCustom, line)
        else pushCustom(currentCustom, line)
        break
      case 'experience': {
        const wrappedHeader = joinWrappedHeader(line, lines[nextNonEmptyIndex(lines, i)])
        if (wrappedHeader) {
          line = wrappedHeader
          i = nextNonEmptyIndex(lines, i)
        }
        if (isBullet(line)) {
          if (!currentExp) {
            currentExp = { ...emptyExperience(), id: newId(), bullets: [] }
            resume.experience.push(currentExp)
          }
          currentExp.bullets.push(stripBullet(line))
        } else if (
          currentExp &&
          (continuesPrevious(currentExp.bullets[currentExp.bullets.length - 1], line) ||
            continuesOpenBullet(lines, i, currentExp.bullets[currentExp.bullets.length - 1], line))
        ) {
          currentExp.bullets[currentExp.bullets.length - 1] = joinWrapped(
            currentExp.bullets[currentExp.bullets.length - 1],
            line
          )
        } else {
          const { rest, start, end } = extractDates(line)
          const year = line.trim().match(BARE_YEAR_LINE_RE)
          if (
            year &&
            currentExp &&
            (currentExp.role || currentExp.company) &&
            !currentExp.startDate &&
            currentExp.bullets.length === 0
          ) {
            // a lone year right under the entry header: our own PDF export
            // prints a same-year tenure on the dates line this way
            currentExp.startDate = year[1]
            currentExp.endDate = year[1]
          } else if (!rest && start && currentExp && !currentExp.startDate) {
            // date range on its own line under the entry header
            currentExp.startDate = start
            currentExp.endDate = end
          } else if (year || (!rest && start)) {
            // date range (or lone year) on its own line above the entry header
            // (or after a header this parser could not read): open the entry
            // with its dates and let the next header line name it
            currentExp = {
              ...emptyExperience(),
              id: newId(),
              startDate: year ? year[1] : start,
              endDate: year ? year[1] : end,
              bullets: [],
            }
            resume.experience.push(currentExp)
          } else if (
            currentExp &&
            !currentExp.role &&
            !currentExp.company &&
            currentExp.bullets.length === 0 &&
            !start &&
            (looksLikeDotHeader(line) || !looksLikeBodyLine(line))
          ) {
            // header line under a bare date line
            expHeaderRaw = line
            Object.assign(currentExp, splitRoleCompany(line))
          } else if (
            currentExp &&
            !currentExp.startDate &&
            currentExp.bullets.length === 0 &&
            currentExp.company &&
            start &&
            PLACE_RE.test(rest)
          ) {
            // "Mumbai, India | Dec 2021 – Present" under a "Role · Company" header
            currentExp.location = currentExp.location || rest
            currentExp.startDate = start
            currentExp.endDate = end
          } else if (
            currentExp &&
            !currentExp.startDate &&
            currentExp.bullets.length === 0 &&
            /,$/.test(currentExp.company) &&
            rest.length <= 60 &&
            !looksLikeBodyLine(rest)
          ) {
            // header wrapped after the company's trailing comma: the location
            // (and possibly the dates) sit on the next visual line
            currentExp.company = currentExp.company.replace(/,$/, '').trim()
            currentExp.location = [currentExp.location, rest].filter(Boolean).join(', ')
            if (start) {
              currentExp.startDate = start
              currentExp.endDate = end
            }
          } else if (
            currentExp &&
            currentExp.company &&
            currentExp.startDate &&
            !currentExp.location &&
            currentExp.bullets.length === 0 &&
            !start &&
            isExpPlaceLine(line)
          ) {
            // "Buffalo, NY" on its own line under role / company / dates
            currentExp.location = line
          } else if (
            currentExp &&
            currentExp.company &&
            !currentExp.startDate &&
            currentExp.bullets.length === 0 &&
            !start &&
            HEADER_TAIL_RE.test(line) &&
            splitRoleCompany(`${expHeaderRaw} ${line}`).location
          ) {
            // "… · Ivanti, San Francisco Bay" + "Area": a header wrapped inside
            // its location (our own PDF export wraps long headers this way)
            expHeaderRaw = `${expHeaderRaw} ${line}`
            Object.assign(currentExp, splitRoleCompany(expHeaderRaw))
          } else if (
            currentExp &&
            !currentExp.company &&
            currentExp.bullets.length === 0 &&
            !start &&
            rest.length <= 60 &&
            !looksLikeBodyLine(line)
          ) {
            // second header line (e.g. company on its own line)
            Object.assign(
              currentExp,
              orientRoleCompany({ role: currentExp.role.replace(/,$/, '').trim(), company: rest })
            )
          } else if (
            currentExp &&
            currentExp.role &&
            currentExp.company &&
            currentExp.startDate &&
            !currentExp.companyInfo &&
            currentExp.bullets.length === 0 &&
            isCompanyInfoLine(line, lines[nextNonEmptyIndex(lines, i)])
          ) {
            // one-line company description under a complete entry header
            currentExp.companyInfo = line
          } else if (
            currentExp &&
            !start &&
            looksLikeBodyLine(line) &&
            !looksLikeWrappedHeader(line) &&
            !looksLikeDotHeader(line)
          ) {
            // marker-less description line under the current entry
            currentExp.bullets.push(line)
          } else {
            expHeaderRaw = rest || line
            const { role, company, location } = splitRoleCompany(expHeaderRaw)
            currentExp = {
              ...emptyExperience(),
              id: newId(),
              role,
              company,
              location,
              startDate: start,
              endDate: end,
              bullets: [],
            }
            resume.experience.push(currentExp)
          }
        }
        break
      }
      case 'education': {
        const { rest, start, end } = extractDates(line)
        const year = line.trim().match(BARE_YEAR_LINE_RE)
        if (isBullet(line) && currentEdu) {
          currentEdu.details = [currentEdu.details, stripBullet(line)]
            .filter(Boolean)
            .join('; ')
        } else if (
          year &&
          currentEdu &&
          (currentEdu.degree || currentEdu.school) &&
          !currentEdu.startDate &&
          !currentEdu.endDate
        ) {
          // a lone year right under the entry: the graduation year on its own
          // dates line (our own PDF / DOCX exports print an end-only date this way)
          currentEdu.startDate = year[1]
          currentEdu.endDate = year[1]
        } else if (!rest && start && currentEdu && !currentEdu.startDate) {
          currentEdu.startDate = start
          currentEdu.endDate = end
        } else if (year || (!rest && start)) {
          // date line on its own above the entry it dates (or after an entry that
          // already has its dates): open the entry with the dates and let the
          // next line name it
          currentEdu = {
            ...emptyEducation(),
            id: newId(),
            startDate: year ? year[1] : start,
            endDate: year ? year[1] : end,
          }
          resume.education.push(currentEdu)
        } else if (
          currentEdu &&
          !currentEdu.degree &&
          !currentEdu.school &&
          (currentEdu.startDate || currentEdu.details) &&
          !start &&
          !isEduPlaceLine(line) &&
          !isEduDetailLine(line) &&
          (looksLikeDotHeader(line) || !looksLikeBodyLine(line))
        ) {
          // the entry line under its own date (or detail) line
          const named = newEducationEntry(line, currentEdu.startDate, currentEdu.endDate)
          Object.assign(currentEdu, named, {
            id: currentEdu.id,
            details: [named.details, currentEdu.details].filter(Boolean).join('; '),
          })
        } else if (
          start &&
          currentEdu &&
          !currentEdu.startDate &&
          PLACE_RE.test(rest.split('|')[0].trim())
        ) {
          // "Jaipur, India | 2014 – 2018 | CGPA: 8.03 / 10" under the degree line
          const [place, ...more] = rest.split('|').map((s) => s.trim()).filter(Boolean)
          currentEdu.location = currentEdu.location || place
          currentEdu.startDate = start
          currentEdu.endDate = end
          if (more.length) currentEdu.details = [currentEdu.details, ...more].filter(Boolean).join('; ')
        } else if (
          currentEdu &&
          isDegreeLine(rest || line) &&
          (!currentEdu.degree ||
            (!currentEdu.school &&
              !EDU_DEGREE_RE.test(currentEdu.degree) &&
              !SCHOOL_RE.test(rest || line)))
        ) {
          // degree line under a school line ("Cedarville University" / "BA Economics; GPA: 3.9")
          const { degree, school, location: eduLoc, details } = splitDegreeLine(rest || line)
          if (!currentEdu.school) currentEdu.school = currentEdu.degree
          currentEdu.degree = degree
          if (school) {
            if (!currentEdu.school) currentEdu.school = school
            else appendDetails(currentEdu, school)
          }
          if (eduLoc) currentEdu.location = currentEdu.location || eduLoc
          if (details) appendDetails(currentEdu, details)
          if (start && !currentEdu.startDate) {
            currentEdu.startDate = start
            currentEdu.endDate = end
          }
        } else if (
          currentEdu &&
          !currentEdu.school &&
          EDU_DEGREE_RE.test(currentEdu.degree) &&
          SCHOOL_RE.test(rest || line) &&
          !EDU_DEGREE_RE.test(rest || line) &&
          !EDU_DETAIL_RE.test(line)
        ) {
          // school line under a degree line ("Bachelor of Science" / "University of Florida | Gainesville, FL")
          const { role, company, location: eduLoc } = splitRoleCompanyRaw(rest || line)
          currentEdu.school = role
          const tail = eduLoc || company
          if (tail) {
            if (isEduPlaceLine(tail)) currentEdu.location = currentEdu.location || tail
            else appendDetails(currentEdu, tail)
          }
          if (start && !currentEdu.startDate) {
            currentEdu.startDate = start
            currentEdu.endDate = end
          }
        } else if (!start && currentEdu && !currentEdu.location && isEduPlaceLine(line)) {
          currentEdu.location = line
        } else if (currentEdu && EDU_GRAD_RE.test(line)) {
          // "Expected May 2026" / "Graduation: May 2026" — the end date
          const when = line.replace(EDU_GRAD_RE, '').replace(/^[\s:–—-]*(?:graduation\b)?[\s:–—-]*/i, '').trim()
          if (/^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}$/i.test(when) && !currentEdu.endDate)
            currentEdu.endDate = when
          else appendDetails(currentEdu, line)
        } else if (
          !start &&
          currentEdu &&
          isEduDetailLine(line) &&
          !(currentEdu.degree && currentEdu.school && isDegreeLine(splitDegreeLine(line).degree))
        ) {
          appendDetails(currentEdu, line)
        } else if (
          !currentEdu &&
          !start &&
          isEduDetailLine(line) &&
          !isDegreeLine(line) &&
          !SCHOOL_RE.test(line) &&
          !looksLikeDotHeader(line)
        ) {
          // "First Class Honours. Final project: …" as the first line of the
          // section — a detail with no degree or school to hang on
          currentEdu = { ...emptyEducation(), id: newId() }
          appendDetails(currentEdu, line)
          resume.education.push(currentEdu)
        } else if (
          currentEdu &&
          !start &&
          extractDates(prevNonEmpty(lines, i)).rest &&
          continuesPrevious(prevNonEmpty(lines, i), line)
        ) {
          continueEduLine(currentEdu, prevNonEmpty(lines, i), line)
        } else {
          const entry = newEducationEntry(rest || line, start, end)
          currentEdu = entry
          resume.education.push(entry)
        }
        break
      }
      case 'projects': {
        const last = resume.projects[resume.projects.length - 1]
        const dates = extractDates(line)
        const descLines = last ? last.description.split('\n') : []
        const prevLine = descLines[descLines.length - 1] ?? ''
        if (dates.start && !dates.rest) {
          // date range on its own line under the project name
          if (last && !last.startDate) {
            last.startDate = dates.start
            last.endDate = dates.end
          }
        } else if (
          last &&
          prevLine &&
          !isBullet(line) &&
          !isTagList(line) &&
          !/\s·\s/.test(line) &&
          (continuesPrevious(prevLine, line) ||
            (!/[.!?:;]$/.test(prevLine) && prevLine.length >= 60 && looksLikeBodyLine(line)))
        ) {
          // the wrapped rest of the previous description line
          descLines[descLines.length - 1] = joinWrapped(prevLine, line)
          last.description = descLines.join('\n')
        } else if (
          last &&
          (isBullet(line) ||
            looksLikeBodyLine(line) ||
            (last.description && isTagList(line)) ||
            (!last.description && isStackRow(line)))
        ) {
          // one description line per source line; a described project's row of
          // tags ("Kubernetes, Helm, Rust") and the stack row right under a
          // project name ("Next.js · TypeScript · Vercel") stay with it
          last.description = [last.description, stripBullet(line)].filter(Boolean).join('\n')
        } else {
          const url = line.match(URL_RE)?.[0] ?? ''
          const link = CODE_NAME_RE.test(url) ? '' : url
          // "Name · Org (link) (dates)" — our own TXT/MD export shape
          const head = stripDateRest((dates.start ? dates.rest : line).replace(link, ''))
          const dot = head.split(/\s+·\s+/)
          const [name, org] = dot.length === 2 ? dot : [head, '']
          resume.projects.push({
            id: newId(),
            name: name.replace(/[—–|(),]\s*$/, '').trim() || line,
            link,
            description: '',
            ...(org ? { org: org.trim() } : {}),
            ...(dates.start ? { startDate: dates.start, endDate: dates.end } : {}),
          })
        }
        break
      }
      default: {
        // Before any heading: professional title often sits under the name
        // (never a contact row — "City, ST | phone | email" is not a title)
        const contactish = EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line) || /[|•]/.test(line)
        if (DOC_TITLE_RE.test(line)) break
        if (!contactish && (isExpPlaceLine(line) || headerPlace(line) || HEADER_PLACE_LABEL_RE.test(line))) {
          // "Austin, TX" / "London" / "Location: …" on its own header line is
          // the location (read above), not the title. Under the name it opens
          // the header, so prose below it is the summary; after the summary it
          // starts the contact block.
          headerProse = summaryLines.length === 0
        } else if (
          !resume.contact.title &&
          summaryLines.length === 0 &&
          line.length <= 60 &&
          !contactish &&
          !underLabel &&
          !(linkedInLayout && isUnknownSectionLabel(line, lines[nextNonEmptyIndex(lines, i)] ?? ''))
        ) {
          // the title sits above the summary, never inside it
          resume.contact.title = line
          headerProse = true
        } else if (
          !resume.contact.title &&
          !contactish &&
          nameLine &&
          prevNonEmpty(lines, i) === nameLine &&
          isContactRow(lines[nextNonEmptyIndex(lines, i)] ?? '')
        ) {
          // a long headline between the name and the contact row
          resume.contact.title = line
        } else if (
          !resume.contact.title &&
          !contactish &&
          nameLine &&
          prevNonEmpty(lines, i) === nameLine &&
          line.length > 60 &&
          isTitleWrap(lines[nextNonEmptyIndex(lines, i)] ?? '') &&
          isContactRow(lines[nextNonEmptyIndex(lines, nextNonEmptyIndex(lines, i))] ?? '')
        ) {
          // the same headline wrapped over two lines (our own PDF export)
          const j = nextNonEmptyIndex(lines, i)
          resume.contact.title = `${line} ${lines[j]}`
          lines[j] = ''
        } else if (
          headerProse &&
          !contactish &&
          (looksLikeBodyLine(line) ||
            (summaryLines.length > 0 && continuesPrevious(summaryLines[summaryLines.length - 1], line)) ||
            (!isBullet(line) &&
              line.length >= 40 &&
              !bindsEntryHeader(line) &&
              continuesPrevious(line, lines[nextNonEmptyIndex(lines, i)] ?? '')))
        ) {
          // the paragraph directly under the title, with no heading, is the
          // summary; a narrow column wraps a sentence before it can end, so a
          // long line the next line continues belongs to it too
          summaryLines.push(line)
        } else if (
          headerProse &&
          summaryLines.length === 0 &&
          isUnknownSectionLabel(line, lines[nextNonEmptyIndex(lines, i)] ?? '')
        ) {
          // "Zusammenfassung" / "Über mich": a heading the vocabulary does not
          // know, sitting over the profile paragraph — the paragraph is still
          // the summary
          underLabel = true
        } else {
          headerProse = false
        }
      }
    }
  }

  resume.summary = joinWrappedLines(summaryLines)
  resume.skills = joinSkillLines(skillLines)
  const certItems = liftCertifications(certLines)
  if (certItems) resume.certItems = certItems
  else resume.certifications = certLines.join('; ')
  liftOwnSections(resume, customRaw, headingOrder)

  if (resume.experience.length === 0) resume.experience = [emptyExperience()]
  if (resume.education.length === 0) resume.education = [emptyEducation()]
  resume.sectionOrder = orderedSectionKeys({ ...resume, sectionOrder: headingOrder })
  return resume
}

// ---------------------------------------------------------------------------
// Our own structured sections read back into their fields.
//
// The Builder's Involvement / Coursework / Awards / Publications / References /
// Military service / Certifications entries print as one header line per entry
// ("Role  ·  Organization, Location (dates)", "Name — Issuer (date)"), the date
// either in the header's parentheses (TXT / MD / DOCX) or on its own line under
// it (PDF), then the description as bullets (a plain line for a certification
// and a reference's contact row). Only a section whose heading we printed and
// whose every entry carries that signature — a " · " / " — " binder or a date —
// is lifted; anything else stays the custom section / certification text it
// always was, so a hand-written "Publications" list is untouched.
// ---------------------------------------------------------------------------

type OwnEntry = { header: string; start: string; end: string; kind: string; bullets: string[]; plain: string[] }

const BARE_DATE_LINE_RE = new RegExp(`^(?:${DATE_RANGE_RE.source}|${BARE_MONTH_RE.source.slice(1, -1)}|${BARE_YEAR_LINE_RE.source.slice(1, -1)})$`, 'i')
const OWN_BINDER_RE = /\S\s(?:·|—)\s\S/
// "(Talk)" / "(Book chapter)" left at the end of a publication header once the date is gone
const TRAILING_KIND_RE = /\s\(([^()]{1,40})\)$/
const REFERENCE_KIND_RE = /^(personal|professional) reference$/i
// "dana@northstar.example · +1 512 555 0100 · Professional reference" — a
// reference's contact row, which opens in lowercase like a wrapped line would.
const isReferenceDetail = (line: string) =>
  line.split(/\s·\s/).every((p) => EMAIL_RE.test(p) || PHONE_RE.test(p) || REFERENCE_KIND_RE.test(p.trim()))

// The line that opens an education entry: "Degree · School", a degree line
// ("Bachelor of Arts in Economics; GPA: 3.7" — the school follows) or a school
// line ("St Mary's High School, Durham" — the degree follows)
// "B.S. Computer Science - State University": a spaced ASCII hyphen joins a
// degree and a school when exactly one side names a school (the date range's
// hyphen is gone by now; "BSc Computer Science - 2:1" keeps its grade).
const eduHeaderSeparators = (header: string) => {
  const parts = header.split(/\s+-\s+/)
  return parts.length === 2 && SCHOOL_RE.test(parts[0]) !== SCHOOL_RE.test(parts[1])
    ? parts.join(' — ')
    : header
}

function newEducationEntry(header: string, start: string, end: string): EducationItem {
  const { role, company, location } = splitRoleCompanyRaw(eduHeaderSeparators(header))
  const entry: EducationItem = {
    ...emptyEducation(),
    id: newId(),
    degree: role,
    school: company,
    location,
    startDate: start,
    endDate: end,
  }
  if (!company && isDegreeLine(role)) {
    const { degree, details } = splitDegreeLine(role)
    entry.degree = degree
    entry.details = details
  } else if (SCHOOL_RE.test(role) && !EDU_DEGREE_RE.test(role)) {
    entry.school = role
    entry.degree = ''
    if (company) {
      if (EDU_DEGREE_RE.test(company)) entry.degree = company
      else if (isEduPlaceLine(company)) entry.location = entry.location || company
      else appendDetails(entry, company)
    }
  }
  return entry
}

function bareDate(line: string): { start: string; end: string } | null {
  if (!BARE_DATE_LINE_RE.test(line.trim())) return null
  const d = extractDates(line.replace(/^\(|\)$/g, ''))
  if (d.start) return { start: d.start, end: d.end }
  const y = line.match(BARE_YEAR_LINE_RE)
  return y ? { start: y[1], end: y[1] } : null
}

/**
 * Groups a section's raw lines into entries: a marker-less line opens one (its
 * dates taken from the header's parentheses or the bare date line under it),
 * bullets are its description. `plainIsDetail` says when a marker-less line
 * under an open entry is that entry's own text rather than the next header.
 */
function groupOwnEntries(
  raw: string[],
  plainIsDetail: (line: string, entry: OwnEntry) => boolean,
  opts: { kind?: boolean } = {}
): OwnEntry[] {
  const entries: OwnEntry[] = []
  let cur: OwnEntry | null = null
  for (const line of raw) {
    if (isBullet(line)) {
      if (!cur) return []
      cur.bullets.push(stripBullet(line))
      continue
    }
    const date = bareDate(line)
    if (date && cur && !cur.start && cur.bullets.length === 0 && cur.plain.length === 0) {
      cur.start = date.start
      cur.end = date.end
      continue
    }
    if (cur && !date && plainIsDetail(line, cur)) {
      cur.plain.push(line.trim())
      continue
    }
    if (date) return []
    const d = extractDates(line)
    cur = { header: d.rest.trim(), start: d.start, end: d.end, kind: '', bullets: [], plain: [] }
    const k = opts.kind ? cur.header.match(TRAILING_KIND_RE) : null
    if (k && !bareDate(k[1])) {
      cur.kind = k[1].trim()
      cur.header = cur.header.slice(0, k.index).trim()
    }
    if (!cur.header) return []
    entries.push(cur)
  }
  return entries
}

const hasOwnSignature = (e: OwnEntry) => !!e.start || OWN_BINDER_RE.test(e.header)
const splitBinder = (header: string, binder: RegExp): [string, string] => {
  const m = binder.exec(header)
  if (!m || m.index === 0) return [header.trim(), '']
  return [header.slice(0, m.index).trim(), header.slice(m.index + m[0].length).trim()]
}
const singleDate = (e: OwnEntry) => (e.start && e.end && e.start !== e.end ? `${e.start} – ${e.end}` : e.start)
const dotHeader = (header: string) => {
  const [left, rest] = splitBinder(header, /\s·\s/.test(header) ? /\s·\s/ : /\s—\s/)
  const comma = rest.indexOf(', ')
  return comma > 0
    ? { left, right: rest.slice(0, comma).trim(), location: rest.slice(comma + 2).trim() }
    : { left, right: rest, location: '' }
}

function liftCertifications(raw: string[]): CertificationItem[] | null {
  if (raw.length === 0) return null
  const entries = groupOwnEntries(raw, (line, e) => !OWN_BINDER_RE.test(line) && e.bullets.length === 0 && !extractDates(line).start)
  if (entries.length === 0 || !entries.every((e) => OWN_BINDER_RE.test(e.header) || e.start)) return null
  return entries.map((e) => {
    const [name, issuer] = splitBinder(e.header, /\s—\s/)
    return {
      ...emptyCertification(),
      name,
      issuer,
      date: singleDate(e),
      description: [...e.plain, ...e.bullets].join('\n'),
    }
  })
}

function liftOwnSections(resume: Resume, customRaw: WeakMap<CustomSection, string[]>, headingOrder: string[]): void {
  const keep: CustomSection[] = []
  for (const s of resume.customSections) {
    const own = ownHeading(s.title)
    const raw = customRaw.get(s)
    const key = own && 'custom' in own ? own.key : ''
    if (!key || !raw || raw.length === 0 || !liftOwnSection(resume, key, raw)) keep.push(s)
    else {
      const at = headingOrder.indexOf(`custom:${s.id}`)
      if (at !== -1) headingOrder.splice(at, 1, ...(headingOrder.includes(key) ? [] : [key]))
    }
  }
  resume.customSections = keep
}

function liftOwnSection(resume: Resume, key: string, raw: string[]): boolean {
  const plainNever = () => false
  switch (key) {
    case 'involvement':
    case 'military': {
      const entries = groupOwnEntries(raw, plainNever)
      if (entries.length === 0 || !entries.every(hasOwnSignature)) return false
      for (const e of entries) {
        const { left, right, location } = dotHeader(e.header)
        const description = e.bullets.join('\n')
        if (key === 'involvement')
          (resume.involvement ??= []).push({ ...emptyInvolvement(), role: left, organization: right, location, startDate: e.start, endDate: e.end, description })
        else
          (resume.military ??= []).push({ ...emptyMilitaryService(), rank: left, branch: right, location, startDate: e.start, endDate: e.end, description })
      }
      return true
    }
    case 'coursework': {
      const entries = groupOwnEntries(raw, plainNever)
      if (entries.length === 0 || !entries.every(hasOwnSignature)) return false
      for (const e of entries) {
        const { left, right } = dotHeader(e.header)
        const skillLine = e.bullets[0]?.match(/^Skills?:\s+(.+)$/)
        const skill = skillLine ? skillLine[1].split(/\s*·\s*/).join(', ') : ''
        const description = (skillLine ? e.bullets.slice(1) : e.bullets).join('\n')
        ;(resume.coursework ??= []).push({ ...emptyCoursework(), name: left, institution: right, date: singleDate(e), skill, description })
      }
      return true
    }
    case 'awards': {
      const entries = groupOwnEntries(raw, plainNever)
      if (entries.length === 0 || !entries.every(hasOwnSignature)) return false
      for (const e of entries) {
        const [name, organization] = splitBinder(e.header, /\s—\s/)
        ;(resume.awards ??= []).push({ ...emptyAward(), name, organization, date: singleDate(e), description: e.bullets.join('\n') })
      }
      return true
    }
    case 'publications': {
      const entries = groupOwnEntries(raw, plainNever, { kind: true })
      if (entries.length === 0 || !entries.every(hasOwnSignature)) return false
      for (const e of entries) {
        const [title, venue] = splitBinder(e.header, /\s—\s/)
        ;(resume.publications ??= []).push({ ...emptyPublication(), title, venue, kind: e.kind, date: singleDate(e), description: e.bullets.join('\n') })
      }
      return true
    }
    case 'references': {
      const isDetail = isReferenceDetail
      const entries = groupOwnEntries(raw, (line, e) => e.plain.length === 0 && isDetail(line))
      if (entries.length === 0) return false
      for (const e of entries) {
        const detail = [...e.plain, ...e.bullets]
        if (!OWN_BINDER_RE.test(e.header) && detail.length === 0) return false
        if (detail.length > 1 || (detail.length === 1 && !isDetail(detail[0]))) return false
      }
      for (const e of entries) {
        const [name, role] = splitBinder(e.header, /\s—\s/)
        const comma = role.indexOf(', ')
        const parts = (e.plain[0] ?? e.bullets[0] ?? '').split(/\s·\s/).map((p) => p.trim())
        const kindWord = parts.find((p) => REFERENCE_KIND_RE.test(p))?.toLowerCase()
        const kind: ReferenceKind = kindWord?.startsWith('personal') ? 'personal' : kindWord?.startsWith('professional') ? 'professional' : ''
        ;(resume.references ??= []).push({
          ...emptyReference(),
          name,
          title: comma > 0 ? role.slice(0, comma).trim() : role,
          employer: comma > 0 ? role.slice(comma + 2).trim() : '',
          email: parts.find((p) => EMAIL_RE.test(p)) ?? '',
          phone: parts.find((p) => !EMAIL_RE.test(p) && PHONE_RE.test(p)) ?? '',
          kind,
        })
      }
      return true
    }
    case 'agents': {
      const entries = groupOwnEntries(raw, plainNever)
      if (entries.length === 0 || !entries.every((e) => e.start || /^Skills used:\s/.test(e.bullets[0] ?? ''))) return false
      for (const e of entries) {
        const skillLine = e.bullets[0]?.match(/^Skills used:\s+(.+)$/)
        ;(resume.agents ??= []).push({
          ...emptyAgent(),
          name: e.header,
          date: singleDate(e),
          skills: skillLine ? skillLine[1].trim() : '',
          description: (skillLine ? e.bullets.slice(1) : e.bullets).join('\n'),
        })
      }
      return true
    }
    default:
      return false
  }
}

type LiSection = SectionName | 'contact' | 'custom' | null

const LI_HEADINGS: [RegExp, LiSection][] = [
  [/^contact$/i, 'contact'],
  [/^top skills$/i, 'skills'],
  [/^(summary|about)$/i, 'summary'],
  [/^experience$/i, 'experience'],
  [/^education$/i, 'education'],
  [/^skills$/i, 'skills'],
  [/^(certifications?|licenses & certifications)$/i, 'certifications'],
]

/** A standalone tenure line under a company with several roles, e.g. "3 years 2 months". */
const LI_TENURE_RE = /^(?:less than a year|\d+\s+years?(?:\s+\d+\s+months?)?|\d+\s+months?)$/i

const LI_LOCATION_RE = /^[A-Za-zÀ-ÿ .'-]+(?:,\s*[A-Za-zÀ-ÿ .'-]+){1,2}$/
// The line under the dates with no comma: "Italy", "Greater Boston Area"
const LI_PLACE_LINE_RE =
  /^[A-ZÀ-Þ][A-Za-zÀ-ÿ.'-]*(?:\s+[A-ZÀ-Þ][A-Za-zÀ-ÿ.'-]*){0,3}$/
// "… Agile Transformation" + "& Coaching": a role header wrapped over two lines
const isLiHeaderWrap = (above: string, below: string) =>
  /^[&,a-zà-ÿ]/.test(below) || /[&,]$/.test(above)

// The page-1 sidebar (Contact / Top Skills / Languages / Certifications /
// Honors-Awards / Publications) is extracted after the page's main column and
// before the next page carries the main column on; it opens with one of these.
const LI_SIDEBAR_START_RE = /^(contact|top skills)$/i
const LI_MAIN_SECTIONS = new Set<LiSection>([
  'summary',
  'experience',
  'education',
])
// Contact-block site lines: "gionn.net (Blog)", "KennethAdams.com (Portfolio)"
const LI_SITE_RE =
  /^([\w.-]+\.[a-z]{2,}(?:\/\S*)?)\s+\((blog|portfolio|personal|company|other)\)$/i
const LI_PHONE_KIND_RE = /\s*\((mobile|home|work)\)\s*$/i
// Education line tail: "Degree, Field · (2011 - 2015)" / "· (2014)"
const LI_EDU_DATES_RE =
  /\s*·?\s*\(((?:[A-Za-z]+\s+)?\d{4})(?:\s*[–—-]\s*((?:[A-Za-z]+\s+)?\d{4}|present))?\)\s*$/i

/**
 * A short line without ending punctuation — likely a company/role header.
 * The export's main column wraps at ~75 characters; "Cox Automotive Inc." keeps
 * its abbreviation's period.
 */
const looksLikeExpHeader = (line: string) =>
  line.length <= 75 &&
  line.split(/\s+/).length <= 12 &&
  (!/[.!?:,;]$/.test(line) ||
    /\b(?:inc|ltd|llc|co|corp|plc|gmbh|s\.p\.a|s\.r\.l)\.$/i.test(line))

/**
 * Parser for LinkedIn's own "Save to PDF" profile export. Its layout is
 * fixed: main column with name / headline / location / Summary / Experience
 * (company line first, then role, then a date line with a tenure note) /
 * Education, and a sidebar with Contact, Top Skills, Languages, etc.
 *
 * Returns null when none of the main-column headings is found — an export
 * LinkedIn printed in another UI language still carries the profile URL and
 * the `<user> (LinkedIn)` row, but this parser would file every line under
 * the header and drop the whole profile; the generic parser keeps the text.
 */
function parseLinkedInText(raw: string): Resume | null {
  const resume = emptyResume()
  resume.experience = []
  resume.education = []

  // Blank lines are kept: extraction joins pages with a blank line, which is
  // where the page-1 sidebar ends and the main column resumes.
  const lines = raw.split(/\r?\n/).map((l) => l.trim())

  const text = raw
  const fullUrl = text.match(LINKEDIN_RE)?.[0] ?? ''
  const handle = text.match(/^(\S+)\s+\(LinkedIn\)$/im)?.[1] ?? ''
  resume.contact.linkedin =
    fullUrl && !/linkedin\.com\/in\/?$/i.test(fullUrl)
      ? fullUrl
      : handle
        ? `linkedin.com/in/${handle}`
        : fullUrl

  let section: LiSection = null
  let currentCustom: CustomSection | null = null
  const summaryLines: string[] = []
  const skills: string[] = []
  const certLines: string[] = []
  const headerLines: string[] = []

  let expHeader: string[] = []
  let currentExp: ExperienceItem | null = null
  let lastCompany = ''
  let expectLocation = false

  let eduSchool = ''
  let eduDegree: string[] = []
  let currentEdu: EducationItem | null = null

  // Main-column state parked while the sidebar is read
  type Parked = {
    section: LiSection
    currentExp: ExperienceItem | null
    expHeader: string[]
    expectLocation: boolean
    eduSchool: string
    eduDegree: string[]
    currentEdu: EducationItem | null
  }
  let parked: Parked | null = null
  let afterPageMark = false
  let sawMainSection = false
  const contactLines: string[] = []

  const flushEdu = () => {
    if (!eduSchool) return
    resume.education.push({
      ...emptyEducation(),
      id: newId(),
      school: eduSchool,
      degree: eduDegree.join(' ').trim(),
    })
    eduSchool = ''
    eduDegree = []
  }

  const enterSidebar = () => {
    parked = {
      section,
      currentExp,
      expHeader,
      expectLocation,
      eduSchool,
      eduDegree,
      currentEdu,
    }
    expHeader = []
    currentExp = null
    expectLocation = false
    eduSchool = ''
    eduDegree = []
    currentEdu = null
  }
  const leaveSidebar = () => {
    if (!parked) return
    ;({
      section,
      currentExp,
      expHeader,
      expectLocation,
      eduSchool,
      eduDegree,
      currentEdu,
    } = parked)
    parked = null
    currentCustom = null
  }
  /** Trailing short lines the sidebar section swallowed from the resumed main column */
  const reclaimSidebarTail = (): string[] => {
    const sink =
      section === 'custom'
        ? currentCustom?.bullets
        : section === 'certifications'
          ? certLines
          : section === 'skills'
            ? skills
            : undefined
    const out: string[] = []
    // company + role, or company + a role wrapped over two lines
    const want = () =>
      out.length === 2 && isLiHeaderWrap(out[0], out[1]) ? 3 : 2
    while (
      sink &&
      out.length < want() &&
      sink.length > 0 &&
      looksLikeExpHeader(sink[sink.length - 1])
    ) {
      out.unshift(sink.pop() as string)
    }
    return out
  }

  const flushExp = () => {
    if (!currentExp && expHeader.length > 0) {
      // Trailing header lines without a date line — still an entry
      currentExp = {
        ...emptyExperience(),
        id: newId(),
        company: expHeader[0] ?? '',
        role: expHeader[1] ?? '',
        bullets: [],
      }
      resume.experience.push(currentExp)
    }
    expHeader = []
    currentExp = null
    expectLocation = false
  }

  const consume = (line: string): void => {
    const heading = LI_HEADINGS.find(([re]) => re.test(line.replace(/[:：]$/, '')))
    if (heading) {
      if (
        !parked &&
        LI_SIDEBAR_START_RE.test(line) &&
        (afterPageMark || (section !== null && LI_MAIN_SECTIONS.has(section)))
      ) {
        enterSidebar()
      } else if (
        parked &&
        (heading[1] === 'experience' ||
          heading[1] === 'education' ||
          heading[1] === 'summary')
      ) {
        // A main-column heading inside the sidebar: the sidebar has ended
        leaveSidebar()
      }
      if (section === 'experience') flushExp()
      if (section === 'education') flushEdu()
      section = heading[1]
      if (LI_MAIN_SECTIONS.has(section)) sawMainSection = true
      currentCustom = null
      currentEdu = null
      eduSchool = ''
      eduDegree = []
      return
    }
    if (section !== null && !LI_MAIN_SECTIONS.has(section)) {
      // Only well-known headings here — an ALL-CAPS company name like "IBM"
      // must not start a custom section. The main column holds only Summary /
      // Experience / Education; a bare "Leadership" line inside an entry is
      // its description, the sidebar is where Languages / Publications live.
      const t = line.replace(/[:：]$/, '')
      const customTitle =
        t.length <= 32 && CUSTOM_HEADING_RE.test(t) && !/[:：,;]\s*\S/.test(t) ? t : null
      if (customTitle) {
        section = 'custom'
        currentCustom = { id: newId(), title: customTitle, bullets: [] }
        resume.customSections.push(currentCustom)
        return
      }
    }
    if (parked?.section === 'experience') {
      // Text without a page break (pasted): a dated entry header means the
      // main column has resumed — give the sidebar's tail back to it.
      const { start, rest } = extractDates(line)
      if (start && rest.length <= 12) {
        const tail = reclaimSidebarTail()
        leaveSidebar()
        // The reclaimed lines precede a date line: entry headers, not a location
        if (tail.length > 0) expectLocation = false
        for (const l of tail) consume(l)
      }
    }

    switch (section) {
      case null:
        headerLines.push(line)
        break
      case 'contact': {
        // Narrow column: "kenslinkedin2@kennethadams." + "com", "Site.com/" + "Path/ (Other)"
        const prev = contactLines[contactLines.length - 1]
        if (
          prev &&
          /[./@-]$/.test(prev) &&
          !/\s/.test(line.replace(/\s+\([A-Za-z]+\)$/, ''))
        ) {
          contactLines[contactLines.length - 1] = prev + line
        } else {
          contactLines.push(line)
        }
        break
      }
      case 'summary':
        summaryLines.push(line)
        break
      case 'skills':
        skills.push(line)
        break
      case 'certifications':
        certLines.push(line)
        break
      case 'custom': {
        if (!currentCustom) break
        // The sidebar wraps at ~35 characters: '"Managing inbound spam in Lotus' / 'Domino 6"'
        const prev = currentCustom.bullets[currentCustom.bullets.length - 1]
        const openQuote = !!prev && /^["“][^"”]*$/.test(prev)
        if (
          prev &&
          (openQuote || /[/-]$/.test(prev) || continuesPrevious(prev, line))
        )
          currentCustom.bullets[currentCustom.bullets.length - 1] =
            prev + (/[/-]$/.test(prev) ? '' : ' ') + line
        else currentCustom.bullets.push(stripBullet(line))
        break
      }
      case 'experience': {
        const { rest, start, end } = extractDates(line)
        if (start && rest.length <= 12) {
          // Date line closes the entry header: company first, then role.
          // Header lines of a follow-up role may have been buffered as
          // description lines of the previous entry — reclaim short trailing
          // lines without ending punctuation.
          let roleOnly = false
          if (expHeader.length === 0 && currentExp) {
            while (
              expHeader.length < 2 &&
              currentExp.bullets.length > 0 &&
              looksLikeExpHeader(currentExp.bullets[currentExp.bullets.length - 1])
            ) {
              expHeader.unshift(currentExp.bullets.pop() as string)
            }
            // A role wrapped over two lines: "Company" / "Role part one," / "& part two"
            const bullets = currentExp.bullets
            const last = () => bullets[bullets.length - 1]
            const got: number = expHeader.length
            if (got === 1) {
              const above = last()
              if (
                above !== undefined &&
                above.length <= 80 &&
                !/[.!?:;]$/.test(above) &&
                isLiHeaderWrap(above, expHeader[0])
              ) {
                expHeader.unshift(bullets.pop() as string)
                const company = last()
                if (company !== undefined && looksLikeExpHeader(company))
                  expHeader.unshift(bullets.pop() as string)
                else roleOnly = true
              }
            } else if (got === 2 && isLiHeaderWrap(expHeader[0], expHeader[1])) {
              const company = last()
              if (company !== undefined && looksLikeExpHeader(company))
                expHeader.unshift(bullets.pop() as string)
              else roleOnly = true
            }
          }
          const company = expHeader.length >= 2 && !roleOnly ? expHeader[0] : lastCompany
          const role =
            expHeader.length >= 2 && !roleOnly ? expHeader.slice(1).join(' ') : expHeader.join(' ')
          currentExp = {
            ...emptyExperience(),
            id: newId(),
            company,
            role,
            startDate: start,
            endDate: end,
            bullets: [],
          }
          if (company) lastCompany = company
          resume.experience.push(currentExp)
          expHeader = []
          expectLocation = true
        } else if (!currentExp) {
          if (LI_TENURE_RE.test(line)) {
            // Company with several roles: "Company\n<total tenure>\nRole\nDates…"
            if (expHeader.length > 0) lastCompany = expHeader[0]
            expHeader = []
          } else {
            expHeader.push(line)
          }
        } else if (LI_TENURE_RE.test(line)) {
          // A new company block begins (previous line was its name)
          const name = currentExp.bullets.pop()
          flushExp()
          if (name) lastCompany = name
        } else if (
          expectLocation &&
          !currentExp.location &&
          line.length <= 60 &&
          (LI_LOCATION_RE.test(line) ||
            /^remote$/i.test(line) ||
            LI_PLACE_LINE_RE.test(line))
        ) {
          currentExp.location = line
          expectLocation = false
        } else if (isBullet(line)) {
          currentExp.bullets.push(stripBullet(line))
          expectLocation = false
        } else if (
          currentExp.bullets.length > 0 &&
          !/[.!?:]$/.test(currentExp.bullets[currentExp.bullets.length - 1]) &&
          (/^[a-zà-ÿ]/.test(line) ||
            /,$/.test(currentExp.bullets[currentExp.bullets.length - 1]) ||
            (currentExp.bullets[currentExp.bullets.length - 1].length >= 60 &&
              !looksLikeExpHeader(line)))
        ) {
          // Wrapped continuation of the previous description line: it starts
          // lowercase, or the line above ended mid-list, or the line above
          // filled the column and this one is not an entry header
          currentExp.bullets[currentExp.bullets.length - 1] = joinWrapped(
            currentExp.bullets[currentExp.bullets.length - 1],
            line
          )
        } else {
          currentExp.bullets.push(line)
          expectLocation = false
        }
        break
      }
      case 'education': {
        const li = line.match(LI_EDU_DATES_RE)
        const dated = li
          ? { rest: line.slice(0, li.index).trim(), start: li[1], end: li[2] ?? li[1] }
          : extractDates(line)
        const { rest, start, end } = dated
        if (eduSchool && (start || /·/.test(line))) {
          // "Degree, Field of study · (2014 - 2018)" — possibly wrapped over
          // the previous line(s)
          const degree = [...eduDegree, rest]
            .join(' ')
            .replace(/\s*·\s*$/, '')
            .replace(/[\s·(),-]+$/, '')
            .trim()
          currentEdu = {
            ...emptyEducation(),
            id: newId(),
            school: eduSchool,
            degree,
            startDate: start,
            endDate: end,
          }
          resume.education.push(currentEdu)
          eduSchool = ''
          eduDegree = []
        } else if (eduSchool && eduDegree.length === 0) {
          // Undated degree line — or the first half of a wrapped one
          eduDegree = [line]
        } else if (eduSchool) {
          // Second undated line: the entry had no dates; this line is a school
          flushEdu()
          eduSchool = line
        } else if (start && currentEdu && !currentEdu.startDate && !rest) {
          currentEdu.startDate = start
          currentEdu.endDate = end
        } else {
          eduSchool = line
        }
        break
      }
      default:
        break
    }
  }

  for (const rawLine of lines) {
    if (!rawLine) {
      // Page boundary: the sidebar (if we are in it) is over
      if (parked) leaveSidebar()
      continue
    }
    if (LI_PAGE_RE.test(rawLine)) {
      afterPageMark = true
      continue
    }
    const line = rawLine.replace(LI_DURATION_RE, '').trim()
    if (!line) continue
    consume(line)
    afterPageMark = false
  }
  if (parked) leaveSidebar()
  if (!sawMainSection) return null
  if (section === 'experience') flushExp()
  flushEdu()

  const contactText = (contactLines.length ? contactLines : lines).join('\n')
  resume.contact.email = contactText.match(EMAIL_RE)?.[0] ?? text.match(EMAIL_RE)?.[0] ?? ''
  resume.contact.phone = findPhone(
    contactText
      .replace(/^.*\(LinkedIn\).*$/gim, '')
      .replace(new RegExp(LI_PHONE_KIND_RE.source, 'gim'), '')
  )
  const sites = contactLines
    .map((l) => l.match(LI_SITE_RE))
    .filter((m): m is RegExpMatchArray => m !== null)
  resume.contact.website = (sites.find((m) => !/^other$/i.test(m[2])) ?? sites[0])?.[1] ?? ''

  // Header: name, then headline (possibly wrapped), then location
  const header = headerLines.filter((l) => !EMAIL_RE.test(l) && !/\(LinkedIn\)/i.test(l))
  resume.contact.fullName = humanNameCase(header[0] ?? '')
  const headline: string[] = []
  const rest = header.slice(1)
  for (const [i, line] of rest.entries()) {
    const isLast = i === rest.length - 1
    if (
      headline.length > 0 &&
      line.length <= 60 &&
      (LI_LOCATION_RE.test(line) ||
        // "Las Vegas Metropolitan Area" / "San Francisco Bay Area" — always the header's last line
        (isLast &&
          LI_PLACE_LINE_RE.test(line) &&
          /\b(?:area|region|metropolitan)$/i.test(line)))
    ) {
      resume.contact.location = line
      break
    }
    headline.push(line)
  }
  resume.contact.title = headline.join(' ')

  resume.summary = joinWrappedLines(summaryLines)
  resume.skills = skills.join(', ')
  resume.certifications = certLines.join('; ')

  if (resume.experience.length === 0) resume.experience = [emptyExperience()]
  if (resume.education.length === 0) resume.education = [emptyEducation()]
  return resume
}
