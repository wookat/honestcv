# R81 — per-entry "Suggest bullet" AI draft in the Experience editor

## First-hand evidence (2026-08-31, logged-in Rezi editor, ~/audit-r1/shots-r80/)

- `rezi-experience-suggest-bullet.png`: the Experience bullets textarea footer has a
  first-class "SUGGEST BULLET" AI button with a quota badge (10) plus the static hint
  "Aim for a balanced mix of descriptive and key number bullet points." One click
  appends an AI-drafted bullet for that role.

## HonestCV current state

We can AI-rewrite an existing bullet line (per-line "Fix line with AI") and draft a
bullet for a missing JD keyword (keyword-bullet, needs a JD). But a user staring at an
empty bullets box for a role has no AI path at all — both existing paths require prior
text or a JD. This is the exact blank-page moment Rezi's SUGGEST BULLET serves.

## R81 scope

New Worker endpoint `POST /api/ai/suggest-bullet` `{role?, company?, bullets?,
resumeText?}` (role or company required), same free-quota pattern as keyword-bullet
(peek → call → consume on success). Prompt (`buildSuggestBulletMessages`) follows the
established honesty rule from keyword-bullet: ground only in the resume, use bracketed
placeholders like `[add %]` / `[project name]` where specifics are unknown — never
invent facts; avoid duplicating the entry's existing bullets; output one plain-text
line.

Client: `aiSuggestBullet` in `src/lib/api.ts`; Builder Experience entry gets an
`aiButton('exp-<id>-suggest', 'Suggest a bullet')` under the bullets textarea that
appends the returned line to the entry's bullets. Shares `aiBusy`/quota/error UI with
every other AI button; disabled while any AI call is busy.

Not doing: quota badge on the button (sidebar plan panel already shows remaining
uses; title tooltip already shows it), JD-aware variant (keyword-bullet covers that),
multi-suggestion picker.

## Verification

Local: lint, tsc -b, build (worker is built into dist — build BEFORE deploy),
git diff --check. Production QA (throwaway client, 1 real AI call budgeted): click on
an entry with role only → one plausible bullet appended containing bracketed
placeholders rather than invented metrics; quota decremented by exactly 1; error path
(role+company empty) blocked client-side; 375px layout; regressions R79/R80 green
line unaffected; localStorage byte-restore.
