# R174 QA plan — fractional resume-length meter (bundles index-C-pZskNv.js / Builder-Cp36nr-X.js)

Code evidence (diff origin/devin/1788267436-r173-letter-preview...origin/devin/1788268873-r174-resume-length-meter):
- src/lib/pdf.ts: `measureResumePdf` → { pages, length = pages-1 + fill of last page }.
- src/pages/Builder.tsx ~5457: meter row at top of preview column: `span[role=img][aria-label="Resume fills N% of the first page"]` (h-1.5 w-16 rounded) containing inner fill span with `width: N%` and class `bg-amber-500` when (pages>1 || length<0.45) else `bg-emerald-500`; adjacent `p.text-xs` text `Resume length: X.XX page(s)` + advice:
  - pages>1 → " — recruiters prefer one page; consider trimming older roles or long bullets" (text-amber-700)
  - length<0.45 → " — looks sparse; add relevant bullets or roles to fill most of the page" (text-amber-700)
  - else → " — one page is ideal for most applications" (text-muted-foreground)
- Debounced 800ms per edit (usePdfLength ~line 284). Auto-fit button sits next to it (unchanged).
- Old behavior: "PDF export: N page(s)" — any sight of that text = fail/stale bundle.

## Y1 Bundles + stacked-round smoke
Fresh loads serve exactly index-C-pZskNv.js + Builder-Cp36nr-X.js. Smoke (per SKILL selectors):
- /dashboard: R172 `Saved (0)` first chip + star buttons; R171 seeded copy with folder → collapsible section + `button[title="Move to folder"]`; R173 seeded career doc → dialog has `[role=group][aria-label="Switch between editing and preview"]`. Clean seeds after.

## Y2 Sparse state (1440, /builder)
Seed minimal resume (name+contact, 1 experience with 1 short bullet). Expect: meter row present next to Auto-fit; text matches `Resume length: 0\.\d\d page` with sparse advice EXACT " — looks sparse; add relevant bullets or roles to fill most of the page"; p has text-amber-700 color (rgb(180,83,9)); inner bar bg-amber-500, width % == aria-label N% and < 45; aria-label `Resume fills N% of the first page`. Screenshot.

## Y3 Growth + neutral state + debounce
Add bullets/roles via UI textarea (exp-<id>-bullets) to reach a solid one-pager (~0.6–0.9). Expect: after ~1s (800ms debounce) number INCREASES vs Y2 (record both values); advice flips to exact " — one page is ideal for most applications"; text muted gray; bar emerald (bg-emerald-500), width == round(length*100). Screenshot.

## Y4 Overflow to 2 pages
Add enough long bullets/roles to exceed one page. Expect: `Resume length: 1.XX pages` (plural, >1); amber trim advice exact " — recruiters prefer one page; consider trimming older roles or long bullets"; bar capped at 100% width, amber; aria-label "Resume fills 100% of the first page". Click Auto-fit → still works (busy → result message, pages back to 1 or reports can't fit). Screenshot before/after.

## Y5 Mobile 375
Reapply emulation; open /builder, switch to Preview tab. Meter row visible; `document.documentElement.scrollWidth === 375`; bar+text wrap without overflow. Screenshot.

Cleanup: remove honestcv.resume + any seeded QA keys; baseline exactly ["honestcv.clientId","honestcv.qa"] on fresh tab. No AI/share/payment/download.
