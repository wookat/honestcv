# R83 — Fix links inside the score-breakdown (health report) dialog

## Evidence

- Rezi "Explore My Rezi Score" modal (first-hand, 2026-08-29,
  ~/audit-r1/shots-r82/rezi-score-modal-categories.png): every finding links to the
  specific entry that causes it ("Software Engineer") — one click from finding to fix.
- HonestCV R82 (PR #295) added Fix → links on the ATS score card, but explicitly
  deferred the score-breakdown dialog ("Full health report — N/100 across M checks"
  link in the Resume strength card). Inside that dialog, findings are still plain
  text: `ATS structure` failures render `label — hint` with no way to jump, and the
  writing dimensions (Quantified impact, Action verbs, …) list per-bullet findings
  with no path back to the editor. The dialog also covers the editor, so the user
  must close it and hunt manually — strictly worse than the score card.

## Plan (small batch)

1. `src/lib/guidance.ts` — `HealthDimension` gains optional `anchor?: SectionAnchor`
   (import type from `@/lib/ats`). Set it only where *all* findings of the dimension
   live in one editor section:
   - `quantification` → `experience` (findings are experience bullets only)
   - `verbs` → `experience` (same)
   - `brevity` / `buzzwords`: **no anchor** — findings can mix summary + bullets;
     a wrong jump is worse than none.
2. `src/pages/Builder.tsx` — `HealthDialog` gains `onJump(anchor)`:
   - ATS-structure findings become objects carrying each failing check's existing
     `anchor`; each finding with an anchor renders the same "Fix →" link style as
     the R82 score card.
   - Dimensions with an `anchor` and a non-perfect score render one "Fix →" next to
     the dimension header.
   - Clicking closes the dialog first, then calls the existing `jumpToSection`
     (mobile pane switch + `honestcv:jump-section` event) on the next frame so the
     section is visible before scrolling.
   - Keyword-match findings get no link (fixed via Target job / chips, not a section).

## Non-goals

Rezi category tabs / sub-score pages, percentile histogram, scoring math changes,
AI calls, storage changes.

## Verification

Local: lint / tsc -b / build / git diff --check.
Production QA (testing agent): open dialog with failing checks → Fix closes dialog,
jumps + rings the section (desktop + 375px, 40px targets); dimensions without
anchors show no link; perfect-score dimensions show no link; R82 score-card links
regress-free; zero AI calls; localStorage restored.
