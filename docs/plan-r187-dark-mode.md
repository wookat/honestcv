# R187 — Dark mode with light / dark / system preference

## Evidence
Rezi public changelog, Updates May 2024: "Dark Mode — The most requested update,
Dark Mode, is live. It looks awesome." First-party public claim; the protected
app remains inaccessible (OTP 403), so the exact toggle UX is unknown. The
public claim is that the whole web app supports a dark theme.

## Current gap
RezUp has no dark theme at all. The design tokens are already shadcn-style CSS
variables (`src/index.css` `:root` block) and a `@custom-variant dark` is
declared, and scattered `dark:` utilities already exist (e.g. the R186 emerald
diff highlight), but there is no `.dark` token block, no toggle, and no
persistence — the app is permanently light regardless of OS preference.

## Design
1. `src/index.css`: add a `.dark { ... }` block redefining the same tokens
   (background/foreground/card/popover/primary/secondary/muted/accent/
   destructive/border/input/ring) with a dark oklch palette matching the
   existing hue (≈260–265).
2. New `src/lib/theme.ts`: `ThemePref = 'light' | 'dark' | 'system'`,
   localStorage key `honestcv.theme` (default `system`), `applyThemePref`
   toggles the `dark` class on `<html>`; `system` follows
   `prefers-color-scheme` live via a `matchMedia` change listener.
3. `index.html`: tiny pre-paint script reading the same key so a stored dark
   preference doesn't flash light on load. Served as external `/theme.js`
   because the strict CSP (`script-src 'self'`) forbids inline scripts.
4. `SiteHeader` (shared by every page): a Sun/Moon/Monitor toggle button that
   cycles light → dark → system, with `aria-label` naming the current and next
   mode, 40px touch target. One control, visible on desktop and mobile.
5. Tinted advisory surfaces (amber/emerald/red/blue `-50/100` panels,
   `-600..900` text, `-200/300` borders) are converted globally by remapping
   the palette steps (`--color-amber-50` etc.) inside the `.dark` block —
   Tailwind v4 utilities compile to `var(--color-*)`, so one remap covers all
   ~40 call sites without touching them. A handful of `bg-white` app surfaces
   (ATS checker cards, landing overlay/pill) move to `bg-card` / `dark:`
   variants.
6. The resume paper stays paper: `ResumePreview`, `TemplateThumb`, share page
   sheet, and exports are untouched (white sheet in both themes, like every
   resume builder).

Zero schema, zero server, zero export changes. Preference is device-local
(design/display preference, not resume data — same treatment as the R147
pages/flow toggle).

## Acceptance
- Toggle cycles light → dark → system and persists across reloads.
- `system` follows the OS preference live (emulated via CDP).
- Dark theme: readable text/borders on all app pages (Landing, Dashboard,
  Builder edit+preview columns, Jobs, ATS checker), tinted advisory panels
  (amber warnings, emerald success, red destructive) legible.
- Resume preview sheet and template thumbnails remain light in dark mode.
- No flash of wrong theme on reload with a stored dark preference.
- 1440px and 375px; toggle touch target ≥40px.
- Regressions: R186 rewrite dialog (incl. emerald highlight in dark), R176
  priority fixes chips, R168 wavy underline visible in dark.
