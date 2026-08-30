# R30 — AI skill suggestions in the builder (Rezi "AI Skills Explorer" parity)

## Firsthand evidence (2026-08-29, logged-in Rezi audit — ~/audit-r1/shots-r30/)

Rezi editor → Skills section (`app.rezi.ai/dashboard/resume/<id>/skills`):

- Header button **AI SKILLS EXPLORER** opens a modal: "The AI Skills Explorer helps
  you discover skills through relevant suggestions" with START BY SELECTING A CATEGORY
  (select/write a category) and WHAT DID YOU DO? (Enter skill).
- Entering `React` produced an **AI SKILLS EXPLORER** chip cloud of related skills
  (Backbone.Js, Angular, Aurelia, Svelte, Web Components, Stimulus, Inferno, SolidJS,
  Alpine.Js, JQuery, Polymer, Ember.Js, Vue.Js, Knockout.Js, LitElement, …), each
  clickable, plus SAVE to write chosen skills into the skills list.
  Evidence: `r30-explorer-open2.png`, `r30-explorer-suggestions2.png`.

## Gap (P1, functional depth — editor workhorse)

RezUp's Skills section is a plain comma-separated textarea plus a **static** chip list
(`skillSuggestionsFor(targetRole)`) that covers only 8 hard-coded role families and
returns nothing for unrecognized roles. There is no AI-powered discovery: a user whose
role or stack falls outside those families gets no suggestions at all, and suggestions
never react to the skills the user already listed (Rezi's explorer does — React seeds
front-end frameworks).

## Design

### API — `POST /api/ai/skill-suggest`

Request: `{ skills?: string, role?: string, jobDescription?: string }`

- 400 if both `skills` and `role` are empty after trim (nothing to seed from) with
  message: `Add a target role or a few skills first — suggestions build on what you already have.`
- Same entitlement/quota gate as other `/api/ai/*` endpoints (free quota peek → 402;
  consume only after a successful, parseable response; parse failure → 502, no charge).
- Prompt (`buildSkillSuggestMessages`): suggest up to 12 additional resume skills
  *related to* the user's existing skills / target role / JD. These are discovery
  suggestions, not claims — the model must not repeat skills already listed and must
  return ONLY a JSON array of short skill names (1–3 words each).
- Response: `{ skills: string[], freeRemaining: number | null }`.

### UI — Builder Skills section

- New AI button `AI suggest related skills` next to the existing `AI clean up skills`
  (same `aiButton` helper: busy state, 40px mobile touch target, shared error slot).
- Requires target role or some skills; otherwise inline error, **zero AI calls**.
- On success, AI chips replace the static role-family chips, filtered against skills
  already present (case-insensitive), keeping the existing honesty framing:
  "tap only skills you actually have". Tapping appends to the comma-separated field
  (same append logic as the static chips).
- Static chips remain the default before any AI call (zero-cost baseline).

### Deliberately not copied

- Rezi's category dropdown / "what did you do?" two-step modal — our seed is the
  resume's own target role + current skills, which covers the same intent in one tap.
- Saving suggestions anywhere server-side — local-first, no new storage keys.

## Validation

- Local: `npm run lint`, `npx tsc -b`, `npm run build` all green.
- Production QA (desktop + 375px): no-seed inline error with zero network calls;
  happy path returns ≤12 relevant chips none of which duplicate existing skills;
  tapping a chip appends it; quota decrements by exactly 1; `AI clean up skills`
  regression; 375px touch targets ≥40px, no horizontal overflow; console clean;
  localStorage restored byte-for-byte.
