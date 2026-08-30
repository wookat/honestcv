# R89: Source Sans 3 + Roboto Mono font families (web-font parity with Rezi)

## First-hand evidence

- Rezi Finish Up font dropdown (audited live at `app.rezi.ai/dashboard/resume/<id>/finish-up`,
  screenshot `~/audit-r1/shots-r82/rezi-finishup-font-family-dropdown.png`) lists exactly seven
  named fonts: **Merriweather, Source Sans Pro, Calibri, Times New Roman, Comic Sans, Courier New,
  Roboto Mono**.
- After R88, HonestCV covers Merriweather (embedded), Times (Serif), Calibri-class (Sans),
  Courier (Mono). The remaining real gaps are **Source Sans Pro** (Rezi's flagship humanist sans,
  not reproducible with Helvetica/Calibri) and **Roboto Mono** (their second monospace).
- Comic Sans is deliberately excluded: it is broadly considered unprofessional on resumes and adds
  no ATS or typographic value; we do not copy it just for count parity.

## Gap

`fontFamily` supports `auto | serif | sans | mono | merriweather`. The R88 embedding pipeline
(`@font-face` lazy preview loading + `@pdf-lib/fontkit` `subset:true` PDF embedding + DOCX
`w:rFonts` naming) exists but is wired for a single web family.

## Design

1. **Font assets** (generated with FontTools, same pipeline as R88):
   - Source Sans 3 (Adobe's current release of Source Sans Pro, OFL) — instance the Google Fonts
     variable fonts at wght 400/700, Latin subset → `sourcesans3-{regular,bold,italic}.ttf` +
     `sourcesans3-OFL.txt`.
   - Roboto Mono (OFL — Google Fonts hosts it under `ofl/robotomono` today) — same →
     `robotomono-{regular,bold,italic}.ttf` + `robotomono-OFL.txt`.
   - Fix R88's P3: regenerate the three Merriweather TTFs with corrected name tables
     (family "Merriweather", subfamily Regular/Bold/Italic, matching PS names) so PDF face names
     and Word font matching are no longer "Merriweather Light".
2. **Data model** (`src/lib/resume.ts`): extend `fontFamily` enum and `FontFamilyKind` with
   `sourcesans` and `robotomono`; sanitizer whitelist grows accordingly; unknown values still fall
   back to `auto` semantics. No new storage keys.
3. **Preview** (`src/index.css`, `src/components/ResumePreview.tsx`): six new lazy `@font-face`
   rules (`font-display: swap`, loaded only when used); stacks
   `'Source Sans 3', 'Source Sans Pro', Inter, Arial, sans-serif` and
   `'Roboto Mono', 'Courier New', ui-monospace, monospace`.
4. **PDF** (`src/lib/pdf.ts`): add both families to `WEB_FONT_FILES`; the merriweather-only branch
   in `embedFontsFor` generalizes to any key of `WEB_FONT_FILES` (fontkit registered lazily,
   `subset: true`). Standard-font families unchanged.
5. **DOCX** (`src/lib/docx.ts`): `FONT_BY_KIND.sourcesans = 'Source Sans 3'`,
   `FONT_BY_KIND.robotomono = 'Roboto Mono'`. Disclosure: Word falls back to a default face on
   machines without these fonts installed (same caveat as Merriweather).
6. **Builder** (`src/pages/Builder.tsx`): two pills after Merri — `Source`
   ("Source Sans — modern humanist sans") and `Roboto` ("Roboto Mono — clean monospace"). The
   toolbar row already wraps (`flex-wrap`), so seven pills wrap on 375px.

## Verification

- Local: `npm run lint`, `npx tsc -b`, `npm run build`, `git diff --check`.
- Production QA (persistent testing agent): pill selection → computed preview font + lazy loading
  (no `/fonts/` request before selection, 200 after); refresh persistence; downloaded PDF via
  `pdffonts` (embedded faces, no standard fonts, subset size); DOCX `w:rFonts`; Merriweather name
  fix visible in `pdffonts` face names; Auto/Serif/Sans/Mono/Merri regression; 375px wrap without
  overflow; console clean; zero AI calls; byte-level localStorage restoration.

## Out of scope

- Comic Sans (see above), arbitrary font upload, letterhead (cover/resignation) export font paths,
  TXT/MD (plain text), ATS/scoring/AI changes, new storage keys.
