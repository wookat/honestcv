# R22 — Landing hero: upload/drop your resume → instant ATS score

Date: 2026-08-29 · Round: R22 · Prior: R21 (#234 workspace sidebar)

## First-hand evidence (2026-08-29)

Rezi home (`~/audit-r1/shots-r19/rezi-home.txt`): the hero contains an inline
resume intake — "**Upload or drop your resume to get started** / Score resume" —
so a visitor's first action can be scoring their existing resume, not reading copy.

RezUp production hero (`~/audit-r1/shots-r21` + Landing.tsx): two buttons
("Start free — no sign-up", "Check my resume's ATS score" → /ats-checker). The
ATS checker itself already supports Upload PDF/DOCX via `extractTextFromFile`,
but from the landing page the visitor must click through and then find the
upload button. Gap class: 落地页 P1 (conversion path depth).

## Scope

1. Landing hero: add a drop zone / file button ("Upload or drop your resume —
   get your free ATS score") below the CTA row.
   - Accepts `IMPORT_ACCEPT` (PDF/DOCX/TXT), drag-drop + click-to-browse.
   - On file: `extractTextFromFile` client-side (no upload to server — keep the
     honest local-first story), then `navigate('/ats-checker', { state: { resumeText } })`.
   - Extraction errors (scanned PDFs etc.) shown inline; no navigation on failure.
2. AtsChecker: read `location.state.resumeText` on mount → prefill the resume
   textarea and set `checked=true` so the score renders immediately
   (`scoreResumeText` already works with an empty JD).
3. Mobile: drop zone renders as a tap-to-upload button (≥40px), no overflow at 375px.

## Out of scope
- No server-side parsing/storage of uploaded files (architecture rule: browser-side).
- No fabricated social proof around the widget (no fake user counts/ratings).

## Architecture
Pure front-end; reuses `src/lib/extractFile.ts` (pdf/docx extraction already
lazy-loaded). Router state handoff only; nothing persisted until the user acts.

## Acceptance
- 1440px: drop a PDF on the hero → lands on /ats-checker with text prefilled and
  score visible; invalid/scanned file shows inline error and stays on landing.
- 375px: tap-to-upload works, ≥40px control, no horizontal overflow.
- Existing hero CTAs and ATS checker flows unchanged (regression).
- Local lint/tsc/build green; independent PR (base = R21 branch); deploy; prod QA.
