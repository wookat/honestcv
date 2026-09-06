# R638 — SOP-10 audit node + Resume settings offers "Save and use this copy for that job instead"

Date: 2026-09-06 · Production before: `index-Ck2L9KYw.js` (R637)

## 1. Audit (four dimensions, fetched not inferred)

### 1.1 Seven routes × 1280/375 (`qa/r588-sweep.cjs`, production)

`/`, `/builder`, `/dashboard`, `/jobs`, `/documents`, `/ats-checker`, `/pricing`: page `scrollWidth` = viewport at both widths (375: 360/360). The only elements past the viewport edge are the two known intentional horizontal scrollers (home comparison table `min-w-[560px]`, builder tab strip `w-max`) — unchanged since R588. Zero console errors, storage keys back to baseline.

### 1.2 Rezi public pages (`https://www.rezi.ai/rezi-docs/job-search`, `https://www.rezi.ai/features`)

Job Search guide (updated 2026-07-16): filters Workplace / Job type / Visa / Skills; **exclude jobs already Saved / Applied / Rejected**; sort **Best match / Newest first**; statuses All / Saved / Applied / Interviewing / Rejected (+ offer stage); Apply Now leaves to the company site; Target Resume lets the user **choose a resume from the dashboard**. RezUp: exclude-by-status chips (`excluded` set, `/jobs` All tab), sort Relevance / Newest / Best match, five statuses incl. Offer, Apply on site, Copy-from picker (R628/R630). No public-page capability gap found this node.

### 1.3 Relationship sweep (`qa/r616-sweep.cjs` 375, rich job + dangling-link job)

Tracked tab, both panels, dashboard, documents: labels consistent with R602–R637 (`for … at …`, Targeted resume / Cover letter / Interview prep rows, dangling links treated as "no copy / no document"). No regression from R634–R637 rows; no overflow.

### 1.4 Remaining "fact without action" surface

Dashboard **Resume settings** (`qa/r638-evidence.cjs unlinked`, production `index-Ck2L9KYw.js`): unlinked copy B retargeted to tracked job K, which links copy A:

```
The new target matches tracked job "Platform Engineer" at Initech, which already uses another copy — this one stays unlinked.
dialog buttons: ["Cancel","Save","Close"]
```

R620 offers *Save and link to that job* only when K has **no** copy. Since R636 (job card) and R637 (builder) the same state can be resolved in place everywhere except here.

## 2. Design (`Dashboard.tsx`, Resume settings dialog)

```tsx
{!editingRetargetsLinkedJob && editingMatchesTrackedJob && (
  <Button onClick={() => saveEditing(editingMatchesTrackedJob.job.id)}>
    {editingMatchesTrackedJob.hasCopy ? 'Save and use this copy for that job instead' : 'Save and link to that job'}
  </Button>
)}
```

Note text for the unlinked+hasCopy case: *"… which already uses another copy — this one stays unlinked unless you use it for that job instead."* Same `saveEditing(linkTo)` path (`setPipelineVersion`, R619 `forJob` stamp). The copy K used before is not deleted; it keeps `forJob = K` and appears on K's card as *Earlier targeted copy · Use this one instead* (R636) — reversible. When the edited copy is itself another job's linked copy (`editingRetargetsLinkedJob`) the dialog is unchanged (moving J's copy onto K would break two links at once; *Save as new copy* remains the offer).

## 3. Acceptance (production, 1280 + 375)

- unlinked: note + button present; click → `qa-j2→qa-v1`, `qa-v1.forJob = qa-j2`, `qa-vA` kept with `forJob = qa-j2`, row reads `for Platform Engineer at Initech`; dialog scrolls at 375.
- linked control: unchanged (`Save as new copy`, no swap button), links untouched.
- No overflow, zero console errors, zero AI calls, storage restored.

## 4. Result

Deployed `index-DR9zDq6k.js` (Worker upload OK; Routes API code 10000 unchanged). Production QA 1280 + 375 matched §3 exactly (375 dialog 343×720, scrollable; overflow 360/375; `api calls: quota, billing/status` only; console errors 0).
