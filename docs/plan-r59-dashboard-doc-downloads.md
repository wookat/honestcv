# R59 — Download career documents from the dashboard

## First-hand evidence (2026-08-30)

Rezi (authenticated, app.rezi.ai — ~/audit-r1/shots-r59/):
- The workspace treats cover letters / resignation letters as first-class documents in
  dedicated tabs; document cards carry the same card-level action menu as resume cards
  (resume cards verified: ⋮ menu with direct actions, "Edited N hours ago" relative time).
- "REVIEW MY RESUME" confirmed as a paid human review ($0.15–0.23/word, 12h–2d turnaround)
  — remains deliberately not copied (business-model difference).

RezUp production (cv.zalize.com/dashboard, verified in code + prod screenshots):
- Resume cards (draft + saved copies) have had direct PDF/DOCX downloads since R35.
- Career-document rows only offer Open + Delete; the viewer dialog only Copy text +
  Save changes. The letterhead PDF/DOCX exports built in R31 are reachable **only**
  inside the Builder tool dialogs right after generating. A user who saved a cover
  letter cannot download it later without regenerating context in the editor.
- Doc rows show an absolute date (`toLocaleDateString`) while resume cards show
  "Edited N days ago" — inconsistent.

Classification: P2 functional gap, honest to close by reusing existing R31 exports.

## Scope

1. Career-document rows: add PDF and DOCX buttons.
   - cover/resignation → `downloadLetterPdf/Docx` with the current draft resume for
     the letterhead (same source Builder uses); interview → `downloadTextPdf/Docx`.
2. Document viewer dialog: same two buttons, exporting the (possibly edited) text.
3. Doc rows: switch to the same relative "Edited …" label used by resume cards.

Not doing: email/paywall gating (Builder letter downloads are ungated — keep parity),
separate tabs per document type (R23 filter covers it), cloud persistence.

## Verification

- `npm run lint`, `npx tsc -b`, `npm run build` green.
- Prod QA 1440+375: row + viewer downloads produce real PDF/DOCX, relative dates,
  40px touch targets, no overflow, console clean.
