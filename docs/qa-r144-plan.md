# R144 QA plan — on-demand optional sections

Code evidence (Builder.tsx diff 0a3d4c5): `OPTIONAL_SECTION_META` = involvement, coursework, awards, publications, references, military, agents; `Section` gets `hidden` prop → returns null when `!sectionShown(key)`; `sectionShown(key)` = resume[key].length>0 (hidden entries count) OR in per-visit `addedSections`; "Add a section" Card renders only while some section is not shown, with outline chip Buttons `className="min-h-10 sm:min-h-8"` calling `jumpToSection(key)` (adds to addedSections + dispatches JUMP_EVENT scroll+flash). ATS Fix→ and preview clicks route through the same `jumpToSection`. No storage change; addedSections resets on reload.

Bundles: hard refresh, assert exactly index-BXKtokVz.js + Builder-Bav9EyPV.js.

Prep (unrecorded): fresh QA state — load example resume via UI (its niche sections empty), verify resume.involvement/coursework/awards/publications/references/military/agents all empty.

## T1 Baseline gating (1440)
PASS: none of the 7 section cards render (querySelector for card titles Involvement/Coursework/Awards & honors/Publications/References/Military service/Agents → 0 section cards); "Add a section" card present with exactly 7 chips (icon+label). Core cards (Contact/Summary/Experience/Education/Projects/Skills) all present. Screenshot.

## T2 Chip mounts + scrolls
Click "Involvement" chip. PASS: Involvement card mounts and scrolls into view (card visible in viewport screenshot, flash ring ok); chip count drops to 6 and "Involvement" chip gone; addedSections is per-visit (no new storage key; resume.involvement still absent/empty).

## T3 Content persistence vs per-visit reset
1. Add involvement entry "ZZINV R144 Role"; also click "Coursework" chip but leave it EMPTY.
2. Reload (F5). PASS: Involvement card still rendered (has content), its chip absent (6→ still 6? — chips = 7−shown = 6: coursework chip must be BACK, involvement chip gone → exactly 6 chips incl. Coursework); Coursework card GONE (added-but-empty resets — expected behavior).
3. Delete the involvement entry, reload. PASS: Involvement card gone again, chip back (7 chips).

## T4 Hidden entries keep card visible (R141/R142 interplay)
Add award "ZZAWARD R144" (via chip → card → Add award), hide it via its eye toggle. Reload. PASS: Awards & honors card still rendered (dimmed entry + Hidden line), its chip absent; preview contains zero ZZAWARD leaf nodes (form-only).

## T5 All 7 shown → add-card disappears
Click all remaining chips one by one. PASS: after last chip, "Add a section" card unmounts entirely (no Card with "Add a section" text). Reload → empty ones vanish, add-card back.

## T6 Jump paths
1. Preview click on Awards section (has content? hidden-only → preview omits it; use Involvement with a visible entry instead): click the section title in preview. PASS: editor scrolls to that card.
2. ATS Fix→ to a gated section: inspect rendered ATS checks; if none targets one of the 7 optional sections, mark untested (expected — checks target core sections).

## T7 Undo/redo semantics
With body focused after clicking a chip (mount = not a resume edit): PASS: Undo button disabled state unchanged by chip click (mounting adds no history entry); adding an entry then Ctrl+Z removes the entry (normal edit) but card stays mounted (still in addedSections → card remains with zero entries).

## T8 R143 regression (quick)
Hide Phone via contact eye. PASS: HIDDEN tag + phone gone from preview contact line; un-hide restores.

## T9 375px
Emulate 375 + reload. PASS: chips rendered with height ≥40px (min-h-10), fully in viewport; tap a chip mounts its card; scrollWidth ≤ innerWidth. Screenshot.

Cleanup: clear emulation (kill holder first); restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]. No share/AI/payment.
