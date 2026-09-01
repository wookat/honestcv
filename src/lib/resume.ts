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

export interface AwardItem {
  id: string
  /** Award or honor name, e.g. "Dean's List" */
  name: string
  /** Which organization gave the award */
  organization: string
  /** When it was received, e.g. "2026" */
  date: string
  /** How the award is relevant; one bullet per line */
  description: string
}

export interface PublicationItem {
  id: string
  /** Publication title */
  title: string
  /** Journal or conference name */
  venue: string
  /** Publication type, e.g. "Journal Article" — free text */
  kind?: string
  /** When it was published, e.g. "2026" */
  date: string
  /** Additional information; one bullet per line */
  description: string
}

export type ReferenceKind = '' | 'personal' | 'professional'

export interface ReferenceItem {
  id: string
  /** Reference's full name */
  name: string
  /** Their job title */
  title: string
  employer: string
  email: string
  phone: string
  /** Personal or professional reference */
  kind: ReferenceKind
}

export interface MilitaryServiceItem {
  id: string
  /** Rank or position at the organization, e.g. "Sergeant" */
  rank: string
  /** Branch served in, e.g. "Army" */
  branch: string
  /** Where stationed, e.g. "Fort Bragg, NC" */
  location: string
  startDate: string
  endDate: string
  /** Responsibilities and accomplishments; one bullet per line */
  description: string
}

/** User-defined section (e.g. Volunteering, Publications) */
export interface CustomSection {
  id: string
  title: string
  /** One entry per line; rendered as bullets */
  bullets: string[]
}

export interface AgentItem {
  id: string
  /** Agent name, e.g. "Support Triage Agent" */
  name: string
  /** When the agent was built, e.g. "2026" */
  date: string
  /** Skills used, e.g. "Task Automation, Workflow Management" */
  skills: string
  /** How building the agent was relevant; one bullet per line */
  description: string
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
  awards?: AwardItem[]
  publications?: PublicationItem[]
  references?: ReferenceItem[]
  military?: MilitaryServiceItem[]
  agents?: AgentItem[]
  customSections: CustomSection[]
  /** Section keys in render order (see SECTION_KEYS + custom:<id>) */
  sectionOrder: string[]
  templateId: string
  /** Custom accent color (hex); empty = template default */
  accentColor: string
  /** Export paper size: US Letter (US/Canada) or A4 (rest of world) */
  pageSize: 'letter' | 'a4'
  /** Body text size across preview and exports */
  fontScale?: 'xs' | 's' | 'm' | 'l' | 'xl'
  /** Line spacing across preview and exports */
  lineSpacing?: 'xtight' | 'compact' | 'normal' | 'relaxed' | 'loose'
  /** Font family across preview and exports; 'auto' follows the template */
  fontFamily?: 'auto' | 'serif' | 'sans' | 'mono' | 'merriweather' | 'sourcesans' | 'robotomono'
  /** Vertical space before each section heading */
  sectionSpacing?: 'xtight' | 'tight' | 'normal' | 'roomy' | 'xroomy'
  /** Section divider rule; 'auto' follows the template */
  sectionDivider?: 'auto' | 'on' | 'off'
  /** Indent bullet lists relative to the section text */
  bulletIndent?: 'off' | 'on'
  /** Show small icons before contact fields (preview and PDF) */
  contactIcons?: 'off' | 'on'
  /** Body text color across preview, PDF and DOCX */
  textColor?: 'default' | 'black' | 'navy'
  /** JD keywords the user marked as not relevant — excluded from ATS keyword coverage */
  ignoredKeywords?: string[]
  /** Per-section heading overrides keyed by section key; missing/empty = default label */
  sectionHeadings?: Partial<Record<string, string>>
  /** Target role + JD used for tailoring and the ATS score */
  targetRole: string
  jobDescription: string
  /** Candidate seniority for the target job; grounds AI drafts ('' = unset) */
  experienceLevel?: '' | 'internship' | 'entry' | 'mid' | 'senior' | 'executive'
  /** Company the resume targets; grounds AI drafts and prefills cover letters */
  targetCompany?: string
  /** Profile photo as a data:image/... URL; shown in the preview and PDF only */
  photo?: string
}

export const newId = () => Math.random().toString(36).slice(2, 10)

export const EXPERIENCE_LEVELS = ['internship', 'entry', 'mid', 'senior', 'executive'] as const
export const EXPERIENCE_LEVEL_LABELS: Record<(typeof EXPERIENCE_LEVELS)[number], string> = {
  internship: 'Internship',
  entry: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior',
  executive: 'Executive',
}

/** Target role annotated with the experience level, for AI prompt context. */
export function aiTargetRole(r: Resume): string {
  const role = r.targetRole.trim()
  const lvl = r.experienceLevel
  const base = !lvl
    ? role
    : role
      ? `${role} (${EXPERIENCE_LEVEL_LABELS[lvl]})`
      : `${EXPERIENCE_LEVEL_LABELS[lvl]} position`
  const company = (r.targetCompany ?? '').trim()
  if (!company) return base
  return base ? `${base} at ${company}` : `Position at ${company}`
}

/** Multipliers applied to font sizes in the preview, PDF and DOCX. */
export const FONT_SCALE = { xs: 0.84, s: 0.92, m: 1, l: 1.08, xl: 1.16 } as const
/** Line-height multipliers applied in the preview, PDF and DOCX. */
export const LINE_SPACING = {
  xtight: 1.12,
  compact: 1.22,
  normal: 1.35,
  relaxed: 1.52,
  loose: 1.65,
} as const

export const fontScaleOf = (r: Resume) => FONT_SCALE[r.fontScale ?? 'm']
export const lineSpacingOf = (r: Resume) => LINE_SPACING[r.lineSpacing ?? 'normal']

export type FontFamilyKind =
  | 'serif'
  | 'sans'
  | 'mono'
  | 'merriweather'
  | 'sourcesans'
  | 'robotomono'

/** Font family to render with, honouring the user's override; 'auto' follows the template. */
export const familyOf = (r: Resume, tplSerif: boolean): FontFamilyKind =>
  r.fontFamily === 'serif' ||
  r.fontFamily === 'sans' ||
  r.fontFamily === 'mono' ||
  r.fontFamily === 'merriweather' ||
  r.fontFamily === 'sourcesans' ||
  r.fontFamily === 'robotomono'
    ? r.fontFamily
    : tplSerif
      ? 'serif'
      : 'sans'

/** Multipliers applied to the space before section headings. */
export const SECTION_SPACING = {
  xtight: 0.35,
  tight: 0.6,
  normal: 1,
  roomy: 1.4,
  xroomy: 1.7,
} as const

export const sectionSpacingOf = (r: Resume) => SECTION_SPACING[r.sectionSpacing ?? 'normal']

export const bulletIndentOf = (r: Resume) => r.bulletIndent === 'on'

export const contactIconsOf = (r: Resume) => r.contactIcons === 'on'

/** Body text ink (hex) per text-color setting. */
export const TEXT_INKS = { default: '#1f1f1f', black: '#000000', navy: '#1f3a5c' } as const

export const textInkOf = (r: Resume) => TEXT_INKS[r.textColor ?? 'default']

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
    awards: [],
    publications: [],
    references: [],
    military: [],
    agents: [],
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

export const emptyAward = (): AwardItem => ({
  id: newId(),
  name: '',
  organization: '',
  date: '',
  description: '',
})

export const emptyReference = (): ReferenceItem => ({
  id: newId(),
  name: '',
  title: '',
  employer: '',
  email: '',
  phone: '',
  kind: '',
})

export const emptyMilitaryService = (): MilitaryServiceItem => ({
  id: newId(),
  rank: '',
  branch: '',
  location: '',
  startDate: '',
  endDate: '',
  description: '',
})

export const emptyAgent = (): AgentItem => ({
  id: newId(),
  name: '',
  date: '',
  skills: '',
  description: '',
})

export const emptyPublication = (): PublicationItem => ({
  id: newId(),
  title: '',
  venue: '',
  date: '',
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
  'awards',
  'publications',
  'references',
  'military',
  'agents',
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
  awards: 'Awards & Honors',
  publications: 'Publications',
  references: 'References',
  military: 'Military service',
  agents: 'Agents',
}

/**
 * The resume's section keys in render order: stored order, minus stale keys,
 * plus any keys not yet present. Missing built-ins are spliced in at their
 * default position (after the nearest preceding built-in already present);
 * missing custom sections are appended.
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
  for (let i = 0; i < SECTION_KEYS.length; i++) {
    const key = SECTION_KEYS[i]
    if (seen.has(key)) continue
    let at = 0
    for (let j = i - 1; j >= 0; j--) {
      const prev = order.indexOf(SECTION_KEYS[j])
      if (prev !== -1) {
        at = prev + 1
        break
      }
    }
    order.splice(at, 0, key)
    seen.add(key)
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

/** The heading rendered for a section: the user's override, else the default label. */
export function sectionHeading(r: Resume, key: string): string {
  const custom = (r.sectionHeadings?.[key] ?? '').trim()
  return custom || sectionLabel(r, key)
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const ONGOING_RE = /\b(present|current|now|ongoing)\b/i

/**
 * Ordinal (year*12 + month) for a free-text date like "Jun 2023", "08/2021" or
 * "2019". Month unknown → mid-year. No recognizable year → null.
 */
export function dateSortValue(text: string): number | null {
  const t = text.trim().toLowerCase()
  const year = /(?:19|20)\d{2}/.exec(t)
  if (!year) return null
  let month = 6
  const named = MONTH_NAMES.findIndex((m) => t.includes(m))
  if (named >= 0) month = named + 1
  else {
    const numeric = /\b(0?[1-9]|1[0-2])\s*[/.-]/.exec(t)
    if (numeric) month = Number(numeric[1])
  }
  return Number(year[0]) * 12 + month
}

/**
 * Stable newest-first sort for dated entries. Ongoing entries (end date reads
 * "Present"/"Current"/…) come first ranked by start date; then by end date
 * (falling back to start date) descending; entries with no parseable date keep
 * their relative order at the end.
 */
export function sortEntriesByDate<T>(
  items: T[],
  startOf: (item: T) => string,
  endOf: (item: T) => string
): T[] {
  const keyed = items.map((item, index) => {
    const start = dateSortValue(startOf(item))
    const end = ONGOING_RE.test(endOf(item)) ? Number.MAX_SAFE_INTEGER : dateSortValue(endOf(item))
    const primary = end ?? start
    return { item, index, primary, start: start ?? end ?? Number.MIN_SAFE_INTEGER }
  })
  keyed.sort((a, b) => {
    if (a.primary === null && b.primary === null) return a.index - b.index
    if (a.primary === null) return 1
    if (b.primary === null) return -1
    if (a.primary !== b.primary) return b.primary - a.primary
    if (a.start !== b.start) return b.start - a.start
    return a.index - b.index
  })
  return keyed.map((k) => k.item)
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
/** Heading overrides: known built-in keys with non-empty, non-default strings only. */
const asSectionHeadings = (v: unknown): Partial<Record<string, string>> | undefined => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return undefined
  const out: Record<string, string> = {}
  for (const [key, val] of Object.entries(v)) {
    if (typeof val !== 'string' || !(key in SECTION_LABELS)) continue
    const t = val.trim()
    if (t && t !== SECTION_LABELS[key]) out[key] = t
  }
  return Object.keys(out).length ? out : undefined
}

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
    awards: asObjArr(raw.awards).map((a) => ({
      id: asStr(a.id) || newId(),
      name: asStr(a.name),
      organization: asStr(a.organization),
      date: asStr(a.date),
      description: asStr(a.description),
    })),
    publications: asObjArr(raw.publications).map((p) => ({
      id: asStr(p.id) || newId(),
      title: asStr(p.title),
      venue: asStr(p.venue),
      kind: asStr(p.kind).trim() ? asStr(p.kind) : undefined,
      date: asStr(p.date),
      description: asStr(p.description),
    })),
    references: asObjArr(raw.references).map((x) => ({
      id: asStr(x.id) || newId(),
      name: asStr(x.name),
      title: asStr(x.title),
      employer: asStr(x.employer),
      email: asStr(x.email),
      phone: asStr(x.phone),
      kind: x.kind === 'personal' || x.kind === 'professional' ? x.kind : '',
    })),
    military: asObjArr(raw.military).map((m) => ({
      id: asStr(m.id) || newId(),
      rank: asStr(m.rank),
      branch: asStr(m.branch),
      location: asStr(m.location),
      startDate: asStr(m.startDate),
      endDate: asStr(m.endDate),
      description: asStr(m.description),
    })),
    agents: asObjArr(raw.agents).map((a) => ({
      id: asStr(a.id) || newId(),
      name: asStr(a.name),
      date: asStr(a.date),
      skills: asStr(a.skills),
      description: asStr(a.description),
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
    sectionHeadings: asSectionHeadings(raw.sectionHeadings),
    pageSize: asEnum(raw.pageSize, ['letter', 'a4'] as const) ?? 'letter',
    fontScale: asEnum(raw.fontScale, ['xs', 's', 'm', 'l', 'xl'] as const),
    lineSpacing: asEnum(
      raw.lineSpacing,
      ['xtight', 'compact', 'normal', 'relaxed', 'loose'] as const
    ),
    fontFamily: asEnum(
      raw.fontFamily,
      ['auto', 'serif', 'sans', 'mono', 'merriweather', 'sourcesans', 'robotomono'] as const
    ),
    sectionSpacing: asEnum(
      raw.sectionSpacing,
      ['xtight', 'tight', 'normal', 'roomy', 'xroomy'] as const
    ),
    sectionDivider: asEnum(raw.sectionDivider, ['auto', 'on', 'off'] as const),
    bulletIndent: asEnum(raw.bulletIndent, ['off', 'on'] as const),
    contactIcons: asEnum(raw.contactIcons, ['off', 'on'] as const),
    textColor: asEnum(raw.textColor, ['default', 'black', 'navy'] as const),
    targetRole: asStr(raw.targetRole),
    jobDescription: asStr(raw.jobDescription),
    experienceLevel: asEnum(
      raw.experienceLevel,
      ['internship', 'entry', 'mid', 'senior', 'executive'] as const
    ),
    targetCompany: asStr(raw.targetCompany) || undefined,
    photo: asStr(raw.photo).startsWith('data:image/') ? asStr(raw.photo) : undefined,
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
    { ...source, id: newId(), name: `${source.name} (copy)`, updatedAt: Date.now() },
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

/**
 * Link between the working editor draft and the saved copy it was opened from.
 * While linked, autosaves write the draft back into that copy so it never goes
 * stale — matching how each resume is a live document in tools like Rezi.
 */
const ACTIVE_VERSION_KEY = 'honestcv.activeVersionId'

export function getActiveVersionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_VERSION_KEY)
  } catch {
    return null
  }
}

export function setActiveVersionId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_VERSION_KEY, id)
    else localStorage.removeItem(ACTIVE_VERSION_KEY)
  } catch {
    // storage full / private mode — ignore
  }
}

/** Write the draft back into its linked copy; unlink if the copy is gone. */
export function syncActiveVersion(data: Resume) {
  const id = getActiveVersionId()
  if (!id) return
  const versions = listResumeVersions()
  if (!versions.some((v) => v.id === id)) {
    setActiveVersionId(null)
    return
  }
  persistVersions(
    versions.map((v) => (v.id === id ? { ...v, data, updatedAt: Date.now() } : v))
  )
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

/** A single polished role saved for reuse across resume copies. */
export interface SavedExperience {
  id: string
  savedAt: number
  data: ExperienceItem
}

const EXPERIENCE_LIBRARY_KEY = 'honestcv.experienceLibrary'
const EXPERIENCE_LIBRARY_MAX = 30

function sanitizeExperienceItem(input: unknown): ExperienceItem | null {
  if (typeof input !== 'object' || input === null) return null
  const e = input as Record<string, unknown>
  const item: ExperienceItem = {
    id: asStr(e.id) || newId(),
    company: asStr(e.company),
    role: asStr(e.role),
    location: asStr(e.location),
    startDate: asStr(e.startDate),
    endDate: asStr(e.endDate),
    bullets: asStrArr(e.bullets),
  }
  return item.company.trim() || item.role.trim() || item.bullets.some((b) => b.trim())
    ? item
    : null
}

export function listExperienceLibrary(): SavedExperience[] {
  try {
    const raw = localStorage.getItem(EXPERIENCE_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedExperience[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const data = sanitizeExperienceItem(s.data)
      return data ? [{ id: s.id, savedAt: s.savedAt, data }] : []
    })
  } catch {
    return []
  }
}

function persistExperienceLibrary(items: SavedExperience[]) {
  try {
    localStorage.setItem(
      EXPERIENCE_LIBRARY_KEY,
      JSON.stringify(items.slice(0, EXPERIENCE_LIBRARY_MAX))
    )
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveExperienceToLibrary(entry: ExperienceItem): SavedExperience[] {
  const data = sanitizeExperienceItem(entry)
  if (!data) return listExperienceLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listExperienceLibrary(),
  ].slice(0, EXPERIENCE_LIBRARY_MAX)
  persistExperienceLibrary(items)
  return items
}

export function deleteLibraryExperience(id: string): SavedExperience[] {
  const items = listExperienceLibrary().filter((s) => s.id !== id)
  persistExperienceLibrary(items)
  return items
}

/** A single polished education entry saved for reuse across resume copies. */
export interface SavedEducation {
  id: string
  savedAt: number
  data: EducationItem
}

const EDUCATION_LIBRARY_KEY = 'honestcv.educationLibrary'
const EDUCATION_LIBRARY_MAX = 30

function sanitizeEducationItem(input: unknown): EducationItem | null {
  if (typeof input !== 'object' || input === null) return null
  const e = input as Record<string, unknown>
  const item: EducationItem = {
    id: asStr(e.id) || newId(),
    school: asStr(e.school),
    degree: asStr(e.degree),
    location: asStr(e.location),
    startDate: asStr(e.startDate),
    endDate: asStr(e.endDate),
    details: asStr(e.details),
  }
  const gpa = asStr(e.gpa)
  if (gpa) item.gpa = gpa
  const minor = asStr(e.minor)
  if (minor) item.minor = minor
  return item.school.trim() || item.degree.trim() || item.details.trim() ? item : null
}

export function listEducationLibrary(): SavedEducation[] {
  try {
    const raw = localStorage.getItem(EDUCATION_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedEducation[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const data = sanitizeEducationItem(s.data)
      return data ? [{ id: s.id, savedAt: s.savedAt, data }] : []
    })
  } catch {
    return []
  }
}

function persistEducationLibrary(items: SavedEducation[]) {
  try {
    localStorage.setItem(EDUCATION_LIBRARY_KEY, JSON.stringify(items.slice(0, EDUCATION_LIBRARY_MAX)))
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveEducationToLibrary(entry: EducationItem): SavedEducation[] {
  const data = sanitizeEducationItem(entry)
  if (!data) return listEducationLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listEducationLibrary(),
  ].slice(0, EDUCATION_LIBRARY_MAX)
  persistEducationLibrary(items)
  return items
}

export function deleteLibraryEducation(id: string): SavedEducation[] {
  const items = listEducationLibrary().filter((s) => s.id !== id)
  persistEducationLibrary(items)
  return items
}

/** A single polished project entry saved for reuse across resume copies. */
export interface SavedProject {
  id: string
  savedAt: number
  data: ProjectItem
}

const PROJECT_LIBRARY_KEY = 'honestcv.projectLibrary'
const PROJECT_LIBRARY_MAX = 30

function sanitizeProjectItem(input: unknown): ProjectItem | null {
  if (typeof input !== 'object' || input === null) return null
  const p = input as Record<string, unknown>
  const item: ProjectItem = {
    id: asStr(p.id) || newId(),
    name: asStr(p.name),
    link: asStr(p.link),
    description: asStr(p.description),
  }
  const org = asStr(p.org)
  if (org) item.org = org
  const startDate = asStr(p.startDate)
  if (startDate) item.startDate = startDate
  const endDate = asStr(p.endDate)
  if (endDate) item.endDate = endDate
  return item.name.trim() || item.link.trim() || item.description.trim() ? item : null
}

export function listProjectLibrary(): SavedProject[] {
  try {
    const raw = localStorage.getItem(PROJECT_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedProject[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const data = sanitizeProjectItem(s.data)
      return data ? [{ id: s.id, savedAt: s.savedAt, data }] : []
    })
  } catch {
    return []
  }
}

function persistProjectLibrary(items: SavedProject[]) {
  try {
    localStorage.setItem(PROJECT_LIBRARY_KEY, JSON.stringify(items.slice(0, PROJECT_LIBRARY_MAX)))
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveProjectToLibrary(entry: ProjectItem): SavedProject[] {
  const data = sanitizeProjectItem(entry)
  if (!data) return listProjectLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listProjectLibrary(),
  ].slice(0, PROJECT_LIBRARY_MAX)
  persistProjectLibrary(items)
  return items
}

export function deleteLibraryProject(id: string): SavedProject[] {
  const items = listProjectLibrary().filter((s) => s.id !== id)
  persistProjectLibrary(items)
  return items
}

/** A single polished involvement entry saved for reuse across resume copies. */
export interface SavedInvolvement {
  id: string
  savedAt: number
  data: InvolvementItem
}

const INVOLVEMENT_LIBRARY_KEY = 'honestcv.involvementLibrary'
const INVOLVEMENT_LIBRARY_MAX = 30

function sanitizeInvolvementItem(input: unknown): InvolvementItem | null {
  if (typeof input !== 'object' || input === null) return null
  const v = input as Record<string, unknown>
  const item: InvolvementItem = {
    id: asStr(v.id) || newId(),
    role: asStr(v.role),
    organization: asStr(v.organization),
    location: asStr(v.location),
    startDate: asStr(v.startDate),
    endDate: asStr(v.endDate),
    description: asStr(v.description),
  }
  return item.role.trim() || item.organization.trim() || item.description.trim() ? item : null
}

export function listInvolvementLibrary(): SavedInvolvement[] {
  try {
    const raw = localStorage.getItem(INVOLVEMENT_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedInvolvement[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const data = sanitizeInvolvementItem(s.data)
      return data ? [{ id: s.id, savedAt: s.savedAt, data }] : []
    })
  } catch {
    return []
  }
}

function persistInvolvementLibrary(items: SavedInvolvement[]) {
  try {
    localStorage.setItem(
      INVOLVEMENT_LIBRARY_KEY,
      JSON.stringify(items.slice(0, INVOLVEMENT_LIBRARY_MAX))
    )
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveInvolvementToLibrary(entry: InvolvementItem): SavedInvolvement[] {
  const data = sanitizeInvolvementItem(entry)
  if (!data) return listInvolvementLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listInvolvementLibrary(),
  ].slice(0, INVOLVEMENT_LIBRARY_MAX)
  persistInvolvementLibrary(items)
  return items
}

export function deleteLibraryInvolvement(id: string): SavedInvolvement[] {
  const items = listInvolvementLibrary().filter((s) => s.id !== id)
  persistInvolvementLibrary(items)
  return items
}

/** A single polished coursework entry saved for reuse across resume copies. */
export interface SavedCoursework {
  id: string
  savedAt: number
  data: CourseworkItem
}

const COURSEWORK_LIBRARY_KEY = 'honestcv.courseworkLibrary'
const COURSEWORK_LIBRARY_MAX = 30

function sanitizeCourseworkItem(input: unknown): CourseworkItem | null {
  if (typeof input !== 'object' || input === null) return null
  const v = input as Record<string, unknown>
  const item: CourseworkItem = {
    id: asStr(v.id) || newId(),
    name: asStr(v.name),
    institution: asStr(v.institution),
    date: asStr(v.date),
    skill: asStr(v.skill),
    description: asStr(v.description),
  }
  return item.name.trim() || item.institution.trim() || item.description.trim() ? item : null
}

export function listCourseworkLibrary(): SavedCoursework[] {
  try {
    const raw = localStorage.getItem(COURSEWORK_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedCoursework[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const data = sanitizeCourseworkItem(s.data)
      return data ? [{ id: s.id, savedAt: s.savedAt, data }] : []
    })
  } catch {
    return []
  }
}

function persistCourseworkLibrary(items: SavedCoursework[]) {
  try {
    localStorage.setItem(
      COURSEWORK_LIBRARY_KEY,
      JSON.stringify(items.slice(0, COURSEWORK_LIBRARY_MAX))
    )
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveCourseworkToLibrary(entry: CourseworkItem): SavedCoursework[] {
  const data = sanitizeCourseworkItem(entry)
  if (!data) return listCourseworkLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listCourseworkLibrary(),
  ].slice(0, COURSEWORK_LIBRARY_MAX)
  persistCourseworkLibrary(items)
  return items
}

export function deleteLibraryCoursework(id: string): SavedCoursework[] {
  const items = listCourseworkLibrary().filter((s) => s.id !== id)
  persistCourseworkLibrary(items)
  return items
}

/** A single polished award entry saved for reuse across resume copies. */
export interface SavedAward {
  id: string
  savedAt: number
  data: AwardItem
}

const AWARD_LIBRARY_KEY = 'honestcv.awardLibrary'
const AWARD_LIBRARY_MAX = 30

function sanitizeAwardItem(input: unknown): AwardItem | null {
  if (typeof input !== 'object' || input === null) return null
  const v = input as Record<string, unknown>
  const item: AwardItem = {
    id: asStr(v.id) || newId(),
    name: asStr(v.name),
    organization: asStr(v.organization),
    date: asStr(v.date),
    description: asStr(v.description),
  }
  return item.name.trim() || item.organization.trim() || item.description.trim() ? item : null
}

export function listAwardLibrary(): SavedAward[] {
  try {
    const raw = localStorage.getItem(AWARD_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedAward[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const data = sanitizeAwardItem(s.data)
      return data ? [{ id: s.id, savedAt: s.savedAt, data }] : []
    })
  } catch {
    return []
  }
}

function persistAwardLibrary(items: SavedAward[]) {
  try {
    localStorage.setItem(AWARD_LIBRARY_KEY, JSON.stringify(items.slice(0, AWARD_LIBRARY_MAX)))
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveAwardToLibrary(entry: AwardItem): SavedAward[] {
  const data = sanitizeAwardItem(entry)
  if (!data) return listAwardLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listAwardLibrary(),
  ].slice(0, AWARD_LIBRARY_MAX)
  persistAwardLibrary(items)
  return items
}

export function deleteLibraryAward(id: string): SavedAward[] {
  const items = listAwardLibrary().filter((s) => s.id !== id)
  persistAwardLibrary(items)
  return items
}

/** A single polished reference entry saved for reuse across resume copies. */
export interface SavedReference {
  id: string
  savedAt: number
  data: ReferenceItem
}

const REFERENCE_LIBRARY_KEY = 'honestcv.referenceLibrary'
const REFERENCE_LIBRARY_MAX = 30

function sanitizeReferenceItem(input: unknown): ReferenceItem | null {
  if (typeof input !== 'object' || input === null) return null
  const v = input as Record<string, unknown>
  const item: ReferenceItem = {
    id: asStr(v.id) || newId(),
    name: asStr(v.name),
    title: asStr(v.title),
    employer: asStr(v.employer),
    email: asStr(v.email),
    phone: asStr(v.phone),
    kind: v.kind === 'personal' || v.kind === 'professional' ? v.kind : '',
  }
  return item.name.trim() || item.employer.trim() || item.email.trim() ? item : null
}

export function listReferenceLibrary(): SavedReference[] {
  try {
    const raw = localStorage.getItem(REFERENCE_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedReference[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const data = sanitizeReferenceItem(s.data)
      return data ? [{ id: s.id, savedAt: s.savedAt, data }] : []
    })
  } catch {
    return []
  }
}

function persistReferenceLibrary(items: SavedReference[]) {
  try {
    localStorage.setItem(
      REFERENCE_LIBRARY_KEY,
      JSON.stringify(items.slice(0, REFERENCE_LIBRARY_MAX))
    )
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveReferenceToLibrary(entry: ReferenceItem): SavedReference[] {
  const data = sanitizeReferenceItem(entry)
  if (!data) return listReferenceLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listReferenceLibrary(),
  ].slice(0, REFERENCE_LIBRARY_MAX)
  persistReferenceLibrary(items)
  return items
}

export function deleteLibraryReference(id: string): SavedReference[] {
  const items = listReferenceLibrary().filter((s) => s.id !== id)
  persistReferenceLibrary(items)
  return items
}

/** A single polished certification entry saved for reuse across resume copies. */
export interface SavedCertification {
  id: string
  savedAt: number
  data: CertificationItem
}

const CERT_LIBRARY_KEY = 'honestcv.certLibrary'
const CERT_LIBRARY_MAX = 30

function sanitizeCertificationItem(input: unknown): CertificationItem | null {
  if (typeof input !== 'object' || input === null) return null
  const v = input as Record<string, unknown>
  const item: CertificationItem = {
    id: asStr(v.id) || newId(),
    name: asStr(v.name),
    issuer: asStr(v.issuer),
    date: asStr(v.date),
    description: asStr(v.description),
  }
  return item.name.trim() || item.issuer.trim() || item.description.trim() ? item : null
}

export function listCertLibrary(): SavedCertification[] {
  try {
    const raw = localStorage.getItem(CERT_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedCertification[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const data = sanitizeCertificationItem(s.data)
      return data ? [{ id: s.id, savedAt: s.savedAt, data }] : []
    })
  } catch {
    return []
  }
}

function persistCertLibrary(items: SavedCertification[]) {
  try {
    localStorage.setItem(CERT_LIBRARY_KEY, JSON.stringify(items.slice(0, CERT_LIBRARY_MAX)))
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveCertToLibrary(entry: CertificationItem): SavedCertification[] {
  const data = sanitizeCertificationItem(entry)
  if (!data) return listCertLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listCertLibrary(),
  ].slice(0, CERT_LIBRARY_MAX)
  persistCertLibrary(items)
  return items
}

export function deleteLibraryCert(id: string): SavedCertification[] {
  const items = listCertLibrary().filter((s) => s.id !== id)
  persistCertLibrary(items)
  return items
}

/** A single polished publication entry saved for reuse across resume copies. */
export interface SavedPublication {
  id: string
  savedAt: number
  data: PublicationItem
}

const PUBLICATION_LIBRARY_KEY = 'honestcv.publicationLibrary'
const PUBLICATION_LIBRARY_MAX = 30

function sanitizePublicationItem(input: unknown): PublicationItem | null {
  if (typeof input !== 'object' || input === null) return null
  const v = input as Record<string, unknown>
  const item: PublicationItem = {
    id: asStr(v.id) || newId(),
    title: asStr(v.title),
    venue: asStr(v.venue),
    ...(asStr(v.kind).trim() ? { kind: asStr(v.kind) } : {}),
    date: asStr(v.date),
    description: asStr(v.description),
  }
  return item.title.trim() || item.venue.trim() || (item.kind ?? '').trim() || item.description.trim()
    ? item
    : null
}

export function listPublicationLibrary(): SavedPublication[] {
  try {
    const raw = localStorage.getItem(PUBLICATION_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedPublication[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const data = sanitizePublicationItem(s.data)
      return data ? [{ id: s.id, savedAt: s.savedAt, data }] : []
    })
  } catch {
    return []
  }
}

function persistPublicationLibrary(items: SavedPublication[]) {
  try {
    localStorage.setItem(
      PUBLICATION_LIBRARY_KEY,
      JSON.stringify(items.slice(0, PUBLICATION_LIBRARY_MAX))
    )
  } catch {
    // storage full / private mode — ignore
  }
}

export function savePublicationToLibrary(entry: PublicationItem): SavedPublication[] {
  const data = sanitizePublicationItem(entry)
  if (!data) return listPublicationLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listPublicationLibrary(),
  ].slice(0, PUBLICATION_LIBRARY_MAX)
  persistPublicationLibrary(items)
  return items
}

export function deleteLibraryPublication(id: string): SavedPublication[] {
  const items = listPublicationLibrary().filter((s) => s.id !== id)
  persistPublicationLibrary(items)
  return items
}

/** A polished skills text block saved for reuse across resume copies. */
export interface SavedSkills {
  id: string
  savedAt: number
  skills: string
}

const SKILLS_LIBRARY_KEY = 'honestcv.skillsLibrary'
const SKILLS_LIBRARY_MAX = 30

export function listSkillsLibrary(): SavedSkills[] {
  try {
    const raw = localStorage.getItem(SKILLS_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedSkills[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const skills = asStr(s.skills)
      return skills.trim() ? [{ id: s.id, savedAt: s.savedAt, skills }] : []
    })
  } catch {
    return []
  }
}

function persistSkillsLibrary(items: SavedSkills[]) {
  try {
    localStorage.setItem(SKILLS_LIBRARY_KEY, JSON.stringify(items.slice(0, SKILLS_LIBRARY_MAX)))
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveSkillsToLibrary(skills: string): SavedSkills[] {
  if (!skills.trim()) return listSkillsLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), skills },
    ...listSkillsLibrary(),
  ].slice(0, SKILLS_LIBRARY_MAX)
  persistSkillsLibrary(items)
  return items
}

export function deleteLibrarySkills(id: string): SavedSkills[] {
  const items = listSkillsLibrary().filter((s) => s.id !== id)
  persistSkillsLibrary(items)
  return items
}

/** A polished summary text block saved for reuse across resume copies. */
export interface SavedSummary {
  id: string
  savedAt: number
  summary: string
}

const SUMMARY_LIBRARY_KEY = 'honestcv.summaryLibrary'
const SUMMARY_LIBRARY_MAX = 30

export function listSummaryLibrary(): SavedSummary[] {
  try {
    const raw = localStorage.getItem(SUMMARY_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedSummary[]
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((s) => {
      if (!s || typeof s !== 'object' || !s.id || typeof s.savedAt !== 'number') return []
      const summary = asStr(s.summary)
      return summary.trim() ? [{ id: s.id, savedAt: s.savedAt, summary }] : []
    })
  } catch {
    return []
  }
}

function persistSummaryLibrary(items: SavedSummary[]) {
  try {
    localStorage.setItem(SUMMARY_LIBRARY_KEY, JSON.stringify(items.slice(0, SUMMARY_LIBRARY_MAX)))
  } catch {
    // storage full / private mode — ignore
  }
}

export function saveSummaryToLibrary(summary: string): SavedSummary[] {
  if (!summary.trim()) return listSummaryLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), summary },
    ...listSummaryLibrary(),
  ].slice(0, SUMMARY_LIBRARY_MAX)
  persistSummaryLibrary(items)
  return items
}

export function deleteLibrarySummary(id: string): SavedSummary[] {
  const items = listSummaryLibrary().filter((s) => s.id !== id)
  persistSummaryLibrary(items)
  return items
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

/**
 * Skills split into display lines. A line written as "Category: a, b, c"
 * carries a `label` so renderers can bold the category prefix; a skills
 * value with no newlines stays a single unlabelled line (legacy format).
 */
export function skillLines(r: Resume): { label?: string; text: string }[] {
  const lines = r.skills.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length <= 1) return lines.map((text) => ({ text }))
  return lines.map((line) => {
    const m = /^([^:]{1,40}):\s*(.+)$/.exec(line)
    return m ? { label: m[1].trim(), text: m[2].trim() } : { text: line }
  })
}

/** Award entries with any content */
export const awardEntries = (r: Resume): AwardItem[] =>
  (r.awards ?? []).filter((a) => a.name.trim() || a.organization.trim())

/** Heading line for an award entry: name — organization */
export function awardHeadingLine(a: AwardItem): string {
  return [a.name.trim(), a.organization.trim()].filter(Boolean).join(' — ')
}

/** Non-empty description lines of an award entry, rendered as bullets */
export const awardBullets = (a: AwardItem): string[] =>
  a.description.split('\n').map((l) => l.trim()).filter(Boolean)

/** Publication entries with any content */
export const publicationEntries = (r: Resume): PublicationItem[] =>
  (r.publications ?? []).filter((p) => p.title.trim() || p.venue.trim())

/** Heading line for a publication entry: title — venue (Kind) */
export function publicationHeadingLine(p: PublicationItem): string {
  const base = [p.title.trim(), p.venue.trim()].filter(Boolean).join(' — ')
  const kind = (p.kind ?? '').trim()
  if (!kind) return base
  return base ? `${base} (${kind})` : kind
}

/** Non-empty description lines of a publication entry, rendered as bullets */
export const publicationBullets = (p: PublicationItem): string[] =>
  p.description.split('\n').map((l) => l.trim()).filter(Boolean)

/** Reference entries with a name */
export const referenceEntries = (r: Resume): ReferenceItem[] =>
  (r.references ?? []).filter((x) => x.name.trim())

/** Heading line for a reference entry: name — title, employer */
export function referenceHeadingLine(x: ReferenceItem): string {
  const role = [x.title.trim(), x.employer.trim()].filter(Boolean).join(', ')
  return [x.name.trim(), role].filter(Boolean).join(' — ')
}

/** Contact detail line for a reference entry: email · phone · kind */
export function referenceDetailLine(x: ReferenceItem): string {
  const kind =
    x.kind === 'personal'
      ? 'Personal reference'
      : x.kind === 'professional'
        ? 'Professional reference'
        : ''
  return [x.email.trim(), x.phone.trim(), kind].filter(Boolean).join(' · ')
}

/** Military service entries with any content */
export const militaryEntries = (r: Resume): MilitaryServiceItem[] =>
  (r.military ?? []).filter((m) => m.rank.trim() || m.branch.trim())

/** Heading line for a military service entry: rank · branch, location */
export function militaryHeadingLine(m: MilitaryServiceItem): string {
  const left = [m.rank.trim(), m.branch.trim()].filter(Boolean).join('  ·  ')
  return m.location.trim() ? `${left}, ${m.location.trim()}` : left
}

/** Date range for a military service entry: "start – end", or '' when both empty */
export function militaryDates(m: MilitaryServiceItem): string {
  const start = m.startDate.trim()
  const end = m.endDate.trim()
  return start || end ? `${start} – ${end}` : ''
}

/** Non-empty description lines of a military service entry, rendered as bullets */
export const militaryBullets = (m: MilitaryServiceItem): string[] =>
  m.description.split('\n').map((l) => l.trim()).filter(Boolean)

/** Agent entries with any content */
export const agentEntries = (r: Resume): AgentItem[] =>
  (r.agents ?? []).filter((a) => a.name.trim())

/** Bullets for an agent entry: "Skills used: X" (when set) + description lines */
export const agentBullets = (a: AgentItem): string[] => [
  ...(a.skills.trim() ? [`Skills used: ${a.skills.trim()}`] : []),
  ...a.description.split('\n').map((l) => l.trim()).filter(Boolean),
]

/** Flatten to plain text (for AI context + ATS scoring) */
export function resumeToPlainText(r: Resume): string {
  const lines: string[] = []
  const c = r.contact
  lines.push([c.fullName, c.title].filter(Boolean).join(' — '))
  lines.push([c.email, c.phone, c.location, c.website, c.linkedin].filter(Boolean).join(' | '))
  for (const key of orderedSectionKeys(r)) {
    if (key === 'summary' && r.summary) {
      lines.push('', sectionHeading(r, 'summary').toUpperCase(), r.summary)
    } else if (key === 'experience' && r.experience.some((e) => e.company || e.role)) {
      lines.push('', sectionHeading(r, 'experience').toUpperCase())
      for (const e of r.experience) {
        if (!e.company && !e.role) continue
        lines.push(
          [e.role, e.company].filter(Boolean).join(' at ') +
            (e.startDate || e.endDate ? ` (${e.startDate} – ${e.endDate})` : '')
        )
        for (const b of e.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
      }
    } else if (key === 'projects' && r.projects.some((p) => p.name)) {
      lines.push('', sectionHeading(r, 'projects').toUpperCase())
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
      lines.push('', sectionHeading(r, 'involvement').toUpperCase())
      for (const i of involvementEntries(r)) {
        const dates = involvementDates(i)
        lines.push(involvementHeadingLine(i) + (dates ? ` (${dates})` : ''))
        for (const b of involvementBullets(i)) lines.push(`- ${b}`)
      }
    } else if (key === 'education' && r.education.some((e) => e.school)) {
      lines.push('', sectionHeading(r, 'education').toUpperCase())
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
      lines.push('', sectionHeading(r, 'coursework').toUpperCase())
      for (const cw of courseworkEntries(r)) {
        lines.push(courseworkHeadingLine(cw) + (cw.date.trim() ? ` (${cw.date.trim()})` : ''))
        for (const b of courseworkBullets(cw)) lines.push(`- ${b}`)
      }
    } else if (key === 'skills' && r.skills) {
      lines.push('', sectionHeading(r, 'skills').toUpperCase(), r.skills)
    } else if (key === 'certifications' && (certEntries(r).length > 0 || r.certifications)) {
      lines.push('', sectionHeading(r, 'certifications').toUpperCase())
      for (const c of certEntries(r)) {
        lines.push(certHeadingLine(c) + (c.date.trim() ? ` (${c.date.trim()})` : ''))
        if (c.description.trim()) lines.push(c.description.trim())
      }
      if (r.certifications) lines.push(r.certifications)
    } else if (key === 'awards' && awardEntries(r).length > 0) {
      lines.push('', sectionHeading(r, 'awards').toUpperCase())
      for (const a of awardEntries(r)) {
        lines.push(awardHeadingLine(a) + (a.date.trim() ? ` (${a.date.trim()})` : ''))
        for (const b of awardBullets(a)) lines.push(`- ${b}`)
      }
    } else if (key === 'publications' && publicationEntries(r).length > 0) {
      lines.push('', sectionHeading(r, 'publications').toUpperCase())
      for (const p of publicationEntries(r)) {
        lines.push(publicationHeadingLine(p) + (p.date.trim() ? ` (${p.date.trim()})` : ''))
        for (const b of publicationBullets(p)) lines.push(`- ${b}`)
      }
    } else if (key === 'references' && referenceEntries(r).length > 0) {
      lines.push('', sectionHeading(r, 'references').toUpperCase())
      for (const x of referenceEntries(r)) {
        lines.push(referenceHeadingLine(x))
        const detail = referenceDetailLine(x)
        if (detail) lines.push(`- ${detail}`)
      }
    } else if (key === 'military' && militaryEntries(r).length > 0) {
      lines.push('', sectionHeading(r, 'military').toUpperCase())
      for (const m of militaryEntries(r)) {
        const dates = militaryDates(m)
        lines.push(militaryHeadingLine(m) + (dates ? ` (${dates})` : ''))
        for (const b of militaryBullets(m)) lines.push(`- ${b}`)
      }
    } else if (key === 'agents' && agentEntries(r).length > 0) {
      lines.push('', sectionHeading(r, 'agents').toUpperCase())
      for (const a of agentEntries(r)) {
        lines.push(a.name.trim() + (a.date.trim() ? ` (${a.date.trim()})` : ''))
        for (const b of agentBullets(a)) lines.push(`- ${b}`)
      }
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
      heading(sectionHeading(r, 'summary'))
      lines.push(r.summary)
    } else if (key === 'experience' && r.experience.some((e) => e.company || e.role)) {
      heading(sectionHeading(r, 'experience'))
      for (const e of r.experience) {
        if (!e.company && !e.role) continue
        const dates = e.startDate || e.endDate ? ` *(${e.startDate} – ${e.endDate})*` : ''
        lines.push(`### ${[e.role, e.company].filter(Boolean).join(' — ')}${dates}`, '')
        for (const b of e.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
        lines.push('')
      }
    } else if (key === 'projects' && r.projects.some((p) => p.name)) {
      heading(sectionHeading(r, 'projects'))
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
      heading(sectionHeading(r, 'involvement'))
      for (const i of involvementEntries(r)) {
        const dates = involvementDates(i)
        lines.push(`### ${involvementHeadingLine(i)}${dates ? ` *(${dates})*` : ''}`, '')
        for (const b of involvementBullets(i)) lines.push(`- ${b}`)
        lines.push('')
      }
    } else if (key === 'education' && r.education.some((e) => e.school)) {
      heading(sectionHeading(r, 'education'))
      for (const e of r.education) {
        if (!e.school) continue
        const dates = e.startDate || e.endDate ? ` *(${e.startDate} – ${e.endDate})*` : ''
        lines.push(`### ${[e.degree, e.school].filter(Boolean).join(', ')}${dates}`, '')
        const detail = educationDetailLine(e)
        if (detail) lines.push(detail, '')
      }
    } else if (key === 'coursework' && courseworkEntries(r).length > 0) {
      heading(sectionHeading(r, 'coursework'))
      for (const cw of courseworkEntries(r)) {
        lines.push(
          `### ${courseworkHeadingLine(cw)}${cw.date.trim() ? ` *(${cw.date.trim()})*` : ''}`,
          ''
        )
        for (const b of courseworkBullets(cw)) lines.push(`- ${b}`)
        lines.push('')
      }
    } else if (key === 'skills' && r.skills) {
      heading(sectionHeading(r, 'skills'))
      lines.push(r.skills)
    } else if (key === 'certifications' && (certEntries(r).length > 0 || r.certifications)) {
      heading(sectionHeading(r, 'certifications'))
      for (const c of certEntries(r)) {
        lines.push(
          `### ${certHeadingLine(c)}${c.date.trim() ? ` *(${c.date.trim()})*` : ''}`,
          ''
        )
        if (c.description.trim()) lines.push(c.description.trim(), '')
      }
      if (r.certifications) lines.push(r.certifications)
    } else if (key === 'awards' && awardEntries(r).length > 0) {
      heading(sectionHeading(r, 'awards'))
      for (const a of awardEntries(r)) {
        lines.push(
          `### ${awardHeadingLine(a)}${a.date.trim() ? ` *(${a.date.trim()})*` : ''}`,
          ''
        )
        for (const b of awardBullets(a)) lines.push(`- ${b}`)
        lines.push('')
      }
    } else if (key === 'publications' && publicationEntries(r).length > 0) {
      heading(sectionHeading(r, 'publications'))
      for (const p of publicationEntries(r)) {
        lines.push(
          `### ${publicationHeadingLine(p)}${p.date.trim() ? ` *(${p.date.trim()})*` : ''}`,
          ''
        )
        for (const b of publicationBullets(p)) lines.push(`- ${b}`)
        lines.push('')
      }
    } else if (key === 'references' && referenceEntries(r).length > 0) {
      heading(sectionHeading(r, 'references'))
      for (const x of referenceEntries(r)) {
        lines.push(`### ${referenceHeadingLine(x)}`, '')
        const detail = referenceDetailLine(x)
        if (detail) lines.push(`- ${detail}`, '')
      }
    } else if (key === 'military' && militaryEntries(r).length > 0) {
      heading(sectionHeading(r, 'military'))
      for (const m of militaryEntries(r)) {
        const dates = militaryDates(m)
        lines.push(`### ${militaryHeadingLine(m)}${dates ? ` *(${dates})*` : ''}`, '')
        for (const b of militaryBullets(m)) lines.push(`- ${b}`)
        lines.push('')
      }
    } else if (key === 'agents' && agentEntries(r).length > 0) {
      heading(sectionHeading(r, 'agents'))
      for (const a of agentEntries(r)) {
        lines.push(`### ${a.name.trim()}${a.date.trim() ? ` *(${a.date.trim()})*` : ''}`, '')
        for (const b of agentBullets(a)) lines.push(`- ${b}`)
        lines.push('')
      }
    } else if (key.startsWith('custom:')) {
      const s = r.customSections.find((x) => `custom:${x.id}` === key)
      if (!s || (!s.title.trim() && !s.bullets.some((b) => b.trim()))) continue
      heading(s.title.trim() || 'Additional')
      for (const b of s.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
