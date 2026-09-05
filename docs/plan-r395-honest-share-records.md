# R395 — creating a share link stops orphaning live links when storage is full

## Evidence (source, first-hand)
- `createShareLink` (src/lib/share.ts) publishes the snapshot to the Worker first, then
  records `{id, token, url}` locally via `persistShareLink`, which **swallows** quota
  failures ("storage full / private mode — ignore"). At zero headroom a brand-new share
  therefore succeeds server-side but the browser keeps no record: the dialog shows the
  URL once, but on reopen the toggle reads "No access", the user has no way to revoke
  the live public snapshot of their resume (the token is lost), and sharing again mints
  a second live link. That is a privacy-grade silent failure — worse than the R392/R393
  "fake save" cases because the artifact lives on a public URL.
- Re-publishing an existing link is different: `prev` already sits in
  `honestcv.shareLinks` with the same `id`/`token`/`url` (only `sharedAt` changes), so a
  failed local write leaves a still-revocable record — no orphan.

## Design (share.ts only)
- `persistShareLink` returns `boolean` (false when nothing was written).
- `createShareLink`: when the local record write fails **and no previous record
  existed**, best-effort revoke the just-created remote link (`revokeRemote`, fire and
  forget) and throw
  `"Saving the link in this browser failed — your storage is full. The link was turned
  off; free up space and try again."`
  Both Builder call sites already render thrown errors in the dialog (`setShareError`).
- When `prev` existed, keep returning the link: the stored record is stale only in
  `sharedAt` and remains fully revocable.
- `revokeShareLink`/`revokeShareLinksFor` removals shrink the key; unchanged.

## Non-goals
- No Worker changes; no storage eviction; no new UI surface (the dialog's existing
  error line is the affordance).
