# R488 — /jobs header "My resumes" becomes a real SPA link

## Production evidence (first-hand, CDP)

- SOP-10 audit sweep this round: 7 routes × 2 viewports (1280/375) — zero
  horizontal overflow everywhere; PWA surface (R482–R487) fully regressed green
  in the R487 QA round.
- Confirmed live on production: the /jobs SiteHeader action is a plain
  `<a href="/dashboard">My resumes</a>` (Jobs.tsx:581). Clicking it destroys the
  document — a `window.__probe` sentinel set before the click is gone after
  navigation (full reload), unlike every other in-app nav.
- Every comparable header/CTA nav in the app already uses a router `<Link>`
  (Landing header action, Dashboard header action, WorkspaceNav). This is the
  single remaining plain anchor pointing at an SPA route; the other plain
  anchors (`/templates/`, `/examples/`, `/privacy/`) target prerendered static
  pages, where a full document load is the intended behavior.
- Cost of the bug: full JS/CSS re-execution and re-hydration on a hot path
  (jobs → resumes), losing all in-memory state; independently spotted by QA in
  R487 (P3).

## Design (minimal)

- Jobs.tsx: import `Link` from react-router-dom (file already imports
  `useNavigate`), replace the anchor with `<Link to="/dashboard">My resumes</Link>`.
  Button `asChild` styling is unchanged (same pattern as Dashboard.tsx:848).

## Non-goals

- No changes to static-page anchors (intended full loads).
- No other Jobs.tsx changes.

## QA (production, after deploy)

- /jobs header "My resumes" click: pre-set JS sentinel survives → SPA nav,
  lands on /dashboard, URL/history correct.
- WorkspaceNav + Builder toolbar nav regressions; 375 light/dark no overflow;
  zero console errors.
