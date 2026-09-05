# R483 — maskable icon variants for Android adaptive masking

## Evidence (first-party, production + pixel measurement)
- Production `manifest.webmanifest` (R482) has two icons, both without `purpose` (defaults to `any`); zero `maskable` entries.
- Pixel measurement of the committed `public/icon-512.png`: 47.0% of opaque pixels (116,668 of 248,456) lie outside the maskable safe zone (circle of radius 40% of width, per W3C manifest spec §icon masks), and 42,564 opaque pixels lie outside the inscribed circle — an Android circular/squircle adaptive mask crops the rounded-card corners and edge of the artwork.
- Per the W3C spec and Chrome behavior, when no `purpose: maskable` icon exists, launchers that mask icons either crop the `any` icon or shrink it inside a white disc (legacy treatment). Chrome DevTools' manifest pane flags this.

## Fix (minimal)
1. Generate `public/icon-maskable-192.png` and `public/icon-maskable-512.png` with sharp: full-bleed white square canvas, the favicon.svg artwork rendered at 75% (glyph extents ≈51.5% of rendered size from center → fits within the 40% safe-zone radius) centered.
2. Append to `public/manifest.webmanifest` icons: the two new entries with `"purpose": "maskable"`.

Non-goals: no service worker/offline, no monochrome icon, no change to `any` icons or apple-touch-icon, no HTML changes (static templates don't reference manifest icons).

## Validation
- Local: pixel-check both maskable PNGs — all non-white pixels within the 40% safe-zone circle; tsc/eslint/build/verify-dist; dist contains both PNGs and updated manifest.
- Production QA: manifest 200 with 4 icon entries (2 any + 2 maskable), both new URLs 200 image/png correct dimensions, CDP Page.getAppManifest errors=[], regression on R482/R481 surfaces, 375 light/dark, zero console errors, byte-level storage restore, no unsafe traffic.
- Deploy caveat as usual: asset upload succeeds; Workers Routes API fails with auth code 10000 (known token-scope limitation).
