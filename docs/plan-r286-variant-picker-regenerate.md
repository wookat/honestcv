# R286 — Regenerate inside the variant picker (summary + rewrites)

## First-party Rezi evidence

- Rezi User Docs — AI Resume Summary Writer (rezi.ai/rezi-docs/ai-resume-summary-writer-explained, updated 2026-08-07):
  - "Not quite right on the first try? No problem. You can regenerate as many times as you want until it feels like *your* voice."
  - Step 4: "Click 'AI Writer Ready' and watch your summary appear. Don't love it on the first try? Hit regenerate and try again (as many times as you like). **You can also swap out skills or change the role before going again.**"
- Rezi User Docs — AI Keyword Targeting: for missing-keyword bullets you can "accept the suggestion, **rewrite it for more options**, or tweak the wording" (R206 already covers regenerate for keyword bullets; the variant picker is the remaining surface without it).

## Current behavior (source-verified)

- `src/pages/Builder.tsx` `variantPick` state `{title, candidates, original?, apply}` renders the "Pick a summary / Pick a rewrite" dialog with 3 candidates + "Keep my original". There is **no regenerate** — to get new options the user must close the dialog and click the original AI button again (spending a click-path round trip and losing context).
- The summary path (`runSummaryDraft`) additionally has a setup dialog (`summaryDraftSetup`, position + up to 5 highlight skills, R163) — but once the picker is open there is no way back to adjust role/skills without dismissing everything.
- The suggest-bullet review dialog (R206/R284) already has a Regenerate button — the variant picker is the last AI review surface without one.

## Selected gap

Add regenerate (and, for the summary path, "adjust role & skills") to the variant-picker dialog.

## Design

- Extend `variantPick` state with optional `regenerate?: () => void` and `adjust?: () => void`.
- `runRewrite` passes `regenerate: () => void runRewrite(tag, kind, text, apply, emphasis)` (same args — fresh candidates replace the dialog contents). It already keeps `tag`; store it in `variantPick.tag` so the dialog can show a busy label while `aiBusy === tag` and surface `aiError` when `aiErrorTag === tag`.
- `runSummaryDraft` passes `regenerate: () => void runSummaryDraft(position, highlights)` and `adjust: () => setSummaryDraftSetup({position, picked: highlights})` (reopens the R163 setup dialog prefilled; picker closes).
- Dialog footer: `Regenerate options` button (shows `Writing…` while busy, disabled during busy) + optional `Adjust role & skills` text button when `adjust` present. Inline error line when the regenerate call fails (dialog stays open, old candidates remain usable).
- No worker/prompt/api/schema/scoring/export/persistence changes — pure Builder UI reuse of existing runners (each regenerate costs one AI call exactly like clicking the original button again).

## Exclusions

- No saved-drafts persistence ("saves your drafts" marketing copy) — candidate for a later round.
- No changes to suggest-bullet dialog, keyword triage, quotas, prompts, or payloads.

## QA (production, zero AI quota via CDP Fetch interception)

1. Summary picker: Draft my summary → fulfillRequest fake `{texts:[3], freeRemaining:N}` → picker shows 3 options + Regenerate + Adjust role & skills. Click Regenerate → new POST /api/ai/summary-draft intercepted with identical payload; fulfill with different texts → candidates replaced in the open dialog.
2. Adjust role & skills → picker closes, setup dialog reopens prefilled with the same position/skills.
3. Rewrite picker (summary rewrite or bullets rewrite): Regenerate re-POSTs /api/ai/rewrite with identical payload; failRequest → inline error shown, dialog stays open with old candidates.
4. Apply/Keep-my-original regression; 375px layout; localStorage/theme cleanup (incl. honestcv.resumeHistory).
