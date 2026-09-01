# R204 — Per-fix deep links from the ATS checker into the builder

## Rezi first-party evidence

- Rezi public Resume Checker page (`rezi.ai/tools/resume-checker`, "Review" step,
  fetched 2026-08-31): "View a clear report with prioritized fixes … **Click any
  suggestion to apply changes in seconds.**" — every suggestion in Rezi's checker
  report is actionable, not inert text.
- Same page, "ATS-compatibility guardrails": "Fix them instantly with clear,
  automated recommendations."

## Current RezUp behavior

- R203 added the "Priority fixes" panel to `/ats-checker`, but every fix is
  plain text. The only actionable path is the single global
  "Fix it in the builder" button at the bottom of the result card.
- In the Builder's Score breakdown (R176), each fix already has a `Fix →`
  button that jumps to the anchored section via `jumpToSection(anchor)`.

## Gap

A checker user who sees "Add a LinkedIn or website link — …" must click the
generic builder button and then hunt for the right section themselves. Rezi's
checker lets you click the suggestion itself.

## Design (deterministic, display/navigation only)

1. `Builder.tsx`: support a `?jump=<anchor>` deep link (same pattern as the
   existing `?template=`, `?doc=`, `?example=` params): on mount, if the value
   is a known section anchor, strip the param and `jumpToSection(anchor)` after
   the sections render (rAF/timeout), which also auto-adds optional sections.
2. `AtsChecker.tsx`: `openInBuilder(anchor?)` appends `?jump=<anchor>` to the
   navigate target. Each Priority-fix row gets a `Fix →` button (same style as
   the Builder dialog, ≥40px touch target):
   - structure/writing fixes use `f.anchor`;
   - the missing-keywords fix (no anchor) deep-links to the `target` anchor
     (Target job panel), where keyword chips + AI bullets live;
   - fixes with neither anchor nor a mappable target render no button.
   Clicking reuses the existing carry-over semantics (confirm-replace prompt,
   JD carried over) — no new persistence.

## Acceptance criteria

- Clicking `Fix →` on a structure fix lands in the builder scrolled to the
  anchored section, with the pasted resume + JD carried over (same confirm
  semantics as the global button).
- Keyword fix's `Fix →` lands on the Target job panel.
- `?jump=` with an unknown value is ignored and stripped; no crash.
- Global "Fix it in the builder" button unchanged.
- 1440 + 375, dark mode, no overflow; zero AI calls; scoring untouched.

## Non-goals

- No auto-applying of fixes, no new scoring, no schema/API changes.
