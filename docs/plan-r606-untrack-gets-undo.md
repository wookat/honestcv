# R606 — Stop tracking a job gets a 10s Undo that restores the entry in place (timeline, notes, links)

## Evidence (production index-QCaHi5o9.js, qa/r606-evidence.cjs)

Tracked job `applied` with a 2-step timeline, notes, `resumeVersionId`, `coverDocId`, reminder:

- status chip → dialog: `This removes the job from your pipeline and deletes its application timeline
  (2 status changes), your notes, its link to 1 saved document, its link to the targeted copy "…".
  The copy and saved documents stay, but lose their link to this job; saving it again reconnects the copy.`
- "Stop tracking" → `honestcv.jobPipeline` becomes `[]`; the only `role=status` on the page is
  "18 jobs found"; **no Undo offered**. Same for a plain `saved` job (no dialog, no Undo).

Compare: deleting a copy (dashboard R?/builder R598) or a document (dashboard) offers a 10 s Undo
that restores the item at its original index and relinks it. Untracking is the only destructive
action in the jobs↔builder↔documents graph that is irreversible in one click — and it is the one that
destroys the most (timeline + notes + reminder + 4 links). "Saving it again reconnects the copy"
is only true if the posting is still in search results, and it never brings back timeline/notes/doc links.

## Fix

`lib/jobs.ts`
```ts
export interface RemovedPipelineEntry { entry: PipelineEntry; index: number }
/** Put untracked entries back where they were (Undo); jobs tracked again meanwhile are skipped. */
export function restorePipelineEntries(removed: readonly RemovedPipelineEntry[]): PipelineEntry[] | null
```

`pages/Jobs.tsx`
- `untrack(ids)` — snapshots `{entry,index}` from the current `pipeline` for each id, then
  `applyPipeline(removeManyFromPipeline(ids))`, then `setUndoUntrack({ removed })`.
- Used by all three paths: plain chip toggle (no dialog), the single-job confirm dialog, the bulk dialog.
- Bottom toast (`role=status`, same styling as dashboard/builder undo bars, above the storage alert):
  `Stopped tracking "<title>"` / `Stopped tracking N jobs` · **Undo** · dismiss; auto-hides after 10 s.
- Undo → `applyPipeline(restorePipelineEntries(removed))`; the entry comes back with the same status,
  history, notes, reminder and all four links, at its original position.

Dialog copy unchanged (it is still true: the links are deleted; Undo brings them back within 10 s).

## Acceptance

untrack (dialog path) → toast with Undo → Undo restores entry with identical fields; plain path
same; bulk path toast says N jobs; toast gone after 10 s; 1280 + 375 no page overflow; storage
restored; 0 console errors; no AI calls.
