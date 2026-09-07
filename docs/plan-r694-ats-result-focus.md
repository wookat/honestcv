# R694 — /ats-checker: the report appears silently; "Re-check now" drops focus to body

## Evidence (production index-CxxlgsAW.js, `qa/r694-evidence.cjs 1280|375`)

MutationObserver over `[aria-live], [role=alert], [role=status], [role=log]`, activeElement and
result-card geometry recorded around each click.

| step | 1280×812 | 375×812 |
| --- | --- | --- |
| fill resume + JD, click **Check my ATS score** | card renders at top 728 (84px of it visible), focus stays on the button, live log **empty**, card has no `role`/name | card top 492, focus stays on the button, live log **empty** |
| edit JD → stale banner → click **Re-check now** | banner unmounts with the button inside it → `activeElement = body`, live log **empty** | same |

Nothing tells a screen-reader user the check finished or what the score is (WCAG 4.1.3 — a
status message that follows the user's own action with no focus change); after "Re-check now"
the keyboard user is dropped at the top of the document (WCAG 2.4.3). The `role="status"`
that exists on the page is the *stale* banner, not the result. 0 console errors.

## Fix (smallest)

`src/pages/AtsChecker.tsx`

- `const focusAfterRender = useFocusAfterRender()` (existing R645 helper).
- Every explicit scan (`Check my ATS score`, `See an example score first`, `Re-check now`)
  calls `setScan(...)` **and** `focusAfterRender('ats-result-heading')`.
- Result heading: `<h2 id="ats-result-heading" tabIndex={-1} className="… outline-none">`
  with an `sr-only` suffix `— {score} out of 100` so the focus announcement carries the
  score (the visible score stays in `ScoreRing`, which is `role="img"`).

Not changed: scoring, stale logic, restoring a checked draft on load (no focus move on mount —
only the three click paths call the setter), copy/layout.

## Local

`npx tsc -b --noEmit` · `npx eslint src/pages/AtsChecker.tsx` · `git diff --check` ·
`npm run build` · `npm run verify-dist`.

## Production QA (1280 + 375)

Same script: after each of the three clicks `activeElement` is the `h2#ats-result-heading`,
its accessible text includes the score, the card top is ≥ header height and < viewport height
(scroll-padding from R658), 0 console errors. Page load with a stored checked draft keeps
focus on `body` (no unsolicited focus move).

## Limitations

No real screen-reader listening; VoiceOver/NVDA heading-focus announcement inferred from the
focus-management pattern. Touch/real device not exercised.
