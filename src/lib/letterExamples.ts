/**
 * Role-specific letter examples (cover + resignation), fully browser-local.
 * Every fact slot is an explicit [placeholder] — nothing invented; the user
 * fills them in after loading the example into Career documents.
 * Data lives in letterExamples.data.json so the build-time SEO pages
 * (scripts/build-seo.mjs) can render the same letters without duplication.
 */

import type { CareerDocKind } from '@/lib/documents'
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
