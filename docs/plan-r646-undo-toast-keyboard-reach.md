# R646 — Undo toasts reachable by keyboard after stop-tracking / delete

## Evidence (production, 2026-09-06, `index-CF7J0Qo1.js`, CDP keyboard-only)

Fixture: tracked job 2091088 (applied) linked to copy `qa-v1` + cover doc `qa-cover`;
`/jobs?tab=tracked&job=2091088`, `/dashboard`. Script `~/qa/r646-evidence.cjs`.

| Flow (keyboard only)                                     | Focus after the action           | Tabs to reach **Undo** |
| -------------------------------------------------------- | -------------------------------- | ---------------------- |
| /jobs panel chip `Applied` → dialog → **Stop tracking**  | `Applied` chip (dialog restore)  | **29**                 |
| /dashboard copy row **Delete** → dialog → **Delete**     | `<body>` (row unmounted)         | not within 40          |
| /dashboard document row **Delete** → dialog → **Delete** | `<body>`                         | not within 40          |

The toasts (`role="status"`) auto-dismiss after 10s. A keyboard user therefore
cannot realistically reach Undo before it disappears — the R598/R606 Undo is a
mouse-only affordance in practice. axe reports nothing here (no violation type
covers "focus target after destructive action").

## Fix (minimal, no visible change)

1. `focusOnClose(id)` (`src/lib/useFocusAfterRender.ts`) — an
   `onCloseAutoFocus` handler for the confirm dialogs: when the element with
   `id` exists after close (the Undo toast the action produced), focus it
   instead of the default restore; Cancel path (no toast) keeps the existing
   restore-to-opener behaviour.
2. Undo buttons get stable ids: `undo-delete` (dashboard), `undo-untrack`
   (jobs). Dashboard's 3 delete dialogs and jobs' 2 untrack dialogs pass
   `onCloseAutoFocus={focusOnClose(...)}`; the no-dialog untrack path
   (chip toggle with nothing linked) uses `focusAfterRender('undo-untrack')`.
3. The 10s timer pauses while focus is inside the toast (`onFocus`/`onBlur`
   with `relatedTarget` check) so the toast cannot vanish under the user's
   focus; it resumes when focus leaves.
4. After **Undo**: dashboard focuses the restored row's Open button
   (`copy-<id>-open` / `doc-<id>-open`, ids from R645); jobs focuses the
   restored status chip of the selected job (`track-chip-<status>`) when the
   restored entry is the one shown in the panel.

Not changed: toast markup/role, timer length, Builder's in-dialog undo bar
(already inside the copies dialog focus scope — measured separately below).

## Acceptance (1280 + 375)

- After Stop tracking / Delete via keyboard, `document.activeElement` is the
  Undo button, `:focus-visible` true; toast persists while focused.
- Enter on Undo restores the entry/copy/doc and focus lands on the row's
  Open button (dashboard) / status chip (jobs).
- Cancel in any of the dialogs still returns focus to the opener.
- axe 0 violations, no horizontal overflow, 0 console errors, no AI calls,
  localStorage restored.

## Limits

- Real screen-reader listening not performed (CDP + accessibility tree only).
- Dismiss (×) still drops focus to `<body>`; low value, left as is.
