# R231 — Highlight matched JD keywords in the live preview

## First-party evidence

Rezi AI Keyword Targeting guide
(https://www.rezi.ai/rezi-docs/ai-keyword-targeting-explained, updated
2026-07-16):

- "Here's what the AI Keyword Targeting tool will show you: A list of missing
  keywords … All the keywords that you've included, marked with a green
  checkmark and **highlighted throughout your resume**."
- "Check the keyword suggestions to review missing and included keywords and
  track your progress with highlighted terms and green checkmarks."

## Gap

HonestCV's Target-job panel lists Matched keywords with green checkmark chips
(R154+) but nothing marks where those keywords actually appear in the resume.
Users can't see the placement of matched terms — Rezi highlights them
throughout the document.

## Design

New `src/lib/keywordHighlight.ts` using the CSS Custom Highlight API (no DOM
mutation, so it coexists with the contentEditable inline-preview editing of
R127–R137 and with pagination):

- `supportsKeywordHighlight()` — `typeof CSS !== 'undefined' && 'highlights' in CSS`.
- `applyKeywordHighlight(root, keywords)` — TreeWalker over text nodes,
  case-insensitive matches per text node (multi-word keywords substring,
  single-word keywords word-boundary — mirroring `keywordScore` semantics),
  builds `Range`s, registers `CSS.highlights.set('kw-match', new Highlight(...))`.
- `clearKeywordHighlight()` — deletes the registry entry.
- `::highlight(kw-match)` rule in `index.css`: amber-ish background tint +
  inherit color; separate `.dark` tone (measure rendered pixels — inverted
  token gotcha).

Builder wiring:

- Session-only `highlightKw` state; checkbox "Highlight in preview" rendered
  next to the Matched chips (only when a JD is present, matched > 0, and the
  API is supported).
- `previewRef` on the preview wrapper div; an effect re-applies highlights
  (150ms debounced) on `highlightKw`, `shown`, `ats.matched`, `previewView`
  changes; cleanup clears the registry. Toggle off / unmount / JD cleared →
  clear.

Known limits (documented, accepted): matches within a single text node only
(a keyword split across inline bold/link runs isn't painted); highlight is a
screen affordance only — exports (PDF/DOCX/TXT/MD) are untouched.

## Invariants

- Zero scoring change (`ats.ts` untouched); zero resume mutation; zero schema
  or persistence change (state is session-only).
- Inline preview editing, pagination, section jump, marks rendering unchanged.
- Unsupported browsers simply never show the toggle.
- No AI calls.

## Acceptance

1. With a JD loaded, enabling the toggle paints every occurrence of each
   matched keyword in the preview (both flow and paged views); disabling or
   clearing the JD removes all paint.
2. Editing the resume (adding/removing a keyword occurrence) updates the
   painted ranges after the debounce; inline editing still works while
   highlighted.
3. Multi-word keywords highlight as phrases; single-word keywords don't paint
   inside larger words (e.g. "java" not painted inside "javascript").
4. Dark mode: highlight visible and text ≥4.5:1 on the tint (rendered-pixel
   measurement).
5. 375px: toggle usable, no overflow.
6. Baselines: ATS scores byte-identical with the toggle on/off; localStorage
   baseline unchanged; zero AI generation calls.
