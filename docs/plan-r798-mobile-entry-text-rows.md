# R798 — structured-section text boxes and date fields are usable at 375 px

## Evidence (first-hand, R797 production QA + `qa/r798-mobile-shot.cjs`)

The R797 production QA (testing agent, independent 375×667 context, cache
off) round-tripped the seven optional structured sections correctly but the
forms the entries landed in were not usable on a phone. Measured on
production (R797 build, fixture with one entry per section):

| control | width @ 375 | symptom |
| --- | --- | --- |
| Involvement / Coursework / Awards / Publications description | **38 px** | single words split across 4–6 lines |
| Military description | **84 px** | 2–3 words visible |
| Involvement / Military start + end date inputs | **61 px** each | `Jan 2022` / `Present` / `2010` / `2014` clipped to `20…` |
| References form | full width | fine (already one control per row) |

Storage stayed exact and `scrollWidth` = 375 (no overflow), which is why the
geometry checks passed while the forms were unusable — the squeeze happens
inside the card, not at the page edge.

## Root cause (`src/pages/Builder.tsx`)

Eight entry cards (Projects, Involvement, Coursework, Awards, Publications,
Military service, Agents, Certifications) render their description
`LintedTextarea` and the four entry controls (move up / move down / hide /
delete, 40 px touch targets since R651) in one
`flex items-start justify-between gap-2` row. The four buttons are
`shrink-0`, so at 375 px inside the padded card (≈ 268 px of content width)
the textarea gets whatever is left: ~38 px. Experience / Education /
References already put their controls on their own row and are unaffected.

Three of those cards (Projects organisation + dates, Involvement location +
dates, Military location + dates) also use a fixed `grid grid-cols-2 gap-2`
with the dates block nested as a second `grid-cols-2`, so each `MonthYearField`
gets a quarter of the card (61 px) — narrower than its own text.

## Options

1. **One shared row class (chosen)** — `ENTRY_TEXT_ROW`: `flex flex-wrap
   gap-2 sm:flex-nowrap`, first child `basis-full` on small screens and
   `flex-1 basis-0` from `sm`, second child `ml-auto` so the button group
   right-aligns on its own line. Desktop (≥ 640 px) layout is pixel-identical
   (`flex-1` on the textarea is what `justify-between` produced before). The
   three fixed `grid-cols-2` location + dates rows become `grid gap-2
   sm:grid-cols-2` — dates get the full card width on phones.
2. Reduce the controls to a menu on mobile — changes interaction, loses the
   40 px direct targets R651 established; rejected.
3. Move the controls under the textarea on every width — changes the desktop
   layout users know; rejected.

## Result (local `vite preview`, same fixture, `qa/r798-mobile-shot.cjs`)

| control | before (production) | after | desktop 1280 |
| --- | --- | --- | --- |
| Involvement / Coursework / Awards / Publications description | 38 px | **268 px** | 315 px (unchanged) |
| Military description | 84 px | **268 px** | 361 px (unchanged) |
| Involvement / Military dates | 61 px, clipped | **130 px**, not clipped | 130 px (unchanged) |
| page `scrollWidth` | 360 / 375 | 360 / 375 | — |

Not changed: the `institution`/`organization` + single-date rows in
Coursework / Awards / Publications (`grid-cols-[1fr_auto]`, institution 180 px
on both widths — long names scroll inside the input on desktop too; queued),
Experience / Education / References cards, the preview pane.
