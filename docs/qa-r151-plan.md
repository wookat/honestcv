# R151 QA plan — sticky section navigator chip bar (commit db78ac3, bundles index-CxJOCAX1.js / Builder-3tm9_qvn.js)

Code evidence (src/pages/Builder.tsx): `SectionNav` @563 — `nav[aria-label="Resume sections"]`, classes `bg-background/85 sticky top-14 z-10 overflow-x-auto rounded-lg border px-1 py-1 backdrop-blur [scrollbar-width:none]`; chips `min-h-10 … sm:min-h-8`, active chip `bg-secondary text-foreground font-medium` + `aria-current="true"`, tracked by IntersectionObserver over `[data-section-anchor]` cards (rootMargin '-110px 0px -55% 0px'). navSections @858: Contact, Summary, Experience, Education, Projects, then OPTIONAL_SECTION_META filtered by sectionShown (Involvement, Coursework, Awards & honors, Publications, References, Military service, Agents order @468), then Skills, Custom. Chip click → jumpToSection @846 (sets mobilePane 'edit', adds optional key to addedSections, dispatches JUMP_EVENT → smooth scroll + ring flash + section opens). Section cards now `scroll-mt-28` (112px, was 64px) @545.

Fixture: standard mixed resume (contact/summary/3 roles/1 education/skills), no projects/optional content.

## S1 Bundle: hard refresh, assert exactly index-CxJOCAX1.js + Builder-3tm9_qvn.js; baseline storage clean.

## S2 Bar contents + stickiness (1600)
PASS: `nav[aria-label="Resume sections"]` exists at top of edit column; chip labels exactly ["Contact","Summary","Experience","Education","Projects","Skills","Custom"] (no optional chips — fixture has none). Scroll form down ~800px: nav's boundingClientRect.top stays ≈ 56 (top-14) and it is visibly overlaid above section content in screenshot (sticky). FAIL if it scrolls away.

## S3 Optional chip appears/disappears
Click "Awards & honors" button in the Add a section card (@4697 uses jumpToSection → addedSections). PASS: "Awards & honors" chip appears between Projects and Skills. (addedSections keeps it while empty this visit — expected.) Reload page → chip GONE (addedSections resets, no content). 

## S4 Chip click jumps
From top, click "Skills" chip. PASS: page smooth-scrolls, Skills & certifications card gets ring flash (screenshot during flash: ring-primary/60), card top lands BELOW the sticky bar (card.getBoundingClientRect().top ≥ nav bottom — scroll-mt-28 clears bar at 56+~42). Click "Education" chip → same for Education card. FAIL if card top hidden under bar (top < nav.bottom−2).

## S5 Scroll updates active chip
Scroll to Experience section (its card top near 120): PASS: Experience chip has aria-current="true" + bg-secondary (screenshot); scroll to Education → active moves to Education chip. FAIL if aria-current stays on first chip.

## S6 375px
Emulate 375: PASS: bar present in Edit tab, sticky under header on scroll; nav.scrollWidth > nav.clientWidth (horizontally scrollable) while document scrollWidth === 375 (no page overflow); chip computed min-height 40px (min-h-10 below sm); tap "Skills" chip → jumps to Skills card below bar. Switch to Preview tab → nav not visible (edit column hidden). No overlap with bottom Edit/Preview bar (nav is sticky top, trivially distinct — screenshot).

## S7 Regressions (quick)
- R125 preview section click → still jumps to matching editor section and card top clears the sticky bar.
- R150 audit popover: collapse Role 1 → chip ⚠, Tab focus shows popover with explanations (desktop).
- R144 Add a section card still renders optional-section buttons.

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"], fresh tab, innerWidth 1600. No AI/share/payment/export/delete.
