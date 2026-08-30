# R76 — Shareable read-only resume link

## Evidence (firsthand)

`~/audit-r1/shots-r76/rezi-share-dialog.png`, `rezi-share-access-menu.png`,
`rezi-share-enabled.png` — Rezi Finish Up has a first-class **SHARE** button next to
DOWNLOAD PDF:

- "Share this resume" dialog: **Anyone with the link** with a `no access / can view` dropdown.
- Switching to `can view` mints a hosted link `app.rezi.ai/s/<22-char id>` with a copy button.
- Switching back to `no access` revokes it. Custom link slug is PRO-gated ($29/mo).

Ours: the builder's existing "share" dialog is only social share (X/LinkedIn) of the
*product*, shown after the first download. There is no way to send someone a link to the
resume itself — a real workflow (recruiters, referrers, mentors reviewing a draft) that
Rezi serves and we do not. The resume lives only in the sender's localStorage today.

## Design

### Worker (KV-backed, no auth needed — capability URLs)

- `POST /api/share` — body `{ resume }`. Server sanitizes nothing (client sends the already
  sanitized object) but enforces: JSON body ≤ 120 KB, per-client daily create cap (KV counter
  keyed by fingerprint, 20/day) to prevent abuse. Mints `id` (16 bytes → base64url, 22 chars)
  and `token` (revocation secret, same entropy). Stores KV `share:<id>` =
  `{ resume, createdAt }` with 180-day TTL (refreshed on re-share). Returns
  `{ id, token, url }`.
- `DELETE /api/share/:id` with header `x-share-token` — deletes `share:<id>` when the token
  matches the stored `tokenHash` (SHA-256; raw token never stored).
- `GET /api/share/:id` — returns `{ resume, createdAt }` or 404. `Cache-Control: no-store`,
  and the SPA route response gets `X-Robots-Tag: noindex`.

### Client

- New route `/s/:id` (React, lazy): fetches `GET /api/share/:id`, runs the payload through
  `sanitizeResume`, renders the existing read-only `ResumePreview` with the shared resume's
  own template/format settings, plus a slim header ("Shared resume — made with RezUp",
  CTA → /builder). 404 → friendly "This link is no longer available".
- Builder header: Share button (Share2 icon) opening a Rezi-style dialog:
  - "Anyone with the link" row with `No access / Can view` select.
  - Choosing *Can view* POSTs the current resume, shows the minted URL + Copy button.
  - Switching to *No access* DELETEs and clears local state.
  - Note under the link: link shows a snapshot; re-share after edits to update. Expires
    after 180 days of no re-share (honest disclosure — no silent stale data).
- Persistence: `honestcv.shareLink` = `{ id, token, url, sharedAt }` (new localStorage key)
  so the dialog shows the existing link and can revoke across sessions.

### Non-goals

Custom slugs (Rezi PRO), live-updating links (snapshot semantics are simpler and honest),
per-viewer access control/analytics, share for career documents, indexing/SEO for shared
pages (explicitly noindex), payments.

## QA

Desktop 1440 + 375: mint link → open in fresh context (no localStorage) renders resume
identically; copy button; revoke → 404 page; re-share mints new snapshot; 120KB cap and
daily cap return clear errors; zero AI quota; noindex header present; localStorage
byte-level restore.
