# R664 — text-only scroll regions are keyboard-focusable and named (ATS JD highlight, letter preview)

## Evidence (production `index-C_rL1zCr.js`, 2026-09-06)

The 7-route SOP-10 sweep has never rendered the `/ats-checker` **result** state (the fixture
only loads the empty form). R664 first closed that coverage gap: `qa/r664-ats.cjs` clicks
"See an example score first" and then runs the scrolling axe sweep + computed contrast scan,
light + dark × 1280/375.

- Contrast: 0 computed-scan hits, 0 axe `color-contrast` violations in all four combinations
  (R662's "No priority fixes" state is still not rendered by the example — the example has
  fixes — so it stays token-verified only).
- axe **real violation at 375 (light and dark)**, `scrollable-region-focusable` (serious):
  `div.bg-muted/40.mt-2.max-h-56.overflow-y-auto` — the "Job description with keywords
  highlighted" box. `qa/r664-evidence.cjs`: at 375 it scrolls (scrollHeight 304 > clientHeight
  222), `tabIndex -1`, 0 focusable descendants. At 1280 the same box does not overflow
  (184/184), which is why the desktop sweeps never saw it.
- Same pattern on `/dashboard` → Letter examples → any example (dialog): `LetterPreview`'s
  `overflow-y-auto` box (`maxHeight: 55vh`) scrolls at 375 (716 > 445), `tabIndex -1`, 0
  focusable descendants; the dialog's only focusables are Close ×2 / Use this example. The same
  component renders the document editor's Preview view. Not overflowing at 1280 (394/394).
- What actually happens in the audit browser (Chrome 137, `qa/r664-probe2.cjs`): Tab does reach
  the ATS box (11th stop, `activeElement === box`, `:focus-visible`, UA `outline: auto 1px`) and
  ArrowDown scrolls it (scrollTop 0 → 80). This is Chrome's default "keyboard-focusable
  scrollers" behaviour for scroll containers with no focusable content; I believe it is not
  implemented in Safari/WebKit (inference, not measured here — no WebKit on this box), where
  the text below the fold is unreachable without a pointer (WCAG 2.1.1). Either way the region
  has no name, so AT users landing on it hear only the first line of raw text.

## Judgement

Real gap, browser-dependent severity: functional 2.1.1 fail on engines without focusable
scrollers, naming gap everywhere, and a real axe violation the SOP-10 gate would flag as soon
as the result state is part of the fixture. The repo already has the convention for exactly
this case — Landing's pricing comparison table:

```tsx
<div className="mt-12 overflow-x-auto" tabIndex={0} role="region" aria-label="Pricing comparison …">
```

## Ruled out

- Builder "Resume copies" `ul.max-h-64.overflow-y-auto`, Jobs list/detail `max-h-[70vh]`
  panes, the example dialog's outer `min-h-0 flex-1 overflow-y-auto` wrapper: all contain
  focusable content (buttons / the now-focusable preview), so axe passes and keyboard users
  can scroll by tabbing through. Unchanged.
- `AssistantPanel` message scroller: needs a real AI conversation to overflow; not exercised
  (zero AI quota rule). Left as a candidate.
- The nested double scroller in the example dialog at 375 (outer scrolls 19px, inner 271px)
  is awkward but not an a11y failure once the inner is focusable; not in this round.

## Fix

`src/pages/AtsChecker.tsx` (JD highlight box):

```diff
- <div className="bg-muted/40 mt-2 max-h-56 overflow-y-auto rounded-md border p-3 text-sm whitespace-pre-wrap">
+ <div
+   className="bg-muted/40 mt-2 max-h-56 overflow-y-auto rounded-md border p-3 text-sm whitespace-pre-wrap"
+   tabIndex={0}
+   role="region"
+   aria-label="Job description with keywords highlighted"
+ >
```

`src/pages/Dashboard.tsx` (`LetterPreview` root):

```diff
  <div
    className={`overflow-y-auto rounded-md border bg-white … ${tpl.serif ? 'font-serif' : 'font-sans'}`}
    style={{ maxHeight: '55vh' }}
+   tabIndex={0}
+   role="region"
+   aria-label={`${doc.title} preview`}
  >
```

No layout, copy or colour change. Focus ring is the same UA/`:focus-visible` treatment the
Landing table region already gets.

## Verification

- `qa/r664-ats.cjs` light/dark × 1280/375: axe real 0 (was 1 at 375), contrast scan 0, no
  overflow, 0 console errors, `honestcv.atsDraft` restored.
- `qa/r664-evidence.cjs` 375: both boxes `tabIndex 0`, `role=region`, named; Tab reaches them,
  ArrowDown scrolls; at 1280 they are extra Tab stops (one each) with no other change.
- `npx tsc -b`, eslint on the two files, `git diff --check`, `npm run build`,
  `node scripts/verify-dist.mjs`.

## Limitations

- WebKit behaviour is inferred from the spec/implementation status, not measured here.
- No real screen-reader listening; the region name is verified as a DOM attribute only.
- One extra Tab stop on desktop even when the box does not overflow (same trade-off the pricing
  table already makes).
