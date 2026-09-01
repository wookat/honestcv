# R177 — Inline bold/italic in bullet text across preview and every export

## Rezi evidence (first-hand, public)

- rezi.ai/rezi-changelog, "Updates December 2023 — Bold, Italics, Underline, Link now
  possible": "Style text directly on your resume … highlight text with bold, italic, and
  underline styling", shipped via a Lexical rich-text refactor of Rezi's text areas
  (audit shots in ~/audit-r1/shots-r177/).
- Protected app surfaces remain unreachable this round (login walls, Google OAuth
  rejected, OTP check 403 — unchanged since R176), so the in-editor toolbar layout is
  not observed; scope is grounded in the changelog statement only.

## Current RezUp state (verified in repo + production)

- Bullet text is plain everywhere: `PdfWriter.bullet()` draws one regular-font run,
  DOCX `body()` emits a single `TextRun`, the preview renders raw strings via
  `InlineText`, TXT/MD exports pass text through untouched.
- `**bold**` / `*italic*` typed by a user today renders literally in all outputs.

## Plan

Markdown-style inline marks in bullet strings — no schema change, marks live in the
existing string fields:

- New `src/lib/marks.ts`:
  - `InlineRun { text, bold, italic }`, `parseInlineMarks(text)` (supports `**b**`,
    `*i*`, `***bi***`; unmatched asterisks stay literal), `stripInlineMarks(text)`,
    `hasInlineMarks(text)`, `wrapSelection(value, start, end, mark)` for textareas,
    `domToMarks(node)` to serialize contentEditable B/STRONG/I/EM back to marks.
- PDF: run-aware `bullet()` — greedy word wrap across mixed-font runs
  (bold→fonts.bold, italic→fonts.italic, bold+italic→bold); plain path unchanged.
- DOCX: `body()` splits text into `TextRun`s with bold/italics per run.
- Preview: `InlineText` renders parsed runs as `<strong>`/`<em>`; contentEditable
  commit serializes via `domToMarks` so native Ctrl+B/Ctrl+I in the preview round-trip.
- Editors: Ctrl/Cmd+B and Ctrl/Cmd+I in the bullet textareas (LintedTextarea) wrap the
  selection in `**`/`*`.
- Scoring/lint see clean text: strip marks in ATS keyword/word-count tokenization and
  in the per-line writing lint so `**Led` still matches strong-verb rules (line-level
  wavy underlines unaffected).
- TXT export strips marks; Markdown export passes through (already markdown).

## Non-goals

- Underline and hyperlink styling (Rezi has them; future round).
- Rich text in non-bullet fields (headline/summary stay plain this round).
- No toolbar redesign, schema, storage, or scoring-formula changes.

## Acceptance

- `**text**`/`*text*` in a bullet renders styled in preview, PDF, DOCX; TXT strips,
  MD preserves; ATS/health scores identical for marked vs unmarked equivalents.
- Ctrl+B/I works in bullet textareas and in preview inline editing (round-trips).
- Mixed-run PDF wrapping shows no overlap/overflow at 1440 and 375 preview widths.
