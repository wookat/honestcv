# R406 — cap the ATS checker JD highlight view so huge pasted JDs can't freeze the page

## Evidence (production, CDP profile 2026-08-31)

Seeded `honestcv.atsCheckerDraft` with a small resume + ~1,030,100-char JD, `checked: true`,
then reloaded `https://cv.zalize.com/ats-checker`:

- load: a **3145ms** long task plus heavy renderer churn (the profile's original
  "133.1s load-to-report" figure was a harness artifact — the poll string never matched the
  page copy, so the loop ran to its timeout; see the corrected measurement below)
- DOM after render: **220,537 nodes**, **110,110 spans** inside `main`
- per-keystroke input latency in the JD textarea afterwards: **957 / 379 / 309 ms**

R404 already measured the *scoring* chain (`scoreResumeText` + `parseResumeText` + `resumeHealth`)
at <260ms in Node for the same input, so the freeze is render-side. The culprit is the
"Job description with keywords highlighted" box: `segmentJd()` regex-splits the **entire** JD
and renders one `<span>`/`<mark>` per segment, inline in render (recomputed and re-mounted on
every keystroke). A 1MB JD with repeating keywords yields ~110k elements.

## Fix (minimal)

In `AtsChecker.tsx` only:

1. Cap the highlight view at `HIGHLIGHT_LIMIT = 20_000` chars: run `segmentJd` on
   `jd.slice(0, HIGHLIGHT_LIMIT)`; when truncated, append a muted note that only the first
   20,000 characters are highlighted and the score still uses the full text. Real JDs are
   well under 20KB, so normal use renders byte-identically.
2. Memoize the segments with `useMemo` keyed on `(jd, result)` so keystrokes in the resume
   textarea don't re-run the regex/re-mount the highlight box.
3. Feed scoring/analysis through `useDeferredValue(resumeText)` / `useDeferredValue(jd)` so
   the ~140ms full-text rescore of a 1MB JD runs as a deferred render instead of blocking
   each keystroke's urgent update.

Scoring, keyword extraction, draft persistence, and all other report sections are untouched —
the score continues to use the full text.

## Verification

- `npx tsc -b`, `npx eslint src/pages/AtsChecker.tsx`, `npm run build`
- Re-run the CDP profile on production: load-to-report should drop from ~133s to seconds,
  DOM span count bounded, keystroke latency near-normal; normal-size JD renders identical
  highlights with no truncation note.
- Testing-agent QA: report correctness on the example pair, truncation note appears only
  for oversized JDs, R405/R403 regressions.

## Measured result (production, corrected CDP profile)

With the same 1.03MB seeded draft on the deployed fix:

- time-to-report: **1.0s** (was a multi-second freeze; longest long task now 379ms vs 3145ms)
- DOM: **4,812 nodes / 2,246 spans** (was 220,537 nodes / 110,110 spans)
- keystroke-to-paint in the JD textarea: **285/327/307ms** (was 957/379/309ms); the residual
  cost is laying out the 1MB controlled textarea + persisting the draft, not scoring — Node
  measures `scoreResumeText` on the same input at 139ms and it now runs deferred.
- normal-size JD (example pair): identical highlights, no truncation note.
