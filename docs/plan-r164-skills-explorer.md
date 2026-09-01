# R164 — Guided skill suggestions: "What did you do?" + category steering

## First-hand audit (2026-09-01, app.rezi.ai, public pages only)

- Rezi's Skills editor has an **AI Skills Explorer** dialog: "The AI Skills Explorer
  helps you discover skills through relevant suggestions".
  - **Start by selecting a category**: select with options Hard Skills / Soft Skills /
    Technical Skills / Languages / Software / Field of Interest / Other.
  - **What did you do?**: free-text input; each submitted phrase becomes a chip
    (e.g. "built React dashboards").
  - The dialog then lists ~20 clickable AI-suggested skill chips relevant to the
    phrase + category (observed: Backend Integration, State Management, Data
    Visualization, Responsive Design, …); Save writes picked skills into the field.
- RezUp today: Skills section "AI suggest related skills" fires immediately with only
  existing `skills` + `aiTargetRole` + JD; no way to steer by what the user actually
  did, and it errors out for brand-new users with no role and no skills yet.

## Gap and scope

Give the existing skill-suggest flow the same two steering inputs, as a small setup
dialog (same pattern as R163's summary draft dialog):

- Clicking "AI suggest related skills" opens an **Explore skills** dialog:
  - **What did you do?** — optional free-text input (e.g. "built React dashboards"),
    max 200 chars sent.
  - **Focus on** — optional category select: Any / Hard skills / Soft skills /
    Tools & software / Languages (own copy, not Rezi's exact list).
  - **Suggest skills** button runs the existing `runSkillSuggest` with the inputs.
- The description counts as grounding input: with a description present, users with
  empty role+skills can now get suggestions (previously a hard error).
- Result chips, insert-on-tap, dedupe against existing skills, quota, and error
  handling all unchanged.

## API / worker changes (additive, zero schema/storage)

- `aiSkillSuggest(input)` gains optional `context?: string` and `category?: string`.
- Worker `/api/ai/skill-suggest`: accept the two optional strings; trim; cap context
  at 200 chars and category at 40; allow the skills/role emptiness check to pass when
  a non-empty context is provided.
- `buildSkillSuggestMessages(skills, role, jobDescription, context?, category?)`:
  append user-message lines "The candidate describes what they did: …" and
  "Focus suggestions on {category}." only when present. System constraints unchanged
  (suggestions remain confirm-only discovery chips; no invented proficiency).

## Out of scope

- No multi-phrase chip input (single description field is enough for v1).
- No changes to the static `skillSuggestionsFor` fallback chips.
- No schema/storage changes; no scoring changes.

## QA (production, 1440 + 375)

- 1440: button opens dialog; empty dialog "Suggest skills" reproduces old behavior
  (role/skills-based chips); description "built React dashboards" + category
  Tools & software returns plausible related chips; tapping a chip appends to the
  skills textarea and the chip disappears (dedupe); new-resume state with empty
  role+skills and a description no longer errors; empty everything shows the
  existing guidance error inside the flow.
- 375: dialog fits, no horizontal overflow.
- Regression: AI clean up skills, skills library save/insert, R163 summary dialog,
  quota/error paths.
