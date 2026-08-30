# R50 — Search filter on the /examples/ hub

## First-hand evidence (2026-08-29, ~/audit-r1/shots-r50/)

- Rezi's examples hub (`rezi.ai/resume-examples`, `rezi-examples-hub.png`): headline
  "Find your perfect resume example", a **"Search by job title or industry"
  search box**, a category sidebar (Popular / Accounting & Finance /
  Administrative / Business / Construction / …), and large sample thumbnails.
  Claims 300+ samples.
- Our `/examples/` hub (`rezup-examples-index.png`): a static grouped list of all
  30 examples with small generic thumbnails and one-line blurbs. No way to
  filter or search — a reader looking for "nurse" must scan five sections.

R49 just promoted this hub to a first-class landing-page destination, so its
findability now matters more. Gap: **P2, landing/content dimension** — with 30
items a search box is genuinely useful (Rezi's categories sidebar is less
relevant at our scale; our grouped sections already cover it).

## Design

- `public/hub-filter.js` (new static asset): progressive-enhancement filter.
  The strict CSP (`script-src 'self'`) forbids inline scripts, so this follows
  the `/t.js` pattern — a tiny external file, loaded only on hub pages that
  opt in.
  - Reveals the search input (shipped `hidden` in the HTML so no-JS readers
    never see a dead control).
  - On input: case-insensitive substring match against each `li`'s text
    (role + blurb, so "nurse", "SQL", "CDL" all work); hides non-matching
    `li`s, hides any `h2` + `ul` group with zero matches, and shows a
    "No examples match …" empty-state line when nothing matches.
- `scripts/build-seo.mjs` `hubPage()`: new optional `filterPlaceholder` field;
  when set, renders the hidden `<input type="search">` + empty-state `<p>` and
  loads `/hub-filter.js`. Only the `/examples/` hub sets it
  (placeholder: "Search by job title — nurse, engineer, sales…").

## Deliberately not copied

- Rezi's category sidebar (our 5 grouped sections already serve this at
  30-item scale) and "Popular" tab (no traffic data to rank by — would be
  invented).
- Large fake-content thumbnails; our examples link to full honest pages.

## QA plan

- Local: lint, tsc, build; verify built `/examples/index.html` contains the
  input + script tag and other hubs don't.
- Production 1440 + 375: type "nurse" → only matching roles remain and empty
  groups collapse; clear → all 30 restored; garbage query → empty-state line;
  no-JS parity unaffected (input is `hidden` before JS runs); no overflow;
  console clean (CSP must not block the script).
