# R366: scope share links to the resume copy they were published from

## Evidence (firsthand)
- `honestcv.shareLink` is a single global record (src/lib/share.ts). The share
  dialog says "Share this resume", but publishing while copy B is active
  re-publishes copy A's URL with B's content: `createShareLink` always sends
  the stored `{id, token}`, so the employer who received copy A's link now
  silently sees copy B.
- Reproduced in code and on production semantics: share copy A → switch copies
  (dashboard Open or Builder Copies dialog) → open Share → the dialog shows
  copy A's link as if it belonged to copy B; "Publish latest version" or
  toggling access rewrites/kills copy A's public page.
- Every other per-copy artifact is already scoped: history checkpoints
  (R345), targeted copies per job (R183), ATS score per copy. Share links are
  the last copy-adjacent object that is global.

## Change (smallest evidence-backed)
- `share.ts`: store links in `honestcv.shareLinks` — a map keyed by scope
  (`versionId`, or `'draft'` for the unlinked draft). `loadShareLink(scope)` /
  `createShareLink(resume, scope, slug?)` / `revokeShareLink(scope)`.
  One-time migration: an existing legacy `honestcv.shareLink` is attributed to
  the scope that first reads it (the copy the user currently sees — exactly
  what today's dialog shows) and the legacy key is removed.
- `Builder.tsx`: share scope = `activeVersionId ?? 'draft'`; `linkVersion`
  also swaps the dialog's link state to the new scope, so each copy shows its
  own link (or the slug form when it has none).

## Non-goals
- Deleting a copy does not revoke its link (revoking would need the map entry;
  pruning would lose the token and make the live page unrevocable). Links keep
  today's lifecycle: manual revoke or 180-day expiry.
- No server changes: omitting `{id, token}` already creates a fresh id per
  copy; re-publishing the same copy keeps its URL.

## Validation
- Oracle: per-scope create/load/revoke isolation, legacy migration
  (attributed once, legacy key removed), re-publish keeps id, revoke removes
  only its scope.
- Local tsc/eslint/build; production QA: share copy A (mocked /api/share),
  switch to copy B → dialog shows no link, publish B → distinct id, A's link
  and slug intact, revoke B leaves A, draft scope independent, legacy
  migration, 375 light/dark, zero real share/AI/payment, clean baseline.
