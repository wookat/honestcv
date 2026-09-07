# R661 — dark theme: `green-*` utilities are not remapped, and the "Best value" badge inverts

## Why this round

R660 fixed the two dark-theme contrast failures axe reported. R661 re-ran the seven-route dark
sweep with a computed-contrast scanner that resolves alpha/oklch backgrounds itself (axe skips
elements whose background it cannot resolve and ignores `aria-hidden` glyphs), then confirmed
each candidate directly in the rendered DOM before deciding anything.

## Evidence (production, bundle `index-DxwM4NBG.js`, dark theme, 2026-09-06)

1. **Landing pricing "Best value" badge** (`src/pages/Landing.tsx`,
   `<Badge className="bg-emerald-700 text-white">`): the `.dark` advisory palette remaps
   `--color-emerald-700` to `oklch(0.82 0.12 162)` (a _light_ mint meant for text on dark
   panels), so the badge paints white text on a light-mint pill. Direct inspection: element rect
   `967,420 81×23`, `elementsFromPoint` hits the badge itself, background chain is
   `SPAN oklch(0.82 0.12 162)` → card `oklch(0.145 0 0)`; no `aria-hidden`/`role`, i.e. real
   text. Ratio **1.67:1**. Screenshot `qa/shots/r661s/01-landing-bestvalue-dark-1280.png`.
2. **`green-*` utilities are not in the dark advisory palette at all.** The remap covers
   amber/emerald/red/blue only, so every `bg-green-50` / `border-green-200` /
   `text-green-600|700|800` surface keeps its light-theme value on dark:
   - Landing ATS mock + Builder ATS matched-keyword chips
     (`bg-green-50 text-green-800` with a `✓ text-green-600` glyph): render as bright
     light-green pills on the dark card (`bg oklch(0.982 0.018 155.826)`), visually foreign
     next to the remapped emerald "Free during beta" chip; the glyph measures **3.08:1**.
     Screenshot `qa/shots/r661s/03-builder-ats-chips-dark-1280.png`.
   - `src/components/Paywall.tsx` success panels (`border-green-200 bg-green-50` +
     inherited foreground): "License activated — …", "Payment confirmed — …", waitlist
     "Got it! …". With all billing/license requests intercepted in the browser
     (`/api/billing/status` → `freeMode:false`, `/api/license/activate` → canned token; no
     request left the page, storage restored afterwards), the activated panel measured
     foreground `oklch(0.93 0.01 260)` on `oklch(0.982 0.018 155.826)` = **1.17:1** — the
     text is invisible. Screenshot `qa/shots/r661p/02-license-activated-dark-1280.png`.
     These panels are latent today (production runs in free mode) but become the very first
     thing a paying user sees once billing opens.
   - 14 `<Check className="size-3.5 text-green-600" />` "saved" icons in Builder: light
     `green-600` on the dark card passes (~5:1) but is the only green that does not follow the
     palette.

### Ruled out

- Builder "obscured-only" axe findings (3): sticky header / scroll-step artefacts (R658/R660).
- `/dashboard` 375px dark axe contrast findings: axe samples the white resume thumbnail under
  the R651 hit-area padding (R660 analysis, unchanged).
- Landing "Matched (4)" / Builder "Matched (N)": pass at ≈10.2:1 after R660.

## Fix (minimal)

1. `src/index.css` `.dark`: add the `green` steps to the advisory palette using the same
   lightness ladder as emerald, hue ≈150 so the remapped pills stay visibly "green" (not the
   emerald teal used for the beta chip):
   `--color-green-50/100/200/300` → `oklch(0.27|0.32|0.39|0.47 …150)`,
   `--color-green-600/700/800/900` → `oklch(0.78|0.82|0.86|0.9 …150)`.
   This converts the ATS chips, the Paywall success panels and the Check icons in one place,
   the way amber/emerald/red/blue already work. No resume/template colour uses `green-*`.
2. `src/pages/Landing.tsx` "Best value" badge: keep `bg-emerald-700 text-white` for light and
   add `dark:text-emerald-950` so the text is dark ink on the remapped mint pill
   (`oklch(0.262 0.051 172.552)` on `oklch(0.82 0.12 162)` ≈ 8.8:1).
3. Drop the R660 `dark:text-green-400` overrides on the two "Matched" labels: with
   `green-700` now in the palette (`oklch(0.82 0.12 150)`, ≈9.6:1 on the card) the special case
   is redundant and every green text follows a single mechanism.

Light theme is untouched (the palette lives under `.dark`; the badge change is a `dark:`
variant). No data-model, layout or copy change. `scripts/build-seo.mjs` (static /pricing) is
unaffected — it has its own R660 rule.

## Verification

- Production, dark, 1280 + 375: Landing "Best value" computed fg/bg and ratio ≥ 4.5;
  Landing + Builder matched chips `bg`/`color`/`✓` computed values and ratios ≥ 4.5 (glyph ≥ 3);
  Builder "Matched (N)" ratio ≥ 4.5; Paywall activated panel (stubbed network as above)
  ratio ≥ 4.5.
- Light regression: same elements keep their light values (`rgb(240,253,244)` chip bg,
  `oklch(0.448 0.119 151.328)` chip text, badge white on `#047857`-class emerald).
- Seven-route scrolling axe dark sweep 1280/375: 0 real violations; overflow none; console 0;
  storage back to baseline; bundle name printed.

## Not verified

- Real screen-reader listening; real-device rendering (CDP emulation only).
- Payment-confirmed and waitlist panels were not driven end-to-end (they share the exact
  `border-green-200 bg-green-50` classes with the activated panel, which was measured).
