# R169: entry-level "balanced mix" guidance replaces per-line no-metric nagging

## Rezi evidence (public, first-hand)

On Rezi's Experience editor (app.rezi.ai, audited 2026-08-31, screenshots in
audit shots-r169/08–13), the bullet textarea shows a persistent tip:

> "Aim for a balanced mix of descriptive and key number bullet points."

Rezi treats quantification as an **entry-level mix** goal — a resume bullet
list should combine descriptive bullets and key-number bullets — not as a
per-line requirement. Its per-line lint (red underline + "Weak Bullet Points"
category) targets wording problems, while quantification is coached at the
list level.

## RezUp today

`checkBullet()` flags `no-metric` on **every** line without a digit. For an
entry with 5 well-written descriptive bullets and 2 quantified ones, the user
still gets up to 5 "No numbers" warnings, one per line:

- It is the single noisiest rule — most honest bullets legitimately carry no
  number, and best practice (matching Rezi's public coaching) is a mix, not
  100% quantified.
- The per-line "Fix line with AI" button on a `no-metric` finding invites the
  model to invent a metric, which conflicts with our no-fabrication rule
  (grounding forbids inventing numbers, so the "fix" can't actually fix it).

## Change

1. `src/lib/guidance.ts`
   - New `bulletMix(bullets)` → `{ total, quantified, balanced }`.
     Non-empty lines; quantified = lines containing a digit; balanced when
     `total === 0` or `quantified >= max(1, ceil(total / 3))` (at least ~1 in
     3 bullets carries a key number, minimum one).
   - `checkBullets()` strips `no-metric` from per-line issues. `checkBullet()`
     itself is unchanged (R168's `LintedTextarea` already excludes
     `no-metric` from underlining).
2. `src/pages/Builder.tsx`
   - `BulletGuidance`: when the mix is unbalanced, show **one** entry-level
     amber line — "Key numbers in {q} of {n} bullets — aim for a balanced mix
     of descriptive and key-number bullets." — instead of N per-line nags.
     The green all-clear line now also requires a balanced mix.
   - `bulletFindings()` (audit chips R148–R155): the "Quantified bullet
     points" category becomes a single entry-level finding when unbalanced,
     so the chip count and popover stop listing one finding per line.
   - Final check counter: an unbalanced entry counts as one warning.

## Not changing

- Resume schema, persistence, exports, share, AI endpoints, payments.
- ATS "Quantified impact" score dimension (separate logic, unchanged).
- R168 underline behavior (`no-metric` was never underlined).
- All other lint kinds stay per-line with per-line AI fix.

## Verification

- Local lint/typecheck/build (repo has no `test` script — recorded as-is).
- Production at 1440px and 375px:
  - Entry with 0/4 quantified bullets → one amber mix line (not 4), chip
    counts one "Quantified bullet points" finding.
  - Add a number to two bullets → mix line disappears, green all-clear shows.
  - Wording issues (weak opener etc.) still flagged per line with AI fix.
  - Projects and Involvement behave the same.
  - Final check aggregate reflects the new counting.
  - R168 underlines and R167 language unaffected.
