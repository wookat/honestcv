# RezUp Brand Guide

Version 1.0 — 2026-08. Owner: product. Applies to the site (cv.zalize.com), all
static SEO pages, marketing assets in `docs/marketing/`, and anything published
under the RezUp name.

## 1. Brand story & positioning

**One-liner (for job seekers):**
"RezUp is the resume builder that never traps you: build free in your
browser, check your ATS match for free, and when you pay — you pay once."

**Story.** The resume-builder category monetizes desperation. The biggest
players charge a ~$2 "trial" that silently converts into a ~$25/month
subscription; "zety charged me" is one of the most-searched complaints in the
category. Free tiers watermark exports, lock the useful report behind a
paywall, or export a PNG that ATS systems cannot read. And AI writers happily
invent metrics ("increased revenue 30%") a candidate never achieved — a lie the
candidate must then defend in an interview.

RezUp is built as the counter-example: everything runs in your browser (no
account, no resume database), the ATS score is fully free, exports are real
text-based PDF/DOCX with no watermark, AI refuses to fabricate facts, and
pricing is a visible one-time purchase — currently in a beta free trial while
payments are off.

**Positioning statement.** For active job seekers who need an ATS-safe resume
tailored to real postings, RezUp is the honest resume builder: transparent
one-time pricing, private-by-architecture, and AI that never invents your
experience — unlike subscription-trap builders (Zety, LiveCareer, Resume.io)
and fabrication-prone AI writers.

**Brand pillars** (every feature and page should serve at least one):
1. **Honest pricing** — one-time purchase, visible prices, nothing to cancel.
2. **Private by architecture** — resume lives in localStorage; no account.
3. **Truthful AI** — rewrites polish real experience; gaps get placeholders,
   never invented numbers.
4. **ATS-safe by default** — single-column real-text templates, real PDF/DOCX,
   free match scoring.

## 2. Naming & copy standards

- **Product name:** `RezUp` (formerly HonestCV) — one word, capital R and U.
  Never "Rez Up", "Rezup", "rezup" in prose (lowercase ok in URLs/code).
- **Feature names (canonical):** ATS checker (lowercase c), AI Tailor, Resume
  health report, Getting started checklist, Copies (named resume copies),
  Career Bundle, Single Resume.
- **Plans & pricing copy:** "Single Resume — $9.99 one-time" and "Career Bundle
  — $19.99 one-time". Current stage is always described as **"Beta free
  trial"** — never position the product as simply "free". Correct: "free while
  in beta", "fully included in the beta free trial". Wrong: "100% free resume
  builder", "free forever".
- **Sister products:** HonestQR, HonestPDF, SubSleuth — "more honest tools,
  same promise".

**Tone of voice.**
- Plain, direct, specific. Numbers over adjectives ("$9.99 once" not
  "affordable").
- Candid about competitors, but only first-hand, dated evidence ("We signed up
  and ran the full flow ourselves, August 2026"). No secondhand claims.
- Honest about ourselves: heuristics are labeled heuristics, an ATS score is
  "a match score", never "a hiring prediction".
- Calm, never hype. No exclamation-mark marketing, no fear-mongering
  ("your resume will be rejected!!").

**Banned words/claims:** "free forever", "100% free" (as product positioning),
"guaranteed interview/job", "beat the ATS", "#1 resume builder", any invented
statistic, any fake urgency ("only today!"), dark-pattern copy ("cancel
anytime" as a lure), superlatives we cannot evidence.

## 3. Visual identity

**Logo.** The brand mark is a rounded-square indigo document with a green
verified check (`public/favicon.svg`, `src/components/Logo.tsx`). Usage:
- Always pair with the wordmark "RezUp" in headers; mark-only is fine for
  favicons/avatars.
- Don't recolor, rotate, add effects, or place on low-contrast backgrounds.
- Minimum size 16px; keep clear space of ≥25% of the mark's width.

**Color palette** (oklch, defined in `src/index.css`):
- Primary indigo: `oklch(0.5 0.18 265)` — brand mark, CTAs, links.
- Success green: `#059669` (emerald-600) — the check, positive states, "done".
- Neutrals: Tailwind zinc scale via shadcn tokens (background/card/muted).
- Accent colors for resume templates are user-selectable and not brand colors.

**Typography.** System font stack (see `src/index.css`) — fast, native,
no webfont download. Resume templates may use embedded open-license fonts for
export fidelity; UI stays on the system stack.

**Components & spacing.** Tailwind CSS v4 + shadcn/radix-style components.
Cards use `rounded-lg border`; section paddings in multiples of 4. Motion is
restrained (Motion library), always gated behind `prefers-reduced-motion`.

**Imagery.** Original SVG illustrations in brand indigo/emerald (see
`src/components/Illustrations.tsx`); schematic template thumbnails; no stock
photos, no fake screenshots, no fabricated testimonials. OG card: `public/og2.png`
(versioned filename — bump the number when replacing, CF edge caches hard).

## 4. Boilerplate (canonical descriptions)

- **Short (≤160 chars):** "RezUp is an honest resume builder: ATS-safe
  templates, free ATS match scoring, AI that never invents your experience,
  and one-time pricing — no subscription."
- **Long:** "RezUp is a browser-local resume builder for job seekers. It
  offers 22 ATS-safe templates, a free ATS match score against any pasted job
  description, per-line AI tailoring that refuses to fabricate facts, and real
  text-based PDF/DOCX export. There are no accounts — resumes stay in the
  user's browser — and no subscriptions: plans are one-time purchases
  ($9.99 Single Resume / $19.99 Career Bundle), currently in a beta free
  trial. RezUp is a reaction to the trial-trap pricing and
  metric-inventing AI common in this category."

## 5. Consistency checklist (audit before each release batch)

- [ ] Title/meta/OG on new pages use canonical names and Beta-free-trial wording
- [ ] Footer identical promise line across SPA and static pages
- [ ] Template/feature counts in copy match reality (llms.txt, hubs, landing)
- [ ] No banned words (grep: "free forever", "beat the ATS", "guaranteed")
- [ ] OG image referenced is the current versioned filename
- [ ] Email templates sign off as "The RezUp team" with double-opt-in note
