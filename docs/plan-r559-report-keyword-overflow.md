# R559: expandable "+N more" in the job tailoring report

## First-hand production evidence (2026-08-31, cv.zalize.com)

- `/jobs?q=react` → "Senior React Full-stack Developer" (Lemon.io) → open
  "Tailoring report" with a seeded resume (React/TypeScript/Node.js/AWS/
  Docker/Kubernetes):
  - Report reads "covered 4 of 30 job keywords", lists 10 high-priority
    missing keywords, then a plain text "+14 more".
  - The "+14 more" text is a `<span>` — not clickable. 14 of 24
    high-priority missing keywords are permanently invisible; there is no
    way to see them anywhere in the report.
  - The "Also missing:" row has the same dead "+N more" span.
- Ten lines lower in the same pane, the Skills tag list renders the same
  "+14 more" as a working expand button (R244 pattern, `tagsExpandedId`).

## Rezi comparison

Rezi's keyword targeting lists every missing JD keyword; its August 2026
changelog week 4 highlights job-content visibility improvements. Hiding
most of the missing-keyword list behind dead text under-informs exactly
the users who most need tailoring (long JDs with many keywords).

## Fix (smallest useful)

`src/pages/Jobs.tsx` only:

- New `reportKwExpandedId` state (same shape as `tagsExpandedId`, keyed by
  job id so switching jobs resets the collapse).
- Both "+N more" spans in the tailoring report become buttons that expand
  their full keyword list for the selected job, styled like the Skills
  "+N more" expander.

No scoring, worker, or storage changes.

## Verification

- `npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`,
  `npm run verify-dist` — all green locally.
- Deploy attempt: assets + worker upload succeed; Workers Routes publish
  still fails with auth code 10000 (known token limitation).
- Production QA (desktop 1280 + mobile 375): expander shows all keywords,
  collapse resets when selecting another job, Skills expander regression,
  zero horizontal overflow, no console errors, storage restored to the
  documented baseline keys.
