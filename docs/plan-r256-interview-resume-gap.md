# R256 — interview answers surface keywords to incorporate into the resume

## First-party Rezi evidence (2026-08-31)

- https://www.rezi.ai/ai-interview — Step 3 "Receive your detailed AI feedback report":
  > "In the keywords report, you'll see a breakdown with two different sections – 'High
  > Priority Words' and 'Remaining Keywords' that highlight important words, **skills to
  > incorporate into your resume**."
  Rezi's interview feedback report is explicitly a two-way bridge: keyword findings from
  interview practice feed back into the resume itself.
- https://www.rezi.ai/rezi-changelog (2026-08-13) — "Agent State Updates … automatically
  tracks progress based on your tailoring completion" (context: Rezi keeps tailoring
  state visible across tools).

## Gap in HonestCV

R250 gave the interview analysis card High priority / Also mentioned rows — but those
compare the **answer** against the JD only. Nothing connects interview practice back to
the resume: if a user demonstrates a JD skill in an answer (e.g. talks about Terraform)
that their resume never mentions, the app stays silent. That's the exact "skills to
incorporate into your resume" moment Rezi's report calls out — the user has just proven
the skill in their own words; the resume is the only place it's missing.

## Design

Pure derived data, zero AI / persistence / schema / scoring changes.

- In `BundleToolDialog` (interview kind), memo `resumeGaps`:
  `matchReport(resumeToPlainText(visibleResume(resume)), resume.jobDescription)` and
  intersect `analysis.keywords.covered ∩ report.missing` (order = answer-covered order).
  Ignored keywords never appear (analysis universe already excludes them). No JD or no
  gaps → nothing renders.
- Analysis card, after the keyword rows, new sky-toned line when `resumeGaps.length > 0`:
  `Add to your resume: you used <up to 5, +N more> in this answer, but it's/they're not
  on your resume yet.` followed by an inline `Open keyword targeting →` button.
- New `onJumpToTarget` prop on `BundleToolDialog`; Builder passes
  `() => { setToolOpen(null); jumpToSection('target') }` — closes the dialog and jumps
  to the existing Target job panel (R154 triage / R202 tiers) where keywords can be
  worked in.

## Non-goals

No changes to analyzeAnswer or the practice score, no auto-inserting keywords, no new
storage, no worker changes, no AI calls.

## Validation matrix

1. Oracle: fixture JD + answer where answer covers a keyword the resume lacks → line
   lists exactly `analysis.keywords.covered ∩ matchReport(...).missing` (byte-compare
   vs tsx oracle), capped at 5 with `+N more`.
2. Keyword on both answer and resume → not listed; keyword on neither → not listed.
3. Ignored keyword covered in answer and missing from resume → not listed.
4. No JD → no line; gaps empty → no line; singular grammar for 1 gap.
5. `Open keyword targeting →` closes the dialog and scroll-jumps to the Target job
   panel (ring visible), 375px included (auto-switch to Edit pane).
6. Practice score unchanged with/without the line (byte-identical analysis).
7. Regressions: R250 keyword tiers, R233 timer metrics, R234/R235 fillers, R236 tone,
   interview session flow (Next question / End early), cover/resignation tools.
8. 375px no horizontal overflow with the dialog open; light/dark contrast of the new
   line ≥4.5:1; zero AI completions.
