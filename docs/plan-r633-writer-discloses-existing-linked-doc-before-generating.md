# R633 — Cover letter / interview prep / resignation writer discloses the job's already-linked document before Generate, not only after content exists

Date: 2026-09-06 · Production before: `index-EEApB8_Z.js` (R632) · Evidence: `qa/r632-evidence.cjs offer` reopen block (pre-R632 run) + `qa/r633-evidence.cjs`

## 1. Evidence (production, real posting 2091088 "Sales Jedi" at Creative Force, status Offer, letter already saved and linked)

Reopening the resignation writer for the job (`/builder?doc=resignation&job=2091088`):

```
reopen textareas: []
reopen hints: []                                   ← nothing about the saved letter
reopen hints after template: ["This job already has “Umbrella Corp — Resignation letter” saved — Save makes this one the resignation letter linked to the job; the earlier one stays in My resumes."]
```

The R601 disclosure lives inside the `{result && (…)}` block of the writer, so a user who opens the writer from the card's tool button (or any link into `/builder?doc=…&job=…`) sees an empty writer with **Generate** as the primary action. The only way to learn the job already has a letter/brief is to generate one first — spending an AI call — or start from a template. Same for `cover` and `interview` (shared component and condition).

## 2. Design (`Builder.tsx`, career-doc dialog)

Render the existing-document note **above the Generate / Start from a template buttons** whenever the job links a live document of this kind and nothing has been saved in this session:

```tsx
{!savedId && existingDoc && (
  <p className="text-muted-foreground text-xs">
    This job already has “{existingDoc.title}” saved.{' '}
    <Link to={`/documents?doc=${existingDoc.id}`}>Open the saved {noun}</Link>
    {' '}— or write a new one: Save makes it the {noun} linked to the job; the earlier one stays in My resumes.
  </p>
)}
```

and drop the duplicate paragraph from the result block (the "Saving links this … to “job”" hint for jobs without a document stays where it is, under Save). The note is one paragraph; no new dialogs, no change to save semantics.

## 3. Acceptance (production, 1280 + 375)

- Writer opened for a job with a linked letter/brief: note + "Open the saved …" visible before any content; the link opens `/documents?doc=<id>`; pipeline/doc untouched.
- Writer for a job without a document: no note before content; after template the "Saving links this …" hint unchanged.
- No overflow, zero console errors, zero AI calls, storage restored.

## 4. Result

Deployed `index-Dr0tcODM.js` (Wrangler Routes API code 10000 — upload succeeded). 1280/375, `qa/r633-evidence.cjs offer`: writer reopened for the Offer job with a linked letter shows, before any content (0 textareas), *This job already has “Umbrella Corp — Resignation letter” saved. Open the saved resignation letter — or write a new one: …*; the link opens `/documents?doc=<id>` ("Written for Sales Jedi at Creative Force"); pipeline/doc unchanged. First-time writer (no document) still shows only the "Saving links this resignation letter to …" hint after content. No overflow (375/375), zero console errors, zero AI calls, storage restored. PR chain: R632 (#853) → R633.
