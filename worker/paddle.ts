/**
 * Paddle Billing integration: webhook signature verification (Paddle-Signature),
 * transaction lookup, price → plan mapping. All secrets come from env.
 * https://developer.paddle.com/webhooks/signature-verification
 */

export interface PaddleEnv {
  PADDLE_API_KEY?: string
  PADDLE_WEBHOOK_SECRET?: string
  /** Optional: sandbox uses https://sandbox-api.paddle.com, defaults to live */
  PADDLE_API_BASE?: string
  /** Paddle price id: Single Resume ($9.99, one-time) */
  PADDLE_PRICE_RESUME_ID?: string
  /** Paddle price id: Career Bundle ($19.99, one-time: resume + cover letter + interview prep) */
  PADDLE_PRICE_BUNDLE_ID?: string
}

const MAX_AGE_SECONDS = 60 * 5

const encoder = new TextEncoder()

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Verify the Paddle-Signature header (`ts=...;h1=...`, HMAC-SHA256 over `<ts>:<raw body>`) */
export async function verifyPaddleSignature(
  secret: string,
  rawBody: string,
  header: string
): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(';').map((p) => p.split('=', 2) as [string, string])
  )
  const ts = parts.ts
  const h1 = parts.h1
  if (!ts || !h1) return false
  const age = Math.abs(Date.now() / 1000 - parseInt(ts, 10))
  if (!Number.isFinite(age) || age > MAX_AGE_SECONDS) return false

  const expected = await hmacHex(secret, `${ts}:${rawBody}`)
  if (expected.length !== h1.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++)
    diff |= expected.charCodeAt(i) ^ h1.charCodeAt(i)
  return diff === 0
}

export interface PaddleTransactionInfo {
  id: string
  status: string
  priceIds: string[]
}

interface PaddleTransactionData {
  id?: string
  status?: string
  items?: { price?: { id?: string } }[]
}

/** Map purchased price ids to a plan (bundle wins if both present) */
export function planFromPriceIds(
  env: PaddleEnv,
  priceIds: string[]
): 'resume' | 'bundle' | null {
  if (env.PADDLE_PRICE_BUNDLE_ID && priceIds.includes(env.PADDLE_PRICE_BUNDLE_ID))
    return 'bundle'
  if (env.PADDLE_PRICE_RESUME_ID && priceIds.includes(env.PADDLE_PRICE_RESUME_ID))
    return 'resume'
  return null
}

export function paddleTransactionInfo(
  data: PaddleTransactionData
): PaddleTransactionInfo {
  return {
    id: data.id ?? '',
    status: data.status ?? '',
    priceIds: (data.items ?? [])
      .map((i) => i.price?.id)
      .filter((id): id is string => Boolean(id)),
  }
}

export const PADDLE_PAID_STATUSES = ['completed', 'paid'] as const

/** Look up a transaction with PADDLE_API_KEY (returns null on network/config gaps; KV webhook records are the fallback) */
export async function fetchPaddleTransaction(
  env: PaddleEnv,
  transactionId: string
): Promise<PaddleTransactionInfo | null> {
  if (!env.PADDLE_API_KEY) return null
  const base = env.PADDLE_API_BASE?.replace(/\/+$/, '') || 'https://api.paddle.com'
  try {
    const res = await fetch(
      `${base}/transactions/${encodeURIComponent(transactionId)}`,
      { headers: { authorization: `Bearer ${env.PADDLE_API_KEY}` } }
    )
    if (!res.ok) return null
    const body = (await res.json()) as { data?: PaddleTransactionData }
    if (!body.data) return null
    return paddleTransactionInfo(body.data)
  } catch {
    return null
  }
}

/** Generate an in-house license key (CV-XXXX-XXXX-XXXX-XXXX) */
export function generateLicenseKey(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length])
  const groups = [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join(''))
  return `CV-${groups.join('-')}`
}

export const paddleTxKvKey = (transactionId: string) => `pdltx:${transactionId}`
export const paddleEventKvKey = (eventId: string) => `pdlevt:${eventId}`
