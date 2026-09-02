# R237 — Compare templates side by side (Rezi Finish Up parity)

## First-party evidence (Rezi)

Rezi user guide "Finish Up" (rezi.ai/rezi-docs/the-finish-up-tab, updated 2026-08-03), section
"2. Choose your resume template":

> Rezi also makes it easy to:
> - Save favorite templates for later
> - Revisit recently viewed templates
> - **Compare multiple designs side by side before deciding**
>
> The preview feature lets you see exactly how your resume appears with each template…

## Gap

HonestCV's template picker has saved favorites (R132) and recents (R132), but no way to see
the user's own resume rendered in two or three candidate templates at once. Today the only
option is to click templates one at a time and eyeball the single live preview between clicks —
no side-by-side decision support.

## Design

Session-only compare mode inside the existing Design & template card:

- A `Compare` toggle chip after the filter chips. When ON, clicking a template thumb toggles
  its selection (checkbox-style ring + count badge) instead of applying it; up to 3 selections.
- A `Compare N side by side` button (enabled at N ≥ 2) opens a dialog rendering the user's
  **current resume** (`visibleResume`-equivalent `shown` state) in each selected template via the
  existing `ResumePreview` (first pages, `zoom`-scaled like the Dashboard `Thumb`), one column per
  template with name / description / tags and a `Use this template` button.
- `Use this template` sets `templateId` (same `set('templateId', …)` + `recordTemplateRecent`
  path as a normal thumb click), closes the dialog, and exits compare mode.
- Closing the dialog keeps selections; toggling compare mode off clears them. Nothing persists.

## Invariants

- Zero schema / localStorage changes (compare selection is React state only).
- Zero scoring, export, AI, or network changes.
- Normal (compare-off) thumb click behavior, favorites stars, filters, recents unchanged.
- Responsive: dialog columns stack on 375px; dark mode readable.

## QA intent

Compare-mode toggle on/off; selection cap at 3; button disabled at <2; dialog renders the real
resume content (not sample) per template; Use-this-template applies + records recent + closes;
selections cleared on mode exit; normal click path regression; 375px stacking; dark mode contrast.
