# R52 — Plan comparison matrix on /pricing/

## First-hand evidence (2026-08-29, ~/audit-r1/shots-r52/)

- Rezi's pricing page (`rezi.ai/pricing`, `rezi-pricing-full.png`) has a full
  "Compare all features" matrix below the plan cards: Free / Pro / Enterprise
  columns with per-feature rows grouped by category (Usage, Advanced Resume
  Tech, Rezi AI Writer, Interview, Resume Review, Downloading, Template
  Formats, User & Team Access), each cell a checkmark, "Limited", "Unlimited"
  or a concrete number. A visitor can scan exactly what each tier includes.
- Our `/pricing/` (`rezup-pricing-full.png`) has plan cards and a comparison
  vs "a typical subscription builder", but **nothing compares our own tiers**:
  what the free tier includes is buried in FAQ prose ("What is free before I
  pay anything?"), and Free vs Single Resume vs Career Bundle can only be
  reconstructed by reading the cards and FAQ together.

Gap: **P2, landing/content dimension.** Scannability of our own plan
differences is the concrete deficit; everything else on the page holds up.

## Design

Add a "Compare our plans" table between the plan cards and the existing
subscription-builder comparison on the static `/pricing/` page:

- Columns: Free · Single Resume $9.99 once · Career Bundle $19.99 once.
- Rows are our real, verifiable features only: editor & live preview, 22
  ATS-safe templates, ATS match score, AI rewrites (5 free / unlimited),
  PDF+DOCX downloads (paid tiers), cover letters + interview prep + all
  future features (Bundle), account required (No/No/No), recurring charges
  (Never ×3).
- A note above the table restates the beta reality (everything currently
  free) so the matrix cannot be read as active billing.
- Plain HTML table reusing the existing `table.cmp` styles; zero JS, zero new
  dependencies, static page only (React app has no pricing route).

## Deliberately NOT copied from Rezi

- Category-grouped mega-matrix with dozens of rows (we have 2 plans and ~9
  honest differences; padding rows would be noise).
- Enterprise column, team access, SSO (we have no such offering).
- "Unlimited Resumes Unit" style marketing counters with no backing product.
