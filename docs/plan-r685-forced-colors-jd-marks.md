# R685 — /ats-checker "Job description with keywords highlighted": matched vs missing is colour-only (collapses under forced-colors)

## Evidence (production, index-fDVUOzVR.js, `qa/r685-evidence.cjs 1280`)

The result state renders the pasted job description with every keyword wrapped in `<mark>`:

| kind    | normal                                             | forced-colors (CDP emulation)          |
| ------- | -------------------------------------------------- | -------------------------------------- |
| matched | `bg-emerald-100 text-emerald-900`                  | `Mark` yellow / `MarkText` black       |
| missing | `bg-amber-100 text-amber-900`                      | `Mark` yellow / `MarkText` black       |
| legend  | two `<span>`s tinted the same way ("green", "amber") | Canvas / CanvasText — plain body text |

- 16/16 marks (9 matched + 7 missing) computed pixel-identical under forced-colors (`matchedEqualsMissing:true`); the UA maps every `<mark>` to the system `Mark`/`MarkText` pair regardless of author colour.
- The legend says "green = already on your resume, amber = missing" — under forced-colors the swatches are just the words "green"/"amber" in body text, so the legend names colours the user cannot see.
- Even in normal mode the two categories differ by hue only (WCAG 1.4.1 Use of Color) — the text carries no other cue.
- Screenshot: `qa/shots/r685/01-ats-marks-forced-1280-1280.png`.
- Not affected: dashboard search `<mark>` (single category), AtsChecker High/Med and Application-ready chips, jobs match tone — all carry a text label alongside the tint.

## Fix

Add a non-colour cue to *missing* marks and make the legend show the cue by example instead of naming colours:

```tsx
const JD_MARK = {
  matched: 'rounded bg-emerald-100 px-0.5 text-emerald-900',
  missing: 'rounded bg-amber-100 px-0.5 text-amber-900 underline decoration-dashed underline-offset-2',
}
// legend
<mark className={JD_MARK.matched}>like this</mark> = already on your resume,{' '}
<mark className={JD_MARK.missing}>like this</mark> = missing.
```

- The dashed underline is intentionally visible in normal mode too (1.4.1) — amber text with an amber dashed underline; matched marks unchanged.
- Under forced-colors the underline inherits `MarkText`, so both categories keep the system `Mark` background and *missing* gains a dashed underline; the legend `<mark>`s render exactly like the body marks.
- No ARIA / scoring / segmenting change.

## Verify

- `qa/r685-evidence.cjs 1280|375`: forced `matchedEqualsMissing:false`, missing `deco:underline`, legend `<mark>`s equal the body samples.
- Normal mode: matched sample unchanged from before; missing sample differs only by `deco`.
- Regressions: `r678-forced.cjs`, `r664` region focusability; console 0; storage restored (`honestcv.atsDraft` cleared).

## Limits

CDP `forced-colors` emulation only — real Windows High Contrast not run.
