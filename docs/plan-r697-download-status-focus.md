# R697 — Builder exports: announce "Preparing… / downloaded" and hand focus back (WCAG 4.1.3 / 2.4.3)

## Evidence (production, index-Dy36HEk7.js, `qa/r697-evidence.cjs`)

MutationObserver over every `[aria-live] / [role=alert|status|log]` node + focusin/focusout log + 100ms
`activeElement` poll, keyboard-only (`Enter` on the focused control), `honestcv.shared=1` so the
first-download email/share gates are skipped:

| path | after activation | live-region events |
| --- | --- | --- |
| Download ▾ menu → PDF (1280) | menu closes, `activeElement` → `body`, stays there through and after the download | none |
| Final check dialog → "Download anyway" | dialog closes, focus → `body`, stays there | none |
| 2xl direct "PDF" button (1600) | button becomes `disabled` while downloading → focus → `body`, stays there after it re-enables | none |

Sighted feedback is a spinner then a green ✓ for 1.8 s inside the button. For a keyboard/AT user the
whole thing is silent and focus is lost: nothing says the file was prepared or that it downloaded,
and the next Tab starts again from the top of the page. `dlError` is already `role=alert` (R692
class) — only the success/progress side is silent.

Precedent in the repo: R695 `CopyStatus` (always-mounted `role=status`, empty at rest) and R645/R650
`useFocusAfterRender` (focus after the acting control unmounts).

## Plan

`src/pages/Builder.tsx` only (+ small opt-in in `src/lib/useFocusAfterRender.ts`):

1. Always-mounted status region in the header export group (next to the Saved indicator):

   ```tsx
   <p role="status" className="sr-only">
     {downloading ? `Preparing your ${downloading.toUpperCase()}…`
      : downloaded ? `${downloaded.toUpperCase()} downloaded.` : ''}
   </p>
   ```

   `downloaded` already clears itself after 1.8 s, so the region returns to empty (same shape as
   R695/R696).

2. Focus after the download settles. `download()` records the element that had focus when it was
   called; in `finally`, after `setDownloading(null)`, it asks `useFocusAfterRender` to focus — once
   the re-enabled buttons have rendered — the first of: the opener (by id), `dl-menu`, `dl-<fmt>`.
   The direct format buttons get ids `dl-pdf|docx|txt|md`, the menu button `dl-menu`; whichever is
   hidden at the current breakpoint (`2xl:hidden` / `hidden 2xl:inline-flex`) cannot take focus and
   is skipped by the existing "first focusable wins" loop.

   The hook gets an opt-in `{ onlyIfLost: true }` so it does **not** steal focus when the first
   download opened the Share dialog (Radix focuses the dialog in a child effect that runs before
   ours). Existing callers are unchanged.

3. `if (downloading) return` guard at the top of `download()` (menu items are not disabled while a
   download runs).

4. Final-check dialog (found during production verification of 1–3): Radix restores focus to the
   element that opened the dialog — a Download menu item that no longer exists — so both "Keep
   editing" and "Download anyway" ended on `<body>`, and step 2 could not rescue it because the
   `finally` effect ran while the dialog was still animating out (focus was still inside it, so
   `onlyIfLost` correctly skipped). `DialogContent onCloseAutoFocus` now focuses `dl-menu` /
   `dl-<fmt>` itself; when the export is still running (controls disabled) it sets
   `refocusExportWhenIdle` and an effect on `downloading` finishes the job once the buttons re-enable.

No visible copy, layout, gating or export behaviour changes.

## Validation

```
npx tsc -b --noEmit
npx eslint src/pages/Builder.tsx src/lib/useFocusAfterRender.ts
git diff --check && npm run build && npm run verify-dist
```

Production (`qa/r697-verify.cjs 1280|375`, index-DWZqs8iU.js): menu → PDF, final check → Download
anyway (PDF, and TXT whose export is synchronous), direct PDF (1600) each yield
`status:Preparing your PDF…` → `status:PDF downloaded.` → empty (TXT: `TXT downloaded.` → empty —
`Preparing` never renders because both setState calls batch); `activeElement` ends on `#dl-menu`
(1280/375) or `#dl-pdf` (1600); Keep editing → `#dl-menu`; Escape on the menu still → `#dl-menu`;
Share-dialog-on-first-download keeps focus on `#free-email`; 0 console errors; storage back to
baseline.

Not verified: real screen-reader listening. Out of scope (candidates for R698): dashboard document /
saved-copy export buttons and /s/:id "Download PDF" use the same disabled-while-busy pattern.
