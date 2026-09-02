# R227 — Assistant proposes experience bullets with one-click Apply

## First-party Rezi evidence

`https://www.rezi.ai/rezi-docs/ai-resume-agent` (fetched 2026-08-31):

- "Here are some ways the AI Resume Agent can help: … Rewrite and strengthen
  resume sections so they sound clearer and more impactful … Suggest stronger
  bullet points and professional summaries"
- Example prompts Rezi tells users to try: "Give me stronger bullet point
  ideas for my work experience." and "Can you rewrite this bullet point to
  sound more results-focused?"
- "you can review the suggestions while editing your resume side-by-side"

`https://www.rezi.ai/tools` — "AI Resume Agent: Your personal resume
assistant. Ask it to write, rewrite, tailor, or improve any part of your
resume through a simple conversation."

## Current HonestCV gap

The Resume assistant (AssistantPanel, R? chat) can propose exactly two
apply-able edits via the `@@APPLY` tail: a summary rewrite and a skills list.
When a user asks it for a stronger bullet — one of Rezi's own headline example
prompts — the assistant can only answer in prose; the user must retype the
bullet by hand. Bullet writing is the assistant's most-requested concrete
edit surface and the only major one without Apply plumbing.

## Design (pure extension, no scoring change)

New action variant shared by worker and client:

```ts
type AssistantAction =
  | { type: 'summary'; value: string }
  | { type: 'skills'; value: string[] }
  | { type: 'bullet'; entry: string; value: string }   // NEW
```

- Prompt: third `@@APPLY` form documented in the system prompt —
  `@@APPLY {"type":"bullet","entry":"<company or role exactly as it appears in the resume>","value":"<the bullet, grounded in the resume>"}`
  Only when the user clearly asks for a bullet to be written/rewritten/
  strengthened for their experience; same single-tail and no-fabrication
  rules as summary/skills.
- `parseAssistantAction`: validates `entry` (non-empty string, ≤80 chars) and
  `value` (non-empty string, ≤300 chars); malformed tail still degrades to
  plain text.
- AssistantPanel: `validAction` accepts the new shape; proposal card shows
  "Proposed bullet · <entry>" with an "Add bullet" Apply button; applied state
  unchanged.
- Builder `onApply`: resolve target = first non-hidden experience entry whose
  company or role matches `entry` (case-insensitive, substring either way);
  fallback to the first non-hidden entry; append `value` to its `bullets`
  (same append semantics as `insertKeywordBullet`). No-op if the resume has
  no visible experience entry.

## Acceptance

1. "Write a stronger bullet for my Acme role" → reply ends with a bullet
   proposal card naming the Acme entry; Apply appends the bullet to that entry
   (visible in editor + preview); card flips to "Applied to your resume".
2. Entry mismatch (LLM returns an entry string not in the resume) → bullet
   lands on the first visible experience entry (never crashes, never invents
   an entry).
3. Summary and skills proposals unchanged (regression).
4. Malformed/duplicate tails stripped as before; reply renders as prose.
5. Zero scoring/persistence change: ATS score, check counts (24/22),
   readiness strip, chat localStorage schema (extra optional field only on new
   messages) all unchanged.
6. 375px: proposal card fits; dark mode: card uses existing border/muted
   tokens (no new colors).
