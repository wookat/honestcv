# R131 — Inline preview editing for all structured section headlines

## Audit evidence (Rezi, public logged-in surfaces, 2026-08-31)

Rezi's Finish Up preview is uniformly `contenteditable`: every section's text —
including the Pro-tier section families (References, Military Service, Agents)
and the Academic/Other families (Coursework, Involvement, Certifications,
Awards, Publications) — can be edited in place, not just Experience/Education.

RezUp's R127 inline editing covers name/headline/summary + experience +
education + projects only. The other 8 structured sections (involvement,
coursework, certifications, awards, publications, references, military,
agents) render plain text: a typo in "AWS Solutions Architect — Amazon" still
forces a trip back to the form. First-hand check of `ResumePreview.tsx`
confirms these sections' headline fields are raw `{x.field.trim()}` output.

## Change (Builder-only, zero schema, zero deps)

Wrap each section's headline fields in the existing `InlineText` (R127
semantics: Enter commits, Escape restores, plain-text paste, blur commits,
click stopPropagation preserves R125 whitespace jump). Fields per section —
all direct string fields on id-keyed entry arrays:

- involvement: `role` (fallback "Role"), `organization`
- coursework: `name` (fallback "Course"), `institution`
- certifications: `name` (fallback "Certificate"), `issuer`
- awards: `name` (fallback "Award"), `organization`
- publications: `title` (fallback "Publication"), `venue`
- references: `name`
- military: `rank` (fallback "Rank"), `branch`
- agents: `name`

Commit pattern identical to R127 (immutable map by stable `id`):

```ts
onCommit={onEdit && ((v) => onEdit({
  ...resume,
  involvement: (resume.involvement ?? []).map((x) =>
    x.id === inv.id ? { ...x, role: v } : x
  ),
}))}
```

Deliberately excluded (unchanged): description-derived bullet lines (belong to
each field's own multi-line editor), dates, locations, kind/type, detail lines
(composed multi-field strings that can't round-trip through one span), skills
lines (parsed `label: text`), custom-section bullets. Secondary fields stay
conditionally rendered — only visible (non-empty) text is editable, matching
R127's existing sections. Share pages / dashboard have no `onEdit`; unchanged.

## Acceptance

- Each of the 16 fields above is click-editable in the Builder preview; commit
  persists to storage/form, Escape restores, reload persists, ATS recomputes.
- Emptying a *required-ish* primary field shows its fallback placeholder (entry
  still listed since the sibling field keeps it non-empty) — same as R127
  degree behavior.
- Share page still renders zero contenteditable nodes.
- R125–R130 regressions green; 375px no horizontal overflow.
