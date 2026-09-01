# R173 QA plan — career-doc letter preview (PR #389, bundles index-DHsu_MsP.js / Dashboard-BKikd2C9.js)

Code evidence (src/pages/Dashboard.tsx @5df276e):
- Career-doc dialog (open via "Open" on a Career documents card) now has `div[role=group][aria-label="Switch between editing and preview"]` with two `aria-pressed` buttons "Edit"/"Preview" (min-h-10 mobile / sm:min-h-8).
- Preview: `LetterPreview` white sheet (`bg-white`, maxHeight 55vh). Non-interview kinds: bold `c.fullName`, contact line `[email,phone,location,website].filter(Boolean).join(' · ')`, `<hr style={{borderColor: tpl.accent}}>`, date `toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})`, paragraphs split on `/\n{2,}/` with whitespace-pre-wrap. Interview kind: bold `doc.title` only (no contact/hr/date). Empty → italic "Nothing to preview yet — write something in the Edit tab."
- Letterhead = `draft ?? emptyResume()` where draft = loadResume() (honestcv.resume). Fixture uses templateId 'modern' → accent #0f766e; contact has no website → "jordan.reyes@email.com · (555) 210-4432 · Austin, TX".
- Note: the R173 branch is based on main without R171/R172 commits — runtime check whether production still has the R172 Saved chip / R171 folder support; report if regressed.

Setup (pre-recording): seed honestcv.resume with fixture; seed honestcv.careerDocs with a cover doc (2 paragraphs + one internal single newline) and an interview doc.

## X1 Bundles + baseline
Fresh /dashboard → exactly index-DHsu_MsP.js + Dashboard-BKikd2C9.js; Career documents section lists the 2 seeded docs.

## X2 Toggle + cover preview (1440)
Open cover doc → dialog opens in Edit mode (textarea, Edit aria-pressed=true, Preview=false). Click Preview → aria-pressed flips; textarea gone; white sheet shows: bold "Jordan Reyes", contact line exactly "jordan.reyes@email.com · (555) 210-4432 · Austin, TX" with · separators, an <hr> with computed border-color rgb(15,118,110), date exactly today's en-US long form, 2 paragraphs (internal single \n preserved as same paragraph via pre-wrap). Screenshot + pixel evidence of accent rule.

## X3 Keyboard accessibility
Focus Edit button, Tab → Preview button focused, press Enter/Space → preview activates (aria-pressed=true).

## X4 Live unsaved edits + empty hint
Switch to Edit, append a new paragraph "QA LIVE EDIT R173." (with blank line), switch to Preview → new paragraph visible WITHOUT saving. Then select-all-delete text in Edit, Preview → exact hint "Nothing to preview yet — write something in the Edit tab." (italic); restore text.

## X5 Interview brief preview
Open interview doc → Preview: bold doc title rendered; NO contact line, NO hr, NO date in sheet (query + screenshot).

## X6 Regressions
Save changes persists docText to honestcv.careerDocs (reload check); Copy text button works (clipboard or state); Download PDF/DOCX buttons present in the dialog footer (do NOT complete a download — no click, presence + enabled only). R172 smoke: Saved (n) chip present in sample filter group and star toggles — if absent, report as regression finding.

## X7 Mobile 375
Reapply emulation. Open cover doc dialog: toggle buttons ≥40px tall; Preview sheet renders; document.documentElement.scrollWidth === 375 with dialog open. Screenshot.

Cleanup: remove honestcv.careerDocs, honestcv.resume, any other QA keys; localStorage exactly ["honestcv.clientId","honestcv.qa"]; fresh desktop tab. No AI/share/payment/download.
