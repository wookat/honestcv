# R29 — AI summary draft from resume (Rezi "AI Summary Writer" parity)

## Firsthand evidence (2026-08-29, logged-in audit, screenshots ~/audit-r1/shots-r29/)

- Rezi editor Summary section (`/dashboard/resume/<id>/summary`, `r29-ed-summary.png/.txt`) has an
  **AI Summary Writer** panel: "AI writer helps you to write your summary for a targeted job
  position. Strange result? Just regenerate!" with **POSITION HIGHLIGHT** (prefilled
  "Software Engineer"), **SKILLS HIGHLIGHT**, a **from resume** prefill affordance and an
  "AI WRITER READY" state — i.e. Rezi *generates* the summary from the resume; the user never
  has to write a first draft.
- Rezi Skills section (`r29-ed-skills.txt`) has an "AI SKILLS EXPLORER" (enter skills → save to
  list); Education/Projects have structured fields + per-section AI writers.

## Current RezUp behavior (gap)

`src/pages/Builder.tsx` `runRewrite('summary', …)` refuses when the summary is empty:
"Write a rough summary first — the AI polishes your draft, it never invents one." So a new user
with a filled resume but empty summary gets no AI help exactly where Rezi shines. **P1
(functional depth, editor workhorse).**

## Decision

Add "Draft from resume": generate 2–3 candidate summaries **derived only from the user's own
resume content** (experience, skills, education, target role). This is honest — nothing is
invented; the model summarizes what the user already wrote. Keep the existing polish path for
non-empty drafts.

## Architecture

- New Worker endpoint `POST /api/ai/summary-draft` (Hono), same `/api/ai/*` gate (bundle license
  or free quota; failed calls don't consume quota):
  - body: `{ resumeText: string, role?: string }` (resumeText required, 400 otherwise)
  - prompt: write 3 alternative professional summaries (2–3 sentences, ≤60 words, no first
    person) using ONLY facts present in the resume text; no invented metrics/titles; return a
    JSON array of strings. Parse failure → 502, quota not consumed (same pattern as
    interview-questions).
- No storage changes; no new keys. Local-first unchanged.

## UI / interaction

- Summary section: alongside "AI polish summary", when the summary is empty show
  **"Draft from resume"** (Sparkles icon, same aiButton styling). Disabled path: if the resume
  has no experience bullets/skills/education content, inline error "Add some experience or
  skills first — the draft is written only from your resume."
- On success: reuse the existing variant-pick dialog ("Pick a summary") so the user reviews and
  chooses; applying sets `resume.summary` (undo works; R28 history checkpoints as usual).
- Quota: successful call decrements free credits (UI already shows "Free AI credits left").
- Mobile: buttons ≥40px at 375px (follow R26/R28 conventions), no horizontal overflow.

## Intentionally not copied

- Rezi's separate POSITION/SKILLS HIGHLIGHT inputs — our target role field already covers this.
- AI Skills Explorer autocomplete database — future round if evidence shows demand.
- Regenerate loop UI — variant-pick with 3 candidates covers it in one call.

## Validation

- Local: `npm run lint`, `npx tsc -b`, `npm run build` all green.
- Production QA (testing agent, 1440+375): empty-summary → Draft from resume returns 3 real
  candidates derived from seeded resume; picking one fills the summary; empty-resume path shows
  inline error with zero AI call; quota decrements only on success; polish path regression;
  console clean; localStorage backed up/restored.
