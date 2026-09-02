# R229 — Make the assistant reliably emit @@APPLY for edit requests

## First-party evidence

- Rezi AI Resume Agent doc (https://www.rezi.ai/rezi-docs/ai-resume-agent):
  the agent's core promise is actionable edits — "Rewrite and strengthen
  resume sections", "Suggest stronger bullet points and professional
  summaries" — reviewed and applied by the user, not prose advice.
- R228 production QA (first-party runtime evidence, qa-r228-plan.md): the
  live model, given the plain phrasing "Rewrite my bullet '…' at Nova Retail
  to be more results-focused", returned good prose but NO @@APPLY tail
  (action: null), so no Apply card appeared. Rezi's doc phrasing ("Can you
  rewrite this bullet point to sound more results-focused? …") did emit the
  tail. Users cannot be expected to know the magic phrasing.

## Gap

The prompt frames the tail as an "Exception", listing when it is *allowed*
but never stating it is *required* when the request qualifies. The model
therefore sometimes answers a qualifying rewrite request with prose only.

## Design (prompt-only; no schema, parser, or client change)

In `buildAssistantMessages` (worker/prompts.ts), strengthen the action
protocol wording:

- Change the allowance into an obligation: when the user's request clearly
  asks for a summary rewrite, skills to add, or an experience bullet to be
  written/rewritten/strengthened, the reply MUST end with exactly one
  @@APPLY tail — answering such a request with prose alone is an error.
- Keep every existing restriction: only for qualifying requests, fully
  grounded in the resume, exactly one tail, never present the change as
  already made.

No other file changes. Malformed-tail degradation, quotas, endpoints,
scoring, and UI are untouched.

## Acceptance

1. Plain phrasing "Rewrite my bullet '<verbatim>' at <company> to be more
   results-focused" emits a bullet action with replace (Apply card shown).
2. Plain "write a stronger bullet for my <company> role" emits an append
   bullet action.
3. A non-edit question ("how do I improve my ATS score?") still gets prose
   with no tail.
4. Summary/skills requests still emit their tails; single-tail invariant
   holds; malformed tails still degrade to prose.
5. Zero client-bundle change expected (worker-only deploy).
