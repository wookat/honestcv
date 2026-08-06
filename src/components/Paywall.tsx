import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Loader2, Lock, Mail, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  activateLicense,
  loadLicense,
  type LicenseState,
  type Plan,
} from '@/lib/license'
import { claimTransaction, fetchCheckoutEnabled, submitLead } from '@/lib/paddle'
import { openCheckout } from '@/lib/checkout'

/** Paddle overlay checkout button: claims the license after payment */
export function CheckoutButton({
  plan,
  children,
  variant,
  className,
  onActivated,
}: {
  plan: Plan
  children: React.ReactNode
  variant?: 'default' | 'outline'
  className?: string
  onActivated?: (s: LicenseState) => void
}) {
  const [status, setStatus] = useState<'idle' | 'opening' | 'claiming' | 'done'>('idle')
  const [error, setError] = useState('')
  const [claimed, setClaimed] = useState<LicenseState | null>(null)
  const [leadOpen, setLeadOpen] = useState(false)

  const buy = async () => {
    setError('')
    setStatus('opening')
    try {
      const enabled = await fetchCheckoutEnabled()
      if (!enabled) {
        setStatus('idle')
        setLeadOpen(true)
        return
      }
      await openCheckout(plan, (transactionId) => {
        setStatus('claiming')
        claimTransaction(transactionId)
          .then((state) => {
            setClaimed(state)
            setStatus('done')
            onActivated?.(state)
          })
          .catch((e) => {
            setStatus('idle')
            setError(
              `${(e as Error).message} If this keeps failing, contact us with the order id from your receipt email.`
            )
          })
      })
      setStatus((s) => (s === 'opening' ? 'idle' : s))
    } catch (e) {
      setStatus('idle')
      setError((e as Error).message)
    }
  }

  if (status === 'done') {
    return (
      <div className={className}>
        <div className="rounded-md border border-green-200 bg-green-50 p-2 text-center text-sm">
          <p>Payment confirmed — downloads and AI are unlocked!</p>
          {claimed?.licenseKey && (
            <p className="mt-1 font-mono text-xs break-all">
              License key (save it to re-activate on another device): {claimed.licenseKey}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Button
        variant={variant}
        className="w-full"
        onClick={() => void buy()}
        disabled={status !== 'idle'}
      >
        {status !== 'idle' ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {status === 'claiming'
          ? 'Unlocking…'
          : status === 'opening'
            ? 'Opening checkout…'
            : children}
      </Button>
      {error && <p className="text-destructive mt-1.5 text-xs">{error}</p>}
      <LeadDialog open={leadOpen} onOpenChange={setLeadOpen} plan={plan} />
    </div>
  )
}

/** Checkout not live yet: email waitlist dialog */
export function LeadDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan
}) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    const addr = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr)) {
      setError('Please enter a valid email address.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await submitLead(addr, plan)
      setDone(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5" /> Checkout is almost ready
          </DialogTitle>
          <DialogDescription>
            We're finishing our payment setup, so purchases aren't live just yet.
            Leave your email and we'll notify you the moment it opens — with an
            early-bird discount.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
            Got it! We'll email you as soon as checkout opens, discount included.
            Thanks for your patience!
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="lead-email">Email address</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="lead-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
              <Button onClick={() => void submit()} disabled={busy} className="shrink-0">
                {busy ? <Loader2 className="animate-spin" /> : <Mail />}
                {busy ? 'Sending…' : 'Notify me'}
              </Button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <p className="text-muted-foreground text-xs">
              We'll only use your email for the launch notification and discount.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Launch/traffic mode: server flag making downloads free */
export function useFreeMode() {
  const [freeMode, setFreeMode] = useState(false)
  useEffect(() => {
    let cancelled = false
    fetch('/api/billing/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { freeMode?: boolean } | null) => {
        if (!cancelled && d?.freeMode === true) setFreeMode(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  return freeMode
}

const SUBSCRIBED_KEY = 'honestcv.subscribed'
export const hasSubscribed = () => Boolean(localStorage.getItem(SUBSCRIBED_KEY))

/** Free-launch download gate: subscribe once with an email, download forever */
export function FreeDownloadDialog({
  open,
  onOpenChange,
  onUnlocked,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnlocked: () => void
}) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const addr = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr)) {
      setError('Please enter a valid email address.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await submitLead(addr, 'free-download')
      localStorage.setItem(SUBSCRIBED_KEY, addr)
      onOpenChange(false)
      onUnlocked()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5" /> Downloads are free during launch
          </DialogTitle>
          <DialogDescription>
            No payment, no subscription — just leave an email once and download
            PDF/DOCX free while we're in launch mode. We'll only email you about
            HonestCV updates.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="free-email">Email address</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="free-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <Button onClick={() => void submit()} disabled={busy} className="shrink-0">
              {busy ? <Loader2 className="animate-spin" /> : <Mail />}
              {busy ? 'Unlocking…' : 'Unlock free downloads'}
            </Button>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <p className="text-muted-foreground text-xs">
            One email, all downloads — no card, nothing to cancel, unsubscribe anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Read + subscribe to the local unlock state */
export function useLicense() {
  const [license, setLicense] = useState<LicenseState | null>(() => loadLicense())
  const refresh = useCallback(() => setLicense(loadLicense()), [])
  return { license, refresh }
}

/** License activation form: enter key → verify → store token */
export function ActivateForm({ onActivated }: { onActivated?: (s: LicenseState) => void }) {
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<LicenseState | null>(null)

  const activate = async () => {
    if (!key.trim()) {
      setError('Enter the license key from your confirmation.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const state = await activateLicense(key.trim())
      setDone(state)
      onActivated?.(state)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
        License activated — {done.plan === 'bundle' ? 'Career Bundle' : 'Single Resume'}{' '}
        unlocked on this device.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="license-key">Already paid? Re-activate with your license key</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="license-key"
          placeholder="CV-XXXX-XXXX-XXXX-XXXX"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={busy}
        />
        <Button onClick={() => void activate()} disabled={busy} className="shrink-0">
          {busy ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {busy ? 'Checking…' : 'Activate'}
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <p className="text-muted-foreground text-xs">
        After payment your license activates automatically and shows a license key —
        keep it to re-activate on another device.
      </p>
    </div>
  )
}

/** Upgrade dialog: one-time pricing + checkout + activation entry */
export function UpgradeDialog({
  open,
  onOpenChange,
  reason,
  onActivated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason?: string
  onActivated?: (s: LicenseState) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-5" /> Unlock your resume — pay once, never again
          </DialogTitle>
          <DialogDescription>
            {reason ||
              'Your resume, ATS score and editing stay free. Pay once to download PDF/DOCX and use unlimited AI rewrites. No subscription, no auto-renewal — ever.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Single Resume</p>
              <Badge variant="secondary">One-time</Badge>
            </div>
            <p className="mt-1 text-2xl font-bold">
              $9.99
              <span className="text-muted-foreground text-sm font-normal"> once, forever</span>
            </p>
            <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
              <li>· Unlimited PDF + DOCX downloads, no watermark</li>
              <li>· Unlimited AI rewrites &amp; job-targeted tailoring</li>
              <li>· All 12 ATS-friendly templates</li>
              <li>· Edit and re-download forever — data stays in your browser</li>
            </ul>
            <CheckoutButton plan="resume" variant="outline" className="mt-3" onActivated={onActivated}>
              Get Single Resume — $9.99
            </CheckoutButton>
          </div>

          <div className="border-primary rounded-lg border-2 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Career Bundle</p>
              <Badge>Best value</Badge>
            </div>
            <p className="mt-1 text-2xl font-bold">
              $19.99
              <span className="text-muted-foreground text-sm font-normal"> once, forever</span>
            </p>
            <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
              <li>· Everything in Single Resume</li>
              <li>· AI cover letter writer, tailored to each job posting</li>
              <li>· Interview prep brief: likely questions, STAR stories, gaps</li>
              <li>· All future features, no extra charge</li>
            </ul>
            <CheckoutButton plan="bundle" className="mt-3" onActivated={onActivated}>
              Get Career Bundle — $19.99
            </CheckoutButton>
          </div>

          <ActivateForm onActivated={onActivated} />

          <p className="text-muted-foreground text-xs">
            Payments are securely processed by our merchant of record. One-time charge — your card is
            never stored for recurring billing. 7-day money-back guarantee: email
            support@zalize.com and we'll refund you, no questions asked.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
