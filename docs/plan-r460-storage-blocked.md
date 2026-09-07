# R460 — honest error when the browser blocks site data (localStorage)

## Audit (first-hand, production)

- Route-health probe (r458_audit.py): all 7 routes clean — titles, h1, single
  `<main>`, no overflow, no console errors. (A transient `"mains": 0` on /jobs in
  one earlier run did not reproduce; loading-state artifact, not a defect.)
- CDP experiment against production (r460_blockedstorage.py): simulate Chrome
  "Block all cookies" / enterprise policy / Safari lockdown by making every
  `Storage.prototype` method throw `DOMException('…','SecurityError')` before
  document creation, then load routes fresh (cache disabled).

## Verified defect (honesty / functional depth)

With blocked storage, `/builder` and `/dashboard` crash during first render
(dozens of unguarded render-time `localStorage.getItem` calls in useState
initializers, e.g. Builder.tsx previewView/tour flags, Dashboard view mode).
The R456 `RouteErrorBoundary` catches the throw and shows:

> "This page failed to load — Check your connection, then reload and try again."

That copy is dishonest for this failure mode: the network is fine and reloading
can never fix it. The user's actual remedy is to allow cookies/site data for
cv.zalize.com. Homepage still renders (static content); the app pages are the
broken surface. Confirmed via r460_stack.py that the throw is caught by the
boundary (zero window-level errors), so the boundary is the single choke point.

## Rejected alternatives

- In-memory Storage polyfill so the app "works": dishonest — R351's save
  indicator would claim "Saved" while nothing persists; large behavioral surface.
- Guarding every render-time localStorage call: dozens of call sites across
  Builder/Dashboard/Jobs; big diff, same end state (app can't persist anyway).

## Fix (smallest honest change, src/App.tsx only)

`RouteErrorBoundary.getDerivedStateFromError(error)` records whether the error
is a `DOMException` named `SecurityError` (the storage-access denial type in
Chrome/Firefox/Safari; chunk-load failures are `TypeError`, so no overlap).
When it is, the error card says the truth:

- h1: "Your browser is blocking site data"
- body: "RezUp stores your resumes in your browser. Allow cookies and site data
  for cv.zalize.com in your browser settings, then reload."

All other errors keep the existing R456/R457 copy, shell, role=alert, Reload
button, and key={pathname} remount behavior unchanged.

## Validation

- npm run typecheck / lint / build; verify-dist via npm run deploy.
- Production QA (testing agent, CDP): blocked-storage load of /builder and
  /dashboard shows the new honest card with shell + Reload; normal loads
  unaffected; route-chunk-blocked failure still shows the connection copy
  (no regression of R456/R457); 375px light/dark; storage restored byte-exact.
