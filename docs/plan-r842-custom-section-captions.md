# R842 — custom-section cards get visible captions and a Delete button that names its section

## Evidence (production R841 bundle `b176ef6b`, first-hand)

- `/home/ubuntu/qa/r842-evidence.cjs` at 1280 and 375, two seeded custom sections (`Volunteering`
  with two entries + one blank section), CDP `Accessibility.getFullAXTree`:
  - **zero visible captions** in the card — title Input and entries Textarea were named only by
    `aria-label="Section title"` / `aria-label="Section entries, one per line"`, i.e. the same
    text as the placeholder that vanishes once a value is typed; a filled card read `Volunteering`
    over an unnamed three-row box.
  - Delete button had only `title="Delete section"` (no subject).
  - exposed AX names duplicated across the two cards: `textbox: Section title ×2`,
    `button: Delete section ×2`, `textbox: Section entries, one per line ×2` — a screen-reader
    user hearing "Delete section" cannot tell which section goes.
  - geometry: card 571 × 148 (1280) / 294 × 152 (375); title 499 / 220 × 36; Delete 38 × 36 /
    40 × 40; textarea 545 / 268 × 78; `scrollWidth === clientWidth`; console 0; storage restored.
- This was the last card the R833 / R836 label audit listed as "deferred — title is the card head".
  Every other structured card (experience, education, involvement, military, coursework, awards,
  publications, certifications, references) has carried a `<Label htmlFor>` per field since R833–R836.

## Options simulated (`/home/ubuntu/qa/r842-simulate.cjs`, DOM surgery on production at 1280 / 1024 / 375)

1. Keep the card, only name the Delete button — still no visible caption on the entries box. Rejected.
2. Contextualise the title Input's caption (`Section 1 title`) — the title is the card head and the
   other cards repeat their static captions per entry (`Degree and major` ×N); a positional caption
   would be the only one of its kind. Rejected; the entries caption carries the context instead.
3. **Adopted**: `<Label htmlFor>` + stable id for both controls, entries caption follows the title
   (`Volunteering entries (one per line)`, blank → `Entries (one per line)`), Delete button
   `aria-label` = `Delete <title> section` (blank → `Delete custom section <n>`), title row
   `items-end` so Delete keeps its input baseline; placeholder text shortened (it no longer has to
   carry the name).
   - Simulation: card 148 → **188** at 1280 / 1024, 152 → **188** at 375 (two 14 px captions +
     6 px gaps); every control width unchanged (499 / 371 / 220, 545 / 417 / 268), Delete 38 × 36
     on the input baseline, 40 × 40 at 375 with its bottom on the input bottom; page
     `scrollWidth` unchanged at all three widths.

## Fix (`src/pages/Builder.tsx`, custom-section card only)

- `resume.customSections.map((s, idx) => …)`.
- title row `flex items-center` → `flex items-end`; Input wrapped in `div.min-w-0.flex-1.space-y-1.5`
  with `<Label htmlFor={`custom-${s.id}-title`}>Section title</Label>`, `id`, placeholder
  `e.g. Volunteering`, `aria-label` removed.
- Delete `aria-label={s.title.trim() ? `Delete ${s.title.trim()} section` : `Delete custom section ${idx + 1}`}`
  (`title` tooltip kept).
- Textarea wrapped in `div.space-y-1.5` with `<Label htmlFor={`custom-${s.id}-entries`}>` whose text
  is `${title} entries (one per line)` / `Entries (one per line)`, `id`, placeholder `e.g.\n…`,
  `aria-label` removed. State, `onChange`, `sectionOrder`, preview / exports untouched.

### Second pass — unbroken user text in a caption (found by independent QA on `25d4fc98`)

- Evidence (`/home/ubuntu/qa/r842-wrap.cjs`, production, 60 × `V` as title and as a reference name):
  the shared `Label` (`src/components/ui/label.tsx`) is a `flex` box, so a caption that interpolates an
  unbroken word cannot shrink below the word. Custom entries caption `scrollWidth 608` in a 545 / 268 px
  label (card 571 / 294), reference caption `<name>'s job title` 620 px; at 375 the page itself scrolls
  (`scrollWidth 666` vs `clientWidth 360`). So this is not custom-only: every R833 / R836 dynamic caption
  (`Your role at <org>`, `<name>'s job title`, `Where does <name> work?` …) had it — a WCAG 1.4.10
  reflow defect on the R836 references captions since they shipped, latent until a name with no spaces.
- Simulated `overflow-wrap: anywhere` on `label[data-slot="label"]` in the live DOM: custom 608 → 545 / 268
  (28 → 42 px tall at 375), reference 620 → 268, page 666 → 360 at 375; spaced captions unchanged (only
  breaks where no other opportunity exists).
- Fix: `wrap-anywhere` added to the `Label` base class (one token; `[overflow-wrap:anywhere]` on the two
  custom captions alone was rejected because the reference / involvement / experience captions share the
  defect). Tailwind emits `.wrap-anywhere{overflow-wrap:anywhere}`; every other label gets no new break
  because normal captions already have spaces.

## Tests

- `tests/entry-visible-labels.test.ts` +5 (R842 block): label / id pairs for `custom-*-title|entries`,
  dynamic entries caption, Delete name (title or position), old aria-labels gone, title row
  `items-end` + `min-w-0 flex-1` wrapper. 5 / 5 fail on the R841 tree, pass with the fix.
- +1 (second pass): `Label` base class contains `wrap-anywhere`.
- Gates (final): vitest 399 (393 → 399), `tsc -p tsconfig.app.json`, `tsc -b`, eslint 0 errors /
  1 pre-existing warning in the touched files, `npm run build`, `verify-dist` 123.

## Deploy

- New Cloudflare account creds (`CLOUDFLARE_API_KEY=$CLOUDFLARE_NEW_GLOBAL_API_KEY`,
  `CLOUDFLARE_EMAIL=$CLOUDFLARE_NEW_ACCOUNT_EMAIL`, token / account-id vars unset), version
  `25d4fc98`; production `index-B_Al3DXF.js` `3e2f1efc…` / `Builder-DB-AwrCP.js` `e7cbd7dc…` /
  `style-BGQuqabg.css` `c2410b6a…` (CSS unchanged) SHA-identical to `dist/client/assets`; health ok.
- Native re-run of `r842-evidence.cjs` (no DOM surgery) at 1280 / 375: card 188 as simulated, control
  widths unchanged, visible labels `Section title` / `Volunteering entries (one per line)` /
  `Entries (one per line)`, Delete names `Delete Volunteering section` / `Delete custom section 2`,
  `aria-label` gone from both text controls, only remaining duplicate AX name is
  `textbox: Section title ×2` (by design — same as every other repeated entry caption), no overflow,
  console 0, storage restored byte for byte.
- Second deploy `9cf9faf1`: production `index-cqwmZt-j.js` `3b858301…` / `Builder-BcySc0SJ.js`
  `2110e829…` / `style-6ruFrS9o.css` `2984d08c…` SHA-identical to `dist/client/assets`; health ok.
  Native `r842-wrap.cjs` (no DOM surgery) at 1280 / 375: custom caption 545 / 268 = its box, reference
  caption 268 / 268, page 1265 / 1265 and 360 / 360, cards 571 / 294 unchanged, storage restored byte for
  byte. `r842-evidence.cjs` re-run: captions / ids / Delete names as above, console 0.

## Not changed / honest limits

- `Section title` caption is intentionally static across cards (the value is the disambiguator, as for
  every other entry card); the entries caption and Delete name carry the section context.
- Preview, PDF / DOCX / TXT / MD, ATS, section ordering and the `custom:<id>` jump target untouched.
- Real screen-reader software and physical devices not covered (CDP AX tree only).
- `Entries (one per line)` repeats across several *untitled* custom sections by design (each is tied to
  its own card and `custom-<id>-entries` id); the fallback exists only until a title is typed.
- Independent QA's full-Builder axe (WCAG 2.2 tags) at 1280 reports one pre-existing `target-size`
  violation: the two `3 suggestions` entry-audit chips (29.9 × 17.3 px) — R817 gave them 40 px only
  below `sm`. Out of R842's scope; queued as its own round. Custom-section-scoped axe: 0.
- `resumeStrength` vs `resumeHealth` wording and LinkedIn non-English export were the other R842
  candidates; no fresh production evidence of user-facing harm was gathered this round, so untouched.
