# QA plan — R262 experience-level 8 tiers + director 2-page allowance (production: cv.zalize.com)

Bundles: index-ySebNnJH.js / Builder-YOUTDm4Z.js / Dashboard-DCDPnZPp.js.

Code evidence: src/lib/resume.ts:305–324 `EXPERIENCE_LEVELS` = [internship, entry,
associate, junior, mid, senior, director, executive] with labels Internship / Entry
level / Associate / Junior level / Mid level / Senior / Director / Executive;
:1113 `sanitizeResume` whitelists via `asEnum(raw.experienceLevel, EXPERIENCE_LEVELS)`.
src/lib/ats.ts:543 `allowed = level === 'executive' || level === 'director' ? 2 : 1`;
:558 pass hint suffix " at director/executive level" when allowed===2; :559 fail hint
"recruiters expect 1 (two only at director/executive level)". Builder.tsx:2043–2057
select `#experienceLevel` (Auto = value ''); Dashboard.tsx:1288–1293 new-resume dialog
select; Builder.tsx:1174 `scoreResume(shown, jd, pdfLength?.pages ?? null)`.

## Checks

- I0 bundles 200 + present in resource entries (index + Builder; Dashboard bundle on /dashboard).
- I1 Builder Target job select: options exactly ["Auto","Internship","Entry level","Associate","Junior level","Mid level","Senior","Director","Executive"] in order, values ['','internship',…,'executive']. Screenshot with select open/visible.
- I2 Dashboard new-resume dialog select: same 9 options/order.
- I3 Select "Director" in Builder → localStorage honestcv.resume experienceLevel==='director'; reload → select still shows Director. Inject experienceLevel:'principal' via localStorage → after reload sanitized to '' (Auto); inject 'director' → survives.
- I4 Page-count check: seed stuffed resume rendering 2 pages (verify pdfLength via the UI "Resume length" text/ats state); with Director → "Fits the recommended page count" PASSES, hint contains "within the 2-page length recruiters expect at director/executive level"; switch to Mid level → same resume check FAILS with hint containing "recruiters expect 1 (two only at director/executive level)". Trim to 1 page at Mid → passes with "within the 1-page length recruiters expect." and NO director/executive suffix.
- I5 Auto ('' value) still selectable and persists as absent/'' (regression).
- I6 375×812: Builder select visible, scrollWidth===375 (Dashboard dialog too if cheap).
- I7 Light/dark: select text rendered-pixel contrast ≥4.5:1.
- I8 zero /api/ai/* completions (baseline GET /api/ai/quota ok); cleanup localStorage to exactly ["honestcv.clientId","honestcv.qa"], light theme.

## Results (appended after production run)

## Results (production run, bundles index-ySebNnJH.js / Builder-YOUTDm4Z.js / Dashboard-DCDPnZPp.js)

- I0 all three bundles present in resource entries — passed
- I1 Builder #experienceLevel options exactly [Auto, Internship, Entry level, Associate, Junior level, Mid level, Senior, Director, Executive] with values ['','internship','entry','associate','junior','mid','senior','director','executive'] — passed
- I2 Dashboard new-resume dialog select: identical 9 options/order — passed
- I3 select Director → honestcv.resume experienceLevel==='director'; reload keeps Director. Injected 'principal' → select blanks to Auto ('') on load (sanitize); raw localStorage retains 'principal' until next save (sanitize-on-load semantics, expected). Injected 'director' survives — passed
- I4 stuffed resume (fontScale xl, loose) = 1.66 → 2 PDF pages: mid → ✗ with exact hint "Your resume runs 2 pages — recruiters expect 1 (two only at director/executive level); use Auto-fit or trim older roles and long bullets."; director → ✓ (pass; hint text not rendered for passing checks in UI — pass hint "…at director/executive level" byte-verified via tsx oracle scoreResume(level, pages=2)); 1-page resume at mid → ✓ (oracle hint "1 page — within the 1-page length recruiters expect." no suffix) — passed
- I5 Auto ('') selectable, stored empty — passed
- I6 375×812: scrollWidth===375, select fully within viewport — passed
- I7 select rendered-pixel contrast light 5.69:1 / dark 7.69:1 — passed
- I8 zero /api/ai/* completions (__aiReqs []); final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme — passed

Oracle: .tmp-smoke/r262_oracle.ts (removed after run; also verified aiTargetRole associate/director/junior + sanitize keeps director / drops 'principal'). Screenshots: /home/ubuntu/screenshots/r262_*.png.
