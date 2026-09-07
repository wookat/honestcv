# R693 — the errors R692 did not reach: landing hero drop, builder Import dialog, builder photo upload (WCAG 3.3.1 / 4.1.3)

## Production evidence (index-DFnmvdKb.js, `qa/r693-evidence.cjs 1280|375`)

Same instrument as R692: a `MutationObserver` logging every addition / text change inside
`[aria-live], [role=alert], [role=status], [role=log]` — i.e. everything a screen reader is told
without moving focus.

| surface | action | visible | `role` | tied to control | live log | focus after |
| --- | --- | --- | --- | --- | --- | --- |
| `/` hero drop zone (`HeroResumeDrop`) | upload `.png` | red "Unsupported file type…" `<p>` | `null` | drop-zone `<button>` has no `aria-describedby` | **none** | `body` |
| `/builder` → "Import resume (PDF/DOCX/text)" | upload `.png` | red "Unsupported file type…" `<p>` | `null` | textarea has no `aria-describedby` | **none** | `body` |
| same dialog, "Share link or share ID" | type `ab`, **Enter** | nothing (raw `<input>`, no form) | — | — | none | input |
| same | type `not a share id!` → button enabled → click | red "Paste a Resume Center share link or share ID." | `null` | input has no `aria-invalid` / `aria-describedby` | **none** | button |
| `/builder` Personal details → "Add photo (optional)" | upload a broken image | red "Could not read that image…" `<span>` | `null` | photo button has no `aria-describedby` | **none** | `body` |

1280 and 375 identical; 0 console errors. Direct evidence, not inference.

Same code shape, not reproducible in production without spending AI calls (inferred only):
`BundleToolDialog` (`error`, `feedbackError`), `TailorDialog` (`error`), `KeywordBulletDialog`
(`error`), `AssistantPanel` (`error`) — all `{error && <p className="text-destructive …">{error}</p>}`.

After R692 these are the last `text-destructive` error paragraphs in `src/` without `role="alert"`
(`rg -n "error && <p|Error && <p|Error && <span" src` → 9 hits, all listed above).

## Classification

Same as R692: WCAG 4.1.3 Status Messages (error appears, nothing is announced) and 3.3.1 Error
Identification (the failing control is not marked). The file-chooser cases are the harsher ones —
after the native chooser closes, focus is on `body`, so even a user who re-reads the current element
hears nothing. The share-id row also has an interaction gap: Enter in the only text field does
nothing (no `<form>`), and the button's `disabled={!rcInput.trim()}` does not reflect the actual
validation (`parseShareId`), so an invalid value enables the button and then errors.

## Fix (smallest)

- `src/pages/Landing.tsx` `HeroResumeDrop`: `const errorId = useId()`; error `<p id={errorId} role="alert">`;
  drop-zone `<button aria-describedby={error ? errorId : undefined}>`.
- `src/pages/Builder.tsx`
  - Import dialog: error `<p id="import-error" role="alert">`; paste textarea
    `aria-describedby={importError ? 'import-error' : undefined}`; the share-id row becomes
    `<form noValidate onSubmit={e => { e.preventDefault(); importFromResumeCenter() }}>` with the
    existing click handler hoisted into `importFromResumeCenter`, the button `type="submit"`, the
    input `aria-invalid={importError ? true : undefined} aria-describedby={importError ? 'import-error' : undefined}`.
    The `disabled={rcBusy || !rcInput.trim()}` guard stays; Enter on an empty field does nothing,
    as before (the submit handler early-returns on the same condition).
  - Photo: `<span id="photo-error" role="alert">`; "Add photo" button `aria-describedby={photoError ? 'photo-error' : undefined}`.
  - `BundleToolDialog` ×2, `TailorDialog`, `KeywordBulletDialog`: `role="alert"` on the error `<p>`.
- `src/components/AssistantPanel.tsx`: `role="alert"` on the error `<p>`.

Unchanged: copy, colours, layout (the share-id row keeps `flex flex-wrap items-center gap-2` on the
`<form>`; `<div>`→`<form>` is block→block), validation, busy guards, dialog behaviour.

## Local

`npx tsc -b --noEmit` · `npx eslint src/pages/Landing.tsx src/pages/Builder.tsx src/components/AssistantPanel.tsx` ·
`git diff --check` · `npm run build` · `npm run verify-dist`.

## Production QA (1280 + 375, `qa/r693-evidence.cjs`)

- landing `.png` → error `role=alert` + id, live log `added: alert "Unsupported…"`, drop-zone button `aria-describedby` = id.
- builder Import `.png` → alert logged, textarea `aria-describedby=import-error`.
- share id `ab` + Enter → alert logged ("Paste a Resume Center…" — `ab` is < 4 chars so `parseShareId` rejects it), input `aria-invalid=true` + `aria-describedby`, focus stays in the input.
- share id invalid + click → same, focus stays on the button.
- photo broken image → alert logged, button `aria-describedby=photo-error`.
- 0 console errors; `honestcv.subscribed` not left behind.

## Not verified

Real screen-reader listening; the five AI-dialog errors (same shape, inferred); repeated identical
error text is not re-announced (alert already mounted — same caveat as R692); `Enter` on the share-id
input with a *valid* id triggers the network import (not exercised — would hit Resume Center).
