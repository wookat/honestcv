# R545 — One-tap Add-to-Skills chips respect categorized skills (use mergeSkills)

## Production evidence (first-hand, CDP, cv.zalize.com, 375×812, fresh storage)

Seed: real nested `Resume` with categorized skills:

```
Languages: python, golang
Tools: docker
```

JD: `kubernetes, terraform, python, golang, scalable, oracle`.

1. Target panel chip `+ kubernetes` clicked → skills become:

```
Languages: python, golang
Tools: docker, kubernetes
```

The naive append `skills.replace(/,\s*$/, '') + ', kw'` dumps the keyword into
whatever category happens to be the **last line** — with `Tools` last it lands
there; with any other category last it lands in that one. The category
structure users curated (and R175 one-click categorization builds) gets
silently corrupted.

2. Same seed shows role-suggestion chips `+ Python` and `+ Docker` even though
`python` and `docker` are already listed — the dedupe at Builder.tsx uses
`skills.split(/[,\n]/)`, so the first item of each labeled line stays glued to
its label (`"languages: python"`, `"tools: docker"`) and never matches.

## Existing model

R373 already added `mergeSkills(existing, added)` in `src/lib/resume.ts`:
category-aware (keeps lines, adds fresh items on a new line), dedupes
case-insensitively with labels stripped. It is used only by the assistant
`@@APPLY add-skills` path. The five one-tap chip/button paths in Builder.tsx
(Target panel `+ kw` chips R542/R544, Score-card triage "Add to Skills", the
two Score-card tier chips, proven-skill chips, role-suggestion chips) all use
the naive string append.

## Fix (smallest)

- Builder.tsx: replace all five naive `replace(/,\s*$/, '')` appends with
  `set('skills', mergeSkills(resume.skills, [kw]))` (mergeSkills already
  handles the empty case: returns `kw` when existing has no lines).
- Builder.tsx role-suggestion dedupe: strip `^[^:]{1,40}:` labels per line
  before splitting on commas so already-listed labeled items stop reappearing
  as chips.

## Non-goals

- No change to `mergeSkills` itself, ats.ts, scoring, or chip visuals.
- No auto-categorization of the added keyword into a matching category
  (mergeSkills' new-line behavior is the honest existing convention).

## Validation

tsc / eslint (changed file) / build / verify-dist; deploy; production QA at
375/812 and 1280/900: categorized seed + chip click → skills gain a new line
(not last-category corruption); plain single-line skills still grow in place;
`+ Python`/`+ Docker` chips no longer offered for the categorized seed; zero
overflow / console errors; storage cleaned.
