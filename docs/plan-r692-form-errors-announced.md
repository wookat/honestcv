# R692 — email / license / file-upload errors are visual only: nothing is announced, the field is not marked invalid, Enter does not submit (WCAG 3.3.1, 4.1.3)

## Evidence (`qa/r692-evidence.cjs 1280|375`, production `index-CDfcCDdV.js`)

A `MutationObserver` records every change inside `[aria-live], [role=alert], [role=status], [role=log]` — i.e. everything a screen reader would be told without moving focus. Three production surfaces were driven:

| surface | action | visible result | `role` / `aria-live` on the error | `aria-invalid` / `aria-describedby` on the field | live-region announcements | focus afterwards |
| --- | --- | --- | --- | --- | --- | --- |
| builder → Download → "Downloads are free during the beta" (`FreeDownloadDialog`) | type `not-an-email`, press **Enter** in the field | nothing (no error, no request) | — | — | none | field |
| same | click "Unlock downloads" with bad / empty email | red "Please enter a valid email address." | `null` / `null` | `null` / `null` | **none** | stays on the button |
| /ats-checker → Upload PDF / DOCX with a `.png` | file chooser | red "Unsupported file type — please upload a PDF, DOCX or TXT file." | `null` / `null` | `#resume-text`: `null` / `null` | **none** | `body` |
| /dashboard → Import a resume with a `.png` | file chooser | same red text under the drop zone | `null` / `null` | — | **none** | `body` |

Identical at 1280 and 375. Zero console errors.

What this means for a screen-reader user: they press "Unlock downloads" (focus stays on the button, which is unchanged), hear nothing, and have no way to know the submit failed unless they wander back through the dialog. After a file chooser closes, focus is on `body` and the error under the drop zone is silent. For a keyboard user, Enter in the only text field of the dialog does nothing — the three Paywall forms are `<div>`s, not `<form>`s.

The same code shape (`{error && <p className="text-destructive …">{error}</p>}` next to an `<Input>` with no `aria-invalid`) exists in `LeadDialog`, `FreeDownloadDialog`, `ActivateForm` and `BuyButton` (`src/components/Paywall.tsx`), `AtsChecker` `fileError`, and Dashboard `importError` / `docImportError`. `rg aria-invalid src` → 0 hits in the whole app. The repo's own convention elsewhere is `role="alert"` (`dlError`, `workspaceError`, `versionsUnreadable`, `docsUnreadable`, `docLinkNotFound` in Dashboard) — these seven are the exceptions.

WCAG mapping: 3.3.1 Error Identification (the item in error must be identified — `aria-invalid` + `aria-describedby`), 4.1.3 Status Messages (a message that does not receive focus must be exposed through a role so AT announces it — `role="alert"`). axe reports neither: it has no rule for "an error appeared and no live region changed".

## Fix

`src/components/Paywall.tsx` — the three forms become real forms and their error paragraph is an alert tied to the field:

```tsx
// LeadDialog / FreeDownloadDialog / ActivateForm (same shape ×3)
const errorId = useId()
<form
  className="space-y-2"
  onSubmit={(e) => { e.preventDefault(); void submit() }}   // Enter in the field submits
>
  <Label htmlFor="free-email">…</Label>
  <div className="flex flex-col gap-2 sm:flex-row">
    <Input id="free-email" … aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} />
    <Button type="submit" disabled={busy} …>…</Button>        // was onClick={() => void submit()}
  </div>
  {error && <p id={errorId} role="alert" className="text-destructive text-sm">{error}</p>}
  …
</form>
```

`BuyButton`'s checkout error, `AtsChecker` `fileError`, Dashboard `importError` / `docImportError`: add `role="alert"` (file inputs are hidden and have no text field to mark invalid; the alert is what the user needs after the chooser closes). `AtsChecker` additionally points the textarea at the error via `aria-describedby` while it is shown, since the textarea is the field the upload fills.

Not changed: text, colours, layout (`<div className="space-y-2">` → `<form className="space-y-2">` is layout-neutral — `form` is block like `div`), the `Input` component (it has no `aria-invalid:` styling, so marking the field invalid adds no pixels), submit validation, the `busy` guard, dialog open/close behaviour. `role="alert"` on an element that is conditionally rendered is announced when it mounts — no `aria-live` container needed, and it matches the five existing Dashboard alerts.

## Local gates

`npx tsc -b --noEmit`, `npx eslint src/components/Paywall.tsx src/pages/AtsChecker.tsx src/pages/Dashboard.tsx`, `git diff --check`, `npm run build`, `npm run verify-dist`.

## Production QA (`qa/r692-evidence.cjs 1280|375`, after deploy, check the loaded bundle hash)

1. Free-download dialog: Enter in the field with a bad email → error appears (form submit works), `role=alert`, `id` set, `#free-email` has `aria-invalid="true"` and `aria-describedby` = that id, live log records `added: alert "Please enter a valid email address."`.
2. Click submit with bad / empty email → same; focus stays on the button (unchanged behaviour), announcement recorded.
3. Clearing the field does not clear the error (unchanged — error clears on the next submit), so `aria-invalid` stays `true` until then.
4. /ats-checker `.png` → alert recorded, `#resume-text` `aria-describedby` → error id.
5. /dashboard `.png` import → alert recorded.
6. Geometry: dialog height and error paragraph rect identical to pre-fix screenshots at 1280 and 375; zero console errors; `honestcv.subscribed` not left behind.

## Limitations

The live-region log proves the DOM exposes the message the way AT expects; no real screen reader was listened to. Real-device touch and Windows High Contrast are unchanged by this round (no CSS touched).
