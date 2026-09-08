# R781 — a gutter-label line ("EXPERIENCE Senior Software Engineer · Northstar Digital …") opens its section and keeps its content

## Evidence (first-hand, before any code)

1. **Where it came from.** R780's in-repo corpus goldens for `northstar-sidebar` /
   `sample-sidebar` were the only text/PDF pairs whose parsed structure differed:
   the PDF path (pdf.js + our `leftMargin` split) gives summary, 2 experiences,
   1 education; the layout-preserving text of the same PDF gives an **empty**
   summary, an **empty** experience, an **empty** education and only Skills
   (with its first "Languages:" label eaten). Traced line by line with the
   current parser: `SUMMARY   Software engineer with six years …`,
   `EXPERIENCE   Senior Software Engineer · Northstar Digital, London, UK   Jan 2022 – Present`,
   `EDUCATION   BSc Computer Science · University of Bristol …` are neither a
   heading (too long / punctuated for `matchHeading`) nor a colon-carrying inline
   heading, so every one of them — and every line under them — is discarded as
   pre-heading header prose. `SKILLS   Languages: TypeScript, …` *is* caught,
   but by `INLINE_HEADING_RE`, with `SKILLS   Languages` as the label, so the
   category word is lost.

2. **Is this a real user path, not a pdftotext artefact?** Chrome's PDF engine
   (PDFium, `pypdfium2` 4.x, same text-page API the viewer's copy uses) run on
   our own exported `northstar-sidebar.pdf` yields, single-spaced:
   ```
   SUMMARY Software engineer with six years of experience building customer-facing web applications.
   EXPERIENCE Senior Software Engineer · Northstar Digital, London, UK Jan 2022 – Present
   EDUCATION BSc Computer Science · University of Bristol, Bristol, UK 2014 – 2017
   SKILLS Languages: TypeScript, JavaScript, HTML, CSS
   ```
   Parsed today: summary `''`, experience `[('', '', '', '', 1)]`, education
   `[('', '', '', '')]`, skills present. The same PDFium text of
   `northstar-classic.pdf` parses to 2 experiences with dates, 1 education,
   263-char summary. So a user who exports the **Sidebar** template (the one we
   describe as "scannable two-column look, single-column reading order"), opens
   the PDF in Chrome, copies the text and pastes it into /ats-checker or the
   builder Import dialog loses everything but Skills. `pdftotext` without
   `-layout` keeps the label on its own line (reading order) and is unaffected.

3. **Corpus scan** (114 retained texts + 72 PDF extractions) for lines of the
   shape `ALL-CAPS section word(s)` + whitespace + mixed-case rest: 17 hits.
   - 7 — the two sidebar layout texts (the target; 4 + 3 lines).
   - 9 — Google Docs / Word career-centre templates: `EDUCATION (for early-career
     candidates …)`, `PROJECTS (can call this …)`, `VOLUNTEERING (for …)` — a
     heading followed by an instruction in parentheses that wraps onto later
     lines (the closing `)` is not on this line, so `matchHeading`'s aside strip
     does not apply). Known-unreliable template residue; must not change.
   - 1 — `OBJECTIVE or PROFESSIONAL SUMMARY` (word365-ufl template): a heading
     naming its alternative. Must not become a summary line.
   No real CV in the corpus has a caps section word followed by lowercase
   content on the same line other than the gutter layout — because with reading
   order extraction the label is its own line.

## Design (narrow)

`matchGutterLabel(line)`: take the leading run of ALL-CAPS tokens
(`/^[A-Z][A-Z&/]*$/`, `&`), try the longest run first; the run must be a
dedicated heading (`SECTION_HEADINGS`, ≤40 chars) or a known custom section word
(`CUSTOM_HEADING_RE`: awards / honors / languages / interests / volunteer /
publications / references …). The remainder must look like content:

- does not start with `(` (template instruction asides);
- after dropping a leading `or` / `and` / `&` / `/`, still contains a lowercase
  letter (`OBJECTIVE or PROFESSIONAL SUMMARY` fails this — its remainder is another
  heading, not content).

Runs before `matchInlineHeading` so `SKILLS Languages: …` keeps `Languages:` as a
categorised skill line (R714), and is used for the header/first-heading probe
too. Everything after the split goes through the unchanged per-section code.

Deliberately not done: Title-case gutter labels (`Experience Senior …`) — too
ambiguous with role titles; a generic "6+ letter caps word opens a custom
section" fallback (`CISSP certified …`, `PYTHON …` would split); any change to
PDF extraction (pdf.js already reads the gutter in reading order).

## Results

See PR body / handoff for replay numbers (186-file replay vs R780, focused
tests, PDFium probe, production QA).
