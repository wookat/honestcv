# R637 — Builder "Target job" section offers "Use this copy instead" when the targeted tracked job uses another copy

Date: 2026-09-06 · Production before: `index-Cj5uxiAF.js` (R636) · Evidence: `qa/r637-evidence.cjs`

## 1. Evidence (production, real posting 2091088 Applied, job links copy A, editor holds copy B written for the same job)

```
target note: This copy is targeted at "Sales Jedi" at Creative Force, but that tracked job uses another copy. View it on the jobs board →
note buttons: ["View it on the jobs board →"]
```

R605 discloses the state truthfully, R621 offers "Link this copy to it" only when the job has **no** copy. When the job already has one the user must leave the editor, find the job card and (since R636) swap there. The dashboard Resume settings (R620) and jobs board (R636) both let a copy be linked in place; the builder was the last surface with the fact but no action.

## 2. Design (`Builder.tsx`, Target job section)

```tsx
<button onClick={linkCopyToTargetedJob}>
  {jobLinksLiveCopy(targetedTrackedEntry, versions) ? 'Use this copy instead' : 'Link this copy to it'}
</button>
```

Same handler as R621 (`setPipelineVersion` → stamps `forJob`, R619). The previously linked copy is not deleted; it stays as an *Earlier targeted copy* row on the job card (R636), so the swap is reversible from either surface. After the click the section re-renders as `This copy is tailored to "…" at …` (linked state).

## 3. Acceptance (production, 1280 + 375)

- note shows `Use this copy instead · View it on the jobs board →`; click → `resumeVersionId = B`, both copies kept with `forJob = job`, active copy unchanged, note becomes the linked-state sentence.
- No overflow, zero console errors, zero AI calls, storage restored.

## 4. Result

Deployed `index-Ck2L9KYw.js` (Worker upload OK; Routes API code 10000 unchanged). Production QA 1280 + 375: before `…uses another copy. Use this copy instead · View it on the jobs board →`; after click `2091088:applied→copy=qa-copyB`, versions `qa-copyA … forJob=2091088`, `qa-copyB … forJob=2091088`, active `qa-copyB`, note `This copy is tailored to "Sales Jedi" at Creative Force.` No overflow (375: 360/375), zero console errors, zero `/api/` calls beyond the job search, storage restored.
