# R154 — Guided one-at-a-time keyword triage card (AI Keyword Targeting)

## First-hand Rezi observation (2026-08-31, app.rezi.ai finish-up sidebar)

- The Finish Up sidebar has an "AI Keyword Targeting" card that walks through
  missing job-posting keywords ONE at a time: "Is this missing keyword
  relevant to your experience?" + the keyword as a highlighted chip, then two
  large buttons — "Yes - Add Bullet Point" (primary) and "No" (outline).
- Answering advances to the next missing keyword; the flat keyword list
  ("Consider adding the following keywords…") stays below as a secondary view.

## RezUp gap

Our Target job panel lists missing keywords as chips, each with three tiny
per-chip actions (+ add to Skills / Sparkles draft bullet / × not relevant).
Functionally complete but decision-dense: users face N chips × 3 micro-buttons
at once instead of one clear question at a time.

## Design

Add a triage card above the existing "Missing (N)" chip list (shown only when
`ats.missing.length > 0`; chips stay unchanged below):

- Header: "Is this missing keyword relevant to your experience?" + the first
  missing keyword (`ats.missing[0]`) as a highlighted chip + "1 of N" counter.
- Actions (all reuse existing handlers, min-h-10 touch targets):
  - "Yes — draft a bullet" (primary): `setKwBulletFor(kw)` — existing AI
    keyword-bullet dialog; accepting inserts the bullet, keyword leaves
    `ats.missing` on recompute and the card advances automatically.
  - "Add to Skills" (outline): existing append-to-skills logic.
  - "No — not relevant" (ghost): appends to `resume.ignoredKeywords`.
- No index state: the card always shows `ats.missing[0]`, so it advances by
  derivation whenever an action removes the keyword from the missing pool
  (skills add / ignore are immediate; AI bullet on accept). Zero new state,
  schema, storage keys, or deps.
- When `ats.missing` empties, the card disappears (existing "Matched" list
  remains).

## Not doing

- Rezi's per-keyword PRO teasers/locks (business-model difference).
- Auto-generated bullet without user confirmation (our dialog flow stays).

## Acceptance

- 1600: with a JD set, card shows first missing keyword + 1 of N; "Add to
  Skills" appends and advances to next keyword; "No" excludes (keyword shows
  in Excluded, restorable) and advances; "Yes" opens the existing draft-bullet
  dialog for that keyword.
- 375: buttons ≥40px, no overflow.
- Regressions: per-chip micro-actions unchanged; ATS score recomputes; R153
  dialog and R152 chip unaffected.
