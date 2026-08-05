/**
 * Paddle.js overlay checkout: client token & price ids injected via Vite env.
 * After checkout the transaction_id is exchanged at /api/license/claim.
 */

import { saveLicense, type LicenseState, type Plan } from '@/lib/license'

export const PADDLE_CLIENT_TOKEN =
  (import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined) ?? ''

/** Paddle price id for the $9.99 Single Resume */
export const PADDLE_PRICE_RESUME =
  (import.meta.env.VITE_PADDLE_PRICE_RESUME as string | undefined) ?? ''

/** Paddle price id for the $19.99 Career Bundle */
export const PADDLE_PRICE_BUNDLE =
  (import.meta.env.VITE_PADDLE_PRICE_BUNDLE as string | undefined) ?? ''

export const paddleConfigured = () =>
  Boolean(PADDLE_CLIENT_TOKEN && PADDLE_PRICE_RESUME && PADDLE_PRICE_BUNDLE)

/** Is the payment channel live? (false during Paddle review → lead capture) */
export async function fetchCheckoutEnabled(): Promise<boolean> {
  try {
    const res = await fetch('/api/billing/status')
    if (!res.ok) return false
    const data = (await res.json()) as { checkoutEnabled?: boolean }
    return data.checkoutEnabled === true
  } catch {
    return false
  }
}

/** Email waitlist while checkout is not yet enabled */
export async function submitLead(email: string, plan: Plan): Promise<void> {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, plan }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || `Something went wrong (${res.status})`)
  }
}

interface PaddleCheckoutEvent {
  name?: string
  data?: { transaction_id?: string }
}

interface PaddleJs {
  Environment: { set: (env: 'sandbox' | 'production') => void }
  Initialize: (opts: {
    token: string
    eventCallback?: (event: PaddleCheckoutEvent) => void
  }) => void
  Checkout: {
    open: (opts: { items: { priceId: string; quantity: number }[] }) => void
    close: () => void
  }
}

declare global {
  interface Window {
    Paddle?: PaddleJs
  }
}

let paddleLoading: Promise<PaddleJs> | null = null
let paddleInitialized = false
let checkoutCompletedHandler: ((transactionId: string) => void) | null = null

function loadPaddle(): Promise<PaddleJs> {
  if (paddleLoading) return paddleLoading
  paddleLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    s.async = true
    s.onload = () => {
      try {
        const paddle = window.Paddle
        if (!paddle) throw new Error('Failed to load the payment component.')
        if (!paddleInitialized) {
          if (PADDLE_CLIENT_TOKEN.startsWith('test_')) {
            paddle.Environment.set('sandbox')
          }
          paddle.Initialize({
            token: PADDLE_CLIENT_TOKEN,
            eventCallback: (event) => {
              if (
                event.name === 'checkout.completed' &&
                event.data?.transaction_id
              ) {
                checkoutCompletedHandler?.(event.data.transaction_id)
              }
            },
          })
          paddleInitialized = true
        }
        resolve(paddle)
      } catch (e) {
        reject(e as Error)
      }
    }
    s.onerror = () =>
      reject(new Error('Could not load the payment component — check your connection.'))
    document.head.appendChild(s)
  })
  paddleLoading.catch(() => {
    paddleLoading = null
  })
  return paddleLoading
}

/**
 * Open the Paddle overlay checkout; calls back with the transaction_id once
 * payment completes. The returned promise only means the checkout opened.
 */
export async function openCheckout(
  plan: Plan,
  onCompleted: (transactionId: string) => void
): Promise<void> {
  if (!paddleConfigured()) {
    throw new Error('Checkout is not available yet — please try again soon.')
  }
  const paddle = await loadPaddle()
  checkoutCompletedHandler = onCompleted
  const priceId = plan === 'bundle' ? PADDLE_PRICE_BUNDLE : PADDLE_PRICE_RESUME
  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
  })
}

/** Claim a license with the transaction_id (idempotent) */
export async function claimTransaction(transactionId: string): Promise<LicenseState> {
  const res = await fetch('/api/license/claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ transactionId }),
  })
  const data = (await res.json()) as {
    token?: string
    licenseKey?: string
    plan?: Plan
    expiresAt?: number
    error?: string
  }
  if (!res.ok || !data.token || !data.plan || !data.expiresAt) {
    throw new Error(data.error || `Could not claim your purchase (${res.status})`)
  }
  const state: LicenseState = {
    token: data.token,
    plan: data.plan,
    expiresAt: data.expiresAt,
    licenseKey: data.licenseKey,
  }
  saveLicense(state)
  return state
}
