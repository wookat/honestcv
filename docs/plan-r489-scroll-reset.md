# R489 — Reset scroll on SPA push navigations

## Production evidence (CDP, cv.zalize.com)
- Landing scrolled to 8000px → click footer `/jobs` link: lands on /jobs at
  scrollY=544 (clamped bottom of the shorter page), not the top.
- /jobs scrolled to bottom (544) → header "My resumes" `<Link>` to /dashboard:
  arrives at scrollY=544 — the dashboard opens mid-page.
- /samples scrolled to 763 → `/builder` link: arrives at scrollY=819.
- history.back() from /jobs to landing restores scrollY≈8102 — the browser's
  native `history.scrollRestoration = 'auto'` handles POP correctly today.

Root cause: React Router (library mode) does not reset window scroll on
push/replace navigations, and App.tsx has no scroll handling. Every internal
link click carries the previous page's scroll offset into the next route.

## Fix (minimal)
Add a `ScrollReset` component in App.tsx alongside `CanonicalSync`:
- `useLocation()` + `useNavigationType()`; on pathname change when the
  navigation type is not `POP` and there is no `location.hash`,
  `window.scrollTo(0, 0)`.
- POP untouched so the browser's native back/forward scroll restoration keeps
  working (verified working in production today).
- Hash navigations untouched — Dashboard already `scrollIntoView`s its hash
  target (Dashboard.tsx).
- Keyed on pathname only, so same-route query-param updates (e.g. /jobs?job=,
  /samples filters, /builder?jump=) do not yank the user to the top.

## Non-goals
- No service-worker, worker, or static-page changes.
- No changes to browser POP restoration, no `history.scrollRestoration` writes.
- No per-page scroll effects removed (Builder's own scrollTo stays).

## QA (production, after deploy)
- Repeat the three navigations above: each must land at scrollY=0.
- Back/forward still restores previous scroll positions (POP untouched).
- /dashboard#folders-style hash navigation still scrolls to the target.
- Same-route search-param changes on /jobs do not scroll to top.
- 375px light/dark spot checks, zero console errors, storage untouched.
