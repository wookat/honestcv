# R444 — first-run wizard stacks on top of deep-link surfaces on /builder

## Evidence (production, CDP, 2026-09-05)

Fresh profile (no `honestcv.setupDone` / `tourDone` / `shared`):

- `/builder?doc=cover` → **two dialogs open at once**: the Cover Letter tool dialog and the
  first-run "What job are you targeting?" wizard render stacked (both `data-state=open`,
  same z-50; wizard covers the Cover Letter content, two X buttons overlap). A first-time
  visitor following any "Write a cover letter" CTA (static letter pages, /jobs rows) lands
  on a broken double-dialog. Screenshot: `audit-r1/r444_doc_cover.png`.
- `/builder?assistant=1` → wizard opens and hides the assistant panel the link asked for.
- `/builder?jump=summary` → wizard opens and steals focus from the section the ATS-checker
  "Fix →" link targeted.
- `?example=` deep links were already excluded from the wizard (R350/R358), proving the
  intended pattern: a deep link with its own intent suppresses the first-run wizard.

## Fix (minimal, src/pages/Builder.tsx only)

Extend the `wizardOpen` mount initializer to also stay closed when the URL carries a
deep-link intent that opens its own surface or targets a section:

- valid `?doc=` tool (`cover` / `interview` / `resignation`)
- `?assistant=1`
- valid `?jump=` anchor (in `JUMP_ANCHORS`)

Invalid values keep the current behavior (wizard opens; R443's not-found bar still shows
for dead `?jump=`). No change to wizard content, `setupDone` persistence, or the
empty-draft guard.

## QA checklist (production, fresh-baseline localStorage)

1. `/builder?doc=cover` fresh: only the Cover Letter dialog; no wizard; closing it shows no wizard this mount.
2. `/builder?assistant=1` fresh: assistant open, no wizard.
3. `/builder?jump=summary` fresh: jump lands, no wizard; `/builder?jump=bogus` fresh: R443 bar + wizard behavior per initializer (bogus jump ⇒ wizard may open — acceptable, no own surface).
4. Plain `/builder` fresh: wizard still opens (R350 regression).
5. `?example=` exclusion regression.
6. 375×812 light/dark, zero console errors, zero unsafe traffic, byte-exact localStorage restore.
