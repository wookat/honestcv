# R142 QA plan — Hide from resume for the remaining 8 sections

Code evidence (diff r141..r142, src/pages/Builder.tsx + src/lib/resume.ts): `hidden?` added to CertificationItem/InvolvementItem/CourseworkItem/AwardItem/PublicationItem/ReferenceItem/MilitaryServiceItem/AgentItem; sanitizer keeps `hidden:true` only; `visibleResume` filters those arrays via `r.X?.filter(x=>!x.hidden)`. Cards (no header row): hidden card gets `opacity-60` + a `<p>` "Hidden — left out of the resume" (uppercase style) at top; Eye/EyeOff ghost Button in the card's button row, title "Hide from resume — kept here, left out of the resume" / "Show on resume", aria-labels `Hide|Show certification N`, `involvement N`, `coursework N`, `award N`, `publication N`, `reference N` — but military and agents are UNINDEXED: `Hide military service from resume`, `Hide agent from resume`. Military/agents rows have only Eye + Delete (no save-to-library).

Bundles: hard refresh, assert NEW index+Builder bundles (must NOT be index-BvO4doh4.js / Builder-BGy9hxjO.js); record exact names.

Prep (unrecorded): load example resume; via form UI add one entry each with unique markers:
- Certification "ZZCERT Cloud Cert" (Skills & certifications → Add certification)
- Publication "ZZPUB Paper" with kind "Journal Article" (R122 regression) 
- Involvement "ZZINV Role" @ "ZZINV Org"
- Agent "ZZAGENT Bot" (unindexed aria-label case)
Set honestcv.shared='1'. Note baseline: all four markers visible in preview.

## T1 Hide certification + publication + involvement + agent (1440)
For each: click its eye toggle. PASS per entry: marker gone from preview instantly (leaf-node scan: marker remains only in form INPUT/TEXTAREA values); card `opacity-60` + visible "HIDDEN — LEFT OUT OF THE RESUME" line (screenshot); icon → EyeOff/"Show on resume"; storage `certItems[0].hidden===true` etc. Also verify hidden cert entry stays editable (append " X" to its name → commits while hidden).

## T2 TXT export excludes hidden
Download TXT ("Download anyway" if final check). PASS: file contains NONE of ZZCERT/ZZPUB/ZZINV/ZZAGENT; still contains visible content (Brightlane). ATS-text proof piggybacks: word count line recomputes lower after hides.

## T3 Toggle back restores
Click "Show publication 1 on resume". PASS: "ZZPUB Paper (Journal Article)" back in preview (R122 kind italic intact), Hidden line gone, storage flag false.

## T4 Reload persistence
F5. PASS: cert/involvement/agent still hidden (storage flags true, cards dimmed + Hidden line), publication still visible.

## T5 Undo/redo (R140/R141 regression)
Blur; click "Show certification 1 on resume" then Ctrl+Z → hidden again (storage true, Hidden line back); Ctrl+Shift+Z → shown again.

## T6 R141 regression
Hide Experience role 2 via its header eye → gone from preview + HIDDEN badge; toggle back on.

## T7 375px
Emulate 375 + reload. PASS: cert card's eye toggle fully in viewport (rect.right ≤ 375, height ≥ 40) and tap toggles hidden; `scrollWidth ≤ innerWidth`. Screenshot of hidden card at 375.

## T8 Save-to-library on hidden entry + console
1. Click "Save publication 1 to library"-style button on the HIDDEN involvement entry (`Save involvement 1 to library`). PASS: honestcv.involvementLibrary gains 1 row, no crash.
2. Console: no app errors on zalize origin.

Cleanup: clear emulation; delete downloaded txt; remove involvementLibrary + all fixture keys; restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]. No share/AI/payment.
