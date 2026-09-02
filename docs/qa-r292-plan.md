# QA — R292 production (cv.zalize.com, expected index-C7-PukMq.js / Dashboard-8EFSFgub.js)

Delta: Dashboard.tsx only — "Start a new resume" dialog gains a Language select
(`#new-resume-language`, options = RESUME_LANGUAGES native names English/Español/Français/
Deutsch/Português, default 'en') in the same `sm:grid-cols-2` row as Experience level
(`#new-resume-level`, Dashboard.tsx ~1313–1355). `startNewResume` (~458–470) passes
`language: newLanguage === 'en' ? undefined : newLanguage`; `closeNewDialog` (~448) resets
to 'en'. ES headings (resume.ts SECTION_LABELS_I18N): Resumen/Experiencia/Educación/
Habilidades. Keep-a-copy checkbox (~1373) saves current draft to versions before reset.

Method: CDP (port 29229, r283_lib), Fetch interception armed on *api/ai/* all session
(zero AI expected). Verify bundles in resource entries first. Screenshots r292_*.png.

## L1 Dialog anatomy (desktop 1280, light)
Dashboard → click "New resume" → dialog shows Language select: default selected option
"English"; options exactly [English, Español, Français, Deutsch, Português] (values
en/es/fr/de/pt); Experience level + Language in the same 2-col grid row (their
getBoundingClientRect tops equal ±2px, side by side). Screenshot.

## L2 Create with Español
Set Target role "Ingeniera de Datos", Language → Español, click Start/create. PASS iff:
lands on /builder; localStorage honestcv.resume JSON contains "language":"es"; preview
section headings show Resumen/Experiencia/Educación/Habilidades (scoped to resume page
container, screenshot); Builder design-panel select #resume-language value === 'es'
(displayed "Español").

## L3 English byte parity
Back to Dashboard → New resume → leave Language=English → create. PASS iff serialized
honestcv.resume raw string contains NO substring '"language"'.

## L4 Cancel resets
Open dialog, pick Español, click Cancel → reopen → select value back to 'en' ("English").

## L5 Keep-a-copy regression
With a non-empty draft (from L2), open New dialog, checkbox "Keep a copy of my current
draft in My resumes" checked (default) → create → Dashboard/My resumes gains a saved copy
(honestcv.versions length +1) containing the prior draft's data.

## L6 375px + dark mode
Dialog open at 375×812: document.documentElement.scrollWidth <= 375; the two selects STACK
(language top > level top + level height). Dark mode (html.dark): Language label + select
legible (computed color light on dark), screenshot light + dark.

## Cleanup
Remove honestcv.resume, resumeHistory, versions(+ any keys touched: assistantChat,
templateRecents, subscribed/shared if set); baseline exactly [clientId, qa]; empty html
class; zero /api/ai requests all session.

## Results (executed — bundles verified index-C7-PukMq.js / Dashboard-8EFSFgub.js)
All assertions PASSED. Zero /api/ai requests all session; baseline restored exactly
(["honestcv.clientId","honestcv.qa"], empty html class).

L1 PASS — #new-resume-language default value 'en' ("English"); options exactly
[en English, es Español, fr Français, de Deutsch, pt Português]; same 2-col row as
#new-resume-level (tops 356.5/356.5, language to the right at x806 vs level x601).
L2 PASS — created with Español + role "Ingeniera de Datos": landed /builder;
honestcv.resume contains "language":"es"; after filling name/summary/skills/bullet the
preview resume page (scoped to "María QA" container) shows Resumen / Experiencia /
Habilidades headings; design-panel #resume-language value 'es' ("Español"), visible.
(Educación heading not assertable — education section empty on a fresh resume, so it
doesn't render; ES localization proven by the other three headings.)
L3 PASS — created with default English: serialized honestcv.resume contains no
'"language"' substring (byte parity).
L4 PASS — picked Español, Cancel, reopened → select back to 'en'.
L5 PASS — keep-a-copy checkbox default checked; creating over the ES draft added
honestcv.resumeVersions entry {name:"Ingeniera de Datos", language:"es"} and the saved
copy card is visible under My resumes.
L6 PASS — 375×812: scrollWidth=375=innerWidth; the two selects stack (language below
level, right edge 334 < 375). Dark mode: label+select color oklch(0.93 0.01 260) on bg
oklch(0.16 0.015 260) (legible); screenshots light+dark.

Screenshots: /home/ubuntu/screenshots/r292_{l1_dialog,l4_reset,l2_builder_es,
l5_keepcopy,l5_myresumes,l6_375,l6_dark,cleanup_final}.png. Findings: none (no P0–P3).
