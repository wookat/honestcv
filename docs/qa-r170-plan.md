# R170 QA plan — smart contact link fields (PR #385, bundles index-s5ic4Hco.js / Builder-BfumpNpz.js)

Code evidence (commit ceb21e3):
- resume.ts normalizeContactLink(kind,value): trim; strip ^https?://, ^www., trailing /+; linkedin bare handle (no '/', '.', ' ') → linkedin.com/in/<handle>; empty → ''.
- Builder.tsx ~2030: Inputs `c-website` / `c-linkedin` get onBlur normalization; when trim non-empty an `<a>` renders (target=_blank, rel=noreferrer, aria-label "Open Website|LinkedIn in a new tab", href=`https://`+normalized, class size-10 sm:size-8). Other contact fields (email/phone/location) get no onBlur and no icon.
- Regression hooks: R143 eye toggles (aria-label "Hide/Show <label> …"), R136 contentEditable contact in preview, R169 mix row.

All input via real CDP events (click, insertText, Tab/blur). Pixels primary for icon visibility.

## Q1 Bundles + fixture
Cache-busted load → exactly index-s5ic4Hco.js + Builder-BfumpNpz.js; seed /tmp/r1371_before.json; 1440px.

## Q2 LinkedIn URL paste → cleaned on blur (primary)
Focus `c-linkedin`, clear, type `https://www.linkedin.com/in/jordan-reyes/`, blur (click elsewhere/Tab). PASS iff input value becomes exactly `linkedin.com/in/jordan-reyes` AND preview contact line shows `linkedin.com/in/jordan-reyes` (not the https://www… original). Screenshot before+after blur.

## Q3 Bare handle expansion
Clear `c-linkedin`, type `jordan-reyes`, blur. PASS iff value becomes exactly `linkedin.com/in/jordan-reyes`.

## Q4 Website normalization + free-text passthrough
`c-website`: type `https://jordanreyes.dev/`, blur → exactly `jordanreyes.dev`. Then replace with `see my portfolio`, blur → unchanged `see my portfolio` (no linkedin-style expansion, no mangling).

## Q5 External-link icon behavior
With `c-linkedin` = `linkedin.com/in/jordan-reyes`: PASS iff an `<a aria-label="Open LinkedIn in a new tab">` renders right of the input with href exactly `https://linkedin.com/in/jordan-reyes`, target=_blank, rel=noreferrer, and is VISIBLE in screenshot. Click it → a new tab opens with URL starting `https://www.linkedin.com/` (or linkedin.com; close tab after — external site may block, only assert the tab opened to the href). Clear the field → icon disappears (DOM absent + screenshot). Email/phone/location: no icon `<a>` present and typing `https://x@y.z/` in email + blur leaves value unchanged.

## Q6 Mobile 375
Edit tab Contact card with linkedin filled: `document.documentElement.scrollWidth ≤ 375`; icon size ≈40x40 (size-10 at mobile breakpoint); input+icon row inside viewport. Screenshot.

## Q7 Regressions
- R143: click the eye toggle for LinkedIn → field hidden from preview (linkedin value disappears from preview contact line); toggle back → returns. Icon row still renders while hidden state toggles.
- R136: in preview, contact fields remain inline-editable (focus website/linkedin span in preview contact line, edit, commit) — spot check the span is contentEditable and one edit round-trips.
- R169: set 2 no-digit clean bullets in Experience #1 → "Key numbers in 0 of 2 bullets" amber row renders.

Cleanup: remove honestcv.resume/resumeHistory; localStorage exactly ["honestcv.clientId","honestcv.qa"]; close extra tabs; fresh desktop tab. No AI/share/payment/download.
