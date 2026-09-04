# R365: duplicate career documents from the dashboard

## Evidence (firsthand)
- Production dashboard "Career documents" rows offer Open / Rename / PDF /
  DOCX / TXT / Delete (R363). There is no way to copy a document: adapting a
  saved cover letter for another company means either editing the original in
  place (losing it) or regenerating with AI (spends another request).
- Resume copies on the same page have exactly this affordance —
  `duplicateResumeVersion` with numbered "base (n)" names (R358). Documents
  are now the only dashboard object without duplicate.
- Duplication is pure local storage; zero AI cost, which is the point.

## Change (smallest evidence-backed)
- `documents.ts`: `duplicateCareerDoc(id)` — copies kind/text/signature under
  a numbered title using the R358 naming rule (strip one trailing " (copy)"/
  " (n)", then smallest free "base (n)", n>=2, against existing doc titles),
  new id, `updatedAt: now`, inserted at the top (same as saveCareerDoc).
- `Dashboard.tsx`: Copy button on each document row (sr-only "Duplicate
  <title>"), inserted after Rename. Row wrap at 375px already handled (R363).

## Non-goals
- No folders/bulk actions for documents (counts are small).
- No viewer-side duplicate.

## Validation
- Oracle: numbered naming incl. gap-fill and "(copy)" normalization, source
  untouched byte-wise, signature copied, unknown id no-op.
- Local tsc/eslint/build; production QA: duplicate each kind, open/rename/
  delete+undo the copy independently, exports of the copy, 375 light/dark,
  zero AI/share/payment, clean baseline.
