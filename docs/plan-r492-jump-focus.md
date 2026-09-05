# R492 — programmatic Builder jumps move keyboard focus to the target

## Evidence (production CDP, Builder-KVTTlf2O.js)

- `/builder?example=software-engineer`, focus the score panel "Fix →" button and
  click it: viewport jumps to the entry card (`scrollY 0 → 1535`, ring flash shown)
  but `document.activeElement` is still the origin "Fix →" button
  (`activeIsFix: true`). The next Tab press continues from the score panel —
  thousands of px away from where the UI visibly relocated the user.
- Same for the sticky section-navigator chips: click "Skills" → `scrollY 0 → 3669`,
  `activeIsChip: true`. Focus never follows the jump.
- Entry cards / section cards carry no `tabindex`, so they are not programmatically
  focusable today (`entryHasTabindex: null`).

Impact: keyboard and screen-reader users get no relocation at all from the
jump affordances — the visual flash ring is the only feedback (WCAG 2.4.3 focus
order / SC 3.2.x predictable relocation; mature editors move focus on
jump-to-error).

## Fix (smallest)

Both jump paths already resolve the target element. After scrolling:

```ts
el.tabIndex = -1                      // focusable programmatically, not in tab order
el.focus({ preventScroll: true })     // scroll already handled (reduced-motion aware)
```

- `Builder.tsx` section-jump handler (`JUMP_EVENT` listener): focus `ref.current`.
- `Builder.tsx` `jumpToEntry`: focus the `[data-entry-id]` card.

`tabIndex = -1` keeps natural Tab order unchanged; `preventScroll` avoids
double-scrolling against the existing `scrollIntoView` call (which since R491 is
reduced-motion aware).

## Non-goals

- No change to Dashboard hash scrolling (browser-native anchor semantics).
- No visible focus-ring styling changes (flash ring already marks the target).
- No change to scroll behavior, flash timers, or R489/R490/R491 semantics.

## QA plan (production, CDP)

1. "Fix →" jump: activeElement becomes the target entry card; Tab continues from it.
2. Section chip jump: activeElement becomes the section card.
3. Natural Tab order unchanged (tabindex=-1 not reachable by Tab).
4. Reduced-motion + normal-motion jumps still land correctly (R491 regression).
5. 375px light/dark zero overflow; zero console errors.
