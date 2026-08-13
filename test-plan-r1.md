# Review-round-1 live test plan (cv.zalize.com, main 00363ae, PR #188)

Code grounding: scripts/prerender.mjs — index.html gets `<div id="root">`+landing HTML, untouched shell saved as spa.html; src/main.tsx hydrates iff root has a child. worker/index.ts notFound → serves /spa.html for SPA routes (curl-verified: / is 65KB prerendered, /builder + /ats-checker are 4.7KB with `id="root"></div>`). AI gate (worker/index.ts): content-length>60000 → 413; rewrite text>5000 chars → 400 "That text is too long to rewrite in one go — split it up."; per-IP 30/day → 429 code rate_limited (DO NOT trigger). CORS: /api/* origin echo only for https://cv.zalize.com or localhost, else forced to https://cv.zalize.com. Rules: qa=1 before goto, ≤2 AI-gate requests total, no payment, no wookat@qq.com.

## 1. Prerendered landing + hydration (recorded)
- Fresh-profile visit of / at desktop 1440-ish: hero "The resume builder you pay for once" renders; console: no hydration errors (e.g. #418/#423 minified React errors); template-gallery filter chips work after hydration — click "Serif (9)" → gallery shows only 9 thumbnails; hero CTA "Start your free trial — no sign-up" → /builder.
- PASS: chip filter changes visible gallery count 22→9; CTA navigates. FAIL: chips dead (hydration broken), console hydration errors.
- 375px: / renders, scrollWidth ≤ 375 (objective, screenshot).

## 2. No landing flash on /builder and /ats-checker
- Direct-load /builder: initial HTML is the empty shell (objective: `document.getElementById('root')` innerHTML empty at fetch level = curl already verified; runtime: record load, confirm no landing hero appears before builder UI). Same for /ats-checker (waitForSelector on its textarea).
- PASS: builder/ATS UI appears with no landing content flash; FAIL: hero flashes or landing renders on those routes.

## 3. Golden path regression (recorded)
- Clean profile → /builder → picker → pick a role (e.g. Financial Analyst, untested example) → content + preview load → PDF download ("Download anyway" past the final-check nudge, no email gate expected since shared=1) → pdftotext shows real text with the person's name.

## 4. AI abuse gate (≤2 requests, shell)
- Request A (browser fetch same-origin or curl with x-client-id): POST /api/ai/rewrite with text of 6000 chars (body <60KB) → expect HTTP 400 `{"error":"That text is too long to rewrite in one go — split it up."}` AND /api/ai/quota freeRemaining unchanged before/after.
- Request B (UI): one Tailor attempt in builder → honest inline error ("temporarily unavailable (NNN)… None of your free AI uses were spent."), footer quota unchanged. [This also proves failed upstream calls don't consume quota under the new gate.]
- Do NOT test 413 or 429 live (budget); 413/429 code paths verified in worker source only — report as untested at runtime.

## 5. CORS whitelist (shell, no AI budget)
- `curl -s -D- -o /dev/null -X OPTIONS https://cv.zalize.com/api/ai/quota -H 'Origin: https://evil.example' -H 'Access-Control-Request-Method: GET'` → access-control-allow-origin: https://cv.zalize.com (NOT evil.example).
- Same with `Origin: https://cv.zalize.com` → echoes https://cv.zalize.com. App same-origin flows unaffected (implicit in steps 1–4).

## 6. Console
- Zero product errors on /, /builder, /ats-checker (cloudflareinsights beacon block known noise).

Budget: exactly 2 POSTs to /api/ai/* (one 400 oversized, one UI Tailor). Record steps 1–3 + UI part of 4 with annotations.
