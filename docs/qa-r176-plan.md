# R176 QA plan — Priority fixes panel in Score breakdown dialog (index-CmzKYqez.js / Builder-CL_Sb7w5.js)

Code evidence: `priorityFixes()` src/lib/guidance.ts:405-447 (structureWeight 30 with JD / 100 without; perCheck=weight/checks.length; keyword item points=round(70*missing/total), no anchor; health dims <80 → points=(100−score)×weight, High when points≥10 or score<50). Panel UI src/pages/Builder.tsx:8257-8303 (title `p` "Priority fixes", `li` items with High/Med chip span, "Fix →" button when anchor, `→ {entryLabel}` button `aria-label="Go to entry: …"` when entryId only; empty state emerald text "No priority fixes — every check passes and all dimensions score 80+."). Trigger: "See full score breakdown" button (Builder.tsx:6029) in Resume strength card, or sticky-nav health chip (lines 1855/1874). Recording service broken (FFmpeg dies) — CDP screenshots are evidence.

## Y1 Bundles + stacked smoke
Fresh loads serve index-CmzKYqez.js + Builder-CL_Sb7w5.js. Presence: R175 Group-into-categories button (with 10-skill fixture), R174 meter span, R173 doc toggle, R172 Saved chip, R171 Move-to-folder (seeded). Clean seeds.

## Y2 Sparse resume, no JD (1440)
Seed minimal resume (name/email only, 1 experience "was responsible for helping team" bullet, no summary/education/skills). Open dialog via "See full score breakdown".
- Panel "Priority fixes" is FIRST card in dialog body; ≤5 `li` items.
- Items sorted by points desc (High chips before Med, red bg-red-100 vs amber).
- Structure-check items formatted "{label} — {hint}" with "Fix →"; no JD ⇒ perCheck=100/checkCount ≥10 ⇒ all High.
- Click a "Fix →" (e.g. summary item) → dialog closes and viewport scrolls to the matching editor card.
Screenshot panel.

## Y3 JD keyword item
Set Target job JD text (e.g. "Kubernetes Terraform Golang microservices observability"); reopen dialog.
- Exactly one li starts "Add missing job keywords — N of M posting keywords are absent (" naming top 3 quoted keywords; NO Fix/entry button inside it.

## Y4 Entry jump
Ensure a health dim <80 whose first richFinding has entryId (weak-opener bullet in entry role "QA Engineer, TestCo").
- That li shows button "→ QA Engineer, TestCo" (aria-label "Go to entry: …"); click → dialog closes, entry card scrolled into view.

## Y5 Empty state
Fill resume to clean (good summary, quantified strong bullets, education, 5+ grouped skills, contact) and JD keywords matched or JD cleared; reopen.
- Panel shows only emerald text exactly "No priority fixes — every check passes and all dimensions score 80+."

## Y6 Mobile 375
Reopen dialog at 375: document.documentElement.scrollWidth === visualViewport.width; chips readable; "Fix →" button computed min-height 40px; tap one → dialog closes + jump. Screenshot.

Cleanup: remove honestcv.resume/honestcv.seen.health/QA keys; fresh-tab baseline exactly ["honestcv.clientId","honestcv.qa"]. No AI/share/payment/download.
