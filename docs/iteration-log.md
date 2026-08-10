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

## Round 23 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA regression (R22 pages) | 6 new/hub pages axe-clean, no mobile overflow | — |
| 2 | UX walkthrough | Unknown URLs returned HTTP 404 correctly (R1 fix) but rendered the full landing page — confusing "am I in the right place?" experience with no recovery links | P2 |

**Fixes shipped** (worker version `7ce748bd`)

- Dedicated `NotFound` page for the SPA catch-all route: clear "Page not
  found" heading + CTAs to builder/ATS checker and links to the three hubs.

**Verification (live)**

- `/nonexistent-xyz` → HTTP 404 with the new not-found page and hub links.

## Round 24 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor research (pricing re-verification, public pages only) | Zety ($1.95 trial → $25.95/4wk), Resume.io ($2.95 → $29.95), Kickresume ($19.20–24/mo, currently on a 20% "limited time" discount) — all our /vs/ pricing claims still accurate as of today | — |
| 2 | Same | Comparison pages carried no "when was this checked" signal — freshness is a trust factor for an honesty-branded product | P2 |

**Fixes shipped** (worker version `db6d1341`)

- All `/vs/` pages now show "Competitor pricing and free-tier limits last
  re-verified against their public pricing pages: August 2026."

**Verification (live)**

- `/vs/zety/` shows the re-verified stamp; competitor prices confirmed via
  their own public pricing pages.

## Round 25 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA regression (builder golden path) | Template switch → PDF (text-extractable, uppercase Bold header correct) → DOCX (valid zip, 22 entries) all green | — |
| 2 | Visual/accessibility review (mobile touch targets) | Bullet-starter toggle was 16px tall and accent swatches 20px — well under the ~44px/24px touch guidance | P2 |

**Fixes shipped** (worker version `14ae4d6c`)

- Bullet-ideas toggle: `min-h-8` with negative-margin-compensated padding.
- Accent swatches: 32px hit area (`size-8` button wrapping the visual 20px
  dot), keeping the visual design unchanged.

**Verification (live)**

- 375px: swatch and toggle hit areas both 32px, no overflow, swatch click
  still applies the accent.

**Rounds 21–25 complete — batch SOP-04 report sent.**

## Round 26 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (new import-parser test cases: LinkedIn-style, ALL-CAPS, no-blank-lines, unicode dashes) | Year ranges like "2010 - 2014" were extracted as the phone number (`PHONE_RE` matched them) | P1 |
| 2 | Same | En/em-dash bullet lines ("– Shipped API") weren't recognized as bullets and got misparsed as roles | P2 |

**Fixes shipped** (worker version `25bb633c`)

- `findPhone()` skips year-range candidates and requires ≥7 digits.
- Bullet detection now accepts `–` and `—` markers.

**Verification (live)**

- Paste-import on /ats-checker → builder: phone empty (no false year range),
  en-dash lines land as bullets.

## Round 27 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Visual review + competitor pattern (Zety/Resume.io template galleries are fully visual) | Our /templates/ hub and 12 template pSEO pages were text-only — no visual preview at all, while templates are an inherently visual purchase decision | P1 |

**Fixes shipped** (worker version `8ccb73c7`)

- `templateThumbSvg()` in `build-seo.mjs`: inline SVG schematic per template
  (header alignment, name case, accent color, divider style) mirroring the
  in-app `TemplateThumb`. Rendered on each `/templates/*` page (140px) and as
  72px thumbs beside every entry on the `/templates/` hub.

**Verification (live)**

- `/templates/` serves 12 SVGs, each template page 1; axe clean, no mobile
  overflow at 375px.

## Round 28 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (first-time /ats-checker visitor) | Empty state was a dead end: two blank textareas and a disabled button — nothing demonstrates what the score output looks like before the visitor invests in pasting a resume | P2 |

**Fixes shipped** (worker version `50c1592a`)

- "see an example score" link in the empty state fills a realistic sample
  resume + job description and immediately shows the scored result.

**Verification (live)**

- Click on the link fills both fields and renders score with matched/missing
  keywords.

## Round 29 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data/discovery analysis (traffic mode) | robots.txt + sitemap present, but no llms.txt — AI assistants (a growing referral source for "best free resume builder"-type questions) had no curated site index | P2 |

**Fixes shipped** (worker version `8a0ae82b`)

- Generated `/llms.txt` (llmstxt.org format) in `build-seo.mjs`: product
  summary + all comparison/guide/template URLs with descriptions.

**Verification (live)**

- `https://cv.zalize.com/llms.txt` → HTTP 200, 50 lines, all sections
  present.

## Round 30 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA regression (full sitemap sweep) | All 43 sitemap URLs → HTTP 200 | — |
| 2 | Accessibility scan (SPA routes, mobile) | Landing's pricing comparison table wrapper (`overflow-x-auto`) was scrollable but not keyboard-focusable — axe `scrollable-region-focusable` violation | P1 |

**Fixes shipped** (worker version `e5aa9b45`)

- Comparison-table scroll wrapper gets `tabIndex={0}` + `role="region"` +
  descriptive `aria-label`, making it keyboard-scrollable.

**Verification (live)**

- axe on `/` at 375px: zero WCAG 2.0/2.1 A/AA violations (was 1).

## Round 31 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (bundle tools, AI relay still out of quota) | The cover-letter dialog was a hard dead end without AI: "Generate" is the only path and it errors while the relay is down | P1 |

**Fixes shipped** (worker version `6101a3f6`)

- "Start from a template" in the cover-letter dialog: inserts a structured,
  non-fabricating letter skeleton pre-filled with the user's name, target
  role and company, using the same `[add …]`-style placeholders as bullet
  starters. Editable and exportable via the existing PDF/DOCX buttons — no AI
  required.

**Verification (live)**

- Template inserts with company "Stripe" + resume name; PDF export of the
  letter is real text (extractable).

## Round 32 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (bundle tools, follow-up to R31) | Interview-prep dialog had the same AI dead end R31 fixed for cover letters — no non-AI path | P1 |

**Fixes shipped** (worker version `40fe81e1`)

- "Start from a template" now also works for interview prep: inserts a
  5-section prep checklist (story, evidence, posting keywords, questions to
  ask, logistics) pre-filled with the target role, `[add …]` placeholders,
  exportable via existing PDF/DOCX buttons.

**Verification (live)**

- Template inserts with 5 numbered sections; DOCX export valid (22 zip
  entries).

## Round 33 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA regression (site consistency audit) | /terms and /privacy footers missed the R14 footer unification: no Guides/Templates hub links, no cross-promo links; legal pages also lacked og:/twitter meta present on every other static page | P2 |

**Fixes shipped** (worker version `407cd711`)

- `legalPage()` now uses the standard footer (Guides/Templates hubs +
  HonestQR/HonestPDF/SubSleuth) and full og:/twitter:card meta.

**Verification (live)**

- `/terms/` serves og:image meta and /guides/ footer link.

## Round 34 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor pattern (Zety/Resume.io both keep a persistent "resume score/completeness" meter in the editor) | Our builder had no always-visible completeness signal — new users get no guidance on what to fill in next until they hit Final Check at download time | P1 |

**Fixes shipped** (worker version `8a38b8e5`)

- `resumeStrength()` in `guidance.ts`: rule-based 0–100 completeness score
  (contact, summary, experience, bullets with numbers, education, skills,
  JD) — no AI. Builder shows a compact "Resume strength" card with color-coded
  progress bar (`role="progressbar"` + aria values) and the next 2 missing
  items.

**Verification (live)**

- Meter renders in the builder (45% for a partial resume) with "Next: …"
  hints; updates live as fields change.

## Round 35 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data analysis (traffic instrumentation audit) | Cloudflare's beacon.min.js is blocked by adblockers (`ERR_BLOCKED_BY_CLIENT` reproduced in our own browser) — our only traffic measurement silently undercounts exactly when real users arrive | P0 (data) |
| 2 | QA regression (mobile builder after R34) | 375px builder: no overflow, axe clean, strength meter renders | — |

**Fixes shipped** (worker version `5272d3a5`)

- First-party `/api/hit` endpoint: stores `hit:<day>:<ts>` keys in KV
  (path only, no cookies/PII, 90-day TTL).
- SPA (`index.html`): `navigator.sendBeacon('/api/hit', pathname)` on load +
  pushState/popstate route changes. Static pages: one-line beacon appended to
  `BEACON`.
- `scripts/analytics.mjs` now also reports per-day first-party hits alongside
  the CF Web Analytics numbers.

**Verification (live)**

- POST /api/hit → `{"ok":true}`; browser visit increments the KV count
  (1→2); analytics report shows the first-party section.

## Round 36 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (template funnel) | Clicking a specific template on the landing gallery or a `/templates/<slug>/` page opened the builder with the *default* template — the user's choice was silently discarded at the exact moment of highest intent | P1 |

**Fixes shipped** (worker version `200a6e26`)

- Builder honors a `?template=<id>` deep link (validated against `TEMPLATES`)
  when initializing state.
- Landing gallery thumbs link to `/builder?template=<id>`; both CTAs on each
  static template page link to `/builder?template=<slug>`.

**Verification (live)**

- `/builder?template=bold` → Bold selected; `?template=elegant` → Elegant
  selected. `/templates/bold/` serves two `?template=bold` CTAs.

## Round 37 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor pattern (Zety/Kickresume/Rezi all offer role-based suggested skills) | Skills was a bare textarea unless a JD was pasted (ATS missing-keyword chips) — no help for users without a posting at hand, and the bullet-starter role library already existed to match against | P2 |

**Fixes shipped** (worker version `e11fb055`)

- `skillSuggestionsFor(role)` in `bulletStarters.ts`: curated common-skill
  chips for the same 8 role families. Chips render under the Skills textarea
  ("tap only skills you actually have" — anti-fabrication framing), filter
  out already-listed skills, and append on click (same interaction as the ATS
  missing-keyword chips).

**Verification (live)**

- Target role "Product Manager" → chips render; clicking "+ Roadmapping"
  appends to Skills and removes the chip.

## Round 38 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough + competitor pattern (Zety/Resume.io preview shows page breaks) | Our continuous preview gives no hint whether the exported PDF is 1 or 2 pages — users only find out after downloading | P1 |
| 2 | Visual/mobile regression (375px, 6 key routes) | No overflow, axe clean everywhere | — |

**Fixes shipped** (worker version `43ef839a`)

- `pdf.ts`: extracted `composeResumePdf()` (returns the `PDFDocument`);
  `buildResumePdf()` saves it, new `countResumePdfPages()` returns
  `getPageCount()`.
- Builder `usePdfPageCount` hook (800 ms debounce, stale-result guard)
  renders "PDF export: N page(s)" above the preview — amber with a trimming
  hint when >1 page.

**Verification (live)**

- Indicator shows "PDF export: 1 page" in the builder and recomputes on
  edits.

## Round 39 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (R38 follow-up) | Verified the >1-page path live: 8 stuffed experience entries → "PDF export: 2 pages" amber warning renders | — |
| 2 | SEO/data (search-term coverage) | Three high-volume long-tail topics uncovered: cover letter writing (cross-sells our cover-letter tool), common resume mistakes, bullet-point formula (cross-sells bullet starters + guidance warnings) | P2 |

**Fixes shipped** (worker version `53fb56a2`)

- 3 new guides: `/guides/how-to-write-a-cover-letter`,
  `/guides/common-resume-mistakes`, `/guides/resume-bullet-points`
  (sitemap 43 → 46 URLs; IndexNow submitted 46 → HTTP 200).

**Verification (live)**

- All three guide URLs serve HTTP 200; sitemap serves 46 locs.

## Round 40 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA golden path (fresh state → text import → strength/pages/ATS → gated PDF export, live) | Import parsed name/roles correctly, strength 70%, page indicator live, ATS keywords matched, exported PDF has real text | — |
| 2 | Accessibility (same walkthrough) | Dialog close button's screen-reader label was Chinese "关闭" on an English product (shadcn scaffold leftover); one more Chinese comment in `download.ts` | P1 |

**Fixes shipped** (worker version `10aff20d`)

- `dialog.tsx` sr-only close label `关闭` → `Close`; translated the stray
  Chinese comment. Repo-wide Han-character scan now clean.

**Verification (live)**

- Full golden path re-ran green; exported PDF text extracts correctly
  ("Jordan Reyes / Software Engineer / …").

## Round 41 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data/funnel (traffic-mode strategy) | The moment of highest goodwill — right after a successful free download — ended silently; no share loop anywhere in the product while off-site distribution is the #1 traffic bottleneck | P1 |

**Fixes shipped** (worker version `cd4c6e90`)

- One-time post-download share dialog (per-browser `honestcv.shared` flag):
  copy-link for `/ats-checker` plus X and LinkedIn share intents. Framing
  stays honest — "if HonestCV helped, pass the free ATS checker to a friend".

**Verification (live)**

- After a real PDF download the dialog appears once, sets the flag, and does
  not re-show on subsequent downloads.

## Round 42 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data/funnel (R41 follow-through) | The ATS checker is the designated shareable traffic magnet, yet its own results screen had no share affordance — the R41 share loop only existed in the builder | P2 |

**Fixes shipped** (worker version `0af7122e`)

- One-line share footer under the checker results: "Know someone job
  hunting?" with an inline copy-link button ("Link copied!" feedback).

**Verification (live)**

- Example-score flow renders the line; clicking copies and flips to
  "Link copied!".

## Round 43 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | SEO/data (structured-data audit) | `WebApplication` JSON-LD on all static SEO pages hardcoded `price: 9.99` while the live product is in free mode — structured data contradicted the page's own free-mode banner | P1 |
| 2 | SEO | Guide `Article` JSON-LD lacked `dateModified`, `mainEntityOfPage`, `author` — signals Google uses for article freshness | P2 |

**Fixes shipped** (worker version `c2afe9fd`)

- JSON-LD offer is now `price: '0'` when `FREE_MODE` (falls back to 9.99
  when payment mode returns).
- Guide Article JSON-LD gains `dateModified` (build date),
  `mainEntityOfPage`, `author`.

**Verification (live)**

- `/vs/zety/` serves `"price":"0"`; `/guides/resume-keywords/` serves
  `"dateModified":"2026-08-06"`.

## Round 44 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (data-safety) | Our privacy page warns "clearing your browser data deletes your resume from existence" — yet the product offered no way to back up or restore that data. One accidental clear and hours of work vanish | P1 |
| 2 | Mobile/axe regression (375px builder, chips + share dialog) | No overflow, axe clean | — |

**Fixes shipped** (worker version `7dc1fbce`)

- Backup button downloads the resume as pretty-printed JSON
  (`<name>-honestcv-backup.json`); Restore reads a `.json` file back with the
  same shape validation as `loadResume`, showing an inline error for
  non-backup files. Keeps the browser-only privacy promise — no server
  involved.

**Verification (live)**

- Backup downloads valid JSON; overwriting the name and restoring the file
  brings the original back; a junk JSON file shows "That file is not a
  HonestCV backup."

## Round 45 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data analysis (first-party funnel) | The adblock-proof beacon recorded hits per day only — no per-path breakdown, so the report could not show which pages actually attract visits (the whole point of the traffic phase) | P1 |

**Fixes shipped** (script-only, no worker deploy needed)

- `scripts/analytics.mjs` now reads hit values (capped at 2000) and prints a
  first-party top-paths table alongside the per-day counts.

**Verification**

- Live run: 32 first-party hits on 2026-08-06 break down to /builder 24,
  /templates/ 2, /ats-checker 2, etc. — all QA/internal traffic, as expected;
  organic remains zero.

## Round 46 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor gap (Zety/Resume.io both offer multiple documents) | HonestCV held exactly one resume — yet our core pitch is tailoring per job description. Users tailoring for job B destroyed their version for job A | P1 |

**Fixes shipped** (worker version `cd989255`)

- Named resume copies stored browser-locally (`honestcv.resumeVersions`):
  "Copies" toolbar button opens a dialog to save the current resume under a
  name (prefilled from target role), load a copy into the editor, or delete
  one. Copy count badge on the button.

**Verification (live)**

- Save copy → edit → save second copy → load first restores the original
  name; delete removes the row; the count badge updates.

## Round 47 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor export reverse-engineering (Zety/Resume.io PDFs have clickable contact links) | Our exported PDF rendered email/website/LinkedIn as dead text — recruiters can't click through | P1 |

**Fixes shipped** (worker version `9953cd0c`)

- `PdfWriter.linkLine()`: contact line drawn as measured segments with
  pdf-lib URI link annotations (`mailto:` for email, https-normalized for
  website/LinkedIn); falls back to plain wrapped text when too wide for
  link geometry.

**Verification (live)**

- Exported PDF from production carries a `/Subtype /Link` annotation with
  `URI (mailto:jordan.reyes@email.com)` at the contact line coordinates
  (annotations live in object streams, verified by re-parsing with pdf-lib).

## Round 48 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (R47 parity check) | Same dead-text contact gap in the DOCX export — recruiters opening the Word file also could not click email/website/LinkedIn | P1 |

**Fixes shipped** (worker version `3969bbcb`)

- `docx.ts` contact line rebuilt from segments: `ExternalHyperlink` runs with
  the built-in `Hyperlink` style for email (`mailto:`) and https-normalized
  website/LinkedIn; plain runs for phone/location.

**Verification (live)**

- DOCX downloaded from production: `word/_rels/document.xml.rels` contains
  `mailto:jordan.reyes@email.com` and `document.xml` has the hyperlink run.

## Round 49 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | SEO (search-term analysis) | Two of the highest-volume informational queries in the category — "what is an ATS" and "resume vs CV" — had no page; both funnel naturally into the free checker/builder | P2 |

**Fixes shipped** (worker version `d107124e`)

- `/guides/what-is-an-ats` — myth-busting explainer (parsing mechanics, what
  recruiters see, the fake 75% auto-reject stat), CTA to the checker.
- `/guides/resume-vs-cv` — US/international usage, academic CVs, what to
  send when a posting says "CV". Sitemap 46 → 48; IndexNow submitted
  (48 URLs → HTTP 200).

**Verification (live)**

- Both routes 200; `/guides/` hub lists both.

## Round 50 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA regression (mobile sweep at 360px + axe across /, /ats-checker, /builder, new guides) | The builder toolbar row (Import/Backup/Restore/Copies) did not wrap, causing 527px horizontal overflow on a 345px viewport — the R46 Copies button pushed it past the edge | P1 |
| 2 | Same sweep | axe WCAG 2.0 A/AA clean on all swept routes including the new Copies dialog | — |

**Fixes shipped** (worker version `fa9f87e9`)

- Toolbar row gets `flex-wrap` + `gap-2` so the buttons wrap onto a second
  line on narrow screens.

**Verification (live)**

- 360px `/builder` scrollWidth 345/345 (no overflow); all other swept routes
  already clean.

## Round 51 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (landing vs shipped product) | The landing feature grid still described the R1-era product — none of the R44/R46/R47-48 differentiators (backup/restore, per-job copies, clickable exports) appeared anywhere on the page a first-time visitor decides on | P2 |

**Fixes shipped** (worker version `a34fec54`)

- Feature grid 4 → 6 cards: "One copy per job" (R46), "Clickable, ATS-clean
  exports" (R47/48); "Private by design" copy now mentions one-click JSON
  backup and restore (R44).

**Verification (live)**

- All three new copy blocks render on production; 360px landing shows no
  horizontal overflow with the 6-card grid.

## Round 52 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor export reverse-engineering (Zety/Resume.io entry headers) | Both competitors right-align dates on the entry-title line; our exports stacked dates on a second line under each role/degree — less scannable and one wasted line per entry against the 1-page goal | P2 |

**Fixes shipped** (worker version `6109c2e5`)

- PDF: `PdfWriter.titleLine(left, right)` draws the bold title and the
  right-aligned italic date on one baseline; stacks (old behavior) when
  they would collide.
- DOCX: entry-header paragraphs get a right tab stop at the margin with a
  real `<w:tab/>` before the date run (first attempt used a literal `\t`
  inside `w:t`, which Word does not treat as a tab — caught in live
  verification and fixed with docx's `Tab` child).

**Verification (live)**

- `pdftotext -layout` shows dates flush right on entry lines; sample export
  still 1 page. DOCX from production has 3 right tab stops and 3 `<w:tab/>`
  elements.

## Round 53 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data/funnel (traffic-source visibility) | The first-party beacon recorded only paths — once organic traffic starts we would have no way to tell Google from Reddit from direct, and CF RUM (which has referrers) is adblocked for exactly the visitors the beacon exists for | P1 |

**Fixes shipped** (worker version `6302087c`)

- Beacon (SPA + static pages) now sends `{p, r}` where `r` is the external
  referrer *origin* only, first hit per pageview chain only — still no PII.
- `/api/hit` accepts JSON or the legacy plain-path body; referrer is scrubbed
  unless it matches a strict `https?://` origin pattern (`javascript:` etc.
  dropped).
- `scripts/analytics.mjs` reports "top referrers (first-party)".

**Verification (live)**

- JSON + legacy bodies both accepted; `javascript:` referrer stored without
  `r`; report shows `https://www.google.com  1` from the QA probe.

## Round 54 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (export consistency) | PDF exported US Letter while DOCX had no explicit page size and defaulted to A4 — the two formats of the same resume printed on different paper | P1 |
| 2 | Competitor research (international users) | Zety/Resume.io/Kickresume all offer an A4/Letter choice; we had none despite targeting UK/EU users (the resume-vs-cv guide explicitly addresses them) | P1 |

**Fixes shipped** (worker version `80efbbc7`)

- `Resume.pageSize: 'letter' | 'a4'` (default letter), persisted with the
  resume and included in copies/backups automatically.
- Builder: Letter/A4 toggle next to the accent swatches with region hints
  in tooltips.
- PDF: `PdfWriter` parameterized on page size (A4 595.28×841.89pt).
- DOCX: explicit `pgSz` for both sizes (was implicit A4); right tab stop
  derived from the chosen width.

**Verification (live)**

- Production exports: A4 PDF 595.28×841.89, Letter PDF 612×792, A4 DOCX
  `<w:pgSz w:w="11906" w:h="16838"/>`; selection survives reload.

## Round 55 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA regression sweep (post R51–R54 UI changes) | 360px + 1280px overflow and axe WCAG 2.0 A/AA clean on `/`, `/builder`, `/ats-checker` — no regressions from the feature-grid and page-size changes | — |
| 2 | Accessibility walkthrough | The builder's template, accent and Letter/A4 toggle buttons conveyed their selected state only visually (ring); screen readers heard 22 identical unlabeled-state buttons | P2 |

**Fixes shipped** (worker version `bda2da71`)

- `aria-pressed` on all template, accent-color and page-size toggle buttons.

**Verification (live)**

- Production builder exposes 22 `[aria-pressed]` toggles with exactly 3
  `aria-pressed="true"` (active template + accent + size).

## Round 56 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Search/SEO gap analysis | Two high-volume evergreen questions had no page: "references on resume" (the outdated "available upon request" line is still in circulation) and "resume objective vs summary" — both funnel naturally into the summary editor, per-job copies and the ATS checker | P2 |

**Fixes shipped** (worker version `47e2e0f0`)

- `/guides/references-on-resume` — leave references off, kill the
  "available upon request" line, separate reference sheet how-to.
- `/guides/resume-objective-vs-summary` — objectives are outdated except
  career-change/new-grad edge cases; how to write a scannable summary.
- Sitemap 48 → 50 URLs; IndexNow submitted (HTTP 200).

**Verification (live)**

- Both routes 200 on production and listed on `/guides/`; sitemap.xml
  serves 50 `<loc>` entries.

## Round 57 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (round-trip import) | Importing our own exported PDF mangled entry headers: "Software Engineer · Brightlane, Austin, TX" parsed as role="Software Engineer · Brightlane" / company="Austin, TX", and education similarly ("Austin, Austin, TX" as school) — the importer had no rule for the middle-dot convention our exports (and many builders) use | P1 |

**Fixes shipped** (worker version `39da1a56`)

- `splitRoleCompany` recognizes `Role · Company, Location`: middle-dot
  binds role/company; a comma after it is treated as a location and now
  fills the entry's `location` field (experience and education).

**Verification (live)**

- Round-trip on production (export Letter PDF → import): role
  "Software Engineer" / company "Brightlane" / location "Austin, TX";
  degree "B.S. Computer Science" / school "University of Texas at Austin"
  / location "Austin, TX".

## Round 58 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Visual review (R54 follow-up) | The on-screen preview page kept the US Letter 8.5:11 aspect ratio even with A4 selected — the preview no longer matched what the PDF export produces | P2 |

**Fixes shipped** (worker version `27a5a2fe`)

- `ResumePreview` aspect ratio follows `resume.pageSize` (210/297 for A4).

**Verification (live)**

- Production preview box ratio 0.773 (Letter) → 0.707 (A4) when toggling.

## Round 59 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data/funnel (stat hygiene) | Every first-party hit to date is internal QA traffic; once organic visitors arrive the two would be indistinguishable, permanently muddying the funnel numbers the traffic phase is supposed to measure | P1 |
| 2 | UX walkthrough (email unlock, mobile 375px) | Fresh-visitor download gate verified healthy: subscribe dialog fits, unlock succeeds and the download auto-continues without re-clicking | — |

**Fixes shipped** (worker version `e4871398`)

- Both beacons (SPA + static pages) skip when `localStorage.honestcv.qa`
  is `'1'`; the flag is now set in our QA browser profile, so internal
  walkthroughs stop counting as traffic from today.

**Verification (live)**

- With the flag: 0 `/api/hit` requests across SPA and static pages;
  without it: beacon fires normally.

## Round 60 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor pricing re-check (live pages) | Zety still $1.95 trial / $25.95 — matches our claims. Resume.io's pricing page now lists $29.95/month (and $49.95 tier), but `/vs/resume-io` still said "roughly $24.95/month" — an outdated claim on a page whose whole pitch is honesty | P1 |

**Fixes shipped** (worker version `a6b5f86f`)

- `/vs/resume-io` intro + bullet updated to $29.95/month ("its pricing
  page currently lists"), keeping the August 2026 re-verified stamp
  accurate. Landing's $25.95–$29.95 range already covered it.

**Verification (live)**

- Zety and Resume.io pricing pages fetched in-browser; production
  `/vs/resume-io` now serves the $29.95 figures.

## Round 61 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (import parser, new real-world samples) | A very common resume layout — entry header on one line, date range alone on the next ("Marketing Manager | Acme Corp" ↵ "Jan 2021 - Present") — created a bogus second entry whose role was the date text, in both experience and education | P1 |

**Fixes shipped** (worker version `1a3a3d15`)

- A line that is only a date range now fills the dates of the current
  entry (when it has none) instead of spawning a new entry — experience
  and education both.

**Verification (live)**

- Production paste-import of the two-line-header sample: one experience
  entry (role/company/dates/bullet all correct) and one education entry
  with dates 2013|2017; no bogus entries.

## Round 62 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA golden path (desktop) | Strength meter, page-count indicator, ATS score and DOCX export (Letter `pgSz` 12240×15840, real `<w:tab/>`) all green after the R57/R61 importer changes | — |
| 2 | Competitor UX comparison | Zety/Resume.io both offer duplicating an experience entry (promotion at the same company = copy + edit); we forced retyping the whole card | P2 |

**Fixes shipped** (worker version `b17712c6`)

- Duplicate button on experience cards: inserts a copy (new id, copied
  bullets) right below the original.

**Verification (live)**

- Production: Duplicate role 1 → 2 entries, same content, distinct ids;
  delete restores.

## Round 63 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Visual/a11y sweep (360px, axe WCAG A/AA) | `/vs/`, `/guides/`, `/templates/`, two article pages, a template page and the 404 page: zero overflow, zero violations | — |
| 2 | UX (ats-checker with real DOCX upload) | Upload → parse → score 47/100 with sub-scores works end-to-end | — |
| 3 | SEO/search-demand | Two high-volume queries with no page: "hobbies and interests on resume" and "how to email a resume" | P2 |

**Fixes shipped** (worker version `201d7531`)

- `/guides/hobbies-and-interests-on-resume` and
  `/guides/how-to-email-a-resume`; sitemap 50 → 52, IndexNow HTTP 200.

**Verification (live)**

- Both routes 200 in production; guides hub links both.

## Round 64 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX consistency audit (builder sections) | Experience/education entries and whole sections can be reordered, but project entries could not — a candidate wanting their strongest project first had to delete and retype | P2 |

**Fixes shipped** (worker version `c8cb7de9`)

- Project cards get a header row with move up/down buttons (same
  pattern as experience/education).

**Verification (live)**

- Production: added Alpha + Beta, "Move project 2 up" → order
  Beta,Alpha in stored resume; cleanup ok.

## Round 65 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data/funnel | First-party: 82 hits today, still all internal (QA-flag exclusion only active since R59); leads 8 (all test). Export filenames already personalized (`<name>-resume.pdf`) — no gap there | — |
| 2 | Funnel (landing → traffic magnet) | The ATS checker — our shareable traffic magnet — was only linked from the footer of the landing page; the hero had a single builder CTA | P2 |

**Fixes shipped** (worker version `7a883601`)

- Second hero CTA "Check my resume's ATS score" (outline) linking to
  `/ats-checker`; free-mode caption moved below the button row.

**Verification (live)**

- 360px/1280px: CTA present, no horizontal overflow, axe WCAG A/AA
  zero violations; click navigates to `/ats-checker`.

## Round 66 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (multi-page PDF export, 16-entry A4 resume) | Pagination works and page 2 is real text, but there was no keep-together control: a section heading or an entry header could land alone as the last line of a page with its content orphaned onto the next | P2 |

**Fixes shipped** (worker version `ed3f36bf`)

- `PdfWriter.heading` reserves heading + divider + first content line
  (`ensure(52)`); experience/education entry headers reserve header +
  first bullet (`ensure(34)`).

**Verification (live)**

- Production 2-page A4 export: page 1 ends mid-entry after header + 2
  bullets (header kept with content); page 2's EDUCATION heading sits
  with its entry, not orphaned.

## Round 67 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (DOCX parity with R66) | The DOCX export had no equivalent of R66's keep-together: Word could break a page right after a section heading or entry header, orphaning it from its content | P2 |

**Fixes shipped** (worker version `3281014c`)

- `keepNext: true` on heading paragraphs and experience/education
  entry-header paragraphs in the DOCX export.

**Verification (live)**

- Production DOCX inspected: `<w:keepNext/>` present on every heading
  and entry header paragraph (EXPERIENCE, entry, EDUCATION, entry).

## Round 68 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor pricing re-check (live) | Rezi pricing page still $29/month Pro / $149 lifetime — matches our `/vs/rezi` claims. Teal's pricing page did not render content in-browser (683 chars), so no claim change; our $13/week figure stays as previously observed | — |
| 2 | Visual/a11y (builder 360px after R62/R64/R65 buttons) | No overflow (345/345), axe WCAG A/AA zero violations | — |
| 3 | SEO | `sitemap.xml` had no `<lastmod>`; crawlers use it to prioritize re-crawling after content updates | P2 |

**Fixes shipped** (worker version `3f0b4fae`)

- Sitemap entries include `<lastmod>` (build date).

**Verification (live)**

- Production sitemap: 52/52 URLs carry `<lastmod>2026-08-06</lastmod>`.

## Round 69 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (import parser, new realistic sample) | Two gaps: a "City, ST" segment on the contact line was dropped entirely, and "Role — Company, City, ST" headers left the location inside the company field (the em-dash path lacked the location split the middle-dot path got in R57) | P1 |

**Fixes shipped** (worker version `7b87ec7c`)

- Contact parsing picks up a `City, ST` segment from the header lines.
- `splitRoleCompany` peels a trailing `, City, ST` / `, Remote` off the
  company for the at/dash/pipe separators.

**Verification (live)**

- Production paste-import: `contact.location` = "Chicago, IL"; entry =
  role "Senior Data Analyst", company "NorthBridge Health", location
  "Chicago, IL", dates Mar 2021 – Present.

## Round 70 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (cover-letter template flow, live) | Flow healthy end-to-end (template → edit → PDF/DOCX), but the exported document was titled "AI Cover Letter" even when built from the non-AI template — mislabeling on a document users send to employers — and the placeholder produced "the [the role] position" | P2 |

**Fixes shipped** (worker version `096cf25b`)

- Export title is now "Cover Letter"; role placeholder is `[role]` so
  the sentence reads "the [role] position".

**Verification (live)**

- Production template letter: "…apply for the [role] position…"; DOCX
  document title "Cover Letter".

## Round 71 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (interview-prep template flow, live) | Healthy: template fills brief, PDF exports with real text (923 chars); dialog fits 360px with no overflow | — |
| 2 | SEO | Static pages had Article/WebApplication JSON-LD but no `BreadcrumbList` — breadcrumb schema powers the breadcrumb trail in Google results and clarifies site structure | P2 |

**Fixes shipped** (worker version `190e7f55`)

- `BreadcrumbList` JSON-LD (Home → hub → page) on guide, template,
  comparison and keyword pages.

**Verification (live)**

- `/guides/resume-keywords/`, `/vs/zety/`, `/templates/modern/` each
  serve a BreadcrumbList with correct Home → hub → page items.

## Round 72 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (round-trip: our PDF export → ATS checker upload) | Healthy — exported PDF re-imports and scores | — |
| 2 | Data | First-party hits unchanged since R65 report (82 today, all internal; QA flag confirmed active in the test browser) | — |
| 3 | Editor consistency | Experience cards gained Duplicate in R62 but education cards had none — second degree / minor at the same school means retyping | P2 |

**Fixes shipped** (worker version `608764f8`)

- Duplicate button on education cards (copy inserted below the
  original), matching the experience-card control.

**Verification (live)**

- Production: "Duplicate education 1" → 2 entries (UCLA, UCLA), copy
  deleted afterwards.

## Round 73 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (export keep-together audit after R66/R67) | Projects entries were the remaining gap: a project name could be orphaned from its description at a page break in both PDF (no `ensure`) and DOCX (no `keepNext`) | P2 |

**Fixes shipped** (worker version `9eff0e50`)

- PDF reserves space before a project name (`ensure(30)`); DOCX `body`
  helper accepts `keepNext` and project names use it.

**Verification (live)**

- Production DOCX with a project: PROJECTS heading and project-name
  paragraph both carry `<w:keepNext/>`.

## Round 74 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (`/guides/` and `/vs/` hubs) | Hubs listed 23 guide / 7 comparison links as bare titles — no way to tell what each covers without clicking, weak anchor context for crawlers | P2 |

**Fixes shipped** (worker version `287a5663`)

- Hub list items now show a one-line blurb (first sentence of each
  page's meta description) after the link.

**Verification (live)**

- `/guides/` shows 23 link+blurb rows, `/vs/` shows 7.

## Round 75 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Visual/a11y (updated hubs, 360px) | `/guides/` and `/vs/` — no overflow, zero axe WCAG A/AA violations | — |
| 2 | UX walkthrough (free-download funnel, live) | Subscribe gate → email → unlock → Final Check all work; copies dialog warns before replacing the editor | — |
| 3 | Editor consistency | Experience (R62) and education (R72) cards have Duplicate; project cards didn't | P2 |

**Fixes shipped** (worker version `3b742a5d`)

- Duplicate button on project cards, matching the other entry types.

**Verification (live)**

- Production: expand Projects → "Duplicate project 1" → Alpha, Alpha
  with unique ids; state restored after test.

## Round 76 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (import parser, pipe-separated sample) | Healthy: `Role | Company` headers, month-name date lines, `MBA | School` education all parse correctly | — |
| 2 | Frontend performance | Main JS bundle was 1.2 MB — `pdf-lib` and `docx` were bundled eagerly even though they're only needed at export time | P1 |

**Fixes shipped** (worker version `c7caf0a1`)

- `pdf` and `docx` libs now load via dynamic `import()` at export /
  page-count time; main bundle 1207 KB → 425 KB (pdf 426 KB and docx
  354 KB split into lazy chunks).

**Verification (live)**

- Builder loads, page-count indicator shows "1 page" (lazy pdf chunk
  works), PDF and DOCX exports both download.

## Round 77 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (import parser, resume with Awards/Languages sections) | Unknown headings were swallowed into whichever section came before — "AWARDS … LANGUAGES …" ended up inside Certifications with heading names embedded | P1 |

**Fixes shipped** (worker version `e3222637`)

- Import parser recognizes common extra sections (Awards, Honors,
  Publications, Volunteering, Languages, Interests…) plus generic short
  ALL-CAPS headings, and imports them as custom sections with their
  lines as bullets.

**Verification (live)**

- Production import of a sample with AWARDS + LANGUAGES → two custom
  sections with the right bullets; certifications no longer polluted;
  R69/R76 samples still parse identically.

## Round 78 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor re-check | Teal pricing page still renders only ~687 chars in a real browser — no new claim; existing /vs/teal claims unchanged | — |
| 2 | SEO/internal linking | Cross-links on static pages pointed at slash-less URLs (`/guides/x`) which 307-redirect to `/guides/x/` — one extra hop per click and per crawl; guide "Keep reading" also listed all 22 other guides + 3 product pages (diluted) | P2 |

**Fixes shipped** (worker version `a06118c8`)

- All static cross-links now include the trailing slash (guide related
  lists, template "others", keyword/comparison related lists).
- Guide "Keep reading" trimmed to 4 neighbouring guides (wrap-around)
  plus the comparisons hub.

**Verification (live)**

- `/guides/ats-friendly-resume/` shows 4 guide links + `/vs/` hub, all
  with trailing slash; `/vs/zety/` related links all trailing-slash.

## Round 79 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | UX walkthrough (AI buttons, live) | Clicking "AI polish summary" with an empty summary silently did nothing (`if (!text.trim()) return`), and AI errors rendered at the very bottom of the editor column, far from the button clicked | P1 |

**Fixes shipped** (worker version `0e444341`)

- Empty-input clicks now explain what to do ("Write a rough summary
  first — the AI polishes your draft, it never invents one", same for
  bullets/skills, reinforcing the anti-fabrication stance).
- AI errors render inline next to the button that was clicked
  (`aiErrorTag`), replacing the bottom-of-column message.

**Verification (live)**

- Production: empty summary + "AI polish summary" → inline hint appears
  right under the button.

## Round 80 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (full-site sweep) | All 52 sitemap URLs return 200; robots.txt + sitemap healthy | — |
| 2 | Visual/a11y (builder, 360px) | Zero axe WCAG A/AA violations, no horizontal overflow | — |
| 3 | Data | First-party 2026-08-06: 82 hits, all internal (pre-R59 QA-flag hits included in the day's counter); 9 leads, all test addresses; still no organic traffic | — |
| 4 | UX (copies ↔ ATS linkage) | Saved copies showed only name + timestamp — users tailoring one copy per job couldn't compare which version scores best | P2 |

**Fixes shipped** (worker version `e64099a2`)

- Copies dialog shows each copy's ATS score ("… · ATS 67/100"),
  computed against the copy's own saved job description.

**Verification (live)**

- Production: save a copy → list row shows "ATS 67/100"; versions
  storage restored after test.

## Round 81 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Content quality audit (all 23 guides, word count) | Guides run ~455–500 words each — thin against competitor guides (typically 1,500+ words); thinnest is /guides/resume-action-verbs/ at 455 | P1 (SEO) |

**Fixes shipped** (worker version `b003d45a`)

- resume-action-verbs guide expanded 6 → 12 sections (operations,
  design/content, support/healthcare verb categories; repeated-verb,
  verb-vs-posting and verb-needs-a-number advice), ~455 → ~710 words.
  All claims kept factual; anti-fabrication framing retained.

**Verification (live)**

- Production page shows 12 content h2s and the new sections; remaining
  thin guides queued for future rounds.

## Round 82 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Content quality audit (continued from R81) | Next-thinnest guide: /guides/resume-summary-examples/ at ~482 words with only 3 example personas | P1 (SEO) |

**Fixes shipped** (worker version `ee0f168d`)

- resume-summary-examples expanded 6 → 12 sections (~784 words): new
  grad / manager / sales examples, summary-vs-objective cross-ref,
  tailor-line-3 advice, and when to skip the summary entirely.

**Verification (live)**

- Production page serves the new sections.

## Round 83 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Competitor price re-check (live) | Resume.io still $2.95 trial → $29.95/4wk (matches our /vs/ page); Zety pricing page renders ~1.8k chars with no prices (bot wall) — no claim changes | — |
| 2 | Content quality audit (continued) | Flagship keyword guide /guides/ats-friendly-resume/ still ~488 words | P1 (SEO) |

**Fixes shipped** (worker version `3aa86dbb`)

- ats-friendly-resume expanded 6 → 12 sections (~762 words): PDF vs
  DOCX, date formats, acronym spelling, "fear the generic resume, not
  the ATS", plain-text parser self-test, and a closing checklist.

**Verification (live)**

- Production page serves the new sections.

## Round 84 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (export → import round trip incl. R77 custom sections) | Custom sections survive the round trip, but a "Name — Title" header line (exactly what our own plain-text export emits) was imported whole into the name field: `fullName: "Jordan Reyes — Software Engineer"` | P1 |

**Fixes shipped** (worker version `c0aaeac2`)

- Import parser splits "Name — Title" header lines into fullName +
  professional title (em/en dash).

**Verification (live)**

- Production import: name "Jordan Reyes", title "Software Engineer";
  R69/R76/R77 regression samples parse identically.

## Round 85 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Visual/a11y (/, /ats-checker, /templates, expanded guide; 360px) | Zero axe WCAG A/AA violations, zero horizontal overflow on all four | — |
| 2 | Content quality audit (continued) | /guides/remote-job-resume/ still ~486 words | P1 (SEO) |

**Fixes shipped** (worker version `2b2f26ae`)

- remote-job-resume expanded 6 → 12 sections (~745 words): remote-ready
  summary line, quantifying distributed scope, freelance/contract
  framing, what remote employers screen out, don't-oversell honesty
  advice, and a closing checklist.

**Verification (live)**

- Production page serves the new sections.

## Round 86 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Content quality audit (continued) | Next-thinnest: /guides/resume-keywords/ at ~491 words — the guide most directly tied to the ATS-checker funnel | P1 (SEO) |

**Fixes shipped** (worker version `741bca75`)

- resume-keywords expanded 6 → 12 sections (~756 words): five-minute
  extraction method, required-vs-preferred prioritization, job titles
  as keywords, literal credential matching, re-extract per application,
  and handling a missing required keyword honestly.

**Verification (live)**

- Production page serves the new sections.

## Round 87 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (golden path, live) | Example resume → PDF export works end to end post-R76 lazy chunks (maya-chen-resume.pdf downloaded, no paywall regression) | — |
| 2 | Content quality audit (continued) | /guides/tailor-resume-to-job/ at ~496 words — the guide that ties directly into R80's per-copy ATS scores | P1 (SEO) |

**Fixes shipped** (worker version `3f59494e`)

- tailor-resume-to-job expanded 6 → 12 sections (~760 words):
  master-vs-copies workflow (cross-promotes the Copies feature),
  what never to change, careful title annotation, vague postings,
  role-cluster batching, and the 15-minute ceiling-not-floor rule.

**Verification (live)**

- Production page serves the new sections.

## Round 88 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Content quality audit (continued) | /guides/resume-vs-cv/ at ~496 words with only 5 sections — a top informational query in the category | P1 (SEO) |

**Fixes shipped** (worker version `7fa588d7`)

- resume-vs-cv expanded 5 → 11 sections (~766 words): CV→resume and
  resume→CV conversion, regional photo/DOB conventions, international
  formats (Europass, Rirekisho), US federal/USAJOBS resumes, and the
  maintain-the-superset workflow (cross-promotes Copies).

**Verification (live)**

- Production page serves the new sections.

## Round 89 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (DOCX export → ATS-checker upload round trip, live) | Since R52's right-aligned dates, DOCX entry headers use a tab before the date; extraction turned the tab into a space, producing "Marketing Manager · Acme Corp Jan 2021 – Present" on one line — the middle-dot parse would then swallow the date into the company name | P1 |

**Fixes shipped** (worker version `594c5186`)

- `extractDocx` converts `<w:tab/>` to a line break instead of a space,
  so the date lands on its own line — which R61's standalone-date-line
  handling already parses into the current entry.

**Verification (live)**

- Production ATS-checker upload of our own DOCX artifact now extracts
  the header and the date range as separate lines.

## Round 90 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data (scripts/analytics.mjs) | CF Web Analytics 0 PV/UV last 14 days; first-party 82 hits on 2026-08-06 all internal QA (top: /builder 55); one www.google.com referrer recorded is a QA probe; 9 leads all test addresses — still no organic traffic | — |
| 2 | Content quality audit (continued) | /guides/hobbies-and-interests-on-resume/ at ~499 words | P1 (SEO) |

**Fixes shipped** (worker version `6fa5d9f0`)

- hobbies-and-interests guide expanded 6 → 12 sections (~745 words):
  hobbies-vs-interests-vs-activities, industry norms, volunteering
  beats hobbies, new-grad activities-as-experience, never-pad honesty
  advice, and the one-line rule.

**Verification (live)**

- Production page serves the new sections.

## Round 91 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (PDF export → ATS-checker upload round trip, live) | Same class of bug as R89 on the PDF path: the right-aligned date is a separate text item bridged by a wide whitespace item, so extraction joined "Marketing Manager · Acme Corp Jan 2021 – Present" onto one line | P1 |

**Fixes shipped** (worker version `4f9d9a0a`)

- `extractPdf` skips whitespace-only text items and emits a line break
  when the x-gap between adjacent items on a line exceeds 40 units, so
  right-aligned dates land on their own line (parsed by R61 handling).

**Verification (live)**

- Production ATS-checker upload of our own PDF artifact now extracts
  the header and the date range as separate lines.

## Round 92 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Content quality audit (continued) | /guides/best-resume-format/ at ~503 words — high-volume head query for the category | P1 (SEO) |

**Fixes shipped** (worker version `9106c620`)

- best-resume-format expanded 6 → 12 sections (~774 words): section
  order (drag-to-reorder cross-promo), concrete hybrid block sizing,
  honest gap formatting (years-only presentation vs never stretching
  dates), career-changer hybrid guidance, formats by career stage,
  and a closing format checklist.

**Verification (live)**

- Production page serves the new sections.

## Round 93 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Content quality audit (continued) | /guides/internship-resume/ at ~506 words — fall-recruiting season page | P1 (SEO) |

**Fixes shipped** (worker version `3ad831ae`)

- internship-resume expanded 6 → 12 sections (~779 words): GPA
  thresholds, relevant-coursework line, quantifying like a student,
  part-time jobs as evidence, master-plus-copies tailoring, and a
  pre-submit checklist.

**Verification (live)**

- Production page serves the new sections.

## Round 94 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Visual/a11y (360px axe sweep) | best-resume-format, internship-resume, resume-keywords all 0 WCAG A/AA violations, no horizontal overflow after expansion | — |
| 2 | Content quality audit (continued) | /guides/resume-with-no-experience/ at ~510 words | P1 (SEO) |

**Fixes shipped** (worker version `49c3e8ea`)

- resume-with-no-experience expanded 6 → 12 sections (~774 words):
  volunteering as experience, freelance/informal work, certifications,
  what to build while applying, first-resume mistakes, and a worked
  section skeleton.

**Verification (live)**

- Production page serves the new sections.

## Round 95 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Content quality audit (continued) | /guides/career-change-resume/ at ~511 words | P1 (SEO) |

**Fixes shipped** (worker version `42da964a`)

- career-change-resume expanded 6 → 12 sections (~788 words):
  overlap-mapping before writing, one-variable-at-a-time target roles,
  credentials that actually match, switcher section sequencing
  (reorder cross-promo), the seniority/salary reality, and a
  realistic switch timeline.

**Verification (live)**

- Production page serves the new sections.

## Round 96 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Content quality audit (continued) | /guides/how-long-should-a-resume-be/ at ~521 words | P1 (SEO) |

**Fixes shipped** (worker version `35063c8e`)

- how-long-should-a-resume-be expanded 6 → 12 sections (~819 words):
  length by career stage, the 1.5-page trap, no layout hacks, an
  ordered cut list, the live page-count indicator cross-promo, and a
  short length FAQ.

**Verification (live)**

- Production page serves the new sections.

## Round 97 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Content quality audit (continued) | /guides/employment-gap-resume/ at ~524 words | P1 (SEO) |

**Fixes shipped** (worker version `6063efc8`)

- employment-gap-resume expanded 6 → 12 sections (~828 words):
  one-line framings per situation, anchoring a current gap, multiple
  gaps as pattern, what never to do (anti-fabrication), where the
  explanation lives (resume/letter/interview/LinkedIn consistency),
  and a gap checklist.

**Verification (live)**

- Production page serves the new sections.

## Round 98 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Content quality audit (continued) | /guides/resume-bullet-points/ at ~525 words — the page that showcases the builder's bullet-quality check | P1 (SEO) |

**Fixes shipped** (worker version `9f64f6ea`)

- resume-bullet-points expanded 6 → 12 sections (~812 words): finding
  forgotten numbers (scope as metric), one idea per bullet, length
  rule, tense/person conventions (first-person flag cross-promo,
  matches guidance.ts behavior), bullets by role type, and a rewrite
  drill.

**Verification (live)**

- Production page serves the new sections.

## Round 99 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (full-site sweep) | All 52 sitemap URLs return 200 in production | — |
| 2 | Content quality audit (continued) | /guides/resume-objective-vs-summary/ at ~527 words | P1 (SEO) |

**Fixes shipped** (worker version `1ad1a9b3`)

- resume-objective-vs-summary expanded 6 → 12 sections (~807 words):
  summary examples by stage, objective examples that still work,
  when to skip both, common summary mistakes, headline+summary
  pattern (builder title-field cross-promo), and the 7-second test.

**Verification (live)**

- Production page serves the new sections; 52/52 sitemap URLs 200.

## Round 100 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | Data (final baseline) | 14-day: CF Web Analytics 0 PV/UV (adblock-blind); first-party 84 hits all internal QA; 9 email leads all test addresses; 1 google.com referrer (QA probe). No verified organic traffic. | — |
| 2 | Content quality audit (final round) | /guides/common-resume-mistakes/ at ~529 words | P1 (SEO) |

**Fixes shipped** (worker version `b5ff098f`)

- common-resume-mistakes expanded 6 → 12 sections (~806 words):
  contact-block mistakes, proofreading blind spots, formatting
  consistency, stale/padded skills, wrong-file errors, and an
  ordered pre-send pass.

**Verification (live)**

- Production page serves the new sections.

**100-round loop complete.** All 100 rounds deployed, verified live,
logged here, and merged via PRs #10–#110. Remaining external gaps:
off-site distribution (social accounts), AI relay quota, email
provider — all owner-side.

## Special project R101 — 2026-08-05 (Beta pricing reframe)

**Driver**: owner directive — stop positioning the product as "free";
reframe as a paid product ($9.99/$19.99 one-time) currently in a
**beta free trial** with every plan fully unlocked (billing not yet
connected, no real charges).

**Fixes shipped** (worker version `21568a22`)

- Landing: hero, CTA labels, pricing section banner, footnote and FAQ
  reworded from "free during launch" to "beta free trial of both paid
  plans"; plan cards unchanged ($9.99 / $19.99 one-time).
- Builder toolbar badge: "Free during launch" → "Beta free trial".
- Download-unlock dialog: "free during launch" → "included in the
  beta trial".
- Static SEO pages (vs/templates/guides CTA blocks), llms.txt and
  index.html meta/JSON-LD description reworded to the same framing.
- Drive-by lint fix: `no-useless-assignment` on worker/index.ts `path`.

**Verification (live)**

- `/`, `/guides/what-is-an-ats/`, `/vs/zety/` all serve the new
  beta-trial copy in production.

## Competitor Research Round 1 — FlowCV firsthand + expanded field (2026-08)

**Driver: competitor research (five-driver cycle).**

- Full firsthand FlowCV walkthrough on a real account (cvbench@zalize.com):
  build → tips → customize → signup → email verification → real PDF download.
  Pricing verified in-app: Free $0 (1 resume, unlimited PDFs), Basic $3/mo,
  Pro $5/mo billed yearly. PDF metadata shows server-side Chromium rendering.
- Expanded field scanned: Novoresume ($21.99/mo, Next.js), Enhancv (from
  $16.50/mo, Next.js), Resume Worded (score-first funnel), Reactive Resume
  (React+Vite+Tailwind OSS, 40k stars). Jobscan/Resume Genius/Canva behind
  bot walls — recorded as blocked, not bypassed.
- Full findings, gap matrix (G1–G8) and tech-stack assessment:
  docs/competitor-research-round-1.md. Conclusion: keep current stack.

**Fixes shipped this round**

- G1 (FlowCV tips pattern): action-verb library (7 groups × 6 verbs) added
  to the bullet-ideas panel — clicking a verb starts a new bullet with it.
  Rule-based, no AI dependency.
- G8 (honest pricing content): new /vs/flowcv comparison page from firsthand
  test, crediting FlowCV's fair free tier while stating our structural
  differences (browser-local privacy, no account gate, one-time pricing).

## Competitor Research Round 2 — Novorésumé firsthand (2026-08)

**Driver: competitor research (five-driver cycle).**

- Full firsthand Novorésumé walkthrough on a real account: template → live
  WYSIWYG editor → registration (6-digit email code) → 4-step personalization
  wizard → Optimizer → pre-download review modal → free watermark-free PDF.
- Pricing verified in-app: Basic free (1 resume, 1 page, no cover letter),
  Premium $21.99/mo / $39.99/quarter / $139.99/yr, explicitly non-recurring.
- PDF metadata: Ghostscript + headless Chromium → server-side rendering.
- Full findings: docs/competitor-research-round-2.md (gaps G9–G11).

**Fixes shipped this round**

- G9 (Novorésumé TXT export pattern): plain-text (.txt) resume export added
  to the builder header — useful for online application forms and ATS paste
  boxes. Reuses resumeToPlainText, browser-local like all exports.
- G8 (honest pricing content): new /vs/novoresume comparison page from
  firsthand test, crediting its non-recurring pricing and free download while
  stating our structural differences.

## Competitor Research Round 3 — Enhancv firsthand (2026-08)

**Driver: competitor research (five-driver cycle).**

- Full firsthand Enhancv walkthrough on a real account: chat-style onboarding
  (import? → role → recruiter-vs-ATS goal) → template gallery → inline
  contenteditable editor → signup (email code) → Check & Tailor JD match →
  Fix Resume grade → PDF + TXT download → pricing.
- Free PDF carries a "Powered by Enhancv" branding footer; full ATS/grade
  reports paywalled; Pro recurring $16.50–$39/mo. Findings:
  docs/competitor-research-round-3.md (gaps G12–G15).

**Fixes shipped this round**

- G12 (Enhancv keyword-table pattern): per-keyword frequency table added to
  the free /ats-checker report — Keyword | In resume | In job ad occurrence
  counts, missing keywords first. Browser-local and rule-based like the rest
  of the checker; fully free (Enhancv paywalls its full list).
- New /vs/enhancv comparison page from firsthand evidence, crediting its
  onboarding/editor design while stating our structural differences
  (no branding footer, full free report, browser-local, one-time pricing).

## Competitor Research Round 4 — Resume Worded firsthand (2026-08)

**Driver: competitor research (five-driver cycle).**

- Real-account Resume Worded walkthrough: upload → career-level wizard →
  account wall (pre-checked weekly-email opt-in) → Score My Resume (38/100,
  Pro-locked checks) → Magic Write demo → free Targeted Resume keyword match
  (95 relevancy, side-by-side highlighting) → Pro pricing ($19–$49/mo
  recurring, Paddle, $75 anchor). Findings:
  docs/competitor-research-round-4.md (gaps G16–G18).
- Notable: its "Quantify impact" check flagged fully-quantified bullets, and
  the Magic Write demo fabricated "50+ components / within six months" —
  reinforcing our anti-fabrication AI policy as a real differentiator.

**Fixes shipped this round**

- G16 (Resume Worded verdict pattern): one-line plain-English verdict under
  the ATS score ("Great match… / Decent start… / Needs work…", and a
  structure-only variant when no JD is pasted). Rule-based, honest
  thresholds, browser-local.
- New /vs/resume-worded comparison page from firsthand evidence, crediting
  its genuinely free Targeted Resume tool while stating our structural
  differences (builder+checker, no locked checks, local, one-time pricing).

## Competitor Research Round 5 — Reactive Resume firsthand (2026-08)

**Driver: competitor research (five-driver cycle).**

- Real-account walkthrough of rxresu.me (open-source, ~40k stars): register
  (email verification optional) → dashboard (Resumes/Applications/Agents,
  command palette) → builder (three-panel, drag-drop layout) → export
  dialog (PDF/DOCX/Markdown/JSON). PDF verified: real text, no branding,
  no gates. Findings: docs/competitor-research-round-5.md (gaps G19–G22).

**Fixes shipped this round**

- G19 (Reactive Resume template-tags pattern): every template now carries
  short fit tags; landing gallery shows the primary tag under each
  thumbnail, and the builder picker shows the selected template's
  description + tags line.

## Frontend replication batch — JD keyword highlighting (2026-08)

**Driver: competitor research follow-through (gap G17, Resume Worded).**

- /ats-checker now renders the pasted job description with matched keywords
  highlighted green and missing keywords amber, inline (Resume Worded's
  side-by-side pattern, adapted to a single annotated JD panel).
  Fully browser-local; regex built from the same keyword set the scorer
  uses, longest-first, with word-boundary guards for tech tokens
  (C++, CI/CD, .NET).

## Competitor Research Round 6 — blocked-site revisits (2026-08)

**Driver: competitor research (five-driver cycle).**

- Teal pricing page: still behind a Cloudflare bot wall ("Sorry, you have
  been blocked") — remains blocked; /vs/teal claims unchanged, no bypass
  attempted.
- Jobscan: app.jobscan.co/plan is publicly accessible (observed). Free tier
  = 5 resume scans/month + 5 findings; Quarterly $29.98/mo (billed $89.95/3mo,
  7-day trial auto-bills the quarter); Monthly $49.95/mo. Cancellation policy
  states paid-feature data is dropped after expiry. Scanner itself remains
  partially blocked — no claims made about scoring quality.

**Fixes shipped this round**

- New /vs/jobscan comparison page from the observed plan-page evidence
  (unlimited free local checks vs 5 scans/month; no trial-to-subscription
  conversion; one-time pricing). Sitemap 56→57, IndexNow pushed.

## Frontend replication batch — Markdown export (gap G20) (2026-08)

**Driver: competitor research follow-through (Reactive Resume).**

- New MD export button in the builder header: `resumeToMarkdown` flattens
  the resume (same section order as preview) to Markdown — H1 name+title,
  H2 sections, H3 entry headers with italic dates, link-formatted project
  URLs. Useful for AI-tool workflows, GitHub profiles and quick edits;
  fully browser-local like TXT.

## Design & template upgrade — round 1 (2026-08)

**Driver: boss directive 视觉/品牌/特效升级 + 模板大扩容. Full research
notes in docs/design-upgrade-round-1.md.**

- Templates 12→22: new `band` heading axis (accent-tinted band behind real
  heading text — ATS-safe) implemented in preview, PDF (pdf-lib rect) and
  DOCX (paragraph shading). 10 new templates (Horizon/Metro/Scholar/Ink/
  Coral/Atlas/Prairie/Quartz/Ruby/Cobalt) each with tags + pSEO page;
  sitemap 57→67.
- Motion layer: `motion@12.43.0` added; animated ScoreRing gauge with
  count-up on /ats-checker; global prefers-reduced-motion kill-switch.
- Brand fix (P0): favicon was a leftover microphone mark from another
  product — replaced with document+check LogoMark (favicon.svg, header,
  regenerated og.png 1200×630).
- Landing hero: subtle dual radial gradient mesh (Enhancv/Stripe-inspired).
- Copy 12→22 templates site-wide.

## Design upgrade round 2 (2026-08-05)

- Template gallery filters: style chips (All/Serif/Modern sans/Banded/Minimal)
  derived from template metadata (`TEMPLATE_FILTERS`), on landing gallery
  (with counts) and builder picker; aria-pressed on chips.
- Export success feedback: download buttons show a green check with a short
  pop animation after each PDF/DOCX/TXT/MD export (CSS keyframes, covered by
  the global prefers-reduced-motion kill-switch).
- Empty-state illustrations: original brand-style SVGs (document+scan on
  /ats-checker empty state, document+pencil on builder "starting fresh"),
  matching the LogoMark palette; aria-hidden, no external assets.

## Optimization loop O1 (2026-08-08)

- AI relay switched to the owner's new channel (Worker secrets; default
  model glm-5.2, PR #118). Full AI path retested live in the UI: rewrite
  variants, cover letter, interview brief — all honest output, no
  fabricated metrics (recorded run, evidence on PR #118).
- O1 fix: cover-letter / interview-brief responses now include
  `freeRemaining` and the builder footer counter updates for bundle-tool
  calls too (previously only summary polish decremented the display).

## Optimization loop O2-O3 (2026-08-08)

- O2 performance: React.lazy route-split for /builder and /ats-checker —
  landing entry JS 504→342 KB (gzip 161→109 KB); live smoke on all routes.
- O3 pSEO: two backlog guides shipped — /guides/resume-file-format and
  /guides/linkedin-vs-resume (12 sections each); sitemap 67→69 URLs,
  IndexNow 200.

## Optimization loop O4 (2026-08-08)

- Security: npm audit highs cleared — pdfjs-dist 6.1.200→6.2.108
  (GHSA-hq66-cqwq-w95j, arbitrary JS on malicious PDF) and hono
  →4.12.34 (CORS ReDoS + 3 others). Live PDF import re-verified after
  the pdfjs bump (upload → 1k chars extracted, name parsed).
- Regression sweep: 375px overflow 0 and axe A/AA 0 violations across
  /, /builder, /ats-checker and both new guides; FREE_MODE intact.
- Note: `wrangler deploy` began failing on the zone-routes API call
  (Authentication error 10000) while uploads succeed — worked around
  with `wrangler versions upload` + `versions deploy` (route unchanged).

## Optimization loop O5 (2026-08-08)

- UX/data round, no code change needed: landing copy consistent with live
  AI + beta-free-trial pricing ($9.99/$19.99 shown); ATS example-score
  flow works (61/100); analytics — Cloudflare PV/UV still 0, first-party
  hits all internal (google.com referrer ×1), 11 leads all test emails.
  Organic distribution remains the bottleneck (owner side).

## Optimization loop O6 (2026-08-08)

- pSEO backlog cleared: /guides/resume-for-teens and
  /guides/thank-you-email-after-interview (12 sections each); sitemap
  69→71 URLs, IndexNow 200, both live-verified. ops-weekly backlog
  refreshed (AI relay unpaused, new candidates queued).

## Optimization loop O7-O8 (2026-08-08) — verification rounds, no findings

- O7: mobile UX walkthrough of the live AI flows at 375px (builder, cover
  letter dialog) — zero overflow, dialogs clean. Competitor recheck: Rezi
  pricing still $29/mo + $149 lifetime (matches /vs/rezi); Teal pricing
  page still does not render in a real browser (kept blocked, not bypassed).
- O8: full sitemap sweep 71/71 URLs 200; golden path re-verified after the
  O4 dependency bumps (sample resume → PDF download, real text layer
  confirmed via pdftotext).
- Two consecutive rounds without worthwhile improvements → switching to
  low-intensity weekly ops per the loop's stop rule.

## Evolution batch E1-E2 (2026-08-05)

Directive: no small patches this round — ship 1-2 major differentiating features.

**E1 — AI Tailor (JD-tailored resume, per-line review).** New `POST /api/ai/tailor`:
one LLM call takes the summary + every experience bullet (id-addressed) plus the
pasted JD, returns strict-JSON per-item rewrite suggestions. Builder gains a
"Tailor to this job" button in the Target job section opening a review dialog:
each suggestion shows original (struck through) vs suggestion, with per-item
Accept / Keep original and "Accept all remaining". Nothing is applied without
review; anti-fabrication prompt rules carry over (mirror JD keywords only where
the fact already exists; bracketed placeholders instead of invented numbers).
Shares the existing free AI quota and updates the visible counter.
This is the core paid capability at Rezi/Teal/Jobscan — ours is free during beta,
reviewable line-by-line, and browser-local-first.

**E2 — Resume health report.** `resumeHealth()` in `src/lib/guidance.ts`:
six deterministic dimensions (Completeness, Quantified impact, Action verbs,
Brevity, Buzzword-free, Consistency — tense discipline + unreplaced [placeholders]),
each 0-100 with concrete findings pointing at the offending bullet. Weighted
overall score surfaces under the strength meter ("Full health report — N/100");
dialog renders per-dimension bars + findings. No AI calls, computed locally,
explicitly labeled a heuristic, not a hiring prediction.

Verified: typecheck/lint/build green; deployed via wrangler versions workflow;
full regression by testing agent (golden path, AI success/fallback, 375px, axe).

## Optimization loop O9 (2026-08-08)

- Data integrity check after the O-batch merges: first-party beacon
  verified live (fresh browser context → POST /api/hit 200; QA-flagged
  context sends nothing). Zero hits since 08-07 is genuinely zero
  traffic, not a broken beacon.
- Prod redeployed from clean post-merge main (version 9c69a37c); /api/health ok.
- CWV re-test (warm CDN, desktop): / TTFB 32ms LCP 188ms CLS 0.016;
  /builder LCP 136ms; /ats-checker LCP 560ms CLS 0 — all well inside
  "good" thresholds after the O2 route split.

## Optimization loop O10 (2026-08-08)

- pSEO: /guides/salary-expectations-in-interviews and
  /guides/resume-vs-portfolio (12 sections each; honest-negotiation and
  rights/NDA framing consistent with the anti-fabrication line); sitemap
  71→73, IndexNow 200, both live-verified.

## Optimization loop O11-O12 (2026-08-08)

- O11 competitor recheck: Resume.io pricing page re-verified live —
  $29.95/4 weeks after 7-day trial (matches /vs/resume-io) plus a
  $49.95/3-month tier; FlowCV still $0/$3/$5 (matches /vs/flowcv);
  Zety pricing page still bot-walled (claims unchanged, not bypassed).
- O12 guides UX/SEO: all 27 guide pages now render an "On this page"
  table of contents with anchor links on every h2 (two-column on
  desktop, single on mobile) — jump links for readers and anchor
  sitelink eligibility for search. Verified live: anchors resolve,
  375px overflow 0, axe A/AA 0.

## Optimization loop O13 (2026-08-08)

- Regression spot-check: full sitemap sweep 73/73 URLs 200; live AI
  rewrite spot-check with a fresh client id — honest output (no invented
  metrics), freeRemaining returned correctly.

## Optimization loop O14 (2026-08-08)

- pSEO: /guides/resume-summary-for-freshers (high-volume fresher query;
  objective formula + field examples) and /guides/how-to-list-certifications
  (format, in-progress/expired handling, per-field credentials); sitemap
  73→75, IndexNow 200, both live-verified. Backlog rotated.

## Optimization loop O15 (2026-08-08)

- Regression: both O14 guides + guides hub at 375px — overflow 0, axe
  A/AA 0, TOC rendering, hub lists new entries. Batch closed; returning
  to low-intensity ops unless new signals appear.

## Design system batch D1-D5 — 2026-08-08

Boss directive: deep typography + component upgrade, all-device fit, richer restrained
effects, and plain-language explanations of expert output.

- **D1 Typography**: self-hosted variable fonts (latin subsets, `font-display: swap`,
  preloaded): Inter 400–700 for body (previously referenced but never loaded — fell back
  to system-ui), Sora 600–800 as the display face for h1–h3 across the SPA **and** all
  static SEO pages (`build-seo.mjs` CSS). Resume preview excluded (`:not([data-resume-preview] *)`)
  so exports/preview keep template fonts. `.tnum` tabular-nums on score numbers.
- **D2 Components**: buttons get micro-interaction polish — `active:scale-[0.98]`,
  hover shadow elevation, outline variant hover border tint; consistent transition set.
- **D3 All-device**: live walkthrough at 375/768/1024/1440 on `/`, `/ats-checker`,
  `/builder`, `/about/` — 0px horizontal overflow at every width, axe (WCAG 2A/2AA)
  0 violations on all four pages. Template filter chips raised to 44px touch height
  on mobile (`min-h-11 sm:min-h-8`).
- **D4 Effects**: landing hero staggered rise-in entrance (CSS keyframes, 60ms steps),
  feature cards + template tiles hover lift; all gated by existing global
  `prefers-reduced-motion` kill switch. CWV after ship: LCP 244ms, CLS 0.
- **D5 Plain language (user-mind focus)**: ATS checker results gain a
  "What do these scores mean?" expander translating Keyword match / Structure into
  recruiter-behavior terms with a "what to do" action line; each health-report dimension
  now carries a plain-language "why it matters" line (e.g. quantification: "numbers make
  claims believable — 'cut costs 18%' beats 'reduced costs'").

Deployed worker version `04c3e758`. Verified live: fonts loaded (`document.fonts`),
h1 computed family Sora, explainer expands, example score path intact.

## Replication benchmark batch (RB) — 2026-08-05

Boss directive: pick one head-to-head benchmark and replicate to 100%, then optimize
beyond it. Chose **Resume.io** (guest builder fully walkable without account; Rezi
gates the editor behind signup). Full first-hand walk-through of landing, template
chooser, guest editor (wizard steps, resume score chip, Customize → Template/Text/Layout),
templates/examples/pricing pages at 1440px and 375px.

Output: `docs/replication-benchmark.md` — 13 pages/flows scored, all P0/P1 gaps closed.

**Fix shipped (was the only P0 gap, Customize→Text parity):** user text-size (S/M/L)
and line-spacing (Compact/Normal/Relaxed) controls in the builder design bar, applied
uniformly to the live preview, PDF export (size/line-height multipliers in PdfWriter)
and DOCX export (half-point scaling + `w:spacing` line rule). Combined with the live
PDF page counter this doubles as a one-page rescue tool.

Deliberate divergences (documented, not defects): no stepped wizard (one-page form +
sticky preview is faster to edit), no fabricated stats in copy, no per-card format
badges (all our templates export all formats), no signup gate before download.

## Replication upgrade batch (RB6) — 2026-08-08

Boss directive: (A) prove full page coverage of the benchmark; (B) audit the
benchmark's technical standards and meet or exceed each one.

**A — Page coverage:** resume.io's declared sitemap 404s (observed), so inventory was
built by crawling internal links from 6 seed pages: 746 unique paths → 15 page types.
All 15 accounted for: 11 compared (5 newly walked this batch: ATS checker, AI-builder
marketing, cover-letter surface, legal, about/contact), 4 deliberate-n/a with reasons
(blog media, help center, career-suite upsell, affiliates/billing). Coverage 100%.

**B — Tech audit (11 dimensions, black-box only):** rendering, framework, fonts,
images, asset caching, HTML caching, security headers, structured data, SEO tech,
performance, a11y. Two were below their standard and are fixed in this batch:

- **Asset caching**: they serve hashed CSS/JS with `max-age=31556952`; we served
  everything `max-age=0`. Fixed: worker middleware sets `immutable, max-age=1y` on
  `/assets/*` and 7-day TTL on `/fonts/*`.
- **Security headers**: they send HSTS/XCTO/XFO/Referrer-Policy/CSP; we sent none.
  Fixed: same middleware adds all five plus Permissions-Policy; our CSP directives
  (`frame-ancestors 'self'; object-src 'none'; base-uri 'self'`) are stricter than
  their `default-src *` allowlist.

Gotcha: `assets.run_worker_first` had no effect until rebuild — the Vite Cloudflare
plugin emits a redirected `dist/honestcv/wrangler.json`, so wrangler.jsonc changes
require `npm run build` before upload. Also `wrangler deploy` needs the
CLOUDFLARE_WORKERS_API_TOKEN (default token fails zone-routes with error 10000).

Performance baseline (same vantage, cold cache): resume.io TTFB 3182ms / LCP 3396ms /
CLS 0.08 / 921KB vs ours TTFB 30ms / LCP 280ms / CLS 0.0005 / 193KB — exceeded on all.
Verdict recorded in docs/replication-benchmark.md: coverage 15/15 (100%), technical
11/11 at-or-above after fixes. Live regression: axe 0 violations (/, /builder), 375px
no overflow, headers verified on production responses.

## Acceptance-review remediation (AC1) — 2026-08-09

External acceptance review scored HonestCV 85/100 (pass, best of 8 products). All
listed items fixed this batch:

- **P1 — ATS score explainability**: builder ATS card now shows the weighting next to
  the sub-scores (Keywords ×70% / Structure ×30%) plus a "How this score is
  calculated" expandable spelling out the keyword-extraction and 6-point checklist
  rules, that it runs locally, and that 100 = all rules pass, not a hiring guarantee.
  Same formula item added to the /ats-checker "What do these scores mean?" explainer.
- **P2① — Email-gate privacy line**: the free-download dialog states exactly what we
  send (occasional product updates), that the address is never sold/shared, that the
  resume never leaves the browser, and links the privacy policy.
- **P2② — Mobile edit/preview switcher**: the floating Preview jump button is replaced
  by a persistent bottom segmented control (Edit | Preview & score, 44px targets,
  aria-pressed) that swaps panes on <lg screens instead of scroll-hunting.
- **P2③ — Themed export by default**: exports were already template-aware (accent
  headings, bands, dividers, serif/sans); the reviewer saw the monochrome Classic
  default. The example resume now loads the Modern template so the first PDF visibly
  matches the styled preview.
- **Cross-product self-check**: AI Tailor and cover-letter/interview dialogs now set a
  wait expectation ("usually 10–20 seconds") while generating; error/empty states and
  quota messaging already inline from earlier rounds.

## Onboarding batch U1-U3 (2026-08-05)

Directive: add restrained user guidance/onboarding across the product.

Competitor patterns consulted (from prior firsthand research, docs/competitor-research-*.md,
docs/bench-r1/): Enhancv chat-style wizard, Teal 5-step skippable onboarding +
empty-state next-step guidance, Zety/Resume.io step wizards, Resume Worded
career-level wizard. Chosen approach: no forced wizard (conflicts with our
open-editor, no-account model) — landing narrative + a one-time self-checking
checklist + one-time "New" badges.

- **U1 — Landing "How it works"**: 3-step narrative section after the hero
  (add experience → tailor to the job → download), static, no JS.
- **U2 — Builder getting-started checklist**: one-time card (hidden after
  Dismiss via `honestcv.tourDone`, or for users who have already downloaded,
  via `honestcv.shared`). Four steps auto-check off from real state (name
  filled, JD pasted, Tailor opened, download done). No animation; sr-only
  "(done)" for screen readers.
- **U3 — New-feature discovery**: one-time "New" badges on the "Tailor to this
  job" button and the "Full health report" link, cleared on first use via
  `honestcv.seen.tailor` / `honestcv.seen.health`.

Empty states already covered (builder example/import card, ATS checker example
score link) — no changes needed there.

## Brand & marketing batch BR (2026-08-05)

Directive: comprehensive branding + all non-dev marketing activity.

- **BR-A — Brand system** (`docs/brand/brand-guide.md`): brand story +
  positioning one-liner, four pillars, naming/tone-of-voice rules with banned
  words, visual identity spec (logo usage, oklch palette, type, motion), and a
  per-release consistency checklist.
- **BR-A④ — Consistency audit fixes**: stale "12 templates" corrected to 22 in
  llms.txt and the /templates/ hub description; footer gains an About link.
- **BR-B — Marketing asset packs** (`docs/marketing/`):
  `directory-submissions.md` (AlternativeTo/SaaSHub/Uneed/TAAFT checklist +
  paste-ready copy), `social-calendar-14-days.md` (14 days of Reddit/X/HN
  posts, disclosure-first Reddit strategy), `producthunt-launch-kit.md`
  (tagline, gallery plan, maker comment, FAQ), `email-lifecycle-templates.md`
  (double-opt-in confirmation, welcome, day-7 nudge, beta→paid — sending not
  wired, requires approval).
- **BR-B⑥ — /about page**: brand story, promises, press kit (boilerplate, logo
  + OG downloads, naming), Organization JSON-LD; added to sitemap (76 URLs).

Red lines kept: no fake accounts, no fabricated reviews, no emails sent (no
double-opt-in flow yet), no scraping around bot walls.

## Iteration I4 (2026-08-05)

Driver: online testing (I1–I3 regression) found cover-letter AI returning 503
in production, and each FAILED call still consumed a free-quota unit
(12 → 11 → 10 across two failures).

- **Fix — consume-after-success quota**: all four AI endpoints
  (`/api/ai/rewrite`, `/api/ai/tailor`, `/api/ai/cover-letter`,
  `/api/ai/interview`) now *peek* at the remaining quota before calling the
  LLM (402 when exhausted, unchanged) and consume a unit only after a
  successful upstream response. Upstream 5xx/429/parse failures cost nothing.
  A refund-on-failure design was tried first but KV read-after-write raced;
  consume-after-success is simpler and race-safe for the failure path.
- **Production verification** (fresh QA client ids, no real payment): quota
  12 → failed rewrite (503) → still 12. Before the fix the same sequence
  went 12 → 11.
- **Upstream outage confirmed**: relay api.aicdks.com returns 429/503 on all
  attempts over ~5 minutes (worker logs show upstream status; direct probe of
  the relay base URL also errors). This is a relay-account/provider issue —
  escalated to the boss. Cover-letter success + busy-state smoke remains
  pending until the relay is healthy.

## Iteration I5 (2026-08-05)

- **LLM resilience**: `callLlm` now retries once (1s backoff) on upstream
  429/5xx or network errors before returning the honest failure message.
  Converts single transient relay hiccups into successes; a persistent outage
  still fails fast with the same message and (since I4) costs no quota.
- Relay api.aicdks.com still down at deploy time (503 after retry, quota
  unchanged at 12 — I4 semantics confirmed again on the new version).
- Data driver: first-party analytics still ~0 organic (1 google referrer,
  17 email leads incl. QA); distribution remains boss-side.

## Iteration I6 (2026-08-05)

Data driver: `/qa-test` hits (4) showed up in the first-party path report —
the QA flag page itself is visited *before* `honestcv.qa=1` is set, so its
first pageview was counted.

- `/api/hit` now drops any `/qa-*` path server-side (returns ok, stores
  nothing).
- `scripts/analytics.mjs` filters `/qa-*` out of the path breakdown so
  historical KV records don't pollute reports either.

## Iteration I7 (2026-08-05)

Testing agent's I4–I6 regression passed (503 no longer burns quota, golden
path, 375px + axe all green). Its three P2 polish items fixed:

- AI outage error copy now says the service is "temporarily unavailable …
  None of your free AI uses were spent" (accurate since I4).
- "N free AI uses left" hint shown next to the Tailor button once a JD is
  pasted (was only at the very bottom of the edit column).
- 375px /ats-checker: resume label row wraps cleanly next to the Upload
  button (flex-wrap).

Verified on production: failed rewrite returns the new copy, quota stays 12.
Cover-letter success smoke still pending on the relay outage (api.aicdks.com
503/429 — boss-side).

## Iteration I8 (2026-08-05)

Competitor-pattern gap: every major competitor (Zety/Resume.io/Enhancv) has a
large role-based "resume examples" library — a top pSEO category we lacked.

- New `/examples/` hub + 8 role pages (software engineer, registered nurse,
  marketing manager, data analyst, project manager, customer service, sales
  representative, teacher). Each renders a full fictional-but-realistic
  example resume (summary, quantified bullets, skills, education) with an
  explicit "fictional example — never copy claims you can't defend" note and
  3 role-specific tips; Article + BreadcrumbList JSON-LD.
- SPA footer links Resume examples; sitemap 77 → 86 URLs; llms.txt gains an
  examples section; IndexNow submitted 86 URLs (HTTP 200).
- Live verification: /examples/, /examples/software-engineer/,
  /examples/teacher/ all 200.

## Iteration I9 (2026-08-05)

Regression round (testing agent, recorded, production main 239d644):

- I7 quota hint next to Tailor, new outage copy verbatim, quota unchanged
  (12 before/after a failed call), 375px ats-checker label wrap — all passed.
- I8 /examples/ hub + role pages: rendering, disclaimer, tips, CTAs, related
  links, footer link, 375px no overflow, axe A/AA 0 violations (4 scans),
  console clean — all passed.
- Cover-letter success smoke still pending (relay down; 1 controlled attempt
  confirmed the 503 branch only).

## Iteration I10 (2026-08-05)

Competitor revisit (pricing-level; full UX revisit was the RB batch):

- Resume.io $29.95/mo (+$49.95 tier) — matches /vs/resume-io.
- Rezi $29/mo, $149 lifetime — matches /vs/rezi.
- Kickresume tiers visible ($8–$120 range) — /vs/kickresume claims hold.
- FlowCV pricing page is JS-only via curl; last first-hand verification O11.
- New-competitor scan: careerflow.ai/pricing 404s (site restructure);
  swooped.co reachable — job-board-first model, not a builder competitor.
  No /vs/ page changes needed this round.

## Iteration I11 (2026-08-05)

Examples library second batch (competitor-gap continuation of I8):

- 7 new role example pages: accountant, administrative-assistant,
  graphic-designer, human-resources (HR generalist), product-manager,
  retail-associate, warehouse-worker — 15 roles total on /examples/.
- Same format: full fictional resume card, disclaimer, 3 honest-writing
  tips per role, Article + BreadcrumbList JSON-LD, related links, CTAs.
- Sitemap 86 → 93; llms.txt updated; IndexNow submitted (93 URLs, HTTP 200).
- Deployed 19ae2499; spot-checked live pages 200. Note: first upload went
  out with a stale dist (404s on new pages) — rebuilt and redeployed;
  recipe reminder: always `npm run build` immediately before
  `wrangler versions upload`.

## Iteration I12 (2026-08-05)

Internal-linking pass for the new /examples/ library (SEO driver):

- All 7 static-page footer variants (landing-adjacent, comparison, about,
  guide, template, hub, example) now include an Examples link.
- Guide "Keep reading" lists now include "Resume examples by role"
  alongside the /vs/ hub — every guide links the new category.
- Deployed fd64e93c; live-verified /guides/resume-keywords/ (2 example
  links) and /templates/atlas/ (1). Relay status changed: 401 invalid
  token at provider (was 429/503) — escalated to boss for key reissue.

## Iteration I13 (2026-08-05)

Examples discoverability from the landing page (UX + internal-link driver):

- Landing template-gallery section now ends with a "Not sure what to
  write? Browse 15 complete resume examples by role" link to /examples/.
- /examples/ hub meta description updated to reflect 15 roles.
- Deployed b5a2e2c9; live-verified hub description and landing bundle.
- Analytics check (driver 5): still zero organic referrers; first-party
  hits unchanged pattern; 18 email leads (internal/test). Distribution
  remains the bottleneck (boss-side).

## Iteration I14 (2026-08-05)

Long-standing P2 from the D-batch test pass: the free-download email gate
(`hasSubscribed()`, honestcv.subscribed) and the post-download share flag
(honestcv.shared) were separate keys, so a user who had already downloaded
(shared=1) but whose subscribed key was absent would be asked for their
email again. `download()` now treats a prior download as having passed the
gate:

    if (!hasSubscribed() && !localStorage.getItem('honestcv.shared'))

Deployed 74f30afb.

## Iteration I15 (2026-08-05)

Weekly pSEO: new 12-section guide /guides/multiple-positions-same-company/
(promotions/stacked-vs-separate entries — high-volume long-tail with no
existing coverage on the site; includes ATS parsing guidance and the
builder's duplicate-entry recipe). Sitemap 93 → 94; IndexNow 94 URLs
HTTP 200; live page 200. Deployed 8b93e3d3.

## Iteration I16 (2026-08-05)

"Edit this example in the builder" — the conversion step competitors gate
behind signup, we do free and local:

- build-seo.mjs now also emits /examples/examples.json (slug + person data
  for all 15 roles).
- Example-page CTA changed from a bare /builder link to
  /builder?example=<slug>.
- Builder handles ?example=<slug>: fetches examples.json, converts via new
  exampleToResume() (dates split, education/certifications split on ·/—,
  skills joined), asks window.confirm before replacing non-empty user
  content, keeps a deliberately-picked template, and strips the query param
  so refresh doesn't re-trigger.
- Deployed 949d6fc4; live-verified examples.json and the new CTA href.

## Iteration I17 (2026-08-05)

Regression round (testing agent, recorded, production 949d6fc4):

- I16 happy path: accountant example loads with split dates, joined
  skills, extracted certifications; param stripped; reload stable.
- I16 confirm path: Cancel keeps prior content, OK replaces (teacher).
- I14: shared-only profile downloads without a second email prompt;
  exported PDF real text verified via pdftotext.
- I13: landing link and hub meta verified.
- 375px builder after example load: no overflow; console clean;
  axe covered in prior rounds.
- UX observation (accepted, not a bug): example deep-link users hit the
  "Final check" nudge on first download because examples ship without
  email/phone — that nudge is doing its job (users must replace contact
  details with their own), so no change.
- Relay still 401 (invalid token) — cover-letter success smoke remains
  blocked; boss notified.

## Iteration I18 (2026-08-05)

Driver: SEO/structured-data review of the hub pages.

- The four hub pages (/examples/, /guides/, /templates/, /vs/) are pure
  link lists but carried no list markup, so search engines had to infer
  the collection from HTML alone.
- `hubPage()` now emits ItemList JSON-LD (name, url, numberOfItems,
  positioned ListItems) alongside the existing meta — one change covers
  all four hubs and any future one.
- Live: examples 15, guides 33, templates 22, vs 12 items.
- Deployed version 9c5649c5-2231-4ad4-8ec5-5508d53c6aee.

## Iteration I19 (2026-08-05) — weekly pSEO

- New guide /guides/photo-on-resume/ (12 sections): country-by-country
  norms (US/UK/CA/AU no vs DE/FR/ES/JP/CN common), why US screeners
  discard photo resumes, posting instructions override norms, genuine
  occupational exceptions, what parsers do with images, the space cost,
  specs when a photo is required, LinkedIn as the right venue, what to
  put in that space instead, other personal details by market, and how
  HonestCV's text-only templates handle it (DOCX + word processor for
  photo markets).
- Sitemap 94 → 95; IndexNow submitted 95 URLs, HTTP 200.
- Deployed version d2327158-8d4e-44f5-8599-48d03f4e10cc. Live 200 (the
  URL 404'd for ~1 minute after deploy while the edge propagated —
  recheck before concluding a deploy failed).

## Iteration I20 (2026-08-05)

Driver: new-user UX walkthrough of /guides/.

- The hub had grown to 34 undifferentiated links — a wall no visitor
  scans. `hubPage()` items may now carry a `group`; `renderHubItems()`
  renders one `<h2>` + list per group (first-seen order) and falls back
  to the old flat list when no item is grouped, so /examples/, /vs/ and
  /templates/ are unchanged.
- Guides are grouped by reader intent: how resumes get read / writing
  the content / tailoring to a job / your situation / what to include
  and leave off / beyond the resume. `groupedGuideItems()` throws if
  GUIDE_GROUPS names a guide that doesn't exist, and any guide not
  listed still renders under "More resume guides" — a new guide can
  never silently disappear from the hub.
- ItemList JSON-LD still covers all 34 in the displayed order.
- Deployed version be154942-142b-4135-8e4e-d096fa8e0e8f; live headings
  verified.

## Iteration I21 (2026-08-05)

Drivers: internal-linking audit + visual review of the example pages.

- Example pages linked out to three sibling examples and a bare "All
  resume guides" link — the reader who just decided "I want a resume
  like this" had nowhere to learn how to write one. Added a "How to
  write yours" list pointing at the four guides that actually apply
  (summary, bullet points, ATS formatting, tailoring), resolved from
  GUIDES so a renamed slug drops out instead of 404ing.
- The entry date used `float:right`, which on narrow screens can ride
  over a long role/company line. Header is now a wrapping flexbox with
  space-between: same desktop look, dates fall to their own line when
  they don't fit.
- Deployed version 34607c9a-7b2c-477f-a776-ac425d9604f0; live verified.

## Iteration I22 (2026-08-05)

Driver: new-user UX walkthrough of an empty builder.

- The empty state offered one generic sample resume; the 15 role
  examples were only reachable by leaving for /examples/ and coming
  back. Added a "Or start from your role" select in the empty state
  that loads any of them in place (44px tall for touch, labelled).
- Refactored the I16 deep-link effect: examples.json is now fetched once
  into state and shared by both the picker and the ?example= deep link,
  with `applyExample()` holding the single confirm-before-replace and
  keep-chosen-template rule.
- Deployed version ad00a972-02d3-4cfa-9e24-9136bdcacbe2.

## Iteration I23 (2026-08-05) — competitor revisit

Pricing recheck against the live pages (10-round cadence):

- Resume.io: $29.95 / $49.95 — /vs/resume-io still accurate.
- Rezi: $29, $99, $149, free tier — /vs/rezi still accurate.
- Kickresume: $8–$120 band — /vs/kickresume still accurate.
- Standard Resume: $19 (not currently a comparison page).
- Jobscan returns 403 to non-browser requests; our /vs/jobscan text is
  already stamped as a firsthand August 2026 check, so it stands.
- No comparison-page edits needed this round.

## Iteration I24 (2026-08-05) — regression round

Testing agent, recorded, production worker ad00a972 (main ee9d87e),
0 AI calls:

- I22 picker: clean profile shows all 15 roles; Accountant loads Elena
  Vasquez with split dates, ATS 83, Modern template, no confirm.
- I16 after the refactor: confirm text unchanged, Cancel keeps current
  content, OK replaces, `?example` stripped, reload does not re-prompt.
- I21: "How to write yours" links resolve; 375px date line wraps below
  the title (no float overlap), scrollWidth 375.
- I20: exactly 6 group headings, 34 unique guide links, all 200.
- I19: photo guide renders 12 sections; TOC anchors jump.
- I18: ItemList parses — /guides/ 34 items, /examples/ 15.
- axe A/AA 0 violations on /guides/ and /builder; console clean apart
  from the known cloudflareinsights block.

Coverage caveat recorded: the picker only renders in the empty state, so
its confirm-on-non-empty branch is exercised through the shared
`applyExample()` deep-link path rather than the picker itself.

## Iteration I25 (2026-08-05)

Driver: testing-agent observation carried since I16.

- Loading a role example put strings like "UNC Charlotte, 2019" in the
  education *school* field with an empty date, so the graduation year
  rendered inside the school name. `exampleToResume()` now peels a
  trailing ", YYYY" into `endDate`:

      /^(.*?),\s*(\d{4})$/ → school "UNC Charlotte", endDate "2019"

  Schools without a trailing year ("State University") and comma-plus-
  city forms ("Ohio State University, Columbus") are untouched. No date
  is invented — the year only moves when the source data already has it.
- Deployed version 6d01fcd7-5d8a-49b4-987d-514a64391d3a.

## Iteration I26 (2026-08-05)

Weekly pSEO — third batch of role examples (15 → 20):

- New roles: electrician, truck-driver, financial-analyst,
  medical-assistant, restaurant-server — all high-search-volume
  "resume example" queries in trades, transport, finance, healthcare
  support and hospitality that the library did not cover.
- Each follows the house pattern: real-text example with quantified,
  role-authentic evidence (license class, endorsements, forecast error,
  patient volume, check average) plus three role-specific tips.
- Generated pages feed the builder picker and `?example=` deep link
  automatically via examples.json (now 20 entries).
- Sitemap 95 → 100 URLs; IndexNow submitted 100 → HTTP 200; all five
  new pages live 200; /examples/ ItemList numberOfItems now 20.
- Deployed version 1e01ac89-4594-4860-93d4-834ab73f07b1.

## Iteration I27 (2026-08-05)

New-user UX driver: at 20 roles the flat /examples/ list outgrew a
single scan, same as /guides/ did at 34.

- Grouped the examples hub into 5 sector headings via the shared
  `renderHubItems()` group support from I20: Tech & data, Business &
  finance, Healthcare & education, Trades & transport, Customer-facing
  & office. `groupedExampleItems()` throws on unknown slugs and drops
  ungrouped roles into "More roles" so nothing silently disappears.
- Landing example blurb updated 15 → 20 roles.
- Live: all 5 group headings render on /examples/, ItemList still 20.
- Deployed version 6b8d2655-4348-4386-ab51-1313a590c99d.

## Iteration I28 (2026-08-05) — regression round

Testing agent, recorded, production worker 6b8d2655 (clean QA profile),
0 AI calls. All of I25–I27 passed:

- I25: Data Analyst example education shows School "Georgia Tech" with
  End date "2021"; preview renders the year right-aligned as a date.
- I26: all five new example pages 200 with the full layout; picker
  lists exactly 20 roles; /builder?example=electrician confirms then
  loads Miguel Herrera with the URL stripped.
- I27: /examples/ shows the 5 sector groups; 20 unique links all 200;
  ItemList numberOfItems 20; landing blurb says 20 roles.
- 375px no overflow on /examples/ and builder-with-picker; axe A/AA 0
  violations on both; console clean apart from the known
  cloudflareinsights block.

Testing pitfall recorded: clearing honestcv.resume via CDP is undone by
any open builder tab's autosave — close extra tabs before re-clearing.

## Iteration I29 (2026-08-05)

Visual/consistency driver: /templates/ was the last flat hub (22
thumbnail rows) after /guides/ (I20) and /examples/ (I27) were grouped.

- Grouped the templates hub into 4 mutually exclusive style headings
  mirroring the gallery filter chips: Banded headings (5), Serif (7),
  Minimal (3), Modern sans (7). `groupedTemplateItems()` follows the
  same validated pattern (throws on unknown slug, ungrouped templates
  fall into "More templates").
- Live: 4 group headings render, ItemList still 22 items. Edge
  propagation took ~45s (first probe returned the old flat page).
- Deployed version 3c7a1ee8-0ef4-4a57-87f1-b2c5efa2910c.

## Iteration I30 (2026-08-05)

UX driver: the builder's empty-state role picker grew to a flat list of
20 options — the same scan problem I27 fixed on the hub.

- examples.json entries now carry a `sector` field derived from
  EXAMPLE_GROUPS (fallback "More roles"), and the picker renders one
  <optgroup> per sector in first-seen order, matching the hub grouping.
- Deep-link path unchanged; only option markup differs.
- Live: examples.json serves 20 entries with sectors.
- Deployed version 1773fa78-8f53-44ae-b057-1dec4b30f6f6.

## Iteration I31 (2026-08-05)

Regression-round follow-up: the I30 picker showed sectors in EXAMPLES
array order (Tech & data → Healthcare & education → …), which differed
from the /examples/ hub order (cosmetic note from the I29/I30 test).

- examples.json is now emitted in EXAMPLE_GROUPS order (ungrouped roles
  appended under "More roles"), so the picker's optgroups match the hub
  exactly: Tech & data → Business & finance → Healthcare & education →
  Trades & transport → Customer-facing & office.
- Live: examples.json serves 20 entries in hub order.
- Deployed version 1f0b1096-2060-4edd-93ac-fc505addb524.

Regression round I29+I30 (testing agent, recorded, worker 1773fa78):
grouped picker 5 optgroups/20 roles, Electrician loads Miguel Herrera;
templates hub 4 groups with 22 links all 200, ItemList 22; 375px no
overflow; axe 0 violations; console clean; 0 AI calls. Evidence on
PR #162.

## Iteration I32 (2026-08-05) — competitor revisit (10-round cadence)

Black-box pricing re-verification against our /vs/ claims (curl, no
bot-wall bypass):

- Rezi: pricing page shows $29/mo and $149 lifetime — matches /vs/rezi.
- Resume.io: $29.95 (and a $49.95 tier) present — matches /vs/resume-io.
- FlowCV: pricing page is client-rendered (no $ in HTML); last
  first-hand verification ($0/$3/$5) stands, /vs/flowcv unchanged.
- Jobscan: 403 bot wall — not bypassed; /vs/jobscan keeps its
  re-verified stamp from the last successful check.
- Teal: still 403; /vs/teal claim unchanged (marked as of last check).
- New-competitor scan: careerflow.ai /pricing 404s (site restructure);
  no new head-on resume-builder entrant found worth a /vs/ page this
  round.

No copy drift found → no code change; log-only round.

## Iteration I33 (2026-08-05)

Weekly pSEO — new guide /guides/how-far-back-should-a-resume-go/:

- Classic high-volume query missing from the 35-guide library: the
  10-15 year rule, the "Earlier career" one-liner (cutting without
  creating a gap), when to keep an old role in full, education-date and
  age-signal guidance, senior-candidate depth-over-span, what recruiters
  actually check dates for, and the ATS-vs-human cost distinction.
- Grouped under "What to include — and leave off" (guides hub now 35
  links across the same 6 groups).
- Live 200 with 12 sections/TOC; sitemap 100 → 101; IndexNow 101 URLs
  → HTTP 200.
- Deployed version ee99e006-391f-47f7-aa31-16122222352d.

## Iteration I34 (2026-08-05) — CWV verification round

Performance driver, live CDP measurement (cold-ish loads, buffered
PerformanceObserver):

- /: TTFB 66ms, LCP 232ms, CLS 0.0004
- /guides/how-far-back-should-a-resume-go/: TTFB 20ms, LCP 92ms,
  CLS 0.0051
- /examples/: TTFB 20ms, LCP 76ms, CLS 0.0105

All far inside Google's "good" thresholds (LCP < 2.5s, CLS < 0.1).
Console on all three pages: only the known cloudflareinsights
ERR_BLOCKED_BY_CLIENT. No product change needed; log-only round.

## Iteration I35 (2026-08-05)

UX driver — /vs/ was the last flat hub (guides, examples and templates
hubs are all grouped). Grouped its 12 comparisons by what the reader is
comparing against:

- Trial-to-subscription builders: Zety, LiveCareer, Resume Genius
- Freemium resume builders: Resume.io, Kickresume, Novorésumé,
  Enhancv, FlowCV
- AI & ATS-optimization tools: Rezi, Teal, Jobscan, Resume Worded

Implementation mirrors GUIDE/TEMPLATE/EXAMPLE groups: VS_GROUPS +
groupedVsItems() with an unknown-slug throw and a "More comparisons"
fallback so future /vs/ pages can't silently vanish. ItemList JSON-LD
still numberOfItems 12.

Live: 3 h2 groups, 12 links, deployed version
0da1f0c1-c6e8-435b-9c96-53fc27137b70.

## Iteration I36 (2026-08-05) — data verification round

User/data driver, scripts/analytics.mjs (last 14 days):

- First-party hits unchanged since the last review (84/10/7/9 across
  four days) — all attributable to internal testing before the /qa-*
  exclusion; no new organic hits recorded.
- Top paths still /builder, /, /ats-checker plus a few guide views;
  referrers: none recorded; email leads: 18 (test-era, not organic).
- Conclusion unchanged: acquisition is the bottleneck, and it sits in
  off-site distribution (directories/social/PH launch packs prepared in
  docs/marketing/, owner-executed). On-site pSEO keeps compounding
  (101 URLs indexed via IndexNow).

No product change warranted; log-only round.

## Iteration I37 (2026-08-05)

New-user UX walkthrough at 375px (examples hub → example page →
deep-link into builder, clean profile, QA-flagged):

- Flow works end-to-end: financial-analyst deep link loads the resume
  (checklist step 1 auto-done, strength 85%), no overflow anywhere, no
  console errors.
- Finding: static-page .btn CTAs measured 42px tall — below the 44px
  touch-target minimum we hold the app to. Fixed with min-height:44px
  on .btn (all static SEO pages share the stylesheet).
- Live after deploy: all example-page CTAs measure 44px; 375px
  scrollWidth still 360.
- Deployed version f21d4b8e-ede7-4b2d-a217-e1a6ea5b3684.

## Iteration I38 (2026-08-05) — visual review round

Frontend visual driver: full-page 1440px screenshots of /, /examples/
and /vs/ reviewed against the acceptance-officer polish bar.

- All three pages render clean: grouped hubs read well, landing
  three-step narrative + 22-template gallery + comparison table intact,
  no layout defects, no stray unstyled elements.
- Observation (P3, deliberate): landing gallery filter chips count
  overlapping style tags (Serif 9, Modern sans 13) while the /templates/
  hub uses mutually exclusive groups (Serif 7, Modern sans 7) — filters
  vs. groupings; not user-visible side by side, leaving as is.

No defect found; log-only round.

## Iteration I39 (2026-08-05) — production smoke round

Live-testing driver, scripted golden-path smoke on cv.zalize.com
(QA-flagged, zero AI calls):

- Builder → Ruby template → PDF export: download succeeds and
  pdftotext confirms real-text output (name/title/summary/headings all
  extractable) — ATS-safety of exports holds after the recent deploys.
- /api/health: ok, llmConfigured true (provider itself still 401 —
  unchanged, no AI smoke claimed).
- /api/ai/quota responds correctly; /api/hit accepts and the /qa-*
  exclusion path still returns 200 without polluting analytics.

No defect found; log-only round.

## Iteration I40 (2026-08-05)

pSEO/content driver — fourth batch of role resume examples (20 → 25):

- New roles: operations-manager (Business & finance),
  mechanical-engineer (Tech & data), dental-assistant (Healthcare &
  education), bartender and security-guard (Customer-facing & office).
- Same schema and honesty bar as I8/I11/I26: quantified,
  interview-defensible bullets; verifiable licenses/certifications
  (RDA, state guard license, responsible-vendor permit) called out in
  tips as the first screening filter for those roles.
- examples.json now 25 entries (still emitted in hub sector order);
  hub metadata and landing copy updated 20 → 25.
- Live: all five new routes 200; sitemap 101 → 106; IndexNow 106 URLs
  → HTTP 200.
- Deployed version ceeed309-6209-4e55-83d0-44439de1a879.

## Iteration I41 (2026-08-05) — I40 production regression

Live regression of the I40 batch on cv.zalize.com (clean profile,
QA-flagged, zero AI calls):

- /examples/ hub: 5 sector groups, 25 links, ItemList numberOfItems 25.
- Builder picker: 5 optgroups in hub sector order (I31 fix holds), 25
  role options; selecting Bartender loads Jack Moreau into the resume.
- All five new example routes 200 (verified at deploy time in I40).

No defect found; log-only round.

## Iteration I42 (2026-08-05) — accessibility regression

Axe (WCAG 2 A/AA) + 375px overflow sweep over pages added or changed
in I33-I40: /examples/, two new example pages (bartender,
mechanical-engineer), the new how-far-back guide, and the regrouped
/vs/ hub.

- All five pages: 0 axe violations, 0px horizontal overflow at 375px.

No defect found; log-only round.

## Iteration I43 (2026-08-05)

Content driver — new guide /guides/best-resume-fonts/ (fonts, sizes,
margins):

- High-volume topic missing from the library; complements
  best-resume-format and the template pages. 12 sections: safe font
  lists, the 10.5-12pt window, 0.5in margin floor, spacing, what ATS
  parsers actually see (structure risk vs. the font-list myth),
  bold/italic/color rules, print checks, PDF font embedding, and the
  template tie-in to our S/M/L text & spacing controls.
- Grouped under "Start here: how resumes get read" (guides hub now 36
  links).
- Live 200 with 12 TOC sections; sitemap 106 → 107; IndexNow 107 URLs
  → HTTP 200.
- Deployed version a8d29306-745f-440e-82b5-f656466529bf.

## Iteration I44 (2026-08-05) — ATS checker UX walkthrough

New-user walkthrough of /ats-checker at 375px (clean profile,
QA-flagged): paste resume + JD → score.

- Full result path works: match score with keyword/structure subscores,
  "What do these scores mean?" explainer, matched/missing keyword
  chips (Snowflake, A/B testing correctly flagged missing), highlighted
  JD, keyword-frequency table, six format checks, and the carry-over
  CTA into the builder.
- 0px horizontal overflow at 375px; no console errors.
- Note for scripted testing: the route is lazy-loaded — wait for the
  textarea selector before filling (first probe raced hydration).

No defect found; log-only round.

## Iteration I45 (2026-08-05)

pSEO/content driver — fifth batch of role resume examples (25 → 30):

- New roles: devops-engineer and ux-designer (Tech & data), paralegal
  (Business & finance), pharmacy-technician (Healthcare & education),
  construction-project-manager (Trades & transport).
- Same honesty bar: DORA-style reliability numbers for DevOps,
  outcome-over-portfolio framing for UX, zero-rejected-filings record
  for paralegal, contract values/variance/safety for construction PM,
  certification-first framing for CPhT.
- Hub metadata and landing copy updated 25 → 30; examples.json 30
  entries in sector order.
- Live: all five new routes 200; sitemap 107 → 112; IndexNow 112 URLs
  → HTTP 200. Lint unchanged (0 errors, 6 pre-existing warnings).
- Deployed version 20c848c2-5d4b-4e8e-ac55-f427f4c661ba.

## Iteration I46 (2026-08-05) — I45 production regression

Live regression of the I45 batch (clean profiles, QA-flagged, zero AI
calls):

- /examples/ hub: 30 example links across the 5 sector groups.
- /examples/ux-designer/: axe (WCAG 2 A/AA) 0 violations, 0px overflow
  at 375px.
- Builder picker: 30 role options; selecting Paralegal loads Rachel
  Donnelly into the form and preview (desktop).
- Test-harness note: at 375px the preview pane is hidden behind the
  Edit|Preview switcher, so assert on form input values, not
  body.innerText (an earlier probe misread this as a load failure).

No defect found; log-only round.

## Iteration I47 (2026-08-05) — competitor deep revisit (10-round cadence)

Pricing-drift audit of all live /vs/ claims against competitors' own
pages (real browser, public pages only; last revisit I32):

- Resume.io $29.95 (+$49.95 tier) — matches /vs/resume-io.
- Rezi $0/$29/$149 lifetime — matches /vs/rezi.
- Kickresume monthly $24 / annual ~$8-18/mo — inside our "$19-24/month"
  claim.
- FlowCV $0/$3/$5 — matches /vs/flowcv.
- Resume Worded: /pricing now 404s; live pricing is at /get-pro —
  $49/mo, $33/mo quarterly, $19/mo annual ($229) — matches our
  "$19-$49/month recurring".
- Novorésumé: /premium now 404s; /pricing shows $21.99/$39.99/$139.99
  non-recurring — matches /vs/novoresume.
- Zety/Jobscan/Teal remain bot-walled — not bypassed, claims unchanged
  with their re-verified stamps.

No copy drift found; no new head-to-head competitor worth a page this
cycle. Log-only round.
||||||| 07cfaa6

## Iteration I48 (2026-08-05) — analytics review

Data driver (first-party beacon, referrers, leads; last review I36):

- Still zero organic traffic and zero referrers. The handful of hits
  since 08-07 (5 on 08-10: /examples/bartender/, /vs/, new guide, etc.)
  line up exactly with this session's own walkthrough probes — a few
  scripts navigated before setting the honestcv.qa flag, so their first
  pageview beacon fired unflagged. Not organic traffic; not counted as
  traction.
- Harness rule going forward (also noted in the testing skill's
  spirit): set the QA flag via addInitScript so it's present before the
  first document loads, not after goto.
- Email leads unchanged at 18 (test-era).
- Conclusion unchanged from I36: the bottleneck is off-site
  distribution (docs/marketing/ packs await owner-executed accounts);
  on-site pSEO inventory keeps compounding (112 URLs).

Log-only round.

## Iteration I49 (2026-08-05)

Testing-harness hardening — encode the three scripted-QA pitfalls hit
this cycle into the testing skill so future sessions don't repeat them:

- QA flag must be set via addInitScript before any goto (unflagged
  first-pageview beacons polluted analytics in I48's review).
- /builder and /ats-checker are lazy-loaded: waitForSelector a form
  control before interacting.
- At 375px assert builder content via input values, not body text
  (preview hidden behind the Edit|Preview switcher).

## Iteration I50 (2026-08-05)

Weekly pSEO — new guide /guides/two-column-resume-ats/ (12 sections):
how parsers read columns, what actually breaks (text boxes, layout
tables, header/footer content), the copy-paste reading-order test,
date/title field pairing, skills-sidebar risk, survivorship caveat,
when two columns are fine, the safe hybrid, and building columns right
if you keep them. Clears the last topic from the ops-weekly backlog
(backlog note updated). Grouped under "Start here: how resumes get
read".

Live: page 200 with 12 h2 anchors; sitemap 112 → 113; IndexNow 113 URLs
→ HTTP 200; lint 0 errors (6 pre-existing warnings). Deployed version
4654459e-d4af-415d-912e-c3091ff88d0a.

## Iteration I51 (2026-08-05) — I50 production regression

Live regression at 375px (QA-flagged via addInitScript, zero AI calls):

- /guides/two-column-resume-ats/: axe (WCAG 2 A/AA) 0 violations, 0px
  horizontal overflow.
- /guides/ hub: axe 0 violations, 0px overflow; 37 guide links and the
  new guide present in the "Start here" group.

No defect found; log-only round.

## Iteration I52 (2026-08-05) — non-PDF export smoke

Production test driver: golden-path check of the four non-PDF export
formats (PDF is smoked regularly; DOCX/TXT/MD/JSON less so). Clean
QA-flagged profile, DevOps Engineer example loaded from the empty-state
picker:

- DOCX: real text — name and MTTR bullet present in document.xml.
- TXT: correct plain-text layout (name — title / location / SUMMARY…).
- MD: proper Markdown heading ("# Tomas Lindgren — DevOps Engineer").
- Backup JSON: parses; contact.fullName round-trips.
- Harness note: the "Final check before download" nudge intercepts
  PDF/DOCX/TXT/MD but not Backup; the MD button is labeled "MD", not
  "Markdown".

No defect found; log-only round.

## Iteration I53 (2026-08-05) — tablet-breakpoint visual review

Visual driver: 768px and 1024px walkthrough (the two breakpoints
exercised least often; 375/1440 are covered every cycle) of /,
/examples/, /guides/two-column-resume-ats/ and /ats-checker:

- Zero horizontal overflow at both widths on all four pages.
- Landing hero, three-step cards and CTA pair scale cleanly at 768px;
  ATS checker keeps the side-by-side textarea layout at 1024px with
  the disabled-until-30-chars button state visible.
- Examples hub renders all 30 roles under the 5 sector groups with
  readable one-line blurbs; beta pricing footnote and footer intact.

No defect found; log-only round.

## Iteration I54 (2026-08-05) — copies & restore UX walkthrough

New-user UX driver: the two flows least exercised in recent cycles,
on production with a clean QA profile:

- Copies: dialog copy is honest and clear ("Copies live in this
  browser only", replace-warning before Load); "Save current as copy"
  snapshots with timestamp + ATS badge (83/100 for the UX Designer
  example); Load/Delete present.
- Restore: uploading the I52 backup JSON replaces the editor content
  correctly (contact.fullName round-trip verified).
- Only console noise is the known cloudflareinsights beacon block —
  no real errors.
- Minor observation (not a defect): a copy saved without typing a name
  is listed as "Untitled copy"; the name field is available but
  optional. Acceptable default.

No defect found; log-only round.
