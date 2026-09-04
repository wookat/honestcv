# R368 — SOP-10 audit round: import keeps the target job; trim Remotive names

## SOP-10 four-dimension audit (production, firsthand)

Independent QA drove the full new-user golden path, the Jobs pipeline chain,
the assistant panel, 36 responsive/theme checks, and robustness probes on
cv.zalize.com (all AI/share/payment requests mocked pre-dispatch). No P0/P1.

- D1 golden path: landing CTA → wizard → paste import → edit → ATS score →
  PDF/TXT export → save copy → (mocked) share → dashboard manage — all green,
  with the P2/P3 below.
- D2 depth vs Rezi (informational, banked): follow-up email is a local
  template (no personalization); assistant quick tasks are local heuristics,
  not agent cards; no reminders/attachments/contacts on pipeline entries.
- D3 static pages: 6 pages × 375/768/1440 × light/dark strict overflow —
  36/36 pass; 20/20 nav/footer links 200.
- D4 robustness: reload persistence, `?doc=`/`?assistant=1`/`?attention=1`
  deep links, `/s/:id` 404 page, slow-AI busy state (no double submit), zero
  console errors.

## Confirmed defects fixed this round

### P2 — paste/upload import silently discards the setup-wizard target job

Repro (production): complete the /builder wizard with a target role, then
Import → paste → "Import — replaces current content". `parseResumeText`
builds a fresh `Resume`; the later share POST payload showed
`"targetRole":""`. A new user's very first wizard input is thrown away
minutes later with no warning. Pasted resume text cannot express the target
job (`parseResumeText` never sets those fields), so replacing *content* must
not clear *targeting*.

Fix: `importText.ts` gains

```ts
keepTargetOnImport(prev, parsed) // = { ...parsed, targetRole, jobDescription,
                                 //     experienceLevel, targetCompany,
                                 //     ignoredKeywords, language: from prev }
```

and the Builder paste-import button (which the file-upload path also funnels
into) uses it. The Dashboard "import as new copy" flow is untouched — there
is no prior target to preserve when creating a new resume from a file.

### P3 — untrimmed Remotive company/title strings leak into user-facing text

Repro: follow-up email greets "Hi Coalition Technologies  hiring team,"
(double space); the auto-created targeted copy is named
"Freelance Copywriter — Coalition Technologies " (trailing space). Remotive's
`company_name` arrives with trailing whitespace.

Fix in three layers (covers fresh fetches, KV-cached payloads, and pipeline
entries stored before this round):
- worker `/api/jobs/search` mapping trims `title`/`company`,
- client `searchJobs` trims both on every result,
- `followUpEmail` trims at composition.

## Non-goals

- No import-dialog UX changes (collapsed Target job section, post-download
  promo interruption, unnamed "Save current as copy") — banked as candidates.
- No pipeline feature depth (reminders/attachments) — needs its own round.

## Validation

- Oracle: `keepTargetOnImport` preserves the six fields and nothing else;
  parse output otherwise wins; `followUpEmail`/`searchJobs` trim.
- tsc / eslint / build; deploy; independent production QA: wizard → import →
  target role survives (share payload + Target job panel), trimmed email
  greeting and copy name, regressions (R367/R366), 375 light/dark.
