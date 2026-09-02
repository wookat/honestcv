# R291 — Fix R290 audit findings: contact-title marks in PDF/DOCX + desktop header overflow

## Evidence (R290 exploratory production audit, docs/qa-r290-plan.md)

### P2-1 — Contact title inline marks leak literal `**` into PDF and DOCX
- Repro: set contact title to `Senior **Platform** Engineer`, download PDF and DOCX.
- Observed in production (bundle index-iuaBfS20.js): `pdftotext` shows literal
  `Senior **Platform** Engineer`; DOCX `word/document.xml` contains the literal string.
- Preview renders bold correctly; TXT strips marks (resumeToPlainText already uses
  stripInlineMarks). The R272–R279 marks-fidelity chain covered name, headings,
  headlines, body text and companyInfo — the contact *title* line is the only
  remaining verbatim emitter: `src/lib/pdf.ts` ~772 (`w.text(c.title, …)`) and
  `src/lib/docx.ts` ~208 (single `TextRun({ text: c.title, … })`).

### P2-2 — /builder page-level horizontal overflow at 1280–1440px desktop
- Fresh default resume: `document.documentElement.scrollWidth` = 1377 @1280,
  1420 @1366, 1457 @1440; clean at 1512. 375px is clean.
- Offender: the SiteHeader action row on /builder (badge `Free during beta`,
  `Saved`, undo/redo/history/assistant icons, then four separate PDF / DOCX /
  TXT / MD download buttons). Buttons don't shrink or wrap, so the header's
  intrinsic width (~1460px) exceeds mid-desktop viewports.

## Fix

### P2-1 (pdf.ts + docx.ts, contact title only)
- pdf.ts: when `hasInlineMarks(c.title)`, render via the existing `richText()`
  helper with the accent color, mirroring the R279 contact-name path (manual
  center shift computed from `stripInlineMarks` width). Mark-free titles keep the
  existing `w.text` byte path.
- docx.ts: when `hasInlineMarks(c.title)`, map `parseInlineMarks(c.title)` to
  styled TextRuns (bold/italics/underline/hyperlink) with the existing
  size/color/font, as the companyInfo (R276) and headRuns (R278) paths do.
  Mark-free titles keep the single-TextRun path.
- No changes to TXT/Markdown (already correct), ATS scoring, or persistence.

### P2-2 (Builder.tsx header action row only)
- Builder already has a compact download dropdown (icon + chevron exposing
  PDF/DOCX/TXT/MD) that today renders only under `sm`. Widen its use: show the
  dropdown below `2xl` (1536px) and the four full-width buttons only at `2xl:`
  and up. The full row's intrinsic width (~1460px) means any threshold below
  1457 still overflows; 2xl is the smallest default Tailwind breakpoint above it.
- All four export formats stay reachable at every width; no other header
  elements change; 375px behavior (already clean) is untouched.

## QA (production, testing agent)
1. Contact title `Senior **Platform** Engineer` → PDF via pdftotext has no
   literal `**` and pixel-check shows bold "Platform"; DOCX document.xml has a
   real bold run; underline + link variants also verified; mark-free title
   byte-path regression.
2. /builder at 1280 / 1366 / 1440 / 1512: `scrollWidth <= innerWidth`; the
   compact download dropdown opens and downloads each format; at ≥1536 the four
   full buttons render. 375px regression (scrollWidth = 375).
3. Zero /api/ai/* traffic; localStorage/theme restored.
