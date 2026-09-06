# R612 — an untracked job's panel and Cover letter dialog disclose the documents already written for it

Round: R612. Theme: the "find it again" journey (R593/R602 `/jobs?job=<id>` links) ends on a job panel
that says nothing about what the user already has for the job.

## Evidence (production `index-4GyVkSqq.js`, `qa/r612-evidence.cjs copy`, real job 2091088 Sales Jedi @ Creative Force)

Seed: job untracked; orphan copy targeted at it; cover letter + interview brief with `forJob` = the job.

| surface                          | copy                                     | documents                       |
| -------------------------------- | ---------------------------------------- | ------------------------------- |
| job panel                        | button reads "Reconnect targeted copy"   | **nothing** — plain "Cover letter" button, no row |
| "Write a cover letter…?" dialog  | "…opens the resume copy you already targeted at this job … links it to this job again" | **silent** about the existing letter (the tracked-job dialog says "This job already has the saved cover letter …" + "Open saved letter") |

Since R611 the cover path tracks the job first, so the letter relinks and the builder's R601 disclosure
appears at save time — but the user decides on `/jobs` without knowing a letter exists, and the
`/documents` note "job no longer tracked — find it again" lands them exactly here.

## Fix (`src/pages/Jobs.tsx` only)

- `writtenDoc(jobId, kind)`: for a job with **no** pipeline entry, `latestDocsFor(jobId)[kind]`
  (tracked jobs keep using `linkedDoc`; nothing changes for them).
- Confirm dialog (cover / interview): when `linkedDoc` is empty but `writtenDoc` exists —
  cover: "You already wrote the cover letter “X” for this job — saving the job links it again, and a
  letter you save from the tool becomes its cover letter instead; the earlier one stays in your documents."
  interview: "You already wrote the interview brief “X” for this job." (interview prep does not track
  the job, so no relink is promised). "Open saved letter / brief" button shown in both cases.
- Panel, untracked job with written documents, under the status chips:
  "Written for this job earlier: Cover letter “X” · Open, Interview prep “Y” · Open — saving this job
  links them again." Links open `/documents?doc=<id>`.

## Acceptance

- copy mode: panel note lists both documents; cover dialog discloses the letter + Open saved letter.
- control: job with no written documents → panel/dialog unchanged.
- 1280 + 375, no overflow, storage restored, 0 console errors, 0 AI calls; tsc/eslint/build/verify-dist.
