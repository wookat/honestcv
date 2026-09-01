# R186 QA plan — original panel + diff highlights + keep-original in AI variant picker (index-BDeKG_ej.js / Builder-CXQziXMA.js)

Code evidence: Builder.tsx variant Dialog (~6476): dashed `bg-muted/40 border-dashed` panel gated on `variantPick.original?.trim()`, "Keep my original" link-button (`min-h-10 sm:min-h-0`) closes via setVariantPick(null) without apply; variant card renders diffNewWords(original, cand) chunks, added → `<span class="bg-emerald-100">`. guidance.ts diffNewWords: stripInlineMarks + lowercase + edge-punctuation strip before set membership. Guided summary draft passes original=resume.summary (empty → no panel, plain cand text). Endpoints to mock via CDP Fetch: POST /api/ai/rewrite ({text,texts[3],freeRemaining}), POST /api/ai/summary-draft ({texts[3],freeRemaining}).

## K1 (1440, mocked) bullet rewrite with non-empty original
Original bullet "Led team of 8 engineers to ship billing api". Mock texts: one variant with genuinely new words, one nearly identical. Assert: dashed "Your original" panel with exact original text; "Keep my original" closes dialog and textarea unchanged; new words (e.g. Directed/deliver/platform) wrapped in bg-emerald-100, shared words not wrapped; clicking a variant applies it to the textarea and closes.

## K2 case/punctuation/markup-only variant
Candidate `**Led** team of 8 engineers, to ship "billing" API.` → zero bg-emerald-100 spans in that card.

## K3 empty-summary guided draft (R163 regression, mocked)
Clear summary → "Draft from my resume" guided dialog → mock summary-draft → variant dialog with NO "Your original" panel, no emerald spans, apply puts text into summary.

## K4 layout 1440 + 375
Dialog max-h-90vh scrolls; 375: page scrollWidth == visualViewport.width; Keep-my-original computed height ≥ 40px on mobile (min-h-10).

## Smoke (Regression)
R185 keyword-bullet preselect (+ best match suffix), R168 wavy underline on flagged line, R165 not-ready reasons visible.

## Cleanup
localStorage exactly ["honestcv.clientId","honestcv.qa"].
