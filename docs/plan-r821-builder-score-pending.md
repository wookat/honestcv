# R821 — The Builder's own score waits for the first PDF measurement (no 83 → 79 flash)

Chain: R820 (#1038) → this PR.

## Question this round answers

R820 made the dashboard, the saved-copy rows and the copies dialog score with the measured PDF page
count and show `…` until it is known. Its production QA left one surface out: the Builder's own
open-draft score (pane badge, ATS ring, checks list, health chip, readiness tier) still rendered the
page-count-blind **83 for ≈ 812–820 ms** after load and then changed to the measured **79**. This
round asks: can the Builder show *no* number until the measurement lands, without slowing the first
measurement or breaking the surfaces that read `ats`?

## Evidence (production before the fix)

R820 testing-agent timeline (`/home/ubuntu/qa/r820-qa/builder-mobile-initial83.png` /
`-measured79.png`): mobile badge 83 then 79. Cause, verified in code:

- `usePdfLength` scheduled *every* measurement — the first one included — behind the 800 ms edit
  debounce (`setTimeout(..., 800)`), and returned `null` for both "not yet" and "failed".
- `Builder.tsx` computed `ats = scoreResume(shown, jd, pdfLength?.pages ?? null)` for the whole page,
  so every consumer of `ats` (badge, ring, checks, health chip, readiness, assistant fixes) rendered
  the blind number for those 800 ms.

The dashboard / copies dialog did not have the flash because R820's `AtsScoreValue` renders `…`
while `usePdfPages()` is `undefined`.

## Options

| option | verdict |
|---|---|
| Render `…` in the Builder while the first measurement is pending; start that measurement at once (still behind the idle gate); keep the 800 ms debounce only for re-measurements after edits | **chosen** |
| Keep showing the blind number and let it correct itself | rejected — the 83 → 79 flash is the defect (R820 already rejected it for the dashboard) |
| Persist the last measured page count and score with it on load | rejected — stale after any edit / template change; a wrong number is worse than a pending mark |
| Estimate pages from text length before the PDF is ready | rejected — R813 measured the drift of text-based page estimates |
| Skip the page check in the Builder too | rejected — hides a real two-page defect; R820 rejected it |

## Fix

`src/lib/usePdfLength.ts`

- `usePdfMeasure(resume, delayMs)` runs the first measurement with a 0 ms timer (`started.current ?
  delayMs : 0`) and every later one after `delayMs`; expensive PDF work still waits for
  `whenIdleForPdfMeasure()`.
- Three states: `null` (pending) → `ResumeLength` (measured) or `'unavailable'` (the measurement
  rejected and there is no previous value to keep). `usePdfLength()` maps them to `undefined` /
  `ResumeLength` / `null`, the same contract as `usePdfPages()`.

`src/pages/Builder.tsx`

- `const pdfMeasure = usePdfLength(shown)`; `pdfLength = pdfMeasure ?? null` feeds the length meter
  and `ats` as before; `atsPending = pdfMeasure === undefined`.
- While pending: `PendingScoreRing` (same geometry as `ScoreRing`, muted track, `…`, `role="img"`
  `aria-label="ATS match score: measuring the exported PDF's page count"`), pane badge `…` with the
  same aria-label, Structure `…`, health-dialog title `ATS …/100`, readiness tier muted with no
  blockers listed, health-check ✗ / ✓ hidden. Nothing renders `ats.score` while pending (source test).
- Measurement failed (`pdfMeasure === null`): the page-count-blind score settles (page check n/a, no
  row) — never hangs on `…`; the length meter now reads **"Resume length: unavailable — the PDF preview
  could not be prepared, so page guidance is off until it loads"** (aria `Resume length is
  unavailable`) instead of "measuring …" forever (found by the R821 production QA on the blocked-chunk
  scenario — pre-existing, fixed here because the pending / failed split is this round's change).

`src/lib/motion.ts`

- `useCountUp` → `countUpValue(from, target, elapsedMs, durationMs)` with progress clamped to
  `[0, 1]`. Production QA sampled the ring at `0, -12, 18, … 79`: the first rAF timestamp preceded the
  `performance.now()` the tween was armed with, so progress went negative and the eased value swung
  below zero for a frame. Pre-existing (every `ScoreRing` since the landing page), first observed
  because R821's ring now starts its count-up from `…` at a measurable moment.

## Tests (`tests/ats-score-pages.test.ts`, 286 → 291)

- the first measurement starts at once, later ones are debounced (source);
- `usePdfLength` distinguishes pending `undefined` from unavailable `null` (source);
- every `/100` number, the ring, the badge and the readiness tier wait for the measurement (source:
  the only `<ScoreRing score={ats.score}` sits in the `atsPending ? … :` branch, no bare
  `>{ats.score}<`);
- the length meter says "unavailable" when the measurement failed, "measuring" only while pending;
- `countUpValue` never leaves `[from, target]` for elapsed −200 … 1200 ms (the −12 frame).

## Local gates

vitest 291 · `tsc -p tsconfig.app.json` · `tsc -b` · eslint 0 errors / 11 pre-existing warnings ·
build · verify-dist (123 URLs). Recorded in `docs/handoff-context.md`.

## Deploy + production QA

Three deploys this round (pending state → count-up clamp → meter wording); the final production
bundle is `index-BQyK-q8D.js` / `Builder-DfMymryW.js` / `ScoreRing-Cgz0e36R.js` /
`useHistoryGuard-CWkiq6rF.js` (holds the PDF hook) / `Dashboard-BRrLyBTr.js` / `ats-Bdsg1AXd.js`,
SHA = local `dist/client`. Route listing still `code: 10000` (token permission, upload succeeded).

Testing agent, independent 1280 and 375, cache disabled, storage restored byte for byte, GET-only,
0 downloads (`/home/ubuntu/qa/r821-qa/`):

- Startup (per-surface mutation timeline from navigation): first pending mark at 746 ms (1280) /
  630 ms (375); badge / semantic 79 at 1290 / 1049 ms; **83 never appears on any Builder surface**
  (before R821: 83 for ≈ 800 ms). Visible ring count-up 0 → 79 over ≈ 0.9 s (existing animation);
  on the first revision it sampled `-12` at 1310 ms (375) — fixed by the clamp; on the clamp revision
  both widths are monotone within 0–79.
- Settled: ring = badge = Structure = Health `ATS 79/100`, page check `✗Fits …` present; dashboard
  draft / copy rows and the copies dialog 79; one-character edit re-measures after ≈ 800 ms and keeps
  79; `pdf-*.js` blocked → Builder and dashboard 83, no page-check row, no hang; executive 83 ✓; one
  role 92 ✓; axe 0 violations pending and settled (1280), settled (375).
- Length meter on the blocked-chunk path: first revision kept saying "measuring …" 4 s after the
  failure (`/home/ubuntu/qa/r821-qa/clamp/375-fallback-meter.png`) — fixed in the third revision
  (see the final testing-agent report in `docs/handoff-context.md`).
- Inconclusive: a "pending" Health dialog / pending Structure on 375 — the measurement settles in
  ≈ 1 s, before the dialog can be opened; covered by the source test instead.

## Production runtime finding (not a code change this round)

During the QA `/api/ai/quota` returned **HTTP 500** whenever a valid `x-client-id` header was sent
(200 `{"freeRemaining":null}` without one); `/api/jobs/search` and `/api/share/:id` also returned
500. `wrangler tail`: `Error: KV get() limit exceeded for the day.` — the Cloudflare **free-plan KV
daily read cap** (100 k `get()`/day) was exhausted, so every KV-backed route fails until the UTC
reset. The client already treats a quota failure as "unknown" (`fetchAiQuota` → `null`), so the
Builder / plan card degrade silently; the jobs board and shared résumés do not. This is an operations
/ resilience gap, queued as **R822**: (1) find the reader that burns the budget (HTML `/s/:id`
requests read KV per crawler hit; `/api/jobs/search` reads several KV snapshot keys per query;
quota middleware reads per AI call), (2) put the Cache API in front of the hot reads and degrade to
"unavailable" instead of 500 when KV throws, (3) resource request to the boss: Workers Paid plan
lifts the cap to 10 M reads/day.

## Boundaries

- The count-up still animates 0 → N over 0.9 s once measured (intermediate numbers are the existing
  motion design, not scores); under `prefers-reduced-motion` it snaps.
- The pending state lasts as long as the first PDF composition (≈ 0.6–1.3 s on the fixture); on a slow
  device the `…` is visible longer — by design.
- A failed measurement still scores page-count-blind (no estimate); the meter now says so.
- Tailoring report internals unchanged; `/ats-checker` text path unchanged.
