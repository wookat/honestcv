# R134 — Inline edit description-derived bullets in the preview

## Audit evidence (Rezi Finish Up, live DOM, 2026-08-31)

Rezi's whole preview is contenteditable — every bullet line in every section
family (Involvement, Awards, Publications, Coursework, Military, custom) can
be edited in place. In RezUp, R127/R130/R133 made experience bullets fully
editable (edit / clear-to-delete / insert-in-place), and R131 made all
structured-section *headline* fields editable — but the bullet lines of the
other structured sections are still plain text: they derive from each entry's
multi-line `description` and can only be changed back in the form.

## Change (zero schema, zero deps)

- New helper `editDescriptionLine(description, index, next)` in
  `src/lib/resume.ts`: splits on `\n`, walks lines counting non-empty trimmed
  lines (matching the `*Bullets` derivation), replaces the `index`-th visible
  line with `next` — or deletes the line entirely when `next` is empty (R130
  semantics) — leaving all other lines byte-for-byte intact.
- `ResumePreview`: wrap derived bullets in the existing `InlineText`
  (Enter commit / Escape revert / plain-text paste / stopPropagation) for
  involvement, coursework, awards, publications, military, and agents,
  committing via `editDescriptionLine` on the entry's `description` by stable
  id. Synthetic first bullets (`Skill: …` on coursework, `Skills used: …` on
  agents) stay read-only; the description-line index is offset accordingly.
- No draft/insert row here (descriptions are free-form textareas with their
  own editing surface for adding lines); scope is edit + clear-to-delete only.
- Share page and dashboard have no `onEdit` — untouched.

## Acceptance

- Edit an involvement/award/publication bullet in the preview → the exact
  line changes in the entry's `description` (form textarea + storage), other
  lines untouched; Escape reverts.
- Clear a bullet → that line is removed from `description` (no ghost blank
  line, matching R130).
- Coursework `Skill:` / agents `Skills used:` bullets are not editable; their
  following description bullets map to the right lines.
- R127/R130/R131/R133 regressions green; share/dashboard remain read-only;
  1440 + 375 viewports clean.
