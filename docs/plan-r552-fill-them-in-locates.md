# R552 — Dashboard "Fill them in" lands on the first placeholder

## First-hand production evidence (CDP, cv.zalize.com)
- Seeded resume (Ava Chen / Acme / ongoing Globex) → /documents → Software Engineer cover
  letter example → Use this example → PDF → warning dialog → "Fill them in".
- Result: viewer opens in Edit view, but textarea selection is `{start:0,end:0}` and it is
  not focused — the user must find the placeholder themselves or press "Next placeholder".
- Same flow in Builder (?doc=cover → Start from a template → PDF → Fill them in) already
  selects the first placeholder: `{start:314,end:361,seltext:"[second relevant achievement
  or responsibility]"}` via `requestAnimationFrame(jumpToNextPlaceholder)` (R507).

## Root cause
Dashboard's warning-dialog "Fill them in" handler only opens the viewer in edit view
(`setOpenDoc/setDocText/setDocView('edit')`); it never invokes the existing
`jumpToNextPlaceholder` locator (R505). The button label promises filling; the landing
does not deliver the location.

## Fix (Dashboard.tsx only)
In the "Fill them in" onClick, after opening the editor, retry the existing
`jumpToNextPlaceholder` on animation frames until the textarea mounts (the viewer dialog
may not be open yet when triggered from the documents list), bounded to ~20 frames:

```ts
const tryJump = (left: number) => {
  if (docTextRef.current) jumpToNextPlaceholder()
  else if (left > 0) requestAnimationFrame(() => tryJump(left - 1))
}
requestAnimationFrame(() => tryJump(20))
```

## Non-goals
- No change to Builder's dialog, the locator itself, placeholder counting, warnings,
  exports, or R504/R505/R507/R550/R551 semantics.

## Verification
- Local: tsc, eslint (Dashboard.tsx), build, verify-dist.
- Production QA (1280×900 + 375×812): list-path and viewer-path "Fill them in" both land
  with the first placeholder selected and centered; "Next placeholder" button unchanged;
  zero overflow, zero console errors; QA storage cleaned to baseline.
