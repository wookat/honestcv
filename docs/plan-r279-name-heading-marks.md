# R279 — Inline marks in contact name & section headings (PDF + DOCX) + editor consistency fixes

## Evidence (R279 exploratory production audit, docs/qa-r279-plan.md)

P2 (production reproduction, cv.zalize.com, real UI downloads):
- Contact name `**Edgar** __Case__` renders styled in the preview, but the
  downloaded PDF prints the literal `**Edgar** __Case__` at 22pt and the DOCX
  `word/document.xml` contains the literal marks.
- Custom section title `__Special__ **Projects**` renders styled in the
  preview but exports as literal `__SPECIAL__ **PROJECTS**` (PDF heading) and
  literal marks in DOCX.

Source location of the gap:
- `src/lib/pdf.ts` — name drawn via `w.text(name, { font: fonts.bold, size: 22 })`;
  `heading()` draws the raw label via `text()`/`drawText()`. Neither parses marks.
  R272–R278 covered summary/body/bullets/companyInfo/entry headlines only.
- `src/lib/docx.ts` — name paragraph uses a single bold `TextRun`; `heading()`
  uses a single bold accent `TextRun`. `headRuns()` (R278) exists but is not
  used for the name or headings.

P3s from the same audit:
- Summary textarea has no Ctrl/Cmd+B/I/U/K mark shortcuts (bullet fields do,
  via `LintedTextarea`'s `applyMark`).
- Score-breakdown priority fixes quote bullets with raw marks
  (`"Shipped **bold** __feature__…"`) — `src/lib/guidance.ts` quotes the raw
  string where every renderer/export already strips or styles marks.

Not fixed this round (by design):
- The "bracket placeholder" consistency check already strips valid link marks
  (`stripInlineMarks` at `guidance.ts` placeholder scan). The audit's
  `[quickly](url)` case is flagged because the literal `url` placeholder is
  not a valid href yet — that flag is correct (the link is unfinished), so no
  change.

## Design

marks.ts
- New `upperInlineMarks(text)`: uppercase the visible text of a marked string
  while leaving `](url)` link targets untouched, so `nameCase`/`headingCase`
  'upper' templates can transform marked strings without corrupting hrefs.

pdf.ts
- Name: when `hasInlineMarks(name)` render via `richText(name, 22*fs,
  { fonts: boldBase, gap: 0 })` (boldBase = regular→bold as in R278). For
  center-aligned headers, center by temporarily shifting `x0` by
  `(contentW - strippedWidth)/2` when the stripped name fits one line;
  otherwise fall back to the left-aligned rich path.
- `heading(label)`: uppercase transform via `upperInlineMarks` when marked.
  - default flow path: `richText(text, 11*fs, { fonts: boldBase, color: accent, gap: 0 })`,
    divider logic unchanged.
  - `sideLabels` gutter path and `band` path draw at custom x/y with a
    width-fit loop; these render `stripInlineMarks(text)` (no literal marks;
    per-run styling intentionally dropped in these two specialized layouts).
- Mark-free strings keep the existing byte-identical code paths.

docx.ts
- Name paragraph: `headRuns(name, 40)` (bold base + italic/underline/link runs);
  mark-free path unchanged (headRuns already short-circuits).
- `heading(text)`: when marked, parse to runs (bold, accent color, sz(22),
  italics/underline/hyperlink per run) with per-run uppercase when
  `headingCase === 'upper'`; mark-free path unchanged.

Builder.tsx / LintedTextarea.tsx
- Export the existing mark-shortcut keydown logic from `LintedTextarea` as
  `markShortcutKeyDown(ev)` and attach it to the Summary textarea so
  Ctrl/Cmd+B/I/U/K work there like in bullet fields (summary preview/exports
  already support marks since R272).

guidance.ts
- Priority-fix / finding quotes of bullet text pass through
  `stripInlineMarks` so raw marks never appear in score-breakdown copy.

## Verification
- Local oracle (.tmp-smoke/r279_oracle.ts): PDF extraction has no literal
  `**`/`__` for marked name + custom heading; name words present; DOCX XML has
  no literal marks, real `w:u` runs in heading/name; mark-free resume
  byte-stable regressions (R275–R278 fixtures).
- lint / tsc -b / build green; deploy to production; testing-agent production
  QA via real UI downloads (pdftotext + pixel + DOCX XML), summary shortcut
  check, priority-fix copy check; localStorage/theme restored.
