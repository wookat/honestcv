# R380 — Builder design/layout tools + history production audit (exploratory)

## Scope audited (first-hand, production cv.zalize.com, R379 live)

1. Template picker: All / For you / Saved / Recent filter tabs, content-based
   recommendation, favorite, recents persistence, content preservation across
   template switches (normalized `honestcv.resume` byte-identical minus `templateId`).
2. Side-by-side compare (R237): pick 2–3, dialog previews render real content,
   "Use this template" applies and clears compare state.
3. Page margins (R293/R317): UI labels/bounds, preview padding 21/32/43px, PDF
   first-text x-offset 36pt (narrow) vs 72pt (wide), DOCX `w:pgMar` 720 vs 1440 twips.
4. Photo upload + crop/reposition (R232/R341): arrow-key panning, zoom, save →
   `resume.photo` data URI, preview + PDF (DCTDecode JPEG) rendering, remove.
5. Auto-fit + Pages/Flow toggle + print path (R334/R336): honest fit messaging,
   persisted fit settings, `Page.printToPDF` page counts with no blank trailing pages.
6. Edit history scoping (R345/R346): draft checkpoints `versionId:null`, copy
   checkpoints scoped to the copy; undo/redo toolbar + Ctrl+Z/Ctrl+Y across
   template and margin changes.
7. 375px light/dark strict overflow checks (scroll containers excluded).

## Verdict

Zero P0–P2. All chains passed. Two P3 notes:

- **Fixed this round**: the live-preview photo `<img>` had `alt=""` while the
  editor thumbnail uses `alt="Profile photo"`. The photo is content, not
  decoration — screen readers should announce it consistently. One-line fix in
  `ResumePreview.tsx`.
- **Observation (not a confirmed defect)**: the "For you" template filter tab
  appeared only after React state settled in one probe with a freshly seeded
  `experienceLevel`; a deterministic failure could not be reproduced (probe
  likely raced the debounce). Banked for re-observation.

## Candidate for a future round (banked)

Once the Builder editor is bound to a saved copy there is no in-Builder path
back to an unbound draft (Copies dialog offers Open/Delete only; the dashboard
"Current draft" card mirrors the bound copy's content). Needs a design decision
(detach affordance vs clearer labeling) rather than a quick fix.

## Non-goals

No template/margin/print behavior changes — all verified working. No real AI,
share links, or payments during QA.
