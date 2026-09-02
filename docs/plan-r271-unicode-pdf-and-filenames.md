# R271: Unicode-capable PDF export + honest export filenames

## Production evidence (R270b exploratory audit, docs/qa-r270b-exploratory.md)

- F1 / P2: exporting a resume containing CJK text (e.g. name `张伟 "Wei" O'Brien`)
  from the Builder PDF button fails with an unhandled rejection
  `Error: WinAnsi cannot encode "张" (0x5f20)` — no file downloads and the UI
  shows no error (busy state simply ends). DOCX/TXT/MD succeed for the same resume.
- F2 / P3: `professionalFileName` strips all non-ASCII characters, so
  `张伟 "Wei" O'Brien` → `wei-o-brien-qa-resume.pdf` and a fully-CJK name
  silently degrades to `resume.pdf`.

## Verified facts vs inference

- Verified: src/lib/pdf.ts already wires `@pdf-lib/fontkit` and embeds subsetted
  self-hosted TTFs for the merriweather/sourcesans/robotomono families; the
  serif/sans/mono families use pdf-lib StandardFonts, which are WinAnsi-only.
- Verified: the self-hosted Latin web fonts also lack CJK glyphs, so every
  current font path fails on CJK.
- Verified: Builder/Dashboard download handlers use `try { … } finally`, no
  `catch` — any export rejection is silent.
- Inference: users with non-Latin names/content are a real production audience
  for a resume product; silent export failure is a data-loss-grade UX defect.

## Design

1. **Unicode font fallback in pdf.ts** (covers resume, letter, and text PDFs,
   plus auto-fit page counting, since all go through `embedFontsFor`):
   - `needsUnicodeFont(probe)`: true when any character falls outside the
     WinAnsi (cp1252) repertoire. Probe = full serialized content of the
     document being exported.
   - When true, embed self-hosted `public/fonts/notosanssc-{regular,bold}.ttf`
     (Noto Sans SC, OFL, Google Fonts static TTF build) with `subset: true`;
     italic maps to regular (CJK has no italic). Noto Sans SC also carries
     Latin, Greek (unaccented), Cyrillic, kana and Vietnamese glyphs. Fonts
     are fetched lazily only when needed; subsetting keeps output small.
   - When false, behavior is byte-identical to today (StandardFonts or the
     selected Latin web family).
   - **Library migration (forced by empirical testing, see below)**: `pdf-lib`
     + `@pdf-lib/fontkit` → `@cantoo/pdf-lib` (maintained fork, drop-in API)
     + `fontkit@2`. The old stack embeds CIDFontType0/TTF subsets that
     pdftotext can parse but poppler/mupdf cannot rasterize (tofu boxes /
     scrambled Latin), i.e. text-extraction success with rendering failure.
     The new stack renders correctly in both pdftoppm and mutool draw.
   - **Coverage guard**: before embedding, `assertFontCoverage` checks every
     non-Latin-1 character of the probe against the fallback face's cmap and
     throws a clear error listing unsupported characters (e.g. Arabic, Thai,
     Hangul) instead of silently emitting .notdef tofu — surfaced by (2).

   Rejected alternatives (all empirically tested):
   - Noto Sans SC SubsetOTF on old stack: extractable but unrenderable
     (poppler: "Embedded font file may be invalid").
   - Google TTF on old stack: CJK renders but Latin glyphs scramble.
   - fontkit@2 on old pdf-lib: incompatible subset API (`encodeStream`).
   - GoNotoKurrent on new stack: fontkit@2 layout throws `Not a fixed size`
     on punctuation-only strings (broken GSUB lookup for DFLT script), which
     the per-char width measurement hits on every resume.
2. **Visible export errors**: add `catch` to the Builder download handler and
   both Dashboard download paths; render an inline destructive-toned message
   ("Download failed: …") near the buttons.
3. **Filename policy**: `professionalFileName` keeps Unicode letters/digits
   (`/[^\p{L}\p{N}]+/gu` → `-`) instead of ASCII-only, so `张伟` yields
   `张伟-resume.pdf`, not `resume.pdf`. All-symbol input still falls back to
   `document`. Modern OS/browsers handle non-ASCII download names.

## Scope

- src/lib/pdf.ts (font selection + probe), src/lib/download.ts (slug regex),
  src/pages/Builder.tsx + src/pages/Dashboard.tsx (catch + error line),
  public/fonts (Noto Sans SC assets + OFL license).
- Zero worker/schema/scoring/AI/persistence changes.

## Validation

- tsx oracles: CJK resume PDF generates, extracted text contains CJK, and the
  page rasterizes with real glyphs (pdftoppm + mutool draw, visually checked);
  Latin-only resume PDF byte-path unchanged (standard fonts, no font fetch);
  uncovered scripts (Arabic probe) throw the visible coverage error;
  filename cases (CJK, mixed, symbols-only, legacy Latin unchanged).
- `npx tsc -b`, `npm run lint`, `npm run build`.
- Production QA: real UI CJK PDF download + parse, Latin regression, visible
  error handling, DOCX/TXT/MD regression, mobile/desktop, localStorage baseline.
