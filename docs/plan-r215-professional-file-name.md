# R215 — Professional file name check on uploaded resumes

## First-party evidence

Rezi Score user doc (https://intercom.help/rezihelp/en/articles/8383527-using-the-rezi-score),
Best Practices list:

> "Resume name - Keep it simple and professional with your full name and \"resume\"…"

## Gap

/ats-checker's "Uploaded file checks" (R189/R207, `src/lib/extractFile.ts`) cover size,
pages, columns, tables, text boxes, images, font size and icon glyphs — but never look at
the file name. A resume uploaded as `resume_final_v2 (3).pdf` or `Untitled document.docx`
gets no nudge, although the file name is the first thing a recruiter sees in their inbox
and Rezi audits it explicitly.

## Design

New `FileCheck` produced by `fileNameCheck(file)` and appended to the checks for all three
supported types (.pdf, .docx, .txt):

- Label: `Professional file name`.
- Tokenize the extension-less base name: lowercase, split on `[-_ .,()+]` and camelCase-ish
  boundaries are not needed (split covers real-world names).
- Fail when either:
  1. a junk token is present — `untitled`, `document`, `doc`, `copy`, `final`, `draft`,
     `new`, `updated`, `latest`, `edit`, `edited`, `version`, `v2`…`v99` (`/^v\d{1,2}$/`),
     or a bare duplicate counter (`(1)`-style, i.e. a standalone 1–2 digit token that is
     not a 4-digit year); or
  2. neither `resume` nor `cv` appears as a token.
- Hint quotes the actual file name and suggests the Rezi-style form, e.g.
  `Rename "resume_final_v2 (3).pdf" to your full name plus "resume" (e.g. "Jane-Doe-Resume.pdf") — recruiters and portals see the file name first.`
- Pass hint: file name looks simple and professional.
- Years (`(19|20)\d{2}`) are allowed tokens (e.g. `jane-doe-resume-2026`), as are name
  tokens — we do not attempt to verify the candidate's actual name (the file check runs
  before/independently of text parsing; verifying against the parsed contact name would
  couple layers and risk false alarms on nicknames). Lenient direction: only clear junk or
  a missing resume/cv keyword fails.

## Non-goals / invariants

- File checks stay display-only: they do not feed the ATS score (scoring neutrality as in
  R189/R207 — upload score == paste score). No denominator changes (checker structure
  stays 15, Builder 16).
- No schema, API, persistence or AI changes. Only `src/lib/extractFile.ts`.

## Acceptance

1. `Jane-Doe-Resume.pdf`, `jane_doe_cv.docx`, `Jane Doe Resume 2026.txt` → pass.
2. `resume_final_v2 (3).pdf` → fail (junk: final/v2/counter), hint quotes the name.
3. `Untitled document.docx` → fail (junk + missing resume/cv).
4. `JaneDoe.pdf` → fail (missing resume/cv token).
5. Upload score still equals pasted-text score for identical content.
6. 375px and dark-mode rendering of the new row healthy; R207/R189 rows intact.
