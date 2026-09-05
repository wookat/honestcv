# R390 — first-download share promo becomes a non-blocking bar

## Evidence (source, first-hand)
- `src/pages/Builder.tsx` `download()`: on a free-mode user's very first download the flow is
  `FreeDownloadDialog` (email gate, `honestcv.shared` unset) → file downloads → `setShareOpen(true)`
  opens a **modal** promo dialog ("Resume downloaded — good luck out there", share-the-checker CTA).
- So the first download always stacks two modals back to back, and the promo modal steals focus and
  blocks the workspace at the exact moment the user wants to verify the file they just exported.
  Banked as "导出双弹层摩擦" in the R378 SOP-10 audit; R369 confirmed it is one-time
  (`honestcv.shared` gates it) but the friction is in the *blocking*, not the frequency.
- Precedent in-app: non-blocking floating status bars already exist (cross-tab update bar, delete
  undo bar — R321/R342), keyboard-reachable and dismissible.

## Fix (minimal)
Keep the one-time trigger and the exact same actions; change only the container:
- Replace the `shareOpen` `<Dialog>` with a floating `role="status"` bar (same styling as the
  cross-tab update bar: fixed inset-x-4 bottom, border, shadow, flex-wrap so 375px fits).
- Content: short "Resume downloaded — if RezUp helped, pass the free ATS checker to a friend." +
  Copy checker link / Share on X / Share on LinkedIn buttons + dismiss X.
- Trigger unchanged: first successful download sets `honestcv.shared` and shows the bar once.

## Non-goals
- No change to the FreeDownloadDialog email gate, quota, or `honestcv.shared` semantics.
- No change to download logic, filenames, or the final-check dialog.
