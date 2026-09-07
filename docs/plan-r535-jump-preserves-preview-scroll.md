# R535 — Score-panel jumps preserve the preview pane's scroll position (mobile)

## Production evidence (2026-08-31, cv.zalize.com, 375×812, CDP)
- `/builder?example=software-engineer` → open "Preview & score" → scroll to 600 (checks list) → click a `Fix →` (jumps to Edit, entry focused, correct per R534) → switch back to "Preview & score": `scrollY` = 0 instead of 600. The user loses their place in the checks list on every fix round-trip.
- Rejected candidates this round: Rezi changelog unchanged (no new actionable item); toolbar has no mobile undo/redo defect surface probed; /documents buttons render and behave, zero console errors.

## Root cause
`jumpToSection` and `jumpToEntry` call `setMobilePane('edit')` directly. The R533 per-pane scroll memory (`paneScrollRef`) is only written in the pane-switcher `onClick`, so a programmatic pane switch never saves the preview pane's current offset — the restore effect later scrolls back to a stale 0.

## Minimal fix (src/pages/Builder.tsx only)
In both jump helpers, save the current pane's offset before switching:

```tsx
if (mobilePane !== 'edit') paneScrollRef.current[mobilePane] = window.scrollY
setMobilePane('edit')
```

No change to the switcher, R533 restore effect, desktop layout, `?jump=` deep links, or R534 entry-jump precedence.

## QA
1. 375px: Preview @600 → Fix → (entry jump) → back to Preview: scrollY restored to 600.
2. Same for a section-level Fix → (jumpToSection path).
3. First Preview open still starts at top; Edit scroll after jump unaffected.
4. `?jump=skills` regression; 1280px unaffected; zero overflow/console errors; storage baseline.
