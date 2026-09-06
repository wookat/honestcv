# R665 — builder Health dialog: dimension scores, plain-English explainers and "No priority fixes" meet 4.5:1 in the light theme

## Evidence (production `index-DHP4Xevh.js`, 2026-09-06)

R665 extended the SOP-10 sweep to **dialogs**, which no previous audit node had opened:
`qa/r665-dialogs.cjs` opens Resume settings / Start a new resume / LinkedIn import / sample
preview / letter example (dashboard) and Copies / Edit history / Keyboard shortcuts / Full health
report (builder), then runs axe + the computed contrast scan inside each, light/dark × 375/1280.
`qa/r665-health.cjs` measures every score / summary / explainer inside the Health dialog with an
alpha-aware foreground.

- 8 of 9 dialogs: axe real 0, computed scan 0, no viewport overflow, focus inside the dialog,
  0 console errors (Keyboard shortcuts is desktop-only by design, `hidden … lg:inline-flex`).
- **Health dialog, light theme** (`HealthDialog`, `src/pages/Builder.tsx`):
  - dimension scores `span.tnum.text-xs.font-semibold`, 12px/600 (normal text, needs 4.5):
    `text-amber-600` **3.11** (axe `color-contrast` serious), `text-emerald-600` **3.56** ×7
    (axe did not report these — see below). `text-red-600` = 4.77, fine.
  - plain-English explainer `p.text-muted-foreground/80.mt-1.text-xs.italic` (R129 `d.plain`),
    12px/400: **3.57** ×8. Foreground is `oklab(… / 0.8)`; composited over `bg-background`
    (#fbfcfd) it lands at ≈#818790.
  - "No priority fixes — every check passes…" `p.text-xs.text-emerald-600`: not rendered by
    the example (it has fixes); same token as the scores → 3.56 by computation. This is the
    builder twin of the AtsChecker line R662 already moved to `text-emerald-700`.
- **Dark theme**: every one of the same elements passes — scores 11.09 / 10.25 (the `.dark`
  palette remaps amber/emerald), explainer 4.64. Dark is unchanged by this round.
- Dialog geometry (both themes, both widths): top 41 / bottom 771 of 812, no viewport
  overflow; the `DialogContent` itself is the scroller (`overflow-y: auto`, scrollHeight
  2396@375 / 1736@1280 vs clientHeight 729) and contains focusable buttons, so no
  `scrollable-region-focusable` issue.

## Why earlier audits missed it (method findings, folded into SOP-10)

1. **axe only reports what is in view inside a scrolling dialog.** At 375 it flagged only the
   "75" score (in view) — the first explainer sits at y=857 and was skipped; at 1280 the first
   explainer is in view (y=605) and axe reported it. The other 7 scores/explainers below the
   fold were never reported at either width. The dialog sweep must scroll the dialog content,
   not just the page (R655's page-scroll accumulation does not reach it).
2. **The R661/R662 computed scanner dropped foreground alpha** (`px4(cs.color).slice(0,3)`), so
   `text-muted-foreground/80` was scored as full `text-muted-foreground` (5.38) and passed.
   Fixed in `qa/r665-health.cjs` (composite fg over the resolved bg). Repo-wide, the only
   other alpha foregrounds are the drag handles `text-muted-foreground/60` (icon-only,
   `aria-hidden`, hover → `text-foreground`), AtsChecker `text-foreground/70` (14px weight
   text) and a Jobs `text-foreground/80` heading (12px/600 uppercase). `--foreground` is near
   black, so 70–80% over a light card stays far above 4.5 by computation, but neither was
   re-measured with the alpha-aware scanner this round — listed as an R666 candidate.
3. The emerald 3.56 scores are ordinary `color-contrast` violations, not an axe exemption: axe
   reported only the amber node because the emerald nodes were all below the dialog fold
   (finding 1). The computed scan is what surfaced them.

## Judgement

Real defect, light theme only, 17 rendered text nodes per open (8 scores + 8 explainers +
the all-pass line when it applies). Same class of fix as R662/R663: move to the next palette
step / drop the alpha; no layout or copy change. Colour semantics (green = good, amber = fair,
red = poor) are preserved and the numbers still carry the score as text.

## Ruled out

- `text-red-600` scores (4.77) — pass, unchanged.
- Final-check dialog `⚠` glyph `text-amber-600` (line ~10193): decorative — every row is an
  issue and the row text carries the meaning; the glyph is not the only state indicator (unlike
  R662's ✓/✗). Unchanged.
- Download-success `Check` icons `text-emerald-600` (`animate-pop`) — icons, transient, paired
  with the button label. Unchanged.
- `Check aria-hidden … text-emerald-600` in the completeness list (line ~2688) — `aria-hidden`
  icon paired with visible label text. Unchanged.

## Fix

`src/pages/Builder.tsx`, `HealthDialog` only:

```diff
- <p className="mt-1.5 text-xs text-emerald-600">
+ <p className="mt-1.5 text-xs text-emerald-700">
    No priority fixes — every check passes and all dimensions score 80+.

  className={`tnum text-xs font-semibold ${
    d.score >= 80
-     ? 'text-emerald-600'
+     ? 'text-emerald-700'
      : d.score >= 50
-       ? 'text-amber-600'
+       ? 'text-amber-700'
        : 'text-red-600'
  }`}

- <p className="text-muted-foreground/80 mt-1 text-xs italic">{d.plain}</p>
+ <p className="text-muted-foreground mt-1 text-xs italic">{d.plain}</p>
```

Expected light-theme ratios (same tokens R663 measured on `bg-background`): emerald-700 ≈ 5.0,
amber-700 ≈ 5.36, `text-muted-foreground` 5.38. Dark: R663 measured emerald-700 10.87 in the
dark remap; amber-700 and the explainer are re-measured after deploy.

## Verification

- `qa/r665-health.cjs` light/dark × 375/1280 on the deployed bundle: every measured node ≥ 4.5,
  dialog geometry unchanged (top 41 / bottom 771, same scrollHeight), 0 console errors,
  `honestcv.*` restored.
- `qa/r665-dialogs.cjs` light 375 + 1280 with `ONLY=health`: axe real 0 (was 1 / 2).
- `npx tsc -b`, `npx eslint src/pages/Builder.tsx`, `git diff --check`, `npm run build`,
  `node scripts/verify-dist.mjs`.

## Limitations

- "No priority fixes" still only token-verified (the example fixture has fixes); the token is
  the one R662 measured at 5.3 on the same background in AtsChecker.
- Italic 12px explainers move from 80% to 100% muted — slightly less visual hierarchy against
  the `d.summary` line above; the italic style still distinguishes them.
- No real screen-reader listening or real-device testing.
