# R175 QA plan — one-click skills categorization + ATS structure check (bundles index-B0DAurPY.js / Builder-BErAG_Xt.js)

Evidence: R175 branch not pushed to remote yet (disclose), but deployed bundles verified to contain "Group into categories" (Builder-BErAG_Xt.js) and "Skills grouped into categories" + bucket names Languages/Frameworks & libraries/Cloud & DevOps/Databases/Tools/Practices/Other (index-B0DAurPY.js). Skills textarea is `#skills` (Builder.tsx ~4934); tip text "Tip: recruiters scan long skill lists faster when they're grouped —" (~4943). ATS structure checks listed in the Preview & score column; each failing check has a Fix button anchored to the skills card.

## Z1 Bundles + stacked smoke
Fresh loads serve exactly index-B0DAurPY.js + Builder-BErAG_Xt.js. Smoke: R174 meter `span[role=img][aria-label^="Resume fills"]` in builder; on /dashboard R172 `Saved (0)` chip, R171 seeded copy → Move-to-folder button + folder section, R173 seeded doc → dialog toggle group. Clean seeds.

## Z2 Positive flow (1440, /builder)
Seed resume with flat skills "React, TypeScript, Python, AWS, Docker, PostgreSQL, Git, Agile, GraphQL, Redis" (10 known terms).
- Skills card shows the tip row AND outline button "Group into categories" (Sparkles icon).
- ATS structure checks list contains "Skills grouped into categories" as FAILING (with hint 'Condense long skill lists into categories (e.g. "Languages: …", "Cloud: …") so recruiters can scan them.').
- Click the button → `#skills` value becomes multi-line labelled lines `Category: a, b`; expected buckets: Languages: TypeScript, Python (± React placement per dict); Cloud & DevOps: AWS, Docker; Databases: PostgreSQL, Redis; original casing preserved; every original term present exactly once.
- Preview pane shows bold category labels.
- ATS check flips to pass (no longer in failing list).
- Tip + button disappear (labelled lines present).
- Toolbar Undo (or Ctrl+Z) → textarea back to the exact flat list; tip+button reappear.
Screenshots: before (tip+button+failing check), after (grouped textarea+preview+check pass), after undo.

## Z3 Negatives
- Set skills to 7 known terms ("React, TypeScript, Python, AWS, Docker, PostgreSQL, Git") → NO tip and NO button; ATS check passes (<8 skills).
- Set skills to 9 made-up words ("Flarnix, Quibbet, Zorple, Mibbles, Crandle, Vexput, Snorfle, Dwimble, Prasket") → tip visible but NO "Group into categories" button (categorizeSkills null, <half recognized); ATS check failing (≥8, no labels).

## Z4 Mobile 375
Preview & score tab not needed; Skills card in Edit pane: button height ≥40px; `document.documentElement.scrollWidth === 375` with tip row visible. Screenshot.

Cleanup: remove honestcv.resume + QA keys; baseline exactly ["honestcv.clientId","honestcv.qa"] on fresh tab. No AI/share/payment/download.
