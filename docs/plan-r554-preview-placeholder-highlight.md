# R554 — letter Preview renders placeholders as invisible plain text

## First-hand evidence (production CDP, 2026-08-31)
- /documents own copy: "Start from a proven letter for your role — **placeholders show exactly what to fill in**."
- Saved cover letter (template, 10 placeholders) → viewer → Preview tab: paragraphs render as plain
  `<p class="mt-4 whitespace-pre-wrap">I'm writing to apply for the [role] position at [Company]. …</p>` —
  no visual distinction for the bracketed slots. In the polished letterhead preview the placeholders
  blend into the body text; the count bar and "Next placeholder" are also hidden in Preview, so the
  preview surface gives zero signal about what still needs filling.
- Rezi's template flow visually marks the fill-in slots.

## Fix (smallest valuable)
In `Dashboard.tsx` `LetterPreview` only: render each paragraph through a splitter on the letter
placeholder regex `/(\[[^\][\n]{1,120}\])/` (same 120 cap as R553) and wrap matches in
`<mark>` with an amber highlight (works on the always-white letter sheet). Both paragraph maps
(before/after signature) use it. Zero changes to exports, counting, Edit tab, or Builder dialog.

## Non-goals
No template/export/scoring changes; no Builder dialog preview (it has none); no resume-side scans.

## Verification
tsc -b; eslint Dashboard.tsx; npm run build; npm run verify-dist; deploy; production QA at
1280×900 + 375×812: Preview shows amber-highlighted [slots], filled text unhighlighted, examples
preview highlighted too, zero overflow, zero console errors; storage restored to baseline.
