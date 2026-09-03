# R323 — inline-edit the education details line in the preview

## Evidence

- R322 production audit (docs/plan-r322-inline-clear-crash.md): education
  "details" was the only body-text preview line with no inline control —
  `ResumePreview.tsx` renders `educationDetailLine(e)` as a plain `<p>`,
  while every comparable line (experience companyInfo, project description,
  bullets, headlines, contact, skills) is an `InlineText`.
- The line is a composite: `details · Minor in X · GPA: Y`
  (`educationDetailLine` in src/lib/resume.ts). Minor/GPA are formatted
  labels, not raw fields, so making the whole line editable would corrupt
  data on commit.
- Rezi benchmark: education Minor/GPA/details are all directly editable in
  its editor; our own R127–R137 inline-editing contract promises click-to-type
  for preview body text.

## Design

Split the composed line into segments in `ResumePreview.tsx` only:

- `e.details.trim()` renders as `<InlineText>` committing
  `{ ...x, details: v }` (empty commit clears the field — same
  delete-by-clearing contract as bullets, safe post-R322 `key={shown}`).
- ` · Minor in X · GPA: Y` stays plain text after it.
- When details is empty but minor/GPA exist, the line renders as before
  (no editable target — adding details still happens in the editor card).
- `educationDetailLine()` untouched (exports/ATS keep using it); the preview
  builds the suffix with the same ` · ` separator so rendering is
  byte-identical for non-editing users.

## Out of scope

Inline editing of minor/GPA/dates/location (labeled composites; would need
per-segment parsing UX), education details in exports (unchanged).

## Validation

tsc/eslint/build; deploy; cache-busted bundle check; production QA:
details round-trip (preview ↔ editor card ↔ localStorage), clear-to-delete
without crash, suffix (Minor/GPA) unedited and byte-identical, marks
tokens preserved, no-details entries unchanged, 375 strict, dark mode,
baseline restore, zero AI.
