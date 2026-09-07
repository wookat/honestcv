# R681 — link-styled buttons are bare text under forced-colors (Windows High Contrast)

## Evidence (production `index-CdsS47gU.js`, CDP `forced-colors: active` + dark, 1280px)

`qa/r681-evidence.cjs` listed every actionable element (button / a / role=button / summary) that
has no border, no background, no underline and no icon under forced-colors on the 8 routes.
`qa/r681-proof.cjs` then narrowed that to text-only `<button>`s and compared each one with the
text around it (`color` equal to the parent's `color` and no underline ⇒ indistinguishable).

Seeded fixture (the R651 relationship fixture: tracked job `qa-j2`, two copies, two cover letters):

| route | text-only frameless buttons | indistinct from surrounding text |
| --- | --- | --- |
| `/dashboard` | 22 | 22 — "Import your LinkedIn profile", `use this one (instead)` ×3, 9 sample titles, 9 sample previews |
| `/jobs?tab=tracked&job=qa-j2` | 7 | 7 — "Tailoring report", `Open` ×3, `Use this one instead`, `Use for this job` ×2 |
| `/documents` | 2 | 2 — `use this one` ×2 |
| `/builder?v=qa-vK2` | 29 | 15 — 6 section-nav chips (unselected), 9 colour swatches |
| `/samples` | 18 | 18 — 9 sample titles, 9 previews |
| `/`, `/ats-checker` | 0 / 1 | 0 |

Why: these controls are `<button>`s styled as links — `text-primary … underline-offset-2
hover:underline` (`INLINE_ACTION` relationship actions from R639–R651, "Tailoring report",
"Import your LinkedIn profile", sample titles, `Button variant="link"`). Their only rest-state cue
is the primary colour. Under forced-colors the author colour is replaced by **ButtonText**, which
in every Windows theme equals CanvasText — the body-text colour. Real `<a>` links are recoloured
to **LinkText** (yellow in the emulated dark palette, `qa/r681-shots.cjs`: header nav links
`rgb(255,255,0)` vs the "Resources" *button* `rgb(255,255,255)`), so anchors survive and buttons
do not. Screenshot `qa/shots/r681/before-jobs-tailoring.png`: "Tailoring report" is a white word
in a white sentence.

WCAG 1.4.1 (Use of Color) in the one rendering mode where the author palette is gone; the same
class of failure R680 fixed for selected state.

## Fix — one rule, keyed on the class that already encodes "this is a link-styled control"

`src/index.css`, inside the existing `@media (forced-colors: active)` block:

```css
:is(button, [role='button'], [data-slot='button'])[class~='hover:underline'] {
  text-decoration-line: underline;
}
```

- `[class~='hover:underline']` matches the literal Tailwind token, so every link-styled button
  (raw `<button>` with `hover:underline`, `Button variant="link"`, `Button asChild` anchors) is
  covered without touching ~24 call sites; a new link-styled button is covered automatically.
- Underline is the conventional High Contrast affordance for text actions (Windows HC users cannot
  rely on colour); it does not fight the UA palette, so no `forced-color-adjust` is needed.
- Scoped to buttons: plain `<a hover:underline>` (footer, header nav) already get LinkText.
- Inert outside forced-colors — normal rendering is byte-identical.

## Verification

Prototype via `addStyleTag` on production (`qa/r681-proof.cjs 1280 proto`): indistinct
text-only buttons `/jobs` 7 → 0, `/documents` 2 → 0, `/dashboard` 22 → 9, `/samples` 18 → 9;
total 64 → 33. The 33 that remain are out of scope for this rule and recorded for follow-up:

- 18 sample **preview** buttons (275×176 thumbnail images inside a bordered card — the card frame
  is the affordance; not text).
- 6 builder section-nav chips (unselected; sit inside a bordered `nav` next to the R680
  Highlight chip).
- 9 builder colour swatches — their author background *is* the information and forced-colors
  erases it (unselected swatches render as nothing). → R682 candidate.

After deploy: rerun `qa/r681-proof.cjs` at 1280 and 375 without `proto`; `qa/r680-state.cjs`
(R680 regression), `qa/r678-forced.cjs` (R678); normal-mode pixel comparison of a jobs card and
a dashboard copy note; zero console errors; storage back to baseline.

## Not verified

Real Windows High Contrast palettes (CDP emulation only); real screen readers; whether a given
theme's ButtonText differs from CanvasText (it does not in the four shipped Windows themes, per
the CSS Color 4 system-colour mapping — inference, not measured).
