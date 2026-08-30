/**
 * Saved career documents (cover letters, interview prep briefs).
 * Stored in localStorage, same local-first model as resume copies.
 */

import { newId } from '@/lib/resume'

export type CareerDocKind = 'cover' | 'interview'

export interface CareerDoc {
  id: string
  kind: CareerDocKind
  title: string
  text: string
  updatedAt: number
}

const DOCS_KEY = 'honestcv.careerDocs'

function persistDocs(docs: CareerDoc[]) {
  try {
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs))
  } catch {
    // storage full / private mode — ignore
  }
}

export function listCareerDocs(): CareerDoc[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CareerDoc[]
    return Array.isArray(parsed) ? parsed.filter((d) => d.id && d.text) : []
  } catch {
    return []
  }
}

export function saveCareerDoc(kind: CareerDocKind, title: string, text: string): CareerDoc {
  const doc: CareerDoc = { id: newId(), kind, title, text, updatedAt: Date.now() }
  persistDocs([doc, ...listCareerDocs()])
  return doc
}

export function updateCareerDoc(id: string, patch: Partial<Pick<CareerDoc, 'title' | 'text'>>): CareerDoc[] {
  const docs = listCareerDocs().map((d) =>
    d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d
  )
  persistDocs(docs)
  return docs
}

export function deleteCareerDoc(id: string): CareerDoc[] {
  const docs = listCareerDocs().filter((d) => d.id !== id)
  persistDocs(docs)
  return docs
}
