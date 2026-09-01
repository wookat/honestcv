# R180 — Tailoring report inside the JD tailoring pass

## Evidence (Rezi public changelog, July 30 2026)

> Rezi Web App — **Job Tailoring Reports** — You can now access detailed tailoring
> reports directly within your job application workflow, helping you better understand
> how your resume aligns with specific roles.

The protected Rezi app remains inaccessible (OTP check 403), so the report contents
are designed from our own architecture: the natural "alignment" measure we already
compute is the ATS keyword match against the pasted JD.

## Gap

Our `TailorDialog` runs a per-item AI pass with accept/keep review, but gives the
user no aggregate picture of what tailoring achieved: no before/after keyword
alignment, no list of newly covered keywords, no view of what is still missing.
The user accepts rewrites blind and has to open the Score breakdown separately to
see whether the tailoring moved the needle.

## Plan

Add a local, zero-AI **Tailoring report** panel to `TailorDialog`:

- Snapshot the resume at `run()` time; compute `before = scoreResume(snapshot, jd)`.
- Recompute `after = scoreResume(applyAccepted(snapshot, acceptedRows), jd)` live as
  the user accepts/keeps rows (accepted suggestions applied to the snapshot copy —
  the dialog never mutates the real resume beyond the existing `onApply`).
- Report shows: keyword match before → after (`n of m keywords · x% → y%`),
  newly-covered keyword chips (in `after.matched` but not `before.matched`),
  still-missing chips (first 6 + "+N more"), and accepted/kept counts.
- Panel appears with the suggestion list and updates as decisions are made.

## Non-goals

- No new AI calls, no scoring formula changes, no schema changes.
- No payment, Actions, or Cloudflare token changes.

## Acceptance

- Accepting a suggestion that introduces a missing JD keyword moves the after-%
  up and shows the keyword as newly covered.
- Keeping everything original shows before == after.
- Ignored keywords (Target job "not relevant") stay excluded on both sides.
- lint/tsc/build green; production QA at 1440+375 incl. R174–R179 stacked smoke.
