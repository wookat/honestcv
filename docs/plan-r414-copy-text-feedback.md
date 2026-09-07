# R414 — document viewer "Copy text" gives no feedback (success or failure)

## Production evidence (2026-08-31, cv.zalize.com)
CDP probe: open a career document in the /documents viewer and click
"Copy text" — the button label never changes and nothing else confirms
the copy (screenshot: audit-r412/r414_copytext.png). A clipboard failure
(permissions, insecure context) is silently swallowed too — the promise
result is discarded (`void navigator.clipboard.writeText(docText)`).

Every other copy affordance in the app confirms: the follow-up email
dialog (R372) flips to "Copied"/"Copy failed", the share-link dialog and
the checker-link buttons flip to "Copied!".

## Fix
Dashboard.tsx document viewer: track a `docCopied: 'copied' | 'failed' | null`
state (reset when the viewer opens or the text changes) and render the
button as "Copied" / "Copy failed" / "Copy text", following the exact
R372 follow-up pattern:

```tsx
void navigator.clipboard.writeText(docText).then(
  () => setDocCopied('copied'),
  () => setDocCopied('failed')
)
```

## Non-goals
- No toast system; label-swap matches the app's established pattern.
- No change to the other (already honest) copy buttons.
