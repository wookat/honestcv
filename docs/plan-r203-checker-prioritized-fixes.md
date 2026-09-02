# R203 — Prioritized fixes report on /ats-checker (Rezi resume-checker parity)

## First-party evidence (Rezi public surface)

https://www.rezi.ai/tools/resume-checker — the "Review" step of the public
walkthrough:

> "View a clear report with prioritized fixes: high-impact alerts for urgent
> formatting and keyword errors are marked in red. Mid-impact content
> enhancements are shown in yellow. Click any suggestion to apply changes in
> seconds."

Also: "The tool evaluates your resume against 23 critical ATS checkpoints …
Each criterion is scored so you know exactly where to improve."

## Current RezUp behavior

- Builder has the R176 "Priority fixes" panel (`priorityFixes(ats, health)` in
  `src/lib/guidance.ts`) — red High / amber Med chips ranked by recoverable
  points across structure checks, missing keywords, and writing dimensions.
- `/ats-checker` (`src/pages/AtsChecker.tsx`) shows the score ring, keyword
  groups (R202), keyword frequency, uploaded-file checks (R189), and a flat
  "Format & content checks" pass/fail list — **no prioritized report and no
  writing-quality analysis at all**.

## Gap

The public checker never tells a visitor *what to fix first* or anything about
writing quality (weak verbs, missing metrics, buzzwords). Rezi's public checker
leads with exactly that prioritized red/yellow report.

## Plan (deterministic, local, display-only)

1. In `AtsChecker.tsx`, when a check runs, additionally compute:
   - `parsed = parseResumeText(resumeText)` (existing import parser, already
     used by "Fix it in the builder")
   - `health = resumeHealth(parsed)` (existing writing-quality report)
   - `fixes = priorityFixes(result, health)` (existing R176 triage, reuse as-is)
2. Render a "Priority fixes" block at the top of the result card (below the
   score summary): up to 5 items, each with a red `High` / amber `Med` impact
   chip, the fix text, and `+N pts` recoverable. Emerald empty state when
   everything passes.
3. Render a compact "Writing quality" row of the 6 health dimensions
   (label + n/100, red <50 / amber <80 / emerald ≥80), clearly labeled as
   guidance **not counted in the ATS score**.
4. Score formula, keyword extraction/grouping, uploads, exports: unchanged.

## Acceptance criteria

- Example resume+JD shows a prioritized list; ordering matches descending
  recoverable points; impact colors correct (red high / amber medium).
- Weak resume (no metrics, weak openers, buzzwords) surfaces writing-dimension
  fixes; strong resume shows the emerald empty state.
- ATS score identical before/after this change for identical input.
- Health/priority analysis reruns only when "Check my ATS score" is clicked
  (same `checked` gate as the score).
- Dark mode readable; 1440px + 375px no overflow.
- R202 keyword tiers + R189 file checks + JD highlight regressions green.
- lint/typecheck/build green; deploy; production QA via testing agent.

## Non-goals

No AI calls, no schema change, no new endpoint, no scoring change, no
Cloudflare permission changes, no GitHub Actions changes.
