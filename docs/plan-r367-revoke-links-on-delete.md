# R367 — turn off a copy's public share link when the copy is deleted

## Evidence (firsthand, R366 branch + production semantics)

- R366 scoped share links to the copy they were published from
  (`honestcv.shareLinks`, scope = copy versionId or `'draft'`). The share
  dialog promises "Turn it off anytime."
- But every copy-delete path leaves the copy's link live with **no UI left to
  revoke it**:
  - Dashboard single delete (`deleteResumeVersion`, confirm dialog) — no
    share-link handling.
  - Dashboard bulk delete (`deleteResumeVersions`, confirm dialog) — none.
  - Builder Copies dialog Delete button — none (and no confirm).
- Once the copy is gone its Share dialog is unreachable, so the public
  snapshot stays up until the 180-day KV expiry with no way to turn it off —
  breaking the "turn it off anytime" promise. R366 explicitly deferred this
  ("no automatic link pruning when deleting a copy") because *local-only*
  pruning would lose the token and make the page unrevocable; the correct fix
  is a server-side revoke, which is this round.

## Design

- `share.ts` gains:
  - `hasShareLink(scope)` — non-migrating peek (does NOT run the legacy
    attribution that `loadShareLink` performs, so checking a copy about to be
    deleted can't swallow the legacy link).
  - `revokeShareLinksFor(scopes)` — fire-and-forget best-effort revoke for
    copies being deleted: for each scope with a stored link, send the
    existing `DELETE /api/share/:id` with the stored token; **remove the
    local record only after the server confirms** (2xx/404/410). On network
    failure the record is kept, so an undo-restored copy shows its link again
    and can retry revoking; if undo isn't used the orphaned record is
    harmless.
- Dashboard:
  - Single-delete confirm description appends "Its public share link will
    also be turned off." when the copy has a link.
  - Bulk-delete confirm appends "N of them have public share links, which
    will also be turned off." (singular handled).
  - Both confirm handlers call `revokeShareLinksFor(...)`.
- Builder Copies dialog Delete calls `revokeShareLinksFor([v.id])` too.
- Undo semantics (documented, intentional): undo restores the copy's local
  bytes; a successfully revoked public link is gone — republish creates a new
  URL. Deletion is the user's explicit "take this down" signal; silently
  resurrecting a public URL on undo would be worse.

## Non-goals

- No revoke for the `'draft'` scope (the draft is never deleted).
- No server changes (`DELETE /api/share/:id` already exists, 404/410 treated
  as success).
- No blocking the delete on revoke success — deletes stay instant/offline-
  capable; revoke is best-effort with local-record retention on failure.

## Validation

- Oracle (`.tmp-smoke/r367_oracle.ts`, mocked fetch): revoke removes only the
  deleted scopes' entries; failure keeps the entry; 404 counts as success;
  scopes without links send no request; `hasShareLink` never migrates legacy.
- tsc / eslint / build.
- Deploy, then independent production QA: delete linked copy → confirm copy
  mentions the link, DELETE hits the right id, map entry removed, other
  scopes untouched; bulk variant; Builder Copies path; offline-failure keeps
  entry and undo-restored copy still shows the link; unlinked delete sends
  zero requests; R366/R365 regressions; 375px light/dark.
