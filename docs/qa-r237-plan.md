# R237 QA plan — "Compare templates side by side" in Design & template card

Code evidence: src/pages/Builder.tsx — state 961–963 (templateCompare/compareIds/compareOpen); Compare chip 5680–5697 (aria-pressed, toggling OFF clears compareIds 5686); button 5698–5710 (disabled <2, label "Pick 2–3 to compare" / "Compare N side by side"); thumb click 5731–5744 (compare mode: toggle in compareIds, cap 3 via ids.length>=3 no-op, does NOT set templateId; normal mode: set('templateId')+recordTemplateRecent); ring 5745–5749; numbered badge 5779–5786 (index+1, top-left); favorites star 5756–5778 with stopPropagation (5766); dialog 6752–6805: title "Compare templates side by side", grid sm:grid-cols-2/3 (6761), per column name + "· current" (6771–6773), description · tags (6775–6777), preview `ResumePreview resume={{...shown, templateId:t.id}}` zoom 0.34 (3) / 0.5 (2), h-80 sm:h-96 (6779–6786); "Use this template" 6787–6800 (secondary when current; sets templateId, recents, closes, exits compare, clears). Bundles: index-Bmh7DvOs.js / Builder-DGWNmr12.js.

Route: /builder → load example resume → "Design & template" card (template thumbs + filter chips). Fixture: set resume name to distinctive "ZZQA COMPAREFIXTURE" via the name input so dialog previews provably render the user's resume.

## K0 Bundles
index-Bmh7DvOs.js / Builder-DGWNmr12.js live.

## K1 Regression: normal click applies (Compare OFF by default)
Compare chip aria-pressed=false initially, no "Pick 2–3" button. Click a non-current thumb → localStorage resume templateId changes to that id, thumb ring moves, Recent filter contains it. Screenshot.

## K2 Compare ON: selection semantics
Toggle Compare chip → aria-pressed=true, button "Pick 2–3 to compare" disabled. Record templateId T0. Click thumbs A,B → both ringed with badges "1","2"; button enabled "Compare 2 side by side"; click C → "3" badge, label "Compare 3 side by side"; click 4th D → **no-op** (D unringed, compareIds length stays 3). Deselect B → badges renumber (C becomes 2). templateId in localStorage still T0 throughout, live preview unchanged. Screenshots (badges; cap state).

## K3 Dialog with 3 and with 2
With 3 selected → open dialog: title "Compare templates side by side", 3 columns (computed grid-template-columns 3 tracks at ≥sm), each column shows template name, "· current" ONLY on T0's column (if selected; ensure T0∈selection for this check), description · tags, preview containing fixture name "ZZQA COMPAREFIXTURE", zoom 0.34; the 3 preview columns must be pixel-different from each other (crop-hash compare). Close, deselect one → reopen: 2 columns, zoom 0.5. Screenshots both.

## K4 Use this template
Click "Use this template" on non-current column X → dialog closed, templateId=X in localStorage, live preview shows template X (visibly changed), Compare chip aria-pressed=false, no badges, compareIds cleared (re-enabling compare starts empty — verify button disabled "Pick 2–3"), X appears in Recent filter. "current" column button had variant secondary (class check) pre-click. Screenshot after apply.

## K5 Star in compare mode
Compare ON, click star on unselected thumb E → E gets favorited (Saved count +1, star amber) but E NOT added to compareIds (no badge/ring). Unstar to restore. Screenshot.

## K6 No side effects + zero AI
localStorage keys delta after full flow = none beyond honestcv.resume templateId + honestcv.templateRecents/Favorites already-existing semantics; zero /api/ai calls other than passive quota.

## K7 375×812
Compare ON with 3 selected → chips wrap, no horizontal overflow (innerWidth=scrollWidth=375). Open dialog → columns stacked (grid 1 track), no overflow. Screenshot.

## K8 Dark mode
Dialog open in dark: core-pixel contrast of column title text and preview panel body text ≥4.5:1 (semi-transparent card bg ⇒ core-pixel method). Screenshot.

## K9 Regression R236 + ATS
Interview prep: GOOD fixture → Tone row all-emerald still renders. ATS visible score identical before vs after compare open/close.

## K10 Cleanup
Restore localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, reload. Screenshots r237_*.png; results appended below.

## Results (executed on production)
- K0 bundles: index-Bmh7DvOs.js + Builder-DGWNmr12.js live — PASS
- K1 regression normal click: Compare chip aria-pressed=false default, no compare button; clicking Classic thumb set templateId=classic and Recent filter shows Classic — PASS (r237_normal_apply.png)
- K2 compare selection: chip ON → "Pick 2–3 to compare" disabled; Modern/Bold/Elegant → badges 1/2/3 + rings, "Compare 3 side by side" enabled; 4th click (Minimal) no-op (still 3); deselect Bold → renumber (Elegant→2, label "Compare 2"); templateId stayed classic throughout — PASS (r237_badges_3.png)
- K3 dialog: 3 cols (grid 3 tracks, zoom 0.34), title exact, "· current" only on Classic col, secondary Use-button on current, description·tags shown, all previews render user fixture "ZZQA COMPAREFIXTURE", columns pixel-different (2110/2157/732 of 9600 px differ) — PASS (r237_dialog_3col.png). 2 selected → 2 tracks, zoom 0.5 — PASS (r237_dialog_2col.png)
- K4 Use this template (Elegant): templateId=elegant, dialog closed, compare chip off, 0 badges, Recent = [Elegant, Classic]; reopening compare starts empty ("Pick 2–3" disabled, 0 badges) — PASS (r237_after_use.png)
- K5 star in compare mode: star on Bold → Saved (1), no badge, Bold aria-pressed=false (stopPropagation holds); unstar → Saved (0) — PASS (r237_star_compare.png)
- K6 side effects: only expected honestcv.* keys (resume/resumeHistory/templateFavorites/templateRecents) during flow; zero /api/ai generation calls — PASS
- K7 375×812: chips wrap, innerWidth/scrollWidth 375/375; dialog stacks to 1 grid track, scrollWidth 375 — PASS (r237_375_chips.png, r237_375_dialog.png)
- K8 dark: dialog column title 6.77:1; preview panel keeps light resume paper, body text 19.46:1 (core-pixel method) — PASS (r237_dark_dialog.png)
- K9 regression: ATS 99/100 identical before/after compare open+close; R236 Tone row (all-emerald GOOD fixture) intact — PASS (r237_r236_tone_smoke.png)
- K10 cleanup: localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, zero AI generation calls — DONE
