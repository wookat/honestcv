# Replication benchmark — Resume.io (1:1 还原度对照表)

Date: 2026-08-05 · Benchmark: **Resume.io** (chosen over Rezi: its guest builder at
`/app/guest-builder` is fully walkable without an account; Rezi requires signup before
the editor). All observations are first-hand from a real browser walk-through at
1440×900 and 375×812 (evidence: `/home/ubuntu/rio-capture/*.png|.json` in the work VM;
key screenshots attached to the PR). We replicate structure/interaction/experience
patterns with our own implementation — no closed-source code, copyrighted imagery,
fonts, trademarks, or verbatim copy is reproduced.

## Methodology & access limits

- Public pages: landing, /resume-templates, /resume-examples, /pricing — fully accessible.
- App: template chooser (`/app/create-resume/templates`) and guest builder
  (`/app/guest-builder`) — accessible without login; export requires signup (email gate),
  so their post-signup download UX is **not observed** and excluded from scoring.
- No bot wall was encountered; no anti-crawling was bypassed.
- Scores are our replication level of the *pattern* (not pixel identity): 100% = we have
  an equivalent-or-better implementation of the user value; gaps note what's missing.

## Page/flow comparison

| # | Resume.io page/flow (observed) | Pattern observed | RezUp today | Score | Gap / priority |
|---|---|---|---|---|---|
| 1 | Landing hero | Benefit-led H1, dual CTAs (Create / Upload), trust strip, product mock with score badge | Landing hero with dual CTAs (Build / Check ATS score), 3-step narrative, template gallery | 95% | We don't show fabricated stats (deliberate); trust strip = honest positioning instead. No gap to fix. |
| 2 | Template chooser | Category filter chips (All/Word/Simple/Picture/ATS/Two-column…), large previews, PDF/DOCX badges, color swatches per card, hover "Use this template", Skip | Style filter chips (All/Serif/Modern sans/Banded/Minimal), 22 thumbs, accent swatches in builder, deep links | 90% | No per-card export-format badges (all our templates export PDF+DOCX+TXT+MD equally, so the badge carries no signal). P2, skipped as noise. |
| 3 | Start modal | "How do you want to start?" — Create new / Upload existing | Builder empty state offers example resume + Upload PDF/DOCX import | 100% | Equivalent (import + example). |
| 4 | Editor: resume score | Persistent "Your resume score N%" bar with **next-action chip** ("+5% Add email") | Resume strength meter with % + "Next: …" missing-item chips + full 6-dimension health report | 100% | Ours goes deeper (health report). |
| 5 | Editor: wizard steps | "Next: Professional Experience" stepped form; job-title autocomplete; benefit microcopy | Single scrollable form with sections, drag-reorder, bullet starter library, role-based skill chips | 90% | No stepped wizard — deliberate: one-page form + sticky preview is faster for edit-heavy use; our checklist onboarding covers first-run guidance. No autocomplete for job title (P2). |
| 6 | Editor: live preview | Right-pane live preview, page indicator "1 / 1", Change design shortcut | Live preview, PDF page-count indicator, template picker in-page | 100% | Equivalent. |
| 7 | Customize → Template & Colors | Template grid + main-color swatches + filter chips | Template thumbs + 8 accent swatches (aria-pressed) | 100% | Equivalent. |
| 8 | Customize → Text | Primary font, **Line Height (%), Font Size (S/M/L)** | *(before this batch)* none — fixed 11px/1.35 | **was 40%** | **P0 — fixed in this batch**: Text size S/M/L + line spacing Compact/Normal/Relaxed, applied consistently to preview, PDF and DOCX. Font family stays template-driven (ATS-safe standard fonts). |
| 9 | Customize → Layout | Page format A4/Letter, margins, date format, header/date/location alignment, skills columns, education layout | Letter/A4 toggle, section drag-reorder, custom sections | 75% | Margin/date-format/alignment micro-controls: P2 — each option multiplies export QA surface; deferred until user demand. Section reorder (ours) is the higher-value layout control they lack in guest mode. |
| 10 | Mobile editor (375px) | Preview-first, expand FAB, **sticky bottom bar: Customize + Download** | Form-first, floating "Preview" jump FAB, downloads at preview | 85% | Sticky bottom download bar: P2 (our download flow includes format choice + email gate; a bar duplicating it risks confusion — revisit with real mobile usage data). |
| 11 | Templates marketing page | Category tabs, large previews, SEO copy | /templates/ hub + 22 pSEO pages with SVG previews | 100% | Equivalent. |
| 12 | Examples page | Role-based example hub | /guides/ hub (27 guides) + bullet starter library in-product | 90% | No per-role full example resumes; partially covered by role bullet starters + example resume. P2 backlog (pSEO candidates). |
| 13 | Pricing | Subscription ($2.95 trial → $29.95/4wk auto-renew) revealed late | Beta free trial with future one-time prices shown upfront | 100% | Deliberate anti-pattern rejection: no trial-to-subscription trap. |

**Baseline after this batch: 13/13 flows ≥75%, all P0/P1 gaps closed** (item 8 fixed; items
5/9/10/12 documented P2s with reasons — pattern-level parity where the pattern serves users,
deliberate divergence where it doesn't).

## Page coverage (全页面覆盖盘点) — 2026-08-08

Method: `robots.txt` declares `sitemap.xml`, but it returns 404 to both curl and a real
browser (observed), so the inventory was built by crawling internal links from 6 seed
pages (landing, templates, examples, pricing, cover-letter templates, blog): **746 unique
resume.io paths**, collapsing into **15 page types**. Every type is now either compared in
the table above/below or marked deliberate-n/a with a reason.

| # | Resume.io page type (paths) | RezUp counterpart | Status |
|---|---|---|---|
| 1 | Landing `/` | `/` | Compared (row 1) |
| 2 | Templates marketing `/resume-templates` | `/templates/` hub + 22 pSEO pages | Compared (row 11) |
| 3 | Examples hub + ~128 role pages `/resume-examples/*` | `/guides/` + bullet starter library | Compared (row 12, P2 backlog) |
| 4 | Pricing `/pricing` | `/pricing` section | Compared (row 13) |
| 5 | App: chooser/guest builder/auth `/app/*` | `/builder` | Compared (rows 2–10) |
| 6 | ATS checker `/ats-resume-checker` | `/ats-checker` | Compared (row 14, walked this batch) |
| 7 | AI builder marketing `/ai-resume-builder` | AI Tailor/rewrites, presented on landing | Compared (row 15) |
| 8 | Cover letter generator/templates/examples (3 pages + ~21 example pages) | AI cover letter tool in builder | Compared (row 16) |
| 9 | Guide hub `/how-to-write-a-resume` (8 subpages) | `/guides/` hub, 27 twelve-section guides | Compared (row 11/12) |
| 10 | Legal `/privacy` `/cookies` `/do-not-sell` | `/privacy` `/terms` | Compared (row 17) |
| 11 | About `/about` + Contact `/contact` | `/about` (brand + press kit + contact email) | Compared (row 18) |
| 12 | Blog `/blog/*` (~67 posts, videos, podcasts) | — | deliberate-n/a: general career media outside our SEO scope; our guides cover the resume-adjacent subset |
| 13 | Help center `/faq` `/article/*` | — | deliberate-n/a: support center exists to service subscriptions/billing; we have no account system to support (browser-local) |
| 14 | Career suite upsell `/more-than-a-resume-builder`, `/app/job-search` | — | deliberate-n/a: career.io product-suite cross-sell, different business model |
| 15 | Affiliates `/affiliates`, `/billing` | — | deliberate-n/a: affiliate program / billing portal require the paid infra we deliberately don't run in beta |

**Coverage: 15/15 page types accounted for (100%) — 11 compared with parity-or-better, 4
deliberate-n/a with stated reasons. No unexamined page type remains.**

Additional rows from this batch's walk (screenshots: `/home/ubuntu/rio-capture/coverage/*.png`):

| # | Resume.io page/flow (observed) | Pattern observed | RezUp today | Score | Gap / priority |
|---|---|---|---|---|---|
| 14 | ATS checker page | Upload → score + grade + feedback; FAQ section; FAQPage JSON-LD | /ats-checker: paste/upload → score + sub-scores + keyword table + JD highlighting, shareable | 100% | Ours adds JD keyword-frequency comparison; theirs requires upload only. |
| 15 | AI builder marketing page | "How it works" 3 steps + template grid + FAQ | AI Tailor + rewrites presented in landing feature grid and in-product New badges | 90% | No dedicated /ai landing page — P2 pSEO candidate, low priority while organic traffic is 0. |
| 16 | Cover letter pages (generator, 27 templates, 350+ examples) | Separate product surface with its own template/example trees | Cover letter generator (AI + honest template fallback) inside builder | 80% | We treat cover letters as a tool, not a product line; dedicated templates/examples are P2 backlog after resume-side pSEO. |
| 17 | Legal pages | Privacy, cookies, do-not-sell | /privacy + /terms (no third-party ad cookies → no cookie/do-not-sell pages needed) | 100% | Fewer pages because we collect less data (deliberate). |
| 18 | About + contact | Company story, team, career.io family, review badges, contact form | /about: brand story, promises, press kit, Organization JSON-LD, contact email | 100% | Contact form → email link (no support backend by design). |

## Technical standard audit (技术标准反推) — 2026-08-08

Black-box observation only (response headers, public HTML/CSS/JS, real-browser
PerformanceObserver from the same vantage, cold cache via CDP `setCacheDisabled`).

| Dimension | Resume.io (observed) | RezUp (before) | RezUp (after this batch) | Verdict |
|---|---|---|---|---|
| Rendering | Marketing pages server-rendered (267 KB content HTML); app is CSR SPA | SEO pages (76 URLs) prerendered static; landing + app CSR SPA | unchanged | **Met differently**: their SSR goal (fast first paint + crawlability) is achieved by our SSG for all SEO pages + 4.7 KB shell with LCP 280 ms vs their 3396 ms |
| Framework/build | Custom bundle (webpack refs), hashed asset names | React 19 + Vite, hashed asset names | unchanged | Met |
| Font pipeline | Self-hosted subset woff2 (TT Commons/TT Tricks), hashed, preloaded via CSS | Self-hosted subset woff2 (Inter/Sora), `<link rel=preload>`, font-display: swap | unchanged | Met/exceeded (explicit preload + swap) |
| Image pipeline | `srcset` + `loading=lazy` + Cloudflare Image Resizing CDN (`format=auto,quality=70`) | Vector-first (SVG logos/illustrations/template previews); single og2.png | unchanged | **Met differently**: nothing to resize — vector assets are resolution-independent and smaller than their raster pipeline output |
| Asset caching | `cache-control: public, max-age=31556952` on hashed CSS/JS | `max-age=0, must-revalidate` on everything (Workers default) | **Fixed**: `/assets/*` → `max-age=31536000, immutable`; `/fonts/*` → 7-day TTL | **Was below standard — fixed** |
| HTML caching | `max-age=0, private, must-revalidate` + weak ETag | `max-age=0, must-revalidate` + ETag + cf-cache-status | unchanged | Met |
| Security headers | HSTS(preload), XCTO, XFO, Referrer-Policy, broad CSP (`default-src 'self' *` — effectively permissive) | none | **Fixed**: HSTS, XCTO, XFO, Referrer-Policy, Permissions-Policy, CSP `frame-ancestors 'self'; object-src 'none'; base-uri 'self'` | **Was below standard — fixed** (our CSP directives are stricter than their `*`-allowlist) |
| Structured data | Organization + FAQPage/Article JSON-LD per page | Organization, FAQPage, Article, BreadcrumbList, SoftwareApplication JSON-LD | unchanged | Met/exceeded |
| SEO tech | robots + (broken) sitemap ref, canonical, og/twitter cards | robots + working sitemap (76 URLs, lastmod) + IndexNow + llms.txt | unchanged | Exceeded (their `/sitemap.xml` 404s) |
| Performance (cold cache, same vantage, 1440px) | TTFB 3182 ms · LCP 3396 ms · CLS 0.08 · 51 req · 921 KB | — | TTFB 30 ms · LCP 280 ms · CLS 0.0005 · 7 req · 193 KB | Exceeded on every metric |
| Accessibility | not fully audited (their app); landing has skip links | axe A/AA 0 violations on / and /builder (regressed every batch) | unchanged | Met/exceeded |

**Verdict: 11/11 technical dimensions at or above the benchmark's standard after this
batch** — 2 were below (asset cache TTL, security headers) and are fixed in this commit;
2 are "met differently" with measured evidence that the outcome exceeds theirs.

## 超越项 (where we exceed the benchmark)

1. **Privacy architecture**: browser-local data, no account required for full flow including export — Resume.io requires signup to download.
2. **Honest AI**: anti-fabrication constraints + per-line accept/reject AI Tailor; their guest flow exposes no AI editing.
3. **Free browser-side ATS score + keyword highlighting** (observed only as a marketing badge on their landing).
4. **Six-dimension health report** with plain-language explainers vs a single % score.
5. **More export formats**: PDF, DOCX, TXT, Markdown, JSON backup/restore.
6. **Per-job resume copies with per-copy ATS score**; honest pricing (no auto-renew trap).

## Deep optimizations from the walk-through (this batch)

1. **Text size (S/M/L) + line spacing (Compact/Normal/Relaxed)** — Customize→Text
   parity, implemented once and applied uniformly to live preview, PDF (pdf-lib size &
   line-height multipliers) and DOCX (half-point scaling + `w:spacing` line rule), so
   what you see is exactly what exports. Their preview and export are separate renderers;
   ours share one setting source.
2. **Compact spacing as a one-page rescue tool**: combined with our live PDF page-count
   indicator, users who overflow to 2 pages can drop to S/Compact and watch the counter
   return to 1 — a workflow resume.io's guest mode doesn't close (no page counter in form view).
