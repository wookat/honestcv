# R522 — Back/forward (popstate) guard for unsaved document & letter edits

## Production evidence (CDP, cv.zalize.com)
- Real-click flow: /dashboard → SPA nav "Career documents" → Open → Edit → append text →
  `history.back()` (browser Back). Result: URL returned to /dashboard, the editor dialog
  unmounted silently, and storage kept only the original text — the edit was destroyed with
  zero confirmation (`stored text: Original text for R522 audit.`).
- R521's `beforeunload` listener does not apply: same-document (SPA/popstate) navigations
  never fire `beforeunload`. The R364/R333-chain styled confirms only trigger via the
  dialog's own `onOpenChange`; a route change unmounts the dialog without ever calling it.
- Same gap applies to the Builder ToolDialog (cover / resignation / interview): browser Back
  while `unsavedWork` is true discards the draft silently.

## Fix (smallest useful)
New shared hook `src/lib/useHistoryGuard.ts`:
- While `active`, push a sentinel history entry (`{ 'hcv-history-guard': true }`).
- On `popstate` (user pressed Back/Forward), re-push the sentinel and call `onBlocked()`,
  which opens the surface's existing styled confirmation.
- Cleanup removes the listener and pops the sentinel only if it is still the current entry
  (guard-state check avoids undoing a legitimate in-app navigation).

Wiring (reusing existing confirms — no new dialogs):
- `Dashboard.tsx` doc editor: `useHistoryGuard(docDirty, () => setConfirmingDocClose(true))`.
- `Builder.tsx` ToolDialog: `useHistoryGuard(unsavedWork, () => setConfirmingClose('close'))`.

## Non-goals
- No autosave, no new persistence.
- No blocking of clean-state navigation (sentinel exists only while dirty).
- Keep R521 `beforeunload` listeners (they cover hard navigations) unchanged.
- No router migration (app is BrowserRouter library mode; `useBlocker` unavailable).

## Known limitation (honest)
If the user confirms "Discard", the app stays on the current route rather than replaying the
original Back intent; their work is safe and they can press Back again. If an in-app
navigation stacks on top of the sentinel, one extra Back press may be needed later.

## Verification
- Local: `npx tsc -b`, per-file eslint, `npm run build`, `npm run verify-dist`.
- Deploy: `npx wrangler deploy` (Workers Routes auth 10000 limitation unchanged).
- Production QA (real CDP input clicks): dirty doc editor + Back → styled confirm shows,
  Keep editing preserves the edit, Discard closes honestly; clean editor + Back navigates
  normally; Builder letter draft + Back → confirm; 375px overflow check; storage cleanup.
