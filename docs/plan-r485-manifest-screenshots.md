# R485 — manifest `screenshots` member (richer install UI)

## Evidence (first-party, production)
- R485 audit: 8 route/viewport axe scans on the app surfaces (/dashboard, /documents, /jobs, /builder × 1280/375) all CLEAN; manifest served as `application/manifest+json`; robots/sitemap/404 `x-robots-tag: noindex` all correct — no defect found on those dimensions.
- Production manifest (R484) has id/scope/icons/shortcuts but no `screenshots`. Per the W3C manifest spec and Chrome guidance, `screenshots` with `form_factor: "wide"` powers the richer desktop install dialog, and narrow screenshots power the richer Android install sheet; without them Chrome falls back to the minimal install prompt. This was explicitly banked in the R484 plan ("needs a curated capture set").
- Rezi's app manifest has no screenshots member either — beyond-parity polish, consistent with R482–R484.

## Fix (minimal, static assets + manifest-only)
- Capture two curated production screenshots via CDP:
  1. `screenshot-wide.png` — 1280×800 desktop homepage (hero + product mock; the Builder capture was rejected because the right column shows the template picker above the fold, not the live preview).
  2. `screenshot-narrow.png` — 750×1334 (375×667 @2x) mobile homepage hero.
- Add to `public/manifest.webmanifest`:
  ```json
  "screenshots": [
    { "src": "/screenshot-wide.png", "sizes": "1280x800", "type": "image/png", "form_factor": "wide", "label": "Resume builder with live ATS-friendly preview" },
    { "src": "/screenshot-narrow.png", "sizes": "750x1334", "type": "image/png", "form_factor": "narrow", "label": "ATS-friendly resume builder on mobile" }
  ]
  ```
- Non-goals: no service worker/offline, no HTML/CSP changes, no icon changes, no additional screenshots (spec allows up to 8; start with the minimum useful pair).

## Validation
- Local: built manifest valid JSON with 2 screenshots; PNG dimensions match declared sizes (PIL-verified); tsc/eslint/build/verify-dist.
- Production QA: manifest 200 with screenshots member; both PNGs 200 with correct dimensions; CDP `Page.getAppManifest` errors=[] and parses both screenshots; R484 (id/scope/shortcuts) + R483/R482 icon regressions intact.
- Deploy caveat as usual: asset upload succeeds; Workers Routes API fails with auth code 10000 (known token-scope limitation).
