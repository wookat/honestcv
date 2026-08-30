# R58 — Cross-link the tool landing pages from /ai/ and the landing product-suite cards

## First-hand evidence (2026-08-29, ~/audit-r1/shots-r58/)

- Rezi home (`d-rezi-home.png`): every tool section on the homepage ("Find real open jobs", "Your AI powered resume agent", "Mock interview") links out to its own dedicated page; tools are densely cross-linked from body content, not just nav/footer.
- RezUp `/ai/` (`d-rezup-ai.png`): Ability 4 is the only place the career documents appear and it
  - still says "The Career Bundle adds …" — stale monetization framing while FREE_MODE beta copy elsewhere says every AI tool is free;
  - never mentions the resignation letter at all;
  - links nowhere — the R57 tool landing pages exist but get zero body-content internal links (only header dropdown + footer).
- RezUp home (`d-rezup-home.png`): the R34 "More than a resume builder" cards for Cover letters and Interview prep CTA to bare `/builder` — the user lands in the editor and must find the tool themselves, even though `?doc=` deep links exist (R33/R38) and the R57 landing pages explain each tool.

## Gap classification

Landing page / information architecture, P2. The R57 pages are only reachable via nav/footer; body-content cross-links are how Rezi routes users (and link equity) to tool pages.

## Scope (small, honest)

1. `scripts/build-seo.mjs` `/ai/` Ability 4:
   - retitle to "Cover letters, interview prep & resignation letters";
   - rewrite copy without "Career Bundle adds" framing (capabilities are part of the builder; pricing lives on /pricing/);
   - add a links line under each ability where a dedicated page exists → the three R57 tool pages.
2. `src/pages/Landing.tsx` SUITE cards:
   - Cover letters CTA → `/builder?doc=cover`; Interview prep CTA → `/builder?doc=interview` (opens the tool directly);
   - add secondary "How it works" links on those two cards → `/cover-letter-generator/`, `/interview-prep/`.

## Not doing

- No new pages, routes, storage, or AI endpoints.
- No fake social proof or tools we don't have.
- Not adding a resignation-letter card to the landing suite grid (grid is a curated 4; resignation letter is reachable via footer/nav/tool page).

## Verification

- npm run lint / tsc -b / npm run build green; deploy.
- Production QA at 1440px & 375px: /ai/ ability-4 copy + three links work; landing suite CTAs open the right builder tool; "How it works" links land on tool pages; no overflow; console clean.
