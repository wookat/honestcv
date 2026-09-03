# QA R297 — exploratory production deep audit (cv.zalize.com)

Bundle: `index-D1l3dA7t.js` (contains R296 final-check ack dedup), verified in page resource
entries. Method: CDP 29229, real UI interactions; Fetch armed on `*api/ai/*` the entire
session — only page-load `/api/ai/quota` GETs fired and each was mock-fulfilled pre-network
with `{"freeRemaining":42}`; zero real AI calls, zero quota. `/api/share` and
`/api/jobs/search` are non-AI backends and were exercised for real. No recording (enigo
down) — CDP screenshots under `/home/ubuntu/screenshots/r297_*.png`.

## Findings

### P3 (确证) — DOCX import misplaces bullets into bogus experience entries
- Repro: Builder → "Import resume (PDF/DOCX/text)" → upload
  `/home/ubuntu/qa/r295_dl/王小明-qa-platform-engineer-resume.docx` (app's own DOCX export)
  → Import — replaces current content.
- Expected: 2 experience entries (Platform Engineer · Acme; SRE · Beta Corp), each with 2 bullets.
- Actual (`honestcv.resume`): 4 experience entries; the real Acme entry has `bullets: []`
  and its bullets became fake entries, e.g.
  `{"role":"Led migration of 40 services to Kubernetes","company":"cutting infra cost 25%."}`.
  The DOCX text-extraction step itself was fine (see `/home/ubuntu/qa/r297_docx_extracted.txt`,
  638 chars, structurally correct) — the mapping stage places bullet lines as role/company.
- Evidence: `r297_d2_docx_misparse_builder.png`, `r297_d2_docx_parsed.png`.
- Note: PDF import of the equivalent resume parsed correctly (name, 2 experiences, dates,
  bullets) — the defect is DOCX-specific. Clue: bullet lines in DOCX extraction lack the
  leading "•/-" markers the mapper appears to key on.

### P3 (确证) — /builder horizontal overflow across the whole 768–1063px width range
- Repro: viewport width 768 (or any width up to 1063) → open /builder →
  `document.documentElement.scrollWidth` = 1064 > viewport (strict assertion).
- Sweep: 700 PASS · 767 PASS (mobile layout) · 768 FAIL(1064) · 800/900/1000 FAIL(1064) ·
  1064 PASS. The md:768 breakpoint switches to a desktop layout whose fixed bottom bar /
  header toolbar require ≥1064px. iPad-portrait-class users (768–1024) get horizontal
  scroll / zoom-out on the core editor.
- Overflowing nodes: header `div.flex.items-center.gap-1` (right=1064), fixed bottom bar
  `div.bg-background/95 fixed inset-x-0 bottom-0` (w=1064).
- Evidence: `r297_f1_768_builder_overflow.png`.
- Minor cousin (主观/边缘): at 640px scrollWidth=655 (15px overflow) in the mobile layout.

### 疑似/主观 (not graded as defects)
- `/api/jobs/search?q=python` returns a broad list including unrelated titles — the UI sends
  the query correctly; backend matching looseness, needs product judgement
  (`r297_c1_search_python2.png`).
- Dashboard rename/folder changes don't bump "edited" sort order — verified intentional in
  `src/lib/resume.ts` (organizational changes keep `updatedAt`); only noting because users
  may expect a rename to float the card.

## Passing coverage (all first-hand on production UI)
- A Dashboard: 3 named versions; sort edited/created/name all correct; content edit bumps
  edited order while rename doesn't (per design); folder create/move/filter/rename/remove;
  keep-a-copy ON adds exactly 1 version, OFF adds none; Open→"Open and replace draft"
  restores version content into Builder (fields match stored data); duplicate "(copy)",
  rename, delete all correct. (r297_a*.png)
- B Share: invalid slug `-bad-` → inline validation, zero `/api/share` requests; valid custom
  slug → `cv.zalize.com/s/<slug>`, `honestcv.shareLink` stored; /s/<slug> in clean context =
  read-only snapshot + "Build your own free resume" CTA; strict scrollWidth=375 at 375;
  edit + re-publish updates snapshot at same URL; revoke → "This link is no longer
  available", key cleared. (r297_b*.png)
- C Jobs: search/facet requests fire; track → targeted copy version created; status
  saved→applied→interviewing; back-dated history (15d) → stale/follow-up filter + "Draft
  follow-up email" dialog with company-specific subject/body, Copy email → "Copied"; bulk
  select 2 → bulk status to interviewing; bulk untrack confirmation, targeted copies
  retained; inline tailoring report ("covered 2 of 30 job keywords…"). (r297_c*.png)
- D Import/ATS: PDF import high fidelity (name/dates/bullets/summary); ATS checker PDF
  upload → real rule-based report. DOCX = P3 above. (r297_d*.png)
- E Career docs: Cover letter dialog → template draft (610 chars) → edited ("Dear R297
  Hiring Manager") → letterhead (name/email/phone/location + date) → real PDF
  `/home/ubuntu/qa/r297_dl/ada-qa-globex-cover-letter.pdf` contains the edit + Globex.
  Resignation letter: company/role/last-day fields land in template; edit persisted; PDF
  `/home/ubuntu/qa/r297_dl/ada-qa-resignation-letter.pdf` contains Jordan Lee (R297)/Acme/
  October 3 + letterhead. No AI calls (template path). (r297_e*.png)
- F Responsive/dark: strict scrollWidth ≤ width at 375/768/1280 on /dashboard /jobs
  /builder — all pass except /builder 768 (P3 above); /s/<slug> 375 pass (B3). Dark mode via
  real header toggle: dark class applied on Dashboard+Jobs, h-text oklch(0.93…) on
  bg oklch(0.16…) — legible; toggle cycled back to System (empty class). (r297_f2_*.png)

## Safety & cleanup
- All paused `/api/ai/*` requests (quota GETs only) fulfilled pre-network; zero real AI.
- Final localStorage exactly `["honestcv.shared","honestcv.subscribed"]`; empty html class.
  (r297_cleanup_final.png)

---

# R297b — re-verification of the two R297 P3 fixes (bundle index-B3yCZqsB.js / Builder-DrUleA5V.js / importText-CNBPnagQ.js)

Bundles confirmed in page resource entries. Same safety rails: Fetch armed on `*api/ai/*`
all session (only quota GETs, mocked `{"freeRemaining":42}` pre-network, zero real AI);
baseline restored to `["honestcv.shared","honestcv.subscribed"]`, empty html class.
Screenshots `/home/ubuntu/screenshots/r297b_*.png`. No recording (enigo down).

## A. DOCX import fix — PASSED
Re-imported `/home/ubuntu/qa/r295_dl/王小明-qa-platform-engineer-resume.docx`:
`honestcv.resume` now has exactly 2 experiences —
Platform Engineer·Acme (Mar 2021–Present) with both bullets, SRE·Beta Corp
(Jan 2018–Feb 2021) with both bullets; zero fake entries; Projects: Deploybot description
merged to "Shipped v1 to 300 users. Open-sourced under MIT."; name 王小明 QA intact.
The R297 misparse scenario is gone. (r297b_a_docx_parsed.png, r297b_a_docx_imported.png)

## B. Bullet-marked PDF import regression — PASSED
Same fixture's PDF import unchanged: 2 experiences with correct dates and 2+2 bullets,
Deploybot project intact. (r297b_b_pdf_imported.png)

## C. /builder width sweep + header behavior — PASSED
Strict `document.documentElement.scrollWidth <= width` at
375(360) 640(625) 768(753) 800(785) 900(885) 1000(985) 1024(1009) 1063(1048) 1064(1049)
1280(1265) 1536(1521) — all pass; the R297 768–1063 overflow (was 1064) is gone.
- 768–1023: hamburger ("Menu") present, opens with full nav (Templates/Examples/ATS
  Checker/Jobs/Pricing + resources/comparisons). (r297b_c_768_hamburger_open.png)
- 1024–1279: site nav visible, undo/redo visible (title "Undo (Ctrl+Z)"), badge
  ("Free during beta") and Saved hidden.
- ≥1280: badge + Saved visible. (r297b_c_1280.png, r297b_c_1536.png)
- Downloads: <1536 the "Download your resume" toggle reveals PDF/DOCX/TXT/MD
  (r297b_c_1280_dl_dropdown.png); ≥1536 the four format buttons always visible — R291
  behavior intact.

## D. Other pages header regression — PASSED, with one new pre-existing observation
/dashboard and /jobs at 768: full site nav visible in header, scrollWidth 753 ≤ 768.
(r297b_d_768_dashboard.png)

### P3 (确证, pre-existing, NOT caused by this delta) — /ats-checker overflows at 768–~834
At 768 scrollWidth=780 (785 at 800, 819 at 834; 744→729 passes because nav hides below md).
Overflowing node: header right group with the `whitespace-nowrap` "Build my resume" CTA
link (w=143, right=780). The R297b delta didn't touch non-Builder headers — this is the
md-nav + long CTA combination on /ats-checker specifically.
Evidence: r297b_d_768_atschecker_overflow.png.

## Cleanup
Final localStorage exactly `["honestcv.shared","honestcv.subscribed"]`, empty html class,
all paused quota GETs fulfilled, zero real AI. (r297b_cleanup_final.png)

---

# R297c — re-verification of the /ats-checker + landing header CTA overflow fix

Delta: AtsChecker.tsx / Landing.tsx header CTA shows "Builder" below lg, "Build my resume"
at lg+ (same Link, two spans). Same rails: Fetch armed on `*api/ai/*` (quota GETs mocked
pre-network, zero real AI); baseline restored; no recording (enigo down).

## Width sweep — PASSED (both routes)
Strict `document.documentElement.scrollWidth <= width`, cache-busted loads:
- /ats-checker: 375(360) 744(729) 768(753) 800(785) 834(819) 900(885) 1024(1009)
  1280(1265) — all pass. The R297b strict failure at 768 (was sw=780) now reads 753;
  content width at every checked width is now viewport−15, i.e. no residual nowrap
  pressure from the CTA.
- / (landing): identical readings, all pass.

## CTA behavior — PASSED
- 768–1023 (checked 768, 800, 834, 900): visible CTA text exactly "Builder";
  clicking it at 768 navigates to /builder. (r297c_ats_768_builder_cta.png,
  r297c_ats_cta_clicked_builder.png)
- ≥1024 (checked 1024, 1280): visible CTA text "Build my resume".
  (r297c_ats_1024_full_cta.png, r297c_landing_1280.png)

## Cleanup
Final localStorage exactly `["honestcv.shared","honestcv.subscribed"]`, empty html class,
zero real AI calls. (r297c_cleanup_final.png)
