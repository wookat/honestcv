# QA plan — R264 content-based template recommendations (production: cv.zalize.com)

Bundles: index-BPFzal0Z.js / Builder-UTvM2nm-.js.

Code evidence: src/lib/templates.ts:379–426 `recommendedTemplates(r)` — role =
targetRole || first non-hidden experience role; technical =
/engineer|developer|programmer|swe|devops|sre|architect/i; dense = plain-text
words ≥ 450 → compact ("fits more content on the page") + circuit if technical;
internship/entry → classic + minimal; associate/junior/mid/senior → modern
(+ engineer if technical); director/executive → executive + corporate; Auto → no
level picks; dedup, exclude r.templateId, cap 3. Builder.tsx:5755–5762 chip
`For you (N)` rendered FIRST in the filter row (only when recs non-empty);
:5810–5813 grid shows only recommended cards under 'foryou'; :5890–5896 caption
"Recommended for your resume: <Name> — <reason> · …"; :5898–5901 empty state
"No recommendations right now — set an experience level or browse all templates."

## Checks

- K0 bundles 200 + in resource entries. Local oracle .tmp-smoke/r264_oracle.ts ALL PASS (re-run).
- K1 fresh default resume (Auto, classic, sparse): no "For you" chip in the filter row.
- K2 level Entry (classic current): chip exactly "For you (1)", first in row; grid = Minimal
  card only; caption exactly "Recommended for your resume: Minimal — whitespace-first —
  keeps a shorter resume from looking empty". Switch template to Slate → chip "For you (2)",
  grid Classic + Minimal in that order.
- K3 click Classic card in For you grid → resume.templateId==='classic', recents records
  classic, chip drops to "For you (1)" and Classic leaves the grid; empty-state text
  appears only if recs empty (not here).
- K4 level Mid + targetRole "Senior Software Engineer" (template slate) → grid Modern +
  Engineer in order; change role to "Marketing Manager" → Modern only.
- K5 level Director → Executive + Corporate (order).
- K6 dense resume (≥450 words) + tech role + Senior (template slate) → "For you (3)" =
  Compact, Circuit, Modern exactly (order + cap: engineer pick dropped by cap).
- K7 Auto + dense tech → Compact + Circuit only.
- K8 regression: with chip present, All/Serif/Saved/Recent filters + Compare toggle still
  work (All shows full grid; Saved/Recent show their empty-state captions).
- K9 375×812 template panel with For you selected: scrollWidth === 375.
- K10 chip + caption rendered-pixel contrast light + dark ≥4.5:1.
- K11 zero /api/ai/* completions; cleanup localStorage to exactly
  ["honestcv.clientId","honestcv.qa"], light theme; leave .tmp-smoke/r264_oracle.ts
  as provided by lead (it was in the working tree before this round) unless it breaks lint.

## Results (production run, CDP headless Chrome 1600×900)

- K0 PASS — index-BPFzal0Z.js + Builder-UTvM2nm-.js in resource entries; local oracle
  .tmp-smoke/r264_oracle.ts re-run: ALL PASS (20 cases).
- K1 PASS — fresh sparse Auto/classic resume: filter row = [All, Serif, Modern sans,
  Banded headings, Minimal, Ruled entries, Side labels, Saved (0), Recent, Compare],
  no "For you" chip. (r264_k1_noforyou.png)
- K2 PASS — Entry: chip "For you (1)" rendered first; grid = [Minimal] only; caption
  byte-exact "Recommended for your resume: Minimal — whitespace-first — keeps a shorter
  resume from looking empty". Switch to Slate → "For you (2)", grid [Classic, Minimal],
  caption lists both with exact reasons. (r264_k2_entry_foryou1.png, r264_k2b_slate_foryou2.png)
- K3 PASS — clicked Classic card in For you grid → templateId 'classic',
  honestcv.templateRecents ["classic","slate"], chip live-updates to "For you (1)",
  grid [Minimal] (Classic excluded as current). (r264_k3_classic_applied.png)
- K4 PASS — Mid + "Senior Software Engineer" (slate current): "For you (2)"
  [Modern, Engineer] + exact caption; role → "Marketing Manager": "For you (1)" [Modern].
  (r264_k4_mid_tech.png, r264_k4b_mid_nontech.png)
- K5 PASS — Director: "For you (2)" [Executive, Corporate], exact caption. (r264_k5_director.png)
- K6 PASS — dense (3×8 long bullets, ≥450 words) + tech + Senior + slate:
  "For you (3)" = [Compact, Circuit, Modern] exactly (order + cap 3; engineer pick
  dropped by cap), caption exact 3-part. (r264_k6_dense_cap3.png)
  Note: first fixture attempt seeded bullets as a string — sanitizeResume requires
  string[] and emptied them (word count <450, only level picks shown = correct behavior).
- K7 PASS — same dense resume, level Auto: "For you (2)" [Compact, Circuit] only.
  (r264_k7_auto_dense.png)
- K7b PASS (bonus) — empty state: For you selected on sparse Entry resume, then level
  → Auto: chip disappears, grid empty, text byte-exact "No recommendations right now —
  set an experience level or browse all templates." (r264_emptystate.png)
- K8 PASS (regression) — with chip present: All = 25 cards; Serif = 10 serif templates;
  Saved (0) shows its empty caption; Recent = [Slate, Classic]; Compare toggles
  aria-pressed=true. (r264_k8_filters.png)
- K9 PASS — 375×812 with For you selected: document scrollWidth === 375. (r264_375_panel.png)
- K10 PASS — rendered-pixel contrast: light chip 17.8:1 (unselected) / 6.0:1 (selected),
  light caption 5.24:1; dark chip 15.04:1 (unselected) / 6.77:1 (selected),
  dark caption 6.41:1 — all ≥4.5. (r264_light_chip.png / r264_dark_chip.png /
  r264_dark_chip_sel.png / r264_light_caption.png / r264_dark_caption.png)
- K11 PASS — window.__aiReqs [] throughout (only baseline GET /api/ai/quota); final
  localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme.
  (r264_cleanup_final.png). .tmp-smoke/r264_oracle.ts left in place (pre-existing,
  provided by lead this round).
