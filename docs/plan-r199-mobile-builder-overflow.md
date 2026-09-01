# R199 — Fix /builder horizontal overflow at 375px

## Evidence (production, 2026-08-31)

CDP audit at 375×812 (mobile emulation) on https://cv.zalize.com/builder:

- `document.documentElement.scrollWidth = 388` (13px horizontal overflow; viewport 375).
- Offenders measured via `getBoundingClientRect()`:
  - Header action cluster `div.flex.items-center.gap-1` spans 140→380; the `md:hidden` hamburger button ends at 388.
  - The fixed bottom Edit/Preview bar (`inset-x-0`) spans 0→388 — it *follows* the widened root, it is not a cause.
  - The section-navigator chip row (`w-max`, 511px) sits inside `min-w-0 flex-1 overflow-x-auto` — clipped correctly, not a cause.
- Reproduces on every template (verified on Modern in R198 QA) — flagged as pre-existing P3 in R198 and earlier rounds.

## Root cause

On /builder the `SiteHeader` `action` cluster keeps five ~40px touch targets visible at xs
(History, Assistant, Download menu, theme toggle, hamburger) next to the logo link
`RezUp by Zalize`. Logo (~132px) + actions (~238px) + `px-4` container padding > 375px,
so the header row widens the document by exactly 13px.

## Fix (minimal, header-only)

1. Hide the `by Zalize` tagline below `sm` (`hidden sm:inline`) — saves ~55px, keeps the
   brand mark + name. The tagline stays on ≥640px and in the footer/SEO pages.
2. Tighten the Builder action cluster gap at xs (`gap-1 sm:gap-2`) for margin of safety.

No layout, schema, export, or scoring changes. Buttons keep ≥40px touch targets.

## Acceptance

- /builder at 375px: `scrollWidth === 375`, no element right-edge > 375.
- Bottom Edit/Preview bar spans exactly the viewport.
- Header unchanged at ≥640px (tagline visible, same spacing).
- /dashboard, /jobs, landing at 375px unchanged or improved (shared header).
- R198 templates and prior rounds regression-clean.
