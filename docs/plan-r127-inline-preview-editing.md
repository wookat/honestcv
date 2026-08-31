# R127 — Inline text editing in the Builder live preview

## Evidence (direct Rezi audit, 2026-08-31, logged-in)

- Rezi's Finish Up & Preview page renders the resume with real `contenteditable="true"`
  nodes for section headings, role/company lines, and each bullet list (first-hand DOM,
  `/dashboard/resume/<id>/finish-up`). Users can click any text in the preview and type.
- RezUp's Builder preview (R125) only *jumps* to the editor card on click — spotting a
  typo in the preview still costs a click + scroll + hunting for the right field.

Re-checked and confirmed already covered (not duplicated this round): keyword
add/draft/dismiss (ats + KeywordBulletDialog + ignoredKeywords), sample library with
search/sector filters (Dashboard), resume-level ops (versions dialog: rename/folder/
duplicate/open/delete), new-resume targeting dialog (R32), date sorting, score panel.

## Scope

Make the high-frequency *text* fields directly editable in the Builder live preview:

- Header: full name, title
- Summary paragraph
- Experience: role, company, each bullet
- Education: degree, school
- Projects: name, description

Not in scope (deliberate):
- Dates (R124 picker is the right editing surface; free-text inline editing would
  bypass it), locations, contact line (five joined fields — one text node would be
  ambiguous to split back), skills lines (rendered from parsed `label: text` grouping —
  editing a derived line can't round-trip reliably), section headings (labels are
  settings, not content), read-only surfaces (share page, dashboard thumbnails) stay inert.

## Design

- New `InlineText` leaf component in ResumePreview: renders a `<span>` with
  `contentEditable` + `suppressContentEditableWarning`, plain-text only
  (paste is intercepted and inserted as text). Enter commits and blurs;
  Escape reverts; blur commits. Empty commit is allowed (clears the field;
  existing preview logic already hides empty entries/bullets).
- ResumePreview gains an optional `onEdit?: (next: Resume) => void` prop.
  When absent (share page, dashboard, dialogs) nothing changes — spans render
  as plain text exactly as today.
- Each editable site builds the next Resume immutably in place
  (entries keyed by stable `id`), e.g. bullet commit maps
  `experience.map(x => x.id===e.id ? {...x, bullets: replaceAt(i, v)} : x)`.
- Coexistence with R125 click-to-jump: InlineText stops click propagation so
  focusing a text doesn't trigger the section jump; clicking section whitespace
  still jumps. `cursor-text` on editable spans vs `cursor-pointer` on the block.
- Builder passes `onEdit={setResume}` (same autosave path as the form).

## Acceptance

- 1440: click name/summary/role/company/bullet/degree/school/project text in the
  preview, type, blur → form field updates, autosave persists, ATS score recomputes.
- Enter commits (no newline inserted), Escape reverts.
- Clicking section background still jumps to the editor card (R125 intact).
- Share page `/r/<id>` and dashboard thumbnails remain non-editable.
- 375: preview editing works (tap to focus); no layout overflow.
- Zero schema change, zero new deps; lint/build green locally.
