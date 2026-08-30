# R84 — Mono font family option (Courier) across preview, PDF and DOCX

## Evidence

- First-hand, ~/audit-r1/shots-r82/rezi-finishup-font-family-dropdown.png: Rezi's
  Finish Up font dropdown offers 7 named families — Merriweather, Source Sans Pro,
  Calibri, Times New Roman, Comic Sans, **Courier New**, **Roboto Mono**. Two of
  the seven are monospace.
- HonestCV (R15) has Auto / Serif / Sans only. `serifOf(r, tplSerif): boolean`
  drives all 5 render paths — a mono option is impossible in the current model.

## Plan (small batch)

1. `src/lib/resume.ts`:
   - `fontFamily?: 'auto' | 'serif' | 'sans' | 'mono'` (sanitizer enum updated —
     legacy values unchanged).
   - New `type FontFamilyKind = 'serif' | 'sans' | 'mono'` and
     `familyOf(r, tplSerif): FontFamilyKind` (auto → template serif/sans as today).
   - Keep `serifOf` semantics by reimplementing it as `familyOf(...) === 'serif'`?
     No — replace the 5 call sites directly and delete `serifOf` (small, type-safe).
2. `src/lib/pdf.ts`: fonts by kind — serif = TimesRoman*, sans = Helvetica*,
   mono = `StandardFonts.Courier/CourierBold/CourierOblique` (both resume export
   paths).
3. `src/lib/docx.ts`: `FONT_MONO = 'Courier New'` chosen by kind (both paths).
4. `src/components/ResumePreview.tsx`: font-family CSS by kind — mono uses
   `ui-monospace, 'Courier New', monospace`.
5. `src/pages/Builder.tsx`: add `['mono', 'Mono', 'Courier — typewriter look']`
   button to the existing Font control row.

No AI, no new storage keys (existing `honestcv.resume` field widened), no scoring
changes. TXT/MD unaffected (plain text).

## Non-goals

Web-font embedding (Merriweather etc. would require shipping font binaries into
the PDF — separate round), per-template font pairing changes, Comic Sans.

## Verification

Local: lint / tsc -b / build / git diff --check.
Production QA: Mono button renders + persists; preview switches to monospace;
PDF real download uses Courier (pdffonts/inspection); DOCX document.xml carries
Courier New; Auto/Serif/Sans unchanged (regression); 375px no overflow, 40px
touch target; zero AI calls; localStorage restored.
