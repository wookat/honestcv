/** Shareable read-only resume links (Worker KV snapshots). */

import { licenseHeaders } from '@/lib/license'
import { type Resume, sanitizeResume } from '@/lib/resume'

const SHARE_LINK_KEY = 'honestcv.shareLink'

export interface ShareLink {
  id: string
  token: string
  url: string
  sharedAt: number
}

export function loadShareLink(): ShareLink | null {
  try {
    const raw = localStorage.getItem(SHARE_LINK_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as ShareLink
    if (typeof v.id !== 'string' || typeof v.token !== 'string' || typeof v.url !== 'string') {
      return null
    }
    return v
  } catch {
    return null
  }
}

function persistShareLink(link: ShareLink | null) {
  if (link) localStorage.setItem(SHARE_LINK_KEY, JSON.stringify(link))
  else localStorage.removeItem(SHARE_LINK_KEY)
}

/** Lowercase letters, numbers and hyphens, 3-40 chars, no edge hyphens. */
export const SHARE_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

/** Publish a snapshot of the resume; re-publishing keeps the same URL.
 *  A slug (only used when creating a new link) requests a custom URL. */
export async function createShareLink(resume: Resume, slug?: string): Promise<ShareLink> {
  const prev = loadShareLink()
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...licenseHeaders() },
    body: JSON.stringify({
      resume,
      ...(prev ? { id: prev.id, token: prev.token } : slug ? { slug } : {}),
    }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    id?: string
    token?: string
    url?: string
    error?: string
  }
  if (!res.ok || !data.id || !data.token || !data.url) {
    throw new Error(data.error || `Sharing failed (${res.status})`)
  }
  const link: ShareLink = { id: data.id, token: data.token, url: data.url, sharedAt: Date.now() }
  persistShareLink(link)
  return link
}

async function revokeRemote(id: string, token: string): Promise<void> {
  await fetch(`/api/share/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-share-token': token },
  }).catch(() => undefined)
}

/** Revoke the current link (server delete + local forget). */
export async function revokeShareLink(): Promise<void> {
  const link = loadShareLink()
  if (link) await revokeRemote(link.id, link.token)
  persistShareLink(null)
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
