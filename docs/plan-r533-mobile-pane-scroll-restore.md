# R533 plan — mobile Builder pane switch restores each pane's scroll position

## Production evidence (2026, cv.zalize.com, CDP @375×812)

- `/builder` document height 5840px; scrolled the Edit pane to `scrollY=1200`.
- Tapped `Preview & score` → `scrollY=0` (fine — a fresh pane should start at the top).
- Tapped `Edit` again → `scrollY=0`. The editing position at 1200 is lost; the user
  who was working deep in Experience is dumped back at the contact card every time
  they peek at the preview.
- Root cause: the mobile pane switcher's onClick unconditionally runs
  `window.scrollTo({ top: 0 })` (Builder.tsx ~line 8078). Both panes share the one
  document scroll context (same class of defect as R532 on /jobs).
- Rezi's Aug-2026 Week 4 changelog highlights "navigate … without losing your place".

## Fix (minimal, Builder.tsx only)

Keep a per-pane scroll offset ref. On switch: store the current pane's `scrollY`,
then restore the target pane's last offset (0 the first time). Behavior:

- Edit → Preview: preview still opens at the top on first visit; if the user had
  scrolled the preview before, their preview position is restored.
- Preview → Edit: editing position restored.
- lg+ viewports unaffected (switcher is hidden and both panes render side-by-side).
- No URL/state/storage changes; R515/R516 first-paint rows untouched.

## Validation

- `npx tsc -b`, `npx eslint src/pages/Builder.tsx`, `npm run build`, `npm run verify-dist`.
- Production QA @375: scroll edit to ~1200 → Preview (top) → Edit → restored ~1200;
  scroll preview → Edit → Preview restores; 1280px unchanged; zero overflow/console
  errors; storage back to baseline keys.
