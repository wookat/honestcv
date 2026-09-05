# R417 — /jobs load failure: role=alert + Try again

## Production evidence (2026-08-31, index bundle live)
CDP-forced `/api/jobs/search` network failure on https://cv.zalize.com/jobs (probe_r417.py):
- The list area shows the R413 friendly copy `Loading jobs failed — check your connection and try again.`
- But it is a plain `<p class="text-destructive">`: **no `role=alert`** (screen readers never announce it) and **no Try again button** — the copy tells the user to "try again" yet the only retry path is re-submitting the search form, which is not obvious when the box is empty.
- Every other load-failure surface shipped since R412 (shared resume, /samples, ?example deep link) pairs the copy with `role=alert` + a Try again button.

## Fix (Jobs.tsx only)
Replace the bare error `<p>` in the list panel with a `role="alert"` block (same card style as R415's /samples failure) containing the existing message plus an outline `Try again` button that calls `runSearch(query, category)` (sets loading, clears error, refetches with the current inputs).

Out of scope: the search happy path, empty-state copy, pipeline-only tabs (they don't depend on the fetch).

## Follow-up (same round, QA-driven)
First-round QA proved the error branch occupied the list-pane slot on **every** tab, so a failed fetch also hid the locally-stored pipeline on `?tab=tracked` (pre-existing masking inherited from the bare `<p>`). Scoped the error card to `tab === 'all'`; tracked/status tabs render from `honestcv.jobPipeline` regardless of fetch state. Re-verified on production (Jobs-QvadXlzM.js).

## Validation
- `npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`
- Production QA: forced failure → alert + button; Try again with interception removed → list loads; role=alert announced; happy path unchanged; 375 light/dark; zero unsafe traffic; baseline restored.
