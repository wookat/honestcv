/**
 * License + entitlement primitives: signed tokens, KV records, free quotas.
 * All secrets come from env — never hardcode.
 */

export interface BillingEnv {
  KV: KVNamespace
  LICENSE_SIGNING_SECRET?: string
}

/**
 * resume — $9.99 single resume: unlock PDF/DOCX downloads + unlimited AI rewrites
 * bundle — $19.99 career bundle: everything in resume + cover letter + interview prep
 */
export type Plan = 'resume' | 'bundle'

export interface LicenseRecord {
  key: string
  plan: Plan
  orderId?: string
  /** ms epoch when the license expires (one-time purchase → effectively lifetime) */
  expiresAt: number
  activatedAt?: number
  createdAt: number
}

export interface TokenPayload {
  key: string
  plan: Plan
  exp: number
}

/** One-time purchase: license usable for 10 years (practically lifetime) */
export const LICENSE_DURATION_MS = 10 * 365 * 24 * 60 * 60 * 1000

const encoder = new TextEncoder()

function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecodeToString(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  return atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return new Uint8Array(sig)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Sign an in-app unlock token: base64url(payload).hmac */
export async function signToken(
  secret: string,
  payload: TokenPayload
): Promise<string> {
  const body = b64urlEncode(encoder.encode(JSON.stringify(payload)))
  const sig = b64urlEncode(await hmacSha256(secret, body))
  return `${body}.${sig}`
}

/** Verify token signature + expiry; returns payload or null */
export async function verifyToken(
  secret: string,
  token: string
): Promise<TokenPayload | null> {
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = b64urlEncode(await hmacSha256(secret, body))
  if (!timingSafeEqual(expected, sig)) return null
  try {
    const payload = JSON.parse(b64urlDecodeToString(body)) as TokenPayload
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    if (payload.plan !== 'resume' && payload.plan !== 'bundle') return null
    return payload
  } catch {
    return null
  }
}

export function newLicenseRecord(
  key: string,
  plan: Plan,
  extra: Partial<LicenseRecord> = {}
): LicenseRecord {
  const now = Date.now()
  return {
    key,
    plan,
    expiresAt: now + LICENSE_DURATION_MS,
    createdAt: now,
    ...extra,
  }
}

export const licenseKvKey = (key: string) => `license:${key.trim().toLowerCase()}`
export const quotaKvKey = (fingerprint: string, item: string) =>
  `quota:${item}:${fingerprint}`

/** Generate an in-house license key (CV-XXXX-XXXX-XXXX-XXXX) */
export function generateLicenseKey(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length])
  const groups = [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join(''))
  return `CV-${groups.join('-')}`
}
