# R547 — file uncategorized tail skills into the existing categories

## Production evidence (CDP, 1280×900, fresh storage, 2026-08-31)
Seed a categorized block with the uncategorized tail one-tap adds now produce (post-R546):

```
Languages: python, golang
Tools: docker
kubernetes, scalable
```

The Skills card shows **no categorization affordance at all**: the "Group into
categories" tip row is gated on `!skillLines(resume).some((l) => l.label)`
(Builder.tsx ~6447) and `categorizeSkills()` (resume.ts) returns `null` for any
multi-line block containing a labeled line. So once a user has categories, every
keyword added via chips piles up on the plain tail line forever, and the only way to
file `kubernetes` under a category is manual text editing — while the app already
ships a full `SKILL_CATEGORIES` taxonomy that knows `kubernetes → Cloud & DevOps`.

## Fix (smallest change)
New helper `fileTailSkills(skills: string): string | null` in src/lib/resume.ts:
- Applies only to mixed blocks (≥1 labeled line AND ≥1 plain line); else `null`.
- For each tail item recognized by `SKILL_CATEGORIES`: append it to an existing line
  whose label matches the category (case-insensitive, substring either way — so a
  user's `Tools` line matches the `Tools` category), otherwise start a new
  `Category: item` line after the labeled lines.
- Unrecognized items (e.g. `scalable`) honestly stay on the tail line; the tail line
  is dropped when it empties. Returns `null` when no item can be filed.

Builder.tsx Skills card: when the block is mixed and `fileTailSkills()` is non-null,
show a tip row with a `Sparkles` outline button "File uncategorized skills" that
applies the result — mirroring the existing "Group into categories" row (which stays
unchanged for fully-flat lists).

## Non-goals
- No change to `categorizeSkills`, `mergeSkills`, chips, ATS scoring, or dedupe.
- No automatic filing on chip tap — the user stays in control via the button.

## Validation
tsc, eslint (changed files), build, verify-dist; deploy; production QA at 375×812 and
1280×900: mixed seed shows the button; clicking files `kubernetes` under `Tools`
(label match) or a new `Cloud & DevOps` line, keeps `scalable` on the tail; flat-list
"Group into categories" row regression; zero overflow; storage cleaned.
