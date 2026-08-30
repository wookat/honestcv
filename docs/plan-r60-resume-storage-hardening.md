# R60 — Harden resume loading against malformed localStorage data

## First-hand evidence (2026-08-30)

Found during R59 production QA (reproduced on cv.zalize.com, 1440px):
seeding `honestcv.resume` with `skills` as an array (a plausible legacy/hand-edited
shape — the LinkedIn importer works with skill arrays before joining) white-screens
the entire app: `TypeError: e.skills.trim is not a function` thrown during render,
body renders 0 characters, no recovery path short of clearing localStorage by hand.

`loadResume()` only checks `parsed.contact` truthiness and `Array.isArray(parsed.experience)`,
then spreads the raw object over `emptyResume()` — every other field's type is trusted.
`listResumeVersions()`/`listResumeHistory()` trust `v.data` entirely, so a corrupted
saved copy would crash the dashboard the same way.

Since ALL user data lives in localStorage (our core architecture), a single corrupted
key permanently bricking the product for that user is a P2 robustness gap.

## Scope

1. `src/lib/resume.ts`: new `sanitizeResume(input: unknown): Resume | null` that
   validates/coerces field-by-field against the `Resume` shape (strings coerced via
   `typeof` checks, item arrays filtered+mapped with per-field defaults, enum fields
   checked for membership, legacy `skills` string[] coerced to a joined string).
   Returns null only when there is no usable object at all.
2. `loadResume()` uses it; `listResumeVersions()`/`listResumeHistory()` sanitize each
   entry's `data` and drop entries whose data is unusable.

Not doing: schema migration/versioning machinery, cloud backup, zod dependency.

## Verification

- lint / tsc / build green.
- Prod QA: the exact R59 crash seed now renders the dashboard with the salvageable
  fields intact (name etc.) instead of a white screen; normal resumes round-trip
  byte-identical behavior; 1440+375 regression on dashboard + builder, console clean.
