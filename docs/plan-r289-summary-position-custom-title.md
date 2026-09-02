# R289 — Type a custom title in the guided summary position picker

## Evidence (first-party Rezi)

- AI Resume Summary Writer guide (https://www.rezi.ai/rezi-docs/ai-resume-summary-writer-explained),
  step 2 "Choose a role to highlight":
  > "You can either select a past role from your resume or turn off 'from resume' and type in
  > the job title you're applying for. The second option is handy if you're switching careers
  > or don't have direct experience yet. It also prevents conflicting job titles in your summary."
  and step 4: "You can also swap out skills or change the role before going again."

## Current gap (verified in src/pages/Builder.tsx)

The R163 summary setup dialog renders the Position highlight as either a `<select>` of
`summaryPositionOptions` (target role + experience roles) **or** a free-text `<Input>` — but only
when the options list is empty. With any roles present there is no way to type a different title
(career changers are exactly the users Rezi calls out).

Bonus defect: the dialog opens with `position: aiTargetRole(resume)`, which appends the
experience level and/or target company (e.g. "Engineer (Mid level) at Acme"). That string is
usually **not** in `summaryPositionOptions`, so the controlled `<select>` renders with a value
matching no option (browser shows the first option / blank) while the submitted state is the
annotated string — display and payload disagree.

## Change (Builder.tsx only)

- `summaryDraftSetup` gains `custom: boolean`.
- When options exist, the select gets a final sentinel option "Type a different title…";
  choosing it switches to the existing free-text Input (prefilled with the current position,
  select-all focus); a small "Pick from my resume" link switches back.
- Open logic: if `aiTargetRole(resume)` matches an option (it rarely does) select it, otherwise
  open directly in custom mode prefilled with `aiTargetRole(resume)` — fixing the mismatch.
- R286 "Adjust role & skills" reopens with the stored position: same rule (in options → select,
  else custom prefilled). `runSummaryDraft` payload semantics unchanged: trimmed position, falls
  back to `aiTargetRole(resume)` when blank.

No worker/prompt/schema/scoring/export/persistence changes.

## QA (production)

1. Seeded resume with target role + level: open "Draft from my resume" → dialog opens in custom
   mode showing the exact `aiTargetRole` string (no blank select).
2. Switch to "Pick from my resume" → select lists target role + experience roles; picking one and
   submitting sends that exact string as `role` in the intercepted /api/ai/assistant-family POST.
3. Sentinel "Type a different title…" → Input appears prefilled; typing "Product Manager" and
   submitting sends role "Product Manager" (pre-network interception, fulfilled with fake drafts).
4. Blank custom input submits with `aiTargetRole` fallback (payload assertion).
5. R286 Adjust role & skills reopens with the previously used position in the right mode.
6. 375px: dialog controls fit, no page-level overflow. localStorage/theme restored; zero real AI.
