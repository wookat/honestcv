# R334 — Fix blank output on the Builder print path

## Evidence (first-hand)

- Production repro (R334 exploratory audit, testing agent): `Page.printToPDF` on
  `/builder` yields 6 fully blank pages (pdftoppm-confirmed white, pdftotext
  empty) even though `src/index.css` ships a deliberate `@media print`
  stylesheet meant to print only `[data-resume-preview]`.
  Evidence: `/home/ubuntu/qa/r338_print.pdf`, `r338_print_narrow.pdf`.
- Emulated print-media DOM shows the preview *visible* — the failure is purely
  in the printed output, so the harness was not at fault.

## Root cause

The old print CSS used `body * { visibility: hidden }` plus
`visibility: visible` on the preview, and `position: absolute; inset: 0 auto auto 0`
on `[data-resume-preview]`.

1. The Builder preview column ancestor is `lg:sticky` (`Builder.tsx` `#preview`)
   and the paginated preview nests absolutely positioned, transformed,
   fixed-height page windows (`ResumePreview.tsx` `PaginatedPages`). The
   absolute pull-to-top interacts badly with that stack when Chrome paginates,
   leaving no painted content on any sheet.
2. `visibility: hidden` keeps layout space, so all the hidden chrome (editor
   column, ATS card below the preview, extra page frames, footer) still
   contributes ~6 pages of blank height.

## Fix (CSS only, print media only)

`src/index.css` `@media print`:

- Replace the visibility scheme with a display cut:
  `body *:not(:has([data-resume-preview])):not([data-resume-preview]):not([data-resume-preview] *) { display: none !important }`
  — everything that is not the preview, inside it, or an ancestor of it frees
  its layout space (no trailing blank pages, no sticky/transform interference).
- Keep the existing `[data-resume-preview]` un-clip rules (static page window,
  no transform, auto height).

`src/pages/Builder.tsx`: add `print:block` to the `#preview` column so printing
works even when the mobile pane toggle has the preview column `hidden`
(print sheets are narrower than the `lg` breakpoint, so `lg:block` never
applies during print).

No component logic, worker, or schema changes. Screen styles untouched.

## Acceptance

- Local `vite preview` + CDP `Page.printToPDF` of `/builder` with the example
  resume: nonblank, full resume text (pdftotext), painted pixels (pdftoppm),
  exactly the resume page count, no trailing blank pages. Verified:
  `/home/ubuntu/qa/r334_print_fixed4.pdf` (1 page, full text).
- Production QA after deploy: same assertions on cv.zalize.com, plus emulated
  print-media DOM, mobile-pane print, R333/R330 regressions, strict 375px,
  dark mode, zero AI usage, baseline restore.
