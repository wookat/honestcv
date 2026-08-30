# R21 — Workspace shell: persistent sidebar on app routes (Rezi 操作台对标)

Date: 2026-08-29 · Round: R21 · Prior: R20 (#233 jobs row quick actions)

## First-hand evidence (2026-08-29)

Rezi app (`app.rezi.ai/dashboard*`, text capture `~/audit-r1/shots-r19/rezi-app-dashboard.txt`,
`app-job-search.txt`): every workspace route shares a persistent left sidebar —
`CREATE NEW RESUME / MY DASHBOARD / AI RESUME AGENT / AI INTERVIEW / JOB SEARCH /
RESUMES / COVER LETTERS / RESIGNATION LETTERS`. Navigation between workspace areas is
one click and always visible; the marketing site nav is gone inside the app.

RezUp production (fresh capture 2026-08-29, `~/audit-r1/shots-r21/rezup-dashboard.png`,
`rezup-jobs.png`): `/dashboard` and `/jobs` are standalone pages under the marketing
top nav (Templates/Examples/Resources/ATS Checker/Jobs/Pricing). Moving between
My resumes ↔ Career documents ↔ Sample library ↔ Job search means scrolling one long
page or using marketing nav links. There is no workspace frame.

**Gap class: 操作台 P1.** The "real workspace" feel Thomas asked for is exactly this:
app routes should feel like one product surface, not marketing pages.

## Scope (this round)

1. New `WorkspaceNav` component (in `src/components/Layout.tsx` or its own file):
   left sidebar rendered on `/dashboard` and `/jobs` at `md+`:
   - primary action: **Create new resume** → `/builder` (matches Rezi's top CTA)
   - links with live counts from localStorage:
     - My resumes (`/dashboard`, count = draft?1:0 + versions)
     - Career documents (`/dashboard#documents`, count = careerDocs)
     - Sample library (`/dashboard#samples`)
     - Job search (`/jobs`, count = pipeline entries)
     - ATS checker (`/ats-checker`)
   - active route highlighted (aria-current).
2. `/dashboard`: add `id="documents"` / `id="samples"` anchors to existing sections
   so sidebar links land on them; two-column shell `md+` (sidebar ~220px + content).
3. `/jobs`: same shell; existing two-pane board becomes the content column.
4. Mobile (<md): sidebar hidden; existing hamburger nav already covers these routes —
   add "Job search" alongside "My resumes" in the mobile menu if missing (it has Jobs).
5. Builder stays full-width (Rezi's editor is likewise its own full-screen surface).

## Explicitly out of scope
- No account system / cloud persistence (architecture rule).
- No AI Resume Agent / AI Interview clones (no honest backing features).
- No re-routing of existing URLs; `/dashboard` and `/jobs` keep their paths.

## Architecture
Pure front-end batch: no Worker/API/storage changes. Counts read via existing
`listResumeVersions()/loadResume()/listCareerDocs()/listPipeline()` on mount.

## Acceptance
- 1440px: sidebar visible on /dashboard and /jobs, active item highlighted, counts
  correct, Create new resume → /builder, anchors scroll to sections.
- 375px: no sidebar, no horizontal overflow, hamburger still reaches all areas.
- Local `npm run lint` + `npx tsc -b` + `npm run build` green; independent PR
  (base = R20 branch); deploy; production QA both viewports.
