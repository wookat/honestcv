# R352 — save-state feedback on small screens (icon-only indicator below xl)

## Evidence (first-hand, 2026-08-31)
- Builder toolbar renders the Saving…/Saved text with `hidden xl:inline` — at every width
  below 1280px (all phones and tablets, most laptops) there is NO autosave feedback at all.
  R351 QA confirmed the span is `display:none` at 375px. Undo/redo buttons are also hidden
  below `lg`, so nothing else in the header implies persistence state.
- Company acceptance bar: mobile adaptation is a hard acceptance criterion. Rezi's builder
  keeps a persistent save indicator; a local-first product should not go silent about
  persistence exactly where users are most likely to close the tab quickly (mobile).
- R199 history: the 375px header previously overflowed by 13px; any addition must be
  icon-sized and re-verified at 375px strict.

## Change (minimal, Builder.tsx toolbar only)
Keep the xl+ text exactly as-is; below xl render an icon-only status in the same slot:
- saving → `Loader2` spinner (muted, size-3.5)
- saved → `Check` (muted, size-3.5)
- wrapped in a `role="status"` span with `aria-label`/`title` "Saving…" / "All changes saved".
The R351 error state is unchanged (text alert already visible at all widths).

## Non-goals
- No toolbar redesign, no relocation of undo/redo, no bottom-bar changes, no new deps.

## Verification
- tsc/eslint/build; production QA: 375px + 768px show the icon states (spinner during the
  debounce window, check after), aria-label/title correct, zero horizontal overflow at 375px
  strict (R199 regression), xl unchanged text, R351 error state still takes over the slot,
  dark mode, baseline restore.
