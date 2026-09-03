# R319 — per-option feedback in the AI rewrite picker steers Regenerate

## Evidence (first-party)

- Rezi changelog "Refined AI Rewrite Feedback: clearer options and feedback
  buttons in the editor" — rewrite options carry feedback controls, and that
  feedback shapes what the editor offers next.
- Our variant picker (Pick a rewrite / Pick a summary) already shows three
  labeled options, diff highlights, Keep-my-original and Regenerate — but
  Regenerate re-runs the identical request. The model routinely returns the
  same three takes; the user has no way to say "not these".

## Current behavior (production, confirmed in source)

- `runRewrite` / `runSummaryDraft` build the payload from the resume state
  only; `variantPick.regenerate` closes over the same arguments, so a
  regenerate sends a byte-identical request.
- No feedback affordance exists on option cards.

## Change

1. `worker/prompts.ts` — `buildRewriteMessages` and
   `buildSummaryDraftMessages` accept optional `avoid: string[]`; when
   non-empty, append a user-message part:
   "The user rejected these earlier versions — write clearly different takes
   and do not reuse their phrasing:" followed by quoted rejected texts.
   With no feedback the prompt stays byte-identical (oracle-checked).
2. `worker/index.ts` — `/api/ai/rewrite` and `/api/ai/summary-draft` accept
   optional `avoid`: must be an array; keep only non-empty strings, trim,
   cap each at 400 chars, keep at most 6.
3. `src/lib/api.ts` — `aiRewrite` gains optional `avoid`; `aiSummaryDraft`
   input gains optional `avoid`. The key is only present when non-empty, so
   default payloads stay byte-identical.
4. `src/pages/Builder.tsx` — `variantPick` gains `rejected: number[]` and
   `regenerate?: (avoid?: string[]) => void`. Each option card gets a
   "Not helpful" toggle (thumbs-down); rejected cards dim and can't be
   applied until untoggled. Regenerate passes the rejected texts (also
   accumulating across rounds within the open dialog is out of scope — only
   the currently-marked options are sent).

## Verification

- Oracle (tsx): prompts with no avoid are byte-identical to before; with
  avoid the extra part contains each rejected text; worker-side cap/trim.
- tsc, eslint on changed files, build.
- Production QA (AI intercepted): mark option 2 as not helpful → Regenerate
  payload contains `avoid:[<option2 text>]` and nothing else changed vs the
  baseline payload; no feedback → payload byte-identical to pre-R319
  baseline; rejected card not applyable; 375px overflow; dark mode.
