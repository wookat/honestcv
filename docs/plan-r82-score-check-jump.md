# R82 — clickable "Fix" jump links on failing ATS checks

## First-hand evidence (Rezi, 2026-08-29, ~/audit-r1/shots-r82/)

- `rezi-score-modal-categories.png` — Rezi's "Explore My Rezi Score" modal groups
  findings under category tabs (Content / Format / Optimization / Best Practices /
  Application Ready, each with a sub-score) and, crucially, **every finding carries a
  link to the offending entry** ("Software Engineer" under "Your resume has 1
  experience with weak bullet points") that navigates straight to that editor screen.
- Same modal shows a "How You Compare" percentile histogram (needs population data we
  do not have — not copying).

## Gap in HonestCV

Our ATS match score card lists the seven structure checks as plain text
(`ats.checks.map` in Builder.tsx): a failed check shows `✗ label — hint` and nothing
else. The score card lives in the right column (desktop) or the *Preview & score*
pane (mobile) while the fields that fix the failure live in the edit column/pane —
the user must read the hint, figure out which section it means, switch panes on
mobile, and scroll to find it. Rezi makes every finding one click away from its fix.

## This round (small batch)

1. `src/lib/ats.ts` — each check in `scoreResume` gets an `anchor` field naming the
   Builder section that fixes it: contact / summary / experience (bullets, quantified,
   dates) / skills / education. Text-path `scoreResumeText` checks get no anchor
   (the ATS checker page has no editor).
2. Builder `Section` component — optional `anchor` prop; the section listens for a
   `honestcv:jump-section` CustomEvent, and on match opens itself (if collapsed),
   scrolls into view, and flashes a brief highlight ring so the eye lands on it.
3. ATS score card — failing checks with an anchor render a small "Fix →" link that
   switches the mobile pane back to *edit* and dispatches the jump event on the next
   frame (so the section is visible before scrolling).

Pure frontend; zero AI calls, zero storage schema, scoring math untouched.

## Not doing this round

- Category tabs / per-category sub-scores (our 7 checks are one flat structure
  dimension; inventing categories adds noise, not signal).
- "How You Compare" percentile histogram (requires population data we don't have —
  showing a fake distribution would be dishonest).
- Deep links from the separate Health report dialog (candidate for a later round).

## Verification

Local: `npm run lint`, `npx tsc -b`, `npm run build`, `git diff --check`.
Production QA (testing agent): failing check shows "Fix →"; click scrolls to and
highlights the right section on desktop; on 375px it switches to the edit pane first;
passing checks show no link; zero AI calls; console clean; localStorage restored.
