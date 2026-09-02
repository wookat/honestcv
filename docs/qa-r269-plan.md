# QA — R269 production re-verification of the three R268 fixes (cv.zalize.com, index-jQ5I_nHr.js / Jobs-DwIHF4yT.js)

Recording unavailable (enigo init failed, down since R166) — CDP screenshots + programmatic assertions. Zero non-quota /api/ai/* calls in every script.

## Results

### A — Landing hydration (F1/P2 fix)
- Bundles verified: HTML references index-jQ5I_nHr.js; Jobs-DwIHF4yT.js served.
- 3 theme states (no pref / light / dark) × 3 loads each: console errors [] every load — React error #418 GONE.
- html class matches saved pref on first paint (dark → class 'dark'); no flash observed across loads.
- Toggle cycle via clicks: system → light → dark → system; pref + html class + title update immediately after each click; errors [].
- 375×812 light + dark: scrollWidth 375, no errors.
- Screenshots: r269_a_dark_landing.png, r269_a_toggle_cycle.png, r269_a_light_landing.png, r269_a_375_light.png, r269_a_375_dark.png

### B — Jobs attention badge + R253/R254 regression
- Seeded stale applied entry (history 10d old): landing header shows "Jobs 1" after hydration, errors [].
- /jobs "Needs follow-up (1)" chip present; /jobs?attention=1 → Tracked tab with follow-up chip aria-pressed=true. ai [].
- Screenshots: r269_b_badge_landing.png, r269_b_followup_chip.png, r269_b_attention_deeplink.png

### C — experienceDateRange (F2/P3 fix)
- Preview: "Jan 2020 – Present" (start-only), "Mar 2016 – Dec 2019" (both), "Aug 2015" (end-only), education "2014" (no Present). Screenshot r269_c_preview_present.png.
- Downloads via UI (dl_r269/): TXT line 8 byte-exact "Senior Frontend Engineer at Acme Corp (Jan 2020 – Present)"; pdftotext and DOCX word/document.xml both contain "Jan 2020 – Present", "Mar 2016 – Dec 2019", "Aug 2015", "2014" and no "2014 – Present".
- Observation (pre-existing, out of scope): TXT/Markdown education serializer uses `${start} – ${end}` unconditionally (resume.ts:2442/2558) → end-only education renders "( – 2014)" with stray leading dash in TXT. P3 candidate for a future round.

### D — Jobs tab selection clearing (F3/P3 fix)
- Untracked job selected on All → empty Tracked tab: detail pane gone, empty state uncontradicted — PASS (r269_d3_tracked_empty.png).
- Tracked applied job selected on All → Applied tab keeps selection/detail — PASS (r269_d3_applied_keep.png).
- Same job → Offer tab (mismatch): selection cleared, empty state only — PASS (r269_d3_offer_clear.png).
- Back to All: list normal, reselect works; errors [], ai [].

### Cleanup
- localStorage exactly ["honestcv.clientId","honestcv.qa"], light/system theme (r269_cleanup_final.png).

No P0/P1/P2 found. One pre-existing P3 observation (TXT education "( – 2014)").
