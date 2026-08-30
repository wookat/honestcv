/**
 * Resume data model + localStorage persistence. All resume content lives in
 * the browser — nothing is stored on our servers.
 */

export interface ContactInfo {
  fullName: string
  title: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
}

export interface ExperienceItem {
  id: string
  company: string
  role: string
  location: string
  startDate: string
  endDate: string
  bullets: string[]
}

export interface EducationItem {
  id: string
  school: string
  degree: string
  location: string
  startDate: string
  endDate: string
  details: string
}

export interface ProjectItem {
  id: string
  name: string
  link: string
  description: string
}

/** User-defined section (e.g. Volunteering, Publications, Awards) */
export interface CustomSection {
  id: string
  title: string
  /** One entry per line; rendered as bullets */
  bullets: string[]
}

export interface Resume {
  contact: ContactInfo
  summary: string
  experience: ExperienceItem[]
  education: EducationItem[]
  projects: ProjectItem[]
  skills: string
  certifications: string
  customSections: CustomSection[]
  /** Section keys in render order (see SECTION_KEYS + custom:<id>) */
  sectionOrder: string[]
  templateId: string
  /** Custom accent color (hex); empty = template default */
  accentColor: string
  /** Export paper size: US Letter (US/Canada) or A4 (rest of world) */
  pageSize: 'letter' | 'a4'
  /** Body text size across preview and exports */
  fontScale?: 's' | 'm' | 'l'
  /** Line spacing across preview and exports */
  lineSpacing?: 'compact' | 'normal' | 'relaxed'
  /** Target role + JD used for tailoring and the ATS score */
  targetRole: string
  jobDescription: string
}

export const newId = () => Math.random().toString(36).slice(2, 10)

/** Multipliers applied to font sizes in the preview, PDF and DOCX. */
export const FONT_SCALE = { s: 0.92, m: 1, l: 1.08 } as const
/** Line-height multipliers applied in the preview, PDF and DOCX. */
export const LINE_SPACING = { compact: 1.22, normal: 1.35, relaxed: 1.52 } as const

export const fontScaleOf = (r: Resume) => FONT_SCALE[r.fontScale ?? 'm']
export const lineSpacingOf = (r: Resume) => LINE_SPACING[r.lineSpacing ?? 'normal']

export function emptyResume(): Resume {
  return {
    contact: {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
    },
    summary: '',
    experience: [emptyExperience()],
    education: [emptyEducation()],
    projects: [],
    skills: '',
    certifications: '',
    customSections: [],
    sectionOrder: [...SECTION_KEYS],
    templateId: 'classic',
    accentColor: '',
    pageSize: 'letter',
    fontScale: 'm',
    lineSpacing: 'normal',
    targetRole: '',
    jobDescription: '',
  }
}

export const emptyExperience = (): ExperienceItem => ({
  id: newId(),
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  bullets: [''],
})

export const emptyEducation = (): EducationItem => ({
  id: newId(),
  school: '',
  degree: '',
  location: '',
  startDate: '',
  endDate: '',
  details: '',
})

export const emptyProject = (): ProjectItem => ({
  id: newId(),
  name: '',
  link: '',
  description: '',
})

export const emptyCustomSection = (): CustomSection => ({
  id: newId(),
  title: '',
  bullets: [''],
})

/** Built-in section keys in default order */
export const SECTION_KEYS = [
  'summary',
  'experience',
  'projects',
  'education',
  'skills',
  'certifications',
] as const

export const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
}

/**
 * The resume's section keys in render order: stored order, minus stale keys,
 * plus any keys not yet present (new built-ins or newly added custom sections).
 */
export function orderedSectionKeys(r: Resume): string[] {
  const valid = new Set<string>([
    ...SECTION_KEYS,
    ...r.customSections.map((s) => `custom:${s.id}`),
  ])
  const seen = new Set<string>()
  const order: string[] = []
  for (const key of r.sectionOrder) {
    if (valid.has(key) && !seen.has(key)) {
      order.push(key)
      seen.add(key)
    }
  }
  for (const key of valid) if (!seen.has(key)) order.push(key)
  return order
}

export function sectionLabel(r: Resume, key: string): string {
  if (key.startsWith('custom:')) {
    const s = r.customSections.find((x) => `custom:${x.id}` === key)
    return s?.title.trim() || 'Custom section'
  }
  return SECTION_LABELS[key] ?? key
}

export function sampleResume(): Resume {
  return {
    ...emptyResume(),
    // A visibly themed template so the first export matches the styled preview
    templateId: 'modern',
    contact: {
      fullName: 'Jordan Reyes',
      title: 'Software Engineer',
      email: 'jordan.reyes@email.com',
      phone: '(555) 210-4432',
      location: 'Austin, TX',
      website: '',
      linkedin: 'linkedin.com/in/jordanreyes',
    },
    summary:
      'Software engineer with 4 years of experience building customer-facing web applications. Shipped features used by 2M+ monthly users and cut page load times by 45%. Strong in React, TypeScript and cloud infrastructure.',
    experience: [
      {
        id: newId(),
        company: 'Brightlane',
        role: 'Software Engineer',
        location: 'Austin, TX',
        startDate: 'Jun 2023',
        endDate: 'Present',
        bullets: [
          'Led migration of the checkout flow to React + TypeScript, reducing cart abandonment by 12%',
          'Built internal design-system components adopted by 5 product teams',
          'Cut p95 page load time from 3.2s to 1.7s via code splitting and CDN caching',
        ],
      },
      {
        id: newId(),
        company: 'Nova Retail',
        role: 'Junior Developer',
        location: 'Remote',
        startDate: 'Jul 2021',
        endDate: 'May 2023',
        bullets: [
          'Developed REST APIs in Node.js powering order tracking for 300k customers',
          'Automated regression test suite, cutting release QA time from 2 days to 4 hours',
        ],
      },
    ],
    education: [
      {
        id: newId(),
        school: 'University of Texas at Austin',
        degree: 'B.S. Computer Science',
        location: 'Austin, TX',
        startDate: '2017',
        endDate: '2021',
        details: '',
      },
    ],
    projects: [],
    skills:
      'React, TypeScript, Node.js, Python, PostgreSQL, AWS, Docker, CI/CD, GraphQL, Jest',
    certifications: '',
  }
}

/** Shape of an entry in /examples/examples.json (generated by build-seo.mjs) */
export interface ExamplePerson {
  name: string
  title: string
  location: string
  summary: string
  experience: { role: string; company: string; dates: string; bullets: string[] }[]
  skills: string[]
  education: string
}

/** Convert a role example from /examples/examples.json into a Resume. */
export function exampleToResume(person: ExamplePerson): Resume {
  const splitDates = (dates: string): [string, string] => {
    const parts = dates.split(/\s*[–—-]\s*/)
    return [parts[0] ?? '', parts[1] ?? '']
  }
  // "B.S. X — School, 2019 · Cert A, 2021 · Cert B" → education + certifications
  const [eduPart, ...certParts] = person.education.split(/\s*·\s*/)
  const [degree, schoolPart] = eduPart.split(/\s*—\s*/)
  // A trailing graduation year belongs in the date field, not the school name
  const schoolYear = /^(.*?),\s*(\d{4})$/.exec((schoolPart ?? '').trim())
  return {
    ...emptyResume(),
    templateId: 'modern',
    contact: {
      ...emptyResume().contact,
      fullName: person.name,
      title: person.title,
      location: person.location,
    },
    summary: person.summary,
    experience: person.experience.map((e) => {
      const [startDate, endDate] = splitDates(e.dates)
      return {
        id: newId(),
        company: e.company,
        role: e.role,
        location: '',
        startDate,
        endDate,
        bullets: e.bullets,
      }
    }),
    education: [
      {
        id: newId(),
        school: schoolYear ? schoolYear[1] : (schoolPart ?? '').trim(),
        degree: (degree ?? '').trim(),
        location: '',
        startDate: '',
        endDate: schoolYear ? schoolYear[2] : '',
        details: '',
      },
    ],
    skills: person.skills.join(', '),
    certifications: certParts.join(' · '),
  }
}

const STORAGE_KEY = 'honestcv.resume'

export function loadResume(): Resume | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Resume
    if (!parsed.contact || !Array.isArray(parsed.experience)) return null
    const merged = { ...emptyResume(), ...parsed }
    merged.sectionOrder = orderedSectionKeys(merged)
    return merged
  } catch {
    return null
  }
}

export function saveResume(resume: Resume) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resume))
  } catch {
    // storage full / private mode — ignore
  }
}

/** Named saved copies of the resume, e.g. one tailored per job application. */
export interface ResumeVersion {
  id: string
  name: string
  updatedAt: number
  data: Resume
}

const VERSIONS_KEY = 'honestcv.resumeVersions'

export function listResumeVersions(): ResumeVersion[] {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ResumeVersion[]
    return Array.isArray(parsed) ? parsed.filter((v) => v.id && v.data) : []
  } catch {
    return []
  }
}

function persistVersions(versions: ResumeVersion[]) {
  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveResumeVersion(name: string, data: Resume): ResumeVersion[] {
  const versions = [
    { id: newId(), name, updatedAt: Date.now(), data },
    ...listResumeVersions(),
  ]
  persistVersions(versions)
  return versions
}

export function renameResumeVersion(id: string, name: string): ResumeVersion[] {
  const versions = listResumeVersions().map((v) =>
    v.id === id ? { ...v, name, updatedAt: Date.now() } : v
  )
  persistVersions(versions)
  return versions
}

export function duplicateResumeVersion(id: string): ResumeVersion[] {
  const source = listResumeVersions().find((v) => v.id === id)
  if (!source) return listResumeVersions()
  const versions = [
    { id: newId(), name: `${source.name} (copy)`, updatedAt: Date.now(), data: source.data },
    ...listResumeVersions(),
  ]
  persistVersions(versions)
  return versions
}

export function deleteResumeVersion(id: string): ResumeVersion[] {
  const versions = listResumeVersions().filter((v) => v.id !== id)
  persistVersions(versions)
  return versions
}

/** Flatten to plain text (for AI context + ATS scoring) */
export function resumeToPlainText(r: Resume): string {
  const lines: string[] = []
  const c = r.contact
  lines.push([c.fullName, c.title].filter(Boolean).join(' — '))
  lines.push([c.email, c.phone, c.location, c.website, c.linkedin].filter(Boolean).join(' | '))
  for (const key of orderedSectionKeys(r)) {
    if (key === 'summary' && r.summary) {
      lines.push('', 'SUMMARY', r.summary)
    } else if (key === 'experience' && r.experience.some((e) => e.company || e.role)) {
      lines.push('', 'EXPERIENCE')
      for (const e of r.experience) {
        if (!e.company && !e.role) continue
        lines.push(
          [e.role, e.company].filter(Boolean).join(' at ') +
            (e.startDate || e.endDate ? ` (${e.startDate} – ${e.endDate})` : '')
        )
        for (const b of e.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
      }
    } else if (key === 'projects' && r.projects.some((p) => p.name)) {
      lines.push('', 'PROJECTS')
      for (const p of r.projects) {
        if (!p.name) continue
        lines.push(p.name + (p.link ? ` (${p.link})` : ''))
        if (p.description) lines.push(p.description)
      }
    } else if (key === 'education' && r.education.some((e) => e.school)) {
      lines.push('', 'EDUCATION')
      for (const e of r.education) {
        if (!e.school) continue
        lines.push(
          [e.degree, e.school].filter(Boolean).join(', ') +
            (e.startDate || e.endDate ? ` (${e.startDate} – ${e.endDate})` : '')
        )
        if (e.details) lines.push(e.details)
      }
    } else if (key === 'skills' && r.skills) {
      lines.push('', 'SKILLS', r.skills)
    } else if (key === 'certifications' && r.certifications) {
      lines.push('', 'CERTIFICATIONS', r.certifications)
    } else if (key.startsWith('custom:')) {
      const s = r.customSections.find((x) => `custom:${x.id}` === key)
      if (!s || (!s.title.trim() && !s.bullets.some((b) => b.trim()))) continue
      lines.push('', (s.title.trim() || 'ADDITIONAL').toUpperCase())
      for (const b of s.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
    }
  }
  return lines.join('\n')
}

/** Flatten to Markdown (for AI tools, GitHub profiles and quick edits) */
export function resumeToMarkdown(r: Resume): string {
  const lines: string[] = []
  const c = r.contact
  lines.push(`# ${[c.fullName, c.title].filter(Boolean).join(' — ')}`)
  const contact = [c.email, c.phone, c.location, c.website, c.linkedin].filter(Boolean)
  if (contact.length) lines.push('', contact.join(' · '))
  const heading = (t: string) => lines.push('', `## ${t}`, '')
  for (const key of orderedSectionKeys(r)) {
    if (key === 'summary' && r.summary) {
      heading('Summary')
      lines.push(r.summary)
    } else if (key === 'experience' && r.experience.some((e) => e.company || e.role)) {
      heading('Experience')
      for (const e of r.experience) {
        if (!e.company && !e.role) continue
        const dates = e.startDate || e.endDate ? ` *(${e.startDate} – ${e.endDate})*` : ''
        lines.push(`### ${[e.role, e.company].filter(Boolean).join(' — ')}${dates}`, '')
        for (const b of e.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
        lines.push('')
      }
    } else if (key === 'projects' && r.projects.some((p) => p.name)) {
      heading('Projects')
      for (const p of r.projects) {
        if (!p.name) continue
        lines.push(`### ${p.link ? `[${p.name}](${p.link})` : p.name}`, '')
        if (p.description) lines.push(p.description, '')
      }
    } else if (key === 'education' && r.education.some((e) => e.school)) {
      heading('Education')
      for (const e of r.education) {
        if (!e.school) continue
        const dates = e.startDate || e.endDate ? ` *(${e.startDate} – ${e.endDate})*` : ''
        lines.push(`### ${[e.degree, e.school].filter(Boolean).join(', ')}${dates}`, '')
        if (e.details) lines.push(e.details, '')
      }
    } else if (key === 'skills' && r.skills) {
      heading('Skills')
      lines.push(r.skills)
    } else if (key === 'certifications' && r.certifications) {
      heading('Certifications')
      lines.push(r.certifications)
    } else if (key.startsWith('custom:')) {
      const s = r.customSections.find((x) => `custom:${x.id}` === key)
      if (!s || (!s.title.trim() && !s.bullets.some((b) => b.trim()))) continue
      heading(s.title.trim() || 'Additional')
      for (const b of s.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
