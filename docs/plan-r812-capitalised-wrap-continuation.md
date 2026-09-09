# R812 — a marked bullet wrapped before a capitalised word ("… to the new" / "Kubernetes cluster, …") re-imports as one bullet, across a page break too

## Source

Queued since R793 as "page-bottom 2+2 bullet split". R793 taught the PDF
export to keep a bullet of ≤ 3 lines whole across a page break and to split a
longer one only 2+2, and taught the importer to rejoin a wrap whose second
line opens with a lowercase letter, a figure or follows an open phrase
(`continuesPrevious`). The remaining shape: the continuation line opens with a
**capitalised** word — a product name (`Kubernetes`, `Postgres`, `GitHub
Actions`), a proper noun, a month — so none of the three cues fire and the
bullet is stored as two bullets. Our own PDF export produces exactly this at
every page bottom whose 2+2 split lands before a capital; a paste that kept
its line breaks (Word / Google Docs "copy" of a wrapped bullet) does too. The
user sees two half-bullets in the Builder, every template prints two glyphs,
`/ats-checker` counts a short fragment bullet ("Kubernetes cluster, cutting
p99 latency by 40%.") against the bullet-quality checks.

## Evidence

- `qa/r812-evidence.mts` — six jobs × six long bullets whose wrap words are
  capitalised product names, exported on all 25 templates (6–7 pages each),
  extracted with the product extractor and re-imported:
  ```
  frozen R811 parser: 36 bullets → 39–45 per template, split bullets on 25/25
  this parser:        36 bullets → 36 on every template, 0/25
  ```
  Direct paste shapes: `• Led the migration of the billing platform to the
  new` / `Kubernetes cluster, cutting p99 latency by 40% for 2M users.` — two
  bullets before, one after; the same with a blank line between (page
  boundary), a three-line wrap, and the wrap followed by the next entry
  header.
- Retained corpus (`qa/r812-replay.mts`, 186 texts = R776 text replay + R786
  PDF extractions) has the shape only where the extractor already rejoined it
  by geometry (R786); replay is byte-identical, see below.

## Fix (`src/lib/importText.ts`)

```ts
const openedWithMarker = (lines, i, bullet) =>            // the current bullet traces back to a marked source line
  …walk back over the lines already folded into `bullet`; true iff the first line not in it isBullet()
const continuesOpenBullet = (lines, i, bullet, line) =>
  !!bullet && !/[.!?:;]$/.test(bullet) &&                  // bullet still open
  !isBullet(line) && /^[A-ZÀ-Þ]/.test(line) &&             // marker-less, capitalised
  looksLikeBodyLine(line) &&                               // reads as prose (sentence end or > 60 chars)
  !opensWithActionVerb(line) &&                            // not a bullet that lost its marker
  !bindsEntryHeader(line) && !isTagList(line) &&
  !DATE_RANGE_RE.test(line) && !extractDates(line).start &&
  openedWithMarker(lines, i, bullet)
```

- Experience bullets: `continuesPrevious(...) || continuesOpenBullet(...)`.
  `continuesPrevious` (lowercase / figure / open phrase) and `joinWrapped`
  (hyphen joins) are unchanged.
- `opensWithActionVerb` is the check `isCompanyInfoLine` (R794) already made
  inline (`STRONG_VERBS` from `guidance.ts` or a `-ed` word), now shared.

## Rejected

- Any capitalised prose line after an unterminated marked bullet
  (`openedWithMarker` absent) — replay 181/186: five Canva fixtures lost
  most of their bullets (`canva-1` 9 → 2, `canva-2` 15 → 3), because Canva
  bullet lists carry no markers and no terminal punctuation, so every item
  looked like the continuation of the one above. The marker-provenance
  requirement restores 186/186.
- Width test (previous visual line "full": its length + the next line's
  first word exceeds the widest bullet line of the document) instead of the
  action-verb test — correct on pastes, wrong on our own PDF text, where the
  extractor has already joined same-page wraps into one long line so the
  pre-break fragment is never the widest. The action-verb opener is what
  separates the two retained negatives (`• Educated customers` /
  `Led migration for Contoso Ltd.`, R779; `the ledger service` / `Shipped
  the redesign …`, R792) from a wrap, and both shapes are in the tests.
- Changing the PDF export (never break before a capital / never split a
  bullet) — the 2+2 rule is the intended typography (R793) and pastes from
  other editors have the same shape.

## Old / new proof

- `tests/import/rules.test.ts` +1 (R812): marked bullet wrapped before a
  capital → one bullet; with a blank line between; three-line wrap; wrap
  followed by the next `Role · Company, Location` header → header still opens
  the next job; guards — header (`·` and `at`), tag row, action-verb line
  (`Shipped the redesign …`) after an open bullet stay separate; a
  marker-less Canva-style list stays one item per line.
- `tests/pdf.test.ts` +1 (R812): 6 × 6 capitalised-wrap bullets on all 25
  templates → > 3 pages, at least one page ends mid-sentence, re-import
  returns the 36 bullets verbatim.
- Frozen R811 checkout (`/home/ubuntu/qa/r812-wt`, `3ad8fa3`): both fail
  (`"Led the migration … to the new"` / `"Kubernetes cluster, …"` as two
  bullets; classic 39 bullets instead of 36).
- Replay 186 retained texts vs frozen R811 parser (`qa/r812-replay.mts`):
  **identical 186/186; changed 0**.
- Gates: `npm test` 244 / 244 (242 → 244), `tsc -p tsconfig.app.json`,
  `tsc -b`, eslint 0 errors (11 pre-existing warnings in untouched files),
  `npm run build`, `verify-dist`.

## Deploy + production QA

(filled in after deployment)

## Boundaries

- A wrap whose continuation opens with a capitalised action verb that is also
  a proper noun (`… partnered with` / `Led Zeppelin …`) stays two bullets.
- A continuation line that is neither a sentence end nor > 60 characters
  (`looksLikeBodyLine`) — e.g. a short capitalised tail `Kubernetes cluster` —
  stays its own bullet; it is indistinguishable from a short marker-less item.
- Marker-less lists (Canva) are unchanged: without a source marker no
  capitalised line is a continuation.
- Education / project / custom-section bodies are not touched (experience
  bullets only, where the evidence is).
