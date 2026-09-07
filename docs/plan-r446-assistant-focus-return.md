# R446 — closing the assistant panel drops keyboard focus

## Evidence (production, CDP, 2026-09-05)

Keyboard flow on /builder (setup-complete profile):

- Focus the toolbar assistant button → open panel → Tab/focus into the chat
  textarea → Escape (R445): panel closes, `document.activeElement` = **BODY**.
- Same with the panel's X button: focus X, activate it → activeElement = BODY.
- Baselines that do it right:
  - Copies dialog (Radix, R340): Escape returns focus to the opener button.
  - R419 compact download menu: Escape leaves focus on the toggle button.

Losing focus to BODY strands keyboard/screen-reader users at the top of the
document (WCAG 2.4.3 focus order); the assistant panel is the only overlay left
that does this on close.

## Fix (minimal, src/pages/Builder.tsx only)

Attach a ref to the toolbar assistant button and focus it in the panel's
`onClose` (the single close path used by both Escape and the X button):

```tsx
const assistantButtonRef = useRef<HTMLButtonElement>(null)
...
<Button ref={assistantButtonRef} ... onClick={() => setAssistantOpen(true)}>
...
onClose={() => {
  setAssistantOpen(false)
  assistantButtonRef.current?.focus()
}}
```

Mirrors Radix trigger-return behavior. The toolbar button is always rendered in
the Builder header (also for `?assistant=1` deep links), so there is always a
sensible focus target. AssistantPanel itself is untouched.

## Regression checklist

- Escape close → focus lands on the toolbar assistant button.
- X-button close → same.
- Dialog-above-panel Escape priority (R445) unchanged — first Esc closes the
  dialog (Radix returns focus itself), panel stays open.
- Mouse users: focusing the button after a click-close is the same behavior
  Radix dialogs already exhibit; no visual change.
- ?assistant=1 deep link, chat persistence, quick tasks unchanged.
