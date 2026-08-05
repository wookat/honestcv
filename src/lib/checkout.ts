/**
 * Provider-agnostic checkout: the server picks the active payment provider
 * (Lemon Squeezy hosted overlay via lemon.js, or Paddle overlay). After
 * payment the order/transaction id is exchanged at /api/license/claim.
 */

import { licenseHeaders, type Plan } from '@/lib/license'
import {
  openCheckout as openPaddleCheckout,
  paddleConfigured,
} from '@/lib/paddle'

export type CheckoutProvider = 'lemonsqueezy' | 'paddle'

export interface BillingStatus {
  checkoutEnabled: boolean
  provider: CheckoutProvider
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  try {
    const res = await fetch('/api/billing/status')
    if (!res.ok) return { checkoutEnabled: false, provider: 'paddle' }
    const data = (await res.json()) as {
      checkoutEnabled?: boolean
      provider?: CheckoutProvider
    }
    return {
      checkoutEnabled: data.checkoutEnabled === true,
      provider: data.provider === 'lemonsqueezy' ? 'lemonsqueezy' : 'paddle',
    }
  } catch {
    return { checkoutEnabled: false, provider: 'paddle' }
  }
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
 * Open the active provider's overlay checkout; calls back with the order /
 * transaction id once payment completes. The promise only means it opened.
 */
export async function openCheckout(
  plan: Plan,
  onCompleted: (orderId: string) => void
): Promise<void> {
  const status = await fetchBillingStatus()
  if (!status.checkoutEnabled) {
    throw new Error('Checkout is not available yet — please try again soon.')
  }
  if (status.provider === 'lemonsqueezy') {
    return openLemonCheckout(plan, onCompleted)
  }
  if (!paddleConfigured()) {
    throw new Error('Checkout is not available yet — please try again soon.')
  }
  return openPaddleCheckout(plan, onCompleted)
}
