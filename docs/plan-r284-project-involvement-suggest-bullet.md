# R284 — "Suggest a bullet" (+ key numbers) on Projects and Involvement

## First-party Rezi evidence

- https://www.rezi.ai/rezi-docs/ai-bullet-points — the AI Bullet Point Writer
  *generates* bullet points (not only rewrites) and is available through the
  resume tabs "such as: Work experience, Projects, Involvement". It documents
  both standard generated bullets and quantified ("key numbers") bullets.

## Current HonestCV behavior (source-verified)

- Experience entries: `Suggest a bullet` + `…with key numbers` (generation via
  `/api/ai/suggest-bullet`, reviewed in the "Suggested bullet" dialog with
  Apply / Regenerate / Cancel), plus the R283 whole-entry rewrite pair.
- Projects / Involvement (post-R283): whole-entry rewrite pair + per-line Fix
  only — **no generation path**. A user with an empty project description has
  no AI assist at all there (rewrite buttons are disabled by design).

## Gap selected

Bring the generation half of the AI Bullet Point Writer to Projects and
Involvement: a `Suggest a bullet` + `…with key numbers` pair per entry,
reusing the existing suggest-bullet flow and review dialog.

## Design

### Worker (`worker/prompts.ts`, `worker/index.ts`)

- `buildSuggestBulletMessages` gains optional `section?: 'project' | 'involvement'`.
  - Default (experience) prompt stays byte-identical.
  - `project`: draft ONE project bullet ("what was built / achieved"); user
    content labels `Project:` / `Organization:`.
  - `involvement`: draft ONE involvement bullet (volunteer / extracurricular
    contribution); labels `Role:` / `Organization:`.
  - Grounding rules unchanged: resume-grounded, bracketed placeholders, never
    invent; key-numbers variant clause unchanged.
- `/api/ai/suggest-bullet` accepts `section` (whitelisted; anything else →
  undefined/experience). Missing role+company error message becomes
  section-aware. Quota semantics unchanged.

### API (`src/lib/api.ts`)

- `aiSuggestBullet` input gains `section?: 'project' | 'involvement'`.
  Omitted for experience → experience request payloads byte-identical.

### Builder (`src/pages/Builder.tsx`)

- `bulletSuggest` state generalized: `{ kind: 'exp' | 'proj' | 'inv'; entryId; variant?; text }`.
- `runSuggestBullet` generalized over the three entry kinds; tags
  `proj-<id>-suggest`, `proj-<id>-suggest-nums`, `inv-…` mirror the exp tags.
- Apply: exp appends to `bullets` (unchanged); proj/inv append the line to
  `description` (join with `\n`, skipping blank lines).
- New buttons render first in the R283 button row:
  `Suggest a bullet`, `…with key numbers`, then the rewrite pair.
- Not-ready reasons (button disabled + helper text, mirroring exp):
  - project without name and org: `Add a project name or organization first — the bullet is drafted for that project.`
  - involvement without role and organization: `Add a role or organization first — the bullet is drafted for that involvement.`

## Explicitly out of scope

Resume schema, ATS scoring, exports, persistence keys, per-line Fix,
rewrite behavior, GitHub Actions, Cloudflare token permissions, payments.

## Verification

- Local: `npx eslint` on touched files, `npx tsc -b --noEmit`, `npm run build`.
- Production QA (testing agent, CDP Fetch interception aborting pre-network,
  zero AI quota): payload shape per section/variant, disabled reasons, review
  dialog apply-to-description, experience regression (byte-identical payload,
  no `section` key), 375px layout, cleanup.
