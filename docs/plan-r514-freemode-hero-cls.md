# R514 — kill the homepage hydration layout shift (freeMode hero copy swap)

## Evidence (first-hand, production)

- Lighthouse sweep (mobile, 2026-08-31): `/` is the only main route with
  non-zero CLS — perf 0.93, CLS **0.041**; layout-shifts attributes it all to
  the hero CTA block.
- Throttled CDP probe (412px, 400ms RTT): hero paragraph height drops
  **140px → 112px** (one `text-lg` line), CTA row top 482 → 440, buffered
  PerformanceObserver records a 0.056 shift.
- Diagnostic probe (this round): the paragraph *text itself changes* at
  hydration — 172 chars of paid copy ("Pay **$9.99 one time**…") becomes
  161 chars of free-beta copy ("**Every plan is free during beta**…").

## Rejected hypothesis (recorded honestly)

The first diagnosis blamed `font-display: optional` fallback metrics and
added metric-matched `Inter Fallback`/`Sora Fallback` faces (next/font
technique). A production probe with the fallback faces resolving
(`document.fonts.check` true) showed the identical 140→112 shift — the fonts
were not the cause; the copy swap is. The CSS changes were reverted.

## Root cause

`useFreeMode()` starts `false` and flips to `true` only after
`/api/billing/status` resolves. The prerendered shell and the first hydrated
render therefore show the paid hero copy (5 lines at 412px); the async flag
then swaps in the shorter free-beta copy (4 lines), moving the CTA row and
caption up — the recorded CLS. It is also dishonest: production *is* in free
mode, yet the first paint advertises "$9.99 one time".

## Fix

`FREE_MODE` is a deploy-time var committed in `wrangler.jsonc`, so it is
knowable at build time:

- `vite.config.ts` + `vite.ssr.config.ts`: read `FREE_MODE` from
  `wrangler.jsonc` and `define` a global `__FREE_MODE__` (declared in
  `src/vite-env.d.ts`).
- `src/lib/freeMode.ts`: seed `useState(__FREE_MODE__)` so the prerendered
  shell (SSR build) and first hydration both render the free-mode copy. The
  `/api/billing/status` fetch stays authoritative: the response now sets the
  state in both directions, so a runtime-only flag flip (dashboard env change
  without rebuild) still corrects the UI after load.

## Non-goals

- No copy changes; no change to `font-display`, prerender flow, or worker
  shell handling.

## Validation

- Local: tsc, eslint (changed files), build, verify-dist; prerendered
  `dist/client/index.html` contains the free-beta copy and no "$9.99 one
  time".
- Production: throttled CDP probe — paragraph height constant pre/post
  hydration, layout-shift observer 0 on `/`; Lighthouse `/` CLS 0.041 → 0;
  375/1280 overflow + console checks; /builder and paywall copy regression.
