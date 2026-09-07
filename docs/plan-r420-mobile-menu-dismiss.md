# R420 — Mobile hamburger nav closes on outside click and Escape

## Production evidence (CDP probe @375×812, mobile, https://cv.zalize.com/ats-checker)

- Open hamburger (`button[aria-label="Menu"]`): `aria-expanded="true"`, nav panel renders (rect top 56 → bottom 729).
- Click outside the panel (MAIN content at y=769): `aria-expanded` stays `"true"` — menu does not close.
- Press Escape: stays `"true"` — no keyboard exit path other than tabbing back to the toggle.
- Contrast: ResourcesDropdown (same header) and the Builder compact download menu (post-R419) both close on outside pointerdown and Escape. The mobile nav is now the only remaining header disclosure without dismissal handling.
- Static pages (e.g. /about/) use a separate prerendered header — out of scope; this affects all SPA routes (/builder, /dashboard, /jobs, /ats-checker, /documents, /samples, /s/*).

## Severity

P3 (a11y/UX): WAI-ARIA disclosure/menu-button pattern expects Escape to collapse; keyboard and screen-reader users on mobile widths get a near-full-screen (673px) panel with no dismissal other than re-activating the toggle.

## Fix (Layout.tsx SiteHeader only)

Mirror the ResourcesDropdown pattern already in the same file:

- `headerRef` on the `<header>` element (covers both the toggle and the panel, so clicks on either don't count as outside).
- While `menuOpen`: document-level `pointerdown` (outside `headerRef` → close) and `keydown` Escape → close.
- Existing behavior unchanged: toggle click still opens/closes, SPA `<Link>` items still close via their onClick, static `<a>` items still full-page navigate, ThemeToggle/action cluster inside header unaffected.

## Validation

- Local: `npx tsc -b`, `npx eslint src/components/Layout.tsx`, `npm run build`.
- Production QA: outside click closes with zero side effects; Escape closes; Escape while closed is a no-op; clicking items inside the panel does not prematurely close before navigation; ResourcesDropdown and R419 download-menu regressions; desktop nav (≥md/lg) untouched; 375 light/dark; zero console errors; no AI/share/lead/payment traffic.
