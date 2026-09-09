# R806 — a "Name | Title" / "Name · Title" header row splits into name and title; an entry header over its bullets is the first job

## Source

R802 and R805 both recorded the same open boundary: a header row that binds
the name and the professional title with `|` or `·`

```
Jane Doe | Senior Engineer
jane@example.com · 555-111-2222
EXPERIENCE
…
```

was stored **whole** as `contact.fullName = 'Jane Doe | Senior Engineer'` with
an empty title. The Builder's Name field, every template, the share title, the
TXT/MD header and the letter sign-off print the pipe and the title as the
name. The same row with a longer headline (`Jane Doe | Senior Software
Engineer, Platform`) failed the 60-character name cap and stored **no name at
all**; a name leading a contact row (`Jane Doe | jane@example.com |
555-111-2222`) was a contact row to the scan, so it too stored no name.

The parser already split `Name — Title` (R787); `|` and `·` were deliberately
left alone because the same binders build contact rows and entry headers
(`Senior Engineer · Acme Corp`), and R802's `startsBody` stop for entry
headers only knew the dated shape (`Role · Company` over a date line). Its
comment says so: *"a 'Name | Title' row has no date line under it"*.

Evidence (`qa/r806-evidence.mts`, R805 parser vs this branch):

| shape | R805 | R806 |
| --- | --- | --- |
| `Jane Doe \| Senior Engineer` / contact / body | name `Jane Doe \| Senior Engineer`, title `''` | name `Jane Doe`, title `Senior Engineer` |
| `Jane Doe \| Senior Software Engineer, Platform` | name `''`, title `''` | name `Jane Doe`, title kept |
| `Jane Doe · Senior Engineer` | name `Jane Doe · Senior Engineer` | name `Jane Doe`, title `Senior Engineer` |
| `Jane Doe \| jane@example.com \| 555-111-2222` | name `''` | name `Jane Doe`, title `''`, e-mail kept |
| `Jane Doe \| Austin, TX` | name `Jane Doe \| Austin, TX`, location `Austin, TX` | name `Jane Doe`, title `''`, location kept |
| `Jane Doe \| Node.js Developer \| github.com/jane` | name `''` | name `Jane Doe`, title `Node.js Developer`, website kept |
| `Senior Engineer · Acme Corp` / `- Built things.` / `- Led.` (no date) | name `Senior Engineer · Acme Corp`, 1 empty job with bullets | name `''`, job `Senior Engineer / Acme Corp` with 2 bullets |
| `Jane Doe, Senior Engineer` | whole line is the name | unchanged (a comma also joins `Director, Engineering`) |
| `Jane Doe — Senior Engineer`, plain `Jane Doe` / `Senior Engineer` | correct | unchanged |

Retained corpus (`qa/_r806corpus.mts`, 186 texts): every `|` / `·` row in the
first four lines is a contact row that already follows a name line (Canva,
Google Docs, Pages, Word, Northstar fixtures) or a placeholder (`Y O U R N A M
E`), so no retained file changes — the gap is a pasted-header shape, not a
corpus defect.

The other queued candidate — a year line **above** its education entry
(`EDUCATION / 2018 / MS Data Science · Tech Institute`) — was probed in the
same script and left for a later round: it is a different rule (a date that
belongs to the entry below, which the experience branch already handles for
ranges) and needs its own evidence.

## Fix (`src/lib/importText.ts`)

1. Name scan: after the `startsBody` stop, a line split on ` | ` / ` · ` / ` • `
   whose first segment matches `NAME_HEAD_RE` (two to four capitalised words,
   the existing `Name — Title` head shape) and is not a `City, ST` place is a
   name row. Its first segment is the name; the remaining segments minus
   e-mail / phone / link (`isUrlSegment`: LinkedIn, `http`/`www`, or a
   `name.tld[/…]` token — `Node.js Developer` is not a link) / place
   segments join as the title. The e-mail / phone guards now test the name
   head, not the whole line, so the contact-row shape qualifies.
2. `isHeadlessEntryHeader` also fires when the **next** line is a bullet
   (previously: only a bare date, or dates inside the line). The undated
   `Role · Company` over its bullets therefore ends the name scan and opens
   the implicit experience section exactly like the dated shape (R802), which
   is also what keeps rule 1 from reading it as `name Senior Engineer / title
   Acme Corp`.

Untouched: `Name — Title` (still joined with ` — `), the R803 place rule, the
R804 year rule, the R805 heading / document-title stops, contact-row
detection, location / website extraction, sections, ATS, exports.

Rejected:

- Splitting on `|` / `·` unconditionally — `Senior Engineer · Acme Corp`
  becomes name + title; that is why rule 2 exists.
- Requiring a contact token on the row — the reported shape
  (`Jane Doe | Senior Engineer`) has none.
- A city list to reject `New York | 555-… | e-mail` (a bare two-word city
  leading a contact row with no name line above) — no shared client-side
  list exists, the corpus has no such row, and the scan takes the first
  qualifying line, so a name line above always wins. Recorded as a boundary.

## Proof

- `tests/import/rules.test.ts` `R806` (227 → 228): seven shapes above plus
  the two unchanged controls. On the frozen R805 parser
  (`src/lib/_r805_importText.ts`) it fails:
  `expected { …(6) } to match object { name: 'Jane Doe', …(3) }`.
- Replay 186 retained texts vs the R805 byte copy
  (`qa/r806-parse-replay.mts`): **186 / 186 identical**.
- Gates: tsc ×3, eslint, vitest 228, build, verify-dist — green.

## Boundaries

- `Jane Doe, Senior Engineer` (comma) is still one name line — a comma also
  joins `Director, Engineering` and `Acme, Inc`.
- A bare city without a state leading a contact row with no name line above
  (`New York | 555-111-2222 | jane@example.com`) is read as the name.
- A `Name | Title` row directly over a bullet list is read as an entry header
  (rule 2); no real header does that.
- A single-word or ≥ 5-word name in a `|` row (`Cher | Singer`) is not split.
