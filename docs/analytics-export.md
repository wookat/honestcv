# Analytics export — 30-day acquisition & usage funnel (no PII)

Exported 2026-08-14 (UTC), window 2026-07-15 → 2026-08-14.
Sources: Cloudflare Web Analytics (RUM), first-party `/api/hit` beacon
(KV `hit:*`, path + day + external referrer origin only), AI quota
counters (KV `quota:ai:*`, aggregate counts only), anonymous AI per-IP
gate counters (KV `rl:ai:*`, counts only), email leads (count only).
No emails, IPs, names, or resume content appear in this export.

## Funnel (page/event proxy)

| Stage | Metric | 30-day value |
|---|---|---|
| 首访（着陆） | first-party pageviews, all paths | 125 |
| 开始编辑 | `/builder` pageviews | 68 |
| 导出 | not instrumented (client-side only, no event beacon) | n/a |
| AI 使用 | successful AI calls (quota counters, lifetime) | 66 calls / 33 distinct clients |
| 回访 | not measurable — no cookies/user identity by design | n/a |
| 邮箱订阅 | leads collected (lifetime) | 18 |

## Per-day first-party pageviews

| day | hits |
|---|---|
| 2026-08-06 | 80 |
| 2026-08-07 | 10 |
| 2026-08-08 | 7 |
| 2026-08-09 | 9 |
| 2026-08-10 | 5 |
| 2026-08-13 | 10 |
| 2026-08-14 | 4 |

## Per-path first-party pageviews (30 days)

| path | hits |
|---|---|
| /builder | 68 |
| / | 35 |
| /ats-checker | 6 |
| /guides/what-is-an-ats/ | 5 |
| /templates/ | 2 |
| /guides/resume-vs-cv/ | 2 |
| other (7 pages × 1) | 7 |

External referrers recorded: none.

## AI usage detail (aggregates)

- Successful AI calls per client (lifetime distribution):
  23 clients ×1, 6 ×2, 1 ×4, 1 ×5, 1 ×10, 1 ×12 → 66 total.
- Anonymous AI requests hitting the per-IP daily gate: 2026-08-13: 30,
  2026-08-14: 4 (3 distinct IP-days). The 30 on 08-13 is this line's own
  QA smoke traffic (gate verification), not organic.

## Honest caveats

1. **Cloudflare RUM shows 0 PV/UV for the whole window** — the zone
   auto-install beacon is not producing rows for cv.zalize.com. The
   first-party beacon is currently the only pageview source.
2. **Internal traffic residue**: the 2026-08-06 spike (80 hits, mostly
   /builder) predates strict QA-flag discipline in walkthrough scripts
   and is likely internal QA, not organic. The QA flag + /qa-* exclusion
   now filter internal traffic going forward, but historical hits cannot
   be retroactively separated.
3. **导出/回访 stages are structurally unmeasurable today**: exports run
   entirely client-side with no event beacon, and the product stores no
   user identity (no cookies — deliberate privacy positioning), so
   first-visit → return-visit linkage does not exist.
4. AI quota counters are lifetime (no per-day dimension) and count
   successful calls only (failures don't consume quota).

## If round 6 needs a true retention funnel

Smallest honest instrumentation (still no PII): extend `/api/hit` with an
aggregate daily event counter (`ev:<day>:<event>` increment for
builder-start / export / ai-use / returning), where "returning" is a
client-side boolean derived from localStorage age — no identifier sent.
This yields per-day funnel counts without introducing user tracking.
