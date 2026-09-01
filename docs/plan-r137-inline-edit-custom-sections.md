# R137 — Inline edit custom sections in the preview

## Audit evidence (Rezi, live DOM, 2026-08-31)

Rezi's Finish Up preview is contenteditable across the whole document,
including any user-added sections. In RezUp, after R127/R128/R131/R134/R135/
R136 every built-in section's preview text is editable inline — custom
sections (`resume.customSections`, title + one-bullet-per-line) are the last
preview text that still requires a round-trip to the form, and their heading
is also the only heading not renameable in place (R128 covers built-in keys
only; a custom section's heading IS its title field).

## Change (zero schema, zero deps)

- Custom section heading: rendered via the same heading style but as an
  `InlineText` committing to that section's `title` (fallback placeholder
  "Additional" stays visible and editable when the title is empty, matching
  R131 placeholder semantics). This is title editing, not `sectionHeadings` —
  no new storage.
- Custom section bullets: each rendered bullet becomes an `InlineText`
  committing to `bullets[i]` by its raw array index (empty lines are skipped
  in render but keep their index, so blank textarea lines are preserved
  byte-for-byte). Clearing a bullet removes that array entry — no ghost blank
  line in the form textarea (R130 semantics). Enter commit / Escape revert /
  plain-text paste, same R127 semantics.
- Scope is edit + clear only (adding bullets/sections stays in the form),
  matching R134/R135/R136.
- Share page and dashboard have no `onEdit` — untouched.
