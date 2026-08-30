# R49 — Landing page: resume examples section

## First-hand evidence (2026-08-29, ~/audit-r1/shots-r49/)

- Rezi homepage (`r49-rezi-home.png`, 1440px) has a first-class section
  "Find inspiration with great resume examples" with 9 category tiles
  (Programming / Marketing / Engineering / Business / Finance / Student /
  Design / Legal / Medical / View all) directly on the landing page.
- Our landing page (`r49-rezup-home.png`) ships 30 role-specific example
  pages under `/examples/…` (built by `scripts/build-seo.mjs`, grouped into
  5 sectors via `EXAMPLE_GROUPS`), but on the landing page they only appear
  as a one-line text link under the template gallery. Examples are a top
  acquisition/SEO surface and are effectively buried.
- Also audited this round (no gap found / out of scope):
  - Rezi cover-letter creation, Expert Review: paywalled ($29/mo Pro) /
    paid human review — business-model differences, deliberately not copied.
  - Rezi editor Contact/Education/Skills/Summary field sets: covered by our
    schema (contact links, minor/GPA fit our `details` field).
  - Rezi mobile "Sort" sheet (drag to rearrange entries): we already have
    drag reorder + arrow buttons.
  - Production sweep 375/1440 across 14 routes: no overflow, no console
    errors, no 4xx (earlier 404s were probe-URL artifacts).

## Gap

P2 (landing dimension): examples exist but are not discoverable from the
landing page as a browsable section, unlike Rezi.

## Design

Insert a "Resume examples" section on the landing page between the template
gallery and Pricing:

- Heading: "Steal the structure from 30 real resume examples" +
  one-line honest subcopy (complete resumes, not lorem ipsum).
- 5 category cards mirroring `EXAMPLE_GROUPS` (Tech & data, Business &
  finance, Healthcare & education, Trades & transport, Customer-facing &
  office). Each card: sector name, role-count, and 3 representative role
  links (plain `<a>` to the static `/examples/<slug>/` pages).
- Footer link "View all 30 examples →" to `/examples/`.
- Mobile: cards stack single-column; all links ≥40px touch targets.
- No new routes, data, storage, or AI. Categories/slugs duplicated as a
  small const in `Landing.tsx` (landing is a React page; the generator is
  a build script — importing it is not possible without restructuring).

Deliberately not copied: Rezi's fabricated-looking blurred preview art and
"View all" categories we don't have (Student/Legal as standalone sectors).

## QA plan

- Local lint/tsc/build green; deploy; production check 1440 + 375
  (section renders, links resolve 200, no overflow, console clean).
