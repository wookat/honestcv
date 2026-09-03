# R314 — share revoke must not claim success when the server delete fails

## Evidence (first-party)
- R313 exploratory production audit: one revoke attempt removed local
  `honestcv.shareLink` while no `DELETE /api/share/:id` was observed and the
  shared URL kept serving 200 — the UI showed "No access" for a link that was
  still live. Not deterministically reproducible (possible instrumentation
  race), but the source guarantees the failure mode exists:
  - `revokeRemote` (share.ts) swallows every failure:
    `fetch(...).catch(() => undefined)` — no `res.ok` check, network errors
    ignored.
  - `revokeShareLink` then unconditionally `persistShareLink(null)` — local
    state says revoked regardless of the server outcome.
  - The Builder dialog has no `.catch` on revoke — nothing could surface an
    error even if one were thrown.
- Risk: a user who "turned off" a link on a flaky connection believes it is
  revoked while anyone with the URL can still view the resume — a
  privacy-grade silent failure.

## Design
Fail loudly and keep local state truthful:

1. `revokeRemote`: check the response — 2xx or 404/410 (already gone) count as
   revoked; anything else (or a network error) throws a user-readable Error.
2. `revokeShareLink`: only `persistShareLink(null)` after the remote delete
   succeeded, so the dialog still shows "Can view" and the user can retry.
3. Builder dialog revoke branch: add `.catch` → reuse the existing
   `shareError` inline alert (same slot as create errors).

No worker/schema changes; create/copy/slug flows untouched.

## Verification
- tsc/eslint/build; deploy; curl bundle.
- Production QA: happy-path revoke (server 404 after), simulated failed DELETE
  (CDP Fetch fulfill 500) → inline error, local shareLink kept, select stays
  "Can view", retry succeeds; create/slug regression; 375px; dark; zero AI.
