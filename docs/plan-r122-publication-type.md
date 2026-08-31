# R122 — Publication type field

## Evidence (first-party, this round)

Rezi's Publications editor (`/dashboard/resume/<id>/publication`) leads with a required
**PUBLICATION TYPE** field above the title (`shots-r122/pub-type-focus.png`). Probing the
control confirmed it is a plain free-text `<input>` — no native `<select>`, no dropdown on
focus, arrow-down or typing (`pub-type-arrow.png`, `pub-type-typed.txt` shows only the
"unsaved" indicator after typing). This was the one gap deliberately deferred in R120,
where our structured publications section (R71) shipped without a type.

## Gap

HonestCV `PublicationItem` has title / venue / date / description but no way to say
whether an entry is a journal article, conference paper, book chapter, patent, etc. —
information readers of academic/technical resumes expect on each publication line.

## Design

- `PublicationItem.kind?: string` — optional free text, mirroring Rezi's free-text field.
  Optional (not required) so every existing resume stays valid unchanged.
- Editor: a "Type" input on each publication entry with a `datalist` of common
  suggestions (Journal Article, Conference Paper, Book, Book Chapter, Thesis, Patent,
  Preprint, Magazine Article, Blog Post) — free text still allowed, like Rezi.
- Rendering: `publicationHeadingLine` becomes `title — venue (Kind)`; since PDF, TXT and
  MD already share that helper they pick the type up automatically. Preview and DOCX
  render the same ` (Kind)` suffix inline (italic in DOCX, matching the date styling).
- Sanitization: load-time `kind: asStr(p.kind) || undefined`; the publication library
  sanitizer keeps `kind` only when non-empty, so the stored key is absent when blank.
- Empty-entry semantics (save-to-library disabled state, placeholder replacement on
  insert) treat a type-only entry as non-empty.

## Non-goals

- No required-field validation (Rezi marks it required; we keep all fields optional).
- No schema changes to other sections, no AI/scoring/export-format changes.
