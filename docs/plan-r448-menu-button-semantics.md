# R448 — menu-button semantics and arrow-key navigation for the two aria-haspopup menus

## First-hand production evidence (CDP, 2026-08-31)

- Desktop Resources dropdown (`header button` "Resources"):
  - `aria-haspopup="true"` (screen readers announce "menu") but `aria-controls: null`.
  - Open panel role: `null`; all 7 item roles: `null` — no `role="menu"` / `role="menuitem"`.
  - With the menu open and the toggle focused, pressing ArrowDown does not move focus
    into the menu; instead the page scrolls (`scrollY` 0 → 40) and focus stays on the toggle.
- Builder compact download menu (R447 probe): `dl menu roles: []`,
  `dl btn aria: {"haspopup":"true","controls":null}` — same gap.
- The mobile hamburger is a navigation disclosure (`aria-expanded` on a button controlling
  a `nav`), not a menu button, so it is correctly out of scope.

This violates the WAI-ARIA menu button pattern (APG): a control with `aria-haspopup`
promises menu semantics — `role="menu"` on the popup, `role="menuitem"` on items, and
ArrowDown/ArrowUp/Home/End navigation between items.

## Fix (narrow)

Only the two true menu buttons:

1. `src/components/Layout.tsx` — ResourcesDropdown:
   - panel gets `role="menu"`, `id`, `aria-label`; links get `role="menuitem"`.
   - button gets `aria-haspopup="menu"` and `aria-controls`.
   - existing open-effect keydown handler extended: ArrowDown/ArrowUp/Home/End
     (when focus is inside the dropdown container) move focus among menu items with
     wrap-around and `preventDefault()` so the page no longer scrolls.
2. `src/pages/Builder.tsx` — compact download menu: same treatment.

Escape/outside-click behavior (R419/R447), Tab reachability, link/download activation,
and the hamburger are unchanged.
