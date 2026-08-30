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
  /** Grade point average, e.g. "3.8/4.0" */
  gpa?: string
  /** Minor field of study */
  minor?: string
}

export interface ProjectItem {
  id: string
  name: string
  link: string
  description: string
  /** Organization the project was done for/with */
  org?: string
  startDate?: string
  endDate?: string
}

export interface CertificationItem {
  id: string
  name: string
  /** Issuing organization */
  issuer: string
  /** When it was earned, e.g. "2024" */
  date: string
  /** How the certificate is relevant */
  description: string
}

export interface InvolvementItem {
  id: string
  /** Role at the organization, e.g. "Selected Member" */
  role: string
  organization: string
  /** College or city where the organization is located */
  location: string
  startDate: string
  endDate: string
  /** What you did there; one bullet per line */
  description: string
}

export interface CourseworkItem {
  id: string
  /** Course name, e.g. "Introduction to Computer Systems" */
  name: string
  /** Where the course was taken */
  institution: string
  /** When the course was taken, e.g. "2026" */
  date: string
  /** Skill used in the course (optional) */
  skill: string
  /** How the skill was applied; one bullet per line */
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
  /** Legacy free-text certifications line; rendered after structured entries */
  certifications: string
  certItems?: CertificationItem[]
  involvement?: InvolvementItem[]
  coursework?: CourseworkItem[]
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
  /** Font family across preview and exports; 'auto' follows the template */
  fontFamily?: 'auto' | 'serif' | 'sans'
  /** Vertical space before each section heading */
  sectionSpacing?: 'tight' | 'normal' | 'roomy'
  /** Section divider rule; 'auto' follows the template */
  sectionDivider?: 'auto' | 'on' | 'off'
  /** JD keywords the user marked as not relevant — excluded from ATS keyword coverage */
  ignoredKeywords?: string[]
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

/** Whether to render with a serif font, honouring the user's font-family override. */
export const serifOf = (r: Resume, tplSerif: boolean) =>
  r.fontFamily === 'serif' ? true : r.fontFamily === 'sans' ? false : tplSerif

/** Multipliers applied to the space before section headings. */
export const SECTION_SPACING = { tight: 0.6, normal: 1, roomy: 1.4 } as const

export const sectionSpacingOf = (r: Resume) => SECTION_SPACING[r.sectionSpacing ?? 'normal']

/** Section divider to render, honouring the user's override of the template rule. */
export const dividerOf = (
  r: Resume,
  tplDivider: 'line' | 'thick' | 'none'
): 'line' | 'thick' | 'none' =>
  r.sectionDivider === 'off'
    ? 'none'
    : r.sectionDivider === 'on'
      ? tplDivider === 'none'
        ? 'line'
        : tplDivider
      : tplDivider

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
    certItems: [],
    involvement: [],
    coursework: [],
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

export const emptyCertification = (): CertificationItem => ({
  id: newId(),
  name: '',
  issuer: '',
  date: '',
  description: '',
})

export const emptyInvolvement = (): InvolvementItem => ({
  id: newId(),
  role: '',
  organization: '',
  location: '',
  startDate: '',
  endDate: '',
  description: '',
})

export const emptyCoursework = (): CourseworkItem => ({
  id: newId(),
  name: '',
  institution: '',
  date: '',
  skill: '',
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
  'involvement',
  'education',
  'coursework',
  'skills',
  'certifications',
] as const

export const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  involvement: 'Involvement',
  education: 'Education',
  coursework: 'Coursework',
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

const asStr = (v: unknown): string => (typeof v === 'string' ? v : '')
const asStrArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []
const asObjArr = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v)
    ? v.filter((o): o is Record<string, unknown> => typeof o === 'object' && o !== null)
    : []
const asEnum = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  allowed.includes(v as T) ? (v as T) : undefined

/**
 * Coerce untrusted stored data into a valid Resume, field by field, so a
 * corrupted or legacy localStorage entry degrades gracefully instead of
 * crashing the app at render time. Returns null when nothing is salvageable.
 */
export function sanitizeResume(input: unknown): Resume | null {
  if (typeof input !== 'object' || input === null) return null
  const raw = input as Record<string, unknown>
  if (typeof raw.contact !== 'object' || raw.contact === null) return null
  const c = raw.contact as Record<string, unknown>
  const base = emptyResume()
  const resume: Resume = {
    contact: {
      fullName: asStr(c.fullName),
      title: asStr(c.title),
      email: asStr(c.email),
      phone: asStr(c.phone),
      location: asStr(c.location),
      website: asStr(c.website),
      linkedin: asStr(c.linkedin),
    },
    summary: asStr(raw.summary),
    experience: asObjArr(raw.experience).map((e) => ({
      id: asStr(e.id) || newId(),
      company: asStr(e.company),
      role: asStr(e.role),
      location: asStr(e.location),
      startDate: asStr(e.startDate),
      endDate: asStr(e.endDate),
      bullets: asStrArr(e.bullets),
    })),
    education: asObjArr(raw.education).map((e) => ({
      id: asStr(e.id) || newId(),
      school: asStr(e.school),
      degree: asStr(e.degree),
      location: asStr(e.location),
      startDate: asStr(e.startDate),
      endDate: asStr(e.endDate),
      details: asStr(e.details),
      gpa: asStr(e.gpa),
      minor: asStr(e.minor),
    })),
    projects: asObjArr(raw.projects).map((p) => ({
      id: asStr(p.id) || newId(),
      name: asStr(p.name),
      link: asStr(p.link),
      description: asStr(p.description),
      org: asStr(p.org),
      startDate: asStr(p.startDate),
      endDate: asStr(p.endDate),
    })),
    // legacy/hand-edited data may hold skills as a string array
    skills: Array.isArray(raw.skills) ? asStrArr(raw.skills).join(', ') : asStr(raw.skills),
    certifications: asStr(raw.certifications),
    certItems: asObjArr(raw.certItems).map((c) => ({
      id: asStr(c.id) || newId(),
      name: asStr(c.name),
      issuer: asStr(c.issuer),
      date: asStr(c.date),
      description: asStr(c.description),
    })),
    involvement: asObjArr(raw.involvement).map((i) => ({
      id: asStr(i.id) || newId(),
      role: asStr(i.role),
      organization: asStr(i.organization),
      location: asStr(i.location),
      startDate: asStr(i.startDate),
      endDate: asStr(i.endDate),
      description: asStr(i.description),
    })),
    coursework: asObjArr(raw.coursework).map((c) => ({
      id: asStr(c.id) || newId(),
      name: asStr(c.name),
      institution: asStr(c.institution),
      date: asStr(c.date),
      skill: asStr(c.skill),
      description: asStr(c.description),
    })),
    customSections: asObjArr(raw.customSections).map((s) => ({
      id: asStr(s.id) || newId(),
      title: asStr(s.title),
      bullets: asStrArr(s.bullets),
    })),
    sectionOrder: asStrArr(raw.sectionOrder),
    templateId: asStr(raw.templateId) || base.templateId,
    accentColor: asStr(raw.accentColor),
    ignoredKeywords: asStrArr(raw.ignoredKeywords),
    pageSize: asEnum(raw.pageSize, ['letter', 'a4'] as const) ?? 'letter',
    fontScale: asEnum(raw.fontScale, ['s', 'm', 'l'] as const),
    lineSpacing: asEnum(raw.lineSpacing, ['compact', 'normal', 'relaxed'] as const),
    fontFamily: asEnum(raw.fontFamily, ['auto', 'serif', 'sans'] as const),
    sectionSpacing: asEnum(raw.sectionSpacing, ['tight', 'normal', 'roomy'] as const),
    sectionDivider: asEnum(raw.sectionDivider, ['auto', 'on', 'off'] as const),
    targetRole: asStr(raw.targetRole),
    jobDescription: asStr(raw.jobDescription),
  }
  resume.sectionOrder = orderedSectionKeys(resume)
  return resume
}

export function loadResume(): Resume | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    if (!(parsed as Record<string, unknown>).contact) return null
    if (!Array.isArray((parsed as Record<string, unknown>).experience)) return null
    return sanitizeResume(parsed)
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
  folder?: string
  data: Resume
}

const VERSIONS_KEY = 'honestcv.resumeVersions'

export function listResumeVersions(): ResumeVersion[] {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ResumeVersion[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((v) => {
      if (!v || typeof v !== 'object' || !v.id) return []
      const data = sanitizeResume(v.data)
      if (!data) return []
      const folder = typeof v.folder === 'string' && v.folder.trim() ? v.folder : undefined
      return [{ ...v, folder, data }]
    })
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

export function updateResumeVersion(
  id: string,
  patch: { name?: string; folder?: string; data?: Resume }
): ResumeVersion[] {
  const versions = listResumeVersions().map((v) =>
    v.id === id ? { ...v, ...patch, updatedAt: Date.now() } : v
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

/** Automatic edit-history checkpoints of the single builder draft. */
export interface ResumeSnapshot {
  id: string
  at: number
  data: Resume
}

const HISTORY_KEY = 'honestcv.resumeHistory'
const HISTORY_MAX = 15
const HISTORY_MIN_GAP_MS = 10 * 60 * 1000

export function listResumeHistory(): ResumeSnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ResumeSnapshot[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || !s.at) return []
      const data = sanitizeResume(s.data)
      return data ? [{ ...s, data }] : []
    })
  } catch {
    return []
  }
}

function persistHistory(snapshots: ResumeSnapshot[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(snapshots.slice(0, HISTORY_MAX)))
  } catch {
    // storage full / private mode — ignore
  }
}

/**
 * Records a checkpoint of the draft. Skipped when the newest checkpoint is
 * identical, or (unless `force`) younger than the 10-minute gap.
 * Returns the updated list.
 */
export function recordResumeSnapshot(data: Resume, force = false): ResumeSnapshot[] {
  const history = listResumeHistory()
  const newest = history[0]
  const json = JSON.stringify(data)
  if (newest) {
    if (JSON.stringify(newest.data) === json) return history
    if (!force && Date.now() - newest.at < HISTORY_MIN_GAP_MS) return history
  }
  const next = [{ id: newId(), at: Date.now(), data: JSON.parse(json) as Resume }, ...history]
  persistHistory(next)
  return next.slice(0, HISTORY_MAX)
}

/** Detail line under an education entry: details · Minor in X · GPA: Y */
export function educationDetailLine(e: EducationItem): string {
  return [
    e.details.trim(),
    e.minor?.trim() ? `Minor in ${e.minor.trim()}` : '',
    e.gpa?.trim() ? `GPA: ${e.gpa.trim()}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Heading line for a project entry: name · org — link */
export function projectHeadingLine(p: ProjectItem): string {
  const left = [p.name.trim(), p.org?.trim() ?? ''].filter(Boolean).join(' · ')
  return p.link.trim() ? `${left} — ${p.link.trim()}` : left
}

/** Date range for a project entry: "start – end", or '' when both empty */
export function projectDates(p: ProjectItem): string {
  const start = p.startDate?.trim() ?? ''
  const end = p.endDate?.trim() ?? ''
  return start || end ? `${start} – ${end}` : ''
}

/** Heading line for a certification entry: name — issuer */
export function certHeadingLine(c: CertificationItem): string {
  return [c.name.trim(), c.issuer.trim()].filter(Boolean).join(' — ')
}

/** Structured certification entries with any content */
export const certEntries = (r: Resume): CertificationItem[] =>
  (r.certItems ?? []).filter((c) => c.name.trim() || c.issuer.trim())

/** Involvement entries with any content */
export const involvementEntries = (r: Resume): InvolvementItem[] =>
  (r.involvement ?? []).filter((i) => i.role.trim() || i.organization.trim())

/** Heading line for an involvement entry: role · organization, location */
export function involvementHeadingLine(i: InvolvementItem): string {
  const left = [i.role.trim(), i.organization.trim()].filter(Boolean).join('  ·  ')
  return i.location.trim() ? `${left}, ${i.location.trim()}` : left
}

/** Date range for an involvement entry: "start – end", or '' when both empty */
export function involvementDates(i: InvolvementItem): string {
  const start = i.startDate.trim()
  const end = i.endDate.trim()
  return start || end ? `${start} – ${end}` : ''
}

/** Non-empty description lines of an involvement entry, rendered as bullets */
export const involvementBullets = (i: InvolvementItem): string[] =>
  i.description.split('\n').map((l) => l.trim()).filter(Boolean)

/** Coursework entries with any content */
export const courseworkEntries = (r: Resume): CourseworkItem[] =>
  (r.coursework ?? []).filter((c) => c.name.trim() || c.institution.trim())

/** Heading line for a coursework entry: name · institution */
export function courseworkHeadingLine(c: CourseworkItem): string {
  return [c.name.trim(), c.institution.trim()].filter(Boolean).join('  ·  ')
}

/** Bullets for a coursework entry: "Skill: X" (when set) + description lines */
export const courseworkBullets = (c: CourseworkItem): string[] => [
  ...(c.skill.trim() ? [`Skill: ${c.skill.trim()}`] : []),
  ...c.description.split('\n').map((l) => l.trim()).filter(Boolean),
]

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
        const dates = projectDates(p)
        lines.push(
          p.name +
            (p.org?.trim() ? ` · ${p.org.trim()}` : '') +
            (p.link ? ` (${p.link})` : '') +
            (dates ? ` (${dates})` : '')
        )
        if (p.description) lines.push(p.description)
      }
    } else if (key === 'involvement' && involvementEntries(r).length > 0) {
      lines.push('', 'INVOLVEMENT')
      for (const i of involvementEntries(r)) {
        const dates = involvementDates(i)
        lines.push(involvementHeadingLine(i) + (dates ? ` (${dates})` : ''))
        for (const b of involvementBullets(i)) lines.push(`- ${b}`)
      }
    } else if (key === 'education' && r.education.some((e) => e.school)) {
      lines.push('', 'EDUCATION')
      for (const e of r.education) {
        if (!e.school) continue
        lines.push(
          [e.degree, e.school].filter(Boolean).join(', ') +
            (e.startDate || e.endDate ? ` (${e.startDate} – ${e.endDate})` : '')
        )
        const detail = educationDetailLine(e)
        if (detail) lines.push(detail)
      }
    } else if (key === 'coursework' && courseworkEntries(r).length > 0) {
      lines.push('', 'COURSEWORK')
      for (const cw of courseworkEntries(r)) {
        lines.push(courseworkHeadingLine(cw) + (cw.date.trim() ? ` (${cw.date.trim()})` : ''))
        for (const b of courseworkBullets(cw)) lines.push(`- ${b}`)
      }
    } else if (key === 'skills' && r.skills) {
      lines.push('', 'SKILLS', r.skills)
    } else if (key === 'certifications' && (certEntries(r).length > 0 || r.certifications)) {
      lines.push('', 'CERTIFICATIONS')
      for (const c of certEntries(r)) {
        lines.push(certHeadingLine(c) + (c.date.trim() ? ` (${c.date.trim()})` : ''))
        if (c.description.trim()) lines.push(c.description.trim())
      }
      if (r.certifications) lines.push(r.certifications)
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
        const title = p.org?.trim() ? `${p.name} · ${p.org.trim()}` : p.name
        const dates = projectDates(p)
        lines.push(
          `### ${p.link ? `[${title}](${p.link})` : title}${dates ? ` *(${dates})*` : ''}`,
          ''
        )
        if (p.description) lines.push(p.description, '')
      }
    } else if (key === 'involvement' && involvementEntries(r).length > 0) {
      heading('Involvement')
      for (const i of involvementEntries(r)) {
        const dates = involvementDates(i)
        lines.push(`### ${involvementHeadingLine(i)}${dates ? ` *(${dates})*` : ''}`, '')
        for (const b of involvementBullets(i)) lines.push(`- ${b}`)
        lines.push('')
      }
    } else if (key === 'education' && r.education.some((e) => e.school)) {
      heading('Education')
      for (const e of r.education) {
        if (!e.school) continue
        const dates = e.startDate || e.endDate ? ` *(${e.startDate} – ${e.endDate})*` : ''
        lines.push(`### ${[e.degree, e.school].filter(Boolean).join(', ')}${dates}`, '')
        const detail = educationDetailLine(e)
        if (detail) lines.push(detail, '')
      }
    } else if (key === 'coursework' && courseworkEntries(r).length > 0) {
      heading('Coursework')
      for (const cw of courseworkEntries(r)) {
        lines.push(
          `### ${courseworkHeadingLine(cw)}${cw.date.trim() ? ` *(${cw.date.trim()})*` : ''}`,
          ''
        )
        for (const b of courseworkBullets(cw)) lines.push(`- ${b}`)
        lines.push('')
      }
    } else if (key === 'skills' && r.skills) {
      heading('Skills')
      lines.push(r.skills)
    } else if (key === 'certifications' && (certEntries(r).length > 0 || r.certifications)) {
      heading('Certifications')
      for (const c of certEntries(r)) {
        lines.push(
          `### ${certHeadingLine(c)}${c.date.trim() ? ` *(${c.date.trim()})*` : ''}`,
          ''
        )
        if (c.description.trim()) lines.push(c.description.trim(), '')
      }
      if (r.certifications) lines.push(r.certifications)
    } else if (key.startsWith('custom:')) {
      const s = r.customSections.find((x) => `custom:${x.id}` === key)
      if (!s || (!s.title.trim() && !s.bullets.some((b) => b.trim()))) continue
      heading(s.title.trim() || 'Additional')
      for (const b of s.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
