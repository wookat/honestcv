# R204 P3 fix re-verify — checker structural checks carry anchors (index-Chn3zID3.js)

Code evidence: src/lib/ats.ts diff c08f23e — scoreResumeText checks now have anchor: email/phone→contact, headings/quantified/dates/enough-content/wordCount→experience, skills→skills. Labels/pass/scoring untouched.

## X1 Bundles
Entry index-Chn3zID3.js; AtsChecker-D-CMh1Cv.js; on jump, Builder-awFBhr7S.js. PASS iff exact.

## X2 Structure-fix deep links (the P3)
Weak fixture (R204: no skills section, no numbers) + JD. (a) "Skills section present" fix "Fix in builder →" → /builder, no ?jump residue, `[data-section-anchor="skills"]` in view (top within viewport) — previously top 3170 out of view. (b) Contact-anchored fix: use a fixture WITHOUT email/phone → "Email address found"/"Phone number found" fix → `[data-section-anchor="contact"]` in view. Stub window.confirm before clicks; resume+JD carried. Screenshots.

## X3 Invariance + spot-check
Example flow values identical to R203/R204 baseline: score 65, subs 61/75, fixes +27/+3.8/+3.8, six dims 100, tiers High priority (7). Keyword fix → target panel with JD in view (regression).

## X4 Cleanup
Zero non-quota /api/ai calls; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results
- X1 PASS: index-Chn3zID3.js / AtsChecker-D-CMh1Cv.js; jump loaded Builder-awFBhr7S.js.
- X2 PASS: (a) "Skills section present" fix → /builder (no ?jump residue), [data-section-anchor="skills"] top 112 in view (was 3170 out of view pre-fix), JD marker carried; (b) no-email/phone fixture → "Email address found" fix → [data-section-anchor="contact"] top 112 in view.
- X3 PASS: example baseline identical (score 65, subs 61/75, fixes +27/+3.8/+3.8, six dims 100, High priority (7)); keyword fix → target panel in view.
- X4 DONE: zero non-quota /api/ai calls; localStorage exactly ["honestcv.clientId","honestcv.qa"].
