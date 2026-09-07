# R465 — back up an unreadable share-link map instead of silently destroying it

## First-hand production evidence (CDP, cv.zalize.com)

Planted a truncated `honestcv.shareLinks` value:

```
{"copy-1":{"id":"abc123","token":"tok-original-live-link","url":"https://cv.zalize.com/s/abc123","sharedAt":17
```

plus a valid legacy `honestcv.shareLink` record, then loaded `/builder`:

- **Mount-only destruction, zero clicks, zero network**: `loadShareLink()` runs in a
  Builder state initializer; its legacy-attribution branch rewrote
  `honestcv.shareLinks` to `{"draft":{…legacy…}}`, destroying the corrupt bytes.
  No alert, no backup (`honestcv.shareLinks.unreadable` was `None`).
- Read-only mount (corrupt map, no legacy key) leaves the bytes untouched —
  the destruction is at the write sites.
- Code-verified same funnel: every publish/revoke goes through
  `persistShareLink()`, which reloads the (empty-parsed) map and rewrites the
  whole key — one publish on any copy destroys every other copy's token.

## Why this matters more than the earlier faces (R461–R464)

The map values contain the **share tokens** — the only credentials that can
take a live public `/s/<id>` link down. Destroying them leaves the user's
resume permanently public with no way to revoke (R395 already treats an
unpersistable new link as revoke-worthy for exactly this reason).

## Fix (same conservative pattern as R461–R464)

`src/lib/share.ts`:
- `stashUnreadableShareLinks()`: raw value exists but `JSON.parse` throws or
  parses to a non-object/null ⇒ copy the exact bytes to
  `honestcv.shareLinks.unreadable` (write-once — an existing backup is never
  overwritten) and return `true`. Valid objects (including maps with invalid
  entries, which the existing `isShareLink` entry filter handles) return
  `false` and are untouched. No JSON repair.
- Called before both write sites: `persistShareLink()` and the legacy
  attribution write inside `loadShareLink()`.

`src/pages/Builder.tsx`:
- `shareLinksUnreadable` state initializer runs `stashUnreadableShareLinks()`
  **before** the `shareLink` initializer (state initializers run in
  declaration order), so the backup wins the race against the mount-time
  legacy write.
- Dismissible `role="alert"` bar in the stacked status-bar container (R427):
  "Your saved share links couldn't be read, so they're not shown here. The
  unreadable copy was kept in your browser storage as a backup." Dismiss only
  hides the bar; reload re-shows it while the condition persists.

## Rejected alternatives

- JSON auto-repair of the truncated map — unsafe, could resurrect wrong tokens.
- Alerting on the Dashboard too — `hasShareLink` peeks are read-only there;
  the Builder is where links are created/shown, keep the diff focused.

## QA matrix (production)

1. Corrupt map + legacy record → mount: backup holds exact bytes, alert shown,
   rewritten map contains the legacy link.
2. Corrupt map alone → mount: alert shown, main key byte-identical (read-only),
   backup written.
3. Existing backup sentinel never overwritten.
4. Valid map / missing key → no alert, no backup.
5. Dismiss hides only the bar; reload re-shows while condition persists.
6. R461 draft alert coexists (both bars stack).
7. 375px light/dark: no overflow; zero console errors; no unsafe traffic;
   byte-exact storage restore.
