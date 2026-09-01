# R206 — Review step (apply / edit / regenerate) for AI bullet suggestions

## Rezi first-party evidence

- Rezi public Resume Bullet Point Generator (`rezi.ai/tools/resume-bullet-point-generator`,
  fetched 2026-09-01):
  - "Step 3 — **Apply, edit, or re-generate**. Happy with your bullet? Click
    'Apply Suggestion' to save it to your resume. Need a different tone or
    phrasing? Regenerate a new option instantly."
  - "One-click edits and regenerations — Don't like the result? Instantly
    re-generate new versions or tweak suggestions manually until they fit your
    voice perfectly."

## Current RezUp behavior

- `runSuggestBullet` (Builder, "Suggest a bullet" + "key numbers" variant on
  experience entries) appends the returned bullet **directly** to the entry's
  bullets with no review: the user cannot edit, reject, or regenerate before it
  lands — the only recourse is undo/manual deletion.
- Contrast: rewrite/summary flows already have candidate review (R186 variant
  picker), and the keyword-bullet flow has its own draft dialog.

## Gap

Rezi's public bullet writer treats the suggestion as a draft the user reviews
(apply / edit / regenerate); ours commits it immediately.

## Design (UI review step only — same endpoint, same prompt, zero schema)

1. New state `bulletSuggest: { exp: ExperienceItem; variant?: 'key-numbers'; text: string } | null`.
2. `runSuggestBullet` no longer appends; on success it opens the review dialog
   with the returned line.
3. Dialog "Suggested bullet" (reuses shadcn Dialog):
   - editable Textarea prefilled with the suggestion;
   - `Apply` — appends the (possibly edited) trimmed line to the entry bullets
     (same append semantics as today) and closes;
   - `Regenerate` — calls `aiSuggestBullet` again with the same inputs and
     replaces the textarea content (each call spends quota, as today);
   - `Cancel`/close — discards, resume untouched.
4. Empty edited text disables Apply. Works for both the plain and key-numbers
   variants; keyword-bullet dialog unchanged.

## Acceptance criteria

- Suggestion no longer lands in the resume until Apply; Cancel leaves bullets
  unchanged (localStorage verified).
- Edited text is what gets appended.
- Regenerate replaces the draft with a new AI line (payload identical shape).
- 1440 + 375, dark mode, touch targets ≥40px; zero P0–P3.
- R205 summary draft, R186 variant picker, keyword-bullet dialog regressions.

## Non-goals

- No prompt/endpoint changes, no multi-candidate list, no schema/persistence changes.
