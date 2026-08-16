/**
 * Import from the suite's Resume Center (resume-forge) via its public
 * ResumeProfile v1 export contract: GET {RESUME_CENTER_API}/api/export/:shareId
 * Only resumes the user explicitly shared are exportable.
 */
import { newId, emptyResume, type Resume } from './resume'

export const RESUME_CENTER_API = 'https://resume-forge.wookat520.workers.dev'

interface RCEducation {
  school?: string
  degree?: string
  major?: string
  startDate?: string
  endDate?: string
  gpa?: string
}
interface RCExperience {
  company?: string
  title?: string
  startDate?: string
  endDate?: string
  description?: string
}
interface RCProject {
  name?: string
  role?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface ResumeProfileV1 {
  schemaVersion: 1
  title?: string
  basics?: {
    fullName?: string
    phone?: string
    email?: string
    currentCity?: string
  }
  summary?: string
  education?: RCEducation[]
  experience?: RCExperience[]
  projects?: RCProject[]
  skills?: string[]
  certificates?: string[]
  languages?: { name?: string; level?: string }[]
  awards?: string[]
  customSections?: { heading?: string; content?: string }[]
  expected?: { position?: string }
}

export function isResumeProfileV1(input: unknown): input is ResumeProfileV1 {
  if (typeof input !== 'object' || input === null) return false
  const p = input as Record<string, unknown>
  return p.schemaVersion === 1 && typeof p.basics === 'object' && p.basics !== null
}

/** Accepts a share URL (…/s/:id or …/api/export/:id) or a bare share id. */
export function parseShareId(raw: string): string | null {
  const t = raw.trim()
  const m = t.match(/(?:\/s\/|\/api\/export\/)([A-Za-z0-9-]+)/)
  if (m) return m[1]
  if (/^[A-Za-z0-9-]{4,64}$/.test(t)) return t
  return null
}

export function resumeFromProfile(rp: ResumeProfileV1): Resume {
  const r = emptyResume()
  r.contact = {
    ...r.contact,
    fullName: rp.basics?.fullName ?? '',
    title: rp.expected?.position ?? '',
    email: rp.basics?.email ?? '',
    phone: rp.basics?.phone ?? '',
    location: rp.basics?.currentCity ?? '',
  }
  r.summary = rp.summary ?? ''
  r.experience = (rp.experience ?? []).map((e) => ({
    id: newId(),
    company: e.company ?? '',
    role: e.title ?? '',
    location: '',
    startDate: e.startDate ?? '',
    endDate: e.endDate ?? '',
    bullets: (e.description ?? '').split('\n').filter(Boolean),
  }))
  r.education = (rp.education ?? []).map((e) => ({
    id: newId(),
    school: e.school ?? '',
    degree: [e.degree, e.major].filter(Boolean).join(', '),
    location: '',
    startDate: e.startDate ?? '',
    endDate: e.endDate ?? '',
    details: e.gpa ? `GPA: ${e.gpa}` : '',
  }))
  r.projects = (rp.projects ?? []).map((p) => ({
    id: newId(),
    name: [p.name, p.role].filter(Boolean).join(' — '),
    link: '',
    description: p.description ?? '',
  }))
  r.skills = (rp.skills ?? []).join(', ')
  r.certifications = [...(rp.certificates ?? []), ...(rp.awards ?? [])].join(', ')
  const langs = (rp.languages ?? [])
    .map((l) => [l.name, l.level].filter(Boolean).join(': '))
    .filter(Boolean)
  const custom = (rp.customSections ?? []).filter((s) => s.heading && s.content)
  r.customSections = [
    ...(langs.length ? [{ id: newId(), title: 'Languages', bullets: langs }] : []),
    ...custom.map((s) => ({
      id: newId(),
      title: s.heading as string,
      bullets: (s.content as string).split('\n').filter(Boolean),
    })),
  ]
  r.sectionOrder = [...r.sectionOrder, ...r.customSections.map((s) => `custom:${s.id}`)]
  return r
}

export async function fetchResumeProfile(shareId: string): Promise<ResumeProfileV1> {
  const res = await fetch(`${RESUME_CENTER_API}/api/export/${encodeURIComponent(shareId)}`)
  if (res.status === 404) throw new Error('Share link not found or expired — generate a new one in Resume Center.')
  if (!res.ok) throw new Error(`Resume Center request failed (${res.status}).`)
  const data: unknown = await res.json()
  if (!isResumeProfileV1(data)) throw new Error('Unexpected data format from Resume Center.')
  return data
}
