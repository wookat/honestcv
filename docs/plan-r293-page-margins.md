# R293 — Page margins control (Rezi Adjustments parity)

## Rezi first-party evidence
- Rezi Blog "How to Use the Rezi Resume Builder in 11 Easy Steps": "Rezi gives you the flexibility to shape your resume exactly how you want it. **Adjust margins**, fonts, and sizes…"
- Rezi Blog "How to Reformat a Resume": "**Margins: Set standard 0.5"–1" margins** to avoid overcrowding or awkward white space."
- Rezi User Docs "Finish Up": the Adjustments tab exposes font style/size, line spacing, indentation, dividers, accent colors — the formatting surface we already match (font family/scale, line spacing, section spacing, divider, bullet indent, icons, accent, photo).

## Gap
Our design panel covers every Rezi Adjustments control except margins. The PDF hard-codes `MARGIN = 54` pt (0.75"), DOCX hard-codes 864-twip sides / 720-twip top+bottom, and the preview hard-codes `PAGE_PAD = 32` px. Users cannot trade white space for content room (or vice versa) at all.

## Design (minimal slice)
- `resume.ts`: `pageMargins?: 'narrow' | 'normal' | 'wide'` (undefined = normal → serialized resume unchanged for the common path); `PAGE_MARGIN_PT = { narrow: 36, normal: 54, wide: 72 }` — exactly Rezi's recommended 0.5"–1" band with our current 0.75" as the default; `pageMarginOf(r)` helper; `asEnum` normalization.
- `pdf.ts`: `PdfWriter` gains a `margin` field (default 54). All former `MARGIN` uses inside the writer and the resume renderer read `this.margin`/`w.margin`; `w.margin` is set from `pageMarginOf(resume)` next to the existing fs/lh/ss/bi settings. Auto-fit picks the change up for free via `countResumePdfPages`.
- `docx.ts` (`downloadResumeDocx` only): margins scale by the same factor — sides 864 × f, top/bottom 720 × f, and `rightTab` derives from the scaled side margin. Letters/text DOCX unchanged.
- `ResumePreview.tsx`: `PAGE_PAD` becomes `pagePadOf(resume)` = round(32 × f) → 21/32/43 px so page-frame geometry, page-break markers, and page count estimates track the setting.
- `Builder.tsx`: a "Margins" stepper in the design toolbar (same − / value / + pattern as Text/Spacing/Sections), value shown in inches (0.5″ / 0.75″ / 1″).

## Not in scope
No worker/schema/AI/scoring changes; career-document exports keep their margins; no new dependency.

## QA matrix (production)
1. Design toolbar shows Margins stepper, default 0.75″, − and + disabled at the ends.
2. Narrow/wide visibly change preview padding; `honestcv.resume` gains `"pageMargins":"narrow"|"wide"`; back to 0.75″ the key disappears (byte-compat default).
3. Real PDF download at narrow/wide: text block edges at ≈36/72 pt (pdfminer bbox), page count can change accordingly.
4. Real DOCX download: sectPr `w:pgMar` values 576/864/1152 (sides) and 480/720/960 (top/bottom).
5. Auto-fit still works and counts pages with the chosen margin.
6. 375 px: toolbar wraps, no horizontal overflow; light/dark contrast on the new control.
7. Zero `/api/ai/*` requests; localStorage/theme restored.
