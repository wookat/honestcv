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
  '<script>try{var r="";if(document.referrer){var o=new URL(document.referrer).origin;if(o!==location.origin)r=o}navigator.sendBeacon("/api/hit",JSON.stringify({p:location.pathname,r:r}))}catch(e){}</script>'

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
      'Resume.io is one of the most popular resume builders, and like most of the category it monetizes through a low-cost 7-day trial that automatically converts into a recurring subscription (roughly $24.95/month) unless you cancel in time. If you only need a resume for a few weeks of applications, that pricing model works against you. HonestCV is the opposite: the editor, templates and ATS match score are free, and downloading is a one-time purchase — there is never anything to cancel.',
    bullets: [
      'One-time purchase vs a ~$24.95/month auto-renewing subscription',
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
  const related = PAGES.filter((r) => r.slug !== p.slug)
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
<p>${FREE_MODE ? 'Launch special: everything is free right now — editor, ATS templates, match score, AI tools and PDF/DOCX downloads. No card, no trial, nothing that renews.' : 'Everything is free to try — editor, ATS templates, live preview, match score. Pay $9.99 exactly once to download. No subscription, no auto-renewal, nothing to cancel.'}</p>
<a class="btn" href="${p.cta ?? '/builder'}">${esc(p.ctaLabel ?? 'Start building free')}</a>
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
  const related = [...GUIDES.filter((g) => g.path !== p.path), ...PAGES.slice(0, 3)]
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
<p>${FREE_MODE ? 'Put this into practice — the HonestCV builder is completely free during launch: templates, AI rewrites, ATS score and PDF/DOCX downloads.' : 'Put this into practice — the HonestCV builder is free to try, with a one-time $9.99 download and no subscription.'}</p>
<a class="btn" href="/builder">Build my resume free</a> &nbsp; <a class="btn" href="/ats-checker" style="background:transparent;color:var(--primary);border:1px solid var(--border)">Check my ATS score</a>
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
${others.map((t) => `<li><a href="${t.path}">${esc(t.name)} resume template</a></li>`).join('\n')}
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
<p>${FREE_MODE ? 'The HonestCV builder is completely free during launch: templates, AI rewrites, ATS score and PDF/DOCX downloads.' : 'The HonestCV builder is free to try, with a one-time $9.99 download and no subscription.'}</p>
<a class="btn" href="/builder">Build my resume free</a> &nbsp; <a class="btn" href="/ats-checker" style="background:transparent;color:var(--primary);border:1px solid var(--border)">Check my ATS score</a>
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
      blurb: '',
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
      blurb: '',
    })),
  },
  {
    pathname: '/templates/',
    title: 'ATS-Friendly Resume Templates (Free) — HonestCV',
    description:
      'All 12 HonestCV resume templates: single-column, ATS-safe layouts with real text-based PDF and DOCX export. Free during launch — no account, no subscription.',
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
${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
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

> Free ATS-friendly resume builder with a one-time-payment model (currently free during launch): 12 single-column templates, live preview, free ATS match score against any pasted job description, real text-based PDF and DOCX export. No account — resume data stays in the user's browser (localStorage). No subscription, no auto-renewal, no trial trap.

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
