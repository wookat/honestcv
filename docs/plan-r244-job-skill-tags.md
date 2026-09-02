# R244 — skill tags in the job detail pane (click to filter)

## First-party evidence (Rezi)

Rezi Job Search guide (https://www.rezi.ai/rezi-docs/job-search):

- "Every job listing includes a breakdown of useful details, such as responsibilities,
  **required skills**, salary, experience level, benefits, and company information."
- Details are "broken down into these sections: About the Role · Responsibilities ·
  Requirements · **Skills** · Location · Work Type · …"
- "As you save jobs, you'll probably notice repeated skills … That's your sign to create
  a resume version tailored to that type of role."

## Current state (HonestCV, measured)

- The Remotive upstream returns a `tags` array per job (verified live:
  `curl remotive.com/api/remote-jobs?search=engineer` → e.g. `["react","python","AWS",…]`,
  ranging from ~4 to ~50 entries). The worker (`/api/jobs/search`) drops it — the
  detail pane has title/company/location/type/salary/description but no skills at all.
- R243 added a Skills filter (comma-split AND over title+description), but users must
  guess and type terms by hand; there is no way to see a job's skills or pivot the
  board around one.

## Design

Smallest focused change, deterministic, zero AI:

1. **Worker** (`worker/index.ts`): pass `tags` through `/api/jobs/search`, normalized
   (`String`, trimmed, deduped case-insensitively, capped at 24 to keep KV payloads and
   the UI sane). Bump the KV cache key `jobs:v3:` → `jobs:v4:` so cached v3 responses
   without tags don't linger for a day.
2. **Client** (`src/lib/jobs.ts`): `JobListing.tags: string[]` (default `[]` for safety).
3. **Detail pane** (`Jobs.tsx`): a "Skills" chip row under the header when
   `selected.tags.length > 0`; show the first 10 chips with a `+N more` toggle
   (session-scoped, resets when the selected job changes). Each chip is a button:
   - click adds the tag as a term to the R243 skills filter (comma-appended);
     clicking a chip whose term is already active removes it (toggle, case-insensitive);
   - `aria-pressed` reflects the active state; on non-All tabs the click also switches
     to the All tab so the effect is visible.
4. **Matching** (`Jobs.tsx`): extend the R243 haystack from `title\ndescription` to
   `title\ndescription\ntags.join('\n')` so a clicked tag always matches its own job
   even when the literal string is absent from the prose (e.g. tag "ruby/rails").
   R243 semantics unchanged otherwise (comma-split AND, word-boundary when the term
   starts/ends with a word char, escaped literal otherwise).

No schema, scoring, or AI changes. No persistence.

## Validation

- Local: `npm run lint`, `npx tsc -b`, `npm run build`.
- Production QA: tags render for a live listing; +N more expands; chip click seeds the
  skills filter and narrows the board (job itself always retained); second click removes
  the term; chip active state; tag-only term (not in prose) still matches via haystack;
  R243 typed-term behavior, R242 type filter, composition, tracked-tab bypass, 375px,
  dark contrast, zero AI calls, exact localStorage cleanup.
