/**
 * Saved career documents (cover letters, interview prep briefs).
 * Stored in localStorage, same local-first model as resume copies.
 */

import { newId } from '@/lib/resume'

export type CareerDocKind = 'cover' | 'interview' | 'resignation'

export interface CareerDoc {
  id: string
  kind: CareerDocKind
  title: string
  text: string
  updatedAt: number
  /** Signature image (PNG data URL); absent = unsigned letter */
  signature?: string
}

const CLOSING_RE =
  /^(sincerely|best regards|kind regards|regards|best|yours(\s+\w+)?|respectfully|with (gratitude|appreciation)|thank you|warm regards|cordially)[,，]?$/i

/**
 * Splits a letter at its closing salutation ("Sincerely," …) so a signature
 * image can sit between the salutation and the typed name. When no salutation
 * is found the letter is returned whole and the signature goes at the end.
 */
export function splitAtSignature(text: string): { before: string; after: string } {
  const lines = text.split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim()
    if (!t) continue
    if (t.length <= 30 && CLOSING_RE.test(t)) {
      return {
        before: lines.slice(0, i + 1).join('\n'),
        after: lines.slice(i + 1).join('\n').replace(/^\n+/, ''),
      }
    }
  }
  return { before: text, after: '' }
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

export function updateCareerDoc(
  id: string,
  patch: Partial<Pick<CareerDoc, 'title' | 'text' | 'signature'>>
): CareerDoc[] {
  const docs = listCareerDocs().map((d) => {
    if (d.id !== id) return d
    const next = { ...d, ...patch, updatedAt: Date.now() }
    if ('signature' in patch && !patch.signature) delete next.signature
    return next
  })
  persistDocs(docs)
  return docs
}

/** Rename a document without touching its edited timestamp (organizational action). */
export function renameCareerDoc(id: string, title: string): CareerDoc[] {
  const docs = listCareerDocs().map((d) => (d.id === id ? { ...d, title } : d))
  persistDocs(docs)
  return docs
}

/** Copy a document under a numbered name ("base (2)", "base (3)", …). */
export function duplicateCareerDoc(id: string): CareerDoc[] {
  const docs = listCareerDocs()
  const source = docs.find((d) => d.id === id)
  if (!source) return docs
  const taken = new Set(docs.map((d) => d.title))
  const base = source.title.replace(/ \((?:copy|\d+)\)$/, '')
  let title = ''
  for (let n = 2; !title; n++) {
    const candidate = `${base} (${n})`
    if (!taken.has(candidate)) title = candidate
  }
  const copy: CareerDoc = { ...source, id: newId(), title, updatedAt: Date.now() }
  const next = [copy, ...docs]
  persistDocs(next)
  return next
}

export function deleteCareerDoc(id: string): CareerDoc[] {
  const docs = listCareerDocs().filter((d) => d.id !== id)
  persistDocs(docs)
  return docs
}

/** Put a just-deleted document back exactly as it was, at its previous position. */
export function restoreCareerDoc(doc: CareerDoc, index = 0): CareerDoc[] {
  const docs = listCareerDocs()
  if (docs.some((d) => d.id === doc.id)) return docs
  const at = Math.min(Math.max(index, 0), docs.length)
  const next = [...docs.slice(0, at), doc, ...docs.slice(at)]
  persistDocs(next)
  return next
}
