# R168 — Inline lint underline inside the bullet editors

## Rezi evidence (first-hand, public app, 2026-08-31)

On the public Rezi editor (`app.rezi.ai`, Experience tab, sample resume), the
"WHAT DID YOU DO AT ACME CORP?" bullet editor renders the offending bullet
("Worked on various projects and was responsible for many things.") with a
**red underline inside the editing field itself**, Grammarly-style, while the
left sidebar lists the audit categories (Weak Bullet Points, etc.). The signal
lives where the user is typing, not only in a list elsewhere.

Screenshots: `shots-r168/09-experience.png`, `10-genoptions.png` (session audit
archive).

## RezUp today

`BulletGuidance` (Builder.tsx) lists per-line warnings **below** the textarea
("⚠ Line 2: …"), powered by `checkBullet()` in `src/lib/guidance.ts`. The
textarea itself gives no visual cue about *which* text is the problem — users
must map line numbers back to their own text. Preview audit chips (R148–R150,
R155) also live away from the typing surface.

Gap: no in-editor marking of the offending line while typing. That is the
highest-frequency touchpoint (every bullet edit) and directly mirrors Rezi's
public behavior.

## Design

New `LintedTextarea` component (`src/components/LintedTextarea.tsx`):

- A `relative` wrapper renders the existing shadcn `Textarea` plus an
  `aria-hidden`, `pointer-events-none` backdrop `div` absolutely covering it.
- The backdrop mirrors the textarea's box/typography metrics (border width,
  `px-3 py-2 text-sm`, `whitespace-pre-wrap`, `overflow-wrap: break-word`) and
  renders the same text with `color: transparent`, so only decorations show.
- Lines whose `checkBullet()` result contains a *rewrite-this-sentence* issue
  (`weak-opener`, `first-person`, `filler`, `buzzword`, `passive`, `too-long`)
  get `text-decoration: underline wavy` in amber. Structural issues that don't
  point at wording (`no-metric`, `punctuation`, `too-short`) stay list-only to
  avoid underlining nearly every line.
- Scroll position syncs from the textarea to the backdrop on `scroll`.
- Zero schema, zero storage, zero export changes; `BulletGuidance` below the
  field is unchanged (it stays the place with messages + AI fix buttons).

Wired into the three bullet editors that already have per-line guidance:
Experience achievements, Projects description, Involvement description
(R139 scope).

## Verification plan

- Local: lint, test, typecheck (tsc -b via build), build.
- Production, 1440px + 375px:
  - typing a weak bullet ("worked on various stuff") underlines that line live;
    fixing it removes the underline;
  - clean lines and empty lines get no underline;
  - underline alignment holds when the textarea scrolls and when long lines wrap;
  - caret/selection/typing unaffected (backdrop is pointer-transparent);
  - `BulletGuidance` list + AI fix path regression (R139);
  - no horizontal overflow at 375px.

## Non-goals

- No red squiggle on preview/share surfaces (audit chips already cover preview).
- No new lint rules — reuses `checkBullet()` verbatim.
- No contentEditable rich-text rewrite of the editors.
