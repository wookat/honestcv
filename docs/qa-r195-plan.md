# R195 QA plan — location input prioritizes location-agnostic jobs (index-CnY5zafJ.js / Jobs-4QAm8eXa.js)

Code evidence: Jobs.tsx diff ~194-230 — isLocationAgnostic ('' | 'remote' | \b(worldwide|anywhere|global)\b), directMatches (location.includes(loc)), anywhereMatches (agnostic, not direct), applySort per group, shown = sorted(direct)+sorted(anywhere), anywhereStart index; render ~516-528 divider `<p class="bg-muted/60 …">Open to any location (N)</p>` inserted before item at anywhereStart, All tab + loc only.

## L1 Bundles
index-CnY5zafJ.js entry; Jobs-4QAm8eXa.js chunk.

## L2 Core split with "Europe" (1440, All tab)
Type "Europe" in the location input. Assert against raw job data (read the rendered rows + honestcv job list): every row above divider has location containing "europe" (case-insens); divider text exactly `Open to any location (N)` where N == count of rows below it == number of agnostic jobs not directly matching; every row below is agnostic ('', 'remote', or worldwide/anywhere/global); any job pinned to a non-matching region (e.g. USA-only) absent from BOTH groups. Fail if agnostic jobs are hidden (old behavior) or mixed above divider.

## L3 Sort independence
With "Europe" active, switch sort to Newest: direct group internally ordered by postedAt desc AND all direct rows still above divider; agnostic group ordered by postedAt desc below. Switch back to Relevance → groups reorder but never mix. (Best match if the option exists.)

## L4 Edge cases
- Location term with 0 direct matches but agnostic jobs (e.g. "Antarctica"… pick a term yielding no direct match): divider is the FIRST element of the list (anywhereStart=0), all rows below it.
- Term matching nothing at all (direct=0, and if impossible with agnostic present, construct via term that also excludes agnostic — else mark n/a): empty-state message shown, no divider.
- Clear input: single list, NO divider. Status tab (Saved): no divider even with loc set.

## L5 Dark + 375
Dark: divider legible (computed bg/text). 375: scrollWidth===visualViewport.width with divider visible.

## L6 Regression
Tracked job (applied, backdated 9d): R193 Next step + R194 "No update · 9d" pill/detail still render; R192 row toggle label Tracked.

## L7 Cleanup
Zero AI generation calls; final localStorage exactly ["honestcv.clientId","honestcv.qa"].
