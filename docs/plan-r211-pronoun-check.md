# R211: no first-person pronouns ATS check

## Evidence (Rezi public first-party surface)

- Rezi User Docs, "Understanding your Rezi Score": "Personal pronouns: Skip
  words like 'I,' 'me,' and 'my.' Resumes should be written in the implied
  first person."
- Rezi blog resume-writing guidance repeats the same rule (bullets start with
  action verbs, never "I").

## Current HonestCV gap

Per-line editor guidance (`guidance.ts`) flags first-person openers inside
individual bullet textareas, but neither ATS scoring path has a resume-level
pronoun check: a summary written as "I am a developer and my goal is…" passes
both the Builder Score breakdown and /ats-checker untouched. Rezi scores this
explicitly.

## Design

New structure check `No first-person pronouns` in `src/lib/ats.ts`, same shape
as R208–R210.

### `pronounCheck(segments: { text: string; anchor: SectionAnchor }[])`

- `PRONOUN_RE = /\b(?:I|[Mm]e|[Mm]y|[Mm]yself)\b/` (case-sensitive):
  matches the pronouns Rezi names — capital `I`, `me/Me`, `my/My`,
  `myself/Myself` — while NOT matching `MySQL`, `ME` (state code), or other
  all-caps tokens.
- First segment with a match decides the failure and the check's `anchor`;
  hint quotes the pronoun: `Found "my" — drop first-person pronouns ("I",
  "me", "my") and start bullets with the action itself: "Led a team of 8",
  not "I led my team".`
- No match anywhere → pass.

### Builder path (`scoreResume`)

Segments in priority order: summary (anchor `summary`), then visible
experience/project/involvement bullet text + descriptions (anchor
`experience`), then custom sections (anchor `experience`). Contact fields and
names are excluded (a name is not prose).

### Checker text path (`scoreResumeText`)

Two segments: text before the experience heading (anchor `summary`), the rest
(anchor `experience`) — same `experienceBlock` heading split as R208. If no
experience heading, one whole-text segment (anchor `summary`).

## Non-goals / invariants

- No scoring-formula change (denominators: checker 11→12, Builder 12→13).
- Joins priority fixes + R204 deep links via its per-failure anchor.
- Zero AI / API / schema / persistence changes; no auto-editing.

## Acceptance

- Builder: sample resume passes; summary "I am a developer" fails quoting "I"
  with anchor `summary`; bullet "Led my team…" fails with anchor `experience`;
  "MySQL" and hidden entries never trigger.
- Checker: same positive/negative matrix on pasted text; "Portland, ME" does
  not trigger.
- Priority fix + "Fix in builder →" lands on the right section.
- Score arithmetic digit-exact with new denominators; 375px; dark mode;
  R208–R210 regressions.
