/**
 * Client-side unlock state: license token in localStorage, sent to the
 * worker for signature verification on each request.
 */

export type Plan = 'resume' | 'bundle'

export interface LicenseState {
  token: string
  plan: Plan
  expiresAt: number
  /** In-house license key (returned on claim; re-activate on another device) */
  licenseKey?: string
}

const TOKEN_KEY = 'honestcv.license'
const CLIENT_ID_KEY = 'honestcv.clientId'

/** Anonymous fingerprint for free-quota accounting (random id, no PII) */
export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}

export function loadLicense(): LicenseState | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as LicenseState
    if (!state.token || !state.plan || state.expiresAt < Date.now()) {
      localStorage.removeItem(TOKEN_KEY)
      return null
    }
    return state
  } catch {
    return null
  }
}

export function saveLicense(state: LicenseState) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(state))
}

export function clearLicense() {
  localStorage.removeItem(TOKEN_KEY)
}

/** Any paid plan unlocks downloads + unlimited AI rewrites */
export function isUnlocked(): boolean {
  return loadLicense() !== null
}

export function hasBundle(): boolean {
  return loadLicense()?.plan === 'bundle'
}

/** Headers attached to API requests: fingerprint + license token */
export function licenseHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'x-client-id': getClientId() }
  const lic = loadLicense()
  if (lic) headers['x-license-token'] = lic.token
  return headers
}

export async function activateLicense(licenseKey: string): Promise<LicenseState> {
  const res = await fetch('/api/license/activate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ licenseKey }),
  })
  const data = (await res.json()) as {
    token?: string
    plan?: Plan
    expiresAt?: number
    error?: string
  }
  if (!res.ok || !data.token || !data.plan || !data.expiresAt) {
    throw new Error(data.error || `Activation failed (${res.status})`)
  }
  const state: LicenseState = {
    token: data.token,
    plan: data.plan,
    expiresAt: data.expiresAt,
    licenseKey: licenseKey.trim(),
  }
  saveLicense(state)
  return state
}
