# R345 — Scope edit-history checkpoints to the active resume copy

## Evidence (first-hand, production audit)
- `honestcv.resumeHistory` is a single global 15-slot list (`recordResumeSnapshot` in `src/lib/resume.ts`); snapshots carry no copy identity.
- Reproduced on production: with Copy-B active, the History dialog listed checkpoints captured while Copy-A (and the pre-copy draft) were active — visually indistinguishable — and restoring one silently rewrote Copy-B's saved version data (`syncActiveVersion`) with pre-Copy-B content. Classified P2 (mitigated by the force-checkpoint before restore + toolbar Undo, both verified).
- Rest of the history/undo/version chain audited green (checkpoint coalescing, restore byte-fidelity, restore reversibility, redo invalidation, R321 cross-tab, keyboard, 375/dark).

## Design
- `ResumeSnapshot` gains `versionId?: string | null` — the `getActiveVersionId()` at capture time (`null` = unlinked draft). Legacy entries (field absent) are treated as `null`.
- `recordResumeSnapshot` stamps `versionId` and runs its duplicate/10-minute-gap check against the newest snapshot *of the same scope*, so switching copies never suppresses (or is suppressed by) another copy's checkpoints.
- `HistoryDialog` shows only snapshots whose scope matches the active copy (`(s.versionId ?? null) === getActiveVersionId()`), so cross-copy restore is no longer offered. Empty-state copy unchanged.
- Global 15-slot cap kept (bounded storage); a heavily edited copy can still age out another copy's entries — accepted, recorded as informational.

## Non-goals
- No per-copy cap/quota rebalancing; no migration of legacy entries (they age out); no change to restore/undo semantics.

## Verification
- Local: tsc, lint, build.
- Production (testing agent, zero AI): Copy-A checkpoints invisible in Copy-B's dialog and vice-versa; unlinked draft sees only null-scope (incl. legacy) entries; scoped gap check — a save right after switching copies still records that copy's first checkpoint; restore fidelity + force-checkpoint + Undo regression; 375/dark; baselines restored.
