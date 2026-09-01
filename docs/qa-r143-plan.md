# R143 QA plan — per-field contact hide toggles

Code evidence (diff r142..r143): resume.ts adds `HideableContactField`/`HIDEABLE_CONTACT_FIELDS` (email,phone,location,website,linkedin), `Resume.hiddenContact?: HideableContactField[]`; sanitizer keeps only valid + deduped values; `visibleResume()` blanks hidden contact fields (`contact[f]=''`) so preview/exports/ATS inherit. Builder.tsx Contact card: each hideable field row gets ghost eye Button (h-6 w-6) right of the Label, `aria-pressed`, aria-label `Hide Email from resume` / `Show Email on resume` (labels literal: "Email","Phone","Location","Website (optional)","LinkedIn (optional)"); hidden row gets `opacity-60` + "HIDDEN" uppercase tag in label; Input keeps value + editable. fullName/title have no toggle.

Bundles: hard refresh, assert exactly index-Y-0BxILO.js + Builder-DpJyeeB9.js.

Prep (unrecorded): load example resume (contact fully filled: email/phone/location/linkedin; add website "qa-r143.example.com"); set honestcv.shared='1'; note preview contact line with "·" separators.

## T1 Hide phone + location (1440)
Click eye next to Phone, then Location. PASS per field: value gone from preview contact line instantly; NO dangling "·" (assert contact-line text has no "· ·" / leading/trailing separator); field row dims + "HIDDEN" tag next to label; icon → EyeOff/aria-label "Show Phone on resume"; storage `hiddenContact` = ["phone","location"]; input still shows "(555) 210-4432" and stays editable (append char while hidden → commits, contact.phone updated, still hidden).

## T2 TXT export omits hidden fields
Download TXT. PASS: file lacks phone number and "Austin, TX"; contains email + website. Delete file after.

## T3 ATS contact check recomputes
Hide Email too. PASS: ATS "Contact info complete" check flips to ✗ (or equivalent failing contact check) and score drops; preview contact line lacks email. Un-hide email → check restores ✓ and score returns.

## T4 Icons mode
Toggle preview "Icons: On". PASS: contact line shows icons only for visible fields — no phone/location icon rendered while hidden (screenshot); toggle Icons back Off.

## T5 Toggle back + reload + undo/redo
1. Show Phone → number back in preview, HIDDEN tag gone, hiddenContact=["location"].
2. Reload (F5): location still hidden (storage + dimmed row + preview), phone visible.
3. Blur; click "Show Location on resume" then Ctrl+Z → hidden again (preview drops it); Ctrl+Shift+Z → shown again.

## T6 Regression R136 inline contact edit
Click email in preview contact line, edit inline → commits to contact.email + form input syncs.

## T7 Regression R141/R142 entry-level hide
Hide Experience role 2 (HIDDEN badge, preview drops Nova Retail) and Certification 1 if present via quick add (Hidden line) → toggle both back.

## T8 375px
Emulate 375 + reload. PASS: Phone eye toggle rect fully in viewport, tap toggles hidden; scrollWidth ≤ innerWidth. Screenshot.

## T9 Console
No app errors on zalize origin.

Cleanup: kill emulation holder then clear override (desktop metrics + clear); delete TXT; restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]. No share/AI/payment.
