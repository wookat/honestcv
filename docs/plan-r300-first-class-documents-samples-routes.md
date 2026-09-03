# R300 — First-class /documents and /samples routes

## Evidence
- Rezi first-party (rezi.ai/rezi-docs/ai-cover-letter-generator-explained): cover letters
  live as a first-class dashboard surface, "keeping everything organized on your dashboard";
  the docs site itself has a dedicated Cover Letter area.
- R298 SOP-10 architecture audit: our Career documents and Sample library are anchor
  fragments (`/dashboard#documents`, `/dashboard#samples`) inside the My-resumes page —
  no dedicated URL, no active state in the workspace nav, headings compete with the
  resumes h1. Confirmed console/architecture gap.

## Change (minimal, no state duplication)
- `App.tsx`: add `/documents` and `/samples` routes rendering `<Dashboard section=... />`.
- `Dashboard.tsx`: accept optional `section: 'documents' | 'samples'`; when set, render
  only that section (as the page h1) plus the shared dialogs — all existing state,
  import, download/quota and letterhead-preview plumbing is reused verbatim because it
  is the same component. `/dashboard` output stays byte-identical (headings keep their
  anchor ids; old `#documents`/`#samples` links keep working).
- `WorkspaceNav.tsx`: point the two items at the new routes with proper active state.
- `worker/index.ts`: add both paths to `SPA_ROUTES` so the shell serves with 200.

## Out of scope
- No extraction of the documents/samples JSX into new files (pure conditional wrapping).
- No changes to documents storage, letter exports, sample data or quota logic.

## QA (production)
1. `/documents`: h1 Career documents, nav item active, docs list/import/open/download work.
2. `/samples`: h1 Sample library, search/industry/saved filters work.
3. `/dashboard` regression: all three sections still render with anchors.
4. Old anchor links still scroll.
5. 375px strict scrollWidth=375 on both new routes; dark mode readable.
6. Zero AI quota; intercept /api/ai/*; restore localStorage/theme.
