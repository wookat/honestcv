# R569 — /jobs linked-letter rows show the unfilled-placeholder count

## Evidence (production CDP, 2026-09-06)

- Seed: cover doc `d1` with 4 `[placeholders]`, pipeline `j1` (applied, `coverDocId:'d1'`).
- `/documents` card meta (R555): `Cover letter · Edited today · 4 to fill · for Senior Engineer at Globex`.
- `/jobs?job=j1` detail pane row: `Cover letter: | Globex — Cover letter | Open` — **no unfinished signal**
  at exactly the surface where the user decides "is this application ready?".
- Same for the resignation row; interview briefs don't use bracketed placeholders (matches R555 scoping).

## Rezi comparison

Rezi's August "Improved Application Tracking" keeps application artifacts and their state
visible in the tracker. Our tracker shows the artifact but hides that it still contains
obvious `[placeholders]` the export warning (R504/R553) would flag.

## Fix (smallest)

`src/pages/Jobs.tsx` only — in the cover and resignation linked-doc rows, when
`countLetterPlaceholders(doc.text) > 0` append the R555 amber badge
`· N to fill` (same regex `\[[^\][\n]{1,120}\]`, same `text-amber-600 dark:text-amber-400`
styling). Interview row unchanged. No storage, scoring, or navigation changes.

## Validation

`npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`, `npm run verify-dist`;
`npx wrangler deploy` (Workers Routes code 10000 expected); production QA 1280/375:
badge on cover+resignation rows matches the /documents card count, filled letter (0
placeholders) renders no badge, interview row unchanged, zero overflow, restore six-key
storage baseline, zero AI quota.
