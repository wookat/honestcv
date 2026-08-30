# R33 — Cover letter straight from a job posting (/jobs → cover-letter dialog)

Date: 2026-08-29 · Author: RezUp architect session · Status: approved for implementation

## First-hand evidence (2026-08-29)

- Rezi positions "AI Cover Letter Writer" as tailored per job posting; its job board
  connects a posting to resume tailoring ("Apply Now + Target Resume", R16 audit).
  Pricing page (audited today, `~/audit-r1/shots-r33/r33-pricing.txt`) lists
  "Rezi Cover Letter Builder" and "AI Cover Letter Writer" as core Pro features.
- Our own pricing page promises "AI cover letters **tailored to each job posting**",
  and our jobs board (R17–R20) has "Target my resume" — but generating a cover letter
  for a job found on /jobs takes 4 manual steps today: Target → open editor → open
  Cover Letter dialog → retype the company name (the dialog's Company field starts
  empty; job targeting only carries title + JD).

## Gap (P1)

The promised golden path "found a job → tailored cover letter" is not wired up.
The company name — which the AI prompt accepts and the letter needs — is dropped on
the floor between /jobs and the cover-letter dialog.

## Design

1. `/jobs` detail pane: new "Cover letter" button next to "Target my resume".
   It reuses the existing confirm dialog (same replace-target warning) with an
   `intent` of `'target' | 'cover'`; on confirm both intents write
   `{ targetRole: job.title, jobDescription: job.description }` to the draft,
   and the cover intent navigates to `/builder?doc=cover&company=<job.company>`
   instead of plain `/builder`.
2. `Builder`: on mount, read `doc` + `company` search params (react-router
   `useSearchParams`); if `doc` is `cover`, open the existing BundleToolDialog with
   the Company field prefilled, then strip the params from the URL so refresh/back
   doesn't reopen the dialog.
3. `BundleToolDialog` gets an optional `initialCompany` prop seeding its company
   state when the dialog opens.

No new endpoints, no new storage, no extra AI calls — generation still goes through
the existing `/api/ai/cover-letter` with the same quota gating; the button itself
costs zero credits.

## Acceptance

- /jobs → job detail → "Cover letter" → confirm → lands in /builder with the Cover
  Letter dialog open, Company prefilled with the job's company, draft targeted at the
  job (role + JD), ATS score live against it.
- Cancel in the confirm dialog changes nothing.
- Plain "Target my resume" unchanged; /builder without params unchanged.
- URL params removed after the dialog opens (no reopen on refresh).
- 375px: new button ≥40px tall, no horizontal overflow.
- Zero AI credits consumed until the user actually clicks Generate.

## Deliberately not copied

- Rezi's separate cover-letter editor surface (our dialog + saved career docs cover it).
- Auto-generating the letter on arrival (would silently spend an AI credit).
