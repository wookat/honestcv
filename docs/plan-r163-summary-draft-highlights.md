# R163 — Guided summary draft: position + skills highlights

## Firsthand Rezi observation (public app, 2026-08-31)

Rezi's Summary page has an "AI Summary Writer" side panel with two structured
inputs the writer is driven by: **Position Highlight** (a required select,
prefilled "from resume" with the candidate's role) and **Skills Highlight**
(a required skill input). Only after these are set does the "AI Writer ready"
button generate. The generated summary is thus targeted at a chosen position
and emphasizes chosen skills.

RezUp's "Draft from my resume" (empty-summary state) fires immediately with
only `aiTargetRole(resume)` and the resume text — the user cannot steer which
position framing or which skills the drafts should highlight.

## Change

When the summary is empty and the user clicks "Draft from my resume", open a
small dialog before calling the API:

- **Position highlight**: select built from the target role plus distinct
  experience roles on the resume (default: existing `aiTargetRole(resume)`).
  Free data, no typing needed — mirrors Rezi's "from resume" select.
- **Skills highlight**: toggle chips parsed from the resume's own skills
  (split `skillLines()` text on commas, dedupe, cap display at 18); user may
  select up to 5 to emphasize. Optional — skipping keeps current behavior.
- "Write 3 drafts" runs the existing `runSummaryDraft` flow with the choices.

Plumbing (all additive/optional):

- `aiSummaryDraft(input)` gains `highlights?: string[]`.
- Worker `/api/ai/summary-draft` accepts `highlights` (strings, cap 8,
  each trimmed ≤40 chars) and passes them to `buildSummaryDraftMessages`,
  which appends: emphasize these skills **only as supported by the resume**.
- Grounding rules unchanged: drafts still use only facts present in the
  resume text; highlights only steer emphasis.

Zero schema/storage changes; quota, variant-pick dialog, "AI polish summary"
(non-empty path), and summary library untouched.

## Out of scope

- Generating summaries from data not on the resume.
- Changing the polish (rewrite) path or its prompts.

## QA

- 1440: empty summary → "Draft from my resume" opens the dialog; position
  select lists target role + experience roles; skill chips come from the
  resume's skills; selecting 2 chips + drafting returns 3 variants that
  mention/emphasize the chosen skills; picking one fills the summary.
- Skipping highlights (no chips) still drafts (regression of old behavior).
- Non-empty summary still shows "AI polish summary" (no dialog).
- 375: dialog scrolls, chips wrap, no horizontal overflow.
- Free-quota decrement + error paths unchanged.
