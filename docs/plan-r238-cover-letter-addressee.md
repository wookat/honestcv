# R238 — Cover letter addressee (hiring manager) field

## Rezi first-party evidence

AI Cover Letter Generator guide (rezi.ai/rezi-docs/ai-cover-letter-generator-explained):

> "the first section you'll complete is 'Contact'. This includes: … Company name / **Name and/or title of the person you're addressing**"

> "Try to find the hiring manager's name for a personal touch (LinkedIn, the company website, or the job posting are good places to check). If you can't find it, 'Dear Hiring Manager' is your best bet. Just avoid 'To Whom It May Concern'…"

## Current HonestCV state (gap)

- The Cover Letter tool dialog has exactly one input: **Company name**. There is no way to name the person being addressed.
- The worker prompt already says `Start with "Dear Hiring Manager," unless a name is given` — but no name can ever be given: `buildCoverLetterMessages(resumeText, jd, company, role)` has no addressee parameter, and the client never sends one. The escape hatch is dead code.
- The offline "Insert template" cover letter is hard-coded to `Dear Hiring Manager,`.

## Design

Add an optional "Hiring manager (optional)" input to the Cover Letter dialog, next to Company name.

- **Client** (`src/pages/Builder.tsx`, `BundleToolDialog`): new `addressee` state (session-only, like `company`); rendered only for `kind === 'cover'`; passed to `aiCoverLetter` when non-blank; the offline template salutation becomes `Dear <addressee>,` when provided, else `Dear Hiring Manager,` (unchanged).
- **API** (`src/lib/api.ts`): `aiCoverLetter` input gains optional `addressee?: string`.
- **Worker** (`worker/index.ts` + `worker/prompts.ts`): accept `body.addressee`, pass to `buildCoverLetterMessages`; the user message gains `Addressed to: <name>` when provided; the existing system-prompt rule ("unless a name is given") now actually fires.

## Invariants

- No schema/localStorage change: addressee is dialog session state only.
- Zero change when the field is left blank: request payload byte-identical shape (addressee omitted), template output identical.
- Resignation letter, interview prep, saved-doc flow, entitlement/quota logic untouched.
- No scoring/export/AI-endpoint additions; same single endpoint.

## Validation matrix

1. Dialog shows the new optional field only for cover letters (not resignation/interview).
2. Offline template with addressee "Maya Chen" starts `Dear Maya Chen,`; blank → `Dear Hiring Manager,` (byte-identical to before).
3. AI request payload includes `addressee` only when non-blank (verified via network capture; live AI generation optional given quota cooldown).
4. Deep link `?doc=cover&company=X` still seeds company; addressee starts empty.
5. 375px layout, dark mode contrast, regression on R237 compare + ATS baseline.
