# R691 — builder entry-audit chip: the hover/focus findings panel covers the form fields below it and cannot be dismissed (WCAG 1.4.13)

## Evidence (`qa/r691-evidence.cjs 1280`, production `index-BmzslGsc.js`, `/builder?example=accountant`)

Every experience / education card header carries an `EntryAuditChip` (`✓` or `⚠ N`). On hover or keyboard focus (`tabIndex=0` span, or the expand `<button>` when the card is collapsed) it reveals an `aria-hidden` panel with the findings and their explanations, purely through `group-hover:block group-focus-within:block`.

| state                 | panel                | what is under its centre                                | Escape |
| --------------------- | -------------------- | ------------------------------------------------------- | ------ |
| rest                  | `display:none`       | —                                                       | —      |
| hover chip "Role 1"   | `block`, 256×143 px  | `DIV.space-y-1.5 "Your role at Piedmont Building Products"` (the card's own inputs) | **still open** |
| focus chip "Role 1"   | `block`, 256×143 px  | same                                                    | **still open** |

WCAG 1.4.13 (Content on Hover or Focus, AA) requires additional content that obscures other content to be **dismissible** without moving the pointer or focus — Escape is the expected mechanism. Hoverable (pointer can move onto the panel — it is a child of the hovered group) and persistent already hold. A keyboard user who Tabs onto the chip has the card's first inputs covered until they Tab away; a mouse user parks over the chip and cannot read what is underneath without moving.

axe has no check for 1.4.13; the only other hover/focus-revealed content in `src/` is this one (`rg group-hover|group-focus-within|peer-hover` → 1 hit), so this closes the criterion for the app.

## Fix (`src/pages/Builder.tsx`, `EntryAuditChip` only)

Drive visibility from React state instead of the CSS `group-*` variants, so Escape can close it:

```tsx
const [shown, setShown] = useState(false)      // hovered or focus-within
const [dismissed, setDismissed] = useState(false)
useEffect(() => {
  if (!shown || dismissed) return
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDismissed(true) }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
}, [shown, dismissed])

const wrap = {
  onMouseEnter: () => { setShown(true); setDismissed(false) },
  onMouseLeave: () => setShown(false),
  onFocus: () => { setShown(true); setDismissed(false) },   // React onFocus/onBlur bubble = focus-within
  onBlur: () => setShown(false),
}
// panel: `hidden group-focus-within:block group-hover:block` → shown && !dismissed ? 'block' : 'hidden'
```

- Escape while hovered (focus elsewhere, even on `body`) or while the chip is focused closes the panel; the chip itself stays where it is (no focus change, no card expand).
- Leaving and re-entering (pointer or focus) re-arms it.
- The listener only exists while the panel is open, so Escape elsewhere on the page (dialogs, toasts) is untouched; the handler does not `preventDefault`/`stopPropagation`.
- Panel geometry, content, `aria-hidden`, `<sm` fixed bottom sheet and the collapsed-card expand behaviour are unchanged.

## Verification

Local: `npx tsc -b --noEmit`, `npx eslint src/pages/Builder.tsx`, `git diff --check`, `npm run build`, `npm run verify-dist`.

Production result (`index-CDfcCDdV.js`, `qa/r691-evidence.cjs 1280|375`): rest `none`; hover → `block` (1280: absolute 256×143 at 167,475; 375: fixed bottom sheet 328×128 at 16,604 — both identical to the pre-fix geometry); hover + Escape → `none`, `activeElement` unchanged (`body`); focus → `block`; focus + Escape → `none`, focus still on "Role 1: 3 suggestions"; leave + re-hover → `block`; blur + re-focus → `block`; blur → `none`; zero console errors; storage back to baseline. Collapsed-card variant (`qa/r691-collapsed.cjs 1280|375`): hover → `block`, Escape → `none`; pointer click still expands the card; keyboard focus → `block`, Enter still expands.

Not verified: real touch (CDP context has no `hasTouch`; the `<sm` bottom-sheet geometry above is measured under mouse hover, not a tap), real screen reader.
