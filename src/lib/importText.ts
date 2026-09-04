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

// Common resume sections without a dedicated field — imported as custom sections
const CUSTOM_HEADING_RE =
  /^(awards?|honors?|achievements?|publications?|volunteer(ing|\s+experience)?|languages?|interests?|hobbies|activities|leadership|references)\b/i

const isBullet = (line: string) => /^[-–—•*·▪◦]\s+/.test(line)
const stripBullet = (line: string) => line.replace(/^[-–—•*·▪◦]\s+/, '').trim()

// A sentence-like description line without a bullet marker (plain-text and
// DOCX exports often drop the markers): ends in sentence punctuation or is
// too long to be an entry header.
const looksLikeBodyLine = (line: string) => /[.!?;]$/.test(line) || line.length > 60

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
  for (const m of text.matchAll(re)) {
    const candidate = m[0].trim()
    if (/^\(?\d{4}\s*[–—-]\s*\d{4}\)?$/.test(candidate)) continue
    if (candidate.replace(/\D/g, '').length < 7) continue
    return candidate
  }
  return ''
}

function matchHeading(line: string): SectionName | null {
  const t = line.trim().replace(/[:：]$/, '')
  if (t.length > 40) return null
  for (const [re, name] of SECTION_HEADINGS) if (re.test(t)) return name
  return null
}

/** Heading for a section we don't have a dedicated field for (Awards, Languages…) */
function matchCustomHeading(line: string): string | null {
  const t = line.trim().replace(/[:：]$/, '')
  if (t.length > 32) return null
  if (CUSTOM_HEADING_RE.test(t)) return t
  // Generic short ALL-CAPS heading like "PRO BONO WORK"
  if (/^[A-Z][A-Z &/'-]+$/.test(t) && t.split(/\s+/).length <= 3) return t
  return null
}

function extractDates(line: string): { rest: string; start: string; end: string } {
  const m = line.match(DATE_RANGE_RE)
  if (!m) return { rest: line, start: '', end: '' }
  return {
    rest: (line.slice(0, m.index) + line.slice((m.index ?? 0) + m[0].length))
      .replace(/[\s|,()–—-]+$/, '')
      .trim(),
    start: m[1].trim(),
    end: m[2].trim(),
  }
}

/** Split "Role · Company" / "Role at Company" / "Role — Company" / "Role, Company" / "Role | Company" */
function splitRoleCompany(text: string): { role: string; company: string; location: string } {
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
  /\b(gpa|dean'?s list|cum laude|hono(?:u?rs)|minor|major|coursework|thesis|scholarship|award)\b/i

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

  for (const line of lines) {
    if (!line) continue
    const heading = matchHeading(line)
    if (heading) {
      section = heading
      currentExp = null
      currentEdu = null
      currentCustom = null
      continue
    }
    if (line === resume.contact.fullName) continue
    if (section !== null) {
      const customTitle = matchCustomHeading(line)
      if (customTitle) {
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
        if (currentCustom) currentCustom.bullets.push(stripBullet(line))
        break
      case 'experience': {
        if (isBullet(line)) {
          if (!currentExp) {
            currentExp = { ...emptyExperience(), id: newId(), bullets: [] }
            resume.experience.push(currentExp)
          }
          currentExp.bullets.push(stripBullet(line))
        } else {
          const { rest, start, end } = extractDates(line)
          if (!rest && start && currentExp && !currentExp.startDate) {
            // date range on its own line under the entry header
            currentExp.startDate = start
            currentExp.endDate = end
          } else if (currentExp && !currentExp.company && !start && rest.length <= 60 && !looksLikeBodyLine(line)) {
            // second header line (e.g. company on its own line)
            currentExp.company = rest
          } else if (currentExp && !start && looksLikeBodyLine(line)) {
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
        } else if (!start && currentEdu && EDU_DETAIL_RE.test(line)) {
          currentEdu.details = [currentEdu.details, line].filter(Boolean).join('; ')
        } else {
          const { role: degree, company: school, location: eduLoc } = splitRoleCompany(rest || line)
          currentEdu = {
            ...emptyEducation(),
            id: newId(),
            degree,
            school,
            location: eduLoc,
            startDate: start,
            endDate: end,
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
  resume.skills = skillLines
    .join(', ')
    .replace(/[•·▪◦|]/g, ',')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ')
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

/** A short line without ending punctuation — likely a company/role header. */
const looksLikeExpHeader = (line: string) =>
  line.length <= 60 && line.split(/\s+/).length <= 8 && !/[.!?:,;]$/.test(line)

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

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !LI_PAGE_RE.test(l))

  const text = raw
  resume.contact.email = text.match(EMAIL_RE)?.[0] ?? ''
  resume.contact.phone = findPhone(text.replace(/^.*\(LinkedIn\).*$/gim, ''))
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
  let currentEdu: EducationItem | null = null

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

  for (const rawLine of lines) {
    const line = rawLine.replace(LI_DURATION_RE, '').trim()
    if (!line) continue

    const heading = LI_HEADINGS.find(([re]) => re.test(line.replace(/[:：]$/, '')))
    if (heading) {
      if (section === 'experience') flushExp()
      section = heading[1]
      currentCustom = null
      currentEdu = null
      eduSchool = ''
      continue
    }
    if (section !== null && section !== 'summary') {
      // Only well-known headings here — an ALL-CAPS company name like "IBM"
      // must not start a custom section.
      const t = line.replace(/[:：]$/, '')
      const customTitle = t.length <= 32 && CUSTOM_HEADING_RE.test(t) ? t : null
      if (customTitle) {
        if (section === 'experience') flushExp()
        section = 'custom'
        currentCustom = { id: newId(), title: customTitle, bullets: [] }
        resume.customSections.push(currentCustom)
        continue
      }
    }

    switch (section) {
      case null:
        headerLines.push(line)
        break
      case 'contact':
        // email / phone / profile handle — already captured via regexes
        break
      case 'summary':
        summaryLines.push(line)
        break
      case 'skills':
        skills.push(line)
        break
      case 'certifications':
        certLines.push(line)
        break
      case 'custom':
        if (currentCustom) currentCustom.bullets.push(stripBullet(line))
        break
      case 'experience': {
        const { rest, start, end } = extractDates(line)
        if (start && rest.length <= 12) {
          // Date line closes the entry header: company first, then role.
          // Header lines of a follow-up role may have been buffered as
          // description lines of the previous entry — reclaim short trailing
          // lines without ending punctuation.
          if (expHeader.length === 0 && currentExp) {
            while (
              expHeader.length < 2 &&
              currentExp.bullets.length > 0 &&
              looksLikeExpHeader(currentExp.bullets[currentExp.bullets.length - 1])
            ) {
              expHeader.unshift(currentExp.bullets.pop() as string)
            }
          }
          const company = expHeader.length >= 2 ? expHeader[0] : lastCompany
          const role = expHeader.length >= 2 ? expHeader.slice(1).join(' ') : (expHeader[0] ?? '')
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
          (LI_LOCATION_RE.test(line) || /^remote$/i.test(line))
        ) {
          currentExp.location = line
          expectLocation = false
        } else if (isBullet(line)) {
          currentExp.bullets.push(stripBullet(line))
          expectLocation = false
        } else if (
          currentExp.bullets.length > 0 &&
          /^[a-zà-ÿ]/.test(line) &&
          !/[.!?:]$/.test(currentExp.bullets[currentExp.bullets.length - 1])
        ) {
          // Wrapped continuation of the previous description line
          currentExp.bullets[currentExp.bullets.length - 1] += ` ${line}`
        } else {
          currentExp.bullets.push(line)
          expectLocation = false
        }
        break
      }
      case 'education': {
        const { rest, start, end } = extractDates(line)
        if (eduSchool) {
          // "Degree, Field of study · (2014 - 2018)"
          const degree = rest.replace(/\s*·\s*$/, '').replace(/[\s·(),-]+$/, '').trim()
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
  if (section === 'experience') flushExp()
  if (eduSchool) {
    resume.education.push({ ...emptyEducation(), id: newId(), school: eduSchool })
  }

  // Header: name, then headline (possibly wrapped), then location
  const header = headerLines.filter((l) => !EMAIL_RE.test(l) && !/\(LinkedIn\)/i.test(l))
  resume.contact.fullName = header[0] ?? ''
  const headline: string[] = []
  for (const line of header.slice(1)) {
    if (LI_LOCATION_RE.test(line) && line.length <= 60 && headline.length > 0) {
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
