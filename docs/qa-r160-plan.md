# R160 QA plan — HistoryDialog per-checkpoint diff summary (bundles index-Cw1KFMAL.js / Builder-BceTnkPr.js, PR #375)

Code evidence (diff R159..R160, Builder.tsx ~L7966–8100):
- `snapshotChanges(snap, current)` returns ordered labels: Contact (incl hiddenContact), Summary, Skills, then entry sections (Experience, Education, Projects, Certifications, Involvement, Coursework, Awards, Publications, References, Military service, Agents, Custom sections) with counts `(N edited, +A, −R)` (− is U+2212; view = what restore brings back: + means in checkpoint not current), then Target job (targetRole/jobDescription/experienceLevel/targetCompany/ignoredKeywords), then any other differing key → single "Design & layout".
- Render: non-Current items get `<p class="text-xs">Differs from current: {first 4 joined by ' · '}{' · +N more' if >4}</p>`; Current items get `changes=[]` → no summary line.
- History stored in localStorage `honestcv.resumeHistory` as [{id, at, data}]; restore checkpoints current draft first (recordResumeSnapshot(resume, true)).

## F1 Bundles
Cache-busted fresh load; assert exactly index-Cw1KFMAL.js + Builder-BceTnkPr.js. Baseline storage clean before seed.

## F2 Crafted checkpoints → exact summary lines (1600)
Seed standard fixture; inject honestcv.resumeHistory with snapshots derived from current resume:
- S1: identical copy → PASS iff row shows "Current" and NO "Differs from current" line.
- S2: summary changed + experience[1] role edited + one extra experience entry (new id) + accentColor/template changed → PASS iff line reads exactly `Differs from current: Summary · Experience (1 edited, +1) · Design & layout`.
- S3: experience entry removed from snap (current has it) + targetRole set → `Differs from current: Experience (−1) · Target job` (− = U+2212).
- S4: ≥5 groups differ (contact, summary, skills, experience, education, target) → PASS iff exactly 4 shown + ` · +2 more` (or correct N), order Contact · Summary · Skills · Experience (…).
Open History via the toolbar History button; verify visually (screenshot) not just DOM.

## F3 Restore regression
Click Restore on S2 → PASS iff resume content becomes S2's (summary text visibly changes in Builder), and a new checkpoint of the pre-restore draft appears in history (list grows; the pre-restore draft row now present, marked Current row moves to S2 copy). Spot-check via reopened dialog.

## F4 Mobile 375
Emulate 375, open History dialog → PASS iff summary lines wrap with no horizontal overflow (`document.documentElement.scrollWidth ≤ 375`, dialog content right edge ≤ 375) and text readable (screenshot).

## F5 Regression
R152 chip still opens report; R159 verdict still shown on chip ("N · verdict") at 1600.

## F6 P3-fix re-verification (bundles index-Dpg8BV7u.js / Builder-ChVZVgKH.js)
Fix: isCurrent now = exact-JSON shortcut OR snapshotChanges().length === 0.
- F6a: fresh cache-busted load has exactly index-Dpg8BV7u.js + Builder-ChVZVgKH.js.
- F6b: seed fixture + 2 normalized crafted checkpoints (identical; d2 = summary+entry edit+extra entry+accent). Sampling regression: d2 row reads exactly `Differs from current: Summary · Experience (1 edited, +1) · Design & layout`; identical row shows Current, no line.
- F6c (the fix, adversarial vs old behavior): click Restore on d2, then reopen the dialog WITHOUT reloading → PASS iff the d2 row now shows "Current" and no summary line (old behavior: bare Restore row); a pre-restore checkpoint row appears with an accurate diff line; screenshot proof.
- Cleanup: baseline ["honestcv.clientId","honestcv.qa"].

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]; close emulated tab, fresh desktop tab innerWidth 1600; no AI/share/payment/export/delete.
