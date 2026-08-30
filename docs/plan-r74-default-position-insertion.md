# R74 — Insert new built-in sections at their default position for legacy resumes

## Evidence

Seven consecutive production QA rounds (R68 Involvement → R73 Military service) confirmed the
same behavior on resumes with a previously saved `sectionOrder`: every newly shipped built-in
section is appended to the **end** of the resume instead of its intended default position
(e.g. Coursework should follow Education; Military service should follow References near the
other credential sections). Each round disclosed this as a deferred one-time decision.

Rezi reference: sections enabled later from its ··· menu appear at a sensible default position
in the document, not dumped at the bottom.

Why it happens: `orderedSectionKeys` keeps the stored order, then appends any valid key not yet
present (`for (const key of valid) if (!seen.has(key)) order.push(key)`). Because `sanitizeResume`
persists the computed order back into `sectionOrder`, the appended position sticks forever for
existing users unless they manually drag the section.

## Decision

Missing **built-in** keys are spliced into the stored order at their default position: insert
immediately after the nearest *preceding* `SECTION_KEYS` neighbor that is present in the stored
order (falling back to the front when none is). Missing custom-section keys keep the existing
append behavior (they have no canonical position).

Properties:
- Only affects keys the user has never seen/persisted — any key already in the stored order
  (including ones previously appended and possibly hand-placed) keeps its exact position.
- A user's manual ordering of existing sections is never rearranged.
- Fresh resumes are unchanged (`emptyResume` already uses the full default order).

## Scope

- `orderedSectionKeys` in `src/lib/resume.ts` only; all five output paths and the Builder
  Section order UI already consume it.
- Non-goals: migrating orders already persisted with sections at the end (users may have
  accepted/adjusted them; silently moving sections they can see would be worse), any UI change.
