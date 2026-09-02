# R228 — Assistant rewrites an existing experience bullet in place

## First-party Rezi evidence

- https://www.rezi.ai/rezi-docs/ai-resume-agent — the AI Resume Agent can
  "Rewrite and strengthen resume sections so they sound clearer and more
  impactful", with the official example prompt:
  "Can you rewrite this bullet point to sound more results-focused?"
- https://www.rezi.ai/tools — "AI Resume Agent — … Ask it to write, rewrite,
  tailor, or improve any part of your resume through a simple conversation."

A *rewrite* replaces the existing bullet. R227 (bullet proposal) can only
append a new bullet, so asking the assistant to rewrite a specific bullet
still leaves the old line in place and duplicates content.

## Current state

- `@@APPLY` supports `summary`, `skills`, and (R227) `bullet` (append-only).
- `parseAssistantAction` in `worker/prompts.ts` validates the tail; malformed
  tails degrade to prose.
- Builder `onApply` appends bullet proposals to the matched visible entry.

## Design

Extend the bullet action with an optional `replace` field naming the existing
bullet to swap out:

```ts
type AssistantAction =
  | { type: 'summary'; value: string }
  | { type: 'skills'; value: string[] }
  | { type: 'bullet'; entry: string; value: string; replace?: string }  // replace NEW
```

- Prompt: fourth tail form
  `@@APPLY {"type":"bullet","entry":"…","replace":"<the existing bullet being rewritten, exactly as it appears>","value":"<the rewritten bullet>"}` —
  used only when the user asks to rewrite/improve a specific existing bullet;
  the append form stays for brand-new bullets.
- Parser: accept optional `replace` as a non-empty string, cap 300 chars;
  absent/blank/invalid `replace` degrades to the R227 append action (never to
  prose — the bullet action itself is still valid).
- AssistantPanel: card label "Proposed rewrite · <entry>" and button
  "Replace bullet" when `replace` is present; shows the proposed text
  (unchanged card structure, applied state identical).
- Builder onApply: resolve target entry exactly as R227. If `replace` is
  present, find the first bullet in the target entry whose trimmed text
  case-insensitively equals or substring-contains (either direction) the
  `replace` text; swap it with `value` in place (position preserved). If no
  bullet matches, fall back to R227 append semantics (never lose the
  proposal, never delete anything unmatched). Hidden entries untouched.

## Invariants

- Summary/skills/append-bullet actions byte-identical behavior.
- ATS scoring, check counts, readiness strip, Fixed chips unchanged.
- `honestcv.assistantChat` schema: `replace` is an optional extra key on the
  existing optional `action` — old stored turns remain valid.
- No new endpoint or AI call; single-tail and no-fabrication rules preserved.

## Acceptance

1. "Rewrite my '<existing bullet fragment>' bullet at <company> to be more
   results-focused" → "Proposed rewrite · <entry>" card; Replace bullet swaps
   the matched bullet in place (count unchanged, position preserved), card
   flips to Applied.
2. `replace` naming a nonexistent bullet → appended instead (count +1), no
   crash, nothing deleted.
3. R227 append proposals, summary, skills all regress green.
4. Malformed tails still degrade to prose; missing `replace` behaves as R227.
5. 375px card fits; dark mode readable with existing tokens.
6. No AI calls beyond explicit assistant requests; localStorage cleanup to
   ["honestcv.clientId","honestcv.qa"].
