# I7-I8 live test plan (cv.zalize.com, main 239d644)

Code grounding: I7 a2fff55 — AtsChecker.tsx label row now `flex flex-wrap`; Builder.tsx:914-925 shows "{freeLeft} free AI use(s) left" next to Tailor when JD pasted, freeLeft loaded and `!unlocked` (unlocked = Boolean(license), Builder.tsx:379); worker error copy now "The AI service is temporarily unavailable (NNN) — please retry in a minute. None of your free AI uses were spent." I8 239d644 — static /examples/ hub + 8 role pages via build-seo.mjs, footer "Resume examples" link in Layout.tsx. Production verified serving I8 (curl: hub h1, teacher/data-analyst 200, sitemap 86 locs, new bundle index-BXveVSVB.js). Relay still DOWN; max 1 AI attempt.

## 1. Quota hint next to Tailor (I7)
- Fresh QA client (qa=1, new clientId, no license) on /builder, load example, paste JD.
- PASS: a muted "12 free AI uses left" appears next to the "Tailor to this job" button (replacing the "Paste a job description to enable tailoring" hint). Before pasting JD the old hint shows instead.
- FAIL: no hint next to Tailor, or wrong count.

## 2. New outage error copy (I7) — 1 AI attempt
- Click Tailor → Get tailoring suggestions.
- PASS: dialog error text reads exactly "The AI service is temporarily unavailable (503) — please retry in a minute. None of your free AI uses were spent." (NNN may be 429) AND `/api/ai/quota` before == after (12).
- FAIL: old copy "returned an error … Please retry." or quota decrement.

## 3. 375px ats-checker label wrap (I7)
- Emulate 375px on /ats-checker.
- PASS: "Your resume (paste or upload)" label and "Upload PDF / DOCX" button lay out cleanly (wrap to separate rows if needed, no squeezed two-line label overlapping the button); scrollWidth ≤ 375. Compare against the I4-round screenshot /tmp/i4-375-ats.png (ragged wrap).
- FAIL: label still wraps awkwardly beside the button as before.

## 4. /examples/ (I8) desktop + 375px
- Visit /examples/ hub: h1 "Resume examples by role", 8 role links; click Software Engineer.
- Role page: example resume card (name/summary/experience/skills/education), fictional-example disclaimer paragraph, tips sections, CTA "Start my resume" → /builder loads, "More examples" related links work (click one, page 200s).
- Visit 2nd role page (teacher or data-analyst) briefly.
- Footer of SPA pages (e.g. /): "Resume examples" link → /examples/.
- 375px: /examples/ + one role page scrollWidth ≤ 375; axe A/AA on hub + one role page (desktop + 375) = 0 violations; console clean.

Budget: 1 AI attempt. No payment, never wookat@qq.com. Record with annotations.
