# R540 — programmatic entry jumps stop being cancelled by the pane scroll restore

## Production evidence (CDP, 375×812, index deployed after R539)
Seed the R538 QA resume. From the mobile Preview pane open "See full score breakdown" and
click the health dimension's entry-label locate button for an Experience entry:

- The correct card gets focus (`data-entry-id` matches, R539 anchor path fine)
- but the page never scrolls: probed at +2s/+4s/+7s the card stays at `top:2977`,
  `scrollY:3` — focused yet fully out of view.

Reproduced 3/3. The Projects case in the same run landed correctly (scrollY 4426),
so the failure is a timing race, not the R539 anchor path.

## Root cause
`jumpToEntry`/`jumpToSection` save the preview offset and `setMobilePane('edit')`.
The R533 pane-restore effect then runs `window.scrollTo({top: paneScrollRef.current.edit})`
(edit offset ≈ 0). When that instant scroll lands after the jump's rAF has started its
smooth `scrollIntoView`, it cancels the smooth scroll and the page stays at the stale
edit offset. Whether the effect or the rAF fires first is timing-dependent, which is why
Projects (extra JUMP_OPEN_EVENT render) usually wins and Experience usually loses.

## Minimal fix (src/pages/Builder.tsx only)
Programmatic jumps scroll to a specific target, so restoring the edit pane's previous
offset is never wanted for them:

- Add `skipPaneRestoreRef = useRef(false)`.
- `jumpToSection`/`jumpToEntry` set it `true` when they switch panes.
- The pane-restore effect clears the flag and returns without `scrollTo` when set.

Switcher-button pane changes keep the R533/R535 restore behavior unchanged.

## Non-goals
- No change to the R539 anchor forwarding, JUMP_OPEN_EVENT, or the switcher restore path.
- No change to desktop behavior (no pane switching on lg+).
