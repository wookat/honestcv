# R357 — stop coaching generic JD verb inflections ("knows", "sense")

## Evidence (first-hand, R356 production QA)
- With a realistic PM JD ("who knows SQL…", "Product sense required"), the high-priority
  missing keywords in interview coaching and the ATS report were
  `knows, kubernetes, analytics, planning, sense` — the extractor coaches the
  candidate to work "knows" and "sense" into answers/resume.
- Root cause: `STOPWORDS` in `src/lib/ats.ts` contains the noun forms
  (`knowledge`, `understanding`, `familiarity`, `preferred`, `communication`)
  but not the verb/adjective inflections real JDs use (`knows`, `understand`,
  `familiar`, `prefer`, `communicate`, …). Same class of gap R331 fixed for
  filler-word inflections.
- "Product sense" is a real PM skill phrase; matched as a unit it is a
  legitimate keyword, while the bare token `sense` is noise.

## Design
- Add the missing inflections of already-stopworded lemmas to `STOPWORDS`:
  `know knows knowing understand understands understood familiar prefer
  prefers preferably communicate communicates demonstrate demonstrates
  demonstrated demonstrable sense`.
- Add `'product sense'` to `KNOWN_PHRASES` so the phrase still surfaces as a
  matchable unit.
- No changes to matching, scoring weights, tiers, or interview code — JD
  extraction only. Deterministic scores may shift where a JD repeated these
  words (by design, same as R181/R331).

## Non-goals
- No new NLP/stemming machinery; keep the existing static-set approach.
- No resume-side or coaching-side changes (R356 just landed there).

## Verification
- Oracle: PM JD fixture — `knows`/`sense` no longer extracted; `product sense`
  extracted as a phrase; `sql`/`kubernetes`/`roadmap` unaffected; a JD without
  these words extracts byte-identically.
- tsc / targeted eslint / build; deploy; live-bundle check.
- Production QA (zero AI): ATS Target-job panel + interview coaching no longer
  list `knows`/`sense`; `product sense` appears when present in JD; R356/R355
  regressions; 375 dark; baseline restore.
