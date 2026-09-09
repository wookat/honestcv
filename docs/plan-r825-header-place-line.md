# R825 — a bare place on its own header line is the location, not the title

## Evidence (first-hand)

- Production, R824 QA (cv.zalize.com, 375 and 1280, pasted through the real Import
  dialog): `Jane Doe` / `London` / `jane@example.com | +44 20 7946 0000` stores
  `contact.title = "London"`, `contact.location = ""`. Recorded in
  `docs/handoff-context.md` (R824 boundary) and `.agents/skills/testing-rezup/SKILL.md`.
- Local probe of the current parser (`tests/_r825probe.test.ts`, removed) over eleven header
  shapes, each followed by a headed EXPERIENCE section:

  | header lines under the name            | title stored                | location stored |
  | -------------------------------------- | --------------------------- | --------------- |
  | `London` / e-mail row                  | `London`                    | `""`            |
  | `Senior Software Engineer` / `London`  | `Senior Software Engineer`  | `""` (London dropped) |
  | `London` / `Senior Software Engineer`  | `London`                    | `""` (title dropped) |
  | `United Kingdom`                       | `United Kingdom`            | `""`            |
  | `London UK`                            | `London UK`                 | `""`            |
  | `Location: London`                     | `Location: London`          | `""`            |
  | e-mail / phone / `London`              | `London`                    | `""`            |
  | `Springfield` (unknown)                | `Springfield`               | `""`            |
  | `Engineer`                             | `Engineer`                  | `""`            |
  | `Austin, TX`                           | `""`                        | `Austin, TX` (R803) |
  | `Remote`                               | `Remote`                    | `""`            |

  Root cause: the header "second line is the title" rule (R803) only exempts `City, ST` /
  `City, Country` lines (`isExpPlaceLine`, comma required). R824 added the place vocabulary
  (`src/lib/places.ts`) but only used it for a bare city *on a contact-token row*.
- Corpus frequency (`qa/r825-evidence.mts` over the 186 retained texts): 0/186 have a bare
  known place on its own header line (the one `Remote` hit is inside an experience entry).
  The corpus is dominated by our own exports (which print `City, ST`), so this says the
  shape is absent from *our* exports, not from real UK/EU CVs — the production paste above
  is the defect.

## Decision

A header line (above the first section heading, not the name line) that is nothing but a
place is the location and never the title. Recognised shapes, fail-closed on the shared
vocabulary:

- `London` / `United Kingdom` / `Bavaria` — `isKnownPlace(line)`;
- `London UK` — every word group known (`isKnownPlace(head) && isKnownPlace(lastWord)`);
- `Location: London` / `Based in London` / `Address: Austin, TX` — a location label whose
  body is a known place or a `City, ST` line stores the body; a labelled line whose body is
  not recognised is still never the title (location stays empty);
- `Remote` — the location `Remote`.

Unchanged: `Engineer`, `Springfield`, `React, TypeScript` and any unknown word keep their
R803 behaviour; `City, ST` lines keep R803; the contact-row rule (R824) is untouched; the
LinkedIn-export path is untouched. A two-word known place (`New York`, `Hong Kong`) is also
skipped by the name scan so it is never stored as the name.

Rejected: any capitalised single word under the name as location (title words such as
`Engineer` / `Designer`); geocoding / model call (offline parser); widening
`isExpPlaceLine` to comma-less lines (would turn every one-word title into a place).

Test impact: the R824 test "a bare city with no e-mail / phone / URL on its row is not taken
from that row" asserted the R803 boundary (`location === ""`) — it is rewritten to assert the
R825 rule (`location === "London"`, `title === ""`), and the contact-row rule keeps its own
negative (`Engineer` / `Springfield`).

## Verification

- `npx vitest run` (new cases in `tests/import/rules.test.ts`, each failing on the R824 tree).
- `qa/r825-replay.mts`: 186-text replay against the frozen R824 parser — every difference
  must be one of the shapes above.
- Four gates: vitest, `tsc -p tsconfig.app.json --noEmit` + `tsc -b`, `eslint .`,
  `npm run build && npm run verify-dist`.
- Deploy, SHA-compare `importText-*.js`, then production QA at 375 and 1280 through the real
  Import dialog: `London` line → Location `London`, Title empty; `Engineer` line → Title
  `Engineer`; `Location: London` → `London`; Undo restores the pre-import bytes.
