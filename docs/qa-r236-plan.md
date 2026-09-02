# R236 QA plan — Tone row (clarity / confidence / enthusiasm) in interview practice

Code evidence: src/lib/interviewAnalysis.ts analyzeTone (166–201): null <10 words; clarity longest sentence >40 words flagged with exact count; confidence hedge list (149–160) word-boundary gi, total ≥2 flagged listing hits in list order; enthusiasm flagged iff words ≥40 AND no ENGAGEMENT_RE match (162–163). Builder.tsx 7897–7900 tone memo (gated on analysis ≥10 words); row 8499–8524: slate <p> `Tone: ` + spans joined by ` · `, emerald-700/amber-700 (+dark-400), trailing `.`. Bundles: index-CPC7K496.js / Builder-BeIqL16o.js.

Fixtures (expectations precomputed with node against exact library code):
- BAD (50 words, 46-word run-on, i think ×2 + maybe ×1, no engagement): `I think the system maybe worked because we changed the queue and the cache and the retries and the metrics and the alerts and the dashboards and the deploys and the tests and the docs and the reviews and the backlog and the roadmap together constantly. I think it held.` → clarity amber "longest sentence runs 46 words; keep one idea per sentence" · confidence amber "hedged (“i think” ×2, “maybe” ×1); state it directly" · enthusiasm amber "flat; add a line on why it mattered to you".
- GOOD (25 words, short sentences, 0 hedges, "enjoyed"): `I led the migration project last year. We shipped it two weeks early. I enjoyed pairing with the platform team. Results improved by thirty percent.` → all three emerald: focused sentences / decisive / engaged.
- B40/B41: `word0 … word39. I enjoyed it a lot.` (40-word sentence) → clarity emerald; 41-word variant → amber "runs 41 words".
- H1/H2: 1 hedge (`I think the launch went well because we planned carefully and I enjoyed the work greatly.`) → decisive; add `and maybe` (H2) → amber "hedged (“i think” ×1, “maybe” ×1)".
- E39/E40: 39×'alphaN' words no engagement → enthusiasm engaged; 40 words → flat (also proves the guard).
- NEG boundaries: `Maybelline sponsored the thinker conference and the loveless proudly attended it. It seems the venue was packed with careful planners yesterday.` → maybelline/thinker/loveless/proudly don't count; only "It seems" ×1 hedge ⇒ confidence decisive, all emerald. Case-insensitivity of "It seems" proven positively via NEG2: `It seems the plan worked and maybe the team agreed after we reviewed everything carefully together.` → amber hedged (“maybe” ×1, “it seems” ×1) (list order: maybe before it seems).
- <10 words: `Nine words in this short answer right here now` → no analysis card/Tone row.
- Score invariance: R234 fixture (score 30/100) with Tone row present.

## H0 Bundles
index-CPC7K496.js / Builder-BeIqL16o.js live.

## H1 All-amber fixture BAD
Untimed. Pass: slate p `Tone: clarity — longest sentence runs 46 words; keep one idea per sentence · confidence — hedged (“i think” ×2, “maybe” ×1); state it directly · enthusiasm — flat; add a line on why it mattered to you.` with all 3 spans amber class. Screenshot.

## H2 All-emerald fixture GOOD
Pass: `Tone: clarity — focused sentences · confidence — decisive · enthusiasm — engaged.` all 3 spans emerald. Screenshot.

## H3 Boundaries
B40 clarity emerald / B41 amber "runs 41 words"; H1 decisive / H2 hedged; E39 engaged / E40 flat. Exact span texts+classes.

## H4 Negatives + case
NEG → all emerald (fake substrings don't count). NEG2 → confidence amber `hedged (“maybe” ×1, “it seems” ×1)` (capitalized It seems counts). Screenshot NEG2.

## H5 Guard + score invariance
9-word answer → no Tone row. R234 fixture → score 30/100 with Tone row present (and identical timed @90s).

## H6 Regression rows coexist
BAD timed @90s: Pace (round(50/1.5)=33 wpm slow) + Speaking time 75% emerald + Quick fillers row (i think ×2, maybe ×1 — by design duplicated with confidence) + Filler sounds absent (no sounds) + Tone row all in one card. Screenshot.

## H7 375px + dark
375×812 BAD: Tone row wraps, right ≤375, scrollWidth ≤375, screenshot. Dark: contrast of amber span, emerald span (GOOD fixture), and slate "Tone:" label ≥4.5:1 core-pixel. Screenshots.

## H8 Cleanup
Zero /api/ai generation calls; reload clears Date.now stub; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"]. Screenshots r236_*.png; results appended below.

## Results (executed on production)
- H0 bundles: index-CPC7K496.js + Builder-BeIqL16o.js live — PASS
- H1 BAD fixture: row byte-identical: `Tone: clarity — longest sentence runs 46 words; keep one idea per sentence · confidence — hedged (“i think” ×2, “maybe” ×1); state it directly · enthusiasm — flat; add a line on why it mattered to you.` all 3 spans amber — PASS (r236_bad_allamber.png)
- H2 GOOD fixture: `Tone: clarity — focused sentences · confidence — decisive · enthusiasm — engaged.` all emerald — PASS (r236_good_allemerald.png)
- H3 boundaries: 40-word sentence → clarity emerald; 41 → amber "runs 41 words"; 1 hedge → decisive; 2 → hedged (“i think” ×1, “maybe” ×1); 39 words no engagement → engaged; 40 → flat — all PASS
- H4 negatives: maybelline/thinker/loveless/proudly answer → all emerald ("It seems" only counted once → still decisive); NEG2 → hedged (“maybe” ×1, “it seems” ×1) amber, list order preserved, capitalized It seems counted — PASS (r236_itseems_case.png)
- H5 guard + score: 9-word answer → no Tone row (no analysis card); R234 fixture 30/100 untimed AND timed @90s with Tone row present — PASS
- H6 regression @90s (BAD): Pace 33 wpm slow + Speaking time 75% + Quick fillers (“i think” ×2 (2 at sentence start), “maybe” ×1) + Tone all coexist; Filler sounds absent (0 sounds, correct); Tone text identical timed vs untimed — PASS (r236_all_rows.png)
- H7 375×812: innerWidth/scrollWidth 375/375, Tone row wraps, right edge 337 — PASS (r236_375_rows.png). Dark core-pixel contrast: amber 10.33:1, emerald 9.18:1, slate base 6.76:1 (all ≥4.5) — PASS (r236_dark_amber_slate.png, r236_dark_emerald.png). Note: computed-style ratio vs the translucent card bg is invalid; core-pixel method used.
- H8 cleanup: zero /api/ai generation calls (only passive /api/ai/quota), Date.now stub cleared by reload, light theme, localStorage exactly ["honestcv.clientId","honestcv.qa"] — DONE
