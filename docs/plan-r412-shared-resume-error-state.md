# R412 — shared-resume page: network/server failure is not "link revoked"

## Production evidence (2026-08-31, cv.zalize.com)
CDP probe on `/s/<id>` with the `/api/share/<id>` request failed at the network
layer (`Fetch.failRequest`, simulating offline/flaky connection):

- The page stays on the loading skeleton (`aria-busy=true`) forever.
- The console logs `Uncaught (in promise)` from `share-CUZnXrsP.js` — the
  `fetchSharedResume` rejection is never handled.

Additionally, by code inspection, any non-OK response — including 5xx server
errors — maps to `null`, which the page renders as "This link is no longer
available / The owner turned off sharing". A transient server error is
presented as a permanent revocation, telling the recipient to bug the owner
for a fresh link that would not help.

## Source path
- `src/lib/share.ts` `fetchSharedResume`: `fetch(...)` (throws on network
  failure — unhandled), `if (!res.ok) return null` (5xx conflated with gone).
- `src/pages/SharedResume.tsx`: `void fetchSharedResume(id).then(...)` — no
  `.catch`, and only `loading | gone | ready` states exist.

## Fix
- `share.ts`: `fetchSharedResume` keeps returning `null` only for genuine
  "gone" client responses (4xx, e.g. the worker's 404/410); a network failure
  or a >=500 response throws a friendly Error instead.
- `SharedResume.tsx`: add an `error` state with a "Try again" button that
  re-runs the fetch (retry counter in the effect deps); the effect catches the
  rejection. Copy: "Couldn't load this resume — check your connection and try
  again." The revoked copy is untouched.

## Non-goals
- No worker changes; no share create/revoke changes (R395 covered those).
- The 404 "gone" rendering stays byte-identical.

## Validation
- Local: tsc, eslint on changed files, build.
- Production QA (testing agent): failed request → error card + working retry
  (fulfil second request with a real mocked snapshot → renders); 500 → error
  card; real bogus id → unchanged "no longer available"; real happy path via
  mocked snapshot; zero unhandled rejections; baseline restore.
