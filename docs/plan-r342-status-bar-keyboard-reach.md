# R342 — make transient action bars keyboard-reachable (Dashboard undo, Builder cross-tab)

## Evidence (R340 production keyboard audit, P3③)

- Dashboard delete-undo bar (R320) and the Builder cross-tab change bar (R321) are
  `role="status"` fixed overlays rendered at the *end* of the page DOM. Both were confirmed
  keyboard-operable in R340, but only after tabbing through the entire page (hundreds of stops).
- Dashboard specifics: both delete flows go through a confirm Dialog whose opener (the card's
  delete button) is removed with the card, so after "Delete" the R340 focus-return finds a
  disconnected opener and focus falls to `BODY`. The keyboard user is left nowhere, with the
  10-second Undo window ticking.
- Builder specifics: the cross-tab bar appears from an external `storage` event while the user
  may be mid-typing — stealing focus there is unacceptable; the problem is purely discoverability
  (last stop in a ~10k-line page).

## Design

1. **Dashboard undo bar: move focus to the Undo button when the bar appears.**
   - Not a focus steal: the previously focused element (delete button / confirm dialog) is gone;
     focus is on BODY at that moment. Focusing Undo is strictly better and mirrors the mouse
     user's experience (the bar is the obvious next action).
   - Implemented via a ref + effect on `undoDelete`, with a short delay so it runs after the
     confirm dialog's Radix close-autofocus settles.
2. **Pause the 10 s auto-dismiss while focus is inside the bar** (WCAG 2.2.1 — enough time).
   Blurring the bar restarts the 10 s window. Mouse behavior unchanged.
3. **Builder cross-tab bar: render it first inside the page root** (right before the header).
   `position: fixed` keeps the visual placement identical; it becomes the first Tab stop while
   present instead of the last, with no focus movement. `role="status"` announcement unchanged.

## Non-goals

- "Draft a bullet using <kw>" chips deep tab order (R341 P3 candidate) — separate surface,
  needs its own design.
- Tailoring-dialog silent Esc with unreviewed suggestions — still an observation, not a defect.

## Verification

- Local: tsc / lint / build.
- Production QA (zero AI): delete a copy and a doc keyboard-only → focus lands on Undo,
  Enter restores byte-identically at original index; focused bar does not auto-dismiss at 11 s+,
  blur → dismisses ~10 s later; X path; Builder two-tab flow → bar is the first Tab stop,
  typing focus not stolen; 375px + dark; baselines restored.
