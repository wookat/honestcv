# R88: Merriweather font family (embedded web font across preview, PDF and DOCX)

## First-hand evidence (R87 audit round, ~/audit-r1/shots-r87/)

- Rezi's Finish Up toolbar shows the current font as **MERRIWEATHER** — it is Rezi's
  default resume font (captured in `switcher-text.txt`: "MERRIWEATHER / Font").
- R84's audit (`shots-r82/rezi-finishup-font-family-dropdown.png`) already captured the
  full 7-font dropdown: Merriweather, Source Sans Pro, Calibri, Times New Roman,
  Georgia, Courier New, Roboto Mono. R84 shipped Serif/Sans/Mono via the three PDF
  standard fonts and deliberately deferred web fonts because they require embedding
  font binaries into the PDF.

## Gap

HonestCV's font options (Auto/Serif/Sans/Mono) all map to the 14 built-in PDF standard
fonts. Rezi's signature look — its default Merriweather — cannot be reproduced at all:
`pdf-lib` standard fonts cover only Times/Helvetica/Courier, so a real web font needs
`@pdf-lib/fontkit` + a TTF embedded (subset) into the document.

## Design

- `Resume.fontFamily` enum gains `'merriweather'` (sanitizer whitelist updated; legacy
  archives untouched — unknown values already fall back to `auto`).
- `FontFamilyKind` gains `'merriweather'`; `familyOf` returns it when selected.
- Font binaries: Merriweather Regular/Bold/Italic, instanced from Google Fonts'
  variable TTFs (opsz=18, wdth=100, wght=400/700) and subset to Latin (~250 KB each),
  served from `public/fonts/` next to the existing Inter/Sora files. OFL license text
  included (`merriweather-OFL.txt`).
- Preview: `@font-face` for the three faces + stack `Merriweather, Georgia, serif`.
- PDF: when `merriweather`, `doc.registerFontkit(fontkit)` and embed the three TTFs
  fetched from `/fonts/…` with `subset: true`; otherwise the standard-font path is
  byte-identical to today.
- DOCX: `FONT_BY_KIND.merriweather = 'Merriweather'` (name reference, as with all DOCX
  fonts; Word falls back if the font is not installed locally — disclosed).
- Builder: fourth Font button `Merri` after Mono.

## Explicitly out of scope

- The other Rezi web fonts (Source Sans Pro, Roboto Mono) — same mechanism, follow-up
  rounds if wanted; Merriweather is the default and highest-value.
- Letterhead (cover/resignation) exports keep their existing font path.
- TXT/MD (plain text), scoring, AI, storage keys: unchanged.
