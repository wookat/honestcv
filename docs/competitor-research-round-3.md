# Competitor Research Round 3 — Enhancv (firsthand, 2026-08)

Evidence categories: **observed** (firsthand in a real browser session),
**claim** (public marketing/HTML copy), **inference** (technical interpretation
of public behavior), **blocked** (not safely observable).

## Flow walked (observed)

Full real-account walkthrough: enhancv.com/resume-builder/ →
app.enhancv.com/onboarding → template pick → editor → signup (email +
verification code) → JD match check → PDF and TXT download → pricing page.

### Onboarding (observed)
Chat-style guided wizard, one question per screen:
1. "Do you have an existing resume to use as a starting point?" (Yes/No; Yes
   offers PDF/DOCX upload and LinkedIn import).
2. "Please tell me your position so I can recommend templates." (free text,
   skippable) — role-based template recommendation.
3. "Are you primarily concerned with impressing recruiters or passing ATS?" —
   goal framing, followed by an education screen ("modern ATS systems do read
   double column templates…").
4. Visual template gallery with named templates (Double Column, Ivy League,
   Elegant, Crest) as full-resume preview images from cdn.enhancv.com.

### Editor (observed)
- Inline WYSIWYG: every field is a `contenteditable` div directly on the
  rendered resume (name, title, contact, section headings, bullets). No
  form-panel/preview split.
- Top toolbar: AI Assistant, Fix Resume (grade badge "B-"), Check & Tailor,
  Rearrange, Templates, Design & Font, Undo/Redo, History.
- Persistent left AI Assistant panel with suggested prompts ("How would a
  recruiter review my resume?", "Help me tailor my resume", …). AI quality
  not independently verified (we did not exercise paid AI flows).
- Explicit save state "(Saved)" next to the document title.
- Account wall: saving/downloading required signup with a 6-digit email
  verification code.

### Check & Tailor / ATS match (observed)
- Paste a job description → circular score ("69% — good match but could be
  improved") → side panel with **per-keyword frequency table**: Keyword |
  In Resume (✕ when absent) | In Job Ad counts (React/TypeScript/Node.js each
  ✕ in resume, 1 in job ad on our empty resume).
- Full suggestions gated: "In order to get all suggestions, you need to
  upgrade" → View Plans.
- Job posting auto-bookmarked into a Job Tracker.

### Fix Resume (observed)
- Letter grade (B-) with "? issues to fix immediately — upgrade to unlock
  full report". Free checks: Spellcheck & Grammar, Quantified Impact,
  Wording & Readability, Recommendations. Paywalled "recruiter checks":
  Credibility, Interview Risks, Peer Benchmarking, LinkedIn Compatibility,
  Age Bias, Employment Gaps, Career Progression, Skill Evidence, Leadership
  Signals ("? to fix" until upgrade). "ATS Parse Rate / Format & Size /
  Design 100% — fixed with an Enhancv resume" (self-graded).

### Download (observed)
- Modal: file name field, "Download as PDF", "Send PDF to Your Email",
  "Download as TXT". Post-download promo: "Will it beat the ATS?" with a
  job-link paste box.
- Free PDF downloaded successfully — **carries a "Powered by Enhancv"
  branding footer** (visible in the PDF text layer). Branding-free export is
  listed as a paid feature ("Export documents with no Enhancv branding").
- PDF metadata: Producer "Enhancv (https://www.enhancv.com)", tagged PDF 1.7,
  Letter. Server-side generation (inference from metadata + account gating).

### Pricing (observed on app.enhancv.com/plans)
- Pro subscription, recurring: $39/mo monthly, $23/mo billed quarterly ($69),
  $16.50/mo billed semiannually ($99, "Best Investment"). Cancel-anytime copy.
- Marketing claims on plans page: "#1 Resume Builder in 2026", "28,452 users
  landed interviews last month", 19 ATS checks, 1,400+ guides (claims).

### Tech notes (observed/inference)
- app.enhancv.com is a separate SPA from the marketing site; reCAPTCHA on the
  app; amplitude analytics ids in URLs; template previews served from
  cdn.enhancv.com (inference: CDN-cached static previews).

## Adoptable ideas → RezUp gaps
- **G12 (adopted this round): per-keyword frequency table** in the ATS
  checker — Keyword | In resume | In job ad counts, missing first. Ours is
  browser-local, rule-based and fully free (Enhancv paywalls the full list).
- **G13 (candidate, P1): role-based template recommendation** at onboarding —
  we already collect target role for bullet starters/skills; could suggest a
  template. Deferred: our 12 templates are all single-column ATS-safe, so the
  recommendation payoff is smaller than Enhancv's (which spans 2-column).
- **G14 (candidate, P2): guided first-run wizard** (import? → role → goal).
  Our builder opens directly into the editor with import buttons; a wizard is
  a larger UX change — revisit after more competitor evidence.
- **G15 (candidate, P2): post-download continuation CTA** — we already show a
  one-time share dialog; Enhancv instead routes to its ATS scan. Could offer
  "check this resume against a job ad" post-download.
- **/vs/enhancv comparison page** shipped from this firsthand evidence.

## Honest assessment
Enhancv's onboarding and inline editor are the best interaction design we've
tested so far, and its keyword-frequency table is genuinely useful — we
adopted that pattern. Its model is the opposite of ours: account-gated,
server-side, branding on free exports, aggressive report paywalls, recurring
subscription. AI/paid features were not exercised, so their quality is
unverified (blocked).
