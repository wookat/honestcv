# R735 — dashboard says "No resume yet" above the user's saved copies

Carried from R733's P2 list. Chain: #953 (R734) → this PR.

## Evidence (production `index-CqnRPKku.js`, `qa/r735-evidence.cjs`, `qa/shots/r735/`)

Seeded four states at 1280 and re-read `/dashboard`:

| state | first grid slot | sidebar "My resumes" |
| --- | --- | --- |
| A — 2 saved copies, editor open on copy *Alpha role* (`activeVersionId` = its id) | **"No resume yet — create your first one in the editor." + "Create my resume"** while the Alpha card below says "Open in the editor" | **3** (2 copies + the draft that *is* Alpha) |
| B — 2 saved copies, standalone draft | draft card ("Current draft · ATS …") | 3 (correct: 2 + 1) |
| C — 2 saved copies, no draft | "No resume yet …" | 2 |
| D — nothing | "No resume yet …" | 0 |

State A is the normal state of anyone who has ever clicked Open on a copy — the editor then edits that copy and `Dashboard` skips the draft card because it would duplicate the copy card (comment at `activeCopy`). The `else` branch, though, was written for "no draft" and says the user has no resume. "Create my resume" links to `/builder`, which reopens Alpha rather than creating anything. The sidebar count adds `loadResume() ? 1 : 0` regardless of whether that draft is a saved copy.

## Change

`src/pages/Dashboard.tsx`
```tsx
{draft && !activeCopy ? <DraftCard/> : versions.length === 0 ? <NoResumeYet/> : null}
```
The empty-state card now only appears when there is truly nothing (state D). In A and C the copy cards are the content (A's copy is labelled "Open in the editor"); the "Start a new resume" and "Import a resume" tiles stay.

`src/components/WorkspaceNav.tsx`
```ts
const standaloneDraft = loadResume() && !versions.some((v) => v.id === getActiveVersionId()) ? 1 : 0
resumes: versions.length + standaloneDraft
```

## Verification

- tsc app + worker, eslint (both files), build, verify-dist.
- Production: rerun `qa/r735-evidence.cjs` at 1280 and 375 — A: no "No resume yet —" card, count 2; B unchanged (draft card, 3); C: no card, 2; D: card, 0. 0 console errors, storage back to baseline.
