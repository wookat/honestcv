# Competitor Research — Expanded Field, Round 1 (2026-08)

Scope: expand beyond the previously benchmarked head-to-head set (Zety, Resume.io,
Rezi, Teal, Kickresume) to a wider field: **FlowCV, Novoresume, Enhancv,
Resume Worded, Reactive Resume, Jobscan, Resume Genius, Canva**.

Method & compliance:

- Public browsing + saved public HTML (`~/bench/*.html`), plus one firsthand
  end-to-end walkthrough (FlowCV, real account on a custom-domain mailbox).
- No anti-bot bypass, no CAPTCHA evasion, no purchases, no emails sent.
- Every claim below is labelled: **[observed]** firsthand, **[public]** from
  public HTML/marketing, **[blocked]** could not be verified.

---

## 1. FlowCV — firsthand full walkthrough [observed]

Account: `cvbench@zalize.com` (Cloudflare Email Routing mailbox). Registered,
verified email, completed the full free flow including a real PDF download.

### Pricing (from in-app /plans page, firsthand)

| Plan | Price | Resumes | Cover letters | Job tracker | AI |
|---|---|---|---|---|---|
| Free | $0 forever | 1 | 1 | ✗ | ✗ |
| Basic | $3/mo billed yearly ($36) | 3 | 20 | ✓ | ✗ |
| Pro | $5/mo billed yearly ($60) | Unlimited | Unlimited | ✓ | ✓ |

- Free plan: **unlimited watermark-free PDF downloads**, all templates, full
  layout control, 3 file imports. Honest FAQ discloses auto-renewal clearly.
- 14-day money-back; 25% student discount. Auto-renewing subscription —
  but at $3–5/mo it is an order of magnitude cheaper than Zety/Resume.io.

### Flow & interaction patterns worth learning

1. **Download gate = email verification, not payment.** Anonymous users can
   build fully; clicking Download opens "Create account" → after signup,
   "Verify your email to download" with Resend Link / **Change Email** buttons.
   Verification email arrived in seconds; after clicking the link the PDF
   downloaded immediately with a celebratory "Resume downloaded ✅ …unlimited
   downloads" toast. Friction is one verified email — never a card.
2. **Import prominence**: "Import your existing resume / Start from blank"
   modal at first content screen AND an Import button inside the Add Content
   modal.
3. **Add Content catalog**: 15 section types (Summary, Education, Experience,
   Skills, Languages, Certificates, Interests, Projects, Courses, Awards,
   Organizations, Publications, References, Declaration, Custom).
4. **Contextual Tips panel** per section (achievements-over-duties, quantify,
   reverse-chronological, action-word library grouped by category) — pure
   rule-based coaching, zero AI dependency.
5. **Customization depth** (Customize tab): document language, date format,
   Letter/A4, template gallery, 1/2/mixed column layout, per-element font
   sizes, line height, margins, entry structure (date/location position,
   subtitle placement), heading style/capitalization/icons, body+name fonts,
   single/multi/image color modes with 9 accent-application toggles, header
   alignment/detail arrangement/icon style, photo, link styling, footer
   (page numbers/email/name), per-section overrides.
6. **App IA**: Overview / Content / Customize / AI Tools top nav + resume
   switcher + persistent Download button. Sidebar: Resume / Cover Letter /
   Job Tracker.
7. Editor rich-text has full a11y labels (aria-label on every toolbar button).

### Technical reverse-engineering [observed/public]

- Marketing site: **Astro** static, FAQPage JSON-LD, title
  "Free Online Resume Builder | CV Maker (Free) | FlowCV".
- App: SPA at app.flowcv.com; template thumbnails served from
  `prod.flowcvassets.com` (asset CDN).
- **Exported PDF metadata**: `Producer: Skia/PDF m150`, `Creator: Mozilla/5.0
  (X11; Linux x86_64) … / FlowCV` → server-side **headless-Chromium
  print-to-PDF**. Real text layer (pdftotext extracts cleanly). 27 KB for a
  1-entry resume.
- Note: HonestCV generates PDFs client-side with pdf-lib — stronger privacy
  story (resume never leaves the browser), a differentiator to keep.

### Observations / cautions

- Date input: typing `03/2021` rendered as `2013` in preview during our test —
  masked-input behavior worth avoiding (unconfirmed as a bug).
- Free plan limits to ONE resume; our unlimited local copies is an advantage
  to advertise.

## 2. Novoresume [public]

- Homepage: Next.js (`_next/static`), Organization + FAQPage JSON-LD,
  title "Free Online Resume Builder | Used by 18M+ Job Seekers".
- Pricing page (embedded plan JSON, Stripe live key visible in page config):
  Premium **$21.99/1mo, $39.99/3mo ($25 off), $139.99/12mo ($123 off / 46%)**.
  Classic mid-priced subscription; monthly is Zety-tier expensive.

## 3. Enhancv [public]

- Next.js (`__NEXT_DATA__`), Organization JSON-LD, title "Best ATS-Friendly
  Online Resume Builder".
- Pricing page meta: "FREE Plan or packages **starting at $16.50**/mo;
  monthly, quarterly, and 6-month subscriptions. No credit card for trial."
  (exact tier grid client-rendered; not fully captured).

## 4. Resume Worded [public]

- Server-rendered (no Next/Astro markers), title "Free instant feedback on
  your resume and LinkedIn profile". Product = **feedback/score-first funnel**
  (upload → instant score → upsell), same shape as our /ats-checker magnet.
  /pricing returned 404 to plain fetch; pricing not verified.

## 5. Reactive Resume (open source, 40.1k stars, MIT) [public]

- Hosted at rxresu.me: "free and open-source resume builder".
- Monorepo (turbo): apps/web + apps/server. Web stack: **React + Vite +
  Tailwind (@tailwindcss/vite) + TanStack Router/Query/Form + tiptap editor +
  dnd-kit + @react-pdf/renderer + docx + better-auth + drizzle-orm/pg +
  lingui i18n + ai-sdk**.
- Validates our choices: React/Vite/Tailwind is exactly what the leading OSS
  resume product uses. Ideas to borrow: tiptap-style rich text, dnd-kit
  patterns, JSON resume schema packages, i18n readiness.

## 6. Blocked / partial [blocked]

- **Jobscan**: homepage 403 to plain fetch (bot wall). Not bypassed; only
  marketing claims known (ATS match scoring, keyword comparison).
- **Resume Genius**: 403 bot wall. Not verified.
- **Canva resumes**: 403 to plain fetch on templates listing. Not verified.

---

## Cross-competitor synthesis → HonestCV gaps (P0/P1/P2)

Recurring winners across FlowCV + prior benchmarks (Zety/Resume.io/Rezi/
Kickresume) — integrated, not copied from any single product:

| # | Gap vs. field | Seen at | Priority | ATS/privacy-safe? |
|---|---|---|---|---|
| G1 | Contextual per-section tips + action-word library (rule-based) | FlowCV | **P1** | ✓ (no AI needed) |
| G2 | Section catalog breadth (Languages, Certificates, Awards, Publications, References…) as first-class choices in an "Add section" picker | FlowCV, Reactive Resume | **P1** | ✓ |
| G3 | Import entry at the exact decision moment (start modal + add-content modal) | FlowCV | **P1** | ✓ (already have import; discoverability gap) |
| G4 | Safe customization: line-height, margins, date-position, heading capitalization | FlowCV | P2 | ✓ if constrained to ATS-safe ranges |
| G5 | Template preview modal w/ capability labels before applying | FlowCV | P2 | ✓ |
| G6 | Celebration/feedback moments (download success toast with next-step nudge) | FlowCV | P2 | ✓ |
| G7 | Job tracker surface | FlowCV Basic+, Teal | P3 (scope risk) | ✓ but big scope |
| G8 | Honest pricing comparison update: FlowCV $3–5/mo & Enhancv $16.50/mo & Novoresume $21.99/mo belong on /vs/ pages with observed dates | — | **P1** (content) | ✓ |

Advantages to keep advertising: browser-local privacy (FlowCV renders PDFs
server-side), one-time pricing vs. all-subscription field, unlimited local
copies vs. FlowCV's 1-free-resume cap, anti-fabrication AI stance.

## Tech-stack assessment (Cloudflare constraint)

Current: React 19 + Vite + Tailwind v4 + shadcn/Radix + Hono + Workers/KV +
pdf-lib/docx/pdfjs client-side.

- Reactive Resume (the strongest OSS reference) ships React + Vite + Tailwind
  — our frontend stack is current-best-practice for this domain. **No
  framework migration warranted.**
- FlowCV/Novoresume/Enhancv use Astro/Next for marketing SEO; we already get
  equivalent SEO via our static build-seo pipeline — no change needed.
- Server-side Chromium PDF (FlowCV) is not Cloudflare-Workers-friendly at low
  cost and would break the browser-local privacy promise. Keep pdf-lib.
- Worth adopting incrementally (no migration): dnd-kit patterns for reorder UX
  polish; tiptap only if rich text is ever needed (currently plain bullets are
  more ATS-safe).

**Conclusion: stack stays. Invest in product gaps G1–G3, G8 first.**

## Evidence index

- Screenshots: FlowCV home/templates/preview/add-content/editor/tips/
  customize/signup/verify gate (`~/screenshots/ss_1a264d12…ss_92f1a80c`),
  plans page `ss_92f1a80c.png`, downloaded PDF `FlowCV_Resume_2026-08-07.pdf`.
- Public HTML: `~/bench/{flowcv,enhancv,novoresume,resumeworded,rxresu}.html`,
  `novoresume-pricing.html`, `enhancv-pricing.html`.
- Reactive Resume repo: github.com/AmruthPillai/Reactive-Resume (read-only).
