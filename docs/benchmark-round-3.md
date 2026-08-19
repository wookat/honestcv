# Benchmark Round 3 — 2026-08-05

Scope this round: complete the Kickresume deep-dive that was blocked in Round 1 (temp-mail
activation never arrived), plus re-assess per-line parity after the R3 ship
(8 templates, ATS checker sub-scores, template pSEO, mobile polish).

## 1. Kickresume deep-dive (authenticated, full core flow)

Method: registered a real account with a custom-domain mailbox
(`cvbench@zalize.com` → Cloudflare Email Routing → KV inbox). Activation email arrived in
<15 s; account activated and full flow walked on the FREE plan. No payment made.

### Signup & onboarding
- Email+password signup, mandatory ToS checkbox, activation link required before use.
- Onboarding funnel: LinkedIn import → upload resume → **"Create a new resume with AI"**.
- AI onboarding asks ONLY name + job title, then generates a complete first draft
  (summary, 5 experience bullets, skills, strengths) in ~20 s.
- **Key finding: the AI draft is fully fabricated.** From "Jordan Blake / Marketing
  Manager" it invented "led a team of 10", "35% traffic increase", "boosted online sales
  by 20%", "open rates by 25%" — all fictional metrics presented as fact. RezUp's
  anti-fabrication prompt (facts only from user input, `[add %]` placeholders) is a real,
  demonstrable differentiator ("honest" brand narrative writes itself).
- Aggressive upsell from minute one: Intercom popup "24 HOURS ONLY 20% OFF", countdown
  banner on every page.

### Editor
- Section-based editor (Personal Info / Profile / Work Experience / Skills / Strengths +
  16 addable section types incl. Graphs, Social Media, References).
- Live preview on the right with big "PREVIEW" watermark overlay text.
- Default AI-generated doc silently uses **3 Premium features** (Sharp template, IBM Plex
  Serif font, Skills/Strengths sections) — the free user is placed on premium content and
  told at download time. Dark-pattern-ish but effective monetization.
- Undo/redo present; autosave with "Saved" indicator (parity with RezUp R2).

### ATS scoring
- "Improve" tab shows ATS Score 89/100 with sub-metrics: **Design 100 / Structure 77 /
  Content 28**. Detailed breakdown, repetitive-verbs check.
- Anything past the headline numbers ("more in-depth resume feedback", ATS Analytics) is
  Premium-gated.
- Note the scoring is generous: a fully AI-fabricated resume with no JD scores 89.
  RezUp's structure+keyword decomposition (now shown in-app and on /ats-checker) is
  comparable in transparency to Kickresume's free tier.

### Export / paywall
- Free plan: **no PDF download at all.** Options: "Download Preview" (PNG, first page
  only) and "Export Text Only". PDF / Save to Cloud / Send to Email are "Upgrade to
  unlock".
- Preview PNG is clean (no watermark) but PNG + first-page-only makes it unusable for
  real applications.
- Pricing (perpetual "20% off limited time" banner): Monthly $19.20 (list $24),
  Quarterly $14.40/mo, Yearly $6.40/mo — subscription only, no one-time tier.
- RezUp free-mode comparison: we give real, unwatermarked PDF + DOCX for an email —
  strictly more generous than Kickresume free, and the eventual $9.99 one-time price
  undercuts their monthly.

## 2. R3 ship recap (all live-verified on cv.zalize.com)

- 8 templates (added Minimal/Bold/Elegant/Engineer) with headerAlign/nameCase axes
  honored in preview, PDF and DOCX.
- /ats-checker now shows keyword-match and structure sub-scores (+hint when no JD).
- 4 new template pSEO pages; sitemap now 22 URLs, IndexNow submitted (HTTP 200).
- Mobile walkthrough @420px passed; two polish items fixed post-walkthrough (accent
  swatches wrap as a grouped unit; reorder/delete touch targets h-9 on mobile).

## 3. Per-line parity assessment (evidence-based)

| Line | vs competitors | Verdict |
| --- | --- | --- |
| Pricing/monetization | Free real PDF+DOCX vs Kickresume free (PNG 1st page), Zety ($1.95 trial trap), Resume.io/Rezi subs | **达标** — strictly more generous free tier + honest one-time model; nothing left to copy here |
| ATS scoring (free tier) | Kickresume free = headline + 3 sub-metrics; ours = total + keyword/structure sub-scores + matched/missing keywords + checks, incl. standalone shareable /ats-checker | **达标（免费档）** — deeper free detail than Kickresume/Zety free; premium-depth analytics (content scoring) remains a gap vs paid tiers |
| Templates | 8 vs Kickresume 40+/Zety 18+; ours are ATS-clean and axis-driven but visually narrower range (no photo/two-column/graphic styles) | 未达标 — quality comparable for ATS use-case, breadth clearly behind |
| Editor | Undo, reorder, import-from-text, accent color, final check — covers the core; lacks drag-and-drop, rich section types (16 in Kickresume), custom sections | 部分达标 — core flows equal, section flexibility behind |
| AI writing | Cannot re-verify: relay account still out of credit. Design-level differentiator confirmed this round (anti-fabrication vs Kickresume's invented metrics) | 待复测（外部资源） |
| Performance/polish | No console errors, mobile clean, fast Workers edge serving | 达标（无明显差距） |

## 4. Round 3 verdict & next round

- **两条线判定达标：定价/免费策略、免费档 ATS 评分**（依据见上表）。按老板规则，这两条线不再投入。
- Round 4 candidates (P1): template breadth (2-col ATS-safe variant, photo-optional
  header), custom/extra section types (certifications already exist; add projects
  reorder, custom section), drag-and-drop reorder, AI regression once relay is funded.
- Kickresume evidence: screenshots in session records (`ss_c9605dac`, `ss_3a598b81`,
  `ss_9084686a`, `ss_57c88765`, `ss_a44becd8`), preview PNG export.
