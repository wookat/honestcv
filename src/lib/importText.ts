/**
 * Heuristic plain-text resume import: paste text (from an old resume, a PDF
 * copy, or LinkedIn) and get a pre-filled Resume to review. Runs entirely in
 * the browser.
 */

import {
  type EducationItem,
  type ExperienceItem,
  type Resume,
  emptyEducation,
  emptyExperience,
  emptyResume,
  newId,
} from './resume'

const EMAIL_RE = /[^\s@|,;]+@[^\s@|,;]+\.[a-z]{2,}/i
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/
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

const isBullet = (line: string) => /^[-•*·▪◦]\s+/.test(line)
const stripBullet = (line: string) => line.replace(/^[-•*·▪◦]\s+/, '').trim()

function matchHeading(line: string): SectionName | null {
  const t = line.trim().replace(/[:：]$/, '')
  if (t.length > 40) return null
  for (const [re, name] of SECTION_HEADINGS) if (re.test(t)) return name
  return null
}

function extractDates(line: string): { rest: string; start: string; end: string } {
  const m = line.match(DATE_RANGE_RE)
  if (!m) return { rest: line, start: '', end: '' }
  return {
    rest: (line.slice(0, m.index) + line.slice((m.index ?? 0) + m[0].length))
      .replace(/[|,()–—-]\s*$/, '')
      .trim(),
    start: m[1].trim(),
    end: m[2].trim(),
  }
}

/** Split "Role at Company" / "Role — Company" / "Role, Company" / "Role | Company" */
function splitRoleCompany(text: string): { role: string; company: string } {
  const seps = [/\s+at\s+/i, /\s*[—–|]\s*/, /,\s+/]
  for (const sep of seps) {
    const parts = text.split(sep)
    if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
      return { role: parts[0].trim(), company: parts.slice(1).join(', ').trim() }
    }
  }
  return { role: text.trim(), company: '' }
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
  const phone = text.match(PHONE_RE)?.[0]?.trim() ?? ''
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
      resume.contact.fullName = line
      break
    }
  }

  let section: SectionName | null = null
  let currentExp: ExperienceItem | null = null
  let currentEdu: EducationItem | null = null
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
      continue
    }
    if (line === resume.contact.fullName) continue

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
      case 'experience': {
        if (isBullet(line)) {
          if (!currentExp) {
            currentExp = { ...emptyExperience(), id: newId(), bullets: [] }
            resume.experience.push(currentExp)
          }
          currentExp.bullets.push(stripBullet(line))
        } else {
          const { rest, start, end } = extractDates(line)
          if (currentExp && !currentExp.company && !start && rest.length <= 60) {
            // second header line (e.g. company on its own line)
            currentExp.company = rest
          } else {
            const { role, company } = splitRoleCompany(rest || line)
            currentExp = {
              ...emptyExperience(),
              id: newId(),
              role,
              company,
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
        } else {
          const { role: degree, company: school } = splitRoleCompany(rest || line)
          currentEdu = {
            ...emptyEducation(),
            id: newId(),
            degree,
            school,
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
