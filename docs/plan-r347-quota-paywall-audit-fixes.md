# R347: quota/paywall/license production audit — findings and fixes

## First-hand evidence (production, mocked AI/billing, zero real quota)

Exploratory audit of the monetization chain on https://cv.zalize.com
(402/429/quota mocks intercepted before dispatch; no real payments; no
Lemon Squeezy script loaded; baselines restored). Full pass on: freeMode
402 inline error, UpgradeDialog on 402 (non-freeMode), 429 passthrough +
retry, in-flight double-submit guards, lead capture CTA, license
activation + `x-license-token`, free-download email gate, theme/language/
view persistence, 375px + dark mode. No P0/P1.

Confirmed P3s:

1. **UpgradeDialog closes to `<body>` focus.** The dialog opens
   programmatically after an async 402 while the opener AI button is
   disabled (busy), so focus has already fallen to `<body>` when
   `onOpenAutoFocus` captures the opener (R340 mechanism) — nothing to
   restore on close. Opener is still in the DOM.
2. **Static `/pricing/` ignores the dark theme preference.** SPA routes
   honor `honestcv.theme`; the prerendered static pages always render
   light (`scripts/build-seo.mjs` emits a light-only `:root` palette and
   no theme script). Jarring when navigating from a dark app.
3. (cosmetic) Technical fallback strings on protocol-violating server
   responses: `Request failed (429)` on an empty-body 429, and
   `Activation failed (200)` when a 200 activation response lacks
   `expiresAt`.

## Design

1. `src/components/ui/dialog.tsx`: module-level `focusin` listener keeps
   the last focused element; `onOpenAutoFocus` falls back to it when
   `document.activeElement` is `<body>`. Existing `isConnected` guard on
   close unchanged; all other dialogs keep current behavior (their
   opener is still focused at open time, so the fallback never engages).
2. `scripts/build-seo.mjs`: add an `html.dark` variable override block to
   the shared static CSS (+ `color-scheme`), fix the one hardcoded light
   `.toc` background, and load the existing `public/theme.js`
   (CSP-compliant external script, same key/semantics as
   `src/lib/theme.ts`) in every static head via the shared `FP_BEACON`
   include. All static pages benefit, not just /pricing/.
3. Friendly fallback error copy in `src/lib/api.ts` (429 / 5xx / other)
   and `src/lib/license.ts` (unexpected-200 vs non-OK). Server-provided
   `error` strings still take precedence — behavior unchanged whenever
   the API follows its protocol.

## Non-goals

- No theme toggle UI on static pages (preference is set in the app).
- No change to quota/paywall gating logic or billing endpoints.
- No real payment integration (still deferred per standing instruction).

## Verification

- Local: tsc, eslint, vite build + build-seo (grep emitted /pricing/
  index.html for `html.dark` + theme.js include).
- Production (testing agent, mocks, zero real AI): 402 → UpgradeDialog →
  Esc/X/overlay returns focus to the AI opener button; regression on
  R340 dialogs (Share/History) still refocusing; `/pricing/` honors
  `honestcv.theme='dark'` and system-dark, stays light otherwise;
  fallback strings verified via empty-body 429 and expiresAt-less 200
  mocks; 375px + dark checks; baselines restored.
