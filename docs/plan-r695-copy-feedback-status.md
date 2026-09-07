# R695 — "Copied" clipboard feedback is a button-label swap only (WCAG 4.1.3 Status Messages)

## Production evidence (index-BVZDsw52.js, `qa/r695-evidence.cjs`, 1280 + 375)

MutationObserver over `[aria-live], [role=alert], [role=status], [role=log]`, keyboard Enter on the focused button:

| surface | before | after | live-region events | button inside a live region |
| --- | --- | --- | --- | --- |
| /ats-checker result → "Copy the checker link" | `Copy the checker link` | `Link copied!` | none | no |
| /jobs → Draft follow-up email → "Copy email" | `Copy email` | `Copied` | none | no |
| /dashboard document viewer → "Copy text" | `Copy text` | `Copied` | none | no |

Same pattern by code inspection (needs a live share link, not exercised): builder Share-link dialog "Copy" → `Copied!` / `Copy failed`.
Already fine: builder "Resume downloaded" toast's "Copy checker link" sits inside a `role="status"` container, so its label change is live.

The only feedback is the accessible name of the focused button changing. Whether AT announces a name change of the focused control is
implementation-dependent (not verified here with a real screen reader); WCAG 4.1.3 asks for the status to be programmatically
determinable through role/properties without focus moving — there is no such node today. 0 console errors.

## Smallest fix

Shared `src/components/CopyStatus.tsx`:

```tsx
export function CopyStatus({ state, copied = 'Copied to clipboard.', failed = 'Copy failed.' }) {
  return (
    <span role="status" className="sr-only">
      {state === 'copied' ? copied : state === 'failed' ? failed : ''}
    </span>
  )
}
```

Always rendered (empty at rest) so the region exists before its content changes; placed next to each of the four buttons.
Button labels, click handlers, layout and the `idle/copied/failed` state machines are unchanged. The visible label already says
"Copy failed" on error; the status region repeats it (polite) rather than adding a second `role="alert"` node.

## Validation

- `npx tsc -b --noEmit`, `npx eslint src/components/CopyStatus.tsx src/pages/AtsChecker.tsx src/pages/Jobs.tsx src/pages/Dashboard.tsx src/pages/Builder.tsx`, `git diff --check`, `npm run build`, `npm run verify-dist`.
- Deploy, re-run `qa/r695-evidence.cjs` at 1280 + 375: each click yields a `role=status` characterData/childList event with the
  copied text; focus stays on the button; visible label unchanged from before; 0 console errors.

## Not verified

Real screen-reader listening; builder Share-link dialog only by identical component use.
