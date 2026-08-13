# I11+I12 live test plan (cv.zalize.com, main d59f861, worker fd64e93c)

Grounding: I11 (95d95bd) adds 7 roles to scripts/build-seo.mjs (15 total); I12 (d59f861) adds "Examples" to every static-page footer and "Resume examples by role" to each guide's Keep reading list. Curl-verified: all 7 new pages 200, hub has 15 distinct /examples/ links, guide + template pages contain the new links. No AI calls this round (relay 401).

## 1. New example pages (accountant + warehouse-worker)
- Open /examples/accountant/ desktop: h1 "Accountant resume example", resume card (name/meta + Summary/Experience/Skills/Education), fictional disclaimer, 3 tips h2s, CTA "Start my resume" → /builder, related-role links → valid role pages.
- Open /examples/warehouse-worker/: same structure; click one related-role link, verify it loads (200, h1 matches role).
- 375px (CDP): accountant scrollWidth ≤ 375; axe A/AA 0 violations on accountant (desktop + 375).
- FAIL: missing sections, broken related link (404), overflow >375, axe violations.

## 2. Hub lists 15 roles
- /examples/ shows 15 role links incl. the 7 new; click one new link (e.g. Product Manager) to verify navigation.

## 3. I12 links
- On /guides/ats-friendly-resume/: footer "Examples" link visible; "Keep reading" contains "Resume examples by role" — click it → lands on /examples/ hub.
- On /templates/modern/: footer "Examples" link → /examples/.

## 4. Console
- Zero real console errors on visited pages (cloudflare beacon block = known false positive).

Budget: 0 AI calls. Record with annotations.
