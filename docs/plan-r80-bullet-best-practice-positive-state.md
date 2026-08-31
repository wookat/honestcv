# R80 — green best-practice confirmation on experience entries

## First-hand evidence (2026-08-31, logged-in Rezi editor, ~/audit-r1/shots-r80/)

- `rezi-best-practices-applied-expanded.png`: the per-entry content-analysis list in
  the Experience editor ends with a green, expandable "3 best practices applied"
  summary; expanded it lists green check items — "Short Bullet Points: Each bullet
  point should be a full line length", "Punctuated Bullet Points: Capitalize the
  first letter and end with a period for each", "Abbreviated Months".
  Problems are red/amber; satisfied practices get explicit positive confirmation.
- `rezi-experience-suggest-bullet.png`: per-entry "SUGGEST BULLET" AI button with a
  quota badge (10) and a static hint "Aim for a balanced mix of descriptive and key
  number bullet points."
- `rezi-contact-tab.png`: Contact tab has structured LinkedIn URL / website fields and
  per-field "Show on resume" toggles for Country/State — our contact model already has
  fullName/email/phone/location/website/linkedin, so no gap there this round.

## HonestCV current state

`BulletGuidance` (Builder.tsx) renders only problems: per-line issues from
`checkBullets` (R79: weak-opener/first-person/no-metric/filler/buzzword/punctuation/
length) and the R79 per-entry 3–6 bullet count note. When an entry passes everything
the component returns `null` — the user gets zero feedback that their bullets are in
good shape, and cannot tell "no warnings because it's good" from "no warnings because
checks didn't run" (e.g. empty entry).

## R80 scope (deterministic, client-only, zero AI/API/storage)

In `BulletGuidance`, when `entryFilled` and `count` is 3–6 and `results.length === 0`,
render a green confirmation line instead of returning null:

```tsx
✓ Bullet best practices applied — 3–6 bullets, quantified, capitalized and punctuated.
```

(`text-emerald-700`, same `text-xs` list style as the warnings.)

Not doing this round: per-entry AI "Suggest bullet" button (new AI spend path — needs
its own round with quota design), "Abbreviated Months" check (our placeholders already
teach `Jun 2023`), Contact "Show on resume" toggles (empty fields are already omitted
from every render path), inline textarea highlighting.

## Verification

Local: `npm run lint`, `npx tsc -b`, `npm run build`, `git diff --check`.
Production QA: green line appears only when entry filled + 3–6 non-empty bullets +
zero line issues; flips to warnings when a bullet regresses; absent on empty template
entries; 375px wrap; R79/R63 regressions; zero AI calls; localStorage byte-restore.
