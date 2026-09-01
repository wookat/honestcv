# R139 — bullet-quality guidance for Projects and Involvement

## Audit evidence (Rezi, live DOM, 2026-08-31)

Rezi's per-resume editor shows a writing-lint panel for every entry of every
experience-like section (Weak Bullet Points, Personal Pronoun, Buzzwords,
Passive Voice, Filler Words, Wordy Content, Quantified Bullet Points…), not
just Experience. In RezUp, `BulletGuidance` (weak openers, pronouns, filler,
buzzwords, passive voice, quantification, length, punctuation — from
`src/lib/guidance.ts`) plus its per-line "Fix with AI" button only renders
under Experience entries. The Projects and Involvement `description`
textareas — whose lines become preview bullets (R134) — get zero feedback,
so weak writing in those sections goes unflagged.

## Change (zero schema, zero deps, reuse only)

- Builder: render `<BulletGuidance bullets={description.split('\n')} …/>`
  under the Projects and Involvement description textareas, wired to the
  existing `runRewrite(…, 'bullets', …)` per-line AI fix, writing the fixed
  line back into the same line of `description`.
- No 3–6 bullet-count note for these sections (`entryFilled` stays false):
  project/involvement descriptions are legitimately 1–2 lines; only real
  writing issues are flagged.
- Final check ("issues before download") counts bullet-quality warnings
  across Experience + Projects + Involvement instead of Experience only.

## Out of scope

- No new lint rules (guidance.ts untouched except none needed).
- No schema, localStorage, or dependency changes.
- Share page, Dashboard, exports untouched.
