# R542 — the Target job panel names the missing keywords its deep links promise

## Production evidence (CDP, 375×812, index deployed after R541)
Seed the R538 QA resume (target JD with one missing keyword, "scalable"). Trigger the R541
keyword `Fix →` (or the /ats-checker "Fix in builder →" deep link): the user lands on the
Target job panel — which shows only the role/company/level inputs, the JD textarea and the
Tailor button. **The missing keyword is never named anywhere in view.** The finding that sent
the user here says "1 of 7 posting keywords are absent (\"scalable\")", but at the
destination the user must remember the keyword and hunt for where to add it (the actionable
missing-keyword triage lives in the preview/score pane — a pane switch away on mobile).

Rezi's keyword targeting surface lists the missing keywords right next to the job
description they were extracted from.

## Root cause
The Target job `Section` in `Builder.tsx` renders inputs only. All missing-keyword UI
(`ats.missing` chips, triage card, Add to Skills) is rendered exclusively inside the ATS
score card in the preview pane.

## Minimal fix (Builder.tsx only)
Below the JD row in the Target job panel, when `resume.jobDescription.trim()` and
`ats.missing.length > 0`, render a compact block:

- line: `Missing keywords (N) — tap to add to Skills:`
- chips for `ats.missing` (high-priority first, reusing `highKw`), each a button that
  appends the keyword to `resume.skills` (same dedupe-free append as the score-card chips:
  `set('skills', skills ? skills.replace(/,\s*$/,'') + ', ' + kw : kw)`).

Adding a keyword recomputes `ats`, so the chip disappears immediately — honest feedback.
When everything is matched, render nothing (no new empty states).

Non-goals: no scoring changes, no changes to the score-card triage/tiers, no new anchors,
no pane-switch machinery, no AI drafting from this block.
