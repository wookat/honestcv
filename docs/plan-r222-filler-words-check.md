# R222 — "No filler words" ATS structure check (builder + checker)

## Evidence (first-party)

Rezi Score guide, Content audits
(https://intercom.help/rezihelp/en/articles/8383527-using-the-rezi-score):

> "Filler words - Forget filler words (just, very, really, etc). Using these
> can dilute the impact of your statements, leaving you sounding less
> confident and less professional."

## Gap

- R168 per-bullet guidance flags FILLER_WORDS (various/several/stuff/things/
  etc) and the R203 writing-quality buzzword dimension counts them, but the
  ATS structure score never checks filler words — a resume peppered with
  "very", "really" and "various stuff" can still score 100.
- Rezi explicitly names "just, very, really" which the guidance list does not
  even cover.

## Design

- `SCORED_FILLERS` in `src/lib/ats.ts`: `just`, `very`, `really`, `various`,
  `several`, `stuff`, `things`, `etc` (Rezi's named examples plus the existing
  R168 guidance list). Word-boundary, case-insensitive, list-order first hit
  (same convention as R217 buzzwords).
- `fillerWordCheck(segments)` mirrors `buzzwordCheck`: scans summary segment
  then experience segment, quotes the found word, hint advises cutting it and
  stating the concrete fact directly; anchor routes to the hit segment
  (summary → Summary, bullets → Experience) → Priority fixes + deep link.
- Builder feed: `resume.summary` + visible experience/project/involvement/
  custom bullets (same as R217). Checker feed: `textPronounSegments` split.
- Rows: checker 20 → 21, Builder 22 → 23 (each fix ≈ +4.3 = 100/23 builder,
  +4.8 = 100/21 checker).

## Acceptance

1. Bullet "Really improved various things" → fail quoting the first list-order
   hit; anchor experience; Priority fixes row + deep link.
2. Summary containing "just" → fail with anchor summary (deep link lands on
   Summary).
3. Negative guards: "justify", "justice", "everything", "Etcher" do not
   trigger (word boundaries); clean resume passes; built-in sample passes.
4. Independence: R217 buzzword row unaffected by filler-only text and vice
   versa.
5. Score arithmetic digit-exact with 21 checker / 23 builder rows.
6. 375px no overflow; dark contrast unchanged.
