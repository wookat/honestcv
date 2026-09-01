# R135 — Inline edit skill lines in the preview

## Audit evidence (Rezi, live DOM, 2026-08-31)

Rezi's skills editor is a `contenteditable="true"` surface and its Finish Up
preview is contenteditable across every section — skills included. In RezUp,
after R127/R131/R134 the Skills section is the last major text section whose
preview lines are still plain text: they derive from the multi-line
`resume.skills` string (`skillLines`: one line per non-empty line, with an
optional bold `Category:` prefix) and can only be changed in the form textarea.

## Change (zero schema, zero deps)

- `ResumePreview`: each skill line becomes editable in place using the existing
  `InlineText` (Enter commit / Escape revert / plain-text paste) and the R134
  helper `editDescriptionLine` on `resume.skills`:
  - Labelled lines render as two spans — the bold category label and the text —
    each independently editable. Committing recomposes the line
    (`label: text`); clearing the label drops the prefix, keeping the text.
  - Clearing a line's text deletes the whole line (R130 semantics), label and
    all.
  - Blank lines and other lines in the textarea stay byte-for-byte intact
    (editDescriptionLine indexes non-empty lines, matching skillLines).
- Share page and dashboard have no `onEdit` — untouched.
- No draft/insert row (the skills textarea is the surface for adding lines);
  scope is edit + clear-to-delete only, matching R134.
