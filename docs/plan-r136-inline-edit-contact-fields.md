# R136 — Inline edit contact fields in the preview

## Audit evidence (Rezi, live DOM, 2026-08-31)

Rezi's Contact editor page exposes the basic fields (email, phone, LinkedIn,
website, country/state) and its Finish Up preview is contenteditable across the
whole document, contact line included. In RezUp, R127 made the header's name
and title editable but deliberately left the contact line read-only; after
R131/R134/R135 it is now the only remaining text in the Builder preview header
that still requires a round-trip to the form.

## Change (zero schema, zero deps)

- `ResumePreview` header: each non-empty contact field (email, phone, location,
  website, linkedin) becomes an `InlineText` committing to the matching
  `resume.contact` key (Enter commit / Escape revert / plain-text paste, same
  R127 semantics). Clearing a field empties it — the field then drops out of
  the contact line, exactly as if cleared in the form.
- The icons-off rendering switches from one pre-joined `contactLine` string to
  per-field spans with static `  |  ` separators so each field is its own
  editable node; visual output is unchanged. The icons-on rendering already has
  per-field spans — the text simply becomes editable.
- Empty fields are not rendered (existing behavior), so adding a brand-new
  field still happens in the form; scope is edit + clear only, matching
  R134/R135.
- Share page and dashboard have no `onEdit` — untouched.
