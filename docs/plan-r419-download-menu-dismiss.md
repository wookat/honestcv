# R419 — Builder download menu ignores outside clicks and Escape

## Production evidence (probe_r419.py, cv.zalize.com/builder @1280)

- Open the compact "Download your resume" menu (the `aria-haspopup` toolbar
  button shown below 2xl — i.e. on every laptop up to 1535px wide):
  `aria-expanded="true"`.
- Click elsewhere on the page: menu stays open (`aria-expanded="true"`).
- Press Escape: menu still open.
- Same probe on the header Resources dropdown: outside click closes it
  (`aria-expanded="false"`), matching every other popover/dialog in the app
  (Radix dialogs close on Esc/outside; ResourcesDropdown has explicit
  pointerdown + Escape handlers).

So the Builder's most prominent toolbar popover is the only one in the app
that can't be dismissed without either picking a format or re-clicking the
toggle — it floats over the editor until then, and keyboard users have no
Escape path (WAI-ARIA menu-button pattern expects Escape to close).

## Fix (Builder.tsx only)

Mirror the `ResourcesDropdown` pattern on the existing wrapper
`<div className="relative 2xl:hidden">`:

```tsx
const downloadMenuRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  if (!downloadMenuOpen) return
  const onDown = (e: PointerEvent) => {
    if (!downloadMenuRef.current?.contains(e.target as Node)) setDownloadMenuOpen(false)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setDownloadMenuOpen(false)
  }
  document.addEventListener('pointerdown', onDown)
  document.addEventListener('keydown', onKey)
  return () => { ... }
}, [downloadMenuOpen])
```

Item clicks and the toggle keep their existing behavior byte-identical.

## Validation

- `npx tsc -b`, `npx eslint src/pages/Builder.tsx`, `npm run build`.
- Production QA: open menu → outside click closes; open → Escape closes
  (and does not disturb the page otherwise); open → item click still
  downloads/closes; toggle click still closes; Resources dropdown regression;
  2xl expanded buttons unaffected; 375 light/dark; zero console errors.
