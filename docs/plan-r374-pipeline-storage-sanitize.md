# R374 — /jobs survives malformed pipeline storage

## Evidence (production, R373 QA)
- During the R373 production run, a pipeline entry seeded with a wrong shape
  (`events`/`date` instead of `history`/`at`, missing `job.id`) hard-crashed /jobs on open:
  `TypeError: Cannot read properties of null (reading 'text')` in `Jobs-DJCvhJ6s.js`, React root
  unmounted (white screen). The seed was a QA mistake, but real users can hit the same via
  old/corrupt/hand-edited `honestcv.jobPipeline` data — and the page offers no recovery: every
  /jobs visit crashes until the key is cleared by hand.
- Source root cause: `listPipeline()` does `JSON.parse(raw) as PipelineEntry[]` with zero shape
  validation — the only guard is the JSON.parse try/catch. Every field (job.id/title/description,
  status, updatedAt, history steps, notes) is trusted downstream by Jobs.tsx, followUpEmail,
  timelineOf, structureJobDescription.
- Contrast: resume storage already normalizes on read (resume.ts coerces via asStr/array checks,
  e.g. legacy skills arrays) — the pipeline is the outlier.

## Design (deterministic, read-side normalization)
In jobs.ts, `listPipeline()` maps parsed data through a `sanitizeEntry(raw): PipelineEntry | null`:
- non-object entry or non-object `job` → dropped; `job.title` and `job.id` both empty → dropped.
- Missing `job.id` → synthesized as `` `${title} @ ${company}` `` so selection/upsert keying works.
- All JobListing string fields coerced with `asStr` (title/company trimmed per R368); `tags` kept
  only as a string array; `logo` kept only when a string.
- `status` outside JOB_STATUSES → `'saved'`; `updatedAt` non-finite → `Date.now()`.
- `history` kept only as an array of `{status ∈ JOB_STATUSES, at: finite number}` steps (invalid
  steps dropped; empty result → undefined so `timelineOf` synthesizes as today).
- `resumeVersionId`/`notes` kept only when strings.
- Parse failure or non-array root unchanged (→ []). Well-formed entries pass through
  value-identical; sanitize is read-side only (next mutation persists the clean shape).

## Acceptance
- Oracle: QA's exact malformed seed loads as a usable entry (no throw, synthesized id, status
  kept, history undefined); garbage roots/entries dropped; invalid status/updatedAt/history-step
  coercion; well-formed entry deep-equal through sanitize. tsc/eslint/build green.
- Production QA: seed the exact R373 crash payload → /jobs renders (no white screen), entry
  usable, follow-up draft works; well-formed pipeline byte-stable across a load+mutation cycle;
  R372/R373 regression spot-checks; 375 light/dark; baseline restore.
