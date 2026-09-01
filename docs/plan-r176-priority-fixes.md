# R176 — Prioritized fix list in the Score breakdown (Rezi-style triage report)

## Rezi evidence (first-hand, 2026-08-31)

- Public ATS Resume Checker (rezi.ai/tools/resume-checker, screenshots
  `audit-r1/shots-r176/22-checker.png`, `24-scan.png`): the report the checker
  produces is explicitly *prioritized* — "View a clear report with prioritized
  fixes: high-impact alerts for urgent formatting and keyword errors are marked
  in red. Mid-impact content enhancements are shown in yellow."
- Protected in-app score surfaces remain unverified this round: normal login
  never leaves /login, Google OAuth is rejected ("This browser or app may not
  be secure"), and a fresh signup (rezi-r176@zalize.com via Cloudflare Email
  Routing → KV inbox) reaches the OTP screen but `POST /v1/otp/check` returns
  403 even with a fresh code + recaptcha enterprise token (`rms`). Evidence:
  shots 25–29. This plan is based only on the public checker report claims.

## Gap in RezUp today

`ScoreBreakdownDialog` (Builder.tsx) lists 8 dimensions each with their own
findings. There is no cross-dimension triage: a user opening the dialog sees a
wall of per-dimension cards and has to decide themselves what to fix first.
Rezi's checker leads with a single prioritized list (red = high impact,
yellow = mid impact).

## Plan

Add a deterministic "Priority fixes" panel at the top of the Score breakdown
dialog:

- `priorityFixes(ats, health)` in `src/lib/guidance.ts` returns up to 5 items
  `{ text, impact: 'high' | 'medium', anchor?, entryId?, entryLabel? }`.
- Ranking is by *recoverable score*, computed from the existing formulas — no
  new scoring:
  - Failing ATS structure checks: each is worth `round(structureWeight / checkCount)`
    ATS points where structure is 30% (with JD) or 100% (without).
  - Missing JD keywords: worth the keyword points recoverable (70% weight),
    capped as one item ("Add missing keywords: a, b, c…").
  - Health dimensions below 80: recoverable = `(100 − score) × weight` from the
    existing weight table (completeness .3, quantification .2, verbs .2, …).
- `impact: 'high'` when recoverable points ≥ 10 or the dimension is red
  (score < 50); otherwise `medium`. Red/amber dot + HIGH/MED chip mirrors
  Rezi's red/yellow split.
- Each item reuses the dialog's existing `Fix →` / `→ entry` jump handlers.
- Panel hidden when there is nothing to fix (all checks pass, no missing
  keywords, all dimensions ≥ 80) — replaced by a green "No priority fixes"
  line.

## Non-goals

- No change to any score formula, check, or export; panel is presentation-only.
- No AI calls; fully deterministic and local.
- No schema/storage changes.

## Acceptance

- Sparse resume: panel shows ≤5 items, high-impact first, each jumps correctly.
- Full clean resume + matched JD: green empty state.
- JD present: missing-keywords item appears once with top keywords named.
- 1440px + 375px, no horizontal overflow; stacked R171–R175 smoke first.
