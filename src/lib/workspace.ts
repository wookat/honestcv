/**
 * Whole-workspace backup & restore: every honestcv.* localStorage key in one
 * JSON file, so a cleared browser profile or a new device doesn't mean losing
 * saved copies, documents, the job pipeline, libraries and share-link records.
 */

const PREFIX = 'honestcv.'

export const WORKSPACE_FORMAT = 'rezup-workspace'

/** Device-scoped flags and entitlements never travel in a backup. */
const EXCLUDED = new Set([
  'honestcv.clientId',
  'honestcv.license',
  'honestcv.subscribed',
  'honestcv.shared',
  'honestcv.firstSeen',
  'honestcv.qa',
])

function isWorkspaceKey(key: string): boolean {
  return key.startsWith(PREFIX) && !EXCLUDED.has(key) && !key.startsWith('honestcv.ev.')
}

function workspaceKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && isWorkspaceKey(key)) keys.push(key)
  }
  return keys
}

/** Serialize the whole workspace to a JSON backup string. */
export function exportWorkspace(): string {
  const data: Record<string, string> = {}
  for (const key of workspaceKeys()) {
    const value = localStorage.getItem(key)
    if (value !== null) data[key] = value
  }
  return JSON.stringify(
    { format: WORKSPACE_FORMAT, version: 1, exportedAt: new Date().toISOString(), data },
    null,
    2
  )
}

/** Parse a backup file; null when it isn't a RezUp workspace backup. */
export function parseWorkspaceBackup(raw: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(raw) as { format?: unknown; data?: unknown }
    if (parsed.format !== WORKSPACE_FORMAT || typeof parsed.data !== 'object' || !parsed.data) {
      return null
    }
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed.data as Record<string, unknown>)) {
      if (isWorkspaceKey(key) && typeof value === 'string') out[key] = value
    }
    return Object.keys(out).length > 0 ? out : null
  } catch {
    return null
  }
}

/** True when the backup's active-copy link points at no version in the backup. */
function danglingActiveVersion(data: Record<string, string>): boolean {
  const active = data['honestcv.activeVersionId']
  if (!active) return false
  try {
    const versions = JSON.parse(data['honestcv.resumeVersions'] ?? '[]') as unknown
    return !(
      Array.isArray(versions) &&
      versions.some((v) => (v as { id?: unknown } | null)?.id === active)
    )
  } catch {
    return true
  }
}

/**
 * Replace the current workspace with the backup. Returns false — with the
 * previous workspace rolled back — when writing fails (storage full).
 */
export function restoreWorkspace(data: Record<string, string>): boolean {
  const snapshot: Record<string, string> = {}
  for (const key of workspaceKeys()) {
    const value = localStorage.getItem(key)
    if (value !== null) snapshot[key] = value
  }
  try {
    for (const key of Object.keys(snapshot)) localStorage.removeItem(key)
    for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value)
    if (danglingActiveVersion(data)) localStorage.removeItem('honestcv.activeVersionId')
    return true
  } catch {
    try {
      for (const key of workspaceKeys()) localStorage.removeItem(key)
      for (const [key, value] of Object.entries(snapshot)) localStorage.setItem(key, value)
    } catch {
      // best effort — the snapshot is the same size as what was just removed
    }
    return false
  }
}
