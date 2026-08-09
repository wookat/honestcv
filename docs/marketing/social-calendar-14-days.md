# 14-day social content calendar (Reddit / X / HN)

Copy-paste ready. Rules: post from the boss's real accounts only; follow each
subreddit's self-promo rules (most allow tool mentions in comments/weekly
threads, not link-drops); never astroturf, never fake being a user; disclose
"I built this". All numbers below are true product facts — do not embellish.

Suggested images: landing hero screenshot, ATS checker score screenshot,
AI Tailor diff screenshot, a template-gallery grid, `og2.png` as fallback.

| Day | Platform | Post |
| --- | --- | --- |
| 1 | X | Launch thread (below) |
| 2 | Reddit r/resumes | Value comment strategy (below) |
| 3 | Hacker News | Show HN (below) |
| 4 | X | ATS-myth mini-thread |
| 5 | Reddit r/jobs weekly thread | Free ATS checker mention |
| 6 | X | "AI resume writers invent metrics" evidence post |
| 7 | X | Template gallery visual post |
| 8 | Reddit r/cscareerquestions (rules permitting) | Tailoring workflow comment |
| 9 | X | Privacy angle post |
| 10 | X | Pricing-trap category breakdown |
| 11 | Reddit r/careerguidance | Guide link (employment gaps) |
| 12 | X | Health report feature post |
| 13 | X | Beta free trial reminder + ask for feedback |
| 14 | X | Recap + best guide roundup |

## D1 — X launch thread

1/ I built HonestCV because the resume-builder industry runs on a trick: a
$2 "trial" that quietly becomes ~$25/month. "zety charged me" is one of the
most-searched complaints in the category.

2/ HonestCV is the opposite, by design:
- resume lives in YOUR browser (no account, no database)
- ATS match score vs any job posting — fully free
- real text-based PDF/DOCX, no watermark
- one-time pricing ($9.99), currently free while in beta

3/ The AI is constrained to never invent your experience. Vague bullet in →
[placeholder to fill] out, not a fabricated "increased revenue 30%". We tested
big-name AI writers that happily invent metrics you'd have to defend in an
interview.

4/ Free ATS checker (no signup, nothing uploaded):
https://cv.zalize.com/ats-checker
Builder: https://cv.zalize.com — feedback very welcome, it's a beta.

## D3 — Show HN

**Title:** Show HN: HonestCV – resume builder that runs in your browser, no accounts
**Text:** I got annoyed that the big resume builders are subscription traps
($2 trial → ~$25/mo) and their AI invents metrics. HonestCV keeps your resume
in localStorage (no accounts/database), scores it against a pasted job
description locally, and the AI tailoring is constrained to never fabricate —
gaps become placeholders you fill. Real text PDF/DOCX export. One-time pricing,
free during beta. Stack: React 19 + Vite on Cloudflare Workers/KV; PDF via
pdf-lib, DOCX via docx, parsing via pdfjs. Happy to answer anything.

## D4 — ATS myths thread (X)

Most "beat the ATS" advice is folklore. What actually matters: single-column
layout, real text (not an exported PNG — one big builder's free tier does
this), standard section headings, keywords from the actual posting. We wrote
up how ATS parsing really works: https://cv.zalize.com/guides/what-is-an-ats/

## D6 — AI fabrication evidence (X)

We ran the AI rewriter of a well-known resume tool on a bullet with no
numbers. It confidently added "50+ components" and "in six months" — facts
that don't exist. If an interviewer probes those, you're done. AI should
polish your real experience, not write fiction. That's the constraint we built
into HonestCV's AI Tailor.

## D9 — Privacy (X)

Your resume is one of the most personal documents you own: name, address,
whole work history. Most builders store it in their database attached to an
account. HonestCV keeps it in your browser's localStorage — we literally have
no copy. Export/backup as JSON any time.

## D10 — Pricing breakdown (X)

What resume builders actually cost (checked first-hand, Aug 2026):
- Zety: ~$2.70 trial → ~$25.95/4 weeks
- Resume.io: $2.95 trial → $29.95/mo
- Jobscan: $29.98–49.95/mo, trial auto-converts to a quarterly charge
- Rezi: $29/mo
- HonestCV: $9.99 once (free during beta)
Receipts on our comparison pages: https://cv.zalize.com/vs/

## Reddit strategy (D2/D5/D8/D11)

Never link-drop. Answer the actual question first (formatting, gaps, ATS
fears) with substance from our guides, then one line: "I built a free
browser-local ATS checker if you want to sanity-check the parse —
cv.zalize.com/ats-checker (no signup, nothing uploaded)." Skip the link
entirely where rules forbid it.
