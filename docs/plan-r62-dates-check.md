# R62 — Employment dates structure check

## First-hand evidence (2026-08-29)

Rezi (authenticated, `~/audit-r1/shots-r62/`):

- Editor Experience tab sidebar shows a per-experience best-practice checklist with a red
  "Dates are missing" flag when a role has no start/end dates (`rezi-editor-experience.png`).
- Finish Up & Preview keeps the score gauge + AI Keyword Targeting "YES - ADD BULLET POINT"
  panel (`rezi-finishup.png`) — our R1 keyword-bullet drafting already covers that flow.

RezUp production:

- `scoreResume()` structure checks (builder + dashboard cards): contact, summary, bullets,
  quantified, skills, education — **no dates check at all**.
- `checkAts()` (text path used by /ats-checker uploads): email, phone, headings, skills,
  quantified, length — **no dates check either**.
- Honesty bug: the /ats-checker FAQ (R55) already answers "structure checks for the parts a
  parser expects (contact info, headings, **dates**, bullets)" — the copy promises a dates
  check the scorer does not perform.

## Why this gap

Employment dates are core ATS-parse data (parsers build a work timeline from them); Rezi
treats missing dates as a first-class red flag. Our score can show 100/100 with completely
undated roles, while our own FAQ claims dates are checked. Small, honest, verifiable fix.

## Scope (R62)

1. `scoreResume()`: new check "Employment dates listed" — passes when every experience entry
   with content (role or company filled) has a start date. Vacuously passes with no
   experience entries (the bullets check already covers absence).
2. `checkAts()` text path: new check "Employment dates found" — at least one 19xx/20xx year
   in the extracted text.
3. Builder score dialog copy: replace hardcoded "6-point" with the dynamic check count.
4. Static ATS-checker marketing copy in `build-seo.mjs`: "6-point" → "7-point".

Score scale note: structure sub-score stays ratio-based, so adding a 7th check simply
re-weights; keyword 70/30 blend unchanged.

## Out of scope

- Per-role inline checklist UI (Rezi-style sidebar per experience) — bigger UI change.
- Pro-gated writing checks (Personal Pronoun/Buzzwords/etc.) — our health report covers
  writing quality already.
- Date format validation/normalization.

## Acceptance

- Undated role → check fails in builder score dialog and lowers structure score; adding
  dates flips it green and raises the score.
- /ats-checker text upload without any year fails "Employment dates found".
- lint + tsc + build green; production QA at 1440/375 with console clean and localStorage
  restored byte-identical.
