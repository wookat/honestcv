# R163 QA plan — "Draft my summary" setup dialog (PR #378, bundles index-XBrxdkyj.js / Builder-BON1Z-I7.js)

Code evidence (diff c3ff5d9..55e7418, src/pages/Builder.tsx):
- Empty-summary AI button "Draft from my resume" (~L2104) now opens `summaryDraftSetup` dialog instead of calling runSummaryDraft directly; initial position = aiTargetRole(resume).
- Dialog (~L6366): title "Draft my summary"; `#summary-draft-position` is a `<select>` of `summaryPositionOptions` = [targetRole, ...experience roles] trimmed/deduped case-insensitively; if no options → free-text `<Input>`.
- Skill chips: `summarySkillOptions` = skillLines text split on ',', trimmed, deduped ci, ≤40 chars, max 18; buttons `aria-pressed`, unselected chips `disabled` once 5 picked.
- "Write 3 drafts" button closes dialog, calls `runSummaryDraft(position, picked)` → aiSummaryDraft with `highlights` (undefined when none) → existing "Pick a summary" 3-variant dialog; freeRemaining updates `freeLeft` badge ("N free AI uses left").
- Non-empty summary: unchanged "AI polish summary" path (no dialog).
- worker/prompts.ts: highlights injected as "Emphasize these skills…" user-message line.

## I1 Bundles
Cache-busted fresh load → exactly index-XBrxdkyj.js + Builder-BON1Z-I7.js; baseline storage clean.

## I2 Dialog opens with correct inputs (1440) — primary
Seed standard fixture with summary='' and targetRole set. Note freeLeft badge value N before. Click "Draft from my resume" in Summary section.
PASS iff: dialog titled "Draft my summary" appears (screenshot, NOT an immediate AI call); select #summary-draft-position options = [targetRole, distinct experience roles in order, deduped]; chips exactly = comma-split deduped skills (≤18); no chip pressed initially.

## I3 Chip limit
Click 5 chips → PASS iff remaining unselected chips are disabled (opacity-40, disabled attr); unpick one → re-enabled. Leave exactly 2 chips picked (record which).

## I4 Draft with 2 chips → variants → fill
Click "Write 3 drafts". PASS iff dialog closes, AI runs, "Pick a summary" dialog shows 3 variants; ≥1 chosen skill appears across the variants (AI leniency per task); choosing variant 2 fills the summary textarea with that exact text; freeLeft badge decremented vs N.

## I5 No-chips regression + non-empty summary
Clear summary again; reopen dialog, pick 0 chips, Write 3 drafts → 3 variants still returned (old behavior). With summary non-empty: Summary section shows "AI polish summary" button and clicking it does NOT open the setup dialog.

## I6 Mobile 375
Emulate 375, empty summary, open dialog → PASS iff dialog fits viewport (right edge ≤375), chips wrap to multiple rows, `document.documentElement.scrollWidth ≤ 375`. Screenshot. (No AI call on mobile.)

## I7 Regression (desktop)
R162 gauge still on Resume strength card (role="img" + visible arc); R152 sticky chip present and labeled.

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]; fresh desktop tab; AI quota use is allowed this round; no share/payment/export/deletion.
