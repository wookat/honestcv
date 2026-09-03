# R346 — Checkpoint the pre-edit session baseline on Builder mount

## Evidence (first-hand, R345 production audit)
- Checkpoints are only recorded by the debounced save (`useDebouncedSave`), which skips its first run — so the very first pre-edit state of a session is never checkpointed. The first checkpoint lands after the first edit's save, meaning within the first 10 minutes there is no history route back to the exact pre-session state once toolbar Undo is gone (tab closed/reloaded). Confirmed on production during R345 (classified P3, design observation).
- Rezi's cloud persistence keeps server-side versions from the moment a document exists; our local-first history should likewise cover the session's starting point.

## Design
- In `useDebouncedSave`'s first-run branch (Builder mount, draft freshly loaded), call `recordResumeSnapshot(resume)` non-forced before returning.
- Spam control comes for free from existing semantics: identical-to-newest snapshots are skipped, and the per-scope 10-minute gap (R345) suppresses a mount snapshot when the scope already has a recent checkpoint. Per-copy scoping means each copy gets its own baseline.
- No change to save, restore, undo, or worker code.

## Non-goals
- No forced baseline (would spam an entry on every /builder visit); no change to the 15-slot cap.

## Verification
- Local: tsc, eslint, build; oracle `.tmp-smoke/r346_oracle.ts`.
- Production (testing agent, zero AI): fresh scope + /builder mount → baseline checkpoint exists before any edit; first edit within 10 min coalesces (no second entry until gap passes/backdate); reload with recent checkpoint → no duplicate entry; per-copy baselines independent; R345 scoping + restore/Undo regression; baselines restored.
