# R840 — prose fields are one paragraph on every surface

## Evidence (production R839 bundle `9df12a0d`, first-hand)

- `/home/ubuntu/qa/r840-evidence.cjs` → `r840-evidence-1280.json`: a summary typed with Enter
  (`…applications.\n\nShipped…45%.\nStrong…`) and a Certification description with one Enter are
  **stored with the line breaks**; the Builder textareas show them as lines (summary `rows=3`,
  `scrollHeight 116 / clientHeight 76`); the preview renders each in one `<p class="text-[11px]">`
  with `white-space: normal`, so both collapse to a paragraph (summary 2 wrapped lines, cert 1 line,
  `containsLF: true` in the text node).
- `/home/ubuntu/qa/r840-probe.test.ts` → `r840-probe.out` (the renderers on the R839 tree, same
  values): PDF word-wrapper flattens (`… experience. Led platform …`); DOCX puts the raw `\n` inside
  a single `<w:t>` run, no `<w:br/>` (Word shows it as a space, other viewers vary); **TXT and
  Markdown print the line break**; the free-text certifications line behaves the same way.
- Retained corpus `/home/ubuntu/qa/r776-text-replay.json` (114 records): 106 non-empty summaries,
  0 with `\n`; no structured certification descriptions at all. The corpus cannot show the case
  never happens — it shows the imports never produce it, so only the editor does.
- Six surfaces, two behaviours: Builder / TXT / MD keep the break, Preview / PDF / DOCX drop it.
  The same value therefore reads differently in the editor, on screen and in the file the user
  sends — a consistency defect, not a single-field bug (R838 QA filed it as "Certification
  description keeps newlines"; R839 traced it to the shared prose paths).

## Decision

Prose fields — **Summary**, **Certification description**, the legacy free-text **Certifications**
line, **Education details** (already single-line since R837) — are one paragraph everywhere:

1. Enter in a prose textarea inserts nothing (Ctrl/Cmd+B/I/U/K keep working).
2. A pasted or dropped line break becomes a space before it reaches state.
3. Every renderer / export (Preview, PDF, DOCX, TXT, Markdown, and therefore the ATS text) passes
   the value through one helper so values stored before this round read the same on all six.
4. The preview's inline summary editor commits through the same helper, so an old stored break is
   not re-saved when the user edits the paragraph inline.
5. "One item per line" boxes (experience / project bullets, Involvement, Coursework, Awards,
   Publications, Military, agent descriptions, skills) keep their `\n` semantics — untouched.

Rejected: rendering the stored breaks as `<br>` / `<w:br/>` / PDF line breaks (turns a paragraph
into a ragged list on every template and changes ATS text); a migration that rewrites stored
resumes (renderer-side normalisation covers old values without touching storage or Undo history);
`white-space: pre-line` in the preview only (leaves PDF / DOCX / TXT / MD disagreeing).

Free-text certifications stays an `<Input>`: the control cannot hold a newline, so only the
renderer side (`proseText`) is needed; a JSON import with `\n` in that field now prints as one line.

## Fix

- `src/lib/resume.ts`: `proseText(s) = s.replace(/\s*\r?\n\s*/g, ' ').trim()`; `resumeToPlainText`
  and `resumeToMarkdown` use it for summary / cert description / free-text certifications.
- `src/lib/markShortcuts.ts`: `proseKeyDown` (Enter → `preventDefault`, then the mark shortcuts) and
  `proseInput` (`\r?\n` → space).
- `src/components/ResumePreview.tsx`, `src/lib/pdf.ts`, `src/lib/docx.ts`: the three prose values go
  through `proseText` (preview also on inline commit).
- `educationDetailLine()` (`src/lib/resume.ts`, shared by preview / PDF / DOCX / TXT / MD) uses
  `proseText(e.details)`; the preview's inline details editor shows and commits through it. This
  came from the independent QA of the first deploy (`3d44e6ab`): a legacy details value with `\n`
  still rendered `Honors earned.\nThesis completed. · Minor in …` in the preview — the first build
  only normalised the details *editor*.
- `src/pages/Builder.tsx`: summary, certification description and education details textareas use
  `proseKeyDown` / `proseInput` (education details drops its inline copy of the same logic).
- Tests: `tests/prose-newlines.test.ts` (11) — helper, TXT / MD, PDF text, DOCX re-extract, DOCX
  `document.xml` (prose paragraphs have no `<w:br`, bullets keep their own paragraphs), preview /
  PDF / DOCX / Builder source contracts, `proseKeyDown` behaviour (Enter with every modifier
  swallowed, plain keys untouched, Ctrl+B still wraps `**hello**`), free-text certifications is an
  `<Input>`, experience bullets still one per line; the Education details legacy value is asserted
  on TXT / MD / PDF / DOCX / `educationDetailLine` / preview source. `tests/education-details-wrap.test.ts`
  follows the shared helpers. 377 → 388.

## Gates

vitest 388 / 29 files; `tsc -p tsconfig.app.json` and `tsc -b` clean (`tsconfig.base.json` does not
exist in the repo — TS5058, recorded, `tsc -b` is the replacement); eslint 0 errors / 11 pre-existing
warnings; build; verify-dist 123.

## Deploy

New account (`CLOUDFLARE_API_KEY=$CLOUDFLARE_NEW_GLOBAL_API_KEY CLOUDFLARE_EMAIL=$CLOUDFLARE_NEW_ACCOUNT_EMAIL`,
old vars unset), `npm run deploy` (build → verify-dist → wrangler): first `3d44e6ab` (summary / cert /
legacy certifications / editors), then `9ebdec89` with the Education details renderer fix —
production `index-CijgVtd6.js` / `Builder-BsO_d1Qa.js` / `ResumePreview-PicQiwaH.js` /
`pdf-DG7B7FYj.js` / `docx-DX4ykfeK.js` / `style-BGQuqabg.css` SHA-identical to `dist/client/assets`;
`/pricing/` 200, `/examples/examples.json` 200 valid JSON, `/api/health` ok.

## Production QA oracle (testing agent)

- Builder desktop + mobile: Enter in Summary / Certification description / Education details
  changes nothing (value, caret, Undo stack); pasting `a\nb` and `a\r\nb` stores `a b`; Ctrl+B still
  wraps the selection; the six bullet boxes still store `\n`.
- A resume seeded with `\n` in summary / cert description (pre-R840 value written to storage):
  Preview `<p>` text node has no `\n`; inline-edit commit stores no `\n`; PDF text (`pdftotext`) has
  the sentences on one run; DOCX `word/document.xml` has the value in one paragraph, no `<w:br`;
  TXT and MD have it on one line; ATS text likewise.
- Storage restored byte for byte; asset SHAs equal dist before and after.

## Production QA result (testing agent, `/home/ubuntu/qa/r840-qa/` + `/home/ubuntu/qa/r840-delta/`)

- Pass 1 on `3d44e6ab` (1280 / 375, fresh cache-disabled contexts): every editor oracle passed
  (Enter with every modifier, Ctrl/Meta+B/I/U/K, LF / CRLF `insertText` → `a b`, one Undo per
  edit), summary / cert / legacy-certifications legacy values normalised on preview and in the
  real PDF / DOCX / TXT / MD, nine multiline controls unchanged, R837 / R838 layout unchanged, axe
  0. **Found**: legacy Education details with `\n` rendered raw in preview text at both widths,
  in TXT / MD and in the ATS input; DOCX had one `<w:p>` / 0 `<w:br` but a literal LF inside the
  `<w:t>`; PDF was already one run. Harness note: the first desktop controller crashed on a native
  download path vs Playwright `saveAs` mismatch and its isolated context was disposed before the
  final storage snapshot — exports re-run in a fresh context; other contexts restored byte-exact.
- Pass 2 (delta) on `9ebdec89`: legacy `Honors earned.\nThesis completed.\r\nDean approved.` kept
  raw in storage after load, preview text `Honors earned. Thesis completed. Dean approved. · Minor
  in Mathematics · GPA: 3.8` at 1280 and 375; real inline commit (`!` appended) stored without
  `\n`, one app Undo restored the whole resume JSON byte for byte (original LF / CRLF included),
  second edit still normalised after reload; downloaded TXT / MD line equals the paragraph, PDF
  `pdftotext -layout` one run, DOCX one `<w:p>` / one normalised `<w:t>` / 0 literal LF / 0
  `<w:br`; the TXT re-uploaded to `/ats-checker` shows the one-line value, score 77; summary /
  cert / legacy certifications still normalised; nine multiline controls still store `\n` and
  print one line per item; layout 519 / 257 px textareas, toolbars 38×36 / 40×40; axe 0 at both
  widths (3 / 2 incomplete); 376 GET / 0 non-GET / 0 AI / 0 checkout / 0 errors; storage and
  default profile restored diff 0; asset SHAs equal dist before and after. 231 browser + 52
  file assertions. Not covered: native clipboard / drag-drop transport (CDP `insertText` used),
  exports only at 1280, full modifier matrix not repeated in the delta.
