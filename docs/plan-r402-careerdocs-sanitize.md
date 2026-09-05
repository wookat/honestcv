# R402 — read-side sanitize for honestcv.careerDocs

## Evidence (source, documents.ts)

```ts
const parsed = JSON.parse(raw) as CareerDoc[]
return Array.isArray(parsed) ? parsed.filter((d) => d.id && d.text) : []
```

- A single `null`/non-object element throws inside `filter` (`d.id` on null),
  the outer try/catch swallows it, and `listCareerDocs()` returns `[]` — every
  career document disappears from /documents, the dashboard, and the Builder
  tool dialogs even though they are still in storage.
- Worse: every mutator (`saveCareerDoc`, `renameCareerDoc`, `deleteCareerDoc`,
  `duplicateCareerDoc`, `updateCareerDoc`, `restoreCareerDoc`) starts from
  `listCareerDocs()` and persists the result — the first save after the
  corruption permanently overwrites the stored array, destroying all documents.
- Wrong-typed fields pass through untouched: a non-string `title` reaches
  `title.replace(...)` (duplicate), `localeCompare`, `.trim()` in the UI and
  export filename code; a non-string `kind` breaks filters; a non-number
  `updatedAt` breaks date rendering.
- Precedent: `resume.ts` sanitizes drafts/copies/history/libraries field by
  field (`sanitizeResume` et al., R374 did the same for `jobPipeline`,
  R401 for backup files). `careerDocs` is the remaining unsanitized store
  with user content.

## Fix (documents.ts only)

Add `sanitizeCareerDoc(input: unknown): CareerDoc | null`:

- non-object / missing or non-string non-empty `id` or `text` → null (drop entry);
- `kind` coerced to one of `cover|interview|resignation`, default `cover`;
- `title` string else `''`;
- `updatedAt` finite number else `0`;
- `signature` kept only when a string, else omitted.

`listCareerDocs()` maps elements through it with `flatMap`, so one bad entry is
dropped instead of nuking the list. Valid stored docs re-serialize identically
(no writes on read; repairs land on the next natural save, same as R374).

## Non-goals

No schema/version change, no proactive rewrite-on-read, no UI changes.

## Verification

- Local: `npx tsc -b`, `npx eslint src/lib/documents.ts`, `npm run build`;
  node oracle over sanitize cases.
- Production QA: seed corrupted careerDocs (null element, wrong-typed fields,
  garbage strings) → /documents and dashboard render surviving docs, no blank
  page, no console errors; a save no longer destroys the surviving docs;
  byte-identity for well-formed docs; regression on R392 storage-full alerts,
  R388 title-based download names; 375px light/dark; baseline restore.
