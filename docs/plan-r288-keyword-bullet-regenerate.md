# R288 — Regenerate option in the keyword bullet draft dialog

## Evidence (first-party Rezi)

- AI Keyword Targeting guide (https://www.rezi.ai/rezi-docs/ai-keyword-targeting-explained),
  step 4 "Add keywords to your resume":
  > "For each missing keyword, Rezi gives you the option to generate a new bullet point that
  > naturally includes the term. You can accept the suggestion, **rewrite it for more options**,
  > or tweak the wording until it feels right."
- Same pattern Rezi documents for the Summary Writer ("regenerate as many times as you want"),
  which R286 already brought to the variant picker.

## Current HonestCV behavior

`KeywordBulletDialog` (Builder.tsx) — the "Yes — draft a bullet" flow in keyword triage —
drafts exactly one bullet via `aiKeywordBullet`. Once drafted, the only options are: edit the
textarea manually, `Add bullet`, or `Discard`. There is no way to ask for another option
without closing the dialog and restarting (which also re-picks the preselected entry and
loses the flow). Every other AI drafting surface (variant picker since R286, bullet-suggest
review since R206) already offers regeneration.

## Change

Builder.tsx only, inside `KeywordBulletDialog`:

- In the drafted state, add an outline button `Draft another option` that re-runs the same
  `run()` (byte-identical payload: same keyword/resumeText/jobDescription/role/language).
- Busy state: spinner + `Drafting…`, button disabled while busy; `Add bullet` also disabled
  while a redraft is in flight.
- On success the textarea content is replaced with the fresh draft; on failure the inline
  error shows and the previous draft stays editable/insertable (run() only calls setText on
  success — existing semantics).
- Hidden once `inserted` (same as the Add/Discard row).

No worker/prompt/schema/scoring/export/persistence changes. The request path and payload are
exactly the existing `aiKeywordBullet` call.

## Production QA cases

1. Seed resume + JD → triage "Yes — draft a bullet" → draft → `Draft another option` visible.
2. Regenerate POST payload byte-identical to the first (CDP Fetch interception, fulfilled with
   a fake draft — zero real quota); textarea replaced in place, entry select untouched.
3. Failure path: fail the second request pre-network → inline error, previous draft still
   editable and `Add bullet` still works.
4. `Add bullet` after a regenerate inserts the current text into the selected entry;
   button row (incl. regenerate) replaced by "Added to your resume."
5. Manual-edit-then-regenerate replaces the edited text (expected — same as variant picker).
6. 375px: dialog buttons wrap without page-level horizontal overflow.
7. localStorage/theme restored; all AI traffic intercepted before the network.
