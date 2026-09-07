# R702 — builder "Move up / Move down" arrows (12 lists × 2) are silent, and keyboard focus drops to body whenever the moved entry reaches an end

## Evidence (production index-BJXYImy_.js, `qa/r702-evidence.cjs 1280`)

Example resume loaded, MutationObserver over every live region + 100 ms `activeElement` poll, `Enter` on the arrow.

| action | list change | live-region mutations | focus afterwards |
| --- | --- | --- | --- |
| Section order: "Summary" **Move down** (13 sections) | Summary → position 2 | none | stays on the arrow (row keyed by section) |
| Section order: "Summary" **Move up** back to position 1 | Summary → position 1 | none | **body** — the arrow it was on is now `disabled` |
| Experience: role 1 **Move down** (2 roles) | role → position 2 | none | **body** — "Move down" is disabled at the last row |
| Experience: role 2 **Move up** | role → position 1 | none | **body** — "Move up" is disabled at the first row |

Why: the arrows are `disabled={idx === 0}` / `disabled={idx === last}`; Chrome blurs a focused control the moment it becomes disabled, so every move that lands at either end throws the keyboard user out (WCAG 2.4.3). Two-entry lists (the common case for Education, Certifications, Projects…) therefore lose focus on *every* move. Nothing announces the new position (WCAG 4.1.3); the only cue is the visual reorder. The same inline pattern exists at 12 sites: experience, education, projects, involvement, coursework, awards, publications, references, military, agents, certItems and sectionOrder.

## Fix (Builder.tsx only)

- `moveId(list, index, dir) = move-${list}-${index}-${dir}`; every arrow gets `id={moveId('<field>', idx, 'up'|'down')}`.
- `actionNote` + `announce()` (same 1.8 s self-clearing pair as Dashboard / Jobs), rendered as an always-mounted `<p role="status" className="sr-only">` in the header toolbar next to the export status.
- `movedEntry(list, noun, index, delta, length)` called after each `setResume(... moveItem ...)`:
  - `announce(\`${noun} moved ${dir} — now ${to + 1} of ${length}.\`)` — noun is `Role`, `Education`, `Project`, …, or `${sectionLabel(resume, key)} section`.
  - `focusAfterRender(moveId(list, to, dir), moveId(list, to, opposite))` — the same arrow on the moved entry; when that one is disabled (`el.focus()` is a no-op) the opposite arrow of the same entry.
- The 24 `onClick` handlers only gain the trailing `movedEntry(...)` call; `moveItem`, disabled logic, drag-and-drop, visual copy and layout are unchanged.

Known, unchanged: when "Sort by date" is on for Experience/Education the manual move is re-sorted once focus leaves the card (existing `releaseAutoSort` behaviour); the announcement describes the immediate result.

## QA (`qa/r702-verify.cjs 1280|375`)

Same four moves; expect one substantive `role=status` mutation per move with the texts above, focus terminal `#move-sectionOrder-1-down` / `#move-sectionOrder-0-down` / `#move-experience-1-up` / `#move-experience-0-down` (in view), list order correct, storage restored in `finally`, 0 console errors.
