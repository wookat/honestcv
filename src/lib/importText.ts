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
const PHONE_RE = /(\+?\(?\d[\d\s().-]{7,}\d)/
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

/** First phone-like match that isn't actually a year range like "2010 - 2014". */
function findPhone(text: string): string {
  const re = new RegExp(PHONE_RE.source, 'g')
  for (const m of text.matchAll(re)) {
    const candidate = m[0].trim()
    if (/^\d{4}\s*[–—-]\s*\d{4}$/.test(candidate)) continue
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

export function parseResumeText(raw: string): Resume {
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
  for (const line of nonEmpty.slice(0, 5)) {
    if (matchHeading(line)) break
    for (const seg of line.split(/\s*[|•·]\s*/)) {
      if (/^[A-Za-z .'-]+,\s*[A-Z]{2}$/.test(seg.trim())) {
        resume.contact.location = seg.trim()
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
          } else if (currentExp && !currentExp.company && !start && rest.length <= 60) {
            // second header line (e.g. company on its own line)
            currentExp.company = rest
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
        if (isBullet(line) && resume.projects.length > 0) {
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
