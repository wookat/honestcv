# R484 — manifest id/scope + app shortcuts

## Evidence (first-party, production)
- Production `manifest.webmanifest` (R483) has name/short_name/start_url/display/colors/description/icons only — no `id`, no `scope`, no `shortcuts` (curl verified 2026-09-05).
- Per the W3C manifest spec and Chrome guidance, `id` is the app's stable identity (without it Chrome falls back to `start_url`, and later changing start_url would orphan installs); `scope` bounds the installed app; `shortcuts` power the Android long-press launcher menu and desktop-PWA jump list.
- Audit context: 12 route/viewport axe scans on the remaining uncovered surfaces (/, /ats-checker, /samples, /pricing/, example + guide pages × 1280/375) all CLEAN; homepage JSON-LD (WebApplication + FAQPage) verified present in production raw HTML — earlier "missing" hypothesis honestly rejected. Rezi's app manifest (app.rezi.ai) has a single 48px .ico icon and none of these members, so this is a beyond-parity polish item, not a competitor gap.

## Fix (minimal, manifest-only)
Add to `public/manifest.webmanifest`:
- `"id": "/"`, `"scope": "/"`
- `shortcuts`: two entries reusing the committed 192px icon (spec minimum 96x96):
  1. "Resume builder" → `/builder`
  2. "ATS checker" → `/ats-checker`

Non-goals: no service worker/offline, no screenshots member (needs curated capture set — banked), no HTML/CSP changes, no icon changes.

## Validation
- Local: built manifest valid JSON with id/scope/2 shortcuts; tsc/eslint/build/verify-dist.
- Production QA: manifest 200 with the new members; CDP `Page.getAppManifest` errors=[] and parses both shortcuts; shortcut URLs (/builder, /ats-checker) 200; R483 maskable + R482 icon regression (4 icons intact).
- Deploy caveat as usual: asset upload succeeds; Workers Routes API fails with auth code 10000 (known token-scope limitation).
