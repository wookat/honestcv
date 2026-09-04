/** Shareable read-only resume links (Worker KV snapshots). */

import { licenseHeaders } from '@/lib/license'
import { type Resume, sanitizeResume } from '@/lib/resume'

const SHARE_LINKS_KEY = 'honestcv.shareLinks'
const LEGACY_SHARE_LINK_KEY = 'honestcv.shareLink'

/** A resume copy id, or 'draft' for the unlinked working draft. */
export type ShareScope = string

export interface ShareLink {
  id: string
  token: string
  url: string
  sharedAt: number
}

function isShareLink(v: unknown): v is ShareLink {
  if (typeof v !== 'object' || v === null) return false
  const link = v as Record<string, unknown>
  return (
    typeof link.id === 'string' && typeof link.token === 'string' && typeof link.url === 'string'
  )
}

function loadShareLinks(): Record<ShareScope, ShareLink> {
  try {
    const raw = localStorage.getItem(SHARE_LINKS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return {}
    const map: Record<ShareScope, ShareLink> = {}
    for (const [scope, link] of Object.entries(parsed)) {
      if (isShareLink(link)) map[scope] = link
    }
    return map
  } catch {
    return {}
  }
}

/** Each copy owns its link; the pre-R366 single global link is attributed to
 *  the scope that first reads it — the copy the user is looking at, which is
 *  exactly the link the old dialog showed there. */
export function loadShareLink(scope: ShareScope): ShareLink | null {
  const links = loadShareLinks()
  const legacyRaw = localStorage.getItem(LEGACY_SHARE_LINK_KEY)
  if (legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw) as unknown
      if (isShareLink(legacy) && !links[scope]) {
        links[scope] = { ...legacy, sharedAt: typeof legacy.sharedAt === 'number' ? legacy.sharedAt : Date.now() }
        localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(links))
      }
    } catch {
      // malformed legacy record — drop it
    }
    localStorage.removeItem(LEGACY_SHARE_LINK_KEY)
  }
  return links[scope] ?? null
}

function persistShareLink(scope: ShareScope, link: ShareLink | null) {
  const links = loadShareLinks()
  if (link) links[scope] = link
  else delete links[scope]
  try {
    localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(links))
  } catch {
    // storage full / private mode — ignore
  }
}

/** Lowercase letters, numbers and hyphens, 3-40 chars, no edge hyphens. */
export const SHARE_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

/** Publish a snapshot of the resume; re-publishing keeps the copy's URL.
 *  A slug (only used when creating a new link) requests a custom URL. */
export async function createShareLink(
  resume: Resume,
  scope: ShareScope,
  slug?: string
): Promise<ShareLink> {
  const prev = loadShareLink(scope)
  let res: Response
  try {
    res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...licenseHeaders() },
      body: JSON.stringify({
        resume,
        ...(prev ? { id: prev.id, token: prev.token } : slug ? { slug } : {}),
      }),
    })
  } catch {
    throw new Error('Creating the link failed — check your connection and try again.')
  }
  const data = (await res.json().catch(() => ({}))) as {
    id?: string
    token?: string
    url?: string
    error?: string
  }
  if (!res.ok || !data.id || !data.token || !data.url) {
    // 4xx errors carry user-facing messages (slug taken, invalid resume, …);
    // anything else gets a friendly retry message instead of raw server text.
    const clientMessage = res.status >= 400 && res.status < 500 ? data.error : undefined
    throw new Error(clientMessage || `Creating the link failed (${res.status}). Try again.`)
  }
  const link: ShareLink = { id: data.id, token: data.token, url: data.url, sharedAt: Date.now() }
  persistShareLink(scope, link)
  return link
}

async function revokeRemote(id: string, token: string): Promise<void> {
  let res: Response
  try {
    res = await fetch(`/api/share/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-share-token': token },
    })
  } catch {
    throw new Error('Turning off the link failed — check your connection and try again.')
  }
  // 404/410 mean the link is already gone, which is what revoking wants.
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Turning off the link failed (${res.status}). Try again.`)
  }
}

/** Revoke a copy's link: the local record is only forgotten once the server
 *  confirms the delete, so a failed revoke stays visible and retryable. */
export async function revokeShareLink(scope: ShareScope): Promise<void> {
  const link = loadShareLink(scope)
  if (link) await revokeRemote(link.id, link.token)
  persistShareLink(scope, null)
}

/** Fetch a shared resume snapshot; null when the link is gone. */
export async function fetchSharedResume(
  id: string
): Promise<{ resume: Resume; createdAt: number } | null> {
  const res = await fetch(`/api/share/${encodeURIComponent(id)}`)
  if (!res.ok) return null
  const data = (await res.json().catch(() => null)) as {
    resume?: unknown
    createdAt?: number
  } | null
  if (!data) return null
  const resume = sanitizeResume(data.resume)
  if (!resume) return null
  return { resume, createdAt: data.createdAt ?? 0 }
}
