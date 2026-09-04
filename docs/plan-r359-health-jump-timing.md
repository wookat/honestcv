# R359 — Health report Fix→ entry jump lands below the fold

## First-hand production evidence (R359 audit, index-CMcyuhvX.js)
- Full health report → finding "3–6 bullet points per role — Associate Product Manager at Harborview"
  → Fix→ closes the dialog, the target entry auto-expands, but the viewport shows the previous
  entry's fields; the target card starts at top 889 with innerHeight 761 (~130px below the fold).
  Reproduced twice, including after a fresh reload. Evidence: r359_fix_jump_retry.png.
- Section-anchor jumps from the same dialog appeared to land, but section targets are large enough
  to mask a short scroll; they share the same code path.

## Root cause
`HealthDialog.jumpEntry`/`jump` call `onClose()` and then run the scroll on
`requestAnimationFrame`. At that point the Radix dialog is still unmounting and the body scroll
lock has not been released, so `scrollIntoView` measures/animates against the locked layout and
ends short. Identical mechanism to the R355 interview-bridge overshoot, which was fixed by
delaying the jump 250ms after close.

## Fix (minimal)
In `HealthDialog`, replace the `requestAnimationFrame` in both `jump` and `jumpEntry` with
`window.setTimeout(..., 250)` — the proven R355 pattern. `jumpToEntry` itself (expansion +
`scrollIntoView block:'center'` + ring flash) is unchanged.

## Non-goals
- No change to `jumpToSection`, the ATS-card "Update job description" jump (works, no dialog
  unmount involved), or the assistant onLocate path.
- The R359 audit's second note (entry audit chip popover "not reachable") is under separate
  re-verification — the popover code exists (group-hover/focus-within panel with named passed
  checks); not an implementation target this round unless re-verification confirms a regression.

## Validation
- tsc / eslint (Builder.tsx) / vite build locally.
- Production QA: Fix→ on an entry finding scrolls the offending card into the viewport
  (block:center) with the ring flash visible; section-anchor Fix→ regression; keyboard activation;
  375 strict + dark; exact baseline restore; zero real AI.
