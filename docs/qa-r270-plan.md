# QA plan — R270: education date join fix in TXT/Markdown (production cv.zalize.com, bundle index-DjZrm45t.js)

Change: resume.ts:2443 (TXT) and :2562 (MD) education dates now `[start,end].filter(Boolean).join(' – ')` (was raw `${start} – ${end}`). Education/TXT+MD only.

Setup done: bundle confirmed served (HTML references index-DjZrm45t.js, asset 200); source verified. CDP on :29229, recording down (enigo) → screenshots.

Fixture: resume with experience [start-only "Jan 2020"/blank end] and education entries:
- E1 end-only: end "2014", blank start
- E2 start-only: start "2017", blank end
- E3 both: "2010" – "2013"
- E4 no dates

## Tests (each byte-checked in downloaded TXT; broken build would show "( – 2014)" / "(2017 – )")
1. TXT education lines:
   - E1 → `(2014)` exactly; assert absence of `( – 2014)` — FAIL if dangling dash present.
   - E2 → `(2017)` exactly; assert no `(2017 – )` and no `2017 – Present`.
   - E3 → `(2010 – 2013)`.
   - E4 → school line has no parenthetical.
2. Preview spot check: education dates render `2014`, `2017`, `2010 – 2013` (unchanged), screenshot.
3. PDF via pdftotext: same education values, no dangling dashes; no `Present` on education.
4. Regression R268: experience preview + TXT contain `Jan 2020 – Present`; TXT byte-exact `(Jan 2020 – Present)`.
5. Regression landing: saved dark pref → 2 loads, console errors [] (no #418), screenshot.
6. 375×812 dark builder with fixture loaded: scrollWidth === 375, screenshot.
7. Zero non-quota /api/ai/*; restore localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (run 2025, script /home/ubuntu/qa/r270.py, downloads /home/ubuntu/qa/dl_r270/)

- Bundle: page resource entries include index-DjZrm45t.js only — passed.
- TXT byte-exact:
  - `BSc Computer Science, University of Texas (2014)` — no `( – 2014)` — passed
  - `MSc Software Engineering, Austin College (2017)` — no trailing dash, no Present — passed
  - `Diploma, Round Rock High School (2010 – 2013)` — passed
  - `Certificate, Online Academy` — no parenthetical — passed
  - grep count of `( – ` / `– )` in file: 0 — passed
- Preview: 2014 / 2017 / 2010 – 2013 render, no dangling-dash forms (r270_preview_edu.png) — passed.
- PDF (pdftotext): 2014, 2017, 2010 – 2013, no education Present, no dangling dash lines — passed.
- Regression R268: experience `Jan 2020 – Present` in preview and TXT line 8 `(Jan 2020 – Present)` — passed.
- Regression landing dark pref: 2 loads, console errors [] (no #418) (r270_landing_dark.png) — passed.
- 375×812 dark builder: scrollWidth 375, class dark, errors [] (r270_375_dark_builder.png) — passed.
- Zero non-quota /api/ai/*; localStorage restored exactly ["honestcv.clientId","honestcv.qa"]; system theme (r270_cleanup_final.png) — passed.

- Markdown (MD download button, UI): line 17 `### BSc Computer Science, University of Texas *(2014)*`, `*(2017)*`, `*(2010 – 2013)*`, no-dates entry has no parenthetical; experience `*(Jan 2020 – Present)*`; zero dangling-dash matches — passed.

No P0–P3 findings. Recording unavailable (enigo init failed, down since R166) — CDP screenshots.
