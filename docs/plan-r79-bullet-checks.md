# R79 — Per-entry bullet best-practice checks (buzzwords, punctuation, bullet count)

## First-hand evidence (2026-08-29, app.rezi.ai logged-in editor)

Screenshots in `~/audit-r1/shots-r79/`:

- `rezi-experience-content-analysis-flags.png` — a single experience entry with one
  weak bullet immediately shows a live per-entry analysis list in the editor sidebar:
  Weak Bullet Points (red), Personal Pronoun / Buzzwords / Passive Voice / Filler
  Words / Wordy Content (PRO-gated), Dates are missing (red), Number of Bullet
  Points (amber), Quantified Bullet Points (amber), "3 best practices applied" (green).
- `rezi-weak-bullets-expanded-highlights.png` — expanding a flag shows guidance text
  and highlights the offending words ("Worked", "was") inline in the textarea.
- `rezi-bulletcount-bestpractices-expanded.png` — "Number of Bullet Points: Include
  3-6 bullet points for each experience. Only 1 found in this section."
- `rezi-content-analysis-full-list.png` — green best practices: Short Bullet Points
  (full line length), Punctuated Bullet Points ("Capitalize the first letter and end
  with a period for each"), Abbreviated Months (fully spelled).

## HonestCV today (source: `src/lib/guidance.ts`, `src/pages/Builder.tsx`)

Per-line `checkBullet` already covers: weak openers, first-person pronouns, missing
numbers, filler words, too long/short — rendered per entry via `BulletGuidance`
with a per-line "Fix with AI" action. `resumeHealth` covers buzzwords and tense
consistency, but only as a *global* report; the inline dates warning (R63) is the
only per-entry structural note.

Gaps vs the Rezi list:

1. **Bullet count per entry** — Rezi flags "Include 3-6 bullet points for each
   experience"; we only have a global "≥3 bullets across all roles" ATS check.
2. **Buzzwords per line** — our BUZZWORDS list only feeds the global health report,
   not the inline per-entry guidance where the user is typing.
3. **Punctuated bullets** — no check that a bullet starts with a capital and ends
   with a period.

## R79 scope (small batch, deterministic, zero AI/API/storage changes)

- `src/lib/guidance.ts`: extend `checkBullet` with
  - `buzzword`: line contains a BUZZWORDS term → "an empty claim — replace with a
    concrete fact";
  - `punctuation`: line does not start with an uppercase letter/digit or does not
    end with `.` → "Capitalize the first letter and end with a period".
- `src/pages/Builder.tsx` `BulletGuidance`: new optional `entryFilled` prop; when the
  entry has a role/company, show an amber per-entry note when the non-empty bullet
  count is outside 3–6 ("Include 3–6 bullet points — N found in this role").

Deliberately not copying: inline word highlighting inside the textarea (needs a
contenteditable overlay), passive-voice NLP, "Abbreviated Months" (our own
placeholders teach `Jun 2023`-style dates), Rezi's sidebar video coach, and the
Sort-by-date toggle (we have manual reorder). No scoring changes: `scoreResume`
stays 70/30 and these checks stay advisory.

## Verification

Local: `npm run lint`, `npx tsc -b`, `npm run build`, `git diff --check`.
Production QA after deploy: entry with 1 unpunctuated buzzwordy bullet shows the
new warnings; fixing text clears them; 3–6 bullets clears the count note; 375px no
overflow; console clean; localStorage byte-restored.
