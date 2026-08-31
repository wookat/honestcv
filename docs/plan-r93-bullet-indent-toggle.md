# R93 — bullet indent toggle

## First-hand evidence

- `~/audit-r1/shots-r93/` (logged-in Rezi Finish Up toolbar, live toggle test):
  the toolbar "Indent" button toggles a `padding-left: 10px` on every bullet
  list in the rendered resume (`indent2-before.html` vs `indent2-after.html`
  diff shows the padding appearing/disappearing; on by default on Rezi).
- Same audit run: "Icons" toggles envelope/phone glyphs in the contact line
  (`icons2-toggled.png`), and "Profile picture" is PRO-gated behind a $29/mo
  upgrade modal (`profilepic2-toggled.png`). Both deferred — icons need glyph
  support across all seven font families in PDF; profile pictures are a larger
  schema + export feature.
- HonestCV today: bullet lists render flush with the section text in preview,
  PDF and DOCX; there is no indent control.

## Design

`Resume.bulletIndent?: 'off' | 'on'` (default `off` so stored resumes render
identically). Single source of truth `bulletIndentOf(r): boolean` next to the
other layout helpers; sanitizer whitelists the two values, anything else falls
back to `off`.

Consumers:
- Preview: each bullet `<ul>` gets `paddingLeft: 12px` when on (inline style —
  unaffected by the preview zoom, directly assertable).
- PDF: `PdfWriter.bi` flag; `bullet()` shifts both the glyph x and the text
  indent by 9pt and wraps against the narrower width.
- DOCX: bullet paragraphs get `indent: { left: 920, hanging: 360 }` twips when
  on (default docx bullet layout when off — no field emitted).

Builder: an "Indent" On/Off pill pair after the Divider control, same pill
treatment, titles noting it applies to preview, PDF and DOCX.

Out of scope: contact-line icons, profile pictures, per-section indent,
numeric indent size.

## Verification

Local `npm run lint` / `npx tsc -b` / `npm run build` / `git diff --check`;
production QA: toggle on/off in preview (inline padding assertion), PDF bullet
x-offset shift measured via `pdftotext -bbox`, DOCX `w:ind` on bullet
paragraphs only when on, refresh persistence, legacy/invalid fallback, R90–R92
stepper regression, 375px no overflow, zero AI calls, localStorage restored.
