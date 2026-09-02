# R282 — "Rewrite with key numbers" for experience bullets

## First-party Rezi evidence

- Rezi docs, *Experience* guide (rezi.ai/rezi-docs/the-resume-experience-section-best-practices):
  - "try Rezi's AI Bullet Point Writer. Just select **Generate Bullet** to create a standard
    accomplishment, or choose **Generate Bullet with Key Numbers** to get one that highlights
    measurable results."
  - "You can also improve bullet points you've already written. Highlight an existing point and
    select **Rewrite Bullet** to generate alternative versions with stronger wording and relevant
    keywords. **If you want to emphasize results, use the dropdown menu to rewrite the bullet with
    key numbers.**"

## Current HonestCV state (verified in source)

- Generate parity exists: `/api/ai/suggest-bullet` accepts `variant: 'key-numbers'`
  (worker/prompts.ts `buildSuggestBulletMessages`), and the Builder renders both
  "Suggest a bullet" and "…with key numbers" buttons per experience entry.
- Rewrite parity is missing: `/api/ai/rewrite` (`buildRewriteMessages`) has no key-numbers
  mode. The per-entry "AI rewrite bullets" action always produces the same 3 emphases
  (concise / impact / keyword). There is no way to ask the rewrite to emphasize measurable
  results, even though Rezi documents exactly that dropdown.

## Scope

1. `worker/prompts.ts` — `buildRewriteMessages` gains `emphasis?: 'key-numbers'`. For the
   bullets kind it appends a strict instruction: every rewritten bullet must lead with a
   measurable outcome; numbers already present in the input are reused, missing figures MUST be
   bracketed placeholders (`[add %]`, `[add $ amount]`, `[add number]`) — never invented
   (same honesty rule as the suggest-bullet key-numbers variant).
2. `worker/index.ts` — `/api/ai/rewrite` parses `emphasis` (whitelisted to `'key-numbers'`,
   bullets kind only) and threads it through. Quota/entitlement handling unchanged.
3. `src/lib/api.ts` — `aiRewrite` gains optional `emphasis`, sent in the POST body.
4. `src/pages/Builder.tsx` — `runRewrite` gains optional `emphasis`; each experience entry gets a
   "…with key numbers" button right after "AI rewrite bullets" (same pattern as the existing
   suggest pair). Existing variant-picker review flow (pick / keep original) reused as-is.

## Explicitly out of scope

- No schema / persistence / scoring / export changes.
- Summary and skills rewrites keep their existing prompts (emphasis ignored for them).
- Per-line "Fix" rewrites and projects/involvement rewrites unchanged (Rezi's dropdown is
  documented on the experience bullet writer).

## Verification

- tsx oracle on `buildRewriteMessages`: default output byte-identical to before; key-numbers
  emphasis adds the instruction once for bullets, never for summary/skills; variants line still
  present; placeholder-honesty wording included.
- eslint + tsc -b + vite build green; deploy via `npm run deploy`.
- Production QA (testing agent): button pair renders per entry, gating matches the plain rewrite
  button (disabled without a rough bullet), no AI quota consumed during QA (UI-affordance +
  request-construction verified locally by oracle, not by live LLM calls).
