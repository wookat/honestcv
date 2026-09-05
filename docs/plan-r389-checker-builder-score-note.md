# R389 — honest note where the checker and builder scores diverge

## Context (from R388 SOP-10 audit, banked P2)

The same resume + JD can score differently on `/ats-checker` and in the Builder:

- `scoreResumeText` (checker) scores the raw pasted text with text-heuristic checks only.
- `scoreResume` (builder) scores the structured resume with additional structured checks
  (`Skills grouped into categories`, `Locations on each entry`, contact completeness,
  page count) plus `targetRole` filtering and `ignoredKeywords`.
- The "Fix it in the builder" handoff runs `parseResumeText`, and parse loss can also
  move the keyword sub-score.

Local probe (`.tmp-smoke/r388_probe.ts`): identical keyword match (100), structure
86 vs 78 → 96 vs 93. QA's minimal seed showed 100 vs 67 (most text checks n/a on a
tiny text → easy 100; builder's always-applicable structured checks fail → 67).

## Decision

Both numbers are "correct" for what each surface can see; the defect is that the user
is promised continuity ("resume & job carried over") and then sees a different score
with no explanation. Full unification (shared check set, or checker scoring the parsed
resume) changes the public checker's semantics and depends on parser fidelity for
arbitrary real-world text — that stays banked as its own design round.

This round ships the honest, zero-risk part: tell the user *before* the handoff that
the builder re-checks the imported resume more deeply, so the score can change.

## Change (minimal)

`src/pages/AtsChecker.tsx` only — one sentence under the sub-score row when a report
is shown:

> Heads up: the builder re-checks the imported resume with deeper structured checks
> (grouped skills, entry locations, contact fields), so its score can differ from
> this one.

## Non-goals

- No change to `scoreResumeText` / `scoreResume` math.
- No parser changes.
- Scorer unification remains banked.
