/**
 * Role-specific letter examples (cover + resignation), fully browser-local.
 * Every fact slot is an explicit [placeholder] — nothing invented; the user
 * fills them in after loading the example into Career documents.
 * Data lives in letterExamples.data.json so the build-time SEO pages
 * (scripts/build-seo.mjs) can render the same letters without duplication.
 */

import type { CareerDocKind } from '@/lib/documents'
import { ONGOING_RE, type Resume } from '@/lib/resume'
import data from '@/lib/letterExamples.data.json'

export interface LetterExample {
  slug: string
  role: string
  kind: Extract<CareerDocKind, 'cover' | 'resignation'>
  text: string
}

export const LETTER_EXAMPLES: LetterExample[] = data.map((e) => ({
  slug: e.slug,
  role: e.role,
  kind: e.kind === 'resignation' ? 'resignation' : 'cover',
  text: e.text,
}))

/**
 * Fill an example's placeholder slots with facts the resume already knows
 * (name, target company, current employer/role). Slots without a known value
 * keep their [placeholder] so the placeholder counter stays honest.
 */
export function seedLetterExample(
  text: string,
  kind: LetterExample['kind'],
  resume: Resume
): string {
  const ongoing = resume.experience.find(
    (e) => !e.hidden && e.company.trim() && (!e.endDate.trim() || ONGOING_RE.test(e.endDate))
  )
  const name = resume.contact.fullName.trim()
  const currentCompany = ongoing?.company.trim() ?? ''
  const slots: Record<string, string> =
    kind === 'cover'
      ? {
          '[Company]': (resume.targetCompany ?? '').trim(),
          '[Facility]': (resume.targetCompany ?? '').trim(),
          '[Current company]': currentCompany,
          '[Current facility]': currentCompany,
          '[Your name]': name,
        }
      : {
          '[Company]': currentCompany,
          '[Job title]': ongoing?.role.trim() ?? '',
          '[Your name]': name,
        }
  let out = text
  for (const [slot, value] of Object.entries(slots)) {
    if (value) out = out.split(slot).join(value)
  }
  return out
}
