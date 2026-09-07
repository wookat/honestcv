# R632 — Next step on an applied/interviewing/offer job acknowledges the interview brief / resignation letter already linked instead of telling the user to write another

Date: 2026-09-06 · Production before: `index-BI4omvgf.js` (R631) · Evidence script: `qa/r632-evidence.cjs`

## 1. Evidence (production, real posting 2091088 "Sales Jedi" at Creative Force)

Status → **Offer** (no docs). Next step: *"You have an offer — leave your current role on good terms. → Open resignation letter"*. The writer opens, discloses *"Saving links this resignation letter to “Sales Jedi” at Creative Force"*, template → Save:

```
2091088:offer→ resignation=qx3xivpd
qx3xivpd:resignation:Umbrella Corp — Resignation letter:forJob=2091088
```

Card row: *Resignation letter: Umbrella Corp — Resignation letter · 3 to fill · Open* — correct (R602/R603 wiring verified for the third document kind; zero API calls).

Back on the card the **Next step is unchanged**: *"You have an offer — leave your current role on good terms. → Open resignation letter"*. Clicking it opens an **empty** writer (no textarea, no hint); only after "Start from a template" does the R601 line appear at the bottom (*"This job already has … saved — Save makes this one the resignation letter linked"*). Save then produced:

```
2091088:offer→ resignation=h42jj3ar
h42jj3ar: Umbrella Corp — Resignation letter (2)   ← now linked
qx3xivpd: Umbrella Corp — Resignation letter       ← unlinked, "Earlier resignation letter"
```

The recommended action recreates work that is done and, followed through, swaps the job's link to a duplicate. `nextStep()` for `applied`/`interviewing` is the same shape (*"Open interview prep"* regardless of `interviewDocId`), so a saved interview brief gets the same stale recommendation (verified after the fix with the `applied` mode of the script; the pre-fix code path is identical).

## 2. Design

```ts
linkedDoc(jobId, kind: CareerDocKind)          // extended to 'resignation'

nextStep(entry):
  applied|interviewing:
    brief = linkedDoc(job.id, 'interview')
    brief ? { text: `Your interview brief “${brief.title}” is saved — review it before the ${status==='applied' ? 'interview' : 'next round'}.`,
              label: 'Open saved brief', onClick: navigate(`/documents?doc=${brief.id}`) }
          : (unchanged R630 path)
  offer:
    letter = linkedDoc(job.id, 'resignation')
    letter ? { text: `Your resignation letter “${letter.title}” is saved${n>0 ? ` — ${n} placeholder(s) to fill` : ''}.`,
               label: 'Open saved letter', onClick: navigate(`/documents?doc=${letter.id}`) }
           : (unchanged)
```

- Mirrors what the card's document rows already show; the tool buttons on the card still let the user write a second document deliberately (with the R601 disclosure).
- Deleted documents (id left behind for Undo) don't count — `linkedDoc` requires the doc to exist, same as the rows.

## 3. Acceptance (production, 1280 + 375)

- `offer`: after saving the letter, Next step = *Your resignation letter “Umbrella Corp — Resignation letter” is saved — 3 placeholders to fill. → Open saved letter* → `/documents?doc=<id>`; pipeline/doc unchanged (no "(2)").
- `applied` (seeded brief): Next step = *Your interview brief “…” is saved — review it before the interview. → Open saved brief*.
- Job without a doc: unchanged texts. No overflow, zero console errors, no AI calls, storage restored.

## 4. Result

Deployed `index-EEApB8_Z.js` (Wrangler Routes API code 10000 — token lacks Routes permission; upload succeeded). `offer` 1280/375: letter saved once → Next step *Your resignation letter “Umbrella Corp — Resignation letter” is saved — 3 placeholders to fill. → Open saved letter* → `/documents?doc=<id>` opens the letter ("Written for Sales Jedi at Creative Force"); pipeline/doc unchanged, no "(2)". `applied` 1280/375 (seeded brief): *Your interview brief “Sales Jedi — Interview prep” is saved — review it before the interview. → Open saved brief* → `/documents`. Pre-save texts unchanged. No overflow (375/375), zero console errors, zero API calls beyond quota/search, storage restored. PR chain: R631 (#852) → R632.
