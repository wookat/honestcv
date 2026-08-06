# Iteration log

Continuous improvement loop. Each round: five drivers (QA testing, UX walkthrough,
frontend/visual & accessibility analysis, competitor research, user/data analytics)
→ P0/P1/P2 triage → fix → deploy → verify live → next round.

## Round 1 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (route sweep) | Unknown URLs (e.g. `/nonexistent-page-xyz`) returned HTTP 200 with the SPA shell — soft-404s that waste crawl budget and can hurt indexing | P1 |
| 2 | Visual/a11y (axe-core on live site) | `/builder`: 3 icon-only delete buttons had no accessible name (critical); 3 drag handles used `aria-label` on generic `<span>` (prohibited); page had no `<h1>` | P1 |
| 3 | Visual/a11y (axe-core) | Landing: empty `<th>` in comparison table; heading order jumped h1→h3 in features grid | P2 |
| 4 | SEO/UX | `/builder` and `/ats-checker` shared the homepage `<title>`/description (SPA, no per-route meta); `index.html` had no canonical/OG tags | P1 |
| 5 | Data (analytics.mjs, 7d) | 5 PV / 5 UV (all QA traffic), 3 email leads (all test) — no organic yet; homepage meta still said "pay $9.99" while the site is in free launch mode | P2 |

**Fixes shipped** (worker version `f88b0aaa`)

- Worker now returns real **404** (with SPA shell body) for unknown paths; SPA routes
  (`/`, `/builder`, `/ats-checker`) still get 200. `not_found_handling` switched
  `single-page-application` → `none`.
- Builder: delete buttons got `title` + `aria-label`; drag handles got `role="button"`;
  sr-only `<h1>` added.
- Landing: sr-only "Feature" table header; sr-only `<h2>` for the features section.
- Per-route `<title>` + meta description via `usePageMeta` (Landing / Builder / ATS checker).
- `index.html`: canonical + OpenGraph/Twitter tags; description aligned with free launch mode.

**Verification (live)**

- `curl`: `/nonexistent-page-xyz` → 404, SPA routes → 200, static pSEO pages → 200, `/api/nope` → 404 JSON.
- axe-core rerun on `/`, `/builder`, `/ats-checker`: **0 violations** (was 6 across 3 pages).
- Per-route titles confirmed in live browser.

**Data snapshot**: 7d PV 5 / UV 5 (QA), leads 3 (test).

## Round 2 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor research | Zety/Resume.io/Rezi/Teal all support uploading an existing resume file; HonestCV only accepted pasted text — the biggest onboarding friction for users with an existing PDF/DOCX resume | P1 |
| 2 | UX walkthrough | `/ats-checker` also required manual paste; the shareable checker is the top-of-funnel page, so upload matters most there | P1 |

**Fixes shipped** (worker version `19f90b94`)

- New `src/lib/extractFile.ts`: client-side text extraction from `.pdf` (pdfjs-dist
  **legacy build** — the standard v6 build crashed with `a.toHex is not a function`
  on browsers without the newest `Uint8Array` APIs; legacy ships polyfills),
  `.docx` (fflate unzip + `word/document.xml` strip) and `.txt`. PDF lines are
  reconstructed by grouping text items on y-coordinate so `parseResumeText`
  still sees real line structure. pdfjs loads lazily (separate ~127 KB gz chunk)
  only when a PDF is chosen; nothing is uploaded to a server.
- Builder import dialog: "Upload PDF / DOCX / TXT" button fills the review textarea
  before importing; scanned-image PDFs get a clear error.
- `/ats-checker`: upload button fills the resume textarea directly.

**Verification (live)**

- PDF upload on `/ats-checker` → text extracted (name/bullets present) → score renders.
- DOCX upload on `/ats-checker` → text extracted with skills intact.
- Builder: PDF upload → review text → import → preview shows parsed employer and metrics.

## Round 3 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data analysis | 7d traffic still 5 PV / 5 UV (all QA) — traffic acquisition is the bottleneck, and the guide library (3 posts) is far thinner than competitors' content hubs (Zety/Resume Genius run hundreds of guide pages that drive their organic traffic) | P1 |
| 2 | Competitor research | Highest-volume long-tail topics we don't cover: resume action verbs, resume length, resume with no experience (peak season for new grads), employment gaps | P1 |
| 3 | QA/SEO | Homepage had no structured data (JSON-LD), reducing rich-result eligibility | P2 |

**Fixes shipped** (worker version `f87c573f`)

- 4 new long-tail guides (6 substantive sections each, cross-linked from every
  guide's "related" block, in sitemap): `/guides/resume-action-verbs`,
  `/guides/how-long-should-a-resume-be`, `/guides/resume-with-no-experience`,
  `/guides/employment-gap-resume`. Sitemap 26 → 30 URLs; IndexNow push HTTP 200 (30 URLs).
- `WebApplication` JSON-LD on the homepage.

**Verification (live)**

- All 4 guide URLs → HTTP 200 (one needed ~30s asset propagation after deploy).
- `ld+json` present on live homepage; sitemap serves 30 `<loc>` entries.

**Data snapshot**: 7d PV 5 / UV 5 (QA only), leads 3 (test). No organic traffic yet — social/community posting still pending on boss's side.

## Round 4 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Visual/mobile walkthrough (390px viewport) | `/builder` had horizontal overflow (`scrollWidth` 497 vs 375 viewport): the header action row (badge + undo + PDF + DOCX) pushed past the edge, cutting off the download buttons and leaving a horizontal scrollbar | P1 |
| 2 | UX walkthrough (mobile) | Live preview sits ~2500px below the editor on mobile with no way to jump to it — users can't see what they're building | P1 |

**Fixes shipped** (worker version `092234a3`)

- "Free during launch"/"Unlocked" badge hidden below `sm` — header now fits 390px
  (`scrollWidth` 375 = viewport, no overflow).
- Floating "Preview" button (bottom-right, `lg:hidden`) smooth-scrolls to the
  preview column; preview container got `scroll-mt-16` for the sticky header.

**Verification (live, 390×844)**

- `scrollWidth === clientWidth` (375) — overflow gone.
- Preview button visible, click scrolls to preview (scrollY ≈ 2535).

## Round 5 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA regression (live golden path) | Clean-profile run passed: load example → ATS score renders → PDF download via free email unlock → DOCX download (`jordan-reyes-resume.pdf/.docx` both received) | — |
| 2 | Visual/a11y (axe on static SEO pages — first scan of these) | `link-in-text-block` (serious) on guides, /vs/ and template pages: inline links relied on color alone (`text-decoration:none` until hover) | P1 |

**Fixes shipped** (worker version `300d076c`)

- Static-page CSS: links are always underlined (`text-underline-offset:3px`);
  buttons and the brand link opt out (`a.btn, a.brand`).

**Verification (live)**

- axe rerun on guides, `/vs/zety`, `/templates/ivy`, `/privacy`, `/terms`: all clean
  (guide pages needed ~30s edge-cache propagation).
- Golden-path QA as above — no regressions from R1–R4 changes.

**Data snapshot**: unchanged (5 PV / 5 UV QA-only, 3 test leads).

## Round 6 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor research + visual | Zety/Resume.io/Kickresume all show visual template previews; our picker was 12 text chips with only a color dot — users couldn't compare layouts without clicking through each | P1 |

**Fixes shipped** (worker version `ce91d140`)

- Template picker: new `TemplateThumb` schematic mini-previews (64px cards)
  derived from each template's real metadata — header alignment, serif font,
  divider style (line/thick/none) and accent color — with the template name below
  and a ring on the selected card.

**Verification (live)**

- 12 thumbnails render, selection ring follows clicks (screenshot in PR #15).
- Mobile 390px re-check: no horizontal overflow with the new grid.
- Note: bundle propagation took ~60s post-deploy (old JS hash served briefly) —
  worth remembering when verifying deploys.

## Round 7 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX/conversion walkthrough | Landing page showed no product visual at all — competitors lead with template galleries; visitors had to click into the builder blind | P1 |

**Fixes shipped** (worker version `fdc54346`)

- `TemplateThumb` extracted to `src/components/TemplateThumb.tsx` (shared).
- New landing section "12 ATS-safe templates, one honest layout rule": all 12
  template thumbnails linking to `/builder`, with the single-column/ATS-safe
  positioning line.

**Verification (live)**

- Gallery renders with 12 linked thumbnails; axe on landing clean; no mobile
  overflow at 390px.

## Round 8 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data/funnel analysis | /ats-checker → /builder is the main conversion funnel, but the CTA opened an empty builder — users had to re-paste everything, a guaranteed drop-off point | P1 |

**Fixes shipped** (worker version `8589e90b`)

- ATS checker CTA now carries the pasted resume + job description into the
  builder: parses via `parseResumeText`, saves to localStorage, navigates.
  If the builder already has a saved resume, a confirm dialog protects it
  (cancel keeps the resume but still carries the JD over).

**Verification (live)**

- Clean profile: paste resume + JD → check score → CTA → lands on /builder with
  contact name "Alex Doe" and the JD present in the saved resume.

## Round 9 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor research (first-hand R3 Kickresume test) + SEO | We hold verified first-hand evidence on Kickresume (free tier = PNG-of-page-one only, ~$19–24/mo, AI fabricated metrics) but had no /vs/kickresume page to capture that search demand | P1 |

**Fixes shipped** (worker version `5971cc43`)

- New `/vs/kickresume` comparison page built from our own August 2026 test
  findings (no unverifiable claims). Sitemap 30 → 31 URLs; IndexNow resubmitted
  (HTTP 200, 31 URLs).

**Verification (live)**

- `/vs/kickresume/` → HTTP 200 (after ~60s asset propagation); sitemap serves
  31 `<loc>` entries.

## Round 10 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Visual/social + traffic goal | No `og:image` anywhere — shared links (the whole traffic play) rendered as bare text cards on X/LinkedIn/Slack/Reddit | P1 |

**Fixes shipped** (worker version `87772f24`)

- New 1200×630 `public/og.png` (brand, "never charges you monthly" headline,
  schematic resume visual, "Free during launch" pill).
- `og:image` + `twitter:card summary_large_image` on the SPA (`index.html`) and
  all static SEO/guide/legal templates in `build-seo.mjs`.

**Verification (live)**

- `https://cv.zalize.com/og.png` → 200; `og:image` present on `/` and `/vs/zety/`.

**Rounds 6–10 complete — batch SOP-04 report sent.**

## Round 11 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor research | Zety/Resume.io's most-loved editor feature is pre-written content suggestions; we offered nothing for the blank-textarea problem (AI rewrite needs existing text, and the AI relay is down anyway) | P1 |

**Fixes shipped** (worker version `103448d9`)

- `src/lib/bulletStarters.ts`: curated bullet starters for 8 role families
  (engineering, sales, marketing, PM, design, data, support, ops) + generic
  fallback, matched against the role title + target role. All quantities are
  `[add …]` placeholders — consistent with the anti-fabrication stance, unlike
  competitors' invented numbers.
- `BulletIdeas` toggle under each experience card: click a starter to append it
  as a bullet; footer reminds users to replace placeholders with real numbers.

**Verification (live)**

- Example resume → toggle shows engineering starters → click appends bullet
  (3 → 4 bullets in localStorage). Works without AI, fully client-side.

## Round 12 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | SEO/data (traffic is the sole current goal) | Content library at 7 guides vs competitors' hundreds; four high-volume long-tail topics uncovered: skills section, resume format, tailoring to a JD, remote-job resumes | P1 |

**Fixes shipped** (worker version `1c0ae5d4`)

- Four new guides: `/guides/skills-for-resume`, `/guides/best-resume-format`,
  `/guides/tailor-resume-to-job`, `/guides/remote-job-resume` — six substantive
  sections each, honest-advice angle, cross-linked, funneling to the ATS checker.
- Sitemap 31 → 35 URLs; IndexNow submitted (HTTP 200).

**Verification (live)**

- All four new guide URLs → HTTP 200.

## Round 13 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | SEO/UX walkthrough | `/guides/` and `/templates/` (natural hub URLs users and crawlers try) returned 404 — 11 guides and 12 template pages had no index/hub, weakening internal linking | P1 |

**Fixes shipped** (worker version `89866088`)

- New `hubPage` generator in `build-seo.mjs`; static hub pages at `/guides/`
  (lists all 11 guides) and `/templates/` (lists all 12 template pages).
- Sitemap 35 → 37 URLs; IndexNow submitted (HTTP 200, 37 URLs).

**Verification (live)**

- `/guides/` and `/templates/` → HTTP 200; sitemap serves 37 `<loc>` entries.

## Round 14 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA regression (mobile 390px + axe) | Builder, ATS checker, hubs, landing: no overflow, hubs axe-clean, bullet-starter buttons 46px touch targets — no P0/P1 found | — |
| 2 | SEO/internal linking | New hubs weren't linked from any footer: SPA footer pointed at a single guide/template, static footers had no hub links at all | P1 |

**Fixes shipped** (worker version `b05f4216`)

- SPA footer: "Resume guides" → `/guides/`, "Resume templates" → `/templates/`.
- All static page footers (comparison/guide/template/legal/hub) now link
  Guides · Templates hubs.

**Verification (live)**

- `/vs/zety/` footer contains `/guides/` link; SPA serving new bundle.

## Round 15 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (golden path export regression) | Free-mode email unlock → PDF (real text, `pdftotext` extracts content) → DOCX (valid zip, 22 entries) all pass | — |
| 2 | QA (new-feature interaction) | R11 bullet starters insert `[add …]` placeholders, but the pre-download Final Check didn't flag unreplaced ones — users could ship a resume literally containing "[add %]" | P1 |

**Fixes shipped** (worker version `c1bae6de`)

- `finalCheckIssues` now counts bracket placeholders (`/\[[^\]\n]{1,60}\]/g`)
  across the whole resume and warns "replace with your real details" before
  download.

**Verification (live)**

- Insert starter → click PDF → Final Check dialog flags the bracket
  placeholder. Export regression all green.

**Rounds 11–15 complete — batch SOP-04 report sent.**

## Round 16 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor research (first-hand benchmark R1 reports) + SEO | Verified first-hand evidence on Rezi (free tier: 1 resume / 3 PDFs / 10 AI generations / 1 of 11 templates, DOCX paywalled, $29/mo) and Teal (~$13/week billing, monthly pre-selected, keyword list paywalled, AI invented "30%") had no comparison pages | P1 |

**Fixes shipped** (worker version `af8b154c`)

- `/vs/rezi` and `/vs/teal` comparison pages — claims limited to what
  `docs/bench-r1/report-rezi.md` / `report-teal.md` actually observed
  (Teal's generous free tier is acknowledged).
- Sitemap 37 → 39 URLs; IndexNow submitted (HTTP 200, 39 URLs).

**Verification (live)**

- `/vs/rezi/` and `/vs/teal/` → HTTP 200; sitemap serves 39 `<loc>` entries.

## Round 17 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (landing, free mode) | FAQ and pricing footnote contradicted the live product: "You pay only to download PDF/DOCX", "Payments processed by Paddle", "purchase comes with a license key" — while downloads are actually free with an email. Misleading copy on an honesty-branded product | P0 |

**Fixes shipped** (worker version `a0d10b92`)

- Three FAQ answers ("Is it really one payment?", "What exactly is free?",
  "What if I need it on another device?") and the pricing footnote are now
  `freeMode`-aware; paid-mode copy returns automatically when FREE_MODE flips.
- Removed the stale "Payments processed by Paddle" claim (paid-mode copy now
  says "merchant of record").

**Verification (live)**

- Landing shows "zero payments — everything is free during launch" FAQ and
  "No payment is collected during launch" footnote; no "processed by Paddle"
  text remains.

## Round 18 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (copy consistency sweep, follow-up to R17) | Upgrade dialog (paid-mode surface) still claimed "Payments are securely processed by Paddle" — the live provider abstraction may use Lemon Squeezy | P1 |
| 2 | SEO | Landing FAQ had no FAQPage structured data for rich results | P2 |

**Fixes shipped** (worker version `11f646bf`)

- Paywall dialog footnote: "Paddle" → "our merchant of record".
- FAQPage JSON-LD in `index.html` with the two mode-invariant Q&As (ATS
  parseability, browser-local data).

**Verification (live)**

- `/` serves FAQPage JSON-LD; typecheck/lint/build green.

## Round 19 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX/SEO walkthrough | `/vs/` (natural hub URL above 7 comparison pages) returned 404 — same gap class as R13's `/guides/`+`/templates/` | P1 |

**Fixes shipped** (worker version `2648b516`)

- `/vs/` hub added to `HUBS`, listing all comparison pages with a
  first-hand-testing methodology intro.
- Sitemap 39 → 40 URLs; IndexNow submitted (HTTP 200, 40 URLs).

**Verification (live)**

- `/vs/` → HTTP 200; sitemap serves 40 `<loc>` entries.

## Round 20 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough | Ctrl+P from the builder printed the entire app UI (header, form, buttons) instead of the resume — a common escape hatch users reach for | P1 |

**Fixes shipped** (worker version `ff08dab6`)

- Print stylesheet in `index.css`: only the resume preview
  (`[data-resume-preview]`) is visible when printing; border/shadow/aspect-ratio
  clipping removed so multi-page content flows.

**Verification (live)**

- Print-media emulation: preview `visibility: visible`, header hidden,
  `overflow: visible`; printed PDF contains the resume text only.

**Rounds 16–20 complete — batch SOP-04 report sent.**

## Round 21 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Mobile UX walkthrough (/ats-checker funnel, 375px) | After scoring, the "Fix it in the builder — resume & job carried over" CTA (`whitespace-nowrap`, 393px wide) caused horizontal page overflow (scrollWidth 451 vs 360) on the funnel's key conversion screen | P1 |
| 2 | Same walkthrough | Resume + JD carryover into builder re-verified working (`honestcv.resume` gets name + jobDescription) | — |

**Fixes shipped** (worker version `f353553f`)

- CTA button now `h-auto max-w-full whitespace-normal` so the label wraps on
  narrow screens.

**Verification (live)**

- 375px: overflow `{"s":360,"c":360}` after scoring; carryover confirmed
  (`name: "Jordan Reyes"`, JD present).

## Round 22 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data/search-term analysis (fall recruiting season) | Guide library had no pages for the season's highest-volume audiences: new grads, internship applicants, career changers | P1 |

**Fixes shipped** (worker version `c13c69ea`)

- Three new guides: `/guides/new-grad-resume`, `/guides/internship-resume`,
  `/guides/career-change-resume` — six substantive sections each, funneling to
  the free ATS checker. Auto-listed on the `/guides/` hub.
- Sitemap 40 → 43 URLs; IndexNow submitted (HTTP 200, 43 URLs).

**Verification (live)**

- All three guides → HTTP 200; sitemap serves 43 `<loc>` entries.
