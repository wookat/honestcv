# R264 — Recommended templates based on resume content

## Rezi evidence (first-party)

- Finish Up guide (https://www.rezi.ai/rezi-docs/the-finish-up-tab, updated Aug 3, 2026),
  step 2 "Choose your resume template": "The platform will **recommend ATS-friendly
  templates based on your resume content**, but you can browse the full library and
  choose whichever style best fits your needs."
- Same guide: template categories (Simple/Modern/Creative/Compact), saved favorites,
  recently viewed, side-by-side compare — HonestCV already has favorites (R132),
  recents (R132) and compare (R237). The one missing capability is the
  content-based recommendation itself.

## Gap

HonestCV's template picker offers style filters, saved, recent and compare, but is
entirely neutral: nothing looks at the user's actual resume (level, length, role)
to suggest where to start. Since R262 the resume knows the experience level, since
forever it knows its plain-text density and target role — all the signals for a
deterministic, local recommendation already exist.

## Design (smallest change)

New pure helpers in `src/lib/templates.ts` (no schema, storage, worker, scoring or
AI changes):

```ts
export interface TemplateRecommendation { id: string; reason: string }
export function recommendedTemplates(r: Resume): TemplateRecommendation[]
```

Deterministic rules, in priority order (dedup by id, drop the currently selected
`r.templateId`, cap 3, return [] when nothing applies):

1. Dense resume (plain-text word count ≥ 450 via `resumeToPlainText`):
   - `compact` — "fits more content on the page".
   - `circuit` when the role is technical — "ruled entries built for dense technical resumes".
     Technical = `targetRole` (fallback: first visible experience role) matches the
     same engineer-family regex used by bullet starters:
     `/engineer|developer|programmer|swe|devops|sre|architect/i`.
2. Experience level (R262 tiers):
   - `internship` / `entry` → `classic` ("a safe, traditional look for a first resume"),
     `minimal` ("whitespace-first — keeps a shorter resume from looking empty").
   - `associate` / `junior` / `mid` / `senior` → `modern` ("clean sans-serif that suits
     most industries"), plus `engineer` when technical ("no-nonsense sans built for
     technical resumes").
   - `director` / `executive` → `executive` ("understated and formal for senior
     roles"), `corporate` ("formal serif with a commanding header").
   - Auto ('') → no level-based picks (density/technical picks may still apply).

Builder template picker UI (`src/pages/Builder.tsx`):

- New filter chip `For you (N)` rendered first, only when recommendations exist.
- Selecting it shows only the recommended templates (existing card grid) plus a
  one-line reasons caption: `Compact — fits more content on the page · …`.
- Selecting a recommended template works exactly like any other pick (updates
  `templateId`, records recent); once picked it drops out of its own list
  (current template is excluded), matching R263's "recommendation disappears when
  followed" behavior.

## Non-goals

- No auto-switching templates.
- No new localStorage keys, schema fields, worker endpoints, AI calls or score
  formula changes.
- No changes to the Landing gallery.

## Verification

- tsx oracle: rule matrix (levels × density × technical), dedup/cap/exclusion of
  current template, Auto + sparse ⇒ [].
- Local lint / typecheck / build.
- Production QA via testing agent: chip visibility per level, grid contents match
  oracle, pick-from-recommendation flow, disappearance after adoption, 375px,
  dark/light contrast, zero AI calls, localStorage cleanup baseline.
