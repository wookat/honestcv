# R541 — the highest-impact priority fix gets a Fix → action in the Builder

## Production evidence (CDP, 375×812, index deployed after R540)
Seed the R538 QA resume (it has a target JD with one missing keyword). Open the Builder's
"See full score breakdown" dialog:

- "Add missing job keywords — 1 of 7 posting keywords are absent" renders tagged **High**
  — the top-ranked priority fix — yet it is the only priority item with **no Fix → action**.
- Every lower-impact Med item next to it has a working Fix →.
- The assistant's improve-score reply even promises "The Score breakdown has one-click
  jumps to each spot."

Meanwhile /ats-checker already deep-links this same fix to the Target job panel via a
text-prefix hack (`f.text.startsWith('Add missing job keywords') ? 'target' : …`).

## Root cause
`priorityFixes()` in `src/lib/guidance.ts` pushes the keyword fix without an `anchor`
(`PriorityFix.anchor` is typed `SectionAnchor`, which has no value for the Target job
panel). The dialog renders Fix → only when `f.anchor` is set, so the keyword fix gets
nothing. The Builder has long supported `jumpToSection('target')` (the keyword panel's own
"Update job description →" button uses it, and `'target'` is in `JUMP_ANCHORS`).

## Minimal fix
- `guidance.ts`: widen `PriorityFix.anchor` to `SectionAnchor | 'target'`; set
  `anchor: 'target'` on the keyword fix.
- `Builder.tsx` score-breakdown dialog: widen `onJump`/`jump` to accept
  `SectionAnchor | 'target'` (the parent already passes `jumpToSection`, which takes a
  plain string).
- `AtsChecker.tsx`: drop the now-redundant text-prefix hack — `openInBuilder(f.anchor)`.

Non-goals: no scoring changes, no new anchors beyond `'target'`, no changes to
entry-level jumps or the checker's deep-link semantics.
