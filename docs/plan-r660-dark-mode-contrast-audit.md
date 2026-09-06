# R660 — dark-mode audit node: green "success" text fails contrast on dark backgrounds

## Why this round

R658/R659 closed the focus-obscuration findings. The R660 follow-up sweep of the
remaining R658 heuristics (`/pricing` skip link, `/ats-checker` textarea, large
comparison containers) confirmed they were all false positives of the
"focused element extends past the viewport" rule — the skip link is visibly
focused at y=8–50 and hit-testable, the textarea is fully visible at y=496–754
with `scrollY=0`. No code change was justified for them.

Every SOP-10 audit since R644 (axe-core node) has run in the default light
theme only. RezUp ships a dark theme (`honestcv.theme = 'dark'` or
`prefers-color-scheme: dark`), so R660 re-ran the R658 seven-route scrolling
axe sweep with the dark theme seeded, at 1280 and 375.

## Evidence (production, bundle `index-Dx3_79Ar.js`, dark theme, 2026-09-06)

Real axe `color-contrast` failures (serious), identical at 1280 and 375 unless
noted:

| Route | Element | fg / bg | ratio |
| --- | --- | --- | --- |
| `/pricing` (static SEO page) | 8 × `<td>` in the "Free vs paid" / plan comparison tables (`Unlimited`, `No`, `Never`, `$9.99 once`, `$9.99`, `Never invents facts …`, `Free, before paying`, `Stays in your browser`) | `#047857` (emerald-700, hard-coded in `scripts/build-seo.mjs`) on `#0d121d` | **3.41** |
| `/builder` (1280 only — preview pane hidden at 375) | ATS panel `Matched (N)` label | `text-green-700` `#008236` on card `#12161d` | **3.66** |

Everything else: `/`, `/dashboard` (1280), `/jobs`, `/documents`,
`/ats-checker`, `/samples` — 0 real violations in dark mode at both widths;
0 horizontal overflow; 0 console errors; localStorage back to baseline.

### Ruled out

- `/dashboard` at 375 dark reported two contrast failures with
  `background #ffffff` for the muted "Sales Jedi at Creative Force" link and
  the "tracked job uses another copy" button. Direct measurement
  (`elementsFromPoint` on the text glyph box, background chain) shows the
  text sits on the card (`oklch(0.2 0.015 260)`), not white — no white
  element is under any point of the glyph box. axe's `relatedNodes` for the
  finding names the white resume thumbnail
  (`div[data-resume-preview].bg-white`) as the background: the R651 40px
  hit-area padding (`py-3`, mobile only) makes the link's box reach the
  thumbnail, and axe samples the background from that overlap. Muted fg
  `#9199a5` on the card is ≈5.8:1; at 1280 (no padding) the same link passes.
  Not a defect; noted as an axe artefact of the R651 hit-area technique.
- Builder "obscured-only" findings (3) are the known sticky-header /
  scroll-step artefacts from R657/R658, unchanged.

## Fix (minimal)

1. `scripts/build-seo.mjs` (static `/pricing`): add a dark override next to
   the existing `html.dark …` rules so the highlighted plan column uses
   emerald-400 in dark mode:
   ```css
   html.dark table.cmp:not(.plans) td:nth-child(2),html.dark table.cmp.plans td:nth-child(4){color:#34d399}
   ```
   `#34d399` on `#0d121d` = 9.74:1. The `:not(.plans)` guard keeps the
   `table.cmp.plans td:nth-child(2){color:inherit}` reset intact.
2. `src/pages/Builder.tsx` ATS `Matched (N)` label and its identical Landing
   mock (`src/pages/Landing.tsx`): `text-green-700` → `text-green-700
   dark:text-green-400` (`#05df72` on `#12161d` = 10.19:1). Light mode is
   unchanged.

No layout, copy, data or behaviour change.

## Verification

- Local: `npx tsc -b`, `npx eslint` on changed files, `git diff --check`,
  `npm run build`, `node scripts/verify-dist.mjs`.
- Production after deploy: re-run the dark-theme seven-route scrolling axe
  sweep at 1280 and 375 → 0 real violations on `/pricing` and `/builder`;
  light-theme sweep unchanged (0); computed colours of the fixed cells /
  label measured directly; overflow 0; console errors 0; storage baseline.

## Not verified

- Real screen-reader listening and real-device dark-mode rendering (OLED /
  high-contrast OS settings) — axe + CDP computed colours only.
