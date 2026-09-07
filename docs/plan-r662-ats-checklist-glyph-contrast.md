# R662 — light theme: builder ATS checklist ✓/✗ glyphs (and the "no priority fixes" line) miss 4.5:1, invisibly to axe

## Why this round

R661 left the seven-route dark sweep at zero computed-contrast hits. Running the same scanner in
the light theme (`qa/r662-scan.cjs`, `THEME=light`) surfaces one family of hits that every axe
node since R644 has reported as clean: the pass/fail glyphs of the builder's ATS checklist.

## Evidence (production, bundle `index-Cves4und.js`, light theme, 1280, 2026-09-06)

`qa/r662-evidence.cjs` (fixture: example resume + Sales Jedi JD so the ATS panel renders):

- 21 glyph spans (`10 ✓`, `11 ✗`) in `src/pages/Builder.tsx`:
  `<span className={c.pass ? 'text-green-600' : 'text-red-500'}>{c.pass ? '✓' : '✗'}</span>`
- 12px, weight 400, no `aria-hidden`, the glyph is the only visual pass/fail marker on the row
  (the `— hint` text is present on failed rows only, so a passed row's state is carried by the
  glyph and its colour alone).
- Background owner is the white card `oklch(1 0 0)`:
  - `✓` `text-green-600` = `oklch(0.627 0.194 149.214)` → rgb(0,166,62) → **3.22:1**
  - `✗` `text-red-500` = `oklch(0.637 0.237 25.331)` → rgb(251,44,54) → **3.81:1**
- Why axe never reported it: `axe.run(document, { runOnly: ['color-contrast'] })` puts all 22
  glyphs in `incomplete` with _"Element content contains only non-text characters"_ (0
  violations, 1 pass). axe deliberately does not judge single-symbol text nodes, so the seven
  route sweeps (R644 → R661) were green on these by construction.
- The list also sits inside the R659 preview scroller (`lg:max-h-[calc(100vh-6rem)]`,
  h=716, scrollHeight 2847): the page-scroll axe sweep only ever sees the first screen of the
  panel. The computed scanner walks every element regardless, which is how this surfaced.
- Dark theme is not affected: `text-green-600` is now on the R661 ramp (`oklch(0.78 …)`) and
  `text-red-500` rgb(251,44,54) on the dark card ≈ 4.7:1.
- Screenshot `qa/shots/r662e/01-ats-checklist-light-1280.png`.

Same-source neighbour, checked in code (not triggerable in the fixture — it renders only when
every ATS check passes): `src/pages/AtsChecker.tsx:493`
`<p className="mt-1.5 text-xs text-emerald-600">No priority fixes …</p>` — `text-emerald-600`
on the white card is `oklch(0.596 0.145 163)` ≈ rgb(0,153,102) → **3.65:1** for 12px body
text.

## Ruled out / left alone (with reasons)

- Landing ATS mock (`Landing.tsx` ≈ 540–560, `aria-hidden`): `text-emerald-600` "Detected" /
  `text-red-600` 12px on white at ≈3.65 / 4.7:1, and the mock "Score breakdown" numbers
  (`text-emerald-600|amber-600|red-600`). This is a decorative product illustration that is
  hidden from AT and repeats nothing the user must read; judged exempt as decoration for now,
  listed as a candidate rather than changed in this round.
- Builder `Check` icons `size-3.5 text-green-600` (SVG, non-text): 3.22:1 meets the 3:1
  non-text minimum (1.4.11); unchanged.
- Landing / builder keyword chip `✓ text-green-600` is `aria-hidden` and sits next to the
  keyword text on a tinted pill; R661 already measured it (light 3.08, dark 7.83). Decorative
  duplicate of the chip's meaning; unchanged.

## Fix (minimal)

```diff
- <span className={c.pass ? 'text-green-600' : 'text-red-500'}>
+ <span className={c.pass ? 'text-green-700' : 'text-red-600'}>
```

- `text-green-700` = `oklch(0.527 0.154 150.069)` → rgb(0,130,54) on white **4.95:1**
  (same token the "Matched (N)" label already uses; dark theme resolves it through the R661 ramp
  to `oklch(0.82 0.12 150)`).
- `text-red-600` = `oklch(0.577 0.245 27.325)` ≈ rgb(231,0,11) on white **≈4.7:1**; dark
  theme already remaps `--color-red-600` to `oklch(0.78 0.16 24)`.

```diff
- <p className="mt-1.5 text-xs text-emerald-600">
+ <p className="mt-1.5 text-xs text-emerald-700">
```

- `text-emerald-700` = `oklch(0.508 0.118 165.612)` → rgb(0,122,85) on white **5.3:1** (the
  value R661 measured behind the "Best value" badge); dark remaps to `oklch(0.82 0.12 162)`.

No layout, copy, or data changes; no `dark:` variants needed.

## Verification

- Production, light + dark, 1280 (the ATS panel is in the hidden preview pane at 375; the
  tokens are theme-level and identical there): ratios of a `✓` and a `✗` glyph, count of glyph
  spans unchanged (21), no `aria-hidden` added.
- Seven-route computed scanner in light (`qa/r662-scan.cjs THEME=light`) reports zero hits
  outside `aria-hidden` mocks; dark remains zero.
- Scrolling axe 1280/375 unchanged (0 real), no overflow, 0 console errors, storage restored.
- `npx tsc -b`, `npx eslint` on changed files, `git diff --check`, `npm run build`,
  `node scripts/verify-dist.mjs`.

## Limitations

- The AtsChecker "No priority fixes" line is verified by token arithmetic, not by rendering
  (needs a resume where every check passes).
- Method note for SOP-10: axe's `incomplete` bucket must be read for `color-contrast` when a UI
  uses symbol-only status glyphs; and anything inside the R659 preview scroller is only covered
  by the computed scanner, not by the page-scroll axe sweep.
