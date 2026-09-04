# R376 — Target-role title words out of resume keyword chips (banked from R357 SOP-04)

## Evidence (direct source execution, .tmp-smoke/r376_probe.ts)
JD: "We are hiring a Product Manager. The manager will own the roadmap, write SQL, work with Kubernetes…"
- `matchReport(resumeText, jd).missing` = `manager, product, write, sql, kubernetes, leads, discovery`
- Builder Target job panel, keyword triage, assistant target status and per-job tailoring report all
  surface `manager` / `product` as keywords to "add to your resume" — adding your own job title as a
  keyword is noise, and Rezi's keyword scanner lists skills, not title words.
- R356 already solved this for interview coaching (`roleTokensOf` + filter in interviewAnalysis.ts),
  and its SOP note banked "ATS Target panel raw chips still list bare 'manager'" as an independent round.

## Root cause
`extractKeywords` ranks all non-stopword JD tokens; nothing removes the user's own target-role title
tokens. `scoreResume` (Builder ATS), `matchReport` (tailoring report, assistant) and the triage/high-
priority chips all consume that raw list.

## Fix (ats.ts + two call sites)
- ats.ts: local `roleTokensOf(role)` (same tokenization as R356) and filter
  `kw.includes(' ') || !roleTokens.has(kw)` — multi-word phrases (e.g. "product sense") are never
  excluded, matching R356 semantics.
- `scoreResume`: filter `allKeywords` by `resume.targetRole` tokens (before the ignoredKeywords split,
  so ignored counts don't change meaning). Empty role → empty token set → byte-identical result.
- `matchReport(resumeTextRaw, jd, targetRole?)`: optional third param, same filter.
  - Builder tailoring report (line ~9175): pass `resume.targetRole`.
  - AssistantPanel target-status report: pass `resume.targetRole`.
- Deliberately NOT changed: `matchScore`/`matchReport` uses in Jobs.tsx (comparing the resume against
  arbitrary board jobs — the user's target role is not that job's title), `scoreResumeText`
  (/ats-checker has no role concept), manual ignoredKeywords mechanism.

## Acceptance
- With targetRole "Product Manager": missing chips exclude bare `manager`/`product`; sql/kubernetes
  retained; a JD containing "product sense" keeps the phrase.
- Keyword % recomputed over the filtered set (covered role words no longer pad the numerator either).
- Empty targetRole: extraction and scores byte-identical to before.
- Oracle .tmp-smoke/r376_oracle.ts green; tsc/eslint/build green; production verification.
