/**
 * Lemon Squeezy integration: server-created checkouts, webhook signature
 * verification (X-Signature, HMAC-SHA256 hex over the raw body), order lookup,
 * variant → plan mapping. All secrets come from env.
 * https://docs.lemonsqueezy.com/api
 */

export interface LsEnv {
  LEMONSQUEEZY_API_KEY?: string
  LEMONSQUEEZY_WEBHOOK_SECRET?: string
  LS_STORE_ID?: string
  /** Variant id: Single Resume ($9.99, one-time) */
  LS_VARIANT_RESUME_ID?: string
  /** Variant id: Career Bundle ($19.99, one-time) */
  LS_VARIANT_BUNDLE_ID?: string
}

const API_BASE = 'https://api.lemonsqueezy.com/v1'

export const lsConfigured = (env: LsEnv) =>
  Boolean(
    env.LEMONSQUEEZY_API_KEY &&
      env.LS_STORE_ID &&
      env.LS_VARIANT_RESUME_ID &&
      env.LS_VARIANT_BUNDLE_ID
  )

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

/** Verify the X-Signature header (HMAC-SHA256 hex digest of the raw body) */
export async function verifyLsSignature(
  secret: string,
  rawBody: string,
  signature: string
): Promise<boolean> {
  const expected = await hmacHex(secret, rawBody)
  const given = signature.trim().toLowerCase()
  if (expected.length !== given.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++)
    diff |= expected.charCodeAt(i) ^ given.charCodeAt(i)
  return diff === 0
}

export function planFromVariantId(
  env: LsEnv,
  variantId: string | number | undefined
): 'resume' | 'bundle' | null {
  if (variantId === undefined || variantId === null) return null
  const id = String(variantId)
  if (env.LS_VARIANT_BUNDLE_ID && id === env.LS_VARIANT_BUNDLE_ID) return 'bundle'
  if (env.LS_VARIANT_RESUME_ID && id === env.LS_VARIANT_RESUME_ID) return 'resume'
  return null
}

/** Create a hosted checkout for a plan; returns the checkout URL */
export async function createLsCheckout(
  env: LsEnv,
  plan: 'resume' | 'bundle',
  clientId: string
): Promise<string | null> {
  if (!lsConfigured(env)) return null
  const variantId =
    plan === 'bundle' ? env.LS_VARIANT_BUNDLE_ID! : env.LS_VARIANT_RESUME_ID!
  try {
    const res = await fetch(`${API_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        accept: 'application/vnd.api+json',
        'content-type': 'application/vnd.api+json',
        authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_options: { embed: true, media: false, logo: true },
            checkout_data: { custom: { plan, client_id: clientId } },
            product_options: {
              redirect_url: 'https://cv.zalize.com/builder?purchase=success',
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: env.LS_STORE_ID } },
            variant: { data: { type: 'variants', id: variantId } },
          },
        },
      }),
    })
    if (!res.ok) {
      console.error('LS checkout create failed', res.status, await res.text())
      return null
    }
    const body = (await res.json()) as {
      data?: { attributes?: { url?: string } }
    }
    return body.data?.attributes?.url ?? null
  } catch {
    return null
  }
}

export interface LsOrderInfo {
  id: string
  status: string
  variantId: string
}

/** Look up an order via the API (fallback when the webhook record is missing) */
export async function fetchLsOrder(
  env: LsEnv,
  orderId: string
): Promise<LsOrderInfo | null> {
  if (!env.LEMONSQUEEZY_API_KEY) return null
  if (!/^\d+$/.test(orderId)) return null
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: {
        accept: 'application/vnd.api+json',
        authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
      },
    })
    if (!res.ok) return null
    const body = (await res.json()) as {
      data?: {
        id?: string
        attributes?: {
          status?: string
          store_id?: number
          first_order_item?: { variant_id?: number }
        }
      }
    }
    const attrs = body.data?.attributes
    if (!body.data?.id || !attrs) return null
    if (env.LS_STORE_ID && String(attrs.store_id) !== env.LS_STORE_ID) return null
    return {
      id: body.data.id,
      status: attrs.status ?? '',
      variantId: String(attrs.first_order_item?.variant_id ?? ''),
    }
  } catch {
    return null
  }
}

export const LS_PAID_STATUSES = ['paid'] as const

export const lsOrderKvKey = (orderId: string) => `lsorder:${orderId}`
export const lsEventKvKey = (eventId: string) => `lsevt:${eventId}`
