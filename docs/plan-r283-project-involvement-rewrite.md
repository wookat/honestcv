# R283 — AI bullet rewrite (plain + key numbers) on Projects and Involvement entries

## First-party evidence (Rezi)
- Rezi Docs "AI Bullet Points" (rezi.ai/rezi-docs/ai-bullet-points, updated 2026-07-16):
  "Navigate through the resume tabs to find the AI Bullet Point Writer in sections like:
  Work experience / Projects / Involvement" and "Edit and personalize your points using
  the Rewrite Bullet feature".
- Same guide: "Quantified bullet points: Add numbers or measurable outcomes to focus on
  results." (the key-numbers mode R282 added for Experience).

## Current HonestCV state (source-verified)
- Experience entries: 4-button AI row — Suggest a bullet / …with key numbers /
  AI rewrite bullets / …with key numbers (R282).
- Projects and Involvement entries: only per-line Fix rewrites via BulletGuidance
  (`proj-${id}-line-${idx}` / `inv-${id}-line-${idx}`). No whole-entry rewrite and no
  key-numbers mode; the section-level AI path Rezi documents is missing.

## Scope
`src/pages/Builder.tsx` only:
- After each project's BulletGuidance-adjacent controls, add a button row with
  `aiButton('proj-${p.id}', 'AI rewrite bullets', …)` and
  `aiButton('proj-${p.id}-nums', '…with key numbers', …, 'key-numbers')`, calling the
  existing `runRewrite(tag, 'bullets', text, apply, emphasis?)` on the non-empty lines of
  `p.description`, applying via cleaned `split('\n')` → `join('\n')` (same line cleanup
  as Experience: strip leading `-`/`•`, trim, drop empties).
- Same pair for involvement entries (`inv-${inv.id}` / `inv-${inv.id}-nums`).
- Not-ready reason when the description is blank: same string as Experience
  ("Write a rough bullet first — the AI rewrites your draft, it never invents experience.").

## Exclusions
- Zero worker/prompt/api changes (kind 'bullets' + emphasis already whitelisted in R282).
- No Suggest-a-bullet for projects/involvement (suggest-bullet endpoint is
  experience-shaped; separate round if evidenced).
- No schema/scoring/export/persistence changes.

## Verification
- Oracle: not needed for prompts (unchanged); UI verified in production QA.
- eslint + tsc -b + vite build green; deploy; testing-agent production QA:
  button pair present per project/involvement entry, disabled reason when empty,
  intercepted POST payloads (proj/inv plain rewrite has no emphasis key; key-numbers has
  emphasis:"key-numbers"), variant picker opens and applies back into the textarea,
  Experience row regression, 375px, zero AI quota, baseline restore.
