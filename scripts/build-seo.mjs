/**
 * Build-time SEO pages: renders static HTML landing pages (comparison /
 * keyword pages) into dist/client/, plus sitemap.xml and robots.txt.
 * Static assets win over the SPA fallback, so crawlers get real HTML.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const SITE = 'https://cv.zalize.com'
const OUT_DIR = path.resolve(import.meta.dirname, '../dist/client')
// Launch/traffic mode: static pages advertise free downloads instead of pricing
const FREE_MODE = process.env.VITE_FREE_MODE !== 'false'
// Cloudflare Web Analytics beacon — zone auto-injection does not fire on Worker
// custom domains, so every static page includes it explicitly.
const BEACON =
  '<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token": "d3ace0c72c2f4a6f8b96f1e7f8fd4dac"}\'></script>'
// First-party pageview beacon (adblock-proof fallback; path only, no PII)
const FP_BEACON =
  '<script>try{if(localStorage.getItem("honestcv.qa")==="1")throw 0;var r="";if(document.referrer){var o=new URL(document.referrer).origin;if(o!==location.origin)r=o}navigator.sendBeacon("/api/hit",JSON.stringify({p:location.pathname,r:r}))}catch(e){}</script>'

const PAGES = [
  {
    slug: 'vs-zety',
    path: '/vs/zety',
    name: 'HonestCV vs Zety',
    title: 'HonestCV vs Zety — One-Time $9.99 vs a $25.95/4-Week Subscription',
    description:
      'Comparing HonestCV and Zety: Zety’s $2.70 trial auto-renews at ~$25.95 every 4 weeks. HonestCV charges $9.99 once — no subscription, no stored card, no cancellation maze.',
    h1: 'HonestCV vs Zety: pay once, or pay every four weeks?',
    intro:
      'Zety is a polished resume builder — but its pricing is built around a small “trial” fee that automatically converts into a recurring charge of roughly $25.95 every four weeks until you cancel. “Zety charged me” is one of the most-searched complaints in this category. HonestCV takes the opposite approach: everything is free to try, downloading costs $9.99 exactly once, and we never store your card for recurring billing.',
    bullets: [
      'HonestCV: $9.99 one-time. Zety: ~$2.70 trial that auto-renews at ~$25.95 / 4 weeks',
      'HonestCV never stores your card for recurring charges — there is nothing to cancel',
      'Free ATS match score before you pay; Zety keeps scoring behind the paywall',
      'No account required — your resume stays in your browser, not on our servers',
      'Real text-based PDF and genuine DOCX export, no watermark',
    ],
  },
  {
    slug: 'vs-livecareer',
    path: '/vs/livecareer',
    name: 'HonestCV vs LiveCareer',
    title: 'HonestCV vs LiveCareer — $9.99 Once vs Auto-Renewing Subscription',
    description:
      'LiveCareer uses the same trial-to-subscription model as Zety. HonestCV is a one-time $9.99 purchase: ATS templates, AI rewrites, PDF/DOCX export — and nothing to cancel.',
    h1: 'HonestCV vs LiveCareer: no trial traps here',
    intro:
      'LiveCareer (from the same company family as Zety) offers a cheap 14-day trial that converts to a recurring subscription unless you cancel in time. If you only need a resume for a few weeks of job hunting, a subscription makes no sense. HonestCV charges $9.99 exactly once, and every trust feature — the ATS score, the live preview, the editor — is free before you pay.',
    bullets: [
      'One-time $9.99 vs a recurring subscription you must remember to cancel',
      'Free ATS match score against any pasted job description',
      'AI rewrites that never invent employers, dates or metrics',
      'No account, no resume database — your data stays in your browser',
      '7-day money-back guarantee, no questions asked',
    ],
  },
  {
    slug: 'one-time-payment',
    path: '/resume-builder-one-time-payment',
    name: 'One-Time Payment Resume Builder',
    title: 'Resume Builder With One-Time Payment (No Subscription) — HonestCV',
    description:
      'Looking for a resume builder without a subscription? HonestCV is $9.99 one-time: ATS-friendly templates, free match score, AI rewrites, PDF & DOCX downloads. No auto-renewal, ever.',
    h1: 'A resume builder with a one-time payment — no subscription',
    intro:
      'Most big resume builders (Zety, LiveCareer, ResumeGenius…) run on trial-to-subscription pricing: a couple of dollars up front, then ~$24–26 every four weeks until you cancel. If you searched “resume builder one time payment”, you already know why that’s a problem. HonestCV is exactly what it says: build free, pay $9.99 once to download, own it forever.',
    bullets: [
      '$9.99 one-time for unlimited PDF + DOCX downloads and AI rewrites',
      '$19.99 Career Bundle adds AI cover letters and interview prep — still one-time',
      'Free before you pay: full editor, 4 ATS templates, live preview, ATS match score',
      'No account, no stored card, nothing to cancel',
      'Your resume lives in your browser — we don’t keep a copy',
    ],
  },
  {
    slug: 'ats-checker',
    path: '/free-ats-resume-checker',
    name: 'Free ATS Resume Checker',
    title: 'Free ATS Resume Checker — Match Score Against Any Job Description',
    description:
      'Check your resume against any job description for free. HonestCV computes an ATS keyword match score in your browser — no upload, no account, no email required.',
    h1: 'Check your ATS match score — free, no upload',
    intro:
      'Paste a job description and see instantly which keywords your resume matches and which are missing, plus structural checks ATS parsers care about (contact info, quantified bullets, standard sections). It all runs in your browser — your resume is never uploaded, and you don’t need an account or email to see your full score.',
    bullets: [
      'Keyword match against the exact job posting, computed locally',
      'Structural checks: standard sections, quantified achievements, contact info',
      'Completely free — the score is never behind a paywall',
      'Fix gaps in the built-in editor with AI rewrites (5 free)',
      'Download the finished resume as PDF/DOCX for a one-time $9.99',
    ],
    cta: '/ats-checker',
    ctaLabel: 'Open the free ATS checker',
  },
  {
    slug: 'vs-resumeio',
    path: '/vs/resume-io',
    name: 'HonestCV vs Resume.io',
    title: 'HonestCV vs Resume.io — One-Time Purchase vs a Recurring Subscription',
    description:
      'Resume.io charges a small trial fee that converts to a recurring subscription. HonestCV is a one-time purchase: ATS templates, AI rewrites, free match score, PDF/DOCX export.',
    h1: 'HonestCV vs Resume.io: buy your resume, don’t rent it',
    intro:
      'Resume.io is one of the most popular resume builders, and like most of the category it monetizes through a low-cost 7-day trial that automatically converts into a recurring subscription (its pricing page currently lists $29.95/month) unless you cancel in time. If you only need a resume for a few weeks of applications, that pricing model works against you. HonestCV is the opposite: the editor, templates and ATS match score are free, and downloading is a one-time purchase — there is never anything to cancel.',
    bullets: [
      'One-time purchase vs a ~$29.95/month auto-renewing subscription',
      'Free ATS match score against any pasted job description — before paying anything',
      'No account required; your resume lives in your browser, not a server database',
      'AI rewrites that sharpen your real experience without inventing anything',
      'Real text-based PDF and genuine DOCX export, no watermark',
    ],
  },
  {
    slug: 'vs-resumegenius',
    path: '/vs/resume-genius',
    name: 'HonestCV vs Resume Genius',
    title: 'HonestCV vs Resume Genius — No 14-Day Trial That Auto-Renews',
    description:
      'Resume Genius uses a 14-day trial that converts to ~$23.95 every 4 weeks. HonestCV has no subscription at all: build free, download with a single one-time purchase.',
    h1: 'HonestCV vs Resume Genius: skip the trial-to-subscription funnel',
    intro:
      'Resume Genius advertises a 14-day full-access trial for a couple of dollars — and if you don’t cancel in time, it converts to roughly $23.95 every four weeks. Thousands of “resume genius charged me” complaints exist for exactly this reason. HonestCV never takes your card for a trial: everything except downloading is free forever, and downloading is one single payment with nothing to cancel afterwards.',
    bullets: [
      'No trial, no auto-renewal, no stored card — one payment and you own it',
      'ATS keyword match score is free, before you decide to pay',
      'Single-column, parser-friendly templates that real ATS systems read cleanly',
      'AI cover letter and interview prep available in the Career Bundle',
      '14-day money-back guarantee, no questions asked',
    ],
  },
  {
    slug: 'vs-kickresume',
    path: '/vs/kickresume',
    name: 'HonestCV vs Kickresume',
    title: 'HonestCV vs Kickresume — Free Real PDF Export vs a PNG Preview',
    description:
      'We tested Kickresume ourselves: the free tier only exports a PNG of your first page, and full access runs ~$19–24/month. HonestCV gives you real PDF & DOCX downloads with no subscription.',
    h1: 'HonestCV vs Kickresume: a real PDF beats a PNG preview',
    intro:
      'We signed up for Kickresume and ran the full flow ourselves (August 2026). The editor is slick, but the free tier will not give you a usable resume: PDF download is locked, and the only free export is a PNG image of your first page — which ATS systems cannot parse. Full access is a subscription at roughly $19–24 per month. We also found its AI writer happily invents metrics (percentages and dollar figures) it cannot know about you. HonestCV exports real, text-based PDF and DOCX files, scores your resume against the actual job description for free, and its AI never fabricates facts — it marks gaps for you to fill instead.',
    bullets: [
      'HonestCV: real text-based PDF + DOCX export. Kickresume free tier: PNG image of page one only',
      'No subscription vs ~$19–24/month for full access',
      'Free ATS match score against any pasted job description',
      'AI that never invents employers, dates or metrics — Kickresume’s AI generated fictional “35%” style achievements in our test',
      'No account needed; your resume stays in your browser',
    ],
  },
  {
    slug: 'vs-rezi',
    path: '/vs/rezi',
    name: 'HonestCV vs Rezi',
    title: 'HonestCV vs Rezi — Free ATS Scoring Without the Free-Tier Limits',
    description:
      'We tested Rezi ourselves: the free tier caps you at 1 resume, 3 PDF downloads, 10 AI generations and 1 template; DOCX is paywalled. HonestCV has none of those limits and no subscription.',
    h1: 'HonestCV vs Rezi: what the free tier actually lets you do',
    intro:
      'We registered for Rezi and ran the full flow ourselves (August 2026). It is a polished product — the Rezi Score and keyword targeting are genuinely good. But the free tier is tightly rationed: one resume, three PDF downloads, ten AI generations, one template (the other ten are Pro-locked), and DOCX export sits behind a hard paywall. Full access is a subscription at $29/month (or $149 lifetime). HonestCV takes the opposite approach: unlimited resumes and downloads, real text-based PDF and DOCX export, a free ATS match score against any job description you paste, and 12 templates you can switch between freely — with your data staying in your browser instead of an account.',
    bullets: [
      'No caps: Rezi free tier = 1 resume, 3 PDF downloads, 10 AI generations, 1 of 11 templates; DOCX paywalled',
      'No subscription vs $29/month (or a $149 lifetime plan)',
      'Free ATS match score with matched & missing keywords against any pasted job description',
      'All 12 ATS-safe single-column templates included — switch any time without retyping',
      'No account needed; your resume stays in your browser',
    ],
  },
  {
    slug: 'vs-teal',
    path: '/vs/teal',
    name: 'HonestCV vs Teal',
    title: 'HonestCV vs Teal — A Focused Resume Builder vs $13/week Upsells',
    description:
      'We tested Teal ourselves: a capable free tier inside a job-search platform, monetized by weekly-billed subscriptions (~$13/week) and paywalled optimization details. HonestCV is a focused, no-subscription resume builder.',
    h1: 'HonestCV vs Teal: focused resume building vs a weekly-billed platform',
    intro:
      'We registered for Teal and ran the full flow ourselves (August 2026). Credit where due: Teal’s free tier is one of the most generous — unlimited resumes, watermark-free PDF export, ten templates. But it is a whole job-search platform, and its business model is a subscription billed from about $13 per week, with the monthly plan pre-selected at checkout and the useful depth (analyzer suggestion details, the full keyword comparison list, unlimited AI) locked behind it. In our test its AI also invented a fictional “30%” metric the resume never contained. HonestCV is deliberately narrower: just an honest resume builder with free ATS scoring including the full missing-keyword list, AI that refuses to fabricate facts, real PDF and DOCX export, and no subscription of any kind.',
    bullets: [
      'No subscription vs ~$13/week billing (monthly plan pre-selected at checkout)',
      'Full ATS keyword comparison free — Teal locks the complete missing-keyword list behind Teal+',
      'AI that never invents metrics — Teal’s AI added a fictional “30%” figure in our test',
      'Real text-based PDF and DOCX export, unlimited downloads',
      'No account needed; your resume stays in your browser',
    ],
  },
  {
    slug: 'vs-flowcv',
    path: '/vs/flowcv',
    name: 'HonestCV vs FlowCV',
    title: 'HonestCV vs FlowCV — One-Time Pricing and Browser-Local Privacy',
    description:
      'We tested FlowCV ourselves: a genuinely generous free tier (1 resume, unlimited PDF downloads) with $3–5/month subscriptions on top. HonestCV differs on privacy (browser-local, no account) and one-time pricing.',
    h1: 'HonestCV vs FlowCV: two honest builders, two different trade-offs',
    intro:
      'We registered for FlowCV and ran the full flow ourselves (August 2026) — and credit where due: it is one of the fairest products in this category. The free plan really is free: one resume, unlimited watermark-free PDF downloads, all templates, and clear auto-renewal disclosure on its cheap paid tiers (Basic $3/month and Pro $5/month, billed yearly). The differences are structural. FlowCV requires an account and a verified email before any download, renders your PDF on its servers (the exported file’s metadata shows server-side Chromium), and caps the free plan at a single resume. HonestCV needs no account, keeps your resume data in your browser and generates the PDF locally on your machine, lets you keep unlimited tailored copies, and charges once instead of a subscription — currently in beta with a full free trial.',
    bullets: [
      'No account or email verification needed to download — FlowCV gates every download behind a verified account',
      'Your resume never leaves your browser: local PDF/DOCX generation vs FlowCV’s server-side rendering',
      'Unlimited saved resume copies free — FlowCV’s free plan stores exactly one resume',
      'One-time pricing ($9.99/$19.99 when billing opens) vs an auto-renewing subscription ($3–5/month billed yearly)',
      'Free ATS match score against any pasted job description built into the editor',
    ],
  },
  {
    slug: 'vs-novoresume',
    path: '/vs/novoresume',
    name: 'HonestCV vs Novorésumé',
    title: 'HonestCV vs Novorésumé — Free Limits, Privacy and Pricing Compared',
    description:
      'We registered for Novorésumé and ran the full flow ourselves: free plan allows 1 single-page resume with free PDF download; Premium is $21.99/month or $139.99/year (non-recurring). HonestCV differs on privacy, unlimited copies and one-time pricing.',
    h1: 'HonestCV vs Novorésumé: what we found testing it ourselves',
    intro:
      'We created a Novorésumé account and walked its full flow (August 2026). Credit where due: the free Basic plan really does let you download a watermark-free PDF, its pre-download review flags real ATS issues, and Premium ($21.99/month, $39.99/quarter or $139.99/year) is explicitly non-recurring — no auto-renewal trap. The limits are structural: Basic stores exactly one resume, capped at a single page, with no cover letter and only predefined layouts; downloads are gated behind an account with email code verification; and your resume lives on their servers, with the PDF rendered server-side. HonestCV needs no account, keeps your resume in your browser and generates the PDF and DOCX locally, allows unlimited pages and unlimited saved copies, and includes cover letter and interview-prep tools — one-time pricing, currently in beta with a full free trial.',
    bullets: [
      'No account or email code needed to download — Novorésumé gates downloads behind a verified account',
      'Your resume never leaves your browser: local PDF/DOCX generation vs server-side rendering',
      'Unlimited saved resume copies and pages free — the free Basic plan stores one single-page resume',
      'DOCX and plain-text export included — Novorésumé exports PDF or TXT only',
      'One-time pricing ($9.99/$19.99 when billing opens) vs $21.99/month Premium (non-recurring, to its credit)',
    ],
  },
  {
    slug: 'vs-enhancv',
    path: '/vs/enhancv',
    name: 'HonestCV vs Enhancv',
    title: 'HonestCV vs Enhancv — Branding, Privacy and Pricing Compared',
    description:
      'We signed up for Enhancv and ran its full flow ourselves: free downloads carry a "Powered by Enhancv" footer, the ATS keyword check is free but full suggestions are paywalled, and Pro runs $16.50–$39/month. HonestCV differs on branding-free exports, privacy and one-time pricing.',
    h1: 'HonestCV vs Enhancv: what we found testing it ourselves',
    intro:
      'We created an Enhancv account and walked its full flow (August 2026). Credit where due: its guided chat-style onboarding is smooth, the free plan really does export a PDF and a TXT file, and its job-description match check with a per-keyword frequency table is genuinely useful — we liked that pattern enough to build our own version into HonestCV\u2019s free ATS checker. The catches: every free PDF carries a "Powered by Enhancv" branding footer (branding-free export is a paid feature), the resume grade and ATS suggestions are mostly behind an "Unlock Full Report" paywall, saving or downloading requires an account with email code verification, your resume lives on their servers, and Pro is a recurring subscription at $39/month, $23/month billed quarterly, or $16.50/month billed semiannually. HonestCV keeps your resume in your browser, renders PDF/DOCX/TXT locally with no branding at any tier, and shows the whole ATS report free — one-time pricing, currently in beta with a full free trial.',
    bullets: [
      'No branding footer on any export — Enhancv\u2019s free PDFs print "Powered by Enhancv" at the bottom',
      'Full ATS report free, including every suggestion — Enhancv paywalls the full report behind Pro',
      'Your resume never leaves your browser: local PDF/DOCX/TXT generation vs server-side rendering',
      'No account or email code needed to download — Enhancv gates save/download behind a verified account',
      'One-time pricing ($9.99/$19.99 when billing opens) vs a $16.50–$39/month recurring subscription',
    ],
  },
]

/** Long-tail guide pages: real content, not thin doorway pages */
const GUIDES = [
  {
    path: '/guides/ats-friendly-resume',
    title: 'How to Make Your Resume ATS-Friendly in 2026 — Practical Checklist',
    description:
      'A practical checklist for getting your resume through Applicant Tracking Systems: layout rules, keyword matching, section headings, file formats, and what to avoid.',
    h1: 'How to make your resume ATS-friendly (2026 checklist)',
    sections: [
      ['Use a single-column layout', 'ATS parsers read top-to-bottom, left-to-right. Multi-column layouts, text boxes, tables and graphics frequently scramble the parse order or get dropped entirely. A clean single-column layout with clear headings is the safest format — it’s why every HonestCV template is single-column.'],
      ['Keep section headings standard', 'Parsers look for headings like “Experience”, “Education” and “Skills”. Creative headings (“My journey”, “What I bring”) can cause whole sections to be misfiled or skipped. Boring headings win.'],
      ['Mirror the job description’s keywords', 'Most ATS screening is keyword matching against the job posting. Paste the posting next to your resume and make sure the concrete skills and tools it names appear in yours — in the same wording. A free checker like our ATS match score shows exactly which keywords are missing.'],
      ['Export as real text, not an image', 'Your PDF must contain selectable text. Screenshots, scanned documents, or design-tool exports that flatten text to outlines are unreadable to parsers. Test: if you can’t select and copy text in your PDF, neither can the ATS.'],
      ['Quantify your achievements', 'Numbers survive both parsers and recruiters: “cut deploy time 40%” beats “improved deployment process”. Aim for at least half your bullets to include a number, %, or $ figure.'],
      ['Skip the photo, graphics and icons', 'In the US/UK/Canada market, photos are discouraged (bias policies) and graphics are parser hazards. Icons for phone/email often replace the actual text — make sure your contact details are typed out.'],
      ['PDF vs DOCX: which to send', 'Send PDF unless the posting explicitly asks for Word. Modern parsers read text-based PDFs reliably, and PDF locks your layout; DOCX can reflow on the reviewer’s machine. When a portal insists on .doc/.docx, export DOCX rather than renaming a PDF — the extension must match the real format.'],
      ['Write dates the boring way', '“Mar 2021 – Present” or “03/2021 – Present” parse everywhere. Seasons (“Spring 2021”), typographic ornaments, or dates buried mid-sentence can break the experience timeline some ATS build. Keep one consistent date format for the whole resume.'],
      ['Spell out acronyms once', 'Postings vary between “SEO” and “search engine optimization”, “PM” and “product manager”. Include the spelled-out form and the acronym on first use — you match both variants without stuffing.'],
      ['Don’t fear the ATS — fear the generic resume', 'ATS rarely auto-reject structurally sound resumes; the common failure is a human running a keyword search and your resume missing the terms. Tailoring beats tricks: two minutes matching your skills section to the posting outperforms any formatting hack.'],
      ['Test your resume like a parser would', 'Copy-paste your exported file into a plain-text editor: if sections come out in order with readable headings and dates, a parser will cope. Or run it through our free ATS checker, which parses your actual file in the browser and scores structure and keywords separately.'],
      ['The checklist', 'Single column · standard headings · posting keywords in your wording · real-text export · quantified bullets · no photo/graphics · consistent dates · acronyms spelled out once · tested against the actual job description. That is the whole game — everything else is typography.'],
    ],
  },
  {
    path: '/guides/resume-summary-examples',
    title: 'Resume Summary Examples That Work in 2026 (+ Formula)',
    description:
      'A simple formula for writing a resume summary, with concrete examples for engineers, marketers, and career changers — and the mistakes that make recruiters skip yours.',
    h1: 'Resume summary examples that actually work',
    sections: [
      ['The 3-line formula', 'Line 1: who you are professionally (title + years + specialty). Line 2: your one or two most impressive, quantified achievements. Line 3: what you’re aiming to do for the employer you’re applying to. Three sentences, no fluff, tailored per application.'],
      ['Engineer example', '“Backend engineer with 6 years building payment infrastructure in Go and Postgres. Led a migration that cut transaction latency 45% while scaling to 3M daily transactions. Looking to bring reliability-first engineering to a fintech platform team.”'],
      ['Marketer example', '“Growth marketer with 4 years in B2B SaaS. Built an SEO program that grew organic signups from 200 to 2,400/month and cut CAC 38%. Seeking to own full-funnel growth at an early-stage product.”'],
      ['Career changer example', '“Former teacher transitioning to UX research after a one-year intensive program and three shipped client studies. Ran usability tests with 40+ participants; findings drove a 25% task-completion improvement. Aiming to bring classroom-honed user empathy to a product research team.”'],
      ['Mistakes that get summaries skipped', 'Buzzword strings with no evidence (“results-driven team player”), first person pronouns everywhere, restating your whole career, and one generic summary used for every application. Recruiters spend ~7 seconds here — make each word earn its place.'],
      ['Let AI polish, not fabricate', 'An AI rewrite should tighten your real accomplishments, not invent new ones — fabricated metrics fall apart in interviews. HonestCV’s AI is explicitly constrained to never invent employers, dates, degrees or numbers.'],
      ['New grad example', '“Computer science graduate (May 2026) with three internships across fintech and healthtech. Built a claims-triage prototype during my capstone that the sponsor deployed to 200 internal users. Seeking a backend role where I can own services end to end.” No years-of-experience claim — internships and the capstone do the work.'],
      ['Manager example', '“Engineering manager leading a 9-person platform team for 3 years, after 5 as an SRE. Cut incident volume 60% by rebuilding the on-call and postmortem process; retained every senior engineer through two reorgs. Looking to scale reliability practices across a multi-team org.” Management summaries prove scope (team size, tenure) and people outcomes, not just technical ones.'],
      ['Sales example', '“Enterprise AE with 7 years selling data infrastructure, the last 3 at 120–140% of quota. Landed 11 new logos including two Fortune 500 accounts; average deal size $280k. Aiming to open a new territory for a technical product.” Sales summaries live on quota attainment, deal size and logo quality.'],
      ['Summary vs objective', 'A summary states evidence; an objective states a wish (“seeking a challenging position…”). Objectives only earn their space when the reader genuinely needs context — a career change or a return after a gap. Everyone else should lead with proof. See our objective-vs-summary guide for the full breakdown.'],
      ['Tailor line 3 per application', 'Lines 1–2 are stable; line 3 should name the direction of the company you’re applying to (“…reliability-first engineering to a fintech platform team”). One minute of editing per application, and it reads as written for them — because it was.'],
      ['When to skip the summary entirely', 'If your last title, employer and top bullet already say exactly what the summary would, the summary is redundant — very early career resumes and internal transfers often do better using the space for one more quantified bullet.'],
    ],
  },
  {
    path: '/guides/resume-keywords',
    title: 'How to Find and Use Resume Keywords (Without Keyword Stuffing)',
    description:
      'Where resume keywords come from, how ATS matching actually works, and how to add keywords naturally — with a free tool to check your match score against any job posting.',
    h1: 'Resume keywords: how to find them and use them right',
    sections: [
      ['Keywords come from the job posting, not a master list', 'Every ATS screen is a comparison between your resume and one specific job description. Generic “top resume keywords” lists are mostly noise — the keywords that matter are the concrete skills, tools and qualifications named in the posting in front of you.'],
      ['Hard skills beat soft skills', 'Parsers match concrete nouns best: “PostgreSQL”, “Google Ads”, “GAAP”, “Kubernetes”. Soft skills (“leadership”, “communication”) are matched too, but carry less weight and are easy to overdo.'],
      ['Use the exact wording', 'If the posting says “customer relationship management (CRM)”, include both the phrase and the acronym. Parsers are literal: “CRM” alone may not match “customer relationship management”.'],
      ['Where to place keywords', 'The skills section is the easiest match, but keywords embedded in experience bullets carry more credibility with the human reader who comes after the ATS. Best practice: skills section for coverage, bullets for proof.'],
      ['Don’t stuff', 'White-text keywords, keyword walls, or repeating a term ten times can get you auto-flagged and looks desperate to recruiters. Match honestly: if a required skill is missing from your background, address it in the cover letter instead.'],
      ['Check your match before applying', 'Paste your resume and the job description into our free ATS checker to see your match score, matched keywords and missing keywords — it runs entirely in your browser, no upload, no signup.'],
      ['How to extract keywords in five minutes', 'Read the posting twice and highlight every concrete noun: tools, languages, certifications, methodologies, regulations. The requirements and responsibilities sections carry most of the weight; the company-blurb paragraphs carry almost none. Ten to fifteen terms is a typical haul.'],
      ['Prioritize: required beats preferred', 'Terms under “requirements” or repeated multiple times in the posting matter most; “nice to have” items are tiebreakers. If you can only work five keywords in honestly, make them the five the posting insists on.'],
      ['Job titles are keywords too', 'Recruiters search by title. If your official title was unusual (“Customer Happiness Engineer III”), add the standard equivalent in parentheses — “(Customer Support Engineer)” — so both the ATS and the human find you. Never replace the real title; annotate it.'],
      ['Certifications and credentials match literally', 'Postings that require “PMP”, “CPA”, “RN” or “AWS Certified Solutions Architect” are usually screened with exactly those strings. List credentials in a dedicated section with the exact official name — abbreviations and full names both.'],
      ['Keywords age out — re-extract per application', 'A keyword set built for one posting quietly decays: the next posting names a different stack, a different methodology, different compliance regimes. Re-run the extraction for every application; it is five minutes that beats hours of interviews never granted.'],
      ['Missing a required keyword honestly', 'If the posting demands a skill you genuinely lack, don’t plant it in your skills list — screeners follow up on every listed skill. Name the nearest real skill (“Terraform” when they ask for “Pulumi”), and let the cover letter address the gap directly.'],
    ],
  },
  {
    path: '/guides/resume-action-verbs',
    title: 'Resume Action Verbs That Actually Work in 2026 (by Category)',
    description:
      'Strong action verbs for leadership, engineering, sales, analysis and communication bullets — plus the tired verbs to cut and how to pair verbs with numbers.',
    h1: 'Resume action verbs that actually work',
    sections: [
      ['Why the first word of every bullet matters', 'Recruiters scan bullets left to right and often read only the first few words. A concrete action verb (“Reduced”, “Launched”, “Negotiated”) tells them instantly what you did; a filler opener (“Responsible for”, “Helped with”, “Worked on”) tells them nothing and wastes your strongest position.'],
      ['Leadership & management', 'Led, Directed, Coordinated, Mentored, Delegated, Unified, Chaired, Restructured. Pair with scope: “Led a 7-person on-call rotation across 3 time zones” beats “Led a team”.'],
      ['Building & engineering', 'Built, Designed, Implemented, Automated, Migrated, Optimized, Refactored, Shipped. Pair with outcome: “Automated invoice matching, saving 12 hours/week” beats “Automated processes”.'],
      ['Growth, sales & impact', 'Grew, Increased, Reduced, Generated, Closed, Negotiated, Converted, Accelerated. These verbs demand a number — “Grew organic traffic 3×” or “Closed $1.2M in new ARR”. A growth verb without a metric reads as evasive.'],
      ['Analysis & communication', 'Analyzed, Forecasted, Modeled, Presented, Authored, Translated, Synthesized, Advised. Best for consulting, finance and research bullets where the deliverable is insight rather than software.'],
      ['Verbs to cut', '“Responsible for”, “Tasked with”, “Assisted”, “Participated in”, “Utilized”, “Various duties”. They are passive, vague, or both. Rewrite: “Responsible for onboarding” → “Onboarded 30+ enterprise customers with a 95% activation rate”. One quantified bullet outworks five vague ones.'],
      ['Operations & process', 'Streamlined, Standardized, Consolidated, Scheduled, Audited, Reconciled, Expedited, Overhauled. Operations bullets live or die on before/after: “Overhauled the returns workflow, cutting turnaround from 9 days to 2” shows the process and the payoff in one line.'],
      ['Design, content & product', 'Designed, Prototyped, Authored, Produced, Localized, Rebranded, Storyboarded, Curated. Attach the audience or reach: “Produced onboarding videos watched by 40k new users” or “Rebranded the newsletter, lifting open rate from 18% to 31%”.'],
      ['Support, healthcare & service', 'Treated, Triaged, Counseled, Resolved, De-escalated, Trained, Administered, Advocated. Volume and quality metrics both work: “Resolved 60+ tickets/week with a 4.9/5 CSAT” or “Triaged intake for a 30-bed unit”.'],
      ['Don’t repeat the same verb', 'Two bullets in the same job starting with “Led” read as padding. Vary within the same family — Led / Directed / Chaired / Coordinated — and reserve your strongest verb for your strongest result. Our builder’s bullet-quality check flags weak openers as you type.'],
      ['Match the verb to the posting', 'Job descriptions telegraph the verbs they want: a posting that says “drive adoption” rewards “Drove”, one that says “own the roadmap” rewards “Owned”. Mirror the posting’s verbs where they’re true of your work — that is exactly what keyword-matching ATS screens reward.'],
      ['The verb is a promise the number keeps', 'A strong verb sets up an expectation; the metric pays it off. “Reduced” demands “by how much?”, “Launched” demands “to whom?”. If you can’t finish the sentence with a concrete fact, choose a verb you can back up — never invent the number.'],
    ],
  },
  {
    path: '/guides/how-long-should-a-resume-be',
    title: 'How Long Should a Resume Be in 2026? (One Page vs Two, Decided)',
    description:
      'The one-page rule, when two pages are correct, what recruiters and ATS systems actually do with length, and concrete ways to cut a resume down without losing impact.',
    h1: 'How long should a resume be?',
    sections: [
      ['The short answer', 'One page for under ~10 years of experience; two pages when you genuinely need them (10+ years, senior/leadership scope, or technical roles with substantial relevant projects). Almost never three — a CV for academia is a different document.'],
      ['What recruiters actually do', 'Screeners spend roughly 6–8 seconds on a first pass. Length itself isn’t scored, but density is: a tight one-pager concentrates your best material where it will actually be read. Page two gets read only after page one earns it.'],
      ['ATS systems don’t care — parsers do', 'No mainstream ATS rejects a resume for being two pages. The real length-related risk is structural: cramming with tiny fonts, dual columns or tables to force one page breaks parsing. A clean two-pager beats a hacked one-pager.'],
      ['When two pages are correct', 'You have 10+ years directly relevant to the target role; you manage scope worth describing (P&L, org size, portfolio); or the posting asks for depth (government, defense, some enterprise roles). Senior candidates who compress to one page often cut exactly the evidence hiring managers want.'],
      ['How to cut without losing impact', 'Drop roles older than ~15 years or compress them to one line. Cut bullets that describe duties rather than outcomes. Merge overlapping bullets and keep the quantified one. Trim your skills list to what the job posting names. Your summary earns three lines, not eight.'],
      ['The real rule', 'Every line must earn its place against one question: does this help this specific application? Length is an output of that filter, not a target. Write tight, tailor per posting, and the page count resolves itself.'],
      ['Length by career stage', 'Student/new grad: one page, no exceptions — a second page of coursework reads as padding. 3–10 years: one page, hard but correct. 10–20 years: one or two, driven by relevance not tenure. Executive: two pages with scope up top. Academic/research: that’s a CV — different document, different rules.'],
      ['The 1.5-page trap', 'A second page that’s one-third full looks unfinished and wastes the reader’s scroll. Either cut back to a dense single page or earn the full second page by restoring your strongest cut material — never pad, never leave it hanging.'],
      ['Don’t hack the layout to force a page count', 'Shrinking to 9pt, cutting margins to a quarter inch, or two-column cramming trades a cosmetic win for a reading and parsing loss. If it doesn’t fit at 10.5–12pt with normal margins, the problem is selection, not formatting.'],
      ['What to cut first, in order', 'References and “references available upon request” · objective statements · duties that any holder of the title obviously did · roles older than 15 years (or one line each) · skills the posting doesn’t mention · the third bullet that repeats the first two. Cut in that order and most two-pagers become strong one-pagers.'],
      ['Check the page count before you send', 'Exports paginate differently than editors — a resume that looked like one page can spill three lines onto page two. Our builder shows a live PDF page-count indicator as you edit, so you see the spill before the recruiter does.'],
      ['Length questions, answered', 'Can a resume be 1.5 pages? Avoid it — commit to one or two. Does a cover letter count? No, it’s separate. Do two-column resumes save space? They risk parsing order; keep one column. Is a 3-page resume ever right? Outside CVs and government formats, virtually never.'],
    ],
  },
  {
    path: '/guides/resume-with-no-experience',
    title: 'How to Write a Resume With No Work Experience (Students & Grads, 2026)',
    description:
      'A section-by-section plan for first resumes: what replaces work history, how to frame projects and coursework, and a structure recruiters and ATS parsers both accept.',
    h1: 'How to write a resume with no work experience',
    sections: [
      ['You have more material than you think', 'Course projects, hackathons, club leadership, volunteering, freelance gigs, open-source contributions, part-time and seasonal work all count. The question isn’t “have I been employed” — it’s “can I show evidence of skills the posting asks for”.'],
      ['Lead with education', 'With no work history, education goes first: degree, school, graduation date, plus GPA if it’s strong (3.5+), relevant coursework, honors and scholarships. Recent grads can keep this section rich; it shrinks later as experience grows.'],
      ['Turn projects into experience bullets', 'Write projects exactly like job bullets: action verb + what you built + measurable result. “Built a course-scheduling app in React used by 200+ students” reads like experience because it is experience — it just wasn’t salaried.'],
      ['Use a skills section that mirrors the posting', 'Entry-level screens lean heavily on keyword matching because there’s no work history to parse. Mirror the concrete skills the posting names (languages, tools, certifications) — and check your match with a free ATS checker before submitting.'],
      ['A summary beats an objective', 'Skip “Seeking a position where I can grow”. Write two lines of evidence: “CS graduate with three shipped web projects and a summer of freelance client work. Strongest in React and Python; built a data pipeline processing 1M+ rows for a research lab.”'],
      ['Keep the format boringly standard', 'One page, single column, standard headings (Education, Projects, Skills, Experience). First resumes fail screens for formatting far more often than for thin content — creativity belongs in your portfolio link, not the layout.'],
      ['Volunteering counts as experience', 'Structured volunteering — tutoring, event coordination, nonprofit social media, coaching — carries real responsibility and outcomes. Format it exactly like a job: organization, role, dates, and one or two quantified bullets. Screeners read it as experience.'],
      ['Freelance and informal work is work', 'Babysitting turned into a regular arrangement, mowing lawns for a client list, selling on Etsy, building a website for a family business — if you delivered something for someone repeatedly, list it under Experience with honest scope: “Freelance web designer — 4 client sites, 2023–2024”.'],
      ['Certifications fill the credibility gap', 'A concrete, verifiable credential — Google Analytics, AWS Cloud Practitioner, food-handler card, CPR, a language certificate — gives the screen something literal to match and shows initiative. One “Certifications” line; only real, completed ones.'],
      ['What to do while applying', 'Two weeks of effort can materially upgrade a thin resume: contribute a documented fix to an open-source project, build one small end-to-end project tied to your target role, or take on a measurable volunteer task. Then update the resume — the loop compounds.'],
      ['Mistakes that sink first resumes', 'High-school material after freshman year of college, listed skills you cannot demonstrate if asked, an objective statement instead of evidence, photos and skill bars, and padding a half-empty page with bigger fonts — recruiters recognize every one of these instantly.'],
      ['A worked skeleton', 'Contact → two-line evidence summary → Education (with coursework line) → Projects (2–3, quantified) → Experience (part-time/volunteer/freelance) → Skills → Certifications. Build it free in our editor and run the ATS check against each posting before you submit.'],
    ],
  },
  {
    path: '/guides/employment-gap-resume',
    title: 'How to Explain an Employment Gap on Your Resume (2026 Guide)',
    description:
      'When a resume gap needs explaining, when it doesn’t, date formats that de-emphasize short gaps honestly, and exact one-line framings for common situations.',
    h1: 'Employment gaps: what to say and where',
    sections: [
      ['Most gaps need less explanation than you fear', 'Post-2020, career gaps are normal: layoffs, caregiving, health, retraining, relocation. Screeners flag unexplained multi-year holes, not a few months between roles. Your job is to remove the mystery, not to apologize.'],
      ['Use years-only dates for short gaps — honestly', 'Formatting dates as “2021 – 2023” instead of “Nov 2021 – Jan 2023” de-emphasizes gaps under a year and is standard practice. What crosses the line is shifting dates to hide a gap — background checks verify employment dates, and a caught lie ends the process.'],
      ['Explain long gaps in one matter-of-fact line', 'For gaps over ~a year, add a one-line entry right in your experience section: “Career break — full-time caregiver (2022 – 2023)” or “Sabbatical — completed AWS certification and two freelance contracts (2023)”. Named plainly, it stops being a red flag.'],
      ['Fill the gap with what you actually did', 'Freelance projects, certifications, courses, volunteering and open-source work done during a gap belong on the resume as real entries with real bullets. A gap with visible activity reads as initiative, not absence.'],
      ['What to say in the interview', 'One calm sentence, then pivot forward: “I took 18 months to care for a parent; during that time I kept current with X, and I’m ready to get back to shipping.” No over-explaining, no apology spiral — interviewers take their cue from your tone.'],
      ['Don’t let one gap define the document', 'Recruiters weigh your strongest evidence first: quantified achievements, relevant skills, a tailored summary. Make those excellent and the gap becomes a footnote. Run your final draft through a free ATS check to make sure the substance, not the gap, leads.'],
      ['One-line framings for common situations', 'Layoff: “Position eliminated in company-wide restructuring (2023)”. Health: “Medical leave, fully resolved (2022)” — no details owed. Caregiving: “Career break — full-time caregiver (2022 – 2023)”. Relocation: “Relocated to Austin; secured work authorization (2023)”. Retraining: “Full-time study — completed X certification (2023)”.'],
      ['Currently in a gap? Anchor the present', 'An open-ended gap reads worse than a framed one. Give the present a name and an activity: “2024 – Present: Independent consulting / certification in progress / active caregiving”. A one-line current entry turns “unemployed since” into “doing X since”.'],
      ['Multiple gaps: pattern beats episode', 'Several short gaps usually need no comment; screeners read the overall trajectory. If your history is genuinely episodic (contract work, seasonal industries), label it structurally — “Contract Software Engineer (various clients, 2019 – 2023)” — one umbrella entry with client bullets beats six fragments.'],
      ['What never to do', 'Stretching end dates, inventing a consultancy that had no clients, listing a family business you didn’t work in, or paying for a fake reference service — all of these convert an ordinary gap into a fireable lie. The gap costs you some interviews; the lie costs you every offer it touches.'],
      ['Where the explanation lives', 'Resume: the one-line entry, nothing more. Cover letter: one factual sentence if the gap is recent and long. Interview: the calm sentence plus pivot. LinkedIn: use the built-in career-break entry so the profiles match. Consistency across all four is what screeners actually check.'],
      ['The gap checklist', 'Dates in one consistent format · gaps under a year left alone · gaps over a year named in one line · gap-time activity listed as real entries · no stretched dates anywhere · story identical on resume and LinkedIn · final draft ATS-checked so the evidence leads. Then send it and stop re-litigating the gap.'],
    ],
  },
  {
    path: '/guides/skills-for-resume',
    title: 'What Skills to Put on a Resume in 2026 (and How to List Them)',
    description:
      'How to choose resume skills that actually match the job, hard vs soft skills, how many to list, formatting that ATS parsers read cleanly, and what to leave out.',
    h1: 'What skills to put on your resume (and how)',
    sections: [
      ['Start from the job posting, not from memory', 'The skills section exists to match one specific job description. Open the posting, list every concrete skill, tool and qualification it names, and check which ones you genuinely have — those go first, in the posting’s exact wording. Everything else is secondary.'],
      ['Hard skills carry the section', 'Tools, languages, frameworks, certifications, methodologies: “Python”, “QuickBooks”, “Google Analytics”, “OSHA 30”. These are what ATS keyword matching and skimming recruiters both look for. List them as plain comma-separated text or simple groups — no skill bars, icons or star ratings, which parsers cannot read.'],
      ['Soft skills need proof, not a list entry', '“Leadership” in a skills list is noise; “Led a 6-person support team through a CRM migration” in a bullet is evidence. Keep at most one or two soft skills in the list, and demonstrate the rest inside your experience bullets.'],
      ['How many skills to list', 'Aim for 8–15. Fewer looks thin; more looks like keyword stuffing and dilutes the ones that matter. If you’re tempted to list 25, group them (“Languages: … / Cloud: … / Data: …”) and cut anything you couldn’t discuss in an interview.'],
      ['Match level honestly', 'Only list skills you can use on day one. “Familiar with” skills you’ve merely read about set interview traps — one probing question and your credibility is gone. If a required skill is a genuine gap, address it in the cover letter as something you’re actively learning.'],
      ['Check the match before you send', 'Paste your resume and the job posting into our free ATS checker to see which of the posting’s keywords your skills section already covers and which are missing — it runs entirely in your browser.'],
    ],
  },
  {
    path: '/guides/best-resume-format',
    title: 'Best Resume Format for 2026: Chronological vs Functional vs Hybrid',
    description:
      'Which resume format gets read: reverse-chronological, functional, or hybrid — what ATS parsers handle, who each format suits, and the layout rules that matter in 2026.',
    h1: 'The best resume format for 2026 (and who each fits)',
    sections: [
      ['Reverse-chronological wins for most people', 'Most recent role first, working backwards. It’s what recruiters expect, what ATS parsers handle most reliably, and what makes career progression obvious. If you have a conventional work history, this is your format — full stop.'],
      ['Functional format is a red flag in 2026', 'The skills-first, dates-buried “functional” resume was designed to hide something, and every recruiter knows it. Many ATS parsers also misfile its non-standard sections. If you’re tempted by functional because of gaps or a career change, use a hybrid instead.'],
      ['Hybrid: a skills summary on top of a chronological core', 'A short skills/achievements block up top, followed by a normal reverse-chronological history. Works for career changers (lead with transferable skills) and senior candidates (lead with scope). The chronological backbone keeps parsers and recruiters oriented.'],
      ['Layout rules that outrank format choice', 'Single column. Standard headings (“Experience”, “Education”, “Skills”). Real selectable text, no tables or text boxes. 10.5–12pt body font. These parsing rules matter more than which format you picked — a scrambled parse loses to any format.'],
      ['One page or two?', 'Under ~10 years of experience: one page. More than that, or dense technical/academic work: two pages is fine and normal. What kills resumes isn’t a second page — it’s padding. Every line must earn its place.'],
      ['Format is the container, evidence is the content', 'No format rescues vague bullets. Quantify achievements, mirror the posting’s keywords, tailor the summary — then run a free ATS check to confirm the result parses cleanly before you send it.'],
      ['Section order for reverse-chronological', 'Contact → summary (optional) → experience → education → skills, with projects/certifications where they’re strongest. New grads flip experience and education while the degree is the headline — flip back after your first job. Our builder lets you drag sections into either order.'],
      ['Hybrid format, concretely', 'The top block is 4–6 lines maximum: a two-line summary plus a short highlights list ("Led 3 product launches · Cut infra spend 30% · Manage $2M budget"). Anything longer buries the experience section that must follow — the block is a trailer, not the movie.'],
      ['Employment gaps: format honestly', 'Use years-only dates ("2021 – 2023") if months make a short gap look worse than it is — that is presentation, not concealment. Never stretch dates to cover a gap; background checks compare exact months. A one-line explanation ("Career break — family care, 2022") beats an unexplained hole.'],
      ['Career changers: hybrid, not functional', 'Lead with a skills summary that names the target field’s tools, keep the chronological history intact underneath, and let transferable bullets do the arguing ("Trained 40 staff" carries into any field). Hiding your past reads as deception; reframing it reads as judgment.'],
      ['Formats by career stage', 'Student/new grad: education-first chronological, one page. Mid-career: standard reverse-chronological. Senior/executive: hybrid with a scope-heavy summary, two pages. Academic/research: that’s a CV, not a resume — see our resume-vs-CV guide.'],
      ['The format checklist', 'Reverse-chronological backbone · single column · standard headings · dates aligned and consistent · one or two pages by experience · summary only if it adds evidence · parsed check before sending. Format settled, spend your time on the bullets.'],
    ],
  },
  {
    path: '/guides/tailor-resume-to-job',
    title: 'How to Tailor Your Resume to a Job Description (in 15 Minutes)',
    description:
      'A 15-minute process for tailoring your resume to any job posting: extract keywords, rework the summary, reorder bullets, and verify the match with a free ATS score.',
    h1: 'Tailor your resume to the job description — a 15-minute process',
    sections: [
      ['Why one generic resume underperforms', 'ATS screening compares your resume to one specific posting, and recruiters skim for the posting’s own vocabulary. A generic resume loses on both fronts. Tailoring is the highest-leverage 15 minutes in a job application.'],
      ['Minute 0–3: extract the posting’s keywords', 'Read the posting once and mark every concrete skill, tool, qualification and repeated phrase. The requirements section matters most; anything named twice matters more. This list is your checklist for everything that follows.'],
      ['Minute 3–6: rewrite the summary for this job', 'Your summary should read like it was written for this posting — because it was. Mirror the job title, name the two or three requirements you meet most strongly, and use the posting’s wording for them.'],
      ['Minute 6–11: reorder and rephrase bullets', 'Within each role, move the bullets most relevant to this posting to the top and align their vocabulary with the posting’s (“CI/CD pipelines” vs “build automation” — use theirs). Don’t invent new achievements; re-emphasize real ones.'],
      ['Minute 11–13: align the skills section', 'Add any posting keywords you genuinely have but forgot to list, in the posting’s exact wording (including acronym + full phrase). Remove skills irrelevant to this application to sharpen the signal.'],
      ['Minute 13–15: verify with a match score', 'Paste your tailored resume and the posting into our free ATS checker: it shows your keyword match score and exactly which posting keywords are still missing. Fix what’s real, skip what isn’t — then send.'],
      ['Keep a master resume, tailor copies', 'Never tailor your only copy. Keep one master resume with everything you’ve done, then save a tailored copy per application — our builder’s Copies feature stores named versions in your browser, each with its own ATS score against its own job description.'],
      ['What not to change', 'Employers, titles, dates and numbers are fixed facts — tailoring means re-emphasizing and re-wording what’s true, never adjusting it. If a tailored bullet wouldn’t survive a reference check, revert it.'],
      ['Tailor the job title line, carefully', 'If the posting says “Senior Software Engineer” and you were a “Software Engineer III”, you may annotate — “Software Engineer III (Senior level)” — when your employer’s leveling genuinely maps. Annotate, never replace; title inflation is the fastest way to fail a background check.'],
      ['When the posting is vague', 'Some postings are three paragraphs of adjectives. Fall back on the job title’s conventional requirements, the company’s tech-stack pages or engineering blog, and comparable postings from the same team — then tailor to that composite.'],
      ['Batch applications without going generic', 'Applying to ten similar roles? Build one tailored version per role cluster (e.g. “backend fintech”, “platform/infra”) rather than per posting, then spend two minutes per application adjusting the summary line and the top bullets. Clusters keep quality high at volume.'],
      ['The 15-minute rule is a ceiling, not a floor', 'For a role you genuinely want, spend longer: re-read your bullets as the hiring manager would, cut anything that doesn’t serve this application, and have the cover letter address the one requirement you can’t show on the resume.'],
    ],
  },
  {
    path: '/guides/remote-job-resume',
    title: 'Resume for Remote Jobs: What to Change (2026 Guide)',
    description:
      'How to position your resume for remote roles: proving async and self-management skills, listing remote experience correctly, tools to name, and what remote employers screen for.',
    h1: 'Writing a resume for remote jobs',
    sections: [
      ['Say “remote” explicitly', 'If you’ve worked remotely, put it in the location slot: “Acme Corp — Remote (US)”. Remote employers scan for prior remote experience specifically; making them infer it is a missed signal. Hybrid roles: “Hybrid — Chicago, IL”.'],
      ['Prove self-management with outcomes', 'Remote hiring managers screen for people who ship without supervision. Bullets that show ownership end-to-end — “Owned the release pipeline for a 9-person distributed team across 4 time zones” — beat any claim of being a “self-starter”.'],
      ['Name your collaboration stack', 'Slack, Zoom, Notion, Jira, Linear, GitHub, Figma — concrete tool names are both ATS keywords and instant credibility that you can operate in an async toolchain. List them in skills; better, embed them in bullets.'],
      ['Show async communication in writing', 'Remote work runs on writing: documentation, RFCs, post-mortems, runbooks. If you’ve written any of these, say so with scope: “Wrote onboarding docs that cut new-hire ramp time from 6 to 3 weeks”. Your resume itself is a writing sample — keep it tight.'],
      ['Time zones and eligibility up top', 'Many remote postings restrict by country or overlap hours. Put your time zone and work eligibility in the contact line (“CET, eligible to work in the EU”) so a recruiter never has to guess whether you fit the constraint.'],
      ['Tailor to each remote posting like any other', 'Remote roles get more applicants, so keyword matching is stricter, not looser. Extract each posting’s keywords and check your match with a free ATS score before applying.'],
      ['A remote-ready summary line', 'Fold the remote signal into your summary rather than adding a separate section: “Backend engineer with 6 years, the last 3 fully remote on a 12-person distributed team”. One clause converts your whole work history into remote evidence.'],
      ['Quantify the distributed part', 'Numbers make remote claims concrete: how many time zones, how large the distributed team, how often you shipped. “Coordinated releases across 4 time zones with zero missed deadlines in 18 months” is a remote-work bullet; “worked well remotely” is not.'],
      ['Freelance and contract work counts', 'Client work delivered remotely is remote experience — list it like employment: “Freelance Designer — Remote, 2023–2025” with client outcomes as bullets. Group small engagements under one heading so the timeline stays readable.'],
      ['What remote employers screen out', 'Vague availability (no time zone), no evidence of written communication, and resumes that never mention how work was coordinated. None of these are fatal in an office resume; all three are red flags for a distributed team.'],
      ['Don’t oversell it', 'If your remote experience is thin, say what’s true — “2 days/week hybrid for 2 years” — and let your async-tooling and writing evidence carry the application. Claiming years of remote work you can’t back up unravels in the first reference call.'],
      ['The remote checklist', 'Location slots say Remote where true · time zone + eligibility in the contact line · distributed scope quantified · collaboration stack named · one writing-deliverable bullet · keywords matched to the posting. Run the posting through our free ATS checker before you send it.'],
    ],
  },
  {
    path: '/guides/new-grad-resume',
    title: 'New Grad Resume Guide for the 2026 Hiring Season',
    description:
      'How to write a new-grad resume that gets interviews: what to lead with when you have no full-time experience, how to present projects, internships and coursework, and the format campus recruiters actually read.',
    h1: 'The new grad resume: what to write when your experience is school',
    sections: [
      ['Education goes on top — for now', 'Until you have your first full-time role, Education leads: school, degree, graduation date (month + year), GPA if it’s 3.5+ or the posting asks. Relevant coursework only if it maps to the posting’s requirements — “Data Structures, Distributed Systems” for a backend role, not a full transcript.'],
      ['Projects are your experience section', 'Treat substantial projects — capstones, research, hackathons, personal builds people actually used — exactly like jobs: name, dates, and outcome-focused bullets. “Built a course-planning app used by 400 students; cut average planning time from 2 hours to 15 minutes” outranks any list of technologies alone.'],
      ['Internships: results, not duties', 'One internship with two quantified bullets beats three internships described as “assisted the team with various tasks”. What shipped because you were there? What number moved? If you genuinely don’t know the number, describe the concrete artifact you delivered.'],
      ['Part-time work counts more than you think', 'Retail, food service, campus jobs — recruiters read these as reliability, customer exposure, and working under pressure. One or two lines each, with anything measurable: “Trained 5 new hires; handled 100+ transactions per shift”.'],
      ['Keep it to one page, single column', 'A new-grad resume over one page signals inability to prioritize. Single column, standard headings, real text — the same ATS parsing rules as any resume apply to campus recruiting portals, which are often the strictest parsers of all.'],
      ['Match each posting before you submit', 'New-grad postings still keyword-screen. Paste your resume and the posting into our free ATS checker to see your match score and which required skills you list nowhere — it runs in your browser, free.'],
    ],
  },
  {
    path: '/guides/internship-resume',
    title: 'Internship Resume Guide: Getting Your First Internship (2026)',
    description:
      'How to write a resume for internship applications with little or no work history: what recruiters expect from students, how to use coursework and projects, and one-page structure that parses cleanly.',
    h1: 'The internship resume: applying with (almost) nothing on it',
    sections: [
      ['Recruiters calibrate to your year', 'Nobody expects a sophomore to have shipped production software or closed deals. Internship screeners look for trajectory and initiative: coursework that matches the role, anything you built or organized, and evidence you can commit to something and finish it.'],
      ['Structure: Education, Projects, Activities, Skills', 'Lead with Education (school, major, expected graduation, GPA if strong). Then Projects — class projects count if you describe your specific contribution. Then Activities with responsibility: club treasurer, event organizer, team captain. Then a concrete Skills list.'],
      ['Class projects are legitimate material', 'The trick is specificity about your part: “Implemented the recommendation module in a 4-person team project; ranked top 3 of 40 teams” — not “worked on a group project”. Name the tools; those are the keywords the screen matches.'],
      ['Show initiative outside requirements', 'Anything you did that nobody assigned — a personal site, a small business, volunteering you organized, a YouTube channel with real viewers — is disproportionately powerful on an internship resume because it separates you from classmates with identical coursework.'],
      ['One page, no filler', 'Skip the objective statement (“seeking a challenging internship…” says nothing). Skip high-school achievements after freshman year. Skip skill bars and photos. Every line should say something specific and true about what you can do.'],
      ['Run the match check first', 'Internship portals use the same ATS keyword screens as full-time postings. Check your resume against each posting with our free ATS checker so you know your match score — and what’s missing — before you hit submit.'],
      ['GPA: when to list it, when to drop it', 'List it at 3.5+ (or your major GPA if that’s stronger — label it “Major GPA”). Below that, omit it; nobody assumes the best when it’s missing, but a weak number invites the question. Once you have one internship on the page, GPA matters much less.'],
      ['Coursework: a line, not a transcript', 'One “Relevant coursework” line under your degree with 4–6 courses that match the posting’s keywords (“Data Structures, Databases, Distributed Systems”). Rotate the list per application — coursework is the easiest honest keyword surface a student has.'],
      ['Quantify like a student', 'You don’t need revenue numbers: team size, users, downloads, event attendance, budget handled, rank in a competition all count. “Organized a 120-attendee hackathon with a $3k sponsor budget” is quantified evidence at any career stage.'],
      ['Part-time jobs belong on the page', 'Retail, food service, tutoring — real jobs prove reliability, customer handling and time management alongside a full course load. One or two bullets each with something concrete: “Trained 4 new hires”, “Handled closing cash reconciliation”.'],
      ['Write it once, tailor it per posting', 'Keep one master version, then adjust the coursework line, the skills list and the top project per application to mirror each posting’s wording. Our builder’s Copies feature stores a named version per application, each scored against its own job description.'],
      ['The pre-submit checklist', 'One page · education first with expected graduation date · projects with your specific contribution · activities with responsibility · concrete skills matching the posting · no objective, no photo, no skill bars · ATS match check run. Then submit early — internship pipelines fill fast.'],
    ],
  },
  {
    path: '/guides/career-change-resume',
    title: 'Career Change Resume: How to Reposition Your Experience (2026)',
    description:
      'How to write a resume when switching fields: the hybrid format that works, translating your experience into the new field’s vocabulary, handling the “why” — and what not to hide.',
    h1: 'The career change resume: repositioning, not hiding',
    sections: [
      ['Use a hybrid, not a functional format', 'Career changers are the one group tempted by the skills-only “functional” resume — and it backfires, because recruiters read it as concealment. Use a hybrid: a strong summary and transferable-skills block up top, then your normal reverse-chronological history underneath.'],
      ['The summary carries the switch', 'Your summary must answer “why should we interview someone from another field” in three lines: name the target role explicitly, state the transferable strengths you bring, and mention any bridge credential — a course, certification, or project in the new field.'],
      ['Translate, don’t transplant, your bullets', 'Rewrite each old-role bullet in the target field’s vocabulary where it’s honest to do so: a teacher moving to L&D writes “designed and delivered training for 120 learners”, not “taught five classes of students”. Same facts, the reader’s language.'],
      ['Build one real artifact in the new field', 'A shipped project outweighs any claim of passion: a data-analysis portfolio, a redesigned nonprofit website, a QA certification plus bug reports on open-source projects. Put it in a Projects section with the same outcome-focused bullets as a job.'],
      ['Don’t hide the old career', 'Unexplained gaps and vague role names read worse than an honest history. Your previous career is evidence of reliability and seniority; the summary’s job is to frame it, not erase it.'],
      ['Keyword-match against the new field’s postings', 'Field-switchers fail ATS screens most often because their vocabulary doesn’t match the posting’s. Paste your rewritten resume and a target posting into our free ATS checker to see exactly which of the field’s terms you’re still missing.'],
      ['Find the overlap before you write', 'List the target field’s top ten recurring requirements (pull them from five postings), then mark which you already do under another name. Most switchers find 40–60% genuine overlap — budget ownership, stakeholder management, data analysis, training. Write toward the overlap first.'],
      ['Pick the right target role', 'The smoothest switches change one variable at a time: same function in a new industry, or a new function in your current industry. A bridge role (project coordinator, analyst, operations) inside the target field often beats aiming straight at the destination title.'],
      ['Which credentials actually move the needle', 'One recognized, completed credential beats five course-platform certificates of completion. Prioritize credentials the postings themselves name (Google Analytics, CAPM/PMP, CPA units, a state license) — those are the strings the screen matches.'],
      ['Sequence the sections for a switcher', 'Summary → transferable skills block → Projects in the new field (if you have them) → Experience → Education/Certifications. The reader should hit new-field evidence before the old-field job titles. Our builder’s section reorder makes this a drag, not a rewrite.'],
      ['Expect the salary and seniority question', 'Switching fields often means a step sideways or down in title. Don’t argue with it on the resume — no inflated titles, no stretched dates. Address compensation and level in conversation; the resume’s only job is honest evidence that you can do the new work.'],
      ['A realistic timeline', 'A credible switch takes one to three months of artifact-building and tailoring before interviews convert: one bridge credential, one real project, ten genuinely tailored applications beat a hundred generic ones. Track each version with a named copy per posting and its own ATS score.'],
    ],
  },
  {
    path: '/guides/how-to-write-a-cover-letter',
    title: 'How to Write a Cover Letter in 2026 (Structure + What to Skip)',
    description:
      'A practical cover letter guide: the four-paragraph structure that works, how to open without “I am writing to apply”, what hiring managers actually read, and the filler to cut.',
    h1: 'How to write a cover letter that gets read',
    sections: [
      ['Most cover letters are skimmed in 10 seconds', 'Hiring managers skim for two things: do you understand what this specific job is, and can you point to evidence you can do it. A letter that could be sent to any company fails both tests instantly — the company name in the first paragraph is the minimum, a specific product, launch or challenge is better.'],
      ['The four-paragraph structure', 'One: the role you’re applying for and one sentence on why this company specifically. Two: your strongest relevant achievement, with a real number. Three: your second proof point, mapped to a requirement from the posting. Four: a short close asking for the conversation. That’s it — half a page, never more than one.'],
      ['Open with them, not you', '“I am writing to express my interest…” wastes your most-read sentence. Compare: “Your posting asks for someone who has scaled support past 100k tickets a year — at Acme I led exactly that transition.” The reader knows immediately why to keep reading.'],
      ['Numbers work in letters too', 'The same rule as resume bullets: “cut onboarding time from 3 weeks to 4 days” beats “significantly improved processes”. Pick your one or two best quantified wins and spend a sentence of context on each — the letter can tell the short story the resume bullet can’t.'],
      ['What to cut', 'Cut anything the resume already says without added context, all adjectives about yourself (“passionate”, “results-driven”), salary talk, and apologies for missing requirements. If a paragraph doesn’t answer “why you for this job”, it goes.'],
      ['Start from your resume, not a blank page', 'Our builder’s cover letter tool drafts a letter from your actual resume, target role and company — with placeholders where your real facts go, never invented achievements. Edit it to sound like you, then export to PDF or DOCX free.'],
    ],
  },
  {
    path: '/guides/common-resume-mistakes',
    title: '12 Common Resume Mistakes That Get You Rejected (2026)',
    description:
      'The resume mistakes recruiters and ATS parsers reject most: multi-column layouts, image-based PDFs, vague bullets, keyword mismatch, and the fixes for each — checked against real parser behavior.',
    h1: 'The resume mistakes that actually cost you interviews',
    sections: [
      ['Format mistakes ATS parsers punish', 'Multi-column layouts read out of order or not at all. Text in headers/footers is skipped by many parsers — contact info there can vanish. Tables, text boxes and graphics scramble parsing. Image-based or “flattened” PDFs contain no readable text at all. Single column, real text, standard headings avoids all of it.'],
      ['Vague bullets', '“Responsible for managing social media” says what the job was; “Grew Instagram from 2k to 40k followers in 8 months” says what you did with it. Every bullet without a number, artifact or concrete outcome is a wasted line — and weak openers like “helped with” or “worked on” read as filler.'],
      ['One resume for every job', 'The highest-leverage fix: postings keyword-screen, and a resume tuned for one role scores poorly against another. You don’t need a rewrite per application — swap the summary and the skills emphasis to mirror each posting’s actual vocabulary.'],
      ['Length and priority errors', 'Two pages before ten years of experience, first-person pronouns, an “objective” statement, high-school details past your first year of college, “references available upon request” — all signal you don’t know what matters. One page, strongest material in the top third.'],
      ['Honesty mistakes', 'Inflated titles, stretched dates and invented metrics surface in background checks and reference calls — usually after you’ve counted on the offer. If you don’t know the exact number, describe the concrete thing you delivered instead of inventing one.'],
      ['Check before you send', 'Run your resume and the posting through our free ATS checker: it shows your match score, missing keywords, and format warnings — the same checks in this list, automated. It runs in your browser; your resume never leaves your machine.'],
      ['Contact-block mistakes', 'An unprofessional email address, a dead LinkedIn link, a missing location when the posting is location-bound, or contact info buried in a header the parser skips. Name, one email, one phone, city + state, one profile link — in the body of the page, as real text.'],
      ['Typos cluster where you stopped proofreading', 'The classic misses: your own job titles, company names, the months in date ranges, and the last section you edited. Read the resume bottom-up once — it defeats the skimming that hides errors — and have one other person read it cold.'],
      ['Inconsistent formatting reads as carelessness', 'Three date formats, two bullet styles, headings that switch case, one role bolded and the next not — each is minor, together they say “didn’t check”. Pick one convention for dates, bullets and headings and let a builder enforce it mechanically.'],
      ['Stale or padded skills', 'Software nobody has asked about in a decade, “Microsoft Word” for an engineering role, skill bars rating yourself 4/5 at things — and the opposite failure: listing skills you’d fail a five-minute question on. List what the posting names and what you can defend.'],
      ['Sending the wrong file', 'A file named “resume_final_v7 (2).pdf”, a DOCX when the portal asks for PDF, an export where the second page starts mid-bullet. Name it “Firstname-Lastname-Resume.pdf”, match the requested format, and open the exported file once before uploading it.'],
      ['The pre-send pass, in order', 'Parse check (ATS checker) → keyword match against this posting → bullets quantified and one idea each → dates consistent → contact block correct → filename professional → exported file opened and eyeballed. Seven checks, five minutes, most rejections avoided.'],
    ],
  },
  {
    path: '/guides/resume-bullet-points',
    title: 'How to Write Resume Bullet Points (Formula + Examples, 2026)',
    description:
      'The bullet point formula recruiters respond to: action verb + what you did + measurable result. Real before/after examples by role, how many bullets per job, and what to do when you have no numbers.',
    h1: 'Resume bullet points: the formula and the fixes',
    sections: [
      ['The formula', 'Strong action verb + the specific thing you did + the measurable result: “Rebuilt the checkout flow, lifting conversion 14%”. Weak bullets fail one of the three parts: no verb (“Responsible for checkout”), no specifics (“improved various flows”), or no result (“rebuilt the checkout flow.” — and?).'],
      ['Before and after', '“Worked on customer support” → “Resolved 40+ tickets daily at 96% CSAT, top 3 of a 15-person team”. “Helped with marketing campaigns” → “Wrote email sequences that drove $120k in pipeline over two quarters”. Same jobs, same facts — the second version just states them.'],
      ['How many bullets', 'Three to five for recent, relevant roles; one or two for older or less relevant ones. Recruiters read top-down and stop early — your best bullet goes first in every role, not in chronological order of your duties.'],
      ['No numbers? Use artifacts', 'If the metric genuinely doesn’t exist, anchor the bullet to something concrete: what you shipped, how often, for whom — “Wrote the onboarding runbook now used by all new hires” works without a percentage. Never invent a number; interviewers probe them.'],
      ['Start from a working verb', 'Built, led, cut, grew, shipped, negotiated, automated — the verb carries the bullet. Our builder includes role-matched bullet starters with [add …] placeholders where your real facts go, plus quality warnings on weak openers and missing numbers as you type.'],
      ['Match the posting’s keywords', 'Bullets are where keyword matches naturally live — the posting says “stakeholder management”, your bullet should name the stakeholders you managed. Check your match score against any posting with our free ATS checker before you submit.'],
      ['Finding numbers you forgot you had', 'Scope counts as a number: team size, budget, users served, tickets per week, clients handled, documents processed, regions covered. Reconstruct honestly from records you have (dashboards, reviews, old reports) — “managed a 6-store territory” is a metric even without revenue attribution.'],
      ['One idea per bullet', 'A bullet that says “managed the team, ran the migration, and improved onboarding” buries three achievements where none can land. Split them; if a role has too many bullets after splitting, cut the weakest instead of merging the strong ones back together.'],
      ['Length: one line, two at most', 'A bullet that wraps past two lines is a paragraph wearing a disguise. Cut qualifiers (“successfully”, “effectively”), cut the obvious (“as part of my role”), and keep the verb, the specifics, and the number. Under ~20 words reads best.'],
      ['Tense and person', 'Past roles: past tense. Current role: present tense for ongoing duties, past for completed wins (“Lead a team of 5; shipped the 2025 replatform”). Never “I” — resume bullets drop the subject by convention, and our builder flags first-person openers.'],
      ['Bullets by role type', 'Engineers: name the system and the scale (“cut p95 latency 40% on a service handling 2M req/day”). Sales: quota and rank (“127% of quota, #2 of 14 reps”). Ops: cost and time (“cut close from 10 days to 6”). Support: volume and quality (“40 tickets/day at 96% CSAT”). The pattern is identical — only the nouns change.'],
      ['The rewrite drill', 'Take your three weakest bullets. For each, ask: what verb? what exactly? what happened because of it? Rewrite with all three parts, then run the builder’s bullet-quality check — it flags weak openers, missing numbers and overlong lines as you type, free.'],
    ],
  },
  {
    path: '/guides/what-is-an-ats',
    title: 'What Is an ATS? How Applicant Tracking Systems Read Your Resume (2026)',
    description:
      'What an applicant tracking system actually does with your resume: how parsing works, what recruiters see, the myths about “beating the bots”, and how to check your resume parses cleanly — free.',
    h1: 'What an ATS actually does with your resume',
    sections: [
      ['It’s a filing system, not a robot gatekeeper', 'An ATS (applicant tracking system — Workday, Greenhouse, Lever, iCIMS, Taleo…) is the database recruiters use to manage applications. It parses your resume into structured fields: name, contact, work history, skills. Most rejections blamed on “the ATS” are a human recruiter spending eight seconds on a parsed profile that looked thin or mismatched.'],
      ['How parsing works', 'The parser extracts text and maps it to fields using section headings and layout. Standard headings (“Work Experience”, “Education”, “Skills”), single-column layout, and real text (not images) parse reliably. Creative headings, multi-column designs, tables and graphics are where data gets scrambled or dropped.'],
      ['What recruiters actually see', 'A summary card: recent titles, companies, dates, skills, sometimes a match score against the posting. If your best material is trapped in a sidebar the parser skipped, the recruiter never sees it. That is why ATS-friendly formatting matters — not because software rejects you, but because humans decide from the parsed view.'],
      ['Keyword screening is real, but simpler than you think', 'Recruiters filter and search by terms from the posting — “Kubernetes”, “account management”, “CPA”. Matching happens on the words you actually use, so mirror the posting’s vocabulary where it is true of you. Stuffing white-text keywords or unrelated terms fails the human review that always follows.'],
      ['The myths', 'No, ATS software does not auto-reject 75% of resumes — that number traces to a vendor survey, not parser behavior. No, PDFs are not unreadable — a text-based PDF parses fine nearly everywhere; an image-based (scanned or “flattened”) PDF does not, anywhere. No, you don’t need to trick anything: clean structure plus honest keyword overlap is the whole game.'],
      ['Check how yours parses', 'Our free ATS checker runs the same structural checks parsers rely on — headings, contact line, text extraction, keyword match against a posting — right in your browser. No signup, and your resume never leaves your machine.'],
    ],
  },
  {
    path: '/guides/resume-vs-cv',
    title: 'Resume vs CV: The Difference (and Which One to Send) — 2026',
    description:
      'Resume vs CV explained: length, content, and when each is expected — US/Canada vs UK/Europe usage, academic CVs, and what to send when a posting says “CV” but means resume.',
    h1: 'Resume vs CV: which one does this job want?',
    sections: [
      ['The short answer', 'In the US and Canada: a resume is the 1–2 page tailored summary almost every job wants; a CV (curriculum vitae) is the complete multi-page academic record used for research, faculty and grant applications. In the UK, Ireland, Europe, Australia and much of the rest of the world, “CV” simply means what Americans call a resume.'],
      ['What a resume is', 'A marketing document, not a biography: 1–2 pages, tailored to one target role, leading with your strongest relevant evidence — recent roles, quantified bullets, matching skills. Older and irrelevant material gets cut, not summarized.'],
      ['What an academic CV is', 'A complete record that grows with your career: every publication, conference talk, grant, teaching appointment and committee. Length is expected — a mid-career academic CV runs 5–15 pages. Nothing is tailored away; completeness is the point.'],
      ['Reading the posting', 'A UK/EU posting asking for a “CV” wants a 1–2 page resume. A US university posting for a research or faculty role asking for a “CV” wants the full academic document. A US company posting asking for a resume never wants 8 pages — when in doubt, send the concise tailored version.'],
      ['Same rules either way', 'Whatever it’s called, the screening reality is identical: clean single-column structure, real text, standard headings, keywords that mirror the posting. Our free ATS checker works on both — and the builder exports a clean PDF or DOCX either way.'],
      ['Converting a CV into a resume', 'Cut to the last 10–15 years, keep only roles and publications relevant to the target job, convert duty descriptions into 2–4 quantified bullets per role, and compress teaching/service into single lines. The goal is 1–2 pages that answer this posting, not a shortened biography.'],
      ['Converting a resume into an academic CV', 'Expand rather than cut: add complete publication and presentation lists (in a consistent citation format), grants with amounts and dates, teaching history, supervision, and service. Ordering is conventional — education first, then appointments, then publications.'],
      ['Regional details that trip people up', 'US/Canada resumes: no photo, no date of birth, no marital status — bias laws make recruiters discard resumes that include them. Much of continental Europe tolerates photos but they are increasingly optional; the UK follows the no-photo convention. When applying across regions, follow the employer’s country.'],
      ['International CV formats', 'Some regions expect specific structures — Europass in parts of the EU public sector, Rirekisho in Japan. If the posting names a format, use it exactly; if not, a clean reverse-chronological 1–2 pager is the safe default worldwide.'],
      ['Federal and government resumes', 'US federal applications (USAJOBS) are their own genre: 3–5 pages, hours per week, supervisor contacts, and every qualification spelled out against the posting’s criteria. Neither a private-sector resume nor an academic CV — read the announcement’s checklist literally.'],
      ['Which one should you maintain?', 'Maintain the superset and derive the rest: keep one master document with everything, then export tailored 1–2 page resumes per application. Our builder’s Copies feature keeps the master and each tailored version side by side in your browser.'],
    ],
  },
  {
    path: '/guides/references-on-resume',
    title: 'References on a Resume: Should You Include Them? (2026)',
    description:
      'Whether to put references on your resume, why “references available upon request” wastes a line, how to prepare a separate reference sheet, and what to do when a posting explicitly asks for references.',
    h1: 'References on a resume: almost always leave them off',
    sections: [
      ['The short answer', 'Do not list references on your resume, and do not write “references available upon request”. Recruiters assume you have references; they will ask for them at the offer stage, not the screening stage. Every line spent on references is a line not spent on evidence that gets you the interview.'],
      ['Why the old advice died', '“References available upon request” was a convention from paper resumes. Today it signals an outdated template, and worse, it burns space in the exact document where recruiters spend seconds. No hiring team rejects a resume for omitting it.'],
      ['When a posting explicitly asks', 'Some applications — government, academia, some agencies — genuinely require references up front. Follow the instruction, but put them in a separate document or the application form fields, not inside the resume itself, unless the posting says otherwise.'],
      ['Prepare a separate reference sheet', 'Keep a one-page sheet matching your resume header: 3–4 people, each with name, title, organization, relationship to you (“direct manager, 2021–2023”), email and phone. Send it only when asked. Always ask each reference for permission first and tell them which job to expect a call about.'],
      ['Who makes a strong reference', 'Recent direct managers beat grand titles: someone who supervised your work in the last few years and can speak to specifics. Peers and cross-functional partners work when you lack manager options; professors and internship mentors are fine for new grads. Avoid friends and family.'],
      ['Use the space for evidence instead', 'Cut the references line and spend it on a quantified bullet or a skills match. Our free ATS checker shows which keywords from the posting your resume is missing — that is what screening actually rewards.'],
    ],
  },
  {
    path: '/guides/resume-objective-vs-summary',
    title: 'Resume Objective vs Summary: Which to Use in 2026 (with Examples)',
    description:
      'Resume objective vs professional summary: what each is, why objectives are outdated for most applicants, when a career-change or new-grad objective still works, and how to write a summary that survives a 7-second scan.',
    h1: 'Objective vs summary: lead with what you offer, not what you want',
    sections: [
      ['The difference in one line', 'An objective states what you want (“Seeking a challenging position…”); a summary states what you offer (“Support engineer with 5 years in SaaS, cut median ticket time 40%”). Recruiters scan for evidence, so the summary wins for almost everyone.'],
      ['Why objectives fell out of favor', 'An objective spends your most valuable lines — the top of page one — describing your wishes, which every applicant shares. It adds no screening signal: no skills, no scope, no numbers. Most modern templates and career centers dropped it years ago.'],
      ['The exceptions where an objective still works', 'A one-line, specific objective can help when your target is not obvious from your history: career changers (“Transitioning from teaching to instructional design; built 12 online courses”) and new grads targeting a niche role. Even then, pack it with evidence, not aspiration.'],
      ['How to write a summary that scans', '2–3 lines: role + years, the strongest quantified result you can claim honestly, and the skills that mirror the posting. No first person, no buzzword chains (“results-driven team player”), no claims you cannot back in an interview.'],
      ['Tailor it per application', 'The summary is the easiest section to tailor: swap the emphasized skills to mirror each posting’s language. Save a named copy per job in the builder so version A for one company never overwrites version B for another.'],
      ['Check the result', 'Paste the posting into our free ATS checker to see whether your summary and skills actually mirror the keywords screening filters look for — before you send it.'],
      ['Summary examples by stage', 'New grad: “CS graduate with three shipped web projects; strongest in React and Python.” Mid-career: “Ops manager, 8 years in logistics; cut fulfillment errors 35% across 4 warehouses.” Executive: “VP Engineering; scaled a 12-to-80 person org through two funding rounds.” Each is two lines of checkable facts.'],
      ['Objective examples that still earn their line', '“Transitioning from nursing to clinical-informatics; Epic-certified, led my unit’s EHR rollout.” “New grad targeting embedded firmware; built two shipping IoT products in coursework and internships.” The pattern: name the target, then immediately prove it.'],
      ['When to skip both', 'If your last job title matches the target role and the posting’s keywords already lead your experience section, a summary can be redundant — a straight-to-experience resume is fine, especially at one page. The summary earns its lines only when it adds evidence or explains a pivot.'],
      ['Common summary mistakes', 'Buzzword chains with no facts (“dynamic, results-oriented professional”), first person (“I am a…”), restating the resume’s first bullet, exceeding three lines, and claims you cannot defend for two minutes in an interview. Every phrase should survive the question “says who?”.'],
      ['Headline + summary, not either/or', 'A one-line headline under your name (“Senior Data Engineer · Python · AWS”) plus a two-line summary is the modern top-of-page: the headline feeds keyword screens and the recruiter’s first glance, the summary adds the evidence. Our builder’s title field renders exactly this headline.'],
      ['The 7-second test', 'Read only your name, headline and summary for seven seconds, then ask what a stranger now knows: target role, seniority, strongest result. If any of the three is missing, rewrite before touching anything else — nothing below gets read until this passes.'],
    ],
  },
  {
    path: '/guides/hobbies-and-interests-on-resume',
    title: 'Hobbies and Interests on a Resume: When They Help (and Hurt) in 2026',
    description:
      'Whether to add hobbies and interests to your resume, which ones actually strengthen an application, which ones backfire, and how to format the section when you use it.',
    h1: 'Hobbies and interests on a resume: when they help',
    sections: [
      ['The default: leave them off', 'For most mid-career applications, the interests line is the first thing to cut. Recruiters screen for evidence you can do the job; “reading, travel, music” adds none and costs a line your skills or a quantified bullet could use.'],
      ['When they genuinely help', 'Three cases: you are early-career and the page is thin; the interest demonstrates a job-relevant capability (a marathon for discipline-heavy roles, open-source contributions for engineering, a 10k-follower channel for marketing); or the employer signals culture fit matters (startups, mission-driven orgs, roles naming the interest).'],
      ['Pick interests with evidence, not adjectives', 'Treat an interest like a bullet: concrete and verifiable. “Chess — competitive player, 1800 rating” or “Volunteer tax preparer, 3 seasons” beats “strategy games” and “volunteering”. If you cannot attach a fact, it is filler.'],
      ['Interests that backfire', 'Anything polarizing (politics, religion — unless applying to an aligned organization), anything risky-sounding for the role, and long lists of passive consumption (watching series, browsing social media). One or two strong items maximum.'],
      ['How to format the section', 'One line at the very bottom, labeled “Interests”, comma-separated. Never above skills or experience, never with icons or graphics that break ATS parsing. In HonestCV, a one-line custom section keeps it parseable in both the PDF and DOCX export.'],
      ['The test before you keep it', 'Ask: would a hiring manager reading only this line learn something that helps them say yes? If not, cut it and let your experience do the talking.'],
      ['Hobbies vs interests vs activities', 'Recruiters read them the same way, but “Activities” earns its place most often: it implies participation with outcomes (club leadership, organized events, competitions) rather than passive preference. If your items are genuinely activities, label them that.'],
      ['Interests by industry', 'Conservative fields (law, banking, government) expect none — cut the section. Creative and consumer-facing fields tolerate one strong line. Early-stage startups sometimes read interests as culture signal; check whether the posting or careers page mentions any.'],
      ['Volunteering usually beats hobbies', 'If you must fill space, structured volunteering (tutoring, tax prep, coaching, open-source maintenance) carries verifiable responsibility and outcomes. It can even be a short custom section of its own with one bullet of scope — stronger than any interest line.'],
      ['New grads: activities are experience', 'Before your first job, campus activities with responsibility — treasurer, team captain, hackathon organizer — belong under a proper “Activities” or “Leadership” section with quantified bullets, not compressed into an interests line. See our new-grad guide for full structure.'],
      ['Never pad with inventions', 'An invented marathon or fake chess rating is the cheapest thing for an interviewer to poke at — small-talk questions come precisely from this line. If nothing true is worth listing, the honest empty line is stronger.'],
      ['The one-line rule', 'However you use it: one line, bottom of the page, concrete items only, and only after skills and experience are as strong as you can make them. It is a garnish, never a course.'],
    ],
  },
  {
    path: '/guides/how-to-email-a-resume',
    title: 'How to Email a Resume in 2026: Subject Line, Message, and Attachment',
    description:
      'A practical template for emailing your resume: what to put in the subject line, the 5-sentence body that works, PDF vs DOCX attachment, file naming, and mistakes to avoid.',
    h1: 'How to email a resume (subject line, body, attachment)',
    sections: [
      ['Subject line: job title + your name', 'Recruiters triage by subject. Use the posting’s exact title plus your name, and the requisition ID if there is one: “Application: Senior Accountant — Maya Chen (Req 4821)”. Never “Resume”, “Job application”, or an empty subject.'],
      ['The 5-sentence body', 'Sentence 1: which role you are applying for and where you saw it. Sentences 2–3: your strongest one or two qualifications, mirrored to the posting’s language, with a number if you have one. Sentence 4: the attachment note (“My resume is attached as a PDF”). Sentence 5: availability and thanks. Recruiters skim — anything longer gets skipped.'],
      ['PDF unless they ask for DOCX', 'PDF preserves your layout on every device and is the safe default. Send DOCX only when the posting explicitly requests it (some agencies and government portals do). Whatever you send, make sure the text is selectable — image-based PDFs fail both ATS parsing and quick skims.'],
      ['Name the file like a professional', '“Maya-Chen-Resume.pdf” — your name, the word resume, no version numbers, no “final_v3 (2)”, no dates. The file name shows up in the recruiter’s download folder and in the ATS; make it identify you.'],
      ['Address a human if you can', 'A named greeting (“Dear Ms. Alvarez”) measurably outperforms “To whom it may concern”. Check the posting, the team page, or LinkedIn for the recruiter or hiring manager. If you genuinely cannot find a name, “Dear Hiring Team” is fine.'],
      ['Mistakes that get emails deleted', 'Forgetting the attachment (re-read before sending), a generic body reused verbatim across companies, emailing from an unprofessional address, attaching an editable file full of tracked changes, and following up within 24 hours. Wait about a week before a single polite follow-up.'],
    ],
  },
]

/** Visual metadata mirroring src/lib/templates.ts, for schematic thumbnails on static pages */
const TEMPLATE_META = {
  classic: { accent: '#1a1a1a', serif: true, divider: 'line', headerAlign: 'center', nameCase: 'normal' },
  modern: { accent: '#0f766e', serif: false, divider: 'thick', headerAlign: 'center', nameCase: 'normal' },
  compact: { accent: '#334155', serif: false, divider: 'line', headerAlign: 'center', nameCase: 'normal' },
  executive: { accent: '#7c2d12', serif: true, divider: 'none', headerAlign: 'center', nameCase: 'normal' },
  minimal: { accent: '#1a1a1a', serif: false, divider: 'none', headerAlign: 'left', nameCase: 'normal' },
  bold: { accent: '#1d4ed8', serif: false, divider: 'thick', headerAlign: 'left', nameCase: 'upper' },
  elegant: { accent: '#6d28d9', serif: true, divider: 'line', headerAlign: 'left', nameCase: 'normal' },
  engineer: { accent: '#15803d', serif: false, divider: 'line', headerAlign: 'left', nameCase: 'normal' },
  ivy: { accent: '#14532d', serif: true, divider: 'line', headerAlign: 'center', nameCase: 'normal' },
  slate: { accent: '#475569', serif: false, divider: 'thick', headerAlign: 'left', nameCase: 'normal' },
  corporate: { accent: '#7f1d1d', serif: true, divider: 'thick', headerAlign: 'center', nameCase: 'upper' },
  startup: { accent: '#c2410c', serif: false, divider: 'none', headerAlign: 'left', nameCase: 'normal' },
}

/** Inline SVG schematic of a template's layout (same idea as TemplateThumb.tsx). */
function templateThumbSvg(slug, width = 96) {
  const m = TEMPLATE_META[slug]
  if (!m) return ''
  const W = 96
  const H = 124
  const cx = (w) => (m.headerAlign === 'center' ? (W - w) / 2 : 10)
  const nameW = 34
  const subW = 44
  let y = 12
  const parts = []
  parts.push(`<rect x="${cx(nameW)}" y="${y}" width="${nameW}" height="6" rx="1" fill="${m.nameCase === 'upper' ? '#111' : '#333'}"/>`)
  y += 10
  parts.push(`<rect x="${cx(subW)}" y="${y}" width="${subW}" height="4" rx="1" fill="#d4d4d4"/>`)
  y += 12
  for (let i = 0; i < 3; i++) {
    parts.push(`<rect x="10" y="${y}" width="24" height="5" rx="1" fill="${m.accent}"/>`)
    if (m.divider !== 'none')
      parts.push(`<rect x="10" y="${y + 7}" width="${W - 20}" height="${m.divider === 'thick' ? 2 : 1}" fill="${m.accent}"/>`)
    let ly = y + (m.divider !== 'none' ? 12 : 9)
    for (const w of [W - 20, W - 32]) {
      parts.push(`<rect x="10" y="${ly}" width="${w}" height="4" rx="1" fill="#e5e5e5"/>`)
      ly += 7
    }
    y = ly + 6
  }
  return `<svg role="img" aria-label="${esc(slug)} template layout preview" width="${width}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="background:#fff;border:1px solid var(--border);border-radius:6px">${parts.join('')}</svg>`
}

/** pSEO template pages, one per built-in template */
const TEMPLATE_PAGES = [
  {
    path: '/templates/classic',
    name: 'Classic',
    title: 'Classic ATS Resume Template — Free to Use Online | HonestCV',
    description:
      'A timeless single-column resume template with serif headings — the safest format for ATS parsers and conservative industries. Use it free in your browser.',
    blurb: 'The Classic template uses a traditional serif-accented layout that reads instantly to both ATS parsers and human recruiters. Best for finance, law, government, and any conservative industry where familiarity signals professionalism.',
  },
  {
    path: '/templates/modern',
    name: 'Modern',
    title: 'Modern ATS Resume Template — Free to Use Online | HonestCV',
    description:
      'A clean modern resume template with an accent color and clear hierarchy — still strictly single-column and ATS-safe. Use it free in your browser.',
    blurb: 'The Modern template adds a restrained accent color and contemporary typography while staying strictly single-column. Best for tech, product, marketing and startup roles where a current look matters.',
  },
  {
    path: '/templates/compact',
    name: 'Compact',
    title: 'Compact One-Page Resume Template — Free to Use Online | HonestCV',
    description:
      'A space-efficient resume template that fits more experience on one page without sacrificing ATS readability. Use it free in your browser.',
    blurb: 'The Compact template tightens spacing and type size to fit senior-level experience on a single page — without tables or columns that break parsers. Best for experienced candidates told their resume is “too long”.',
  },
  {
    path: '/templates/executive',
    name: 'Executive',
    title: 'Executive Resume Template — Free to Use Online | HonestCV',
    description:
      'An authoritative resume template with strong headings for leadership roles — single-column and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Executive template uses commanding headings and generous whitespace to frame leadership scope and outcomes. Best for director, VP and C-level applications where gravitas counts.',
  },
  {
    path: '/templates/minimal',
    name: 'Minimal',
    title: 'Minimal ATS Resume Template — Free to Use Online | HonestCV',
    description:
      'A whitespace-first, left-aligned resume template with no dividers — quiet, modern and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Minimal template strips away rules and ornament, letting a left-aligned header and clean typography carry the design. Best for design, product and modern tech roles where restraint reads as confidence.',
  },
  {
    path: '/templates/bold',
    name: 'Bold',
    title: 'Bold ATS Resume Template — Free to Use Online | HonestCV',
    description:
      'A high-contrast resume template with strong headings and thick rules — memorable but still single-column and ATS-safe. Use it free in your browser.',
    blurb: 'The Bold template pairs an uppercase name with thick section rules so your resume stands out in a printed stack — while staying strictly single-column for parsers. Best for sales, marketing and client-facing roles.',
  },
  {
    path: '/templates/elegant',
    name: 'Elegant',
    title: 'Elegant Serif Resume Template — Free to Use Online | HonestCV',
    description:
      'A refined serif resume template with a left-aligned header and fine rules — polished, formal and ATS-parseable. Use it free in your browser.',
    blurb: 'The Elegant template combines refined serif typography with a left-aligned header and fine dividers for a polished, formal impression. Best for consulting, academia, publishing and client advisory roles.',
  },
  {
    path: '/templates/engineer',
    name: 'Engineer',
    title: 'Engineer Resume Template — Free to Use Online | HonestCV',
    description:
      'A no-nonsense sans-serif resume template built for technical resumes — dense, scannable and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Engineer template is built for technical resumes: a compact left-aligned header, clear section rules and typography that keeps dense skill lists scannable. Best for software, data, DevOps and hardware roles.',
  },
  {
    path: '/templates/ivy',
    name: 'Ivy',
    title: 'Ivy Academic Resume Template — Free to Use Online | HonestCV',
    description:
      'An academic serif resume template in deep green — polished, traditional and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Ivy template pairs classic serif typography with a deep green accent for a scholarly, high-trust impression. Best for consulting, graduate-school applications, research and policy roles.',
  },
  {
    path: '/templates/slate',
    name: 'Slate',
    title: 'Slate Resume Template — Free to Use Online | HonestCV',
    description:
      'A cool gray sans-serif resume template with strong section rules — calm, modern and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Slate template uses a muted gray palette and thick rules to read as calm and confident without shouting. Best for operations, program management and enterprise roles.',
  },
  {
    path: '/templates/corporate',
    name: 'Corporate',
    title: 'Corporate Resume Template — Free to Use Online | HonestCV',
    description:
      'A formal serif resume template with a commanding uppercase name — built for finance and law, fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Corporate template centers an uppercase name over formal serif body text with strong rules — the traditional look banking, law and accounting recruiters expect, in a parser-safe single column.',
  },
  {
    path: '/templates/startup',
    name: 'Startup',
    title: 'Startup Resume Template — Free to Use Online | HonestCV',
    description:
      'An energetic resume template with an orange accent and no rules — modern, friendly and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Startup template drops divider rules entirely and leads with a warm orange accent for a modern, product-minded feel. Best for product, growth and early-stage startup roles.',
  },
]

function esc(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const CSS = `
:root{--bg:oklch(0.99 0.002 250);--fg:oklch(0.18 0.02 260);--muted:oklch(0.52 0.02 260);--primary:oklch(0.5 0.18 265);--primary-fg:oklch(0.985 0 0);--border:oklch(0.91 0.01 260);--card:oklch(1 0 0);--accent:oklch(0.94 0.03 265);--radius:0.625rem}
*{box-sizing:border-box;border-color:var(--border)}
body{margin:0;background:var(--bg);color:var(--fg);-webkit-font-smoothing:antialiased;font-family:'Inter',system-ui,-apple-system,sans-serif;line-height:1.7}
a{color:var(--primary);text-decoration:underline;text-underline-offset:3px}
a.btn,a.brand{text-decoration:none}
header.site{position:sticky;top:0;z-index:20;border-bottom:1px solid var(--border);background:color-mix(in oklch,var(--bg) 85%,transparent);backdrop-filter:blur(8px)}
header.site .in{max-width:72rem;margin:0 auto;height:3.5rem;display:flex;align-items:center;justify-content:space-between;padding:0 1rem}
header.site .brand{display:flex;align-items:center;gap:.5rem;font-weight:600;color:var(--fg)}
header.site .brand img{width:1.5rem;height:1.5rem}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:calc(var(--radius) - 2px);background:var(--primary);color:var(--primary-fg);padding:.55rem 1.1rem;font-size:.9rem;font-weight:500;border:0;cursor:pointer}
.btn:hover{opacity:.9;text-decoration:none}
main{max-width:46rem;margin:0 auto;padding:2.5rem 1rem 4rem}
h1{font-size:2rem;line-height:1.25;letter-spacing:-.01em;margin:.25rem 0 .75rem}
.lede{color:var(--muted);font-size:1.05rem}
ul.features{padding-left:1.3em}
ul.features li{margin:.4rem 0}
.cta{margin:2.5rem 0 0;border:1px solid var(--border);background:var(--card);border-radius:var(--radius);padding:1.5rem;box-shadow:0 1px 2px rgb(0 0 0/.04);text-align:center}
.cta p{color:var(--muted);font-size:.9375rem}
.related{margin-top:3rem;border-top:1px solid var(--border);padding-top:1.5rem}
.related h2{font-size:1rem;margin:0 0 .75rem}
.related ul{list-style:none;padding:0;margin:0;display:grid;gap:.5rem}
footer.site{border-top:1px solid var(--border)}
footer.site .in{max-width:72rem;margin:0 auto;padding:1.5rem 1rem;text-align:center;font-size:.75rem;color:var(--muted)}
`.trim()

/** BreadcrumbList JSON-LD: Home → hub → page */
function breadcrumbLd(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...crumbs].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE}${c.path}`,
    })),
  }
}

function page(p) {
  const canonical = `${SITE}${p.path}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'HonestCV',
    url: canonical,
    applicationCategory: 'BusinessApplication',
    description: p.description,
    offers: FREE_MODE
      ? { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      : { '@type': 'Offer', price: '9.99', priceCurrency: 'USD' },
  }
  const related = PAGES.filter((r) => r.slug !== p.slug).map((r) => ({
    ...r,
    path: `${r.path}/`,
  }))
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="HonestCV" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:locale" content="en_US" />
<meta property="og:image" content="${SITE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd(p.path.startsWith('/vs/') ? [{ name: 'Comparisons', path: '/vs/' }, { name: p.h1, path: p.path }] : [{ name: p.h1, path: p.path }]))}</script>
<style>${CSS}</style>
${BEACON}${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />HonestCV</a>
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(p.h1)}</h1>
<p class="lede">${esc(p.intro)}</p>
<ul class="features">
${p.bullets.map((b) => `<li>${esc(b)}</li>`).join('\n')}
</ul>
${p.path.startsWith('/vs/') ? '<p style="color:var(--muted);font-size:.85rem">Competitor pricing and free-tier limits last re-verified against their public pricing pages: August 2026.</p>' : ''}
<div class="cta">
<p>${FREE_MODE ? 'Beta free trial: every plan is fully unlocked at no charge while we\u2019re in beta — editor, ATS templates, match score, AI tools and PDF/DOCX downloads. Plans are $9.99/$19.99 one-time when billing opens. No card, no auto-renewal, nothing that renews.' : 'Everything is free to try — editor, ATS templates, live preview, match score. Pay $9.99 exactly once to download. No subscription, no auto-renewal, nothing to cancel.'}</p>
<a class="btn" href="${p.cta ?? '/builder'}">${esc(p.ctaLabel ?? 'Start your free trial')}</a>
</div>
<div class="related">
<h2>More from HonestCV</h2>
<ul>
${related.map((r) => `<li><a href="${r.path}">${esc(r.title.split(' — ')[0])}</a></li>`).join('\n')}
</ul>
</div>
</main>
<footer class="site"><div class="in">© ${new Date().getFullYear()} HonestCV · Pay once, own it forever. Your resume stays in your browser. · <a href="/guides/">Guides</a> · <a href="/templates/">Templates</a> · More honest tools: <a href="https://qr.zalize.com">HonestQR</a> · <a href="https://pdf.zalize.com">HonestPDF</a> · <a href="https://subsleuth.zalize.com">SubSleuth</a></div></footer>
</body>
</html>`
}

const LEGAL_PAGES = [
  {
    path: '/terms',
    title: 'Terms & Refunds — HonestCV',
    h1: 'Terms & refund policy',
    sections: [
      ['What you buy', 'HonestCV sells one-time licenses: Single Resume ($9.99) unlocks unlimited AI rewrites plus PDF and DOCX downloads; Career Bundle ($19.99) adds the AI cover letter and interview prep tools. There is no subscription, no auto-renewal, and nothing to cancel — ever.'],
      ['Payments', 'Payments are processed by our merchant of record (Lemon Squeezy / Paddle), which handles billing, receipts, and applicable taxes. We never see or store your card details.'],
      ['Refunds', 'Not happy for any reason within 14 days of purchase? Email us with the order number from your receipt and we will refund you in full — no questions, no hoops.'],
      ['License', 'Your license key works in any browser and is valid for 10 years. It covers personal use of your own resumes and cover letters; the documents you create are entirely yours.'],
      ['Fair use', 'AI features are for polishing your own real experience. We may throttle automated or abusive traffic to keep the service fast for everyone.'],
    ],
  },
  {
    path: '/privacy',
    title: 'Privacy — HonestCV',
    h1: 'Privacy policy',
    sections: [
      ['Your resume stays in your browser', 'Resume content is stored in your browser\u2019s localStorage. We have no user accounts and no resume database — clearing your browser data deletes your resume from existence.'],
      ['What our servers see', 'AI rewrite requests send only the text you ask to improve (plus the job description you pasted) to generate a response; we do not retain it after responding. Purchases store an order id and license key so your license can be restored.'],
      ['Payments', 'Checkout is handled by our merchant of record (Lemon Squeezy / Paddle). Your payment details go to them, not us. Their receipt email is your proof of purchase.'],
      ['No tracking for sale', 'We do not sell or share personal data. We use no advertising trackers.'],
      ['Contact', 'Questions or data requests: reply to your receipt email or use the contact link in the footer.'],
    ],
  },
]

function legalPage(p) {
  const canonical = `${SITE}${p.path}`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.sections[0][1])}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="HonestCV" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.sections[0][1])}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<style>${CSS}</style>
${BEACON}${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />HonestCV</a>
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(p.h1)}</h1>
${p.sections.map(([h, t]) => `<h2 style="margin-top:1.5rem;font-size:1.125rem">${esc(h)}</h2>\n<p class="lede" style="font-size:1rem">${esc(t)}</p>`).join('\n')}
</main>
<footer class="site"><div class="in">© ${new Date().getFullYear()} HonestCV · <a href="/guides/">Guides</a> · <a href="/templates/">Templates</a> · <a href="/terms">Terms &amp; refunds</a> · <a href="/privacy">Privacy</a> · More honest tools: <a href="https://qr.zalize.com">HonestQR</a> · <a href="https://pdf.zalize.com">HonestPDF</a> · <a href="https://subsleuth.zalize.com">SubSleuth</a></div></footer>
</body>
</html>`
}

for (const p of PAGES) {
  const dir = path.join(OUT_DIR, p.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), page(p))
  console.log(`built ${p.path}/index.html`)
}

for (const p of LEGAL_PAGES) {
  const dir = path.join(OUT_DIR, p.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), legalPage(p))
  console.log(`built ${p.path}/index.html`)
}

function guidePage(p) {
  const canonical = `${SITE}${p.path}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.h1,
    description: p.description,
    url: canonical,
    mainEntityOfPage: canonical,
    dateModified: new Date().toISOString().slice(0, 10),
    author: { '@type': 'Organization', name: 'HonestCV', url: SITE },
    publisher: { '@type': 'Organization', name: 'HonestCV', url: SITE },
  }
  // 4 neighbouring guides (wrap-around) + comparisons hub — a focused list
  // of direct links (trailing slash avoids a 307 per click/crawl)
  const gi = GUIDES.findIndex((g) => g.path === p.path)
  const related = [1, 2, 3, 4]
    .map((d) => GUIDES[(gi + d) % GUIDES.length])
    .map((g) => ({ path: `${g.path}/`, title: g.title }))
    .concat([{ path: '/vs/', title: 'HonestCV vs other resume builders' }])
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="HonestCV" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd([{ name: 'Guides', path: '/guides/' }, { name: p.h1, path: p.path }]))}</script>
<style>${CSS}</style>
${BEACON}${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />HonestCV</a>
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(p.h1)}</h1>
${p.sections.map(([h, t]) => `<h2 style="margin-top:1.75rem;font-size:1.2rem">${esc(h)}</h2>\n<p>${esc(t)}</p>`).join('\n')}
<div class="cta">
<p>${FREE_MODE ? 'Put this into practice — HonestCV is in beta with a full free trial: templates, AI rewrites, ATS score and PDF/DOCX downloads, all included ($9.99 one-time when billing opens, never a subscription).' : 'Put this into practice — the HonestCV builder is free to try, with a one-time $9.99 download and no subscription.'}</p>
<a class="btn" href="/builder">Start my free trial</a> &nbsp; <a class="btn" href="/ats-checker" style="background:transparent;color:var(--primary);border:1px solid var(--border)">Check my ATS score</a>
</div>
<div class="related">
<h2>Keep reading</h2>
<ul>
${related.map((r) => `<li><a href="${r.path}">${esc(r.title.split(' — ')[0])}</a></li>`).join('\n')}
</ul>
</div>
</main>
<footer class="site"><div class="in">© ${new Date().getFullYear()} HonestCV · <a href="/guides/">Guides</a> · <a href="/templates/">Templates</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · More honest tools: <a href="https://qr.zalize.com">HonestQR</a> · <a href="https://pdf.zalize.com">HonestPDF</a> · <a href="https://subsleuth.zalize.com">SubSleuth</a></div></footer>
</body>
</html>`
}

function templatePage(p) {
  const canonical = `${SITE}${p.path}`
  const others = TEMPLATE_PAGES.filter((t) => t.path !== p.path)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="HonestCV" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(breadcrumbLd([{ name: 'Templates', path: '/templates/' }, { name: `${p.name} resume template`, path: p.path }]))}</script>
<style>${CSS}</style>
${BEACON}${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />HonestCV</a>
<a class="btn" href="/builder?template=${p.path.split('/').pop()}">Use this template free</a>
</div></header>
<main>
<h1>${esc(p.name)} — ATS-friendly resume template</h1>
<div style="margin:1rem 0">${templateThumbSvg(p.path.split('/').pop(), 140)}</div>
<p class="lede">${esc(p.blurb)}</p>
<ul class="features">
<li>Strictly single-column — the layout ATS parsers read most reliably</li>
<li>Real text-based PDF export (selectable, parseable) plus a genuine DOCX</li>
<li>Live preview while you edit; switch templates any time without retyping</li>
<li>Free ATS match score against any job description you paste</li>
<li>${FREE_MODE ? 'Free to download during our launch — no card, no subscription' : 'One-time $9.99 to download — no subscription, nothing to cancel'}</li>
</ul>
<div class="cta">
<p>Open the builder with the ${esc(p.name)} template already selected — no account needed.</p>
<a class="btn" href="/builder?template=${p.path.split('/').pop()}">Use the ${esc(p.name)} template free</a>
</div>
<div class="related">
<h2>Other templates</h2>
<ul>
${others.map((t) => `<li><a href="${t.path}/">${esc(t.name)} resume template</a></li>`).join('\n')}
</ul>
</div>
</main>
<footer class="site"><div class="in">© ${new Date().getFullYear()} HonestCV · <a href="/guides/">Guides</a> · <a href="/templates/">Templates</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · More honest tools: <a href="https://qr.zalize.com">HonestQR</a> · <a href="https://pdf.zalize.com">HonestPDF</a> · <a href="https://subsleuth.zalize.com">SubSleuth</a></div></footer>
</body>
</html>`
}

function hubPage({ pathname, title, description, h1, intro, items }) {
  const canonical = `${SITE}${pathname}`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="HonestCV" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<style>${CSS}</style>
${BEACON}${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />HonestCV</a>
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(h1)}</h1>
<p class="lede">${esc(intro)}</p>
<ul class="features">
${items.map(({ href, label, blurb, thumb }) => `<li${thumb ? ' style="display:flex;align-items:center;gap:.75rem"' : ''}>${thumb ? `<a href="${href}" style="flex-shrink:0;line-height:0">${thumb}</a>` : ''}<span><a href="${href}">${esc(label)}</a>${blurb ? ` — ${esc(blurb)}` : ''}</span></li>`).join('\n')}
</ul>
<div class="cta">
<p>${FREE_MODE ? 'HonestCV is in beta with a full free trial: templates, AI rewrites, ATS score and PDF/DOCX downloads, all included ($9.99 one-time when billing opens, never a subscription).' : 'The HonestCV builder is free to try, with a one-time $9.99 download and no subscription.'}</p>
<a class="btn" href="/builder">Start my free trial</a> &nbsp; <a class="btn" href="/ats-checker" style="background:transparent;color:var(--primary);border:1px solid var(--border)">Check my ATS score</a>
</div>
</main>
<footer class="site"><div class="in">© ${new Date().getFullYear()} HonestCV · <a href="/guides/">Guides</a> · <a href="/templates/">Templates</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · More honest tools: <a href="https://qr.zalize.com">HonestQR</a> · <a href="https://pdf.zalize.com">HonestPDF</a> · <a href="https://subsleuth.zalize.com">SubSleuth</a></div></footer>
</body>
</html>`
}

const HUBS = [
  {
    pathname: '/vs/',
    title: 'HonestCV vs Other Resume Builders — First-Hand Comparisons',
    description:
      'How HonestCV compares to Zety, Resume.io, Rezi, Teal, Kickresume and other resume builders — based on our own first-hand tests, with pricing and free-tier limits documented.',
    h1: 'HonestCV vs other resume builders',
    intro:
      'We sign up for competitors and run their full flows ourselves — build a resume, use the AI, check the ATS score, try to export — then document what the free tier actually allows and what the subscription really costs. No secondhand claims.',
    items: PAGES.filter((p) => p.path.startsWith('/vs/')).map((p) => ({
      href: `${p.path}/`,
      label: p.name,
      blurb: `${p.description.split('. ')[0].replace(/\.$/, '')}.`,
    })),
  },
  {
    pathname: '/guides/',
    title: 'Resume Guides — Honest, Practical Advice for 2026 | HonestCV',
    description:
      'Free resume guides: ATS formatting, keywords, summaries, action verbs, employment gaps, tailoring to job descriptions, remote-job resumes and more.',
    h1: 'Resume guides',
    intro:
      'Practical, honest resume advice — no fluff, no fabricated-metrics tricks. Each guide is written to be actionable in minutes and pairs with our free in-browser ATS checker.',
    items: GUIDES.map((g) => ({
      href: `${g.path}/`,
      label: g.title.split(' — ')[0].split(' (')[0],
      blurb: `${g.description.split('. ')[0].replace(/\.$/, '')}.`,
    })),
  },
  {
    pathname: '/templates/',
    title: 'ATS-Friendly Resume Templates (Free) — HonestCV',
    description:
      'All 12 HonestCV resume templates: single-column, ATS-safe layouts with real text-based PDF and DOCX export. Fully included in the beta free trial — no account, no subscription.',
    h1: 'ATS-friendly resume templates',
    intro:
      'Every HonestCV template follows one rule: strictly single-column real text, the layout ATS parsers read most reliably. Pick a look below — you can switch templates any time without retyping.',
    items: TEMPLATE_PAGES.map((t) => ({
      href: `${t.path}/`,
      label: `${t.name} resume template`,
      blurb: '',
      thumb: templateThumbSvg(t.path.split('/').pop(), 72),
    })),
  },
]

for (const h of HUBS) {
  const dir = path.join(OUT_DIR, h.pathname.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), hubPage(h))
  console.log(`built ${h.pathname}index.html`)
}

for (const p of GUIDES) {
  const dir = path.join(OUT_DIR, p.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), guidePage(p))
  console.log(`built ${p.path}/index.html`)
}

for (const p of TEMPLATE_PAGES) {
  const dir = path.join(OUT_DIR, p.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), templatePage(p))
  console.log(`built ${p.path}/index.html`)
}

const urls = [
  '/',
  '/builder',
  '/ats-checker',
  ...PAGES.map((p) => `${p.path}/`),
  ...HUBS.map((h) => h.pathname),
  ...GUIDES.map((p) => `${p.path}/`),
  ...TEMPLATE_PAGES.map((p) => `${p.path}/`),
  ...LEGAL_PAGES.map((p) => `${p.path}/`),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), sitemap)
// IndexNow site verification key (public by protocol design, not a secret)
const INDEXNOW_KEY = '88d13cb021bb7d759cc09d7b95af03fc'
writeFileSync(path.join(OUT_DIR, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY)
writeFileSync(
  path.join(OUT_DIR, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
)
console.log('built sitemap.xml + robots.txt')

// llms.txt — a curated site map for AI assistants (https://llmstxt.org)
const llms = `# HonestCV

> ATS-friendly resume builder with a one-time-payment model ($9.99/$19.99 once; currently in beta with a full free trial of every plan): 12 single-column templates, live preview, free ATS match score against any pasted job description, real text-based PDF and DOCX export. No account — resume data stays in the user's browser (localStorage). No subscription, no auto-renewal, no trial trap.

## Core tools

- [Resume builder](${SITE}/builder): full editor with templates, live preview and exports
- [Free ATS checker](${SITE}/ats-checker): paste a resume + job description for an instant match score with matched/missing keywords

## Comparisons (first-hand tests)

${PAGES.filter((p) => p.path.startsWith('/vs/'))
  .map((p) => `- [${p.name}](${SITE}${p.path}/): ${p.description}`)
  .join('\n')}

## Guides

${GUIDES.map((g) => `- [${g.title.split(' — ')[0].split(' (')[0]}](${SITE}${g.path}/): ${g.description}`).join('\n')}

## Templates

${TEMPLATE_PAGES.map((t) => `- [${t.name}](${SITE}${t.path}/): ${t.description}`).join('\n')}
`
writeFileSync(path.join(OUT_DIR, 'llms.txt'), llms)
console.log('built llms.txt')
