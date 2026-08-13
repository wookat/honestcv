# I29–I30 live test plan (cv.zalize.com, main 03c69b0, worker 1773fa78)

Code grounding: I30 Builder.tsx — picker renders `<optgroup>` per `entry.sector` (5 sectors); examples.json entries now carry `sector` (curl: 20 entries, Counter = Tech&data 3 / Business&finance 6 / Healthcare&education 3 / Trades&transport 3 / Customer-facing&office 5). I29 build-seo.mjs TEMPLATE_GROUPS: Banded headings(5)/Serif(7)/Minimal(3)/Modern sans(7); curl confirms 4 h2s, 22 unique /templates/<slug>/ links, ItemList numberOfItems 22. Rules: qa=1, 0 AI calls, no payment, no wookat@qq.com.

## 1. I30 — grouped role picker (clean profile)
- /builder empty state → open "Or start from your role:" select.
- PASS: dropdown shows 5 bold optgroup labels (Tech & data / Business & finance / Healthcare & education / Trades & transport / Customer-facing & office) with roles nested under them, 20 role options total (DOM: 5 optgroups, 20 options + placeholder). Choose "Electrician" (under Trades & transport) → loads Miguel Herrera / Journeyman Electrician / Phoenix, AZ, preview renders, no confirm.
- FAIL: flat list (0 optgroups), wrong grouping, or role fails to load.

## 2. I29 — templates hub grouping
- /templates/ shows 4 h2 groups: Banded headings, Serif, Minimal, Modern sans with thumbnail rows (5/7/3/7).
- Script check: 22 unique /templates/<slug>/ links all 200; ItemList JSON-LD numberOfItems 22.
- Click one template link (e.g. Horizon under Banded headings) → 200 template page.

## 3. Standard checks
- 375px: /templates/ and /builder empty state (picker present) → scrollWidth ≤ 375.
- axe A/AA: 0 violations on /templates/ and /builder desktop.
- Console on visited pages: zero product errors (cloudflare beacon block known).

Budget: 0 AI calls. Record with annotations.
