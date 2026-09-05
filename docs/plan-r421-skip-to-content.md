# R421 — Skip to content link in the SPA header

## Production evidence (CDP probe @1600×900, https://cv.zalize.com)

- No skip link exists anywhere (`grep "Skip to"` in src: zero hits).
- Visible focusable elements before `<main>` on each SPA page:
  - /builder: 15 (of 245 total)
  - /dashboard: 9 (of 105)
  - /jobs: 9 (of 135)
- Keyboard and screen-reader users must tab through the whole header (logo, 6 nav links,
  Resources dropdown, ThemeToggle, action cluster) on every single page before reaching
  content — WCAG 2.4.1 "Bypass Blocks" failure. Rezi-class products ship a skip link.

## Scope

- SPA `SiteHeader` (src/components/Layout.tsx) only — one edit covers every app page,
  since each page renders its own `<main>`.
- Static prerendered pages (scripts/build-seo.mjs) use 9 separate inline header
  templates; banked as a follow-up candidate, out of scope here.

## Implementation

- First child of `<header>`: an anchor visually hidden until keyboard-focused
  (`sr-only focus:not-sr-only focus:absolute …`), text "Skip to content".
- onClick: preventDefault, `document.querySelector('main')`, set `tabindex="-1"`,
  `.focus()`, `scrollIntoView` — no per-page id wiring needed, works for all
  current and future pages.
- Zero changes to existing header controls, nav, or the R420 dismissal logic
  (the link lives inside headerRef so it cannot mis-close the mobile menu).

## Validation

- Local: tsc / eslint Layout.tsx / build.
- Production: first Tab on /builder, /dashboard, /jobs reveals the link; Enter moves
  focus to `<main>` (activeElement check); link invisible without keyboard focus in
  light + dark; R420 mobile menu + Resources dropdown regression.
