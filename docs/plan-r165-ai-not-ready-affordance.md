# R165 — AI writer readiness affordance (disabled state with reason before click)

## First-hand Rezi observations (2026-09-01, app.rezi.ai)

- Experience form: the AI bullet button is context-aware. On an empty entry it renders
  **disabled** with the label "AI Writer not ready"; once role/company are filled it becomes
  the enabled "✨ 10 Suggest Bullet" split button (with remaining-credits count inline and a
  "More generate options → Generate bullet with key numbers" dropdown).
- Summary tab: the AI Summary Writer submit button is labeled "AI Writer ready" once the
  required Position Highlight is populated — readiness is surfaced *on the button itself*,
  before the user clicks.
- Also re-confirmed as already covered: Education Minor/GPA fields (ours since earlier
  rounds), suggest-bullet + key-numbers variant (ours), page size Letter/A4 (ours),
  keyword triage (R154), guided summary (R163), guided skills explorer (R164).
  AI Cover Letter tab is Pro-paywalled — not auditable further without paying (deferred).

## RezUp today

`aiButton(tag, label, onClick, disabled?)` in `src/pages/Builder.tsx` renders every AI
button always-enabled (except while any AI call is busy). Preconditions are enforced only
*after* the click inside the runners (`runRewrite`, `runSuggestBullet`, `runSummaryDraft`),
which set a red `aiError` under the button. So an empty entry shows an inviting, clickable
"AI suggest a bullet" that immediately scolds the user — Rezi never lets you click it.

## Gap

No pre-click readiness affordance: users can't tell an AI action isn't usable yet, and the
guidance arrives as an error instead of as instruction.

## Plan (UI-only, zero schema/storage/API changes)

- Extend `aiButton` with an optional `notReady?: string` reason. When set (and not busy):
  - render the button disabled with `title={notReady}`;
  - render the reason below as muted xs helper text (visible on touch where `title` isn't),
    replacing the spot the post-click error would occupy — this is guidance, not an error.
- Wire the existing precondition logic (same strings the runners already use) into the
  respective buttons:
  - Experience "AI suggest a bullet" / "…with key numbers": not ready until role or company
    is non-empty (per entry).
  - "AI rewrite" bullets / "AI polish summary" / "AI clean up skills": not ready until the
    corresponding text is non-empty.
  - Summary "Draft from my resume": not ready until the resume has any experience, skills
    or education content.
  - R164 "AI suggest related skills": stays always ready (dialog accepts context-only).
- Keep the in-runner guards as backstops (unchanged strings).
- No credits-count-inline change: our free-uses count already appears via the button title
  and the quota badge; unchanged.

## QA (production, 1440 + 375)

1. Fresh empty entry: suggest-bullet buttons disabled with visible reason; typing a job
   title enables them and hides the reason.
2. Empty summary: "AI polish" disabled with reason; typing enables. Empty skills: "AI clean
   up" disabled with reason.
3. Empty resume: "Draft from my resume" disabled with reason; adding a skill enables it.
4. R164 "AI suggest related skills" remains enabled on an empty resume and opens the dialog.
5. Enabled buttons still run AI calls end-to-end (regression: suggest bullet appends).
6. 375px: helper text wraps without overflow; disabled buttons keep 40px touch height.

## Out of scope

- Rezi's inline credits count on the button face, per-section explainer videos, company
  "Is this correct?" confirmation, AI Cover Letter (paywalled).
