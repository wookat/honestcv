# R225 fix2 re-verify — chip dark-mode contrast (index-B7SrKC5-.js)

Code evidence: working-tree diff — chip class now `bg-emerald-100 … text-emerald-800` with no dark: overrides (both Builder.tsx and AtsChecker.tsx). Site's `.dark` block inverts those tokens (emerald-100 → dark, emerald-800 → light oklch(86% .1 161)), so dark mode should render light text on dark chip automatically.

## V1 Bundles
index-B7SrKC5-.js / ats-BnlIbwca.js / AtsChecker-ByuYauAX.js / Builder-I0hbdofx.js exact and live.

## V2 Dark-mode chip contrast, pixel-verified, both pages
Recreate Builder "Fixed" chip (LinkedIn delete/retype on sample) and checker "Fixed since last check" chips (weak-opener fixture scan → fixed paste rescan). Under html.dark (explicit class guard): clip-capture each chip at 6x via captureBeyondViewport with document coords; dominant text/bg pixel contrast ≥4.5:1 on BOTH chips. Fail if <4.5.

## V3 Light-mode chip still fine
Same chips in light mode: bg ≈ emerald-100 (209,250,229), text ≈ emerald-800; pixel contrast ≥4.5:1.

## V4 Cleanup
Light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"]; zero AI generation calls.

## Results (fix2 re-verify, executed on production)
- V1 PASS: index-B7SrKC5-.js / ats-BnlIbwca.js / AtsChecker-ByuYauAX.js / Builder-I0hbdofx.js all live.
- V2 PASS: dark mode (html.dark guard) chip pixels — Builder "Fixed" and checker "Fixed since last check" both render text rgb(148,230,188) on bg rgb(11,60,43) → contrast **8.44:1** (≥4.5). Inverted .dark token remap now works in the chip's favor with no dark: overrides.
- V3 PASS: light mode — text rgb(0,96,69) on bg rgb(208,250,229) → **6.70:1** on both chips.
- V4 PASS: light theme restored; localStorage exactly ["honestcv.clientId","honestcv.qa"]; zero /api/ai calls observed on the re-verify pages.
Screenshots: r225fix_dark_builder_zoom / r225fix_dark_checker_zoom / r225fix_dark_checker / r225fix_light_builder_zoom / r225fix_light_checker_zoom (in /home/ubuntu/screenshots/).
