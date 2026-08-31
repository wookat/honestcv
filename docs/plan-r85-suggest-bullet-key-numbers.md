# R85 — "Key numbers" variant on Suggest a bullet

## Evidence

- First-hand, ~/audit-r1/shots-r82/rezi-suggest-bullet-dropdown-key-numbers.png:
  Rezi's SUGGEST BULLET button carries a "More generate options" dropdown with
  **"Generate bullet with key numbers"** — a second AI path that drafts a
  quantified bullet. Rezi's own inline tip: "Aim for a balanced mix of
  descriptive and key number bullet points."
- HonestCV R81 has one Suggest-a-bullet mode only; our own scoring (quantified
  impact, R79 no-metric check) pushes users toward numbered bullets, but the AI
  draft path has no way to ask for one.

## Plan (small batch)

1. `worker/prompts.ts`: `buildSuggestBulletMessages(role, company, bullets,
   resumeText, variant?: 'key-numbers')` — variant appends system instructions:
   the bullet MUST lead with a measurable outcome, and since real numbers are
   unknown, every figure must be a bracketed placeholder (`[add %]`,
   `[add $ amount]`, `[add N]`); never invent numbers (honesty rule unchanged).
2. `worker/index.ts` `/api/ai/suggest-bullet`: accept optional
   `variant?: 'key-numbers'` (whitelist; anything else ignored), pass through.
   Quota flow untouched (peek → LLM → consume on success).
3. `src/lib/api.ts` `aiSuggestBullet`: pass `variant`.
4. `Builder.tsx`: next to each entry's "Suggest a bullet" button add a second
   compact AI button `exp-<id>-suggest-nums` "…with key numbers" (same disabled
   rule role+company empty, same append path). No dropdown — two flat buttons
   are simpler and more touch-friendly than Rezi's hover dropdown.

Zero new storage; one existing endpoint extended; each click still costs
exactly one quota unit.

## Non-goals

Multi-candidate picker, per-bullet tone options, Rezi's hover dropdown UI,
auto-detecting which variant to use.

## Verification

Local: lint / tsc -b / build / git diff --check.
Production QA (budget: 1 real AI call for the new variant): key-numbers click →
exactly one POST with variant:'key-numbers', returned bullet contains bracketed
numeric placeholder(s), quota decrements by 1; plain Suggest a bullet regression
(DOM presence; already runtime-proven in R81); disabled state on empty entries;
375px touch targets ≥40px, no overflow; console clean; localStorage restored.
