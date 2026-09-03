# R302 — tone selection for cover and resignation letters

## Evidence

- Rezi first-party (https://www.rezi.ai/tools): "AI Resignation Letter Generator — generate
  a professional resignation letter in the right tone — formal, friendly, or somewhere in
  between." Tone is a first-class input of Rezi's letter tools.
- Current source: `buildCoverLetterMessages` / `buildResignationLetterMessages`
  (worker/prompts.ts) have no tone input; the letter dialog (Builder.tsx) offers company /
  role / addressee / highlights / last day / reason, but no way to steer register. Users
  wanting a warmer or more formal letter must hand-edit the output.

## Design

- Builder.tsx letter dialog: a `Tone` select for `kind === 'cover'` and
  `kind === 'resignation'` with three options: Balanced (default), Formal, Friendly.
  Balanced sends no `tone` key — payloads for existing flows stay byte-identical.
- src/lib/api.ts: optional `tone?: 'formal' | 'friendly'` on aiCoverLetter /
  aiResignationLetter (undefined ⇒ key omitted from JSON).
- worker/index.ts: whitelist-parse `tone` (only 'formal' | 'friendly' pass through).
- worker/prompts.ts: both builders take optional `tone`; when set, one extra system-prompt
  sentence steering register; when absent, prompts byte-identical (oracle-verified).

## Out of scope

- Signature upload (Rezi step 6) — deferred; needs asset handling design.
- Interview brief tone; template-insert tone variants.

## QA plan

Production, zero AI quota (intercept pre-network): default payloads byte-identical to
current baseline; Formal/Friendly add exactly `"tone":"formal"|"friendly"`; select present
in both letter kinds, absent for interview brief; 375px strict scrollWidth; state reset on
dialog close/reopen; localStorage/theme restored.
