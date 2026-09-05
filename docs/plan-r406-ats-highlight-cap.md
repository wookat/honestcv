# R406 — cap the ATS checker JD highlight view so huge pasted JDs can't freeze the page

## Evidence (production, CDP profile 2026-08-31)

Seeded `honestcv.atsCheckerDraft` with a small resume + ~1,030,100-char JD, `checked: true`,
then reloaded `https://cv.zalize.com/ats-checker`:

- load-to-report: **133.1s** of frozen page (single long task 3145ms + renderer churn)
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

Scoring, keyword extraction, draft persistence, and all other report sections are untouched —
the score continues to use the full text.

## Verification

- `npx tsc -b`, `npx eslint src/pages/AtsChecker.tsx`, `npm run build`
- Re-run the CDP profile on production: load-to-report should drop from ~133s to seconds,
  DOM span count bounded, keystroke latency near-normal; normal-size JD renders identical
  highlights with no truncation note.
- Testing-agent QA: report correctness on the example pair, truncation note appears only
  for oversized JDs, R405/R403 regressions.
