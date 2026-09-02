# R209: per-entry bullet-count ATS check (3–6 bullets per role)

## Evidence (Rezi public first-party surface)

- Rezi User Docs「The Rezi Score explained」(rezi.ai/rezi-docs/the-rezi-score-explained):
  - "Bullet points: Aim for 3 to 6 bullet points for each experience entry to provide
    enough detail without overwhelming the reader."
  - "Bullet point: Include at least three bullet points for each experience entry to
    give enough context."
- Rezi public checker page (rezi.ai/tools/resume-checker): "Follow proven resume
  guidelines for section order, bullet style, and length."
- Rezi blog「How Many Bullet Points on a Resume?」: general rule 3–5 per job, flexible
  2–7 — confirms per-entry bullet count is a first-class Rezi guideline.

## Current HonestCV gap

`scoreResume` only has "Work experience with bullets" — a resume-wide total
`bulletCount >= 3`. A resume with one 12-bullet wall and two empty roles passes.
`/ats-checker` text scoring has no bullet-count signal at all. Neither flags
per-entry too-few / too-many bullets, which Rezi's own Score docs treat as a
core checkpoint.

## Design

New structure check `3–6 bullet points per role` (anchor `experience`) in both
scoring paths in `src/lib/ats.ts`, same shape as R208's reverse-chron check.

### Shared core: `bulletsPerEntryCheck(entries: { name; count }[])`

- Fail on the first entry whose count is `< 3` or `> 6` (Rezi user-docs range).
- Fail hint names the offender and its count:
  `"X" has N bullet point(s) — aim for 3–6 per role so each entry shows enough
  impact without overwhelming the reader.`
- No entries → pass (other checks already cover missing experience).

### Builder path (`scoreResume`)

- Visible (`!hidden`) experience entries that have content (role or company
  non-empty), `count = bullets.filter(b => b.trim()).length`.
- Also align the existing "Work experience with bullets" hint from "2-4" to
  "3-6" so the two checks agree with the evidence.

### Checker text path (`scoreResumeText`)

- Reuse R208 `textDateRanges` segmentation: experience block = heading → next
  standard heading; entries = segments between consecutive date-range matches
  (segment i = text after range i up to range i+1).
- `count` = lines starting with a bullet marker (`-`, `–`, `•`, `*`, `▪`, `◦`).
- Guards: no experience heading → pass; zero bullet-marker lines in the whole
  block → pass (paste often strips markers); <1 date range → pass.

## Non-goals / invariants

- No scoring-formula change: check joins the existing `checks` array
  (structure denominators shift by design: checker 9→10, Builder 10→11).
- Zero AI / API / schema / persistence changes; reuses R203 priority fixes and
  R204 deep links via `anchor: 'experience'` automatically.
- No auto-editing of the resume.

## Acceptance

- Builder: entry with 1 bullet fails naming it; 3–6 bullets per entry passes;
  7-bullet entry fails; hidden entries ignored.
- Checker: marker-less paste passes; bulleted paste with a 1-bullet role fails
  quoting its date range; 3-bullet roles pass; Education years never counted.
- Lint / typecheck / build green; production QA at 1440+375 + dark mode;
  R203/R204/R208 regressions green.
