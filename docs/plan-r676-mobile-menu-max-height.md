# R676 — Mobile header menu taller than the viewport: its last links cannot be reached (SPA + static pages)

## Evidence (production, 2026-09-06, `qa/r676-mobile-menu.cjs`)

Open the header "Menu" button on `/`, `/builder`, `/dashboard` (SPA, `Layout.tsx`) and `/templates/`
(prerendered, `build-seo.mjs` `details.mnav`), then measure the last link ("About").

| viewport | page | menu bottom | last link | visible on open | after scrolling to document end |
|---|---|---|---|---|---|
| 375×667 (iPhone SE/8 CSS viewport, portrait) | `/` `/builder` `/dashboard` | 729 | 681–721 | no | only when `scrollY` = document end (16 443 px on `/`) |
| 375×667 | `/templates/` | 683 | 638–678 | no | never (panel is `position:absolute`, header stays at 0) |
| 667×375 (landscape) | SPA routes | 729 (+spacing 755) | 681–721 | no | only at document end; `/builder` still not hit-testable there |
| 667×375 | `/templates/` | 683 (+spacing 704) | 638–678 | no | never |

Why: the SPA menu is 16 rows × 40px inside the `sticky top-0` header (header grows to 730px);
a sticky box taller than the viewport only slides up when its containing block ends, so the tail of
the menu is off-screen until the user reaches the very end of the page. The static menu is an
absolutely positioned panel with no height cap, so its tail is simply unreachable. Neither has
`overflow-y:auto`. Real phones lose another ~100px to browser chrome, so even 390×844 devices are
close to the limit once text spacing (WCAG 1.4.12) or a larger default font is applied.

Same class of defect as R674 (dialogs) — content pinned to the viewport without a height cap.

Two more findings from the same measurement (`qa/r676-hit.cjs`, `qa/r676-static-panel.cjs`):
- `/builder` 375×667: even with the cap, the last menu row sits under the builder's fixed bottom pane
  switcher (`z-30`) because the header is `z-20` — `elementsFromPoint` returns the pane button first.
- Static pages: the `details.mnav .panel` is anchored to the hamburger (`right:0` of the `details`,
  `min-width:11rem`), and the hamburger sits mid-header between brand and CTA, so at 375 the panel
  spans x −25…151 and the link text starts at x −8 ("Templates" clipped); at 320 it is −38 / −21.
  414+ is fine. Pre-existing, never measured because a negative left edge does not grow `scrollWidth`.

## Fix
- `src/components/Layout.tsx` mobile `<nav aria-label="Main">`:
  `max-h-[calc(100dvh-3.5rem)] overflow-y-auto` (3.5rem = the `h-14` header row).
- `src/components/Layout.tsx` header: `z-20` → `z-40` while the mobile menu is open, so the open
  menu sits above the builder pane switcher (`z-30`); dialogs (`z-50`) stay on top.
- `scripts/build-seo.mjs` `details.mnav .panel`: full-width strip under the sticky header like the
  SPA (`details.mnav{position:static}`, panel `left:0;right:0;top:100%`, bottom border, `.25rem 1rem .5rem`
  padding) + `max-height:calc(100dvh - 3.5rem);overflow-y:auto`. Fixes the negative left edge too.

Nothing changes when the menu fits (812-high phones today): the cap is larger than the content.

## Verification
- 375×667 and 667×375: last link visible/hit-testable after scrolling *the menu* (not the page);
  menu bottom ≤ viewport; page `scrollY` stays 0.
- 375×812 default: SPA menu geometry identical to before (nav 56→729, no inner scroll).
- `/builder` 375×667: last row hit-testable (header above the pane switcher).
- Static 320/375: panel left = 0, first link text starts at ≥ 16px; 767: panel spans the header width.
- 120-URL 320/375+spacing sweep unchanged (0 overflow); console 0; storage keys unchanged.
