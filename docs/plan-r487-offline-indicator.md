# R487 — Honest offline indicator in the SPA header

## Production evidence (first-hand, CDP)

- R486 shipped the offline app shell: production SW is activated, controls pages,
  and previously visited routes (and unvisited SPA routes via shell fallback)
  render fully offline. Verified again this round in a fresh browser context.
- Offline gap: with the network emulated offline on a SW-controlled page,
  `document.body.innerText` contains **zero mention of being offline** on
  /builder and /jobs. `navigator.onLine === false` but no UI reflects it.
- /jobs offline renders the normal search UI (tabs, search box) as if a search
  could succeed; the failure only surfaces after the user tries. AI features and
  share publishing likewise fail only after the attempt (friendly errors from
  R348/R413, but reactive, not proactive).
- Audit context this round: 4 SPA routes × mobile axe scans all CLEAN, zero
  overflow; manifest complete (id/scope/icons/maskable/shortcuts/screenshots);
  Lighthouse /builder a11y/BP/SEO all 1.0. The offline-awareness gap is the
  one user-facing hole the R486 offline capability opened.

## Why this matters

The app is deliberately usable offline (local-first, R486), but a user who loses
connectivity gets no signal about what still works (editing — everything saves
to this device) and what cannot (AI, job search, share links). Honest state
disclosure is the product's core stance.

## Design (minimal)

- `Layout.tsx`: `useSyncExternalStore` subscription to `online`/`offline`
  window events; snapshot `navigator.onLine`; server snapshot `true` (prerender
  must assume online so hydration matches).
- `SiteHeader` renders a slim `role="status"` bar under the header row, only
  while offline:
  "You're offline — editing still works and saves to this device. AI features,
  job search and share links need a connection."
- Disappears automatically on reconnect. No dismiss button (no state to store),
  no new dependency, static SEO pages untouched (content pages don't need it).

## Non-goals

- No API caching, no queued sync, no toast library.
- No per-feature offline gating changes (R348/R413 friendly errors remain).

## QA (production, after deploy)

- Fresh context, SW-controlled: go offline → bar appears on /builder, /jobs,
  /dashboard; role="status"; exact copy; reconnect → bar disappears.
- Offline editing in Builder still saves; bar does not overlap toolbars; 375px
  light/dark no overflow; axe stays clean; no console errors.
- Online cold load: bar absent in raw HTML and after hydration (no #418).
