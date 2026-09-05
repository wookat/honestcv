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
const DOCS_BACKUP_KEY = 'honestcv.careerDocs.unreadable'

/**
 * When the stored documents list exists but cannot be read at all (corrupted
 * JSON or not an array), preserve the raw value under a backup key before any
 * write can overwrite it. Returns true when the stored list is unreadable.
 */
export function stashUnreadableDocs(): boolean {
  try {
    const raw = localStorage.getItem(DOCS_KEY)
    if (raw === null) return false
    try {
      if (Array.isArray(JSON.parse(raw))) return false
    } catch {
      // fall through — raw is unreadable
    }
    if (localStorage.getItem(DOCS_BACKUP_KEY) === null) {
      localStorage.setItem(DOCS_BACKUP_KEY, raw)
    }
    return true
  } catch {
    return false
  }
}

/** Returns false when nothing was written (storage full / private mode). */
function persistDocs(docs: CareerDoc[]): boolean {
  try {
    stashUnreadableDocs()
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs))
    return true
  } catch {
    return false
  }
}

const DOC_KINDS: CareerDocKind[] = ['cover', 'interview', 'resignation']

/**
 * Coerce an untrusted stored entry into a valid CareerDoc so one corrupted
 * element degrades to being dropped instead of hiding every document.
 * Returns null when the entry is not salvageable.
 */
function sanitizeCareerDoc(input: unknown): CareerDoc | null {
  if (typeof input !== 'object' || input === null) return null
  const raw = input as Record<string, unknown>
  if (typeof raw.id !== 'string' || !raw.id) return null
  if (typeof raw.text !== 'string' || !raw.text) return null
  const doc: CareerDoc = {
    id: raw.id,
    kind: DOC_KINDS.includes(raw.kind as CareerDocKind) ? (raw.kind as CareerDocKind) : 'cover',
    title: typeof raw.title === 'string' ? raw.title : '',
    text: raw.text,
    updatedAt: typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
  }
  if (typeof raw.signature === 'string' && raw.signature) doc.signature = raw.signature
  return doc
}

export function listCareerDocs(): CareerDoc[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((d) => {
      const doc = sanitizeCareerDoc(d)
      return doc ? [doc] : []
    })
  } catch {
    return []
  }
}

/** Returns null when the document could not be persisted (storage full). */
export function saveCareerDoc(kind: CareerDocKind, title: string, text: string): CareerDoc | null {
  const doc: CareerDoc = { id: newId(), kind, title, text, updatedAt: Date.now() }
  return persistDocs([doc, ...listCareerDocs()]) ? doc : null
}

export function updateCareerDoc(
  id: string,
  patch: Partial<Pick<CareerDoc, 'title' | 'text' | 'signature'>>
): CareerDoc[] | null {
  const docs = listCareerDocs().map((d) => {
    if (d.id !== id) return d
    const next = { ...d, ...patch, updatedAt: Date.now() }
    if ('signature' in patch && !patch.signature) delete next.signature
    return next
  })
  return persistDocs(docs) ? docs : null
}

/** Rename a document without touching its edited timestamp (organizational action). */
export function renameCareerDoc(id: string, title: string): CareerDoc[] | null {
  const docs = listCareerDocs().map((d) => (d.id === id ? { ...d, title } : d))
  return persistDocs(docs) ? docs : null
}

/** Copy a document under a numbered name ("base (2)", "base (3)", …). */
export function duplicateCareerDoc(id: string): CareerDoc[] | null {
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
  return persistDocs(next) ? next : null
}

export function deleteCareerDoc(id: string): CareerDoc[] | null {
  const docs = listCareerDocs().filter((d) => d.id !== id)
  return persistDocs(docs) ? docs : null
}

/** Put a just-deleted document back exactly as it was, at its previous position. */
export function restoreCareerDoc(doc: CareerDoc, index = 0): CareerDoc[] | null {
  const docs = listCareerDocs()
  if (docs.some((d) => d.id === doc.id)) return docs
  const at = Math.min(Math.max(index, 0), docs.length)
  const next = [...docs.slice(0, at), doc, ...docs.slice(at)]
  return persistDocs(next) ? next : null
}
