# R41 — Assistant "Apply" actions (explicit user-confirmed writes)

Date: 2026-08-30 · Round: R41 · Status: planned

## Gap (first-hand evidence)

The R39 logged-in audit of Rezi's AI Resume Agent (`~/audit-r1/shots-r39/`,
docs/plan-r39-ai-agent-research.md) showed the agent is not advice-only: it
executes real tools against the workspace ("I'll bring it into your Rezi
workspace so we can work on your summary"). Our R40 assistant (PR #253)
deliberately shipped advice-only, deferring writes to a round with an explicit
user confirmation step. This round is that step.

## Decision

The assistant may *propose* a concrete edit alongside its reply; nothing is
written until the user clicks **Apply**. MVP supports the two highest-value,
lowest-risk edit types, both grounded in facts already present in the resume:

1. `summary` — replace the professional summary.
2. `skills` — append a list of skills (deduped, case-insensitive).

Explicitly out of scope: experience/education/bullet edits (higher fabrication
risk, need per-item targeting), multi-step agent plans, attachments, streaming.

## Architecture

- Worker (`/api/ai/assistant`): system prompt gains an optional structured
  tail — when (and only when) the user asks for a rewrite/draft the model may
  end its reply with a single line `@@APPLY {"type":"summary","value":"…"}` or
  `@@APPLY {"type":"skills","value":["…"]}`. The Worker parses/validates the
  tail (type whitelist, summary ≤ 700 chars, ≤ 12 skills each ≤ 40 chars),
  strips it from the visible text, and returns it as a separate `action`
  field; a malformed tail is dropped (reply still returned, no error).
- API (`src/lib/api.ts`): `aiAssistant()` return type gains
  `action?: { type: 'summary'; value: string } | { type: 'skills'; value: string[] }`.
- UI (`AssistantPanel`): an assistant message carrying an action renders an
  "Apply" card under the bubble — preview of the proposed summary/skills +
  `Apply to resume` button + "applied" state after click. Applying calls an
  `onApply(action)` prop; Builder implements it with the existing `setResume`
  (summary replace / skills append with dedupe), so the edit is undoable via
  the existing Undo/History machinery. Chat persistence stores the action with
  the message so Apply survives reload; an action can be applied once.

## Safety / honesty

- No write without an explicit Apply click; declining costs nothing.
- Same grounding rules as R40 (no invented facts; placeholders for unknowns).
- Quota semantics unchanged: one successful assistant call = one credit,
  Apply itself is free and local.

## QA (production, 1440 + 375)

1. "Rewrite my summary" → reply + Apply card; Apply replaces summary in the
   editor; Ctrl+Z restores the old one.
2. "Suggest skills to add" → Apply appends deduped skills.
3. Advice-only questions produce no Apply card; malformed tails degrade to
   plain replies.
4. Reload keeps unapplied cards working; applied cards stay marked applied.
5. Regression: R40 chat flows, quota decrement, Clear chat, 375px layout.
