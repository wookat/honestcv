# QA R298 — SOP-10 four-dimension gap audit vs Rezi (production cv.zalize.com)

Date: R298 round. Method: exploratory walkthrough as a fresh jobseeker via CDP-driven real UI
(port 29229), Fetch armed on `*api/ai/*` all session — only quota GETs and one deliberate
interview-feedback call occurred, every one mock-fulfilled pre-network (`{"freeRemaining":42}` /
mock feedback text); **zero real AI quota used**. LocalStorage cleared for the fresh-user run and
restored to baseline at the end. Screenshots: `/home/ubuntu/screenshots/r298_*.png`. No recording
(enigo unavailable).

**Bundle disclosure:** the round brief said `index-B3yCZqsB.js`, but production served
`index-CgcrBoTJ.js` at audit time. No code delta was claimed for R298, so findings are graded
against what is actually live.

## Dimension 1 — 操作台 (operating console / new-user funnel)

Full fresh-user chain executed: landing → "Start free — no sign-up" → Builder (role preset
Software Engineer → Alex Rivera example) → JD paste → ATS score 60 with keyword/structure detail →
PDF export → Jobs search → tracked first job (`Tracked (1)` / `Saved (1)`). No hard break anywhere.

Top 3 gaps (impact order):
1. **Export interruption stack for a new user (主观, high impact).** First download triggers, in
   sequence: beta email-unlock gate → "Final check before download" dialog → post-download share
   dialog. Three modal interruptions around the single most important conversion action.
   Evidence: r298_2_export_gate.png, r298_2_downloaded.png.
2. **No step-by-step navigation / completion model (主观, vs Rezi).** Builder is one dense
   workspace; Rezi's stepper (Contact → Experience → … → Finish Up) gives clearer progress for
   first-timers. RezUp's Resume strength + Next: hints partially compensate but sit in a sidebar
   the user must notice. Evidence: r298_2_builder_first_open.png.
3. **"Career documents" nav is a dashboard anchor, not a workspace (确证事实, low-mid).** Sidebar
   link routes to `/dashboard#documents`; document creation still lives inside Builder dialogs.
   New users looking for "cover letter" land on a mostly-empty dashboard strip. Evidence:
   r298_3_dashboard_documents.png, href check `/dashboard#documents`.

## Dimension 2 — 功能深度 (feature depth)

Spot-checked: interview prep (new for this round), imports affordances, jobs tracking, career-docs
hub. (Multi-resume/versions/share/cover/resignation/PDF/DOCX depth was covered in R297/R297b and
is unchanged — not re-run.)

Top 3 gaps:
1. **No LinkedIn import (确证事实).** Builder offers only "Import resume (PDF/DOCX/text)"; no
   LinkedIn profile/URL import path anywhere in the UI. Rezi ships LinkedIn import. DOM probe of
   /builder confirms zero LinkedIn-import affordance (only the optional LinkedIn URL contact field).
2. **Instant interview questions use raw keyword templating (确证事实, P3-adjacent quality bug).**
   "Instant questions" generated: "This role emphasizes software. Describe a specific project where
   you used it…" and "This role emphasizes engineer. Describe…" — JD keywords "software"/"engineer"
   dropped into a template ungrammatically. Repro: Builder → Interview prep → Instant questions with
   a SWE JD in Target job. Evidence: r298_3_interview_instant_q.png. Graded **P3 (确证)** — output
   quality defect, not a flow break.
3. **Interview prep template brief keeps raw "[role]" placeholders when Target role is empty
   (主观/minor).** "Start from a template" renders "Interview prep — [role]" instead of falling
   back to the resume title. Evidence: r298_3_interview_template.png. Positive: the practice-answer
   coach works end-to-end — question + answer + "Get AI feedback" POSTs `/api/ai/interview-feedback`
   and renders the (mocked) coaching reply (r298_3_interview_feedback.png); empty-question case has
   proper inline validation ("Type the interview question first.").

## Dimension 3 — 落地页/首页 UI (1440 / 375, dark)

Top 3 gaps:
1. **Zero social proof on the landing page (确证事实, high for conversion).** Full-page text scan:
   no testimonials, star ratings, user counts, customer logos, or press mentions anywhere. Rezi's
   landing leads with review scores and user numbers. Evidence: r298_1_landing_1440_{top,mid,low}.png.
2. **Long single-column FAQ/comparison tail (主观).** The lower landing page is a long text-heavy
   run (FAQ, "How is RezUp different from…") with little visual rhythm at 1440; at 375 it is a very
   long scroll. Evidence: r298_4_landing_375_{top,mid,bottom}.png.
3. **Dark mode is actually consistent — no gap found (positive finding, 确证).** Dark class applies
   to landing + dashboard; body bg oklch(0.16 0.015 260); programmatic scan found zero large
   near-white sections in dark mode. r298_5_landing_dark_{top,mid}.png, r298_5_dashboard_dark_1440.png.
   No horizontal overflow: landing 375 sw=375, dashboard 375 sw=375 (strict).

## Dimension 4 — 架构/信息架构

Top 3 gaps:
1. **Builder is the single super-surface (主观).** Import, share, career docs, interview prep, ATS
   scoring, export all live in Builder dialogs; dashboard is a thin index. Rezi separates concerns
   per document type with dedicated routes.
2. **Anchor-based "sections" instead of routes (确证事实).** Career documents / Sample library are
   `#fragment` anchors on /dashboard — not linkable as first-class pages, no per-page SEO/state.
3. **Bundle drift vs stated deploy (确证事实, process).** Production served `index-CgcrBoTJ.js`
   while the coordination note said `index-B3yCZqsB.js` — deploy/communication mismatch worth
   closing in the SOP.

## Confirmed bugs (P0–P3)

- **P3 — Instant interview questions ungrammatical keyword templating** (see Dim 2 #2).
  Repro + screenshot above. No P0/P1/P2 found this round.

## Safety / cleanup

- All paused `/api/ai/*` requests fulfilled pre-network (quota GETs + one interview-feedback POST
  mocked). Zero real AI calls.
- Final localStorage: `honestcv.shared`, `honestcv.subscribed` restored from backup
  (`/home/ubuntu/qa/r298_ls_backup.json`); `honestcv.firstSeen` is re-created automatically by the
  app on page load (it was also present in the pre-audit backup — baseline matched). Theme class
  restored to empty. Evidence: r298_cleanup_final.png.

---

# R298b — re-verification of the instant-question keyword fix (prod, bundle index-C_eWTsgW.js)

Method: CDP-driven real UI on production /builder Interview prep dialog; Fetch armed `*api/ai/*`
all session (quota GETs mocked `{"freeRemaining":42}`; one deliberate interview-feedback POST
mocked pre-network). Bundle `index-C_eWTsgW.js` confirmed in resource entries. No recording (enigo
down) — screenshots `/home/ubuntu/screenshots/r298b_*.png`.

Results (all PASS):
- T1 targetRole "Software Engineer" + title-heavy SWE JD with React/TypeScript/Kubernetes →
  keyword questions: "This role emphasizes react. … where you used react and what the outcome
  was." and same for typescript. Zero emphasizes software/engineer/senior; zero "used it".
  (r298b_t1.png)
- T2 JD of only title/seniority words → zero "This role emphasizes" questions; opening/
  experience/closing questions intact. (r298b_t2.png)
- T3 empty targetRole + skill JD → fallback opener "Walk me through your background — what kind
  of role are you looking for next?"; keyword questions still react/typescript, new sentence form.
  (r298b_t3.png)
- T4 no JD → no keyword questions; baseline opener + experience + "something went wrong" set.
  (r298b_t4.png)
- T5 regression: practice answer → local instant analysis ("Practice score: 63/100 · Instant ·
  local — no AI used", STAR + tone read-out, too-short hint); "Get AI feedback" → exactly one
  paused POST `/api/ai/interview-feedback`, mock-fulfilled pre-network, mock text rendered.
  (r298b_t5_local.png, r298b_t5.png)
- T6 375×812 with dialog open and questions rendered: strict scrollWidth = 375. (r298b_t6_375.png)

Cleanup: localStorage restored (shared/subscribed kept; firstSeen auto-recreated on load, matches
pre-round backup `/home/ubuntu/qa/r298b_ls_backup.json`), empty html theme class, zero real AI.
(r298b_cleanup_final.png)

The R298 P3 (ungrammatical keyword templating) is confirmed FIXED on production.
