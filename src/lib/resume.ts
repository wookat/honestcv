/**
 * Resume data model + localStorage persistence. All resume content lives in
 * the browser — nothing is stored on our servers.
 */

import { marksToMarkdown, stripInlineMarks, stripInlineMarksKeepLinks } from '@/lib/marks'

/** Contact fields that can be hidden without deleting the data */
export type HideableContactField = 'email' | 'phone' | 'location' | 'website' | 'linkedin'

export const HIDEABLE_CONTACT_FIELDS: HideableContactField[] = [
  'email',
  'phone',
  'location',
  'website',
  'linkedin',
]

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
  /** One short line of context about the company (industry, size, market) */
  companyInfo?: string
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Kept in the editor but left out of the rendered resume and exports */
  hidden?: boolean
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
  /** Page margins across preview, PDF and DOCX; default 0.75" */
  pageMargins?: 'narrow' | 'normal' | 'wide'
  /** Section divider rule; 'auto' follows the template */
  sectionDivider?: 'auto' | 'on' | 'off'
  /** Indent bullet lists relative to the section text */
  bulletIndent?: 'off' | 'on'
  /** Show small icons before contact fields (preview and PDF) */
  contactIcons?: 'off' | 'on'
  /** Stack consecutive roles at the same company under one company heading */
  groupByCompany?: 'off' | 'on'
  /** Body text color across preview, PDF and DOCX */
  textColor?: 'default' | 'black' | 'navy'
  /** JD keywords the user marked as not relevant — excluded from ATS keyword coverage */
  ignoredKeywords?: string[]
  /** Contact fields kept on file but left out of the rendered resume and exports */
  hiddenContact?: HideableContactField[]
  /** Sections kept auto-sorted newest-first as entries are added or re-dated */
  autoSortByDate?: AutoSortSection[]
  /** Per-section heading overrides keyed by section key; missing/empty = default label */
  sectionHeadings?: Partial<Record<string, string>>
  /** Target role + JD used for tailoring and the ATS score */
  targetRole: string
  jobDescription: string
  /** Candidate seniority for the target job; grounds AI drafts ('' = unset) */
  experienceLevel?:
    | ''
    | 'internship'
    | 'entry'
    | 'associate'
    | 'junior'
    | 'mid'
    | 'senior'
    | 'director'
    | 'executive'
  /** Company the resume targets; grounds AI drafts and prefills cover letters */
  targetCompany?: string
  /** Profile photo as a data:image/... URL; shown in the preview and PDF only */
  photo?: string
  /** Resume language: localizes default section headings and AI writer output */
  language?: ResumeLanguage
}

export interface ExperienceGroup {
  company: string
  /** True when the group stacks 2+ roles under a single company heading */
  grouped: boolean
  entries: ExperienceItem[]
}

/**
 * Group consecutive experience entries by company for the promotion view.
 * Empty companies never group; with `on` false every entry is its own group.
 */
export function experienceGroups(entries: ExperienceItem[], on: boolean): ExperienceGroup[] {
  const groups: ExperienceGroup[] = []
  for (const e of entries) {
    if (!e.company && !e.role) continue
    const prev = groups[groups.length - 1]
    const key = e.company.trim().toLowerCase()
    if (on && prev && key && prev.company.trim().toLowerCase() === key) prev.entries.push(e)
    else groups.push({ company: e.company, grouped: false, entries: [e] })
  }
  for (const g of groups) g.grouped = on && g.entries.length > 1
  return groups
}

/** Sections that support the persistent "Sort by date" toggle */
export type AutoSortSection = 'experience' | 'education'

export const AUTO_SORT_SECTIONS: AutoSortSection[] = ['experience', 'education']

export const newId = () => Math.random().toString(36).slice(2, 10)

export const EXPERIENCE_LEVELS = [
  'internship',
  'entry',
  'associate',
  'junior',
  'mid',
  'senior',
  'director',
  'executive',
] as const
export const EXPERIENCE_LEVEL_LABELS: Record<(typeof EXPERIENCE_LEVELS)[number], string> = {
  internship: 'Internship',
  entry: 'Entry level',
  associate: 'Associate',
  junior: 'Junior level',
  mid: 'Mid level',
  senior: 'Senior',
  director: 'Director',
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

/** Page margin in PDF points (72 pt = 1 inch). */
export const PAGE_MARGIN_PT = { narrow: 36, normal: 54, wide: 72 } as const

export const fontScaleOf = (r: Resume) => FONT_SCALE[r.fontScale ?? 'm']
export const pageMarginOf = (r: Resume) => PAGE_MARGIN_PT[r.pageMargins ?? 'normal']
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

export type ResumeLanguage = 'en' | 'es' | 'fr' | 'de' | 'pt'

/** Supported resume languages, code → native name (also shown to the LLM). */
export const RESUME_LANGUAGES: Record<ResumeLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
}

export const resumeLanguageOf = (r: Resume): ResumeLanguage =>
  r.language && r.language in RESUME_LANGUAGES ? r.language : 'en'

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

/** Default section headings per non-English language; keys mirror SECTION_LABELS. */
const SECTION_LABELS_I18N: Record<Exclude<ResumeLanguage, 'en'>, Record<string, string>> = {
  es: {
    summary: 'Resumen',
    experience: 'Experiencia',
    projects: 'Proyectos',
    involvement: 'Actividades',
    education: 'Educación',
    coursework: 'Cursos',
    skills: 'Habilidades',
    certifications: 'Certificaciones',
    awards: 'Premios y reconocimientos',
    publications: 'Publicaciones',
    references: 'Referencias',
    military: 'Servicio militar',
    agents: 'Agentes',
  },
  fr: {
    summary: 'Profil',
    experience: 'Expérience',
    projects: 'Projets',
    involvement: 'Engagements',
    education: 'Formation',
    coursework: 'Cours',
    skills: 'Compétences',
    certifications: 'Certifications',
    awards: 'Prix et distinctions',
    publications: 'Publications',
    references: 'Références',
    military: 'Service militaire',
    agents: 'Agents',
  },
  de: {
    summary: 'Profil',
    experience: 'Berufserfahrung',
    projects: 'Projekte',
    involvement: 'Engagement',
    education: 'Ausbildung',
    coursework: 'Kurse',
    skills: 'Kenntnisse',
    certifications: 'Zertifikate',
    awards: 'Auszeichnungen',
    publications: 'Publikationen',
    references: 'Referenzen',
    military: 'Militärdienst',
    agents: 'Agenten',
  },
  pt: {
    summary: 'Resumo',
    experience: 'Experiência',
    projects: 'Projetos',
    involvement: 'Atividades',
    education: 'Educação',
    coursework: 'Cursos',
    skills: 'Competências',
    certifications: 'Certificações',
    awards: 'Prêmios e distinções',
    publications: 'Publicações',
    references: 'Referências',
    military: 'Serviço militar',
    agents: 'Agentes',
  },
}

const CUSTOM_SECTION_FALLBACK: Record<ResumeLanguage, string> = {
  en: 'Custom section',
  es: 'Sección personalizada',
  fr: 'Section personnalisée',
  de: 'Eigener Abschnitt',
  pt: 'Seção personalizada',
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

/** Which section block should lead the resume, per the Rezi reorder guide. */
export type SectionEmphasis = 'education-first' | 'experience-first'

/**
 * Rezi's recommended emphasis for an experience level: students and new
 * graduates lead with education; every established tier leads with work
 * experience. No recommendation when the level is Auto.
 */
export function sectionEmphasisFor(
  level: Resume['experienceLevel']
): SectionEmphasis | null {
  if (!level) return null
  return level === 'internship' || level === 'entry'
    ? 'education-first'
    : 'experience-first'
}

/**
 * The current section order with only the emphasized block moved directly
 * after the summary; every other section keeps its relative order. Null when
 * there is no recommendation or the order already matches it.
 */
export function recommendedSectionOrder(r: Resume): string[] | null {
  const emphasis = sectionEmphasisFor(r.experienceLevel)
  if (!emphasis) return null
  const current = orderedSectionKeys(r)
  const block =
    emphasis === 'education-first' ? ['education', 'coursework'] : ['experience']
  const rest = current.filter((k) => !block.includes(k))
  const at = rest.indexOf('summary') + 1
  const next = [...rest.slice(0, at), ...block, ...rest.slice(at)]
  if (next.length === current.length && next.every((k, i) => k === current[i]))
    return null
  return next
}

export function sectionLabel(r: Resume, key: string): string {
  const lang = resumeLanguageOf(r)
  if (key.startsWith('custom:')) {
    const s = r.customSections.find((x) => `custom:${x.id}` === key)
    return s?.title.trim() || CUSTOM_SECTION_FALLBACK[lang]
  }
  if (lang !== 'en') {
    const localized = SECTION_LABELS_I18N[lang][key]
    if (localized) return localized
  }
  return SECTION_LABELS[key] ?? key
}

/** The heading rendered for a section: the user's override, else the default label. */
export function sectionHeading(r: Resume, key: string): string {
  const custom = (r.sectionHeadings?.[key] ?? '').trim()
  return custom || sectionLabel(r, key)
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
export const ONGOING_RE = /\b(present|current|now|ongoing)\b/i

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

/** Copy of the resume with hidden entries removed — for preview, exports, scoring, and sharing */
export function visibleResume(r: Resume): Resume {
  const hiddenContact = r.hiddenContact ?? []
  const contact = hiddenContact.length
    ? {
        ...r.contact,
        ...(Object.fromEntries(hiddenContact.map((f) => [f, ''])) as Partial<ContactInfo>),
      }
    : r.contact
  return {
    ...r,
    contact,
    experience: r.experience.filter((e) => !e.hidden),
    education: r.education.filter((e) => !e.hidden),
    projects: r.projects.filter((p) => !p.hidden),
    certItems: r.certItems?.filter((c) => !c.hidden),
    involvement: r.involvement?.filter((i) => !i.hidden),
    coursework: r.coursework?.filter((c) => !c.hidden),
    awards: r.awards?.filter((a) => !a.hidden),
    publications: r.publications?.filter((p) => !p.hidden),
    references: r.references?.filter((x) => !x.hidden),
    military: r.military?.filter((m) => !m.hidden),
    agents: r.agents?.filter((a) => !a.hidden),
  }
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
          'Led migration of the checkout flow to React + TypeScript, reducing cart abandonment by 12%.',
          'Built internal design-system components adopted by 5 product teams.',
          'Cut p95 page load time from 3.2s to 1.7s via code splitting and CDN caching.',
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
          'Developed REST APIs in Node.js powering order tracking for 300k customers.',
          'Automated regression test suite, cutting release QA time from 2 days to 4 hours.',
          'Instrumented checkout funnel analytics that surfaced a 9% drop-off recovered by a one-day fix.',
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
      ...(asStr(e.companyInfo) ? { companyInfo: asStr(e.companyInfo) } : {}),
      ...(e.hidden === true ? { hidden: true } : {}),
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
      ...(e.hidden === true ? { hidden: true } : {}),
    })),
    projects: asObjArr(raw.projects).map((p) => ({
      id: asStr(p.id) || newId(),
      name: asStr(p.name),
      link: asStr(p.link),
      description: asStr(p.description),
      org: asStr(p.org),
      startDate: asStr(p.startDate),
      endDate: asStr(p.endDate),
      ...(p.hidden === true ? { hidden: true } : {}),
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
      ...(c.hidden === true ? { hidden: true } : {}),
    })),
    involvement: asObjArr(raw.involvement).map((i) => ({
      id: asStr(i.id) || newId(),
      role: asStr(i.role),
      organization: asStr(i.organization),
      location: asStr(i.location),
      startDate: asStr(i.startDate),
      endDate: asStr(i.endDate),
      description: asStr(i.description),
      ...(i.hidden === true ? { hidden: true } : {}),
    })),
    coursework: asObjArr(raw.coursework).map((c) => ({
      id: asStr(c.id) || newId(),
      name: asStr(c.name),
      institution: asStr(c.institution),
      date: asStr(c.date),
      skill: asStr(c.skill),
      description: asStr(c.description),
      ...(c.hidden === true ? { hidden: true } : {}),
    })),
    awards: asObjArr(raw.awards).map((a) => ({
      id: asStr(a.id) || newId(),
      name: asStr(a.name),
      organization: asStr(a.organization),
      date: asStr(a.date),
      description: asStr(a.description),
      ...(a.hidden === true ? { hidden: true } : {}),
    })),
    publications: asObjArr(raw.publications).map((p) => ({
      id: asStr(p.id) || newId(),
      title: asStr(p.title),
      venue: asStr(p.venue),
      kind: asStr(p.kind).trim() ? asStr(p.kind) : undefined,
      date: asStr(p.date),
      description: asStr(p.description),
      ...(p.hidden === true ? { hidden: true } : {}),
    })),
    references: asObjArr(raw.references).map((x) => ({
      id: asStr(x.id) || newId(),
      name: asStr(x.name),
      title: asStr(x.title),
      employer: asStr(x.employer),
      email: asStr(x.email),
      phone: asStr(x.phone),
      kind: x.kind === 'personal' || x.kind === 'professional' ? x.kind : '',
      ...(x.hidden === true ? { hidden: true } : {}),
    })),
    military: asObjArr(raw.military).map((m) => ({
      id: asStr(m.id) || newId(),
      rank: asStr(m.rank),
      branch: asStr(m.branch),
      location: asStr(m.location),
      startDate: asStr(m.startDate),
      endDate: asStr(m.endDate),
      description: asStr(m.description),
      ...(m.hidden === true ? { hidden: true } : {}),
    })),
    agents: asObjArr(raw.agents).map((a) => ({
      id: asStr(a.id) || newId(),
      name: asStr(a.name),
      date: asStr(a.date),
      skills: asStr(a.skills),
      description: asStr(a.description),
      ...(a.hidden === true ? { hidden: true } : {}),
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
    hiddenContact: asStrArr(raw.hiddenContact).filter((f, i, arr): f is HideableContactField =>
      (HIDEABLE_CONTACT_FIELDS as string[]).includes(f) && arr.indexOf(f) === i
    ),
    autoSortByDate: asStrArr(raw.autoSortByDate).filter(
      (f, i, arr): f is AutoSortSection =>
        (AUTO_SORT_SECTIONS as string[]).includes(f) && arr.indexOf(f) === i
    ),
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
    pageMargins: asEnum(raw.pageMargins, ['narrow', 'normal', 'wide'] as const),
    sectionDivider: asEnum(raw.sectionDivider, ['auto', 'on', 'off'] as const),
    bulletIndent: asEnum(raw.bulletIndent, ['off', 'on'] as const),
    contactIcons: asEnum(raw.contactIcons, ['off', 'on'] as const),
    groupByCompany: asEnum(raw.groupByCompany, ['off', 'on'] as const),
    textColor: asEnum(raw.textColor, ['default', 'black', 'navy'] as const),
    language: asEnum(raw.language, ['en', 'es', 'fr', 'de', 'pt'] as const),
    targetRole: asStr(raw.targetRole),
    jobDescription: asStr(raw.jobDescription),
    experienceLevel: asEnum(raw.experienceLevel, EXPERIENCE_LEVELS),
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

const CORRUPT_BACKUP_KEY = 'honestcv.resume.unreadable'

/**
 * When a stored draft exists but cannot be read (corrupted JSON or an invalid
 * shape), preserve the raw value under a backup key before any save can
 * overwrite it. Returns true when the stored draft is unreadable.
 */
export function stashUnreadableDraft(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null || loadResume() !== null) return false
    if (localStorage.getItem(CORRUPT_BACKUP_KEY) === null) {
      localStorage.setItem(CORRUPT_BACKUP_KEY, raw)
    }
    return true
  } catch {
    return false
  }
}

export function saveResume(resume: Resume): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resume))
    return true
  } catch {
    // storage full / private mode
    return false
  }
}

/** Named saved copies of the resume, e.g. one tailored per job application. */
export interface ResumeVersion {
  id: string
  name: string
  updatedAt: number
  /** When the copy was first saved; older copies may lack it */
  createdAt?: number
  folder?: string
  data: Resume
}

const VERSIONS_KEY = 'honestcv.resumeVersions'
const VERSIONS_BACKUP_KEY = 'honestcv.resumeVersions.unreadable'

/**
 * When the stored copies list exists but cannot be read at all (corrupted
 * JSON or not an array), preserve the raw value under a backup key before any
 * write can overwrite it. Returns true when the stored list is unreadable.
 */
export function stashUnreadableVersions(): boolean {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY)
    if (raw === null) return false
    try {
      if (Array.isArray(JSON.parse(raw))) return false
    } catch {
      // fall through — raw is unreadable
    }
    if (localStorage.getItem(VERSIONS_BACKUP_KEY) === null) {
      localStorage.setItem(VERSIONS_BACKUP_KEY, raw)
    }
    return true
  } catch {
    return false
  }
}

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
      const createdAt =
        typeof v.createdAt === 'number' && Number.isFinite(v.createdAt) && v.createdAt > 0
          ? v.createdAt
          : undefined
      return [{ ...v, folder, createdAt, data }]
    })
  } catch {
    return []
  }
}

/** Returns false when nothing was written (storage full / private mode). */
function persistVersions(versions: ResumeVersion[]): boolean {
  try {
    stashUnreadableVersions()
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
    return true
  } catch {
    return false
  }
}

/** Returns null when the copy could not be persisted (storage full). */
export function saveResumeVersion(name: string, data: Resume): ResumeVersion[] | null {
  const existing = listResumeVersions()
  const versions = [
    {
      id: newId(),
      name: uniqueVersionName(name, existing),
      updatedAt: Date.now(),
      createdAt: Date.now(),
      data,
    },
    ...existing,
  ]
  return persistVersions(versions) ? versions : null
}

/** Save a new copy and return it (unlike saveResumeVersion, which returns the list). */
export function createResumeVersion(
  name: string,
  data: Resume,
  folder?: string
): ResumeVersion | null {
  const version: ResumeVersion = {
    id: newId(),
    name: uniqueVersionName(name, listResumeVersions()),
    updatedAt: Date.now(),
    createdAt: Date.now(),
    ...(folder?.trim() ? { folder: folder.trim() } : {}),
    data,
  }
  return persistVersions([version, ...listResumeVersions()]) ? version : null
}

export function renameResumeVersion(id: string, name: string): ResumeVersion[] | null {
  const versions = listResumeVersions().map((v) => (v.id === id ? { ...v, name } : v))
  return persistVersions(versions) ? versions : null
}

/** Organizational changes (name/folder) keep the edit timestamp; only content changes bump it. */
export function updateResumeVersion(
  id: string,
  patch: { name?: string; folder?: string; data?: Resume }
): ResumeVersion[] | null {
  const versions = listResumeVersions().map((v) => {
    if (v.id !== id) return v
    const contentChanged =
      patch.data !== undefined &&
      JSON.stringify(sanitizeResume(patch.data)) !== JSON.stringify(sanitizeResume(v.data))
    return { ...v, ...patch, ...(contentChanged ? { updatedAt: Date.now() } : {}) }
  })
  return persistVersions(versions) ? versions : null
}

/** Copies need distinct names; number a new copy when its name is already taken. */
function uniqueVersionName(name: string, existing: readonly ResumeVersion[]): string {
  const taken = new Set(existing.map((v) => v.name))
  return taken.has(name) ? duplicateName(name, taken) : name
}

function duplicateName(source: string, taken: Set<string>): string {
  const base = source.replace(/ \((?:copy|\d+)\)$/, '')
  for (let n = 2; ; n++) {
    const candidate = `${base} (${n})`
    if (!taken.has(candidate)) return candidate
  }
}

export function duplicateResumeVersion(id: string): ResumeVersion[] | null {
  const existing = listResumeVersions()
  const source = existing.find((v) => v.id === id)
  if (!source) return existing
  const name = duplicateName(source.name, new Set(existing.map((v) => v.name)))
  const versions = [
    { ...source, id: newId(), name, updatedAt: Date.now(), createdAt: Date.now() },
    ...existing,
  ]
  return persistVersions(versions) ? versions : null
}

export function deleteResumeVersion(id: string): ResumeVersion[] | null {
  const versions = listResumeVersions().filter((v) => v.id !== id)
  return persistVersions(versions) ? versions : null
}

export function deleteResumeVersions(ids: readonly string[]): ResumeVersion[] | null {
  const drop = new Set(ids)
  const versions = listResumeVersions().filter((v) => !drop.has(v.id))
  return persistVersions(versions) ? versions : null
}

/** Put a just-deleted copy back exactly as it was, at its previous position. */
export function restoreResumeVersion(version: ResumeVersion, index = 0): ResumeVersion[] | null {
  const versions = listResumeVersions()
  if (versions.some((v) => v.id === version.id)) return versions
  const at = Math.min(Math.max(index, 0), versions.length)
  const next = [...versions.slice(0, at), version, ...versions.slice(at)]
  return persistVersions(next) ? next : null
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

/** Write the draft back into its linked copy; unlink if the copy is gone.
 * Returns false when the copy write failed (storage full). */
export function syncActiveVersion(data: Resume): boolean {
  const id = getActiveVersionId()
  if (!id) return true
  const versions = listResumeVersions()
  if (!versions.some((v) => v.id === id)) {
    setActiveVersionId(null)
    return true
  }
  return persistVersions(
    versions.map((v) => (v.id === id ? { ...v, data, updatedAt: Date.now() } : v))
  )
}

/** Automatic edit-history checkpoints of the single builder draft. */
export interface ResumeSnapshot {
  id: string
  at: number
  /** Copy the draft was linked to at capture time; null/absent = unlinked draft. */
  versionId?: string | null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistHistory(snapshots: ResumeSnapshot[]): boolean {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(snapshots.slice(0, HISTORY_MAX)))
    return true
  } catch {
    return false
  }
}

/**
 * Records a checkpoint of the draft. Skipped when the newest checkpoint is
 * identical, or (unless `force`) younger than the 10-minute gap.
 * Returns the updated list, or null when the write failed.
 */
export function recordResumeSnapshot(data: Resume, force = false): ResumeSnapshot[] | null {
  const history = listResumeHistory()
  const versionId = getActiveVersionId()
  const newest = history.find((s) => (s.versionId ?? null) === versionId)
  const json = JSON.stringify(data)
  if (newest) {
    if (JSON.stringify(newest.data) === json) return history
    if (!force && Date.now() - newest.at < HISTORY_MIN_GAP_MS) return history
  }
  const next = [
    { id: newId(), at: Date.now(), versionId, data: JSON.parse(json) as Resume },
    ...history,
  ]
  return persistHistory(next) ? next.slice(0, HISTORY_MAX) : null
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
  const companyInfo = asStr(e.companyInfo)
  if (companyInfo) item.companyInfo = companyInfo
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

/** Returns false when nothing was written (storage full / private mode). */
function persistExperienceLibrary(items: SavedExperience[]): boolean {
  try {
    localStorage.setItem(
      EXPERIENCE_LIBRARY_KEY,
      JSON.stringify(items.slice(0, EXPERIENCE_LIBRARY_MAX))
    )
    return true
  } catch {
    return false
  }
}

export function saveExperienceToLibrary(entry: ExperienceItem): SavedExperience[] | null {
  const data = sanitizeExperienceItem(entry)
  if (!data) return listExperienceLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listExperienceLibrary(),
  ].slice(0, EXPERIENCE_LIBRARY_MAX)
  return persistExperienceLibrary(items) ? items : null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistEducationLibrary(items: SavedEducation[]): boolean {
  try {
    localStorage.setItem(EDUCATION_LIBRARY_KEY, JSON.stringify(items.slice(0, EDUCATION_LIBRARY_MAX)))
    return true
  } catch {
    return false
  }
}

export function saveEducationToLibrary(entry: EducationItem): SavedEducation[] | null {
  const data = sanitizeEducationItem(entry)
  if (!data) return listEducationLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listEducationLibrary(),
  ].slice(0, EDUCATION_LIBRARY_MAX)
  return persistEducationLibrary(items) ? items : null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistProjectLibrary(items: SavedProject[]): boolean {
  try {
    localStorage.setItem(PROJECT_LIBRARY_KEY, JSON.stringify(items.slice(0, PROJECT_LIBRARY_MAX)))
    return true
  } catch {
    return false
  }
}

export function saveProjectToLibrary(entry: ProjectItem): SavedProject[] | null {
  const data = sanitizeProjectItem(entry)
  if (!data) return listProjectLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listProjectLibrary(),
  ].slice(0, PROJECT_LIBRARY_MAX)
  return persistProjectLibrary(items) ? items : null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistInvolvementLibrary(items: SavedInvolvement[]): boolean {
  try {
    localStorage.setItem(
      INVOLVEMENT_LIBRARY_KEY,
      JSON.stringify(items.slice(0, INVOLVEMENT_LIBRARY_MAX))
    )
    return true
  } catch {
    return false
  }
}

export function saveInvolvementToLibrary(entry: InvolvementItem): SavedInvolvement[] | null {
  const data = sanitizeInvolvementItem(entry)
  if (!data) return listInvolvementLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listInvolvementLibrary(),
  ].slice(0, INVOLVEMENT_LIBRARY_MAX)
  return persistInvolvementLibrary(items) ? items : null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistCourseworkLibrary(items: SavedCoursework[]): boolean {
  try {
    localStorage.setItem(
      COURSEWORK_LIBRARY_KEY,
      JSON.stringify(items.slice(0, COURSEWORK_LIBRARY_MAX))
    )
    return true
  } catch {
    return false
  }
}

export function saveCourseworkToLibrary(entry: CourseworkItem): SavedCoursework[] | null {
  const data = sanitizeCourseworkItem(entry)
  if (!data) return listCourseworkLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listCourseworkLibrary(),
  ].slice(0, COURSEWORK_LIBRARY_MAX)
  return persistCourseworkLibrary(items) ? items : null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistAwardLibrary(items: SavedAward[]): boolean {
  try {
    localStorage.setItem(AWARD_LIBRARY_KEY, JSON.stringify(items.slice(0, AWARD_LIBRARY_MAX)))
    return true
  } catch {
    return false
  }
}

export function saveAwardToLibrary(entry: AwardItem): SavedAward[] | null {
  const data = sanitizeAwardItem(entry)
  if (!data) return listAwardLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listAwardLibrary(),
  ].slice(0, AWARD_LIBRARY_MAX)
  return persistAwardLibrary(items) ? items : null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistReferenceLibrary(items: SavedReference[]): boolean {
  try {
    localStorage.setItem(
      REFERENCE_LIBRARY_KEY,
      JSON.stringify(items.slice(0, REFERENCE_LIBRARY_MAX))
    )
    return true
  } catch {
    return false
  }
}

export function saveReferenceToLibrary(entry: ReferenceItem): SavedReference[] | null {
  const data = sanitizeReferenceItem(entry)
  if (!data) return listReferenceLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listReferenceLibrary(),
  ].slice(0, REFERENCE_LIBRARY_MAX)
  return persistReferenceLibrary(items) ? items : null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistCertLibrary(items: SavedCertification[]): boolean {
  try {
    localStorage.setItem(CERT_LIBRARY_KEY, JSON.stringify(items.slice(0, CERT_LIBRARY_MAX)))
    return true
  } catch {
    return false
  }
}

export function saveCertToLibrary(entry: CertificationItem): SavedCertification[] | null {
  const data = sanitizeCertificationItem(entry)
  if (!data) return listCertLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listCertLibrary(),
  ].slice(0, CERT_LIBRARY_MAX)
  return persistCertLibrary(items) ? items : null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistPublicationLibrary(items: SavedPublication[]): boolean {
  try {
    localStorage.setItem(
      PUBLICATION_LIBRARY_KEY,
      JSON.stringify(items.slice(0, PUBLICATION_LIBRARY_MAX))
    )
    return true
  } catch {
    return false
  }
}

export function savePublicationToLibrary(entry: PublicationItem): SavedPublication[] | null {
  const data = sanitizePublicationItem(entry)
  if (!data) return listPublicationLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), data: { ...data, id: newId() } },
    ...listPublicationLibrary(),
  ].slice(0, PUBLICATION_LIBRARY_MAX)
  return persistPublicationLibrary(items) ? items : null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistSkillsLibrary(items: SavedSkills[]): boolean {
  try {
    localStorage.setItem(SKILLS_LIBRARY_KEY, JSON.stringify(items.slice(0, SKILLS_LIBRARY_MAX)))
    return true
  } catch {
    return false
  }
}

export function saveSkillsToLibrary(skills: string): SavedSkills[] | null {
  if (!skills.trim()) return listSkillsLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), skills },
    ...listSkillsLibrary(),
  ].slice(0, SKILLS_LIBRARY_MAX)
  return persistSkillsLibrary(items) ? items : null
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

/** Returns false when nothing was written (storage full / private mode). */
function persistSummaryLibrary(items: SavedSummary[]): boolean {
  try {
    localStorage.setItem(SUMMARY_LIBRARY_KEY, JSON.stringify(items.slice(0, SUMMARY_LIBRARY_MAX)))
    return true
  } catch {
    return false
  }
}

export function saveSummaryToLibrary(summary: string): SavedSummary[] | null {
  if (!summary.trim()) return listSummaryLibrary()
  const items = [
    { id: newId(), savedAt: Date.now(), summary },
    ...listSummaryLibrary(),
  ].slice(0, SUMMARY_LIBRARY_MAX)
  return persistSummaryLibrary(items) ? items : null
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

/** Minor/GPA tail of the detail line, with a leading separator when present. */
export function educationDetailSuffix(e: EducationItem): string {
  const tail = [
    e.minor?.trim() ? `Minor in ${e.minor.trim()}` : '',
    e.gpa?.trim() ? `GPA: ${e.gpa.trim()}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  return tail ? ` · ${tail}` : ''
}

/** Date range for an experience entry — a blank end date on an ongoing role reads "start – Present" */
export function experienceDateRange(startDate: string, endDate: string): string {
  const start = startDate.trim()
  const end = endDate.trim()
  if (start && !end) return `${start} – Present`
  return [start, end].filter(Boolean).join(' – ')
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

/**
 * Replace the `index`-th non-empty line of a multi-line description with
 * `next`, or delete that line when `next` is empty. Other lines untouched.
 */
export function editDescriptionLine(description: string, index: number, next: string): string {
  let seen = -1
  const out: string[] = []
  for (const l of description.split('\n')) {
    if (l.trim()) {
      seen++
      if (seen === index) {
        if (next) out.push(next)
        continue
      }
    }
    out.push(l)
  }
  return out.join('\n')
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

/** Skills recorded on a coursework entry: comma-separated, capped at 3. */
export const courseworkSkills = (c: CourseworkItem): string[] =>
  c.skill.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3)

/** Bullets for a coursework entry: skills line (when set) + description lines */
export const courseworkBullets = (c: CourseworkItem): string[] => {
  const skills = courseworkSkills(c)
  return [
    ...(skills.length > 1
      ? [`Skills: ${skills.join(' · ')}`]
      : skills.length === 1
        ? [`Skill: ${skills[0]}`]
        : []),
    ...c.description.split('\n').map((l) => l.trim()).filter(Boolean),
  ]
}

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

const SKILL_CATEGORIES: { label: string; terms: string[] }[] = [
  {
    label: 'Languages',
    terms: [
      'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 'go', 'golang',
      'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'dart', 'elixir',
      'haskell', 'perl', 'lua', 'objective-c', 'matlab', 'sql', 'html', 'css',
      'sass', 'scss', 'bash', 'shell', 'powershell', 'solidity', 'clojure',
    ],
  },
  {
    label: 'Frameworks & libraries',
    terms: [
      'react', 'react native', 'next.js', 'nextjs', 'vue', 'vue.js', 'nuxt',
      'angular', 'svelte', 'node', 'node.js', 'nodejs', 'express', 'nestjs',
      'django', 'flask', 'fastapi', 'rails', 'ruby on rails', 'spring',
      'spring boot', 'laravel', 'symfony', '.net', 'asp.net', 'flutter',
      'jquery', 'redux', 'tailwind', 'tailwind css', 'bootstrap', 'graphql',
      'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
      'langchain', 'electron', 'vite', 'webpack', 'remix', 'astro', 'hono',
    ],
  },
  {
    label: 'Cloud & DevOps',
    terms: [
      'aws', 'azure', 'gcp', 'google cloud', 'cloudflare', 'heroku', 'vercel',
      'netlify', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible',
      'jenkins', 'github actions', 'gitlab ci', 'circleci', 'ci/cd', 'cicd',
      'linux', 'nginx', 'serverless', 'lambda', 'ec2', 's3', 'pulumi',
      'prometheus', 'grafana', 'datadog', 'helm',
    ],
  },
  {
    label: 'Databases',
    terms: [
      'postgresql', 'postgres', 'mysql', 'sqlite', 'mongodb', 'redis',
      'elasticsearch', 'dynamodb', 'cassandra', 'oracle', 'sql server',
      'mariadb', 'firebase', 'firestore', 'supabase', 'snowflake', 'bigquery',
      'redshift', 'neo4j', 'clickhouse', 'kafka', 'rabbitmq',
    ],
  },
  {
    label: 'Tools',
    terms: [
      'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'figma',
      'sketch', 'photoshop', 'illustrator', 'excel', 'power bi', 'tableau',
      'looker', 'postman', 'jest', 'cypress', 'playwright', 'selenium',
      'storybook', 'vs code', 'intellij', 'xcode', 'android studio', 'notion',
      'slack', 'salesforce', 'hubspot', 'google analytics', 'segment',
    ],
  },
  {
    label: 'Practices',
    terms: [
      'agile', 'scrum', 'kanban', 'tdd', 'test-driven development', 'bdd',
      'pair programming', 'code review', 'microservices', 'rest', 'rest apis',
      'restful apis', 'api design', 'system design', 'oop', 'design patterns',
      'accessibility', 'a11y', 'seo', 'responsive design', 'unit testing',
      'integration testing', 'e2e testing', 'devops', 'observability',
      'project management', 'product management', 'data analysis',
      'machine learning', 'deep learning', 'nlp', 'a/b testing', 'etl',
      'user research', 'ux design', 'ui design', 'wireframing', 'prototyping',
    ],
  },
]

/**
 * Deterministic grouping of a flat skills list into `Category: a, b` lines.
 * Returns null when the list is already categorized, too short (<8 skills),
 * or too unfamiliar to bucket confidently (less than half recognized).
 */
export function categorizeSkills(skills: string): string | null {
  const lines = skills.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.some((line) => /^[^:]{1,40}:\s*.+$/.test(line)) && lines.length > 1) return null
  const terms = skills.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
  if (terms.length < 8) return null
  const buckets = new Map<string, string[]>()
  let recognized = 0
  for (const term of terms) {
    const lower = term.toLowerCase()
    const cat = SKILL_CATEGORIES.find((c) => c.terms.includes(lower))
    const label = cat?.label ?? 'Other'
    if (cat) recognized++
    const list = buckets.get(label) ?? []
    if (!list.some((t) => t.toLowerCase() === lower)) list.push(term)
    buckets.set(label, list)
  }
  const namedBuckets = [...buckets.keys()].filter((k) => k !== 'Other').length
  if (recognized * 2 < terms.length || namedBuckets < 2) return null
  const ordered = [
    ...SKILL_CATEGORIES.map((c) => c.label).filter((l) => buckets.has(l)),
    ...(buckets.has('Other') ? ['Other'] : []),
  ]
  return ordered.map((l) => `${l}: ${buckets.get(l)!.join(', ')}`).join('\n')
}

/**
 * Merge new skills into a skills text block without destroying its line/category
 * structure. Dedupes case-insensitively against every existing item (category
 * labels excluded). Multi-line or labeled blocks keep their lines and get the
 * additions on a new line; a single plain line grows in place.
 */
export function mergeSkills(existing: string, added: string[]): string {
  const lines = existing.split('\n').map((l) => l.trim()).filter(Boolean)
  const items = lines.flatMap((line) => {
    const m = line.match(/^[^:]{1,40}:\s*(.+)$/)
    return (m ? m[1] : line).split(',').map((s) => s.trim()).filter(Boolean)
  })
  const have = new Set(items.map((s) => s.toLowerCase()))
  const fresh: string[] = []
  for (const s of added) {
    const t = s.trim()
    if (!t || have.has(t.toLowerCase())) continue
    have.add(t.toLowerCase())
    fresh.push(t)
  }
  if (fresh.length === 0) return existing
  if (lines.length === 0) return fresh.join(', ')
  if (lines.length === 1 && !/^[^:]{1,40}:\s*.+$/.test(lines[0]))
    return `${lines[0]}, ${fresh.join(', ')}`
  return [...lines, fresh.join(', ')].join('\n')
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
export function resumeToPlainText(r: Resume, opts?: { keepLinkUrls?: boolean }): string {
  const lines: string[] = []
  const c = r.contact
  lines.push([c.fullName, c.title].filter(Boolean).join(' — '))
  lines.push([c.email, c.phone, c.location, c.website, c.linkedin].filter(Boolean).join(' | '))
  for (const key of orderedSectionKeys(r)) {
    if (key === 'summary' && r.summary) {
      lines.push('', sectionHeading(r, 'summary').toUpperCase(), r.summary)
    } else if (key === 'experience' && r.experience.some((e) => e.company || e.role)) {
      lines.push('', sectionHeading(r, 'experience').toUpperCase())
      for (const g of experienceGroups(r.experience, r.groupByCompany === 'on')) {
        if (g.grouped) lines.push(g.company.trim())
        for (const e of g.entries) {
          lines.push(
            (g.grouped
              ? e.role || 'Role'
              : [e.role, e.company].filter(Boolean).join(' at ')) +
              (e.startDate || e.endDate
                ? ` (${experienceDateRange(e.startDate, e.endDate)})`
                : '')
          )
          if (e.companyInfo?.trim()) lines.push(e.companyInfo.trim())
          for (const b of e.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
        }
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
            (e.startDate || e.endDate
              ? ` (${[e.startDate, e.endDate].filter(Boolean).join(' – ')})`
              : '')
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
  const strip = opts?.keepLinkUrls ? stripInlineMarksKeepLinks : stripInlineMarks
  return lines.map((l) => strip(l)).join('\n')
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
      for (const g of experienceGroups(r.experience, r.groupByCompany === 'on')) {
        if (g.grouped) lines.push(`### ${g.company.trim()}`, '')
        for (const e of g.entries) {
          const dates =
            e.startDate || e.endDate
              ? ` *(${experienceDateRange(e.startDate, e.endDate)})*`
              : ''
          const title = g.grouped
            ? e.role || 'Role'
            : [e.role, e.company].filter(Boolean).join(' — ')
          lines.push(`${g.grouped ? '####' : '###'} ${title}${dates}`, '')
          if (e.companyInfo?.trim()) lines.push(`*${e.companyInfo.trim()}*`, '')
          for (const b of e.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
          lines.push('')
        }
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
        const dates =
          e.startDate || e.endDate
            ? ` *(${[e.startDate, e.endDate].filter(Boolean).join(' – ')})*`
            : ''
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
  return (
    lines
      .map((l) => marksToMarkdown(l))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  )
}
