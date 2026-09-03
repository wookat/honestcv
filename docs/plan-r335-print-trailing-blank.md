# R335 — fix trailing blank print page for near-one-sheet resumes

## Evidence (first-hand, local + R334 production QA)
- R334 production QA found: a 7-job resume with print-media doc height ~1021px printed 2 pages with page 2 fully white (pdftoppm all-white, pdftotext all text on p1).
- Local reproduction on the R334 build (vite preview + CDP `Page.printToPDF`): an 11-job fixture, print doc height 1010px → 2 pages, page 2 nonwhite 0.0%.
- Root cause (measured): two sources of trailing empty height stack under the R334 print CSS:
  1. Ancestors of `[data-resume-preview]` stay displayed and keep their screen padding — notably the Builder main grid's `pb-20` (80px).
  2. The sheet's own bottom padding (`pagePad` on `[data-resume-page-window]`, `p-8` on the flow/non-paginated preview) prints as empty space even though `Page.printToPDF` adds its own printer margin.
  When content height minus that empty tail fits one printable sheet (~980px letter), Chrome still emits a second page containing only whitespace.

## Change (print media only)
`src/index.css` `@media print`:
- `body :has([data-resume-preview]) { padding:0; margin:0; min-height:0 !important }` — displayed ancestors contribute no height.
- `[data-resume-preview], [data-resume-preview] [data-resume-page-window] { padding-bottom: 0 !important }` — the printer margin replaces the sheet's bottom padding.

No component/worker/schema changes; screen styles untouched.

## Acceptance (local, verified)
- 11-job fixture (was 1010px / 2 pages, p2 blank): now 978px → 1 page, all text present.
- 12-job fixture (1039px): 2 pages, page 2 contains real content (SKILLS section), painted.
- 18-job fixture (1402px): 2 pages, both painted, all 36 bullets extracted.
- Evidence: /home/ubuntu/qa/r335_j11.pdf, r335_j12.pdf, r335_j18.pdf.
