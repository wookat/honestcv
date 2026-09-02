# R208 — "Reverse-chronological work history" ATS check (builder + checker)

## Evidence (Rezi public surface, first-party)

- Resume Checker page (rezi.ai/tools/resume-checker): "Follow proven resume
  guidelines for **section order**, bullet style, and length. The resume
  checker flags mistakes…"
- Rezi blog "How to Write a Reverse Chronological Resume": "Simply start with
  your most recent job position and work your way backward… It's an
  **ATS-friendly structure** that works for just about everyone."
- Rezi blog "The Best Resume Format for 2026": "The Reverse-Chronological
  Resume Format is the best option for 90% of job seekers… the most
  ATS-friendly, and the preferred format for recruiters."

## Current gap

Neither the Builder Score breakdown (`scoreResume`) nor /ats-checker's pasted
text scoring (`scoreResumeText`) verifies that work history is listed
newest-first. A resume with 2015 experience above a current role passes every
structural check even though we already ship a "Sort by date" toggle (R145)
that would fix it in one click.

## Design (src/lib/ats.ts only, deterministic, local)

New check `Experience in reverse-chronological order`, anchor `experience`.

- **Builder (`scoreResume`)**: for visible experience entries with a parseable
  date (`dateSortValue`; ongoing end dates via `ONGOING_RE` rank as "now"),
  the sequence key `end ?? start` (ongoing = +∞) must be non-increasing top to
  bottom; ties broken like `sortEntriesByDate` (start desc, then keep order).
  Entries without parseable dates are skipped. Fewer than 2 dated entries →
  pass. Fail hint names the first out-of-order role.
- **Checker (`scoreResumeText`)**: scan the text between the experience
  heading (existing standard-heading regex) and the next standard heading
  (education/skills). Collect date-range lines `start [–—-] end|Present`
  where both sides parse via the same ordinal logic; ends must be
  non-increasing. Fewer than 2 ranges (or no experience heading) → pass.

Both are added to the existing `checks` array, so they participate in
`structureScore` exactly like every other check (same 30% weighting path —
no formula change) and get the R176/R203 priority-fix + R204 deep-link
treatment for free (anchor `experience` jumps to the Experience section,
where the R145 Sort-by-date toggle lives).

## Non-goals

- No scoring-formula, schema, AI, API, or persistence change.
- No education-order or section-order opinionated checks (student resumes
  legitimately lead with education).
- No auto-fix; the fix path is the existing Sort-by-date toggle.

## Acceptance

- Builder: out-of-order dated experience fails with the offending role named;
  sorting (or Sort by date) flips it to pass; ongoing role on top passes;
  single/undated entries pass; hidden entries ignored.
- Checker: pasted text with descending ranges passes; ascending fails; text
  without an experience heading or with <2 ranges passes.
- Score changes only via the structure sub-score denominator (verified digit
  by digit in QA).
- 1440/375, dark mode, R203/R204/R207 regressions green.
