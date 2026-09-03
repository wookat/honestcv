# R336 — visible Print affordance in the Builder and on shared resumes

## Evidence (first-hand, production, 2026-08-31)

- R334/R335 made the browser print path (`Ctrl+P` / `Page.printToPDF`) produce a
  clean, resume-only document. Verified again this round across templates and
  settings on production bundle `index-Do6N4M9D.js`:
  - A4 classic → 1 page; sidebar → 1 page; narrow/wide margins, circuit,
    ledger → 2 pages with real Skills text on page 2 (legitimate overflow,
    0 blank pages) — `/home/ubuntu/qa/r336_*.pdf`.
  - `/s/<id>` share page prints the resume only (1 page, zero chrome strings,
    2.3% painted) — `/home/ubuntu/qa/r336_share.pdf`.
- Repo-wide grep: **zero** occurrences of `window.print` or a "Print" label in
  `src/`. The only way to reach the (now working) print path is knowing the
  browser shortcut.
- Share page (`SharedResume.tsx`) header offers only "Build your own free
  resume" — a recruiter viewing a shared snapshot has no way to print/save it
  short of the browser menu.

## Gap

Printing is the one export that is free, driver-friendly (paper + "Save as
PDF") and now works — but it is undiscoverable. Rezi's builder surfaces its
export affordances as visible buttons; ours hides a working capability.

## Design (minimal, UI-only)

1. `Builder.tsx` toolbar:
   - ≥2xl: ghost button "Print" (Printer icon) alongside TXT/MD, calling
     `window.print()`.
   - <2xl: extra "Print" row appended to the existing download dropdown menu.
   - No paywall: printing is browser-native and never hits the paid PDF/DOCX
     generation path; it does not consume `download()`.
2. `SharedResume.tsx` header: outline "Print" button, rendered only when
   `status === 'ready'`, calling `window.print()`.

No worker, schema, export-code or print-CSS changes.

## Validation

- Local: tsc, eslint (both files), vite build.
- Production QA (testing agent, zero AI): buttons visible/clickable in Builder
  (both breakpoint variants) and on a real share page; clicking triggers the
  print dialog (CDP: `window.print` stub/beforeprint event); print output
  regression via `Page.printToPDF` (resume-only, no blank tail); 375px strict
  scrollWidth; dark mode; storage/theme baseline restore.
