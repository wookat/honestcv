# Competitor Research Round 4 — Resume Worded (firsthand, 2026-08)

Evidence categories: **observed** (firsthand in a real browser session),
**claim** (public marketing/HTML copy), **inference** (technical interpretation
of public behavior), **blocked** (not safely observable).

## Flow walked (observed)

Real-account walkthrough: resumeworded.com → PDF upload → career-level select →
account signup → Score My Resume report → Magic Write demo → Targeted Resume
(JD keyword match) → sample-lines library → Pro pricing page.

### Product shape (observed)
Resume Worded is a **checker/coach, not a builder**: you upload an existing
PDF/DOCX, get scored feedback, and re-upload after editing elsewhere. Its
"ATS Templates" are Word/Google Docs downloads, not an in-app editor.

### Upload → account wall (observed)
- Homepage drag-drop upload (PDF/DOCX, 2MB max, "100% privacy" badge).
- One-question wizard: Entry/Mid/Senior career level.
- Then a hard account wall: "Create a free account to continue... Please sign
  up for free to see your results." Google or email+password.
- The signup form includes a **pre-checked** "Get a free mentorship email,
  once per week" checkbox.
- No email verification code was required — the account worked immediately.

### Score My Resume (observed)
- Report: overall score 38/100 for our test resume, with a "Potential: 92+"
  badge, a distribution bar (you vs "top resumes"), Top Fixes list and a
  Completed list (Buzzwords 10, Dates 10, Unnecessary sections 10).
- Several checks are Pro-locked with padlocks: Leadership, Communication,
  Teamwork ("This check is only for Pro users"), plus "Unlock full report".
- Guided intro modals ("Your score is based on 20+ recruiter checks…") walk
  the user in before showing the report — good progressive disclosure.
- Resume preview pane on the right highlights the exact lines each check
  flags — line-anchored feedback is its strongest interaction.
- **Accuracy caveat (observed):** the "Quantify impact" check flagged every
  experience bullet as needing "more specific numbers" although all five
  bullets already contained hard numbers (12%, 5 teams, 3.2s→1.7s, 300k,
  2 days→4 hours). The score narrative ("falls short… isn't as impactful")
  did not match the resume content.
- **Fabrication caveat (observed):** the Magic Write demo rewrote
  "Built internal design-system components adopted by 5 product teams" into
  "Architected and deployed a reusable design system with **50+ components**,
  achieving adoption by 5 distinct product teams **within six months**" —
  inventing a component count and a timeline that were never provided.
  Same failure mode we documented for Kickresume's AI.

### Targeted Resume / keyword match (observed)
- Two-step: paste JD → upload resume. Genuinely free.
- Output: relevancy score (95 for our matched test), verdict narrative
  ("Great. Your resume contains most of the important keywords…"),
  missing-keyword table with counts (Kubernetes 1, Redis 1, Testing 1),
  found-keywords tab, and a **side-by-side JD vs resume view with every
  matched keyword highlighted in both texts**.
- In-place resume editing with live re-score is Pro-locked.
- "Add Another Job Description" multi-JD comparison is Pro-gated.

### Sample lines library (observed)
- 300+ curated bullet points filterable by industry and skill; the full
  library is a Pro upsell after the first few visible samples.

### Pricing (observed on buy-pro.php)
- Pro subscription, recurring, "cancel anytime": $49/mo monthly, $33/mo
  quarterly, $19/mo yearly — all against a "$75" strikethrough anchor.
- Payments via Paddle. FAQ includes "Can I turn off auto-renew at anytime?"

### Tech notes (observed/inference)
- Server-rendered PHP pages (`.php` URLs: results-v2.php, buy-pro.php,
  loading.php) — not a SPA; classic multi-page app with jQuery-era patterns.
- Resume parsing/scoring is server-side (upload + loading.php checklist
  animation). Marketing claims "designed by top recruiters" and "AI-powered"
  (claims; scoring internals not observable).

## Adoptable ideas → HonestCV gaps
- **G16 (adopted this round): verdict narrative under the score.** A one-line
  plain-English interpretation ("Great match… / Needs work…") in the ATS
  checker so the number has meaning. Rule-based, honest thresholds.
- **G17 (candidate, P1): side-by-side keyword highlighting** — show the JD
  (and/or resume) with matched keywords highlighted. Best free interaction
  we saw this round; moderate UI work, fully local. Next batch.
- **G18 (candidate, P2): line-anchored feedback** — pin structural hints to
  the specific resume line. Our builder's per-bullet hints partially cover
  this; the checker does not.
- **/vs/resume-worded comparison page** shipped from this firsthand evidence.

## Honest assessment
Resume Worded's free Targeted Resume tool is the best free keyword checker
we've tested, and its line-anchored report design is worth learning from.
But its scoring narrative overstated problems on a well-quantified resume,
its Magic Write demo fabricated metrics, several "free score" checks are
Pro-locked, and signup pre-checks an email subscription. Our checker stays
fully free with no locked checks, runs locally, and our AI policy forbids
invented numbers. AI/paid features beyond the demo were not exercised
(blocked).
