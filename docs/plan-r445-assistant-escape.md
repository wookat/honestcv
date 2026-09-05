# R445 — assistant panel ignores Escape

## Evidence (production, CDP, 2026-09-05)

- `/builder?assistant=1` (setup-complete profile): the Resume assistant side panel opens.
  Pressing Escape does nothing — the panel stays open (`aside h2` still present).
  Every other overlay in the app closes on Escape: Radix dialogs, the compact download
  menu (R419), the mobile hamburger nav (R420).
- Outside click also leaves it open — and that part is **by design**: the panel is a
  modeless work-alongside surface; users edit the resume while chatting, so clicks in
  the editor must not dismiss it. Only the missing Escape path is a defect.
- Keyboard users can still Tab to the X button, so severity is P2/P3 consistency, same
  family as R419/R420.

## Fix (minimal, src/components/AssistantPanel.tsx only)

While the panel is open, a document-level `keydown` listener closes it on Escape,
mirroring the R419 download-menu listener. Guards:

- skip when `e.defaultPrevented` (some layer already consumed it);
- skip when any `[role="dialog"]` is open — Escape then belongs to the dialog
  (paywall, versions, tool dialogs can be open on top of the panel).

No outside-click dismissal (intentional, see above). Chat history persistence, quick
tasks, apply/locate flows, and all markup stay byte-identical.

## Regression checklist

- Escape with panel open → panel closes, no other side effect.
- Escape while a dialog is open above the panel → dialog closes, panel stays.
- Typing in the chat textarea then Escape → panel closes, exactly matching the X
  button (persisted turns survive; the unsent draft also survives reopen in both
  paths, since the panel keeps hook state while rendering null).
- Outside click still does NOT close the panel.
- ?assistant=1 deep link, quick tasks, R444 wizard suppression unchanged.
