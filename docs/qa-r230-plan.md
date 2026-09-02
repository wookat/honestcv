# R230 QA plan — assistant "Show in editor" (client-only, zero AI)

Code evidence: AssistantPanel.tsx:301-309 — ghost Button `MapPin + "Show in editor"` rendered when onLocate provided (pre- and post-apply, same actions row). Builder.tsx:6626-6648 — onLocate: innerWidth<640 → setAssistantOpen(false); summary→jumpToSection('summary'); skills→jumpToSection('skills'); bullet→same visible-entry two-way substring resolution as apply, fallback visible[0], no visible→jumpToSection('experience'); jumpToEntry (Builder.tsx:971) expands collapsed card, smooth-scrolls, ring flash ~1.6s (`ring-primary/60`, poll before click per skill). Bundles expected: index-CTqqOZRu.js / Builder-DnqjzWEl.js.

Setup: 1440px viewport, sample resume, inject turns into honestcv.assistantChat (no AI).

## V0 Bundles
index-CTqqOZRu.js / Builder-DnqjzWEl.js live.

## V1 Bullet locate pre/post-apply (1440px)
Inject bullet rewrite turn (entry 'Nova Retail', replace = Nova bullet #1 verbatim). Pass: card shows BOTH "Replace bullet" and ghost "Show in editor" (screenshot). Install ring watcher, click Show in editor → panel stays open (input still in DOM), Nova Retail entry card in viewport with ring class captured by watcher (screenshot during flash), `honestcv.resume` byte-identical before/after locate. Then click "Replace bullet" (apply regression: count 3→3, idx0 swapped) → applied card still shows "Show in editor" next to "Applied to your resume" (screenshot); click again → flash again, resume unchanged from post-apply state.

## V2 Fallback + collapsed
(a) Inject bullet turn entry 'Zzz Nonexistent Corp' → locate flashes FIRST visible entry (Brightlane).
(b) Collapse Nova Retail card (its collapse toggle), locate Nova turn → card expands (bullets textarea visible) + flash.

## V3 Summary + skills locate
Injected summary turn → "Show in editor" scrolls Summary section heading into viewport; skills turn → Skills section. Pass: section heading rect within viewport after click (screenshots).

## V4 375px
Emulate 375, reload, open panel, click bullet card "Show in editor". Pass: panel closes (chat input gone), Nova entry visible in viewport, scrollWidth 375; card with both buttons no overflow (pre-check while panel open).

## V5 Dark mode
html.dark: contrast of "Show in editor" ghost button text on its background ≥4.5:1 (pixel-measured, zoomed clip).

## V6 Cleanup
Zero /api/ai generation calls this round; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].
Screenshots r230_*.png; results appended below.

## Results (R230, executed on production, zero AI calls)
- V0 bundles: index-CTqqOZRu.js / Builder-DnqjzWEl.js live; 4 injected cards each render a ghost "Show in editor" (MapPin) button — PASS
- V1 pre-apply locate (1600px desktop): card shows both "Replace bullet" + "Show in editor"; click → panel stayed open, ring watcher captured `ring-primary/60` on "Role 2 — Junior Developer, Nova Retail", Nova company input in viewport, honestcv.resume byte-identical — PASS
- V1 apply regression: "Replace bullet" → Nova count 3→3, idx0 swapped to injected value, other bullets identical (R228 semantics) — PASS
- V1 post-apply: card shows "Applied to your resume" AND "Show in editor"; click → ring flash again, resume unchanged — PASS
- V2a fallback: entry 'Zzz Nonexistent Corp' locate → ring on first visible entry "Role 1 — Software Engineer, Brightlane" — PASS
- V2b collapsed: Nova card collapsed (inputs gone) → locate → card expanded (input back) + ring flash — PASS
- V3 summary locate → Summary heading top 129 in viewport; skills locate → Skills heading top 206 in viewport — PASS
- V4 375px: card right edge 327 ≤ 375, sw 375; locate → panel closed (chat input gone), Nova entry visible, sw 375 — PASS
- V5 dark (html.dark): button color oklch(0.68 .02 260) on oklch(0.16 .015 260); pixel text core rgb(145,153,165) on rgb(9,13,20) = 6.77:1 (first naive most-common-color sample gave a false 1.43 from anti-aliased edges — measure lightest text-core pixel) — PASS
- V6 cleanup: only /api/ai/quota (zero generation calls), light theme, localStorage exactly ["honestcv.clientId","honestcv.qa"] — DONE
Screenshots: r230_preapply_card / r230_flash_nova / r230_postapply_card / r230_fallback_flash / r230_expand_flash / r230_summary_jump / r230_skills_jump / r230_375_card / r230_375_after_locate / r230_dark_locate_btn (in /home/ubuntu/screenshots/)
Note: the original cv.zalize.com tab had been closed between rounds — reopen via `curl -X PUT "http://localhost:29229/json/new?<url>"`.
