# R188 — Per-job tailoring progress in the job application workflow

## Evidence (Rezi public changelog, first-party)

- 2026-07-30 · Rezi Web App: "Job Tailoring Reports — You can now access
  detailed tailoring reports directly within your job application workflow,
  helping you better understand how your resume aligns with specific roles."
- 2026-08-13 · Rezi Web App: "Agent State Updates — Your AI Agent now
  automatically tracks progress based on your tailoring completion, ensuring
  the assistance you receive is always synchronized with your current
  workflow."

The protected Rezi app remains inaccessible (OTP endpoint 403), so exact UI is
unknown; the design below is an informed adaptation of the public statements.

## Current RezUp gap

`/jobs` computes `matchOf` **once against the current draft** (`loadResume()`),
so:

1. A job with an R183 targeted copy shows a match % that ignores all tailoring
   done in that copy — the number is stale and often plain wrong for the copy
   the user will actually submit.
2. Pipeline rows (Saved/Applied/… tabs) show status only; there is no signal
   of how far along the tailoring of each application is, and no way to see
   the alignment of the targeted copy without opening the editor.

## Plan (deterministic, zero AI, zero schema, Jobs page only)

1. `src/pages/Jobs.tsx`: new `tailoredMatchOf` memo — for each pipeline entry
   with a `resumeVersionId` that still resolves, compute
   `matchScore(resumeToPlainText(visibleResume(version.data)), job.description)`.
   Recompute keyed on `pipeline` + versions list (cheap: pipeline is small).
2. Job detail pane: when a linked copy exists, the meta line shows
   "Targeted copy: NN% keyword match" (replacing the draft-based figure for
   that job) with a qualitative tint (emerald ≥80 / amber ≥50 / red below,
   same thresholds as everywhere else).
3. Pipeline list rows (non-All tabs): a small tailoring chip per row —
   "Tailored · NN%" (emerald when ≥80) or "Tailoring · NN%" (amber/red) so the
   pipeline doubles as a progress board; rows without a copy show nothing new.
4. Draft-based `matchOf` stays for unsaved listings (All tab discovery flow).

## Acceptance

- Saved job with a tailored copy shows the copy's match %, not the draft's.
- Editing the targeted copy in the Builder then returning to /jobs reflects
  the updated %.
- Deleted copy falls back to the draft-based figure without errors.
- 1440px and 375px; chips ≥ existing touch/contrast conventions.
- R183 target/open flows and R180 report unchanged.
