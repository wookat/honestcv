# R167 QA plan — per-resume language (PR #382, bundles index-DOu2UnON.js / Builder-Pcb4JW4Q.js)

Code evidence (commit c8c5968):
- Builder.tsx ~5660: Design & layout row gains `<select id="resume-language">` labeled "Language", options English/Español/Français/Deutsch/Português (values en/es/fr/de/pt), title "Resume language — localizes default section headings and AI writer output"; onChange sets resume.language.
- resume.ts 680–697: sectionLabel returns SECTION_LABELS_I18N[lang][key] when lang≠en (es: summary→Resumen, experience→Experiencia, education→Educación, skills→Habilidades); sectionHeading prefers user's sectionHeadings override, else localized default.
- Preview + share page: ResumePreview.tsx 249/252/343 use sectionLabel/sectionHeading. Exports: resumeToPlainText/resumeToMarkdown (resume.ts 2196+), pdf.ts 517+, docx.ts 196+ all use sectionHeading.
- AI: api.ts adds language to rewrite/summary-draft/tailor/keyword-bullet/suggest-bullet/cover-letter; worker prompts.ts withOutputLanguage appends "Write your entire output in Spanish…" to the system message.

Fixture: /tmp/r1371_before.json (Jordan Reyes, Summary/Experience/Education/Skills populated). Downloads land in ~/Downloads; download gate bypass localStorage honestcv.shared='1' (removed at cleanup). pdftotext available; DOCX inspected via unzip document.xml.

## M1 Bundles
Cache-busted fresh load → exactly index-DOu2UnON.js + Builder-Pcb4JW4Q.js; baseline storage clean before seeding.

## M2 Language select + Español localization (1440) — primary
Design & layout row shows "Language" select defaulting to English. Select Español via the real select. PASS iff preview headings (scoped to the resume preview container, not template thumbnails) become exactly: Resumen, Experiencia, Educación, Habilidades (fixture has those four sections) — and English defaults (Summary/Experience/Education/Skills) are gone from the preview.
Keyboard reachability: focus the select via keyboard (Tab from the previous control or el.focus() + verify document.activeElement === #resume-language and change via keyboard arrows) — value changes without mouse.

## M3 Exports in Spanish
With Español active (gate bypass honestcv.shared='1'):
- TXT download: file contains 'EXPERIENCIA', 'EDUCACIÓN', 'HABILIDADES', 'RESUMEN'; no 'EXPERIENCE'.
- MD download: contains '## Experiencia' (heading casing per generator) etc.
- PDF download: `pdftotext` output contains 'Experiencia' and not 'Experience' as a heading.
- DOCX download: document.xml contains 'Experiencia'.

## M4 Share page in Spanish
Create a share link (random id fine; revoke afterwards). Open /s/<id> in a new tab → read-only page shows Experiencia/Educación/Habilidades/Resumen headings. Then revoke (No access) and confirm API 404 (cleanup).

## M5 Custom heading override wins; clearing restores localized default
In Spanish, inline-rename the Experience heading (R128: click heading in preview, edit) to 'Trayectoria'. PASS iff preview shows 'Trayectoria' (not Experiencia). Clear the override (empty the heading) → preview returns to 'Experiencia' (localized default, NOT 'Experience').

## M6 AI in Spanish (1 real call)
With Español active, run "Suggest a bullet" on the Software Engineer entry. PASS iff the appended bullet is written in Spanish (Spanish words/diacritics present, plausible sentence; conservative judgment). Quota badge NOT asserted (freeRemaining null for QA identity).

## M7 English regression
Switch Language back to English → preview headings revert to exactly Summary/Experience/Education/Skills; no leftover Spanish headings; select shows English. Existing resume unaffected by default (language key optional — fresh resume renders English without selecting anything).

## M8 Mobile 375
Design row with Language select visible at 375: `document.documentElement.scrollWidth ≤ 375`, select fully inside viewport and usable (change value). Screenshot.

## M9 Regression spot-checks
- R166: unshared Share dialog still shows "Custom link (optional)" + prefix; (covered in M4 creation flow if slug used — use slug qa-r167-<rand> to double as R166 check, revoke after).
- R165: with an empty resume, "AI clean up skills" disabled with its muted reason; "AI suggest related skills" enabled.

Cleanup: revoke all share links (API 404 verified), remove honestcv.resume/resumeHistory/shareLink/shared and downloaded files' state, localStorage exactly ["honestcv.clientId","honestcv.qa"], fresh desktop tab check. One AI call allowed (M6). No payment/deletion.
