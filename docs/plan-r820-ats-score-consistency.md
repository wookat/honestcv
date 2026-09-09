# R820 — One ATS number per résumé: dashboard, saved-copy rows and the copies dialog score with the measured PDF page count

Chain: R819 (#1037) → this PR.

## Question this round answers

Does the same stored résumé show the same ATS number everywhere the product prints one? The
candidates for R820 were "LinkedIn non-English exports", "bare-city contact row" and a 640–1023
Builder visual review; a first-hand pass over the dashboard and the Builder with one seeded draft
(`qa/r815/all-sections.json`, the R815–R818 fixture, no job description) found a discrepancy that
outranks all three: the **same** draft reads two different scores depending on which page shows it.

## Evidence (production, before the fix)

`/home/ubuntu/qa/r820-evidence.cjs` (768 and 1280) and `qa/r820-evidence-copy.cjs` (1280) — cache
disabled, `honestcv.qa=1`, storage restored byte for byte, 0 console / page errors, 0 non-GET
requests.

| surface | reads |
|---|---:|
| `/dashboard` "Current draft · ATS" | **83**/100 |
| `/dashboard` saved-copy card / row "ATS" | **83**/100 |
| Builder "Resume copies" dialog row | **83**/100 |
| Builder pane-switcher badge / ATS panel ring / health chip (open draft) | **79**/100 |
| Builder preview "ATS match score" | **79**/100 |

Screenshots `/home/ubuntu/qa/shots/r820-evidence-*/`, `r820-evidence-copy/`.

The Builder's check list explains the 4 points: `Fits the recommended page count — Your resume runs
2 pages — recruiters expect 1 (two only at director/executive level)`. That check exists only where
the caller hands `scoreResume` a page count.

## Root cause (code, verified)

```ts
export function scoreResume(resume: Resume, jd: string, pdfPages?: number | null): AtsResult
```

- `pageLengthCheck(pdfPages, level)` returns `na: true` when `pdfPages == null || pdfPages < 1`;
  `finalize()` drops `na` checks from the denominator **and** from the returned `checks`.
- `Builder.tsx` measured the exported PDF (`measureResumePdf` → `doc.getPageCount()`, idle-gated,
  800 ms after the last edit) and passed `pdfLength?.pages` → 24 applicable checks, 19 pass → **79**.
- `Dashboard.tsx` (current draft, copy cards, copy rows) and the Builder copies dialog called
  `scoreResume(visibleResume(v.data), v.data.jobDescription)` with **no** page count → 23 applicable,
  19 pass → **83**.

Local reproduction (now `tests/ats-score-pages.test.ts`): `measureResumePdf(fixture).pages === 2`,
`scoreResume(fixture, '')` = 83, `scoreResume(fixture, '', 2)` = 79.

So the 83 is not a different opinion — it is the same scorer with one check silently switched off.
A user who trims their résumé to one page in the Builder sees the score move; the dashboard never
does, and a saved copy that runs to three pages looks as good as a one-page one.

## Options considered

| option | verdict |
|---|---|
| **A. Measure the PDF for every displayed score, show a pending mark until measured** (chosen) | one scorer, one input, one number; the measurement is what the Builder already does; costs one PDF composition per distinct stored résumé (6–9 ms after the pdf chunk loads) |
| B. Drop the page count from the Builder too | hides a real, user-visible defect (the 2-page mid-level résumé) to make numbers agree — rejected |
| C. Estimate pages from text length on the dashboard | a second, different page model; R813 showed how far a non-typeset estimate drifts from the PDF paginator — rejected |
| D. Store the measured page count with the résumé | stale the moment the résumé or template changes; every write path would have to invalidate it — rejected |
| E. Show the page-count-blind number first, then correct it | the "83 → 79" flicker is exactly the contradiction being fixed — rejected; the pending state is a deliberate ellipsis |

## Implementation

- `src/lib/usePdfLength.ts` (new, shared): `whenIdleForPdfMeasure()` (load + `requestIdleCallback`
  gate, moved from the Builder), `measurePdfOnceIdle(resume)` — one measurement promise per résumé
  object (`WeakMap<Resume, Promise<ResumeLength>>`), a failed promise is evicted so a re-render
  retries — and one internal `usePdfMeasure(resume, delayMs)` with a sequence ref against stale
  results. Two public hooks:
  - `usePdfLength(resume)` — the Builder's fractional length meter, unchanged behaviour (800 ms
    delay, `null` until measured or when unavailable).
  - `usePdfPages(resume, delayMs = 0)` — `undefined` while pending, `null` when the measurement
    failed (→ page check not applicable, no invented estimate), the integer page count otherwise.
- `src/components/AtsScoreValue.tsx` (new): `visibleResume` once per source object (WeakMap, so the
  dashboard card, the row and the copies dialog share one measurement key), `usePdfPages`, and
  `scoreResume(shown, shown.jobDescription, pages)` **only after** `pages !== undefined`. Pending:
  `<span title="Measuring the exported PDF's page count">…<span class="sr-only">measuring</span></span>`.
- `src/pages/Dashboard.tsx`: the three score displays render `<AtsScoreValue resume={…} />`; the
  page no longer imports `scoreResume` / `visibleResume`.
- `src/pages/Builder.tsx`: local idle gate + `usePdfLength` removed in favour of the shared module;
  the open-draft score still passes `pdfLength?.pages ?? null`; the copies dialog row renders
  `<AtsScoreValue resume={v.data} />`. The Tailoring report's `before` / `after` `scoreResume`
  calls are keyword-coverage comparisons (they read `keywordScore` / matched lists, never a /100
  score) and are intentionally unchanged.

Semantics now shared by every surface:

| measured pages | check | example (fixture, mid-level) |
|---|---|---:|
| pending (`undefined`) | no score shown (`…`) | — |
| unavailable (`null`) | not applicable, dropped from denominator | 83 |
| 1 | pass | ≥ 83 |
| 2, level below director | fail | **79** |
| 2, director / executive | pass | — |

## Tests (278 → 286)

`tests/ats-score-pages.test.ts`:

- omitted / `undefined` / `null` / `0` page counts → no page check, identical scores; `1` → check present;
- same résumé + JD + page count → same score;
- 1 page passes at every level; 2 pages fail at `mid` / `senior` / unset and pass at `director` /
  `executive`; 3 pages fail at `executive`;
- 2-page mid-level scores below the page-count-blind score; the only difference is the page check
  joining the applicable set (every other label / pass value identical);
- the production fixture (`tests/fixtures/all-sections.json`) measures 2 pages, scores 83 blind and
  79 measured, with the "runs 2 pages" hint;
- `AtsScoreValue` server-rendered (no effects) prints the pending mark and never `\d+/100`;
- source-level: `Dashboard.tsx` has no `scoreResume(` and renders `AtsScoreValue` three times;
  `Builder.tsx` imports the shared `usePdfLength`, has no local hook / idle gate, scores the open
  draft with `pdfLength?.pages ?? null`, has no `scoreResume(visibleResume(` call, renders
  `AtsScoreValue` in the copies dialog, and the Tailoring report never reads `.score`.

## Local gates

`npm test` · `npx tsc -p tsconfig.app.json --noEmit` · `npx tsc -b` · `npm run lint` ·
`npm run build` · `node scripts/verify-dist.mjs` — results recorded in `docs/handoff-context.md`.

## Deploy + production QA

Recorded in `docs/handoff-context.md` (R820 entry): asset SHAs vs `dist/`, then
`qa/r820-verify.cjs` at 375 and 1280 — dashboard current draft / copy row / Builder badge / preview
ring / copies dialog all read the same number after measurement; the pending mark is what is shown
before; the one-page, two-page mid-level and two-page executive fixtures score as the table above;
0 console / page errors, 0 non-GET, storage restored.

## Production QA result (testing agent, 1280 + independent 375)

Corrected harness **24/24 at each width** (original 21/24 per width — three page-check regexes
assumed a space after `✓` / `✗`; the row reads `✗Fits …`; original run kept, copy corrected). Settled
scores: mid / 2 pages **79** on every surface, executive **83**, one role **92**, pdf chunk blocked
**83** with no page-check row and no hang. Dashboard and copies dialog show `…` → 79, never 83.
0 non-GET, 0 unexpected errors, storage restored byte for byte. Recording
`/home/ubuntu/qa/r820-qa/r820-visual-readable-2x.mp4`.

**Found, not fixed here:** the Builder's own open-draft score still shows the page-count-blind 83 for
≈ 812–820 ms after load before the measured 79 (mobile badge captured at both values). That is the
pre-R820 Builder behaviour (`usePdfLength` debounces 800 ms on first mount as well as after edits,
and `ats` feeds badge, ring, checks list, health chip and assistant). Making the Builder's `ats`
pending is a wider change than this round's scope — R821.

## Boundaries

- The measurement cache is keyed by object identity. Two distinct objects with identical content
  (e.g. the same copy after a storage reload) measure separately — correct, just not deduplicated.
- If the PDF measurement fails (chunk load error, font error), the surface shows the page-count-blind
  score, not an estimate; the Builder's length meter shows nothing in the same situation (unchanged).
- Dashboard scores now appear after an idle-time PDF composition per distinct résumé (6–9 ms each on
  this fixture once `pdf.ts` is loaded); with many saved copies the list fills in progressively.
- `/ats-checker` (text path, `scoreResumeText`) has no PDF and no page check — unchanged.
