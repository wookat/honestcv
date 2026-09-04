# R383 — Move up/down reorder for every entry-list section

## Problem (source evidence)

Reordering exists only for a subset of Builder entry lists:

- Experience and Education: drag handle (`useDragReorder`) **and** Move up/down arrows.
- Projects: Move up/down arrows.
- Sections themselves: drag handle + arrows.

The remaining entry-list sections have **no reorder affordance at all** — the only
"fix" is deleting and re-entering entries in the desired order:

- Involvement, Coursework, Awards & Honors, Publications, References,
  Certifications (structured `certItems`), Military service, Agents.

`grep 'moveItem(' src/pages/Builder.tsx` before this round matched only
experience/education/projects/sectionOrder. Rezi allows reordering entries in every
section; entry order matters (most relevant first), so this is a real editing gap.

## Fix

Builder.tsx only. For each of the 8 sections above, add the same pair of ghost
Move up / Move down buttons used by Projects, at the head of each entry's action
row (before the Hide toggle), reusing the existing `moveItem` helper:

```tsx
disabled={idx === 0}                          // first entry can't move up
disabled={idx === (resume.X ?? []).length-1}  // last entry can't move down
onClick={() => setResume((r) => ({ ...r, X: moveItem(r.X ?? [], idx, ±1) }))}
```

`military` and `agents` `.map()` callbacks gain an index parameter (`mIdx`,
`agIdx`); everything else about those sections is untouched.

## Non-goals / unchanged

- No drag-and-drop for these sections (arrows match the Projects precedent and are
  keyboard-accessible; drag can be a later round if warranted).
- Custom sections (line-based bullets, no entry cards) unchanged.
- Experience/Education/Projects/section reorder unchanged.
- No storage shape changes — reordering rewrites the array order only; entry
  objects are byte-identical.
- Preview/export order follows the array order already, so no render changes.
