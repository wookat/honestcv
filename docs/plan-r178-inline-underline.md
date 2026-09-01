# R178 — Inline underline in bullet text across preview and every export

## Rezi evidence (first-hand, public)

- Same changelog entry as R177 (rezi.ai/rezi-changelog, "Updates December 2023 — Bold,
  Italics, Underline, Link now possible"): "highlight text with bold, italic, and
  underline styling" — underline was an explicit R177 non-goal, now in scope.
- Protected app surfaces remain unreachable (login walls, Google OAuth rejected,
  OTP check 403 — unchanged since R176/R177), so scope stays grounded in the public
  changelog statement.

## Current RezUp state (verified in repo + production)

- R177 shipped `**bold**` / `*italic*` / `***bi***` marks in bullet strings with full
  preview/PDF/DOCX/TXT/MD support; `__text__` typed today renders literally everywhere.

## Plan

Extend the R177 mark model with a `__underline__` token — same architecture, no schema
change:

- `src/lib/marks.ts`: `InlineRun` gains `underline: boolean`; `MARK_RE` gains a
  `__…__` alternative (unmatched `__` stays literal); `wrapSelection` accepts `'__'`;
  `domToMarks` maps `U` tags / `text-decoration: underline` to `__`; adjacent-run merge
  regexes extended for `__ __`.
- Preview (`ResumePreview.tsx`): `MarkedText`/`restoreMarkedDom` render underline runs
  as `<u>` (nesting with strong/em); contentEditable native Ctrl/Cmd+U round-trips.
- Editors (`LintedTextarea.tsx`): Ctrl/Cmd+U wraps/toggles the selection in `__`.
- PDF (`pdf.ts`): `RunWord` gains `underline`; after drawing each underlined word the
  writer draws a 0.5pt `drawLine` at baseline−1.5 in the ink color, extending through
  the joining space when the previous word is underlined too. Font choice unchanged
  (underline composes with bold/italic).
- DOCX (`docx.ts`): `body()` runs get `underline: {}` when the run is underlined.
- TXT/ATS/health: `stripInlineMarks` already joins run texts — underline runs strip for
  free; scores stay identical for `__Led__` vs `Led`.
- MD export: `__x__` means bold in CommonMark, so `resumeToMarkdown` post-processes
  bullet lines (`- ` prefix) with a new `marksToMarkdown()` that rewrites underline
  tokens to `<u>x</u>` (standard MD-with-inline-HTML practice); bold/italic marks pass
  through verbatim as before.

## Non-goals

- Hyperlink styling (the remaining changelog item; future round).
- Rich text in non-bullet fields; no toolbar redesign, schema, storage, or scoring
  changes.

## Acceptance

- `__text__` in a bullet renders underlined in preview, PDF (visible rule under the
  run, wraps cleanly), DOCX (`<w:u/>`); TXT strips; MD emits `<u>text</u>`;
  ATS/health scores identical for marked vs unmarked equivalents.
- Ctrl/Cmd+U works in bullet textareas and preview inline editing (round-trips);
  combinations like `**__both__**` render bold+underline.
- No overlap/overflow at 1440 and 375 preview widths; R174–R177 stacked smoke green.
