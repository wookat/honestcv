# R447 — Escape inside an open disclosure drops keyboard focus to BODY

## Evidence (production, CDP, 2026-09-05)

R446 fixed focus return for the assistant panel. The three remaining header
disclosures still lose focus when Escape is pressed while focus is *inside*
the open panel (their document-level Escape handlers close the panel, the
focused item unmounts, and the browser drops focus to BODY):

- R419 compact download menu (/builder @1024): open, Tab onto the "PDF" item,
  Escape → menu closed, `document.activeElement` = **BODY**.
- Resources dropdown (header, desktop): open, Tab onto "Resume guides",
  Escape → closed, activeElement = BODY.
- R420 mobile hamburger (375×812): open, Tab onto a nav link, Escape →
  closed, activeElement = BODY.

When focus is still on the toggle itself, Escape correctly leaves it there
(the toggle persists across the close). Only the focus-inside-panel path is
broken — same WCAG 2.4.3 focus-order problem as R446.

## Fix (minimal: src/components/Layout.tsx + src/pages/Builder.tsx)

In each of the three Escape handlers, after closing, return focus to the
toggle button — but only when focus was inside the disclosure (container
`.contains(document.activeElement)`), so Escape pressed with focus elsewhere
on the page never steals focus:

```tsx
const btnRef = useRef<HTMLButtonElement>(null)
...
const onKey = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return
  setOpen(false)
  if (containerRef.current?.contains(document.activeElement)) btnRef.current?.focus()
}
```

- ResourcesDropdown: container `ref` already exists; add `btnRef` on the toggle.
- SiteHeader hamburger: scope the check to the mobile `<nav>` panel (new
  `mobileNavRef`) rather than the whole header, so Escape with focus on the
  theme toggle or a header action doesn't yank focus to the hamburger; add
  `menuButtonRef` on the toggle.
- Builder download menu: `downloadMenuRef` container exists; add a ref on the
  toggle Button (`ref` works on the shared Button — proven in R446).

Outside-pointer close paths are untouched (pointer interactions move focus
themselves). Radix dialogs and the assistant (R446) already behave correctly.

## Regression checklist

- Escape with focus on the toggle: panel closes, focus stays on the toggle.
- Escape with focus on a panel item: panel closes, focus returns to toggle.
- Escape with the disclosure open but focus elsewhere (e.g. theme toggle):
  panel closes, focus does NOT move.
- Outside click still closes each disclosure with no focus side effects.
- R421 skip link, R420 hamburger link navigation, R419 download actions,
  R446 assistant focus return unchanged.
