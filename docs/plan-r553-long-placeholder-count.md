# R553 — letter placeholder counters miss long template placeholders

## First-hand evidence (production CDP, 2026-08-31)
- `/builder?doc=cover` → "Start from a template" generates a letter containing **5** bracketed
  fill-in slots, but the dialog reports **"3 placeholders left"**. The two missed slots:
  - `[One sentence on why this company or team specifically — a product, a mission, a recent launch.]` (96 chars inside)
  - `[your strongest, most relevant achievement — with a real number if you have one]` (80 chars inside)
- `/builder?doc=resignation` template: reports "1 placeholder left" while the text still contains
  `[Manager name]` **and** `[one specific thing you genuinely appreciated: a project, a skill you grew, the team]` (85 chars) — 2 real slots.
- Consequence chain: "Next placeholder" never selects the long slots; once the short slots are
  filled the counter hits 0, the export placeholder warning (R504/R507) stops firing, and the
  user can export/send a letter with obvious unfilled `[...]` brackets.

## Root cause
All letter placeholder helpers use the regex `/\[[^\][\n]{1,60}\]/` (inner length capped at 60),
while our own letter templates emit placeholders up to 96 chars inside the brackets:
- `src/pages/Dashboard.tsx`: `countLetterPlaceholders`, `firstLetterPlaceholder`, `jumpToNextPlaceholder`
- `src/pages/Builder.tsx` (BundleToolDialog): `countLetterPlaceholders`, `firstLetterPlaceholder`, `jumpToNextPlaceholder`

## Fix (smallest valuable)
Raise the inner-length cap from 60 to 120 in the six letter-placeholder regexes (Dashboard ×3,
Builder BundleToolDialog ×3). 120 covers the longest template slot (96) with headroom and still
excludes `]`/`[`/newline inside, so multi-line or nested brackets stay unmatched.

## Non-goals
- Resume-side placeholder scan (`Builder.tsx` download check, `guidance.ts` consistency scan)
  stays at 60 — resume templates don't emit long placeholders and resume text has more bracketed
  noise.
- No template text changes, no counting-UI changes, no export changes.

## Verification
- Local: `npx tsc -b`, `npx eslint src/pages/Dashboard.tsx src/pages/Builder.tsx`, `npm run build`, `npm run verify-dist`.
- Deploy: `npx wrangler deploy` (assets upload; Workers Routes auth code 10000 expected).
- Production QA (1280×900 + 375×812): cover template reports 5 placeholders; Next placeholder
  cycles through all 5 incl. the 96-char slot; resignation template reports 2; Dashboard letter
  example editor counts long slots; export warning fires while any long slot remains; zero
  overflow/console errors; QA storage restored to baseline.
