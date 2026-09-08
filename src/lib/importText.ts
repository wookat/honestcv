/**
 * Heuristic plain-text resume import: paste text (from an old resume, a PDF
 * copy, or LinkedIn) and get a pre-filled Resume to review. Runs entirely in
 * the browser.
 */

import {
  type CustomSection,
  type EducationItem,
  type ExperienceItem,
  type Resume,
  emptyEducation,
  emptyExperience,
  emptyResume,
  newId,
} from './resume'

const EMAIL_RE = /[^\s@|,;]+@[^\s@|,;]+\.[a-z]{2,}/i
const PHONE_RE = /(\+?\(?\d[\d\s().-]{5,}\d)/
const US_STATES = new Set(
  ('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS ' +
    'MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV ' +
    'WI WY DC PR').split(' ')
)
const LINKEDIN_RE = /linkedin\.com\/[^\s|,;)]+/i
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s|,;)]*)?/i
const DATE_RANGE_RE =
  /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4})\s*(?:[–—-]|to)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4}|present|current|now)/i
// "Skin Bliss, Micro-Intern (1 week); Dec 2023" — a one-off engagement dated
// with a single month after a separator at the end of the header.
const SINGLE_DATE_RE = /[;|,(–—-]\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4})\)?\s*$/i

type SectionName =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'

const SECTION_HEADINGS: [RegExp, SectionName][] = [
  [/^(professional\s+)?(summary|profile|objective|about)\b/i, 'summary'],
  [/^((work|professional)\s+)?(experience|employment|work\s+history)\b/i, 'experience'],
  [/^education\b/i, 'education'],
  [/^(technical\s+)?skills?\b/i, 'skills'],
  [/^projects?\b/i, 'projects'],
  [/^(certifications?|certificates|licenses)\b/i, 'certifications'],
]

// A heading-shaped line (short, ALL CAPS or Title Case, no prose punctuation)
// that names a section anywhere in it: "Work/Internship/Relevant Experience",
// "Areas of Expertise", "Education & Training". Table order decides a heading
// that names two sections ("Summary of Skills" → skills). Tested on the plain
// text and on a letter-spaced heading collapsed to one word.
const SECTION_WORDS: [RegExp, SectionName][] = [
  [/experience|employment|work\s?history|career\s?history/i, 'experience'],
  [/education/i, 'education'],
  [/skills?|competenc(?:y|ies)|expertise/i, 'skills'],
  [/projects?/i, 'projects'],
  [/certifications?|certificates|licen[cs]es/i, 'certifications'],
  [/summary|profile|objective|about\s?me/i, 'summary'],
]
// "P R O F E S S I O N A L E X P E R I E N C E" — tracked (letter-spaced) headings
// reach text extraction with a space after every letter.
const LETTER_SPACED_RE = /^(?:[A-Za-z&/] ){3,}[A-Za-z&/]$/
const HEADING_WORD_RE = /^(?:[A-Z][A-Za-z&/'’-]*|&|\/|and|of|or|in|the)$/
// "Project Manager" / "Customer Experience Lead" are entry headers, not sections.
const JOB_TITLE_NOUN_RE =
  /\b(manager|engineer|developer|analyst|director|lead|specialist|coordinator|assistant|consultant|intern|officer|head|designer|architect|administrator|trainer|teacher|nurse|technician|associate|representative|executive|founder|owner|president|vp|supervisor|advisor|adviser|counsel|accountant|scientist|researcher|writer|editor|recruiter|planner|strategist|agent|clerk|operator|driver|chef|cook|server|barista|cashier|volunteer|partner|fellow|professor|lecturer|instructor|tutor|mentor|ambassador|apprentice|trainee|waiter|waitress|receptionist|paralegal|secretary|treasurer)\b/i
const looksLikeHeadingShape = (t: string) => {
  if (t.length > 48 || /[.,;:!?()\d]/.test(t)) return false
  const words = t.split(/\s+/)
  return words.length <= 6 && (t === t.toUpperCase() || words.every((w) => HEADING_WORD_RE.test(w)))
}

// Common resume sections without a dedicated field — imported as custom sections
const CUSTOM_HEADING_RE =
  /^(awards?|honors?|achievements?|publications?|volunteer(ing|\s+experience)?|languages?|interests?|hobbies|activities|leadership|references)\b/i

// Word's default list glyph is ● (U+25CF); Symbol-font bullets reach text
// extraction as a lone Private Use Area character.
const BULLET_MARK_RE = /^[-–—•*·▪▫◦●○■□◆◇❖➢➤►▶✓✔→\uE000-\uF8FF]\s+/
const isBullet = (line: string) => BULLET_MARK_RE.test(line)
const stripBullet = (line: string) => line.replace(BULLET_MARK_RE, '').trim()

// A sentence-like description line without a bullet marker (plain-text and
// DOCX exports often drop the markers): ends in sentence punctuation or is
// too long to be an entry header.
const looksLikeBodyLine = (line: string) => /[.!?;]$/.test(line) || line.length > 60

// "Role (long qualifier) · Company," — a header long enough to wrap: the
// middle dot binds role and company and prose never ends a line with it.
const looksLikeWrappedHeader = (line: string) =>
  line.length <= 120 && /\s·\s/.test(line) && /,$/.test(line)

// PDF text extraction yields one line per visual line, so a bullet that wraps
// arrives as "Reduced load time from 3.2" + "seconds to 1.8 seconds.": a
// marker-less line starting in lowercase (or with a figure / currency amount)
// after a line with no terminal punctuation continues that line, and so does
// any marker-less line after one that ends mid-phrase ("… security best
// practices, and" + "TypeScript — raising standards"). A line that opens with
// a year is a date, not a continuation.
const OPEN_PHRASE_END_RE =
  /(?:,|\b(?:and|or|but|with|for|to|of|in|on|by|at|as|from|into|via|using|across|through|including|the|a|an))$/i
const continuesPrevious = (prev: string | undefined, line: string) =>
  !!prev &&
  !/[.!?:;]$/.test(prev) &&
  !isBullet(line) &&
  (/^[a-zà-ÿ$€£0-9]/.test(line) || OPEN_PHRASE_END_RE.test(prev)) &&
  !/^\(?\d{4}\b/.test(line) &&
  !DATE_RANGE_RE.test(line)

// "Mumbai, India" / "Austin, TX" / "Remote" — a place, nothing else.
const PLACE_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'’-]{0,30}(?:,\s*[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'’-]{0,30}){0,2}$/

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

export function looksLikeLinkedInExport(raw: string): boolean {
  return (
    /^\S+\s+\(LinkedIn\)$/im.test(raw) ||
    /^top skills$/im.test(raw) ||
    (LINKEDIN_RE.test(raw) &&
      raw.split(/\r?\n/).some((l) => LI_PAGE_RE.test(l.trim())))
  )
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
  if (LETTER_SPACED_RE.test(t)) {
    const word = t.replace(/ /g, '')
    for (const [re, name] of SECTION_WORDS) if (re.test(word)) return name
    return null
  }
  // "WORK EXPERIENCE (most impressive first)" — an aside after the heading
  t = t.replace(/\s*\([^)]*\)$/, '')
  if (JOB_TITLE_NOUN_RE.test(t)) return null
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
  for (const [re, name] of SECTION_HEADINGS) if (re.test(m[1].trim())) return { heading: name, rest: m[2] }
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
  if (LETTER_SPACED_RE.test(t)) {
    // Tracked heading of a section we have no field for; the last word is
    // recoverable when it is a known section word ("EXTRACURRICULAR ACTIVITIES").
    return t
      .replace(/ /g, '')
      .replace(/(.)(awards?|honors?|achievements?|publications?|activities|interests?|languages?|leadership|work|involvement)$/i, '$1 $2')
      .toUpperCase()
  }
  if (t.length > 32) return null
  if (CUSTOM_HEADING_RE.test(t)) return t
  // Generic short ALL-CAPS heading like "PRO BONO WORK" — a lone short
  // acronym (CSS / AWS / SQL, a wrapped skill) is not one.
  if (/^[A-Z][A-Z &/'-]+$/.test(t) && t.split(/\s+/).length <= 3 && (t.length >= 6 || t.includes(' ')))
    return t
  return null
}

// Trailing separators left where the dates were; a bracket only when the
// dates were the bracket's content ("Role (Jan 2020 – Present)" → "Role (").
const stripDateRest = (s: string) => {
  const t = s.replace(/[\s|,;–—-]+$/, '')
  const open = (t.match(/\(/g) ?? []).length
  const close = (t.match(/\)/g) ?? []).length
  if (open > close && /\($/.test(t)) return stripDateRest(t.slice(0, -1))
  if (close > open && /\)$/.test(t)) return stripDateRest(t.slice(0, -1))
  return t.trim()
}
function extractDates(line: string): { rest: string; start: string; end: string } {
  const m = line.match(DATE_RANGE_RE)
  if (!m) {
    const s = line.match(SINGLE_DATE_RE)
    if (!s || (s.index ?? 0) === 0 || (s.index ?? 0) > 80) return { rest: line, start: '', end: '' }
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
      const company = parts.slice(1).join(', ').trim()
      // "Role — Company, City, ST" — peel a trailing location off the company
      const loc = company.match(/,\s*([A-Za-z .'-]+,\s*[A-Z]{2}|Remote)$/)
      if (loc && !sep.source.includes(','))
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

/** Undated honors/coursework line under an education entry — details, not a new school */
const EDU_DETAIL_RE =
  /\b(gpa|cgpa|dean'?s list|cum laude|hono(?:u?rs)|minor|major|coursework|thesis|dissertation|scholar(?:ship)?|bursary|award|grade|modules?|a[- ]levels?|gcses?|distinction|merit|first[- ]class)\b/i
// "Modules: Proteins; Quantum Mechanics" / "A Levels: Chemistry A*" — a labelled
// line under a school is its detail unless the label itself names a degree.
const EDU_DEGREE_LABEL_RE =
  /\b(b\.?s\.?c?|b\.?a|m\.?s\.?c?|m\.?a|m\.?eng|b\.?eng|bachelor|master|ph\.?d|mba|diploma|certificate|degree)\b/i
const isEduDetailLine = (line: string) => {
  if (EDU_DETAIL_RE.test(line)) return true
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
const prevNonEmpty = (lines: string[], i: number) => {
  for (let p = i - 1; p >= 0; p--) if (lines[p]) return lines[p]
  return ''
}
const appendDetails = (edu: EducationItem, extra: string) => {
  edu.details = [edu.details, extra].filter(Boolean).join('; ')
}
// "… from a low socio-economic" + "background)": the wrapped rest of the line
// above goes back onto the field that line filled.
const continueEduLine = (edu: EducationItem, prev: string, line: string) => {
  const tail = prev.trim()
  for (const key of ['details', 'degree', 'school'] as const) {
    if (edu[key].endsWith(tail)) {
      edu[key] = `${edu[key]} ${line}`
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

export function parseResumeText(raw: string): Resume {
  if (looksLikeLinkedInExport(raw)) return parseLinkedInText(raw)
  const resume = emptyResume()
  resume.experience = []
  resume.education = []

  const lines = raw.split(/\r?\n/).map((l) => l.trim())
  const nonEmpty = lines.filter(Boolean)
  const text = raw

  const email = text.match(EMAIL_RE)?.[0] ?? ''
  const linkedin = text.match(LINKEDIN_RE)?.[0] ?? ''
  const phone = findPhone(text)
  resume.contact.email = email
  resume.contact.phone = phone
  resume.contact.linkedin = linkedin
  // Header URL that is not LinkedIn (GitHub / portfolio) → website
  const headerText = nonEmpty
    .slice(0, 6)
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

  // Name: first short non-empty line without contact info or a heading
  for (const line of nonEmpty.slice(0, 5)) {
    if (
      line.length <= 60 &&
      !EMAIL_RE.test(line) &&
      !PHONE_RE.test(line) &&
      !matchHeading(line) &&
      line.split(/\s+/).length <= 6
    ) {
      // "Name — Title" header lines carry the professional title too
      const dash = line.split(/\s+[—–]\s+/)
      resume.contact.fullName = dash[0].trim()
      if (dash.length > 1) resume.contact.title = dash.slice(1).join(' — ').trim()
      break
    }
  }

  // Location: a "City, ST" segment on one of the header contact lines
  // (comma optional when the trailing token is a real USPS state code)
  for (const line of nonEmpty.slice(0, 5)) {
    if (matchHeading(line)) break
    for (const raw of line.split(/\s*[|•·]\s*/)) {
      const seg = raw.trim()
      const m = seg.match(/^([A-Za-z .'-]+?)(?:,\s*|\s+)([A-Z]{2})$/)
      if (m && (seg.includes(',') || US_STATES.has(m[2]))) {
        resume.contact.location = seg
        break
      }
    }
    if (resume.contact.location) break
  }

  let section: SectionName | 'custom' | null = null
  let currentExp: ExperienceItem | null = null
  let currentEdu: EducationItem | null = null
  let currentCustom: CustomSection | null = null
  const summaryLines: string[] = []
  const skillLines: string[] = []
  const certLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (!line) continue
    const inline = matchInlineHeading(line)
    const heading = inline?.heading ?? matchHeading(line)
    if (heading) {
      section = heading
      currentExp = null
      currentEdu = null
      currentCustom = null
      if (!inline) continue
      line = inline.rest
    }
    if (line === resume.contact.fullName) continue
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
        currentCustom = { id: newId(), title: inlineCustom.title, bullets: [inlineCustom.rest] }
        resume.customSections.push(currentCustom)
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
        currentCustom = {
          id: newId(),
          title: customTitle,
          bullets: [],
        }
        resume.customSections.push(currentCustom)
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
        if (continuesPrevious(currentCustom.bullets[currentCustom.bullets.length - 1], line))
          currentCustom.bullets[currentCustom.bullets.length - 1] += ` ${line}`
        else currentCustom.bullets.push(stripBullet(line))
        break
      case 'experience': {
        if (isBullet(line)) {
          if (!currentExp) {
            currentExp = { ...emptyExperience(), id: newId(), bullets: [] }
            resume.experience.push(currentExp)
          }
          currentExp.bullets.push(stripBullet(line))
        } else if (
          currentExp &&
          continuesPrevious(currentExp.bullets[currentExp.bullets.length - 1], line)
        ) {
          currentExp.bullets[currentExp.bullets.length - 1] += ` ${line}`
        } else {
          const { rest, start, end } = extractDates(line)
          if (!rest && start && currentExp && !currentExp.startDate) {
            // date range on its own line under the entry header
            currentExp.startDate = start
            currentExp.endDate = end
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
          } else if (currentExp && !currentExp.company && !start && rest.length <= 60 && !looksLikeBodyLine(line)) {
            // second header line (e.g. company on its own line)
            Object.assign(
              currentExp,
              orientRoleCompany({ role: currentExp.role.replace(/,$/, '').trim(), company: rest })
            )
          } else if (currentExp && !start && looksLikeBodyLine(line) && !looksLikeWrappedHeader(line)) {
            // marker-less description line under the current entry
            currentExp.bullets.push(line)
          } else {
            const { role, company, location } = splitRoleCompany(rest || line)
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
        if (isBullet(line) && currentEdu) {
          currentEdu.details = [currentEdu.details, stripBullet(line)]
            .filter(Boolean)
            .join('; ')
        } else if (!rest && start && currentEdu && !currentEdu.startDate) {
          currentEdu.startDate = start
          currentEdu.endDate = end
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
          currentEdu &&
          !start &&
          extractDates(prevNonEmpty(lines, i)).rest &&
          continuesPrevious(prevNonEmpty(lines, i), line)
        ) {
          continueEduLine(currentEdu, prevNonEmpty(lines, i), line)
        } else {
          const { role, company, location: eduLoc } = splitRoleCompanyRaw(rest || line)
          currentEdu = {
            ...emptyEducation(),
            id: newId(),
            degree: role,
            school: company,
            location: eduLoc,
            startDate: start,
            endDate: end,
          }
          if (!company && isDegreeLine(role)) {
            // "Bachelor of Arts in Economics; GPA: 3.7" — the school line follows
            const { degree, details } = splitDegreeLine(role)
            currentEdu.degree = degree
            currentEdu.details = details
          } else if (SCHOOL_RE.test(role) && !EDU_DEGREE_RE.test(role)) {
            // "St Mary's High School, Durham" — the school comes first
            currentEdu.school = role
            currentEdu.degree = ''
            if (company) {
              if (EDU_DEGREE_RE.test(company)) currentEdu.degree = company
              else if (isEduPlaceLine(company)) currentEdu.location = currentEdu.location || company
              else appendDetails(currentEdu, company)
            }
          }
          resume.education.push(currentEdu)
        }
        break
      }
      case 'projects': {
        if ((isBullet(line) || looksLikeBodyLine(line)) && resume.projects.length > 0) {
          const p = resume.projects[resume.projects.length - 1]
          p.description = [p.description, stripBullet(line)].filter(Boolean).join(' ')
        } else {
          const link = line.match(URL_RE)?.[0] ?? ''
          resume.projects.push({
            id: newId(),
            name: line.replace(link, '').replace(/[—–|(),]\s*$/, '').trim() || line,
            link,
            description: '',
          })
        }
        break
      }
      default:
        // Before any heading: professional title often sits under the name
        if (!resume.contact.title && line.length <= 60 && !EMAIL_RE.test(line) && !PHONE_RE.test(line)) {
          resume.contact.title = line
        }
    }
  }

  resume.summary = summaryLines.join(' ')
  resume.skills = joinSkillLines(skillLines)
  resume.certifications = certLines.join('; ')

  if (resume.experience.length === 0) resume.experience = [emptyExperience()]
  if (resume.education.length === 0) resume.education = [emptyEducation()]
  return resume
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
 */
function parseLinkedInText(raw: string): Resume {
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
          currentExp.bullets[currentExp.bullets.length - 1] += ` ${line}`
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
  resume.contact.fullName = header[0] ?? ''
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

  resume.summary = summaryLines.join(' ')
  resume.skills = skills.join(', ')
  resume.certifications = certLines.join('; ')

  if (resume.experience.length === 0) resume.experience = [emptyExperience()]
  if (resume.education.length === 0) resume.education = [emptyEducation()]
  return resume
}
