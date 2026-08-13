/**
 * Lemon Squeezy hosted overlay checkout (via lemon.js) — the sole payment
 * provider. After payment the order id is exchanged at /api/license/claim.
 */

import { licenseHeaders, saveLicense, type LicenseState, type Plan } from '@/lib/license'

export type CheckoutProvider = 'lemonsqueezy'

export interface BillingStatus {
  checkoutEnabled: boolean
  provider: CheckoutProvider
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  try {
    const res = await fetch('/api/billing/status')
    if (!res.ok) return { checkoutEnabled: false, provider: 'lemonsqueezy' }
    const data = (await res.json()) as { checkoutEnabled?: boolean }
    return {
      checkoutEnabled: data.checkoutEnabled === true,
      provider: 'lemonsqueezy',
    }
  } catch {
    return { checkoutEnabled: false, provider: 'lemonsqueezy' }
  }
}

/** Is the payment channel live? (false → lead capture) */
export async function fetchCheckoutEnabled(): Promise<boolean> {
  return (await fetchBillingStatus()).checkoutEnabled
}

/** Email waitlist while checkout is not yet enabled */
export async function submitLead(email: string, plan: Plan | 'free-download'): Promise<void> {
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

/** Claim a license with the order id (idempotent) */
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

interface LemonSqueezyJs {
  Setup: (opts: { eventHandler: (event: LsEvent) => void }) => void
  Url: { Open: (url: string) => void; Close: () => void }
}

interface LsEvent {
  event?: string
  data?: { order?: { data?: { id?: string } } }
}

declare global {
  interface Window {
    LemonSqueezy?: LemonSqueezyJs
    createLemonSqueezy?: () => void
  }
}

let lemonLoading: Promise<LemonSqueezyJs> | null = null
let orderCompletedHandler: ((orderId: string) => void) | null = null

function loadLemon(): Promise<LemonSqueezyJs> {
  if (lemonLoading) return lemonLoading
  lemonLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://assets.lemonsqueezy.com/lemon.js'
    s.defer = true
    s.onload = () => {
      try {
        window.createLemonSqueezy?.()
        const ls = window.LemonSqueezy
        if (!ls) throw new Error('Failed to load the payment component.')
        ls.Setup({
          eventHandler: (event) => {
            if (event.event === 'Checkout.Success') {
              const orderId = event.data?.order?.data?.id
              if (orderId) orderCompletedHandler?.(String(orderId))
            }
          },
        })
        resolve(ls)
      } catch (e) {
        reject(e as Error)
      }
    }
    s.onerror = () =>
      reject(new Error('Could not load the payment component — check your connection.'))
    document.head.appendChild(s)
  })
  lemonLoading.catch(() => {
    lemonLoading = null
  })
  return lemonLoading
}

async function openLemonCheckout(
  plan: Plan,
  onCompleted: (orderId: string) => void
): Promise<void> {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...licenseHeaders() },
    body: JSON.stringify({ plan }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    url?: string
    error?: string
  }
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Checkout is not available yet — please try again soon.')
  }
  const ls = await loadLemon()
  orderCompletedHandler = onCompleted
  ls.Url.Open(data.url)
}

/**
 * Open the overlay checkout; calls back with the order id once payment
 * completes. The promise only means it opened.
 */
export async function openCheckout(
  plan: Plan,
  onCompleted: (orderId: string) => void
): Promise<void> {
  const status = await fetchBillingStatus()
  if (!status.checkoutEnabled) {
    throw new Error('Checkout is not available yet — please try again soon.')
  }
  return openLemonCheckout(plan, onCompleted)
}
