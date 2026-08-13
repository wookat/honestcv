# Weekly Ops Checklist — HonestCV (cv.zalize.com)

Low-intensity maintenance mode after the 100-round iteration loop
(see `docs/iteration-log.md`). Run this checklist once per week and
append a dated log entry at the bottom.

## 1. pSEO increment

- Pick 1–2 new pages from the backlog below (or new long-tail queries
  observed in search-term data once organic traffic exists).
- Add to `scripts/build-seo.mjs` (guides: 12 sections / ~800 words;
  factual, anti-fabrication tone; trailing-slash internal links).
- `npm run build`, deploy, verify the live page with `curl`.

Backlog candidates (shipped 2026-08-08: resume-for-teens,
linkedin-vs-resume, resume-file-format, thank-you-email-after-interview):
(shipped 2026-08-08: salary-expectations-in-interviews, resume-vs-portfolio,
resume-summary-for-freshers, how-to-list-certifications; 2026-08-10:
best-resume-fonts, two-column-resume-ats)
- /guides/resume-for-part-time-jobs
- /templates/ additions if a new template ships
- /vs/ pages only with directly verified evidence (no inferred pricing)

## 2. IndexNow push

- After any content deploy: `node scripts/indexnow.mjs` — expect HTTP 200/202.
- Confirm the new URLs appear in `dist/client/sitemap.xml` with `<lastmod>`.

## 3. Data weekly report

- `node scripts/analytics.mjs` — record: CF PV/UV, first-party hits,
  top paths, referrers, email lead count.
- Caveats to preserve in any report: QA browsers are excluded via
  `localStorage['honestcv.qa']='1'`; test email addresses are not
  acquisition; do not report internal traffic as organic.
- Watch for: first non-QA referrer, first real lead, search-term data.

## 4. Security / integrity watch

- `npm audit --omit=dev` — triage highs/criticals only.
- Spot-check that /api/hit stores no PII (path + external referrer
  origin only) and leads KV holds emails only.
- Verify FREE_MODE still "true" unless payment reactivation is ordered.
- Check GitGuardian status on any open PRs.

## 5. Regression spot-check (rotate one per week)

- Golden path: sample resume → PDF download (real text layer).
- Import loop: export PDF/DOCX → upload to /ats-checker → fields parse.
- Sitemap sweep: all URLs 200.
- Mobile: builder + one guide at 360px, axe A/AA clean.

## Paused / owner-side (do not act without instruction)

- Real payments (Lemon Squeezy is the sole provider — Paddle removed; inactive until instructed).
- AI relay: live again since 2026-08-08 (api.aicdks.com, glm-5.2 via
  Worker secrets) — include one AI rewrite in the weekly spot-check.
- Social distribution accounts and backlinks.
- Email provider / double opt-in sending.

---

## Log

### 2026-08-06 (bootstrap)

- Checklist created at the close of the 100-round loop.
- Baseline: 52 sitemap URLs live; 14-day data shows no verified
  organic traffic (first-party hits all internal QA; 9 leads all
  test addresses).
