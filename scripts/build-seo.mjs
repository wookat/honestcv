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
// First-party pageview beacon (the sole pageview source; path only, no PII).
// External file so the strict CSP (script-src 'self') needs no inline scripts.
const FP_BEACON = '<script defer src="/t.js"></script>'

const PAGES = [
  {
    slug: 'vs-zety',
    path: '/vs/zety',
    name: 'RezUp vs Zety',
    title: 'RezUp vs Zety — One-Time $9.99 vs a $25.95/4-Week Subscription',
    description:
      'Comparing RezUp and Zety: Zety’s $2.70 trial auto-renews at ~$25.95 every 4 weeks. RezUp charges $9.99 once — no subscription, no stored card, no cancellation maze.',
    h1: 'RezUp vs Zety: pay once, or pay every four weeks?',
    intro:
      'Zety is a polished resume builder — but its pricing is built around a small “trial” fee that automatically converts into a recurring charge of roughly $25.95 every four weeks until you cancel. “Zety charged me” is one of the most-searched complaints in this category. RezUp takes the opposite approach: everything is free to try, downloading costs $9.99 exactly once, and we never store your card for recurring billing.',
    bullets: [
      'RezUp: $9.99 one-time. Zety: ~$2.70 trial that auto-renews at ~$25.95 / 4 weeks',
      'RezUp never stores your card for recurring charges — there is nothing to cancel',
      'Free ATS match score before you pay; Zety keeps scoring behind the paywall',
      'No account required — your resume stays in your browser, not on our servers',
      'Real text-based PDF and genuine DOCX export, no watermark',
    ],
  },
  {
    slug: 'vs-livecareer',
    path: '/vs/livecareer',
    name: 'RezUp vs LiveCareer',
    title: 'RezUp vs LiveCareer — $9.99 Once vs Auto-Renewing Subscription',
    description:
      'LiveCareer uses the same trial-to-subscription model as Zety. RezUp is a one-time $9.99 purchase: ATS templates, AI rewrites, PDF/DOCX export — and nothing to cancel.',
    h1: 'RezUp vs LiveCareer: no trial traps here',
    intro:
      'LiveCareer (from the same company family as Zety) offers a cheap 14-day trial that converts to a recurring subscription unless you cancel in time. If you only need a resume for a few weeks of job hunting, a subscription makes no sense. RezUp charges $9.99 exactly once, and every trust feature — the ATS score, the live preview, the editor — is free before you pay.',
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
    title: 'Resume Builder With One-Time Payment (No Subscription) — RezUp',
    description:
      'Looking for a resume builder without a subscription? RezUp is $9.99 one-time: ATS-friendly templates, free match score, AI rewrites, PDF & DOCX downloads. No auto-renewal, ever.',
    h1: 'A resume builder with a one-time payment — no subscription',
    intro:
      'Most big resume builders (Zety, LiveCareer, ResumeGenius…) run on trial-to-subscription pricing: a couple of dollars up front, then ~$24–26 every four weeks until you cancel. If you searched “resume builder one time payment”, you already know why that’s a problem. RezUp is exactly what it says: build free, pay $9.99 once to download, own it forever.',
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
      'Check your resume against any job description for free. RezUp computes an ATS keyword match score in your browser — no upload, no account, no email required.',
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
    name: 'RezUp vs Resume.io',
    title: 'RezUp vs Resume.io — One-Time Purchase vs a Recurring Subscription',
    description:
      'Resume.io charges a small trial fee that converts to a recurring subscription. RezUp is a one-time purchase: ATS templates, AI rewrites, free match score, PDF/DOCX export.',
    h1: 'RezUp vs Resume.io: buy your resume, don’t rent it',
    intro:
      'Resume.io is one of the most popular resume builders, and like most of the category it monetizes through a low-cost 7-day trial that automatically converts into a recurring subscription (its pricing page currently lists $29.95/month) unless you cancel in time. If you only need a resume for a few weeks of applications, that pricing model works against you. RezUp is the opposite: the editor, templates and ATS match score are free, and downloading is a one-time purchase — there is never anything to cancel.',
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
    name: 'RezUp vs Resume Genius',
    title: 'RezUp vs Resume Genius — No 14-Day Trial That Auto-Renews',
    description:
      'Resume Genius uses a 14-day trial that converts to ~$23.95 every 4 weeks. RezUp has no subscription at all: build free, download with a single one-time purchase.',
    h1: 'RezUp vs Resume Genius: skip the trial-to-subscription funnel',
    intro:
      'Resume Genius advertises a 14-day full-access trial for a couple of dollars — and if you don’t cancel in time, it converts to roughly $23.95 every four weeks. Thousands of “resume genius charged me” complaints exist for exactly this reason. RezUp never takes your card for a trial: everything except downloading is free forever, and downloading is one single payment with nothing to cancel afterwards.',
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
    name: 'RezUp vs Kickresume',
    title: 'RezUp vs Kickresume — Free Real PDF Export vs a PNG Preview',
    description:
      'We tested Kickresume ourselves: the free tier only exports a PNG of your first page, and full access runs ~$19–24/month. RezUp gives you real PDF & DOCX downloads with no subscription.',
    h1: 'RezUp vs Kickresume: a real PDF beats a PNG preview',
    intro:
      'We signed up for Kickresume and ran the full flow ourselves (August 2026). The editor is slick, but the free tier will not give you a usable resume: PDF download is locked, and the only free export is a PNG image of your first page — which ATS systems cannot parse. Full access is a subscription at roughly $19–24 per month. We also found its AI writer happily invents metrics (percentages and dollar figures) it cannot know about you. RezUp exports real, text-based PDF and DOCX files, scores your resume against the actual job description for free, and its AI never fabricates facts — it marks gaps for you to fill instead.',
    bullets: [
      'RezUp: real text-based PDF + DOCX export. Kickresume free tier: PNG image of page one only',
      'No subscription vs ~$19–24/month for full access',
      'Free ATS match score against any pasted job description',
      'AI that never invents employers, dates or metrics — Kickresume’s AI generated fictional “35%” style achievements in our test',
      'No account needed; your resume stays in your browser',
    ],
  },
  {
    slug: 'vs-rezi',
    path: '/vs/rezi',
    name: 'RezUp vs Rezi',
    title: 'RezUp vs Rezi — Free ATS Scoring Without the Free-Tier Limits',
    description:
      'We tested Rezi ourselves: the free tier caps you at 1 resume, 3 PDF downloads, 10 AI generations and 1 template; DOCX is paywalled. RezUp has none of those limits and no subscription.',
    h1: 'RezUp vs Rezi: what the free tier actually lets you do',
    intro:
      'We registered for Rezi and ran the full flow ourselves (August 2026). It is a polished product — the Rezi Score and keyword targeting are genuinely good. But the free tier is tightly rationed: one resume, three PDF downloads, ten AI generations, one template (the other ten are Pro-locked), and DOCX export sits behind a hard paywall. Full access is a subscription at $29/month (or $149 lifetime). RezUp takes the opposite approach: unlimited resumes and downloads, real text-based PDF and DOCX export, a free ATS match score against any job description you paste, and 25 templates you can switch between freely — with your data staying in your browser instead of an account.',
    bullets: [
      'No caps: Rezi free tier = 1 resume, 3 PDF downloads, 10 AI generations, 1 of 11 templates; DOCX paywalled',
      'No subscription vs $29/month (or a $149 lifetime plan)',
      'Free ATS match score with matched & missing keywords against any pasted job description',
      'All 22 ATS-safe single-column templates included — switch any time without retyping',
      'No account needed; your resume stays in your browser',
    ],
  },
  {
    slug: 'vs-teal',
    path: '/vs/teal',
    name: 'RezUp vs Teal',
    title: 'RezUp vs Teal — A Focused Resume Builder vs $13/week Upsells',
    description:
      'We tested Teal ourselves: a capable free tier inside a job-search platform, monetized by weekly-billed subscriptions (~$13/week) and paywalled optimization details. RezUp is a focused, no-subscription resume builder.',
    h1: 'RezUp vs Teal: focused resume building vs a weekly-billed platform',
    intro:
      'We registered for Teal and ran the full flow ourselves (August 2026). Credit where due: Teal’s free tier is one of the most generous — unlimited resumes, watermark-free PDF export, ten templates. But it is a whole job-search platform, and its business model is a subscription billed from about $13 per week, with the monthly plan pre-selected at checkout and the useful depth (analyzer suggestion details, the full keyword comparison list, unlimited AI) locked behind it. In our test its AI also invented a fictional “30%” metric the resume never contained. RezUp is deliberately narrower: just an honest resume builder with free ATS scoring including the full missing-keyword list, AI that refuses to fabricate facts, real PDF and DOCX export, and no subscription of any kind.',
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
    name: 'RezUp vs FlowCV',
    title: 'RezUp vs FlowCV — One-Time Pricing and Browser-Local Privacy',
    description:
      'We tested FlowCV ourselves: a genuinely generous free tier (1 resume, unlimited PDF downloads) with $3–5/month subscriptions on top. RezUp differs on privacy (browser-local, no account) and one-time pricing.',
    h1: 'RezUp vs FlowCV: two honest builders, two different trade-offs',
    intro:
      'We registered for FlowCV and ran the full flow ourselves (August 2026) — and credit where due: it is one of the fairest products in this category. The free plan really is free: one resume, unlimited watermark-free PDF downloads, all templates, and clear auto-renewal disclosure on its cheap paid tiers (Basic $3/month and Pro $5/month, billed yearly). The differences are structural. FlowCV requires an account and a verified email before any download, renders your PDF on its servers (the exported file’s metadata shows server-side Chromium), and caps the free plan at a single resume. RezUp needs no account, keeps your resume data in your browser and generates the PDF locally on your machine, lets you keep unlimited tailored copies, and charges once instead of a subscription — currently free during beta.',
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
    name: 'RezUp vs Novorésumé',
    title: 'RezUp vs Novorésumé — Free Limits, Privacy and Pricing Compared',
    description:
      'We registered for Novorésumé and ran the full flow ourselves: free plan allows 1 single-page resume with free PDF download; Premium is $21.99/month or $139.99/year (non-recurring). RezUp differs on privacy, unlimited copies and one-time pricing.',
    h1: 'RezUp vs Novorésumé: what we found testing it ourselves',
    intro:
      'We created a Novorésumé account and walked its full flow (August 2026). Credit where due: the free Basic plan really does let you download a watermark-free PDF, its pre-download review flags real ATS issues, and Premium ($21.99/month, $39.99/quarter or $139.99/year) is explicitly non-recurring — no auto-renewal trap. The limits are structural: Basic stores exactly one resume, capped at a single page, with no cover letter and only predefined layouts; downloads are gated behind an account with email code verification; and your resume lives on their servers, with the PDF rendered server-side. RezUp needs no account, keeps your resume in your browser and generates the PDF and DOCX locally, allows unlimited pages and unlimited saved copies, and includes cover letter and interview-prep tools — one-time pricing, currently free during beta.',
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
    name: 'RezUp vs Enhancv',
    title: 'RezUp vs Enhancv — Branding, Privacy and Pricing Compared',
    description:
      'We signed up for Enhancv and ran its full flow ourselves: free downloads carry a "Powered by Enhancv" footer, the ATS keyword check is free but full suggestions are paywalled, and Pro runs $16.50–$39/month. RezUp differs on branding-free exports, privacy and one-time pricing.',
    h1: 'RezUp vs Enhancv: what we found testing it ourselves',
    intro:
      'We created an Enhancv account and walked its full flow (August 2026). Credit where due: its guided chat-style onboarding is smooth, the free plan really does export a PDF and a TXT file, and its job-description match check with a per-keyword frequency table is genuinely useful — we liked that pattern enough to build our own version into RezUp\u2019s free ATS checker. The catches: every free PDF carries a "Powered by Enhancv" branding footer (branding-free export is a paid feature), the resume grade and ATS suggestions are mostly behind an "Unlock Full Report" paywall, saving or downloading requires an account with email code verification, your resume lives on their servers, and Pro is a recurring subscription at $39/month, $23/month billed quarterly, or $16.50/month billed semiannually. RezUp keeps your resume in your browser, renders PDF/DOCX/TXT locally with no branding at any tier, and shows the whole ATS report free — one-time pricing, currently free during beta.',
    bullets: [
      'No branding footer on any export — Enhancv\u2019s free PDFs print "Powered by Enhancv" at the bottom',
      'Full ATS report free, including every suggestion — Enhancv paywalls the full report behind Pro',
      'Your resume never leaves your browser: local PDF/DOCX/TXT generation vs server-side rendering',
      'No account or email code needed to download — Enhancv gates save/download behind a verified account',
      'One-time pricing ($9.99/$19.99 when billing opens) vs a $16.50–$39/month recurring subscription',
    ],
  },
  {
    slug: 'vs-resume-worded',
    path: '/vs/resume-worded',
    name: 'RezUp vs Resume Worded',
    title: 'RezUp vs Resume Worded — Free Limits, Privacy and Pricing Compared',
    description:
      'We created a Resume Worded account and ran its full flow ourselves: the free resume score locks several checks behind Pro, the keyword targeting tool is genuinely free, and Pro runs $19–$49/month recurring. RezUp differs on privacy, a fully free report and one-time pricing.',
    h1: 'RezUp vs Resume Worded: what we found testing it ourselves',
    intro:
      'We created a Resume Worded account and walked its full flow (August 2026). Credit where due: its free Targeted Resume tool really does compare your resume to a job description at no charge, with a relevancy score, found/missing keyword counts and a side-by-side view — a genuinely useful free tool. The catches: it is a checker, not a builder (templates are Word/Google Docs downloads); the free resume score locks several checks (Leadership, Communication, Teamwork and more) plus the full report behind Pro; scoring requires an account and your resume is uploaded to their servers; the signup form pre-checks a weekly email subscription; and Pro is a recurring subscription at $49/month, $33/month billed quarterly, or $19/month billed yearly against a $75 strikethrough anchor. RezUp is a full builder plus checker: your resume stays in your browser, the entire ATS report is free with no locked checks, and no account or email is needed — one-time pricing, currently free during beta.',
    bullets: [
      'Full builder + checker in one — Resume Worded checks resumes but sends you to Word/Google Docs templates to edit',
      'Every check in the ATS report is free — Resume Worded locks several recruiter checks and the full report behind Pro',
      'Your resume never leaves your browser — Resume Worded requires an account and uploads your resume to score it',
      'No pre-checked email subscriptions — their signup form opts you into a weekly email by default',
      'One-time pricing ($9.99/$19.99 when billing opens) vs a $19–$49/month recurring subscription',
    ],
  },
  {
    slug: 'vs-jobscan',
    path: '/vs/jobscan',
    name: 'RezUp vs Jobscan',
    title: 'RezUp vs Jobscan — Free Scan Limits and Pricing Compared',
    description:
      'We checked Jobscan\u2019s public plan page ourselves (August 2026): the free tier allows 5 resume scans per month with 5 findings, and paid plans run $29.98\u2013$49.95/month recurring with a 7-day trial that auto-bills. RezUp\u2019s ATS checker is unlimited, free and browser-local.',
    h1: 'RezUp vs Jobscan: what its own plan page shows',
    intro:
      'Jobscan is one of the best-known ATS match tools, and its scan-against-the-job-description concept is genuinely the right idea — it\u2019s the same core workflow our free ATS checker implements. We reviewed Jobscan\u2019s public plan page firsthand (August 2026). What it shows: the free tier is capped at 5 resume scans per month with 5 ATS & recruiter findings; unlimited scans require a paid plan at $49.95/month, or $29.98/month billed quarterly as $89.95 every 3 months; the 7-day free trial converts into a quarterly charge automatically if you don\u2019t cancel in time ("Once your trial ends, you will be billed for the next quarter"), and per its cancellation policy you lose access to paid features and the data associated with them when the subscription expires. We could not fully exercise its scanner (parts of the site block automated-looking traffic), so we make no claims about its scoring quality. RezUp\u2019s ATS checker is unlimited and free with no account, runs entirely in your browser, and our plans are one-time purchases — currently free during beta with no card required.',
    bullets: [
      'Unlimited free ATS checks — Jobscan\u2019s free tier is capped at 5 scans per month',
      'No trial-to-subscription conversion: nothing to cancel, no card required — Jobscan\u2019s 7-day trial auto-bills a quarterly charge',
      'Your resume never leaves your browser — Jobscan scans server-side on your uploaded resume',
      'Your data stays yours: browser-local with JSON backup — Jobscan\u2019s policy drops paid-feature data after expiry',
      'One-time pricing ($9.99/$19.99 when billing opens) vs $29.98\u2013$49.95/month recurring',
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
      ['Use a single-column layout', 'ATS parsers read top-to-bottom, left-to-right. Multi-column layouts, text boxes, tables and graphics frequently scramble the parse order or get dropped entirely. A clean single-column layout with clear headings is the safest format — it’s why every RezUp template is single-column.'],
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
      ['Let AI polish, not fabricate', 'An AI rewrite should tighten your real accomplishments, not invent new ones — fabricated metrics fall apart in interviews. RezUp’s AI is explicitly constrained to never invent employers, dates, degrees or numbers.'],
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
    path: '/guides/two-column-resume-ats',
    title: 'Are Two-Column Resumes ATS-Safe? What Actually Breaks Parsing (2026)',
    description:
      'Whether two-column resumes survive ATS parsing: how parsers read columns, what actually breaks (text boxes, tables, sidebars), the reading-order test, and when a single column wins.',
    h1: 'Two-column resumes and the ATS: what actually breaks',
    sections: [
      ['The short answer: risky, and rarely worth it', 'Modern parsers handle many two-column layouts — but not all, and you can\u2019t see which ATS a company runs. A single column parses everywhere, reads faster for humans, and costs you nothing. The two-column upside is aesthetic; the downside is your skills section landing in the wrong job\u2019s field.'],
      ['How parsers actually read a page', 'Parsers extract text in reading order — usually left-to-right, top-to-bottom across the whole page width. A well-built two-column PDF stores text in logical order and parses fine; a layout built from floating text boxes stores it in creation order, and the parser interleaves your sidebar with your work history.'],
      ['What actually breaks: text boxes, tables, headers', 'The real offenders are the mechanisms design tools use to make columns: text boxes (extracted out of order or skipped), layout tables (cells read across rows, scrambling sections), and content placed in the document header/footer region (many parsers ignore it entirely — a classic spot to lose your phone number).'],
      ['The reading-order test you can run yourself', 'Open your exported PDF, select all, copy, and paste into a plain-text editor. If sections appear complete and in a sensible order, a parser will see the same. If your skills interleave with job bullets or the sidebar lands mid-employment-history, the ATS sees that too.'],
      ['Dates and titles in the wrong column', 'ATS parsers map text to fields: employer, title, start/end dates. Two-column layouts that put dates in a left rail separated from the role text break that pairing — the parser can\u2019t tell which date belongs to which job, and your experience timeline arrives scrambled or empty.'],
      ['Skills sidebars: the most common casualty', 'The typical two-column pattern — skills, education and contact in a narrow sidebar — puts your keyword-densest content in the least reliably parsed region. If the sidebar is a text box, your keyword match score at real employers silently drops to near zero.'],
      ['"But I applied with one and got the job"', 'Survivorship isn\u2019t evidence: many applications are read by humans first, some ATSs parse columns fine, and referrals bypass parsing entirely. The question isn\u2019t whether two-column ever works — it\u2019s whether the layout is worth a silent failure rate you can\u2019t measure.'],
      ['When two columns are fine', 'Roles where the resume is reviewed by humans only (small companies, direct-email applications, design portfolios attached as PDF) and print contexts. If you know a human reads first, a clean two-column resume is a taste choice, not a risk.'],
      ['The hybrid that keeps the look without the risk', 'Want visual structure without parser risk? Use full-width sections with a strong heading hierarchy, a horizontal skills line under the summary, and generous white space. Banded headings give the "designed" feel while keeping one text flow.'],
      ['What recruiters think of two-column resumes', 'Mixed — some find them scannable, many find sidebars cramped at 9pt. What they agree on: they read top-to-bottom-left-to-right, so anything in a sidebar gets skimmed last or not at all. Your best evidence belongs in the main flow either way.'],
      ['If you keep two columns, build them right', 'Use real column objects (not text boxes), keep all experience — titles, employers, dates, bullets — in one column, keep contact info out of the header/footer region, export to PDF, and run the copy-paste test before every send.'],
      ['The single-column rule we build on', 'All 25 RezUp templates are single-column real text by design — the one layout rule that removes ATS parsing risk entirely. The visual variety comes from typography, accent color and banded headings, not from layout mechanics that parsers trip on.'],
    ],
  },
  {
    path: '/guides/best-resume-fonts',
    title: 'Best Resume Fonts, Sizes and Margins (2026) — What ATS and Recruiters Actually See',
    description:
      'Which fonts survive ATS parsing and 7-second skims: safe font choices, the 10.5-12pt size window, margin minimums, line spacing, and the styling that quietly breaks parsing.',
    h1: 'Resume fonts, sizes and margins that actually work',
    sections: [
      ['Fonts are a readability decision, not a style one', 'Nobody was ever hired for a font — but candidates are skimmed in ~7 seconds, and a cramped or ornate page loses information in that window. The goal: maximum legibility at a glance, zero parsing risk, no distraction from the content.'],
      ['Safe choices that never hurt you', 'Sans-serif: Calibri, Arial, Helvetica, Verdana, Lato, Open Sans. Serif: Georgia, Garamond, Cambria, Times New Roman (dated but harmless). All ship with or embed cleanly into PDFs, render identically across systems, and parse as plain text.'],
      ['Fonts to avoid, and why', 'Script and display fonts (Pacifico, Comic Sans, Papyrus) read as unserious. Ultra-thin weights disappear in print and scans. Obscure downloaded fonts may not embed in your PDF — the receiving system substitutes something else and your layout shifts. Icon fonts for contact symbols parse as garbage characters.'],
      ['The size window: 10.5–12pt body', 'Below 10.5pt, recruiters strain and printed copies blur; above 12pt, body text looks padded. Name: 18-24pt. Section headings: 12-14pt. If you\u2019re shrinking below 10.5 to fit one page, cut content instead — a readable page beats a complete one.'],
      ['Margins: 0.5 inch is the floor', '0.75-1 inch reads best; 0.5 inch is the working minimum before pages look wall-to-wall and some printers clip edges. Never fake space with 0.3-inch margins and 9pt text — recruiters recognize the trick instantly, and it reads as "couldn\u2019t prioritize".'],
      ['Line spacing and white space', '1.0-1.15 line spacing within bullets, a visible gap between sections and entries. White space is what makes a 7-second skim land on the right things — a dense page hides your best bullet as effectively as deleting it.'],
      ['What the ATS actually sees', 'Parsers read text, not typography: font choice, size and color are invisible to them. What breaks parsing is structure — text converted to images or outlines, icon fonts, and text boxes. Any real text in a standard font parses; the "ATS-safe font list" fear is mostly myth, the structure risk is not.'],
      ['Bold, italics and color — where they help', 'Bold for names, titles and section headings; italics sparingly for company descriptors; one accent color for headings if you like. All parse fine as real text. What doesn\u2019t: relying on color alone to convey meaning, or highlighting so much that nothing stands out.'],
      ['Consistency beats beauty', 'One font family (or one serif + one sans pairing), one body size, one date format, one bullet style. Recruiters can\u2019t articulate why a mixed-format resume feels off — but it does, and it reads as carelessness before they\u2019ve read a word.'],
      ['Print and screen both matter', 'On-site interviewers still print resumes. Check yours at 100% zoom on a laptop and as a physical printout: thin grays vanish on paper, 10pt text that looked fine on a 27-inch monitor doesn\u2019t on A4/Letter. Dark text on white remains the only safe bet.'],
      ['PDF export is where fonts break', 'Export as PDF with fonts embedded (any mainstream builder or word processor does this by default) and open the file once before sending — a substituted font shows up immediately as shifted layout. If a portal demands DOCX, stick to system fonts so the receiving machine renders what you saw.'],
      ['Or let the template decide', 'All 25 RezUp templates use pre-tested font pairings, sizes and margins that pass ATS parsing and print cleanly — with S/M/L text and spacing controls inside the safe ranges, so you can compress to one page without breaking the rules above.'],
    ],
  },
  {
    path: '/guides/how-far-back-should-a-resume-go',
    title: 'How Far Back Should a Resume Go? 10-15 Years, With Exceptions (2026)',
    description:
      'The 10-15 year rule, when to break it, how to compress older experience into an early-career line, age-signal details to drop, and what recruiters actually check dates for.',
    h1: 'How far back should your resume go?',
    sections: [
      ['The short answer: 10–15 years', 'Recruiters read your last two or three roles closely and skim everything older. Ten years covers most screening questions; fifteen if your strongest, most relevant work sits that far back. Beyond that, older roles cost space that your recent evidence needs — and add age signals you don\u2019t owe anyone.'],
      ['Why the cutoff exists', 'Screening is a relevance test, not a biography check. A 2008 role rarely predicts 2026 performance: the tools changed, the team is gone, and no reference will be reachable. Every line an old job occupies is a line your current results don\u2019t get.'],
      ['Relevance beats recency — the real rule', 'The 10-15 window is a proxy for "still relevant". If you\u2019re returning to a field you left, the older in-field role can matter more than a recent out-of-field one — keep the relevant role with bullets and compress the recent detour to a line instead.'],
      ['How to cut without creating a gap', 'Don\u2019t delete old roles silently — a resume that starts mid-career invites "what came before?" Add a one-line closer under your experience section: "Earlier career: engineering roles at Acme and Initech, 2006–2012." It answers the question in twelve words and zero bullets.'],
      ['The "Earlier career" line, done right', 'Company names and a year range only — no bullets, no titles unless one is impressive ("including 2 years as team lead"). It exists to complete the timeline, not to be read. One line for all pre-cutoff roles combined.'],
      ['When to keep an old role in full', 'Keep it when it\u2019s your best evidence for this posting: the brand is a door-opener (Google, a Big 4), the role matches the target job exactly, or it\u2019s the last time you held the title you\u2019re applying back into. Trim it to 2-3 bullets — old roles never outrank recent ones for space.'],
      ['Education dates: when the year helps and hurts', 'A graduation year within ~15 years is normal and answers a timeline question. Older than that, the year mostly signals age — you may drop it and list the degree alone. New grads: keep the year; it explains a short experience section.'],
      ['Other age signals to drop with the old roles', 'An AOL/Hotmail address, "25+ years of experience" in the summary, technologies dead a decade (Flash, Lotus Notes), and a two-column skills list padded with them. If you cut the 1990s jobs but keep the 1990s signals, the cut bought nothing.'],
      ['Senior candidates: depth over span', 'For director/VP applications, scope is your evidence — but scope from your last 2-3 roles. "Led 120 engineers across 4 sites" from 2023 does the work; the same claim from 2009 doesn\u2019t. Let the summary state total span ("15+ years") and the bullets stay recent.'],
      ['What recruiters actually check dates for', 'Sequence and gaps, not ancient history. They verify your last two employers, look for unexplained recent gaps, and check the current role\u2019s length. Nobody calls your 2007 manager — which is exactly why those bullets are wasted space.'],
      ['ATS parsers don\u2019t care — but the page does', 'Parsers extract every role regardless of age; there\u2019s no ATS penalty for old jobs. The cost is human: a screener spends the same 7 seconds on a 1-page and a 3-page resume, so the third page mostly dilutes the first.'],
      ['Trim it mechanically', 'In our builder, delete pre-cutoff roles and paste the "Earlier career" line as the last entry\u2019s detail or a custom section — the live page-count indicator shows what the cut buys you, and the ATS checker confirms your match score against the posting before you send it.'],
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
      ['How to format the section', 'One line at the very bottom, labeled “Interests”, comma-separated. Never above skills or experience, never with icons or graphics that break ATS parsing. In RezUp, a one-line custom section keeps it parseable in both the PDF and DOCX export.'],
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
  {
    path: '/guides/resume-file-format',
    title: 'Resume File Format: PDF vs DOCX vs Plain Text (Which to Send in 2026)',
    description:
      'Which resume file format to send and when: PDF for most applications, DOCX when the portal demands it, plain text for forms — plus file naming, fonts, and the export mistakes that break ATS parsing.',
    h1: 'Resume file format: PDF vs DOCX vs plain text',
    sections: [
      ['The default: text-based PDF', 'PDF locks your layout on every device and every ATS that will ever open it, and modern parsers read text-based PDFs reliably. Unless the posting says otherwise, export PDF. The one hard requirement: the text must be selectable — if you can’t copy a line out of your own PDF, a parser can’t read it either.'],
      ['When DOCX is the right answer', 'Some agency workflows, government portals and older enterprise ATS explicitly request Word files, and a few portals re-render resumes into their own template from DOCX. When the posting names .doc/.docx, send a real DOCX export — never a PDF renamed to .docx; the extension must match the actual format or the upload fails validation.'],
      ['When plain text wins', 'Application form fields ("paste your resume here"), some job-board quick-apply flows, and email bodies where attachments are refused. Keep a .txt version with standard headings, hyphen bullets, and one blank line between sections — it pastes cleanly anywhere. RezUp exports TXT alongside PDF and DOCX for exactly this.'],
      ['Formats to never send', 'Pages, ODT, RTF, HTML, PNG/JPG screenshots, and Canva/design-tool exports that flatten text into curves. Every one of them either fails to open on the reviewer’s machine or parses as an empty document. If your resume lives in a design tool, re-create it in a text-first editor before applying.'],
      ['Fonts and embedding', 'Stick to widely available fonts (system fonts or embedded standard faces). A PDF with non-embedded exotic fonts renders as tofu boxes on machines without them; a DOCX with a missing font silently reflows and can push your resume to a second page. Every RezUp template uses embedded, parser-safe fonts.'],
      ['File naming', '"Maya-Chen-Resume.pdf": your name, the word resume, nothing else. No dates, versions, or "final_v3 (2)". The filename appears in the recruiter’s ATS and download folder — it should identify you, not your revision history.'],
      ['File size', 'Keep it under 1–2 MB. Text-based exports are naturally tiny (tens of KB); a multi-megabyte resume almost always means embedded photos or scans — both of which you should remove anyway. Some portals hard-reject uploads over 2 MB.'],
      ['One column, whatever the format', 'Format choice can’t rescue a layout parsers can’t read. Tables, text boxes and multi-column designs scramble in every format; a clean single-column structure survives PDF, DOCX and plain text alike. Choose structure first, format second.'],
      ['The renamed-extension trap', 'Renaming resume.pdf to resume.docx (or vice versa) is the single most common upload failure: the portal checks the real file signature, not the name. Always export to the requested format from your editor.'],
      ['Test what the parser sees', 'Copy-paste your exported file into a plain-text editor. If your sections come out in order, with readable headings, dates and bullets, an ATS will cope. Our free ATS checker parses your actual PDF or DOCX in the browser and shows exactly what was extracted.'],
      ['Keep all three exports in sync', 'The dangerous state is a PDF that says one thing and a DOCX that says another. Regenerate every format from the same source after each edit — in RezUp all exports render from the same data, so they can’t drift.'],
      ['The decision in one line', 'PDF by default · DOCX only when explicitly requested · plain text for paste-in forms · never images or design-tool exports · name the file after yourself · test the parse before you send.'],
    ],
  },
  {
    path: '/guides/linkedin-vs-resume',
    title: 'LinkedIn vs Resume: What Goes Where (and the Consistency Checks Recruiters Run)',
    description:
      'How your LinkedIn profile and resume should differ, what must match exactly, and the consistency checks recruiters actually run — titles, dates, and the red flags that cost interviews.',
    h1: 'LinkedIn vs resume: what goes where',
    sections: [
      ['Two documents, two jobs', 'Your resume is a targeted pitch for one specific role — one to two pages, tailored per application. Your LinkedIn is a discoverable career record — comprehensive, keyword-rich, written once for many readers. Treating them as copies of each other wastes what each does best.'],
      ['What must match exactly', 'Job titles, employers, and employment dates. Recruiters routinely open your LinkedIn next to your resume, and mismatched dates or inflated resume titles are among the fastest ways to get filtered out — they read as dishonesty even when they’re sloppiness.'],
      ['What should differ', 'The resume trims to what the target role needs; LinkedIn can carry every role, project and skill. Resume bullets are tailored and quantified for one posting; the LinkedIn About section is broader and first-person. Recommendations, media and volunteer detail belong on LinkedIn, not squeezed into the resume.'],
      ['Titles: official vs searchable', 'If your official title was internal jargon ("Member of Technical Staff 4"), keep it on the resume with a standard equivalent in parentheses, and use the same convention on LinkedIn. Never show a different, grander title in one place — that’s the exact mismatch screeners look for.'],
      ['Dates: month precision, both places', 'Use month + year on both. Year-only dates on one side and months on the other create phantom gaps or overlaps when compared. If you must round anywhere, round identically in both.'],
      ['The consistency checks recruiters run', 'Title match, date match, employer-name match, and a skim of whether your headline supports the application ("Marketing leader" applying for a data-engineering role raises questions). Some also check that your most impressive resume claim appears somewhere on LinkedIn — a 45% cost cut that exists in only one document invites doubt.'],
      ['Your headline is not your job title', 'The LinkedIn headline is searchable ad space: "Backend engineer — payments infrastructure, Go/Postgres" outperforms a bare title. But keep it truthful and role-consistent with the jobs section; a puffed-up headline contradicting your experience reads worse than a plain one.'],
      ['Open-to-work and timing', 'The green banner is visible to everyone including your employer’s recruiters unless you restrict it to recruiters-only mode. Set it before a search burst, not after applications are already out — profile views spike when recruiters cross-check your application.'],
      ['Keywords work differently', 'Resume keywords target one job description; LinkedIn keywords target recruiter search queries. On LinkedIn, load the Skills section and About with the standard names for what you do (the same spelled-out + acronym rule applies: "search engine optimization (SEO)").'],
      ['The URL belongs on your resume', 'Claim your custom LinkedIn URL (linkedin.com/in/yourname) and put it in your resume contact line as real text — parsers extract it and recruiters click it. A default URL with random digits looks unclaimed.'],
      ['Neither replaces the other', '"See my LinkedIn" on a resume reads as unfinished; a bare skeletal LinkedIn under an active application invites doubt. Keep the resume tailored and complete for each application, keep LinkedIn current enough that the cross-check confirms rather than contradicts.'],
      ['The five-minute audit before applying', 'Open both side by side: titles match · dates match · employers match · headline supports the application · top resume claim appears on the profile · custom URL claimed and listed. Five minutes that protects every application you send.'],
    ],
  },
  {
    path: '/guides/resume-for-teens',
    title: 'Resume for Teens: First Job Resume With No Experience (2026 Guide)',
    description:
      'How to write a first-job resume as a teenager: what to put instead of work history, school and volunteer sections that count, availability details, and a structure that works.',
    h1: 'How to write a resume for your first job as a teen',
    sections: [
      ['You have more material than you think', 'A first resume is not an empty work-history form. School coursework, clubs, sports, volunteering, babysitting, lawn care, a family business shift — anything with responsibility and a result counts. The job is to present it in the structure employers expect.'],
      ['The structure that works', 'Contact info → one-line objective → Education → Activities & Leadership → Volunteer/Informal work → Skills. Experience goes above Education only once you have a formal job to list. One page, single column, standard headings — the same parser-safe rules as any resume.'],
      ['Write an objective, not a summary', 'This is the one case where an objective beats a summary: you have no track record to summarize. One honest line: "High school junior seeking a part-time cashier role; available weekends and after 3:30pm; reliable, quick to learn a register." Availability up front is a genuine advantage.'],
      ['Education is your experience section', 'List your school, expected graduation year, GPA if 3.5+, and relevant coursework or projects with concrete outcomes: "Built the scoring spreadsheet used by the debate team for 3 tournaments." Treat strong schoolwork like work.'],
      ['Informal work absolutely counts', 'Babysitting, mowing lawns, tutoring, reselling, helping in a family shop — list them like jobs, with dates and a quantified line: "Babysat for 3 families, 2022–2024; managed evenings for children aged 2–9, trusted with bedtime routines and meals." Employers read this as reliability.'],
      ['Clubs, sports and leadership', 'Team captain, section leader, club treasurer, event organizer — each is evidence of showing up and being trusted. One bullet each, with scope: "Organized the club\u2019s bake-sale fundraiser; 12 volunteers, raised $840."'],
      ['Skills teens actually have', 'List concrete, checkable skills: cash handling, Google Docs/Sheets, Canva, a second language, First Aid/CPR certification, typing speed, social media content. Skip personality claims ("hardworking") — the bullets should prove those.'],
      ['What to leave off', 'Photo, age or date of birth, full street address (city is enough), middle-school achievements once you\u2019re in high school, and anything invented. Employers of teens check small claims easily — a made-up certification costs the job.'],
      ['Availability and working papers', 'Many teen jobs are decided on schedule fit. State your availability explicitly, and if your state/country requires working papers or has hour limits for minors, note that you have (or have applied for) them — it saves the manager a follow-up.'],
      ['Keep the file professional', 'Export a PDF named "Your-Name-Resume.pdf", use an email address based on your name (make a new one if needed), and answer applications from that address. The voicemail on the phone number you list should be set up and sensible.'],
      ['A worked example', '"Jordan Lee — Springfield, OH · jordan.lee@example.com · (555) 012-3456. Objective: High school senior seeking weekend barista role; available Sat–Sun and weekday evenings. Education: Springfield High, Class of 2027, GPA 3.7. Activities: Yearbook layout editor (led 4-person team, shipped 180-page book on deadline). Volunteer: Library homework helper, 2023–present, ~4 hrs/week. Skills: cash handling (school store), Google Workspace, conversational Spanish." Everything checkable, nothing invented.'],
      ['Tailor it in five minutes', 'Read the posting, note what it asks for (weekend availability, customer service, teamwork), and make sure your objective and bullets mention your true matching points. Our free builder\u2019s templates and ATS checker work the same for a first resume as for a tenth.'],
    ],
  },
  {
    path: '/guides/thank-you-email-after-interview',
    title: 'Thank You Email After an Interview: Timing, Template, and Mistakes (2026)',
    description:
      'When to send a post-interview thank-you email, a 5-sentence template that works, how to handle panel interviews and second rounds, and the mistakes that undo a good interview.',
    h1: 'The thank-you email after an interview',
    sections: [
      ['Does it still matter?', 'It rarely wins a job on its own, but it keeps you visible while decisions are made, demonstrates written communication, and gives you one legitimate chance to reinforce your strongest point or repair a fumbled answer. Skipping it costs more than sending it ever could.'],
      ['Timing: same day, within 24 hours', 'Send it the same business day if the interview ended before mid-afternoon, otherwise the next morning. Later than 48 hours reads as an afterthought; minutes after hanging up reads as a template you had queued.'],
      ['The 5-sentence structure', 'Sentence 1: thank them, naming the role. Sentence 2: one specific moment from the conversation (proves it isn\u2019t boilerplate). Sentence 3: reinforce your fit with one concrete qualification. Sentence 4 (optional): a brief addition or correction to an answer. Sentence 5: enthusiasm and next-step availability.'],
      ['A template to adapt', '"Thank you for taking the time to talk about the [role] position today. I especially enjoyed the discussion about [specific topic — the migration project, the team\u2019s hiring plans]. The challenges you described map closely to my experience with [your relevant work, with the real number if it fits naturally]. One thing I\u2019d add to my answer about [topic]: [one-sentence improvement]. I\u2019m very interested in the role and happy to provide anything else you need."'],
      ['Subject line', '"Thank you — [Role] interview" or a reply in the existing scheduling thread (often best: it keeps context and reaches the right inbox). Never a blank subject or a generic "Following up".'],
      ['Panel interviews: one email each', 'Send individual notes to each interviewer, varied by what you discussed with them — not one email CC\u2019ing everyone, and not identical texts (they compare). If you only have one address, ask the recruiter to forward your thanks, or send one note naming each person\u2019s topic.'],
      ['Repairing a weak answer', 'The thank-you note is the accepted channel for a one-sentence recovery: "On reflection, a better example of X is…". Keep it to one sentence — a paragraph of relitigation reads as anxiety, not thoroughness.'],
      ['Second and third rounds', 'Yes, every round. Later-round notes can be shorter and more specific; by the final round it may be two sentences. Repetition is not a problem — silence after round three while you wrote after round one is noticed.'],
      ['Mistakes that undo a good interview', 'Typos and a misspelled interviewer name (check the calendar invite), negotiating salary in the thank-you, obvious copy-paste with another company\u2019s name left in, gifts or excessive flattery, and daily follow-ups afterwards. One note, then wait for the stated timeline plus a few days.'],
      ['If you interviewed by phone or video', 'Identical rules — the medium doesn\u2019t change the etiquette. For recorded one-way video interviews with no human contact, skip it (there is no one to thank) and save your note for the first live conversation.'],
      ['Following up after silence', 'If their stated timeline passes with no word, one polite follow-up 3–5 business days later: restate interest, ask if the timeline has shifted, offer any further information. Then stop — recruiting delays are usually internal, and persistence past two notes hurts.'],
      ['Keep the facts straight', 'Everything in the note must match your resume and what you said live — a "15%" in the interview must not become "25%" in the email. The same honesty rule that governs your resume governs every message after it.'],
    ],
  },
  {
    path: '/guides/salary-expectations-in-interviews',
    title: 'Salary Expectations: How to Answer in Applications and Interviews (2026)',
    description:
      'How to handle the salary expectations question on application forms and in interviews: research first, ranges over numbers, deflection scripts that work, and what never to do.',
    h1: 'How to answer the salary expectations question',
    sections: [
      ['Why they ask early', 'Recruiters ask about salary early to screen out mismatches before investing interview time. That is legitimate — but it also means the first number spoken frames the whole negotiation. Your goal in the first conversation is to stay in range without committing to the bottom of yours.'],
      ['Research before any conversation', 'Look up the role on levels.fyi (tech), Glassdoor, Payscale, and — where employers must publish them — the pay ranges in the posting itself (required in several US states and the EU under pay-transparency rules). Anchor on the range for your level, location, and industry, not on your current salary.'],
      ['Give a range, not a number', 'A researched range beats a single number: "Based on what I\u2019m seeing for this kind of role in this market, I\u2019m targeting the $X–$Y range, depending on the overall package." Make the bottom of your stated range a number you would genuinely accept — it is what recruiters hear.'],
      ['The application form field', 'If the form demands a number and accepts text, write "negotiable" or the researched range. If it forces a single integer, enter the midpoint of your researched range rather than 0 or a lowball — many ATSs use the field as a hard filter in both directions.'],
      ['Deflecting in a first call', 'It is acceptable — once — to turn the question around: "I\u2019d like to understand the full scope of the role first. Could you share the budgeted range for this position?" Many recruiters will answer directly; in pay-transparency jurisdictions they must. If they insist, give your researched range rather than stonewalling twice.'],
      ['Current salary is not their business', 'In a growing list of places (California, New York, Colorado and others) employers may not ask your salary history at all. Everywhere else you may simply redirect: "I\u2019d prefer to focus on the value of this role — my researched target is $X–$Y." Never inflate your current salary; it is checkable at offer stage.'],
      ['Total compensation, not base', 'Before naming numbers, know what the package includes: bonus, equity, retirement match, healthcare, remote flexibility, PTO. A $5k lower base with a 15% bonus and better match can be the stronger offer — say "depending on total compensation" so the range flexes.'],
      ['When the range they name is low', 'Do not argue in the screening call. Note it, finish the conversation, and decide whether the gap is bridgeable ("Is there flexibility for a candidate with X?") or disqualifying. Ending politely at this stage costs nothing; discovering the gap at offer stage costs weeks.'],
      ['Negotiating the actual offer', 'The offer conversation is separate from the expectations question. Once an offer exists, you have maximum leverage: respond with enthusiasm, ask for time to review, and counter once, specifically, with justification — a competing number, a scope difference, or market data. Vague "can you do better?" underperforms a specific ask.'],
      ['What never to do', 'Never invent a competing offer (verifiable, and fatal if caught), never inflate current compensation, never accept and keep negotiating, and never open with an ultimatum. The same honesty rule as your resume: everything you claim must survive checking.'],
      ['Scripts to adapt', 'Form field: "Negotiable — targeting market rate for the role." First call: "I\u2019m targeting $X–$Y depending on total comp — does that fit the budgeted range?" Offer counter: "I\u2019m excited about the role. Given [specific factor], I was expecting closer to $Z — is there room to close that gap?"'],
      ['Where your resume fits in', 'Strong salary outcomes start before the interview: a resume with quantified, verifiable achievements is what justifies the top of your range. Build the evidence into the bullets — then the negotiation is about which number the evidence supports, not whether you deserve one.'],
    ],
  },
  {
    path: '/guides/resume-vs-portfolio',
    title: 'Resume vs Portfolio: What Creative and Technical Roles Actually Need (2026)',
    description:
      'When a portfolio matters more than a resume, how the two documents divide the work, portfolio links that survive ATS parsing, and per-field norms for design, writing, and engineering.',
    h1: 'Resume vs portfolio: how they divide the work',
    sections: [
      ['Two documents, two jobs', 'The resume gets you past screening — parsers and recruiters checking structured facts. The portfolio wins the human review — proof you can actually do the work. For creative and many technical roles you need both, and each fails at the other\u2019s job.'],
      ['Who genuinely needs a portfolio', 'Designers (product, graphic, motion), writers and content marketers, photographers and video editors, front-end developers, architects, illustrators, and increasingly data folks (analysis notebooks, dashboards). If hiring managers in your field open work samples before deciding, you need one.'],
      ['The resume still comes first', 'Almost every portfolio-heavy role still routes applications through an ATS that parses resumes, not Behance pages. A weak resume means the portfolio never gets opened. Keep the resume complete and parser-safe on its own — never write "see portfolio" in place of real content.'],
      ['Put the link where parsers find it', 'Your portfolio URL belongs in the resume contact block as real text (yourname.com or behance.net/you), exported as a clickable link. Avoid link shorteners (they look disposable and can rot) and QR codes (parsers ignore images).'],
      ['Curate hard: 4–8 pieces', 'A portfolio is not an archive. Show your best 4–8 pieces, most relevant first, each with a short case note: the problem, your role, the decision you made, the outcome. Hiring managers spend minutes, not hours — depth on few pieces beats breadth on many.'],
      ['Tailor the portfolio like the resume', 'Applying for a mobile-app design role? Lead with mobile work. Content role in fintech? Lead with financial writing. The same tailoring logic you apply to resume bullets applies to portfolio ordering — the first two pieces decide whether they keep scrolling.'],
      ['Formats by field', 'Design: a personal site or Behance/Dribbble with case studies. Writing: a simple page of linked published pieces (or PDFs where rights allow). Development: GitHub with pinned repos plus 1–2 live demos; a README is your case note. Data: notebooks or dashboards with a paragraph of context each.'],
      ['The case-study skeleton', 'For each piece: one line of context (client/team/constraint), one line on your specific contribution ("my role: interaction design and prototype"), one honest outcome ("shipped to 40k users" only if true and checkable). Claiming solo credit for team work is checkable and fatal — credit collaborators.'],
      ['Rights and confidentiality', 'Only show work you have the right to show. NDA work can appear as an anonymized case study ("a payments company") with sensitive numbers removed, or be described in the interview instead. Never publish confidential assets to win a job — the employer reading it notices what you would do with theirs.'],
      ['Keep it fast and reachable', 'A portfolio that loads slowly or 404s is worse than none: test the link from a phone on mobile data, keep images compressed, and re-verify every link each time you send applications. If the domain lapses, update the resume everywhere it is listed.'],
      ['What stays on the resume', 'Dates, employers, titles, education, skills, quantified outcomes — the checkable skeleton recruiters cross-reference. The portfolio shows how the work looks; the resume proves where and when you did it. Contradictions between the two (different titles, different dates) read as dishonesty.'],
      ['A quick pre-send audit', 'Resume parses cleanly (test it in our free ATS checker) · portfolio link in the contact block as text · first two pieces match the job · every case note has your role and an honest outcome · all links open from an incognito window · nothing confidential. Then send.'],
    ],
  },
  {
    path: '/guides/resume-summary-for-freshers',
    title: 'Resume Summary for Freshers: Examples That Work Without Experience (2026)',
    description:
      'How to write a fresher resume summary (or objective) with no work experience: formulas, worked examples by field, what to quantify from college, and cliches to cut.',
    h1: 'Writing a resume summary as a fresher',
    sections: [
      ['Summary or objective?', 'With no work history, a short objective usually beats a summary: state what you studied, what you can do, and what role you want — in that order. Once you have an internship or strong projects, upgrade to a summary that leads with those instead of the degree.'],
      ['The three-part formula', 'Line 1: who you are ("B.Tech CSE graduate, Class of 2026"). Line 2: your strongest proof — a project, internship, certification, or ranked achievement, with a real number if one exists. Line 3: the role you\u2019re targeting and what you bring to it. Three sentences, 40–60 words, no more.'],
      ['Lead with proof, not adjectives', '"Hardworking, passionate, motivated fresher" tells the reader nothing checkable. "Built a Flask attendance app used by 3 student clubs" does. Every adjective you delete makes room for one verifiable fact — and verifiable facts are what screeners scan for.'],
      ['What freshers can quantify', 'CGPA (if strong), project users or data size, hackathon placements, papers or posters, club members led, events organized, certification scores, typing speed, languages. College life produces more numbers than most freshers think — use the real ones, never rounded-up ones.'],
      ['Engineering example', '"Computer science graduate (2026, CGPA 8.4) with hands-on projects in Python and SQL — including an expense tracker used by 40+ classmates. Completed the Google Data Analytics certificate. Seeking an entry-level data analyst role where I can apply cleaning and visualization skills."'],
      ['Commerce/business example', '"B.Com graduate (2026) with an accounting internship at a local CA firm — reconciled 3 client ledgers under supervision and built the Excel tracker the office still uses. Tally and advanced Excel certified. Seeking a junior accountant role."'],
      ['Arts/communication example', '"English literature graduate (2026) and editor of the campus magazine — led a 6-member team through 4 issues and grew Instagram followers from 800 to 2,100. Seeking a content writing role where research and deadline discipline matter."'],
      ['Match it to each application', 'The objective is the most tailorable line on a fresher resume: mirror the job title exactly ("Seeking a Graduate Trainee \u2013 Operations role…") and name the one or two skills from the posting you genuinely have. A generic objective reads as a mass application.'],
      ['Cliches to cut', '"Seeking a challenging position in a reputed organization with growth opportunities" says nothing about you and appears on millions of resumes. Also cut: "team player", "quick learner", "dynamic", "go-getter" — unless a bullet elsewhere proves the claim, at which point you don\u2019t need the word.'],
      ['Where it sits and what follows', 'Contact block → objective/summary → Education (with coursework and CGPA) → Projects → Internships/volunteering → Skills → Achievements. The objective makes a promise; the projects section is where the reader checks it — make sure they agree.'],
      ['Honesty is a screening criterion', 'Freshers are checked harder, not softer: certificates are verifiable, CGPAs appear on transcripts, and project claims come up in the first interview. Never inflate a number or list a certification you haven\u2019t completed — "in progress" is an acceptable and honest label.'],
      ['Test the whole resume, not just the summary', 'A good summary on a resume that parses badly still gets filtered. Run the finished resume through our free ATS checker against the actual posting — it shows which keywords the parser found and which are missing, so you can fix gaps honestly before applying.'],
    ],
  },
  {
    path: '/guides/how-to-list-certifications',
    title: 'How to List Certifications on a Resume: Format, Order, and What Counts (2026)',
    description:
      'Where certifications go on a resume, the exact line format parsers read, in-progress and expired credentials, which certifications matter by field, and what to leave off.',
    h1: 'How to list certifications on a resume',
    sections: [
      ['Why certifications get checked', 'Certifications are among the most verifiable claims on a resume — issuers run public verification pages, and many recruiters check. That cuts both ways: a real credential is strong evidence, and an inflated one is the fastest way to lose an offer.'],
      ['The line format parsers read', 'One line per credential: name (spelled out, then the acronym), issuer, and date — "AWS Certified Solutions Architect \u2013 Associate (SAA-C03), Amazon Web Services, 2025". Parsers and keyword filters match on the exact certification name, so use the official one, not a nickname.'],
      ['Where the section goes', 'A dedicated "Certifications" section below Skills works for most people. Lead with it (above Experience) only when the certification is the qualification — nursing licenses, PMP for project-manager roles, CDL for driving jobs. One or two certs? A line inside Education or Skills also parses fine.'],
      ['Order within the section', 'Most relevant to the target job first, then by recency. The job description tells you the order: if the posting says "Security+ required", that line goes first regardless of date.'],
      ['Include the ID when asked', 'Some employers and government forms want the credential ID or license number. Otherwise, leave IDs off the resume (they add clutter) but have them ready — and make sure your name on the certificate matches your resume name.'],
      ['In-progress certifications', 'Listing an in-progress credential is honest if labeled: "CFA Level II candidate — exam scheduled Nov 2026" or "AWS SAA \u2014 in progress, expected Q1 2027". Never list it unlabeled, and never list one you merely intend to start.'],
      ['Expired and renewed credentials', 'If it expires (PMP, CPR, Security+), show the valid-through date or renewal year. An expired certification can stay only if clearly marked ("CCNA, 2019\u20132022, expired") and only when the underlying skill is still relevant — otherwise cut it.'],
      ['Which certifications matter by field', 'Tech: cloud (AWS/Azure/GCP), Kubernetes, security (Security+/CISSP). Data: Google Data Analytics, dbt, Databricks. PM: PMP, CSM, PRINCE2. Finance: CPA, CFA, FRM. Healthcare: licenses first, then BLS/ACLS. Trades: OSHA, forklift, welding certs. Marketing: Google Ads/Analytics, HubSpot.'],
      ['What to leave off', 'Course-completion certificates from watching videos (Udemy/Coursera without a proctored exam) belong under a "Courses" line, not "Certifications", if listed at all. Also cut: internal trainings nobody outside your company recognizes, expired credentials from a decade ago, and memberships that are not credentials.'],
      ['Keywords: spell it out and abbreviate', 'Recruiters search both "Certified Public Accountant" and "CPA"; ATS keyword filters may match either. Write the full name once with the acronym in parentheses so both queries hit — the same rule as skills.'],
      ['Free vs paid credentials', 'A free certificate with a real assessment (Google Analytics, HubSpot, freeCodeCamp) beats an expensive one nobody verifies. Choose by what job postings in your target role actually name — search five postings and count which credentials appear.'],
      ['The honesty line', 'Never list a certification you did not earn, an exam you have not passed, or a license that has lapsed as if current. Verification takes a recruiter under a minute. If your real credentials feel thin, an "in progress" line plus strong project bullets is the honest and effective alternative.'],
    ],
  },
  {
    path: '/guides/volunteer-work-on-resume',
    title: 'Volunteer Work on a Resume: Where It Goes and How to Write It (2026 Guide)',
    description:
      'When volunteer experience belongs on a resume, where to put it, how to write bullets that count, gap coverage, cause-related caution, and examples that pass ATS parsing.',
    h1: 'How to put volunteer work on your resume',
    sections: [
      ['Volunteer work is real experience', 'Hiring managers care about what you did and what changed because of it — not whether a paycheck was attached. Organized a fundraiser, managed a rota of 12 volunteers, built a nonprofit\u2019s website: those are management, operations, and engineering experience. Present them with the same structure as paid work.'],
      ['When it earns a place', 'Include volunteering when it is recent, relevant to the target role, shows a skill your paid history lacks, or covers a gap. Leave it off when it is a one-off from years ago, duplicates stronger paid bullets, or crowds a page needed for paid experience.'],
      ['Where it goes: two options', 'A dedicated "Volunteer Experience" section below paid Experience is the default — parsers and recruiters recognize the heading. Fold it into the main Experience section only when it is substantial, ongoing, and directly relevant (common for students, career changers, and returners) — and label the role honestly: "Volunteer Coordinator (volunteer)".'],
      ['Write bullets like paid work', 'Same formula: action verb + what you did + measurable result. "Coordinated 15 weekly volunteers and cut shift no-shows by 40% with a text-reminder system" beats "Helped at the food bank". If you can\u2019t quantify, name the scope: team size, event size, budget, frequency.'],
      ['The format parsers read', 'One entry per role: organization, role title, dates (month + year), location if relevant, then bullets. Exactly the structure of a paid entry — ATS parsers map it into the same experience fields, and consistent formatting keeps the whole section machine-readable.'],
      ['Covering employment gaps', 'Steady volunteering during a gap answers the "what were you doing?" question before it\u2019s asked. List it in the main Experience timeline with real dates so the gap visibly closes — an entry that says "Career break — volunteer bookkeeping, Ridge Community Pantry, 2024\u20132025" reads far better than an unexplained hole.'],
      ['Skills-first framing for career changers', 'Switching fields? Lead each volunteer bullet with the skill of the target role: a teacher moving to project management writes "Planned and ran a 9-month, 30-event program calendar" rather than "Helped organize school events". The org matters less than the transferable verb.'],
      ['Leadership roles count double', 'Board member, treasurer, team lead, event chair — unpaid leadership is still leadership. If you managed people, money, or outcomes, say so with numbers: "Treasurer, managed $18K annual budget and quarterly reporting for a 200-member association".'],
      ['Cause-related caution', 'Political, religious, and advocacy affiliations can trigger bias — conscious or not. Include them when the work is the qualification or the values matter to you in an employer; otherwise you can describe the role generically ("faith-based community organization") or choose neutral entries. It\u2019s your call, but make it deliberately.'],
      ['Student and first-job resumes', 'With little paid history, volunteering moves up: put it right after Education, before or merged with any part-time work. Tutoring, sports coaching, event stewarding, open-source contributions — each shows reliability and initiative, which is what first-job screeners actually look for.'],
      ['What to leave off', 'Mandatory school service hours framed as passion, one-day events from five years ago, "member" entries with no activity, and anything you cannot answer follow-up questions about. Every line on the page invites an interview question — keep only the ones you want asked.'],
      ['The honesty check', 'Label unpaid roles as volunteer positions — letting a screener assume it was employment backfires at reference-check time. Dates, org names, and scope must survive a phone call to the coordinator. Honest framing plus concrete results is exactly what makes volunteer entries persuasive.'],
    ],
  },
  {
    path: '/guides/multiple-positions-same-company',
    title: 'Multiple Positions at the Same Company on a Resume: Stacked vs Separate (2026 Guide)',
    description:
      'How to list promotions and role changes at one employer: stacked entries vs separate entries, what ATS parsers do with each, date math, and bullets that show growth.',
    h1: 'How to show multiple positions at the same company',
    sections: [
      ['Promotions are your best evidence', 'Someone who watched you work chose to give you more responsibility — that is stronger proof than anything you can claim about yourself. The formatting question matters because bad formatting hides the promotion; done right, it is the first thing a screener notices.'],
      ['The two layouts', 'Stacked: company name once, then each title with its own dates and bullets underneath. Separate: each role is a fully independent entry, company name repeated. Both are legitimate; the choice depends on how different the roles were and how the dates read.'],
      ['When to stack', 'Stack when the roles are a clear ladder in one function — Associate → Senior → Lead. The single company header makes the climb visually obvious, saves lines, and reads as one continuous tenure ("Meridian Health, 2019–Present") rather than three short stints.'],
      ['When to separate', 'Use separate entries when the roles were genuinely different jobs (support → engineering, store → corporate), when a gap or boomerang return sits between them, or when only the recent role is relevant and the early one deserves a single line.'],
      ['What ATS parsers do with each', 'Parsers map entries to (title, company, dates) triples. Stacked layouts parse fine when each title has its own explicit date range on its own line; they break when dates apply only to the company header. Safest pattern: company + total range on the header line, then "Title (dates)" per role beneath.'],
      ['Get the date math right', 'A stacked entry shows total tenure on the company line and per-role dates under each title. Make them add up — screeners subtract years in their head, and mismatched ranges read as carelessness or worse. Month + year everywhere, no bare years next to month-precise ranges.'],
      ['Write bullets that show the step up', 'Don\u2019t repeat the same duties under each title. The junior role gets the foundation ("owned weekly reporting for 3 accounts"); the senior role gets scope growth ("inherited the 12-account portfolio, hired and trained 2 analysts"). The delta between bullet sets is the promotion story.'],
      ['Name the promotion explicitly', 'A bullet like "Promoted to Senior Analyst after 14 months, one review cycle early" removes any ambiguity a parser or a skimming recruiter might have. If the title change was a reorg rather than a promotion, don\u2019t call it one — title inflation fails the reference check.'],
      ['Lateral moves and reorgs', 'Sideways moves still show trust and range. Frame them by what changed: new product line, new region, new stack. If your title changed only because departments merged, one entry with both titles ("Analyst, Marketing (formerly Insights)") is honest and saves space.'],
      ['Contract-to-hire and returning employees', 'Converted contractor: one stacked entry, first title marked "(contract)". Boomerang employee: separate entries with honest dates — the return itself is a selling point ("rehired to lead the team I trained in").'],
      ['How RezUp handles it', 'In the builder, create one experience entry per role and keep the company name identical — parsers and recruiters both read the repetition correctly. Use the duplicate button on an entry to copy the company details, then change the title, dates, and bullets for the earlier role.'],
      ['The honesty check', 'Every title, every date range, and the word "promoted" must survive an HR verification call. Merging two roles into one senior title, stretching a senior role\u2019s dates over the junior years, or upgrading titles "because that\u2019s what the work really was" are the resume lies that surface fastest.'],
    ],
  },
  {
    path: '/guides/photo-on-resume',
    title: 'Should You Put a Photo on Your Resume? Country-by-Country Rules (2026 Guide)',
    description:
      'Where a resume photo helps, where it gets you rejected, why US and UK employers discard photo resumes, what ATS parsers do with images, and what to use instead.',
    h1: 'Should you put a photo on your resume?',
    sections: [
      ['The short answer', 'In the US, Canada, the UK, Ireland, and Australia: no. In much of continental Europe, Latin America, and parts of Asia: often expected. The photo question is not about taste — it is about the discrimination law your reader works under, and getting it wrong costs you the application either way.'],
      ['Why US and UK employers discard photo resumes', 'Anti-discrimination law makes age, race, and gender a liability in hiring records. Many US recruiters are instructed to reject or redact resumes with photos so the company can prove screening decisions were not based on appearance. The rejection is procedural, not personal — your qualifications never get read.'],
      ['Where photos are normal', 'German, Austrian, Swiss, French, Spanish, Portuguese, Italian, Belgian, Japanese, Chinese, and many Latin American applications commonly include a professional headshot; German CVs traditionally include one, though the AGG has made it optional. When applying into these markets, omitting the photo can read as an incomplete application.'],
      ['Check the actual job posting first', 'Country norms lose to the employer\u2019s own instruction. Multinationals in photo countries often run US-style blind screening; some local firms explicitly request a photo. If the posting or portal asks for one, provide it; if it asks for a "blind" or "anonymized" CV, strip your photo and sometimes your name.'],
      ['Exceptions in every country', 'Acting, modeling, presenting, and some client-facing hospitality roles use headshots as a genuine occupational requirement, and they belong on a comp card or portfolio rather than the resume proper. "Customer-facing" alone is not an exception — a sales resume in Chicago still goes out without a face.'],
      ['What ATS parsers do with images', 'Nothing useful. Parsers extract text; a photo is a blob they skip at best. The real damage is layout: photos push resumes into two-column and text-box designs, and those are what break parsing. A photo also inflates file size and can trip attachment scanners on older systems.'],
      ['The space cost', 'A headshot eats 15\u201320% of a first page — roughly four bullets of evidence. On a one-page resume that is the difference between showing your strongest project and cutting it. Even where photos are accepted, ask whether the space buys more than the content it displaces.'],
      ['If you do include one: the specs', 'Professional headshot, plain background, business attire matching the industry, head and shoulders, eyes level with the camera, recent (within two years), neutral or warm expression. Top-right or top-left of the header, roughly 3.5 × 4.5 cm, compressed to keep the file under 1 MB. No selfies, no crops from group photos, no filters.'],
      ['LinkedIn is where your face belongs', 'US and UK recruiters look you up anyway, and LinkedIn is the venue built for a photo — no legal exposure for the employer, no space cost for you. A strong headshot there does the entire job a resume photo would, which is why the omission costs you nothing.'],
      ['What to put in that space instead', 'A three-line professional summary, a metrics band ("8 years · 40M requests/day · 6 engineers mentored"), or a skills row. Anything that answers "why you" outperforms a face — no screener ever advanced a candidate because the photo looked competent.'],
      ['Other personal details to leave off', 'Same reasoning applies to date of birth, marital status, nationality, religion, and a full street address in US/UK applications, even though several are standard on a German Lebenslauf or a Chinese resume. Match the destination market, not your habit.'],
      ['How RezUp handles it', 'Every RezUp template is text-only and single-column by default — no photo slot, because the market we serve mostly penalizes them and because image-driven layouts are what break ATS parsing. If you are applying into a photo market, export DOCX and add the headshot in your word processor rather than fighting the parser with an image-heavy template.'],
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
  horizon: { accent: '#0e7490', serif: false, divider: 'none', band: true, headerAlign: 'left', nameCase: 'normal' },
  metro: { accent: '#1e40af', serif: false, divider: 'none', band: true, headerAlign: 'center', nameCase: 'normal' },
  scholar: { accent: '#713f12', serif: true, divider: 'none', band: true, headerAlign: 'center', nameCase: 'normal' },
  ink: { accent: '#111827', serif: false, divider: 'none', band: true, headerAlign: 'left', nameCase: 'upper' },
  coral: { accent: '#be123c', serif: false, divider: 'none', headerAlign: 'center', nameCase: 'normal' },
  atlas: { accent: '#0c4a6e', serif: true, divider: 'thick', headerAlign: 'left', nameCase: 'normal' },
  prairie: { accent: '#3f6212', serif: false, divider: 'line', headerAlign: 'center', nameCase: 'normal' },
  quartz: { accent: '#57534e', serif: true, divider: 'none', headerAlign: 'left', nameCase: 'normal' },
  ruby: { accent: '#9f1239', serif: true, divider: 'none', band: true, headerAlign: 'center', nameCase: 'normal' },
  cobalt: { accent: '#312e81', serif: false, divider: 'thick', headerAlign: 'left', nameCase: 'upper' },
  circuit: { accent: '#0369a1', serif: false, divider: 'line', headerAlign: 'left', nameCase: 'normal', entryDivider: true },
  ledger: { accent: '#3f3f46', serif: true, divider: 'none', headerAlign: 'left', nameCase: 'normal', entryDivider: true },
  sidebar: { accent: '#1e3a8a', serif: false, divider: 'none', headerAlign: 'left', nameCase: 'normal', sideLabels: true },
}

/** Light tint of an accent color (mirrors accentTint in src/lib/templates.ts) */
function tint(hex, alpha = 0.12) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c) => Math.round(c * alpha + 255 * (1 - alpha))
  return `#${((mix((n >> 16) & 255) << 16) | (mix((n >> 8) & 255) << 8) | mix(n & 255)).toString(16).padStart(6, '0')}`
}

/** Sample resume fragment rendered inside template thumbnails (same as TemplateThumb.tsx). */
const THUMB_SAMPLE = {
  name: 'Jordan Reyes',
  sub: 'Senior Software Engineer · Austin, TX',
  summary: [
    'Engineer with 8 years on high-traffic services.',
    'Led a 5-person team; cut p95 latency 38%.',
  ],
  jobs: [
    ['Senior Engineer — Nimbus Cloud · 2021–now', ['Scaled checkout to 2.1M orders/month.', 'Cut infra spend $340K/yr.']],
    ['Engineer — Brightline Labs · 2018–2021', ['Shipped billing API used by 40+ teams.']],
  ],
  skills: 'TypeScript · React · Node.js · SQL · AWS',
  education: 'B.S. Computer Science — UT Austin · 2018',
}

/** Inline SVG mini-preview of a template rendering real sample content (same idea as TemplateThumb.tsx). */
function templateThumbSvg(slug, width = 96) {
  const m = TEMPLATE_META[slug]
  if (!m) return ''
  const W = 120
  const H = 155
  const L = 10
  const R = W - 10
  const font = m.serif ? "Georgia,'Times New Roman',serif" : 'Helvetica,Arial,sans-serif'
  const anchor = m.headerAlign === 'center' ? `x="${W / 2}" text-anchor="middle"` : `x="${L}"`
  const s = THUMB_SAMPLE
  const parts = []
  const text = (x, y, size, fill, str, extra = '') =>
    parts.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${esc(str)}</text>`)
  let y = 14
  parts.push(
    `<text ${anchor} y="${y}" font-size="8" font-weight="700" fill="#111"${m.nameCase === 'upper' ? ' letter-spacing=".5"' : ''}>${esc(m.nameCase === 'upper' ? s.name.toUpperCase() : s.name)}</text>`
  )
  y += 8
  parts.push(
    `<text ${anchor} y="${y}" font-size="3.6" fill="#777">${esc(s.sub)}</text>`
  )
  y += 9
  const cx = m.sideLabels ? L + 24 : L
  const heading = (label) => {
    if (m.sideLabels) {
      text(L, y, 3.3, m.accent, label.toUpperCase(), 'font-weight="700" letter-spacing=".4"')
      return
    }
    if (m.band) {
      parts.push(`<rect x="${L - 3}" y="${y - 5}" width="${W - 2 * (L - 3)}" height="7.5" rx="1" fill="${tint(m.accent)}"/>`)
    }
    text(L, y, 4.4, m.accent, label.toUpperCase(), 'font-weight="700" letter-spacing=".6"')
    if (!m.band && m.divider !== 'none') {
      parts.push(`<rect x="${L}" y="${y + 2}" width="${R - L}" height="${m.divider === 'thick' ? 1.4 : 0.6}" fill="${m.accent}"/>`)
    }
    y += m.band || m.divider !== 'none' ? 8 : 6.5
  }
  heading('Summary')
  for (const line of s.summary) {
    text(cx, y, 3.8, '#444', line)
    y += 5.5
  }
  y += 4
  heading('Experience')
  s.jobs.forEach(([job, bullets], ji) => {
    if (m.entryDivider && ji > 0) {
      parts.push(`<rect x="${cx}" y="${y - 4}" width="${R - cx}" height="0.5" fill="#d4d4d4"/>`)
      y += 1.5
    }
    text(cx, y, 3.9, '#333', job, 'font-weight="600"')
    y += 5.5
    for (const b of bullets) {
      text(cx, y, 3.8, '#444', `•  ${b}`)
      y += 5.5
    }
    y += 1.5
  })
  y += 2.5
  heading('Skills')
  text(cx, y, 3.8, '#444', s.skills)
  y += 9.5
  heading('Education')
  text(cx, y, 3.8, '#444', s.education)
  return `<svg role="img" aria-label="${esc(slug)} template preview with sample resume content" width="${width}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${font}" style="background:#fff;border:1px solid var(--border);border-radius:6px">${parts.join('')}</svg>`
}

/** pSEO template pages, one per built-in template */
const TEMPLATE_PAGES = [
  {
    path: '/templates/classic',
    name: 'Classic',
    title: 'Classic ATS Resume Template — Free to Use Online | RezUp',
    description:
      'A timeless single-column resume template with serif headings — the safest format for ATS parsers and conservative industries. Use it free in your browser.',
    blurb: 'The Classic template uses a traditional serif-accented layout that reads instantly to both ATS parsers and human recruiters. Best for finance, law, government, and any conservative industry where familiarity signals professionalism.',
  },
  {
    path: '/templates/modern',
    name: 'Modern',
    title: 'Modern ATS Resume Template — Free to Use Online | RezUp',
    description:
      'A clean modern resume template with an accent color and clear hierarchy — still strictly single-column and ATS-safe. Use it free in your browser.',
    blurb: 'The Modern template adds a restrained accent color and contemporary typography while staying strictly single-column. Best for tech, product, marketing and startup roles where a current look matters.',
  },
  {
    path: '/templates/compact',
    name: 'Compact',
    title: 'Compact One-Page Resume Template — Free to Use Online | RezUp',
    description:
      'A space-efficient resume template that fits more experience on one page without sacrificing ATS readability. Use it free in your browser.',
    blurb: 'The Compact template tightens spacing and type size to fit senior-level experience on a single page — without tables or columns that break parsers. Best for experienced candidates told their resume is “too long”.',
  },
  {
    path: '/templates/executive',
    name: 'Executive',
    title: 'Executive Resume Template — Free to Use Online | RezUp',
    description:
      'An authoritative resume template with strong headings for leadership roles — single-column and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Executive template uses commanding headings and generous whitespace to frame leadership scope and outcomes. Best for director, VP and C-level applications where gravitas counts.',
  },
  {
    path: '/templates/minimal',
    name: 'Minimal',
    title: 'Minimal ATS Resume Template — Free to Use Online | RezUp',
    description:
      'A whitespace-first, left-aligned resume template with no dividers — quiet, modern and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Minimal template strips away rules and ornament, letting a left-aligned header and clean typography carry the design. Best for design, product and modern tech roles where restraint reads as confidence.',
  },
  {
    path: '/templates/bold',
    name: 'Bold',
    title: 'Bold ATS Resume Template — Free to Use Online | RezUp',
    description:
      'A high-contrast resume template with strong headings and thick rules — memorable but still single-column and ATS-safe. Use it free in your browser.',
    blurb: 'The Bold template pairs an uppercase name with thick section rules so your resume stands out in a printed stack — while staying strictly single-column for parsers. Best for sales, marketing and client-facing roles.',
  },
  {
    path: '/templates/elegant',
    name: 'Elegant',
    title: 'Elegant Serif Resume Template — Free to Use Online | RezUp',
    description:
      'A refined serif resume template with a left-aligned header and fine rules — polished, formal and ATS-parseable. Use it free in your browser.',
    blurb: 'The Elegant template combines refined serif typography with a left-aligned header and fine dividers for a polished, formal impression. Best for consulting, academia, publishing and client advisory roles.',
  },
  {
    path: '/templates/engineer',
    name: 'Engineer',
    title: 'Engineer Resume Template — Free to Use Online | RezUp',
    description:
      'A no-nonsense sans-serif resume template built for technical resumes — dense, scannable and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Engineer template is built for technical resumes: a compact left-aligned header, clear section rules and typography that keeps dense skill lists scannable. Best for software, data, DevOps and hardware roles.',
  },
  {
    path: '/templates/ivy',
    name: 'Ivy',
    title: 'Ivy Academic Resume Template — Free to Use Online | RezUp',
    description:
      'An academic serif resume template in deep green — polished, traditional and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Ivy template pairs classic serif typography with a deep green accent for a scholarly, high-trust impression. Best for consulting, graduate-school applications, research and policy roles.',
  },
  {
    path: '/templates/slate',
    name: 'Slate',
    title: 'Slate Resume Template — Free to Use Online | RezUp',
    description:
      'A cool gray sans-serif resume template with strong section rules — calm, modern and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Slate template uses a muted gray palette and thick rules to read as calm and confident without shouting. Best for operations, program management and enterprise roles.',
  },
  {
    path: '/templates/corporate',
    name: 'Corporate',
    title: 'Corporate Resume Template — Free to Use Online | RezUp',
    description:
      'A formal serif resume template with a commanding uppercase name — built for finance and law, fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Corporate template centers an uppercase name over formal serif body text with strong rules — the traditional look banking, law and accounting recruiters expect, in a parser-safe single column.',
  },
  {
    path: '/templates/startup',
    name: 'Startup',
    title: 'Startup Resume Template — Free to Use Online | RezUp',
    description:
      'An energetic resume template with an orange accent and no rules — modern, friendly and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Startup template drops divider rules entirely and leads with a warm orange accent for a modern, product-minded feel. Best for product, growth and early-stage startup roles.',
  },
  {
    path: '/templates/horizon',
    name: 'Horizon',
    title: 'Horizon Resume Template — Free to Use Online | RezUp',
    description:
      'A modern resume template with teal heading bands that make sections easy to scan — real text only, fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Horizon template puts each section heading on a soft teal band so recruiters can jump between sections at a glance — the band is a background behind real text, so parsers read it cleanly. Best for tech, data and modern professional roles.',
  },
  {
    path: '/templates/metro',
    name: 'Metro',
    title: 'Metro Resume Template — Free to Use Online | RezUp',
    description:
      'A structured resume template with blue banded headings and a centered header — clean, organized and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Metro template pairs a centered header with blue heading bands for a clean, highly organized look. Best for business analysts, project managers and corporate roles that value structure.',
  },
  {
    path: '/templates/scholar',
    name: 'Scholar',
    title: 'Scholar Resume Template — Free to Use Online | RezUp',
    description:
      'A serif resume template with warm banded headings — scholarly, warm and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Scholar template combines classic serif typography with warm banded headings for an approachable academic feel. Best for research, teaching, grant-funded and library roles.',
  },
  {
    path: '/templates/ink',
    name: 'Ink',
    title: 'Ink Resume Template — Free to Use Online | RezUp',
    description:
      'A maximum-contrast resume template with near-black heading bands and an uppercase name — striking and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Ink template uses near-black heading bands and an uppercase name for the highest-contrast look in the set — memorable in a printed stack while staying strictly single-column. Best for design, media and brand-forward roles.',
  },
  {
    path: '/templates/coral',
    name: 'Coral',
    title: 'Coral Resume Template — Free to Use Online | RezUp',
    description:
      'A friendly resume template with a warm rose accent and no rules — approachable, modern and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Coral template softens the page with a warm rose accent and no divider rules for an approachable, people-first impression. Best for HR, customer success, teaching and community roles.',
  },
  {
    path: '/templates/atlas',
    name: 'Atlas',
    title: 'Atlas Resume Template — Free to Use Online | RezUp',
    description:
      'A deep navy serif resume template with strong rules — established, global and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Atlas template projects an established, international feel with deep navy serif headings and strong rules. Best for consulting, supply chain, policy and multinational corporate roles.',
  },
  {
    path: '/templates/prairie',
    name: 'Prairie',
    title: 'Prairie Resume Template — Free to Use Online | RezUp',
    description:
      'A calm resume template with an earthy green accent and fine rules — grounded, readable and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Prairie template reads calm and grounded with an earthy green accent and fine rules. Best for healthcare, education, nonprofit and public-sector roles.',
  },
  {
    path: '/templates/quartz',
    name: 'Quartz',
    title: 'Quartz Resume Template — Free to Use Online | RezUp',
    description:
      'A quiet gray serif resume template with no rules — understated, refined and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Quartz template lets restrained gray serif typography carry the page with no rules at all — quiet confidence for readers who notice typography. Best for editorial, communications and senior individual-contributor roles.',
  },
  {
    path: '/templates/ruby',
    name: 'Ruby',
    title: 'Ruby Resume Template — Free to Use Online | RezUp',
    description:
      'A formal serif resume template with deep red banded headings — confident, traditional and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Ruby template pairs formal serif body text with deep red heading bands — traditional with a confident edge. Best for law, government affairs and executive-adjacent roles.',
  },
  {
    path: '/templates/cobalt',
    name: 'Cobalt',
    title: 'Cobalt Resume Template — Free to Use Online | RezUp',
    description:
      'An assertive resume template with indigo accents, thick rules and an uppercase name — modern and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Cobalt template combines indigo accents, thick rules and an uppercase name for an assertive, modern presence. Best for product, sales engineering and go-to-market roles.',
  },
  {
    path: '/templates/circuit',
    name: 'Circuit',
    title: 'Circuit Resume Template — Free to Use Online | RezUp',
    description:
      'A full-width developer resume template with light horizontal dividers between entries — dense content stays readable and fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Circuit template separates every role and project with a light hairline, so dense technical resumes stay scannable without losing page width. Best for developers and engineers with detailed project descriptions.',
  },
  {
    path: '/templates/ledger',
    name: 'Ledger',
    title: 'Ledger Resume Template — Free to Use Online | RezUp',
    description:
      'A serif resume template with ruled entries and quiet headings — editorial structure without heavy lines, fully ATS-parseable. Use it free in your browser.',
    blurb: 'The Ledger template drops heading rules entirely and lets light hairlines between entries carry the structure — an editorial, understated look. Best for experienced candidates with long work histories.',
  },
  {
    path: '/templates/sidebar',
    name: 'Sidebar',
    title: 'Sidebar Resume Template — Free to Use Online | RezUp',
    description:
      'A resume template with section labels in a left gutter — a scannable two-column look that keeps single-column reading order, so ATS parsing stays safe. Use it free in your browser.',
    blurb: 'The Sidebar template moves section labels into a narrow left gutter so content reads beside them — the scannable look of a two-column resume without its parsing risk, since every section still reads heading-then-content. Best for experienced professionals with three or more roles.',
  },
]

function esc(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const FOOTER_COLUMNS = [
  [
    'Product',
    [
      ['Resume builder', '/builder'],
      ['My resumes', '/dashboard'],
      ['Job search', '/jobs'],
      ['Free ATS checker', '/ats-checker'],
      ['Pricing', '/pricing/'],
    ],
  ],
  [
    'Resources',
    [
      ['Resume templates', '/templates/'],
      ['Resume examples', '/examples/'],
      ['Resume guides', '/guides/'],
      ['Cover letter generator', '/cover-letter-generator/'],
      ['Interview prep', '/interview-prep/'],
      ['Resignation letter writer', '/resignation-letter-generator/'],
      ['All comparisons', '/vs/'],
    ],
  ],
  [
    'Compare',
    [
      ['RezUp vs Zety', '/vs/zety'],
      ['RezUp vs LiveCareer', '/vs/livecareer'],
      ['RezUp vs Rezi', '/vs/rezi'],
      ['RezUp vs Enhancv', '/vs/enhancv'],
      ['One-time payment builders', '/resume-builder-one-time-payment'],
    ],
  ],
  [
    'Company',
    [
      ['About', '/about'],
      ['Terms & refunds', '/terms'],
      ['Privacy', '/privacy'],
      ['Contact', 'mailto:support@zalize.com'],
    ],
  ],
]

function siteFooter() {
  return `<footer class="site">
<nav class="cols" aria-label="Footer">
${FOOTER_COLUMNS.map(
    ([heading, links]) => `<div>
<h2>${esc(heading)}</h2>
<ul>
${links.map(([label, href]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('\n')}
</ul>
</div>`
  ).join('\n')}
</nav>
<div class="in">© ${new Date().getFullYear()} RezUp · part of Zalize · Pay once, own it forever. Your resume stays in your browser — we never store it. · More honest tools: <a href="https://qr.zalize.com">HonestQR</a> · <a href="https://pdf.zalize.com">HonestPDF</a> · <a href="https://subsleuth.zalize.com">SubSleuth</a></div>
</footer>`
}

const CSS = `
@font-face{font-family:'Inter';font-style:normal;font-weight:400 700;font-display:optional;src:url('/fonts/inter-latin.woff2') format('woff2')}
@font-face{font-family:'Sora';font-style:normal;font-weight:600 800;font-display:optional;src:url('/fonts/sora-latin.woff2') format('woff2')}
:root{--bg:oklch(0.99 0.002 250);--fg:oklch(0.18 0.02 260);--muted:oklch(0.52 0.02 260);--primary:oklch(0.5 0.18 265);--primary-fg:oklch(0.985 0 0);--border:oklch(0.91 0.01 260);--card:oklch(1 0 0);--accent:oklch(0.94 0.03 265);--radius:0.625rem}
*{box-sizing:border-box;border-color:var(--border)}
body{margin:0;background:var(--bg);color:var(--fg);-webkit-font-smoothing:antialiased;font-family:'Inter',system-ui,-apple-system,sans-serif;line-height:1.7}
a{color:var(--primary);text-decoration:underline;text-underline-offset:3px}
a.btn,a.brand{text-decoration:none}
header.site{position:sticky;top:0;z-index:20;border-bottom:1px solid var(--border);background:color-mix(in oklch,var(--bg) 85%,transparent);backdrop-filter:blur(8px)}
header.site .in{max-width:72rem;margin:0 auto;height:3.5rem;display:flex;align-items:center;justify-content:space-between;padding:0 1rem}
header.site .brand{display:flex;align-items:center;gap:.5rem;font-weight:600;color:var(--fg)}
header.site .brand img{width:1.5rem;height:1.5rem}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:calc(var(--radius) - 2px);background:var(--primary);color:var(--primary-fg);padding:.55rem 1.1rem;font-size:.9rem;font-weight:500;border:0;cursor:pointer;min-height:44px}
.btn:hover{opacity:.9;text-decoration:none}
main{max-width:46rem;margin:0 auto;padding:2.5rem 1rem 4rem}
h1,h2,h3{font-family:'Sora','Inter',system-ui,sans-serif;letter-spacing:-.015em}
h1{font-size:2rem;line-height:1.25;margin:.25rem 0 .75rem}
.lede{color:var(--muted);font-size:1.05rem}
ul.features{padding-left:1.3em}
ul.features li{margin:.4rem 0}
.cta{margin:2.5rem 0 0;border:1px solid var(--border);background:var(--card);border-radius:var(--radius);padding:1.5rem;box-shadow:0 1px 2px rgb(0 0 0/.04);text-align:center}
.cta p{color:var(--muted);font-size:.9375rem}
.related{margin-top:3rem;border-top:1px solid var(--border);padding-top:1.5rem}
.related h2{font-size:1rem;margin:0 0 .75rem}
.toc{margin:1.25rem 0;padding:1rem 1.25rem;background:#f8fafc;border:1px solid var(--border);border-radius:8px;font-size:.9rem}
.toc strong{display:block;margin-bottom:.5rem}
.toc ol{margin:0;padding-left:1.25rem;columns:2;column-gap:2rem}
.toc li{margin:.15rem 0;break-inside:avoid}
.toc a{text-decoration:underline}
@media (max-width:640px){.toc ol{columns:1}}
h2[id]{scroll-margin-top:1rem}
.related ul{list-style:none;padding:0;margin:0;display:grid;gap:.5rem}
footer.site{border-top:1px solid var(--border)}
footer.site .in{max-width:72rem;margin:0 auto;padding:1.5rem 1rem;text-align:center;font-size:.75rem;color:var(--muted)}
footer.site .cols{max-width:72rem;margin:0 auto;padding:2rem 1rem .5rem;display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem 2rem;font-size:.8125rem}
@media (min-width:768px){footer.site .cols{grid-template-columns:repeat(4,1fr)}}
footer.site .cols h2{margin:0 0 .5rem;font-size:.75rem;font-family:'Inter',system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
footer.site .cols ul{list-style:none;margin:0;padding:0}
footer.site .cols li{margin:.4rem 0}
footer.site .cols a{color:var(--fg);text-decoration:none}
footer.site .cols a:hover{text-decoration:underline}
nav.main{display:none}
@media (min-width:768px){nav.main{display:flex;align-items:center;gap:1.25rem;font-size:.875rem}}
nav.main a{color:var(--muted);text-decoration:none}
nav.main a:hover{color:var(--fg)}
details.mnav{position:relative}
@media (min-width:768px){details.mnav{display:none}}
details.mnav summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;border-radius:calc(var(--radius) - 2px);color:var(--fg)}
details.mnav summary::-webkit-details-marker{display:none}
details.mnav summary:hover{background:var(--border)}
details.mnav[open] summary{background:var(--border)}
details.mnav .panel{position:absolute;right:0;top:calc(100% + .5rem);min-width:11rem;background:var(--bg);border:1px solid var(--border);border-radius:calc(var(--radius) - 2px);box-shadow:0 8px 24px rgb(0 0 0 / .08);padding:.25rem}
details.mnav .panel a{display:flex;align-items:center;min-height:2.5rem;padding:0 .75rem;font-size:.875rem;color:var(--fg);text-decoration:none;border-radius:calc(var(--radius) - 4px)}
details.mnav .panel a:hover{background:var(--border)}
details.mnav .panel p{margin:.5rem 0 0;padding:0 .75rem;font-size:.6875rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
details.rnav{display:none;position:relative}
@media (min-width:768px){details.rnav{display:block}}
details.rnav summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:.25rem;color:var(--muted)}
details.rnav summary::-webkit-details-marker{display:none}
details.rnav summary:hover{color:var(--fg)}
details.rnav[open] summary{color:var(--fg)}
details.rnav[open] summary svg{transform:rotate(180deg)}
details.rnav .panel{position:absolute;left:0;top:calc(100% + .75rem);min-width:14rem;background:var(--bg);border:1px solid var(--border);border-radius:calc(var(--radius) - 2px);box-shadow:0 8px 24px rgb(0 0 0 / .08);padding:.25rem;z-index:30}
details.rnav .panel a{display:flex;align-items:center;min-height:2.5rem;padding:0 .75rem;font-size:.875rem;color:var(--fg);text-decoration:none;border-radius:calc(var(--radius) - 4px)}
details.rnav .panel a:hover{background:var(--border)}
`.trim()

/** Header nav mirroring the React SiteHeader (src/components/Layout.tsx). */
const RESOURCE_LINKS = [
  ['Resume guides', '/guides/'],
  ['Cover letter generator', '/cover-letter-generator/'],
  ['Interview prep', '/interview-prep/'],
  ['RezUp vs Zety', '/vs/zety'],
  ['RezUp vs LiveCareer', '/vs/livecareer'],
  ['One-time payment builders', '/resume-builder-one-time-payment'],
  ['About', '/about'],
]
const RESOURCE_LINKS_HTML = RESOURCE_LINKS.map(([label, href]) => `<a href="${href}">${label}</a>`).join('\n')
const NAV_HTML = `<nav class="main" aria-label="Main">
<a href="/templates/">Templates</a>
<a href="/examples/">Examples</a>
<details class="rnav">
<summary>Resources <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
<div class="panel">
${RESOURCE_LINKS_HTML}
</div>
</details>
<a href="/ats-checker">ATS Checker</a>
<a href="/pricing/">Pricing</a>
</nav>
<details class="mnav">
<summary aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></summary>
<div class="panel">
<a href="/templates/">Templates</a>
<a href="/examples/">Examples</a>
<a href="/ats-checker">ATS Checker</a>
<a href="/pricing/">Pricing</a>
<a href="/dashboard">My resumes</a>
<p>Resources</p>
${RESOURCE_LINKS_HTML}
</div>
</details>`

/** URL-safe anchor id from a section heading */
function anchorId(heading) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

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
    name: 'RezUp',
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
<meta property="og:site_name" content="RezUp" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:locale" content="en_US" />
<meta property="og:image" content="${SITE}/og2.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd(p.path.startsWith('/vs/') ? [{ name: 'Comparisons', path: '/vs/' }, { name: p.h1, path: p.path }] : [{ name: p.h1, path: p.path }]))}</script>
<style>${CSS}</style>
${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />RezUp</a>
${NAV_HTML}
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
<p>${FREE_MODE ? 'Free during beta: every plan is fully unlocked at no charge — editor, ATS templates, match score, AI tools and PDF/DOCX downloads. Plans are $9.99/$19.99 one-time when billing opens. No card, no auto-renewal, nothing that renews.' : 'Everything is free to try — editor, ATS templates, live preview, match score. Pay $9.99 exactly once to download. No subscription, no auto-renewal, nothing to cancel.'}</p>
<a class="btn" href="${p.cta ?? '/builder'}">${esc(p.ctaLabel ?? 'Start free — no sign-up')}</a>
</div>
<div class="related">
<h2>More from RezUp</h2>
<ul>
${related.map((r) => `<li><a href="${r.path}">${esc(r.title.split(' — ')[0])}</a></li>`).join('\n')}
</ul>
</div>
</main>
${siteFooter()}
</body>
</html>`
}

const LEGAL_PAGES = [
  {
    path: '/terms',
    title: 'Terms & Refunds — RezUp',
    h1: 'Terms & refund policy',
    sections: [
      ['What you buy', 'RezUp sells one-time licenses: Single Resume ($9.99) unlocks unlimited AI rewrites plus PDF and DOCX downloads; Career Bundle ($19.99) adds the AI cover letter and interview prep tools. There is no subscription, no auto-renewal, and nothing to cancel — ever.'],
      ['Payments', 'Payments are processed by our merchant of record (Lemon Squeezy), which handles billing, receipts, and applicable taxes. We never see or store your card details.'],
      ['Refunds', 'Not happy for any reason within 14 days of purchase? Email us with the order number from your receipt and we will refund you in full — no questions, no hoops.'],
      ['License', 'Your license key works in any browser and is valid for 10 years. It covers personal use of your own resumes and cover letters; the documents you create are entirely yours.'],
      ['Fair use', 'AI features are for polishing your own real experience. We may throttle automated or abusive traffic to keep the service fast for everyone.'],
    ],
  },
  {
    path: '/privacy',
    title: 'Privacy — RezUp',
    h1: 'Privacy policy',
    sections: [
      ['Your resume stays in your browser', 'Resume content is stored in your browser\u2019s localStorage. We have no user accounts and no resume database — clearing your browser data deletes your resume from existence.'],
      ['What our servers see', 'AI rewrite requests send only the text you ask to improve (plus the job description you pasted) to generate a response; we do not retain it after responding. Purchases store an order id and license key so your license can be restored.'],
      ['Payments', 'Checkout is handled by our merchant of record (Lemon Squeezy). Your payment details go to them, not us. Their receipt email is your proof of purchase.'],
      ['No tracking for sale', 'We do not sell or share personal data. We use no advertising trackers.'],
      ['Contact', 'Questions, feedback or data requests: email support@zalize.com. For purchase issues, replying to your receipt email also works.'],
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
<meta property="og:site_name" content="RezUp" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.sections[0][1])}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og2.png" />
<meta name="twitter:card" content="summary_large_image" />
<style>${CSS}</style>
${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />RezUp</a>
${NAV_HTML}
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(p.h1)}</h1>
${p.sections.map(([h, t]) => `<h2 style="margin-top:1.5rem;font-size:1.125rem">${esc(h)}</h2>\n<p class="lede" style="font-size:1rem">${esc(t)}</p>`).join('\n')}
</main>
${siteFooter()}
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

// About & press page — brand story + media kit
function aboutPage() {
  const canonical = `${SITE}/about`
  const title = 'About RezUp — The Resume Builder With No Subscription Traps'
  const description =
    'RezUp is a browser-local resume builder: ATS-safe templates, free ATS match scoring, AI that never invents your experience, and one-time pricing. Our story, plus a press kit.'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RezUp',
    url: SITE,
    logo: `${SITE}/favicon.svg`,
    description,
  }
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
<meta property="og:site_name" content="RezUp" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og2.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>${CSS}</style>
${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />RezUp</a>
${NAV_HTML}
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>About RezUp</h1>
<p class="lede">The resume-builder category monetizes desperation: a ~$2 “trial” that quietly converts into a ~$25/month subscription, free tiers that watermark exports or lock the useful report behind a paywall, and AI writers that invent metrics a candidate never achieved. “Zety charged me” is one of the most-searched complaints in the category. RezUp is built as the counter-example.</p>
<h2 style="margin-top:1.5rem;font-size:1.125rem">What we promise</h2>
<ul class="features">
<li>Your resume lives in your browser — no account, no resume database</li>
<li>The ATS match score is free and unlimited, computed locally</li>
<li>AI polishes your real experience — it never invents employers, dates or metrics</li>
<li>Real text-based PDF and DOCX export, no watermark</li>
<li>One-time pricing ($9.99 / $19.99) — no subscription, nothing to cancel. Currently free during beta.</li>
</ul>
<h2 style="margin-top:1.5rem;font-size:1.125rem">How we compare</h2>
<p class="lede" style="font-size:1rem">We sign up for competitors and run their full flows ourselves, then publish dated, first-hand comparisons: <a href="/vs/">RezUp vs other resume builders</a>. We also publish <a href="/guides/">free resume guides</a> and a shareable <a href="/ats-checker">ATS checker</a>.</p>
<h2 style="margin-top:1.5rem;font-size:1.125rem">Press kit</h2>
<p class="lede" style="font-size:1rem">Boilerplate: “RezUp is a browser-local resume builder for job seekers: 22 ATS-safe templates, a free ATS match score against any pasted job description, per-line AI tailoring that refuses to fabricate facts, and real text-based PDF/DOCX export — with one-time pricing instead of a subscription.”</p>
<ul class="features">
<li>Logo (SVG): <a href="/favicon.svg">cv.zalize.com/favicon.svg</a></li>
<li>Social/OG image: <a href="/og2.png">cv.zalize.com/og2.png</a></li>
<li>Name: “RezUp” — one word, capital H and CV</li>
<li>Contact: reply to any receipt email, or via the parent site zalize.com</li>
</ul>
<p class="lede" style="font-size:1rem">Sister products, same promise: <a href="https://qr.zalize.com">HonestQR</a>, <a href="https://pdf.zalize.com">HonestPDF</a>, <a href="https://subsleuth.zalize.com">SubSleuth</a>.</p>
</main>
${siteFooter()}
</body>
</html>`
}

{
  const dir = path.join(OUT_DIR, 'about')
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), aboutPage())
  console.log('built /about/index.html')
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
    author: { '@type': 'Organization', name: 'RezUp', url: SITE },
    publisher: { '@type': 'Organization', name: 'RezUp', url: SITE },
  }
  // 4 neighbouring guides (wrap-around) + comparisons hub — a focused list
  // of direct links (trailing slash avoids a 307 per click/crawl)
  const gi = GUIDES.findIndex((g) => g.path === p.path)
  const related = [1, 2, 3, 4]
    .map((d) => GUIDES[(gi + d) % GUIDES.length])
    .map((g) => ({ path: `${g.path}/`, title: g.title }))
    .concat([
      { path: '/examples/', title: 'Resume examples by role' },
      { path: '/vs/', title: 'RezUp vs other resume builders' },
    ])
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
<meta property="og:site_name" content="RezUp" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og2.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd([{ name: 'Guides', path: '/guides/' }, { name: p.h1, path: p.path }]))}</script>
<style>${CSS}</style>
${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />RezUp</a>
${NAV_HTML}
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(p.h1)}</h1>
<nav class="toc" aria-label="On this page">
<strong>On this page</strong>
<ol>
${p.sections.map(([h]) => `<li><a href="#${anchorId(h)}">${esc(h)}</a></li>`).join('\n')}
</ol>
</nav>
${p.sections.map(([h, t]) => `<h2 id="${anchorId(h)}" style="margin-top:1.75rem;font-size:1.2rem">${esc(h)}</h2>\n<p>${esc(t)}</p>`).join('\n')}
<div class="cta">
<p>${FREE_MODE ? 'Put this into practice — RezUp is free during beta: templates, AI rewrites, ATS score and PDF/DOCX downloads, all included ($9.99 one-time when billing opens, never a subscription).' : 'Put this into practice — the RezUp builder is free to try, with a one-time $9.99 download and no subscription.'}</p>
<a class="btn" href="/builder">Start building free</a> &nbsp; <a class="btn" href="/ats-checker" style="background:transparent;color:var(--primary);border:1px solid var(--border)">Check my ATS score</a>
</div>
<div class="related">
<h2>Keep reading</h2>
<ul>
${related.map((r) => `<li><a href="${r.path}">${esc(r.title.split(' — ')[0])}</a></li>`).join('\n')}
</ul>
</div>
</main>
${siteFooter()}
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
<meta property="og:site_name" content="RezUp" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og2.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(breadcrumbLd([{ name: 'Templates', path: '/templates/' }, { name: `${p.name} resume template`, path: p.path }]))}</script>
<style>${CSS}
.tpl-others{display:grid;grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr));gap:1rem;margin-top:1rem}
.tpl-others a{display:block;text-decoration:none;color:inherit}
.tpl-others a:hover svg{border-color:var(--primary)}
.tpl-others .nm{display:block;margin-top:.35rem;text-align:center;font-size:.85rem}
</style>
${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />RezUp</a>
${NAV_HTML}
<a class="btn" href="/builder?template=${p.path.split('/').pop()}">Use this template free</a>
</div></header>
<main>
<h1>${esc(p.name)} — ATS-friendly resume template</h1>
<div style="margin:1rem 0">${templateThumbSvg(p.path.split('/').pop(), 300)}</div>
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
<div class="tpl-others">
${others.map((t) => `<a href="${t.path}/" aria-label="${esc(t.name)} resume template">${templateThumbSvg(t.path.split('/').pop(), '100%')}<span class="nm">${esc(t.name)}</span></a>`).join('\n')}
</div>
</div>
</main>
${siteFooter()}
</body>
</html>`
}

/** Flat list, or one list per `group` (in first-seen order) when items are grouped. */
function renderHubItems(items) {
  const li = ({ href, label, blurb, thumb }) =>
    `<li${thumb ? ' style="display:flex;align-items:center;gap:.75rem"' : ''}>${thumb ? `<a href="${href}" style="flex-shrink:0;line-height:0">${thumb}</a>` : ''}<span><a href="${href}">${esc(label)}</a>${blurb ? ` — ${esc(blurb)}` : ''}</span></li>`
  if (!items.some((i) => i.group)) {
    return `<ul class="features">\n${items.map(li).join('\n')}\n</ul>`
  }
  const groups = []
  for (const item of items) {
    const name = item.group ?? 'More'
    const found = groups.find((g) => g.name === name)
    if (found) found.items.push(item)
    else groups.push({ name, items: [item] })
  }
  return groups
    .map(
      (g) =>
        `<h2 style="margin-top:2rem;font-size:1.125rem">${esc(g.name)}</h2>\n<ul class="features">\n${g.items.map(li).join('\n')}\n</ul>`
    )
    .join('\n')
}

function hubPage({
  pathname,
  title,
  description,
  h1,
  intro,
  items,
  bodyHtml,
  extraCss,
  mainStyle,
  filterPlaceholder,
  filterEmpty,
}) {
  const canonical = `${SITE}${pathname}`
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: h1,
    url: canonical,
    numberOfItems: items.length,
    itemListElement: items.map(({ href, label }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: label,
      url: `${SITE}${href}`,
    })),
  }
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
<meta property="og:site_name" content="RezUp" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og2.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(itemListLd)}</script>
<style>${CSS}${extraCss ?? ''}</style>
${FP_BEACON}
${filterPlaceholder ? '<script defer src="/hub-filter.js"></script>' : ''}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />RezUp</a>
${NAV_HTML}
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main${mainStyle ? ` style="${mainStyle}"` : ''}>
<h1>${esc(h1)}</h1>
<p class="lede">${esc(intro)}</p>
${filterPlaceholder ? `<input id="hub-filter" type="search" hidden placeholder="${esc(filterPlaceholder)}" aria-label="Filter the list below" autocomplete="off" style="width:100%;max-width:26rem;min-height:2.75rem;margin-top:1rem;padding:0 .875rem;border:1px solid var(--border);border-radius:.5rem;font:inherit;background:#fff" />\n<p id="hub-filter-empty" hidden style="margin-top:1.5rem;color:#667085">${esc(filterEmpty ?? 'No examples match that search \u2014 try a broader word like \u201cengineer\u201d or \u201cmanager\u201d.')}</p>` : ''}
${bodyHtml ?? renderHubItems(items)}
<div class="cta">
<p>${FREE_MODE ? 'RezUp is free during beta: templates, AI rewrites, ATS score and PDF/DOCX downloads, all included ($9.99 one-time when billing opens, never a subscription).' : 'The RezUp builder is free to try, with a one-time $9.99 download and no subscription.'}</p>
<a class="btn" href="/builder">Start building free</a> &nbsp; <a class="btn" href="/ats-checker" style="background:transparent;color:var(--primary);border:1px solid var(--border)">Check my ATS score</a>
</div>
</main>
${siteFooter()}
</body>
</html>`
}

// Role-based example resumes. All people and employers are fictional; every
// bullet follows the honest formula (action + scope + real-looking result)
// without invented certifications or degrees a reader could copy blindly.
const EXAMPLES = [
  {
    slug: 'software-engineer',
    role: 'Software Engineer',
    description:
      'A complete software engineer resume example: summary, quantified bullets, skills section and layout that pass ATS parsing — plus what to change for your own experience.',
    person: {
      name: 'Alex Rivera',
      title: 'Software Engineer',
      location: 'Austin, TX',
      summary:
        'Software engineer with 5 years building web services in TypeScript and Go. Led migration of a monolith to services handling 40M requests/day; care about tests, observability, and boring reliability.',
      experience: [
        {
          role: 'Software Engineer II',
          company: 'Brightpath Logistics',
          dates: '2023 – Present',
          bullets: [
            'Split the shipment-tracking monolith into 6 Go services, cutting p95 latency from 900ms to 210ms',
            'Introduced contract tests between services, reducing cross-team integration bugs by ~60% per release',
            'Mentored 2 junior engineers through onboarding and their first production launches',
          ],
        },
        {
          role: 'Software Engineer',
          company: 'Cardinal Apps',
          dates: '2021 – 2023',
          bullets: [
            'Built the customer-facing order dashboard (React + TypeScript) used by 12k merchants daily',
            'Cut CI pipeline time from 24 to 9 minutes by parallelizing test shards and caching dependencies',
          ],
        },
      ],
      skills: ['TypeScript', 'Go', 'React', 'PostgreSQL', 'Kubernetes', 'CI/CD', 'Observability'],
      education: 'B.S. Computer Science — University of Texas at Austin, 2020',
    },
    tips: [
      ['Lead with systems, not languages', 'Recruiters skim for scale and ownership signals: requests/day, latency numbers, services owned. Languages belong in the skills block; the bullets should prove you shipped things that mattered.'],
      ['Quantify honestly', 'Use real numbers from dashboards you actually watched (latency, error rates, build times). If you don\u2019t have a number, describe the before/after state instead of inventing one.'],
      ['Match the JD\u2019s stack keywords', 'ATS keyword matching is literal: if the posting says "Kubernetes" and your resume says "k8s", spell it out. Paste the JD into the free ATS checker to see exactly what\u2019s missing.'],
    ],
  },
  {
    slug: 'registered-nurse',
    role: 'Registered Nurse',
    description:
      'A registered nurse resume example with unit scope, patient-load numbers and licensure placement that ATS parsers read correctly — and how to adapt it to your specialty.',
    person: {
      name: 'Maya Chen',
      title: 'Registered Nurse, BSN',
      location: 'Portland, OR',
      summary:
        'Med-surg RN with 4 years of acute-care experience across 30-bed units. Preceptor for new-grad nurses; consistent on-time charting and zero medication errors across the last 3 audit cycles.',
      experience: [
        {
          role: 'Registered Nurse — Med-Surg',
          company: 'Riverbend Medical Center',
          dates: '2022 – Present',
          bullets: [
            'Manage care for 5–6 acute patients per shift on a 30-bed unit, coordinating with hospitalists and PT/OT',
            'Precepted 7 new-graduate nurses through 12-week orientations; all passed competency sign-off on schedule',
            'Led the unit\u2019s fall-prevention huddle pilot, contributing to a 25% drop in falls over two quarters',
          ],
        },
        {
          role: 'Registered Nurse',
          company: 'Cascade Community Hospital',
          dates: '2020 – 2022',
          bullets: [
            'Provided post-operative care for orthopedic and general-surgery patients on a 24-bed unit',
            'Recognized twice by patient-experience surveys for discharge-education clarity',
          ],
        },
      ],
      skills: ['Acute patient care', 'Epic EHR charting', 'IV therapy', 'Patient education', 'Preceptorship', 'BLS/ACLS'],
      education: 'BSN — Oregon Health & Science University, 2020 · RN License #: available on request',
    },
    tips: [
      ['Put licensure where parsers find it', 'List RN license state and certifications (BLS, ACLS) in a clearly labeled section — ATS filters for them, and recruiters check them first. Numbers can be "available on request".'],
      ['Show patient load and unit size', '"Managed 5–6 patients on a 30-bed med-surg unit" tells a nurse manager your acuity comfort zone instantly. It\u2019s the nursing equivalent of engineering scale numbers.'],
      ['Name the EHR', 'Epic, Cerner, or Meditech experience is a hard keyword in most postings — say which one you charted in.'],
    ],
  },
  {
    slug: 'marketing-manager',
    role: 'Marketing Manager',
    description:
      'A marketing manager resume example with channel-level results, budget scope and team leadership — structured so ATS parsers and skimming CMOs both get it.',
    person: {
      name: 'Jordan Okafor',
      title: 'Marketing Manager',
      location: 'Chicago, IL',
      summary:
        'Marketing manager with 6 years across demand gen and lifecycle. Own a $1.2M annual budget and a team of 3; grew qualified pipeline 45% year-over-year while cutting cost per MQL by a third.',
      experience: [
        {
          role: 'Marketing Manager',
          company: 'Halberd Software',
          dates: '2022 – Present',
          bullets: [
            'Own demand generation across paid search, LinkedIn and webinars on a $1.2M budget; pipeline up 45% YoY',
            'Rebuilt the nurture program (14 emails \u2192 6 behavior-triggered tracks), lifting MQL\u2192SQL conversion from 8% to 13%',
            'Manage and develop a team of 3 (content, paid, ops); two internal promotions in two years',
          ],
        },
        {
          role: 'Digital Marketing Specialist',
          company: 'Northgate Retail Group',
          dates: '2019 – 2022',
          bullets: [
            'Ran paid social for 40 store locations; cut cost per store visit 28% via geo-segmented creative testing',
            'Launched the loyalty-email program that reached 120k subscribers with a 38% average open rate',
          ],
        },
      ],
      skills: ['Demand generation', 'Paid search & social', 'Lifecycle/email marketing', 'HubSpot', 'GA4', 'Budget management', 'Team leadership'],
      education: 'B.A. Communications — DePaul University, 2019',
    },
    tips: [
      ['Anchor every bullet to a funnel metric', 'Pipeline, MQLs, conversion rates, CAC — marketing leaders hire people who talk in the same numbers they report to the board. Vanity metrics (impressions alone) read as junior.'],
      ['State budget and team size', 'Scope is the fastest seniority signal: "$1.2M budget, team of 3" places you precisely without a single adjective.'],
      ['Mirror the JD\u2019s channel language', 'If the posting says "ABM" and you\u2019ve done account-based campaigns, use their term. Run the JD through the ATS checker to catch vocabulary gaps.'],
    ],
  },
  {
    slug: 'data-analyst',
    role: 'Data Analyst',
    description:
      'A data analyst resume example showing SQL/BI impact bullets, stakeholder scope and a clean skills block — with advice for career-switchers into analytics.',
    person: {
      name: 'Priya Natarajan',
      title: 'Data Analyst',
      location: 'Atlanta, GA',
      summary:
        'Data analyst with 3 years turning messy operational data into decisions. Built the executive KPI layer used in weekly leadership reviews; strongest in SQL, dbt and Looker.',
      experience: [
        {
          role: 'Data Analyst',
          company: 'Meridian Health Partners',
          dates: '2023 – Present',
          bullets: [
            'Built and maintain 40+ dbt models powering the KPI dashboard used in weekly executive reviews',
            'Identified a claims-coding gap worth $380k/year in missed reimbursements; fix adopted within one quarter',
            'Cut ad-hoc reporting requests 50% by shipping self-serve Looker explores for operations teams',
          ],
        },
        {
          role: 'Operations Analyst',
          company: 'Southline Freight',
          dates: '2021 – 2023',
          bullets: [
            'Automated the daily dispatch report (Python + SQL), saving the ops team ~8 hours per week',
            'Analyzed route profitability across 200 lanes; recommendations lifted margin 4 points on the worst decile',
          ],
        },
      ],
      skills: ['SQL', 'dbt', 'Looker', 'Python (pandas)', 'Data modeling', 'Stakeholder reporting', 'A/B test analysis'],
      education: 'B.S. Industrial Engineering — Georgia Tech, 2021',
    },
    tips: [
      ['Show the decision, not just the dashboard', 'The strongest analyst bullets end with what changed: money recovered, hours saved, a call leadership made. A dashboard nobody acted on isn\u2019t a result.'],
      ['Name your exact stack', 'SQL flavor, BI tool, transformation layer — postings filter on these literally. "Looker" and "Tableau" are different keywords to an ATS even if the skills transfer.'],
      ['Career-switchers: mine your old role for analysis', 'An ops or finance background full of spreadsheet decisions is analytics experience — reframe those bullets around data, method and outcome.'],
    ],
  },
  {
    slug: 'project-manager',
    role: 'Project Manager',
    description:
      'A project manager resume example with delivery metrics, budget/stakeholder scope and certification placement that survives ATS parsing.',
    person: {
      name: 'Sam Whitfield',
      title: 'Project Manager, PMP',
      location: 'Denver, CO',
      summary:
        'Project manager with 7 years delivering software and infrastructure projects up to $4M. 90% on-time delivery across the last 12 projects; comfortable running hybrid agile/waterfall with distributed teams.',
      experience: [
        {
          role: 'Senior Project Manager',
          company: 'Silverpeak Systems',
          dates: '2022 – Present',
          bullets: [
            'Delivered a $4M warehouse-management rollout across 3 sites, 2 weeks early and 5% under budget',
            'Run a portfolio of 4 concurrent projects with 25+ contributors across engineering, vendor and client teams',
            'Introduced risk-burndown reviews that cut late-stage surprises: zero red-status escalations in 18 months',
          ],
        },
        {
          role: 'Project Manager',
          company: 'Bluestem Consulting',
          dates: '2018 – 2022',
          bullets: [
            'Managed 15 client implementations end-to-end, averaging 92% on-time milestone completion',
            'Standardized the kickoff-to-handoff playbook adopted by all 6 PMs in the practice',
          ],
        },
      ],
      skills: ['Project delivery', 'Agile & waterfall', 'Budget management', 'Risk management', 'Jira / MS Project', 'Stakeholder communication', 'PMP'],
      education: 'B.S. Business Administration — University of Colorado Boulder, 2017 · PMP (PMI), 2020',
    },
    tips: [
      ['Lead with delivery statistics', 'On-time percentage, budget variance, project value — PMs are hired on track record, and these three numbers are your track record in one line.'],
      ['Certifications: title line AND education block', 'Put "PMP" after your name at the top (recruiters skim) and in a credentials line (ATS filters). Same for CSM, PRINCE2 or SAFe.'],
      ['Describe the mess you managed', 'Sites, vendors, distributed contributors — complexity scope separates a coordinator from a senior PM better than any responsibility list.'],
    ],
  },
  {
    slug: 'customer-service',
    role: 'Customer Service Representative',
    description:
      'A customer service resume example with CSAT numbers, volume handled and promotion evidence — plus how to step it toward team-lead roles.',
    person: {
      name: 'Dana Alvarez',
      title: 'Customer Service Representative',
      location: 'Phoenix, AZ',
      summary:
        'Customer service rep with 4 years across phone, chat and email support. Sustain 96% CSAT on ~60 tickets/day; trusted with escalations and new-hire mentoring.',
      experience: [
        {
          role: 'Senior Customer Service Representative',
          company: 'Sunbelt Home Warranty',
          dates: '2023 – Present',
          bullets: [
            'Resolve ~60 phone and chat tickets daily with 96% CSAT, 15 points above team average on escalations',
            'Handle tier-2 billing escalations; recovered 120+ at-risk cancellations in the last year',
            'Mentor 4 new hires per quarter through their first month of live tickets',
          ],
        },
        {
          role: 'Customer Service Representative',
          company: 'Cactus Wireless',
          dates: '2021 – 2023',
          bullets: [
            'Answered 70+ calls/day in a high-volume retail-support queue, maintaining 93% CSAT',
            'Promoted to the escalation desk after 9 months — fastest on a team of 30',
          ],
        },
      ],
      skills: ['Phone / chat / email support', 'De-escalation', 'Zendesk', 'Billing systems', 'CSAT & AHT metrics', 'New-hire mentoring'],
      education: 'A.A. Communication — Phoenix College, 2021',
    },
    tips: [
      ['Metrics exist — use them', 'Support is one of the most-measured jobs there is: CSAT, tickets/day, AHT, QA scores. Pull your real numbers from the dashboard your manager already reads.'],
      ['Show trust signals', 'Escalation-desk assignments, mentoring, retention saves — these prove you\u2019re the rep managers rely on, which is exactly what the next employer wants.'],
      ['Name the ticketing system', 'Zendesk, Salesforce Service Cloud, Intercom — it\u2019s a keyword filter and a training-cost signal.'],
    ],
  },
  {
    slug: 'sales-representative',
    role: 'Sales Representative',
    description:
      'A sales representative resume example with quota attainment, deal size and pipeline numbers — the three figures every sales manager scans for first.',
    person: {
      name: 'Marcus Bell',
      title: 'Sales Representative',
      location: 'Nashville, TN',
      summary:
        'B2B sales rep with 5 years in SaaS and business services. 112% average quota attainment over the last 8 quarters; strongest at outbound prospecting and multi-stakeholder deals.',
      experience: [
        {
          role: 'Account Executive',
          company: 'Cumberland Software',
          dates: '2022 – Present',
          bullets: [
            'Attained 112% of quota on average across 8 quarters ($850k annual target, mid-market SaaS)',
            'Closed 41 new logos including the region\u2019s 2 largest deals of 2025 ($95k and $78k ACV)',
            'Source 60% of own pipeline via outbound; booked-meeting rate consistently top-2 on a 12-rep team',
          ],
        },
        {
          role: 'Sales Development Representative',
          company: 'Riverline Payroll',
          dates: '2020 – 2022',
          bullets: [
            'Booked 25+ qualified meetings monthly, 130% of SDR target; promoted to AE in 18 months',
            'Rebuilt the outbound email sequences, doubling reply rate to 9% team-wide',
          ],
        },
      ],
      skills: ['Outbound prospecting', 'Discovery & demos', 'Negotiation', 'Salesforce', 'Outreach.io', 'Pipeline management', 'Mid-market SaaS'],
      education: 'B.B.A. Marketing — Middle Tennessee State University, 2020',
    },
    tips: [
      ['Quota attainment first', 'Percentage of quota over multiple quarters is the single number sales managers screen on. Put it in the summary and repeat it in the bullets with the target size for context.'],
      ['Deal shape matters', 'ACV, sales cycle, land vs. expand, segment — a rep who closed $80k mid-market deals is a different hire than one closing $2k self-serve. Be precise about yours.'],
      ['Honesty is checkable', 'Sales claims get verified in backchannel and W-2 conversations. Numbers you can defend in a live deal review are the only ones worth printing.'],
    ],
  },
  {
    slug: 'teacher',
    role: 'Teacher',
    description:
      'A teacher resume example with class-size scope, measurable learning outcomes and certification placement — adaptable across grade levels and subjects.',
    person: {
      name: 'Rachel Nguyen',
      title: 'High School English Teacher',
      location: 'Sacramento, CA',
      summary:
        'English teacher with 6 years across grades 9–12, including AP Literature. Raised state ELA proficiency 14 points in two years at a Title I school; department tech lead for curriculum tools.',
      experience: [
        {
          role: 'English Teacher (Grades 9–12)',
          company: 'Del Rio High School',
          dates: '2021 – Present',
          bullets: [
            'Teach 5 sections (~150 students) including AP Literature; AP pass rate rose from 61% to 74% in three years',
            'Co-led the writing-across-curriculum initiative credited with a 14-point ELA proficiency gain schoolwide',
            'Serve as department tech lead: trained 11 teachers on the district\u2019s new curriculum platform',
          ],
        },
        {
          role: 'English Teacher (Grade 9)',
          company: 'Foothill Middle College',
          dates: '2019 – 2021',
          bullets: [
            'Designed the freshman composition curriculum adopted across all 6 sections',
            'Ran the after-school writing lab serving 40+ students weekly',
          ],
        },
      ],
      skills: ['Curriculum design', 'AP Literature', 'Differentiated instruction', 'IEP/504 accommodations', 'Classroom management', 'Ed-tech integration'],
      education: 'M.A. Education — Sacramento State, 2019 · CA Single Subject Credential (English)',
    },
    tips: [
      ['Outcomes beat duties', 'Every teacher "develops lesson plans" — few can show a proficiency gain, AP pass-rate change, or an adopted curriculum. Lead with the measurable ones you genuinely influenced.'],
      ['Credential placement', 'State credential and subject authorization go in a labeled line ATS software can parse — districts filter on them before a human reads anything.'],
      ['Show scope', 'Sections taught, student count, grade span, IEP load — scope numbers let a principal picture you in their master schedule immediately.'],
    ],
  },
  {
    slug: 'accountant',
    role: 'Accountant',
    description:
      'An accountant resume example with close-cycle metrics, audit outcomes and software keywords — plus where CPA status belongs so both ATS filters and partners see it.',
    person: {
      name: 'Elena Vasquez',
      title: 'Senior Accountant, CPA',
      location: 'Charlotte, NC',
      summary:
        'CPA with 6 years across public audit and corporate accounting. Own the month-end close for a $90M-revenue business; cut close time from 9 to 5 days and cleared two consecutive external audits with zero adjustments.',
      experience: [
        {
          role: 'Senior Accountant',
          company: 'Piedmont Building Products',
          dates: '2022 – Present',
          bullets: [
            'Own month-end close for a $90M-revenue entity; reduced close from 9 to 5 business days by automating recurring journal entries and reconciliations in NetSuite',
            'Cleared FY24 and FY25 external audits with zero post-audit adjustments; prepare all PBC schedules',
            'Built the 13-week cash-flow forecast the CFO now uses in weekly leadership reviews',
          ],
        },
        {
          role: 'Audit Associate',
          company: 'Hartwell & Gray CPAs',
          dates: '2019 – 2022',
          bullets: [
            'Executed audit fieldwork for 12–15 clients per year in manufacturing and nonprofit sectors',
            'Promoted to senior associate in two years; led 3-person fieldwork teams on recurring engagements',
          ],
        },
      ],
      skills: ['Month-end close', 'GAAP', 'NetSuite', 'Account reconciliation', 'Audit preparation', 'Cash-flow forecasting', 'Excel (power user)'],
      education: 'B.S. Accounting — UNC Charlotte, 2019 · CPA (North Carolina), 2021',
    },
    tips: [
      ['Close time is your headline number', 'Days-to-close, audit adjustments, entities owned — controllers hire accountants on process reliability, and these numbers prove it faster than any duties list.'],
      ['CPA in the title line and education', 'ATS filters search "CPA" literally; recruiters skim the name line. Put it in both places, with the state and year in education.'],
      ['Name the ERP', 'NetSuite, SAP, QuickBooks, Workday — system experience is a hard screening keyword and a training-cost signal.'],
    ],
  },
  {
    slug: 'administrative-assistant',
    role: 'Administrative Assistant',
    description:
      'An administrative assistant resume example showing executives supported, calendar/travel volume and process wins — the scope numbers office managers actually screen for.',
    person: {
      name: 'Tanya Brooks',
      title: 'Administrative Assistant',
      location: 'Columbus, OH',
      summary:
        'Administrative assistant with 5 years supporting executives and busy offices. Currently support 3 directors — calendars, travel, expenses, board prep — while running front-office operations for a 60-person site.',
      experience: [
        {
          role: 'Administrative Assistant',
          company: 'Scioto Insurance Group',
          dates: '2022 – Present',
          bullets: [
            'Support 3 directors: manage calendars averaging 40+ meetings/week, book ~6 trips/month, and process expenses with zero policy rejections in two years',
            'Prepare board-meeting packets quarterly (agendas, minutes, follow-up tracking) for a 9-member board',
            'Rebuilt the office supply and vendor process, cutting monthly spend 18% without service complaints',
          ],
        },
        {
          role: 'Front Office Coordinator',
          company: 'Maple Dental Partners',
          dates: '2020 – 2022',
          bullets: [
            'Ran scheduling and intake for a practice seeing 50+ patients daily across 4 providers',
            'Cut no-show rate from 12% to 7% by introducing text-reminder workflows',
          ],
        },
      ],
      skills: ['Executive calendar management', 'Travel & expense coordination', 'Microsoft 365 / Google Workspace', 'Meeting & board prep', 'Vendor management', 'Front-office operations'],
      education: 'A.A.B. Office Administration — Columbus State Community College, 2020',
    },
    tips: [
      ['Count everything you coordinate', 'Executives supported, meetings per week, trips per month — volume numbers turn "managed calendars" into evidence of capacity.'],
      ['Show judgment, not just tasks', 'Zero expense rejections, board packets delivered on time, vendor savings — admins are hired for reliability under trust, so surface the outcomes that prove it.'],
      ['List the exact toolset', 'Microsoft 365 vs Google Workspace, Concur, Zoom admin — postings filter on the stack the office already runs.'],
    ],
  },
  {
    slug: 'graphic-designer',
    role: 'Graphic Designer',
    description:
      'A graphic designer resume example that balances portfolio links, brand-impact bullets and ATS-safe formatting — creative work, boring layout, on purpose.',
    person: {
      name: 'Theo Marsh',
      title: 'Graphic Designer',
      location: 'Minneapolis, MN',
      summary:
        'Graphic designer with 5 years across brand systems, packaging and digital campaigns. Led the rebrand rollout across 200+ SKUs; portfolio at theomarsh.example.com (12 case studies with before/after metrics).',
      experience: [
        {
          role: 'Graphic Designer',
          company: 'North Loop Foods',
          dates: '2022 – Present',
          bullets: [
            'Led design execution of the company rebrand across 200+ SKUs, retail displays and the DTC site in 9 months',
            'Design email and paid-social creative for monthly campaigns; top variant lifted click-through 32% in A/B tests',
            'Built and documented the Figma component library used by 2 in-house designers and 3 agency partners',
          ],
        },
        {
          role: 'Junior Designer',
          company: 'Copperline Studio',
          dates: '2020 – 2022',
          bullets: [
            'Produced brand identities, menus and signage for 20+ hospitality clients from concept to print handoff',
            'Managed prepress and print-vendor coordination, cutting reprint errors to near zero over two years',
          ],
        },
      ],
      skills: ['Brand identity', 'Adobe Creative Cloud (Ai/Ps/Id)', 'Figma', 'Packaging & print production', 'Email/social creative', 'Design systems'],
      education: 'B.F.A. Graphic Design — Minneapolis College of Art and Design, 2020',
    },
    tips: [
      ['The portfolio link is the interview', 'Put the URL in the header and make sure it\u2019s plain clickable text in the exported PDF. The resume\u2019s job is to earn the click; the portfolio closes.'],
      ['Keep the resume layout ATS-boring', 'Designers are the most tempted to design their resume — and two-column graphic resumes are exactly what parsers mangle. Save the craft for the portfolio; keep the resume single-column real text.'],
      ['Attach outcomes to creative', 'CTR lifts, SKU counts, rollout timelines — pairing craft with numbers separates senior designers from decorators.'],
    ],
  },
  {
    slug: 'human-resources',
    role: 'HR Specialist',
    description:
      'A human resources resume example with headcount scope, time-to-fill and retention numbers — plus HRIS keywords that get past the very systems HR runs.',
    person: {
      name: 'Whitney Adebayo',
      title: 'HR Generalist',
      location: 'Dallas, TX',
      summary:
        'HR generalist with 5 years across recruiting, onboarding and employee relations for 200–400-employee companies. Cut time-to-fill 30% and voluntary first-year turnover from 22% to 14%.',
      experience: [
        {
          role: 'HR Generalist',
          company: 'Lonestar Fulfillment Services',
          dates: '2022 – Present',
          bullets: [
            'Own full-cycle recruiting for ~60 hires/year across warehouse and office roles; cut average time-to-fill from 41 to 29 days',
            'Redesigned onboarding into a structured 30-day program; voluntary first-year turnover fell from 22% to 14%',
            'Handle employee-relations cases end-to-end (documentation, investigation, resolution) for a 380-employee site',
          ],
        },
        {
          role: 'HR Coordinator',
          company: 'Trinity Med Supply',
          dates: '2020 – 2022',
          bullets: [
            'Administered benefits enrollment and HRIS records (ADP) for 210 employees with zero payroll-impacting errors',
            'Coordinated 40+ interviews monthly and standardized structured interview scorecards company-wide',
          ],
        },
      ],
      skills: ['Full-cycle recruiting', 'Onboarding design', 'Employee relations', 'ADP / Workday HRIS', 'Benefits administration', 'Employment-law compliance basics'],
      education: 'B.B.A. Human Resource Management — University of North Texas, 2020 · SHRM-CP, 2022',
    },
    tips: [
      ['Use the metrics HR already reports', 'Time-to-fill, turnover, hires per year, headcount supported — you report these to leadership; put the same numbers on your own resume.'],
      ['Certifications are filter keywords', 'SHRM-CP/SCP and PHR are literal ATS filters. List them with years in a credentials line, not buried in prose.'],
      ['Show the messy work', 'Employee-relations cases handled end-to-end signal trust and discretion — the part of HR that\u2019s hardest to hire for.'],
    ],
  },
  {
    slug: 'product-manager',
    role: 'Product Manager',
    description:
      'A product manager resume example with outcome-metric bullets, cross-functional scope and discovery evidence — what PM hiring panels actually screen for.',
    person: {
      name: 'Devon Silva',
      title: 'Product Manager',
      location: 'Seattle, WA',
      summary:
        'Product manager with 5 years in B2B SaaS. Own the billing-and-payments area of a $40M-ARR product; shipped the usage-based pricing revamp that lifted net revenue retention from 104% to 112%.',
      experience: [
        {
          role: 'Product Manager',
          company: 'Rainier Analytics',
          dates: '2022 – Present',
          bullets: [
            'Own billing/payments for a $40M-ARR analytics platform, working with 2 squads (11 engineers, 2 designers)',
            'Led the usage-based pricing revamp from 40+ customer interviews to GA; NRR rose 104% → 112% in three quarters',
            'Cut involuntary churn 20% by shipping dunning-flow improvements prioritized from support-ticket analysis',
          ],
        },
        {
          role: 'Associate Product Manager',
          company: 'Harborview Software',
          dates: '2020 – 2022',
          bullets: [
            'Shipped the self-serve onboarding flow that raised trial-to-paid conversion from 9% to 14%',
            'Ran weekly usability tests and maintained the insight repository used across 3 product teams',
          ],
        },
      ],
      skills: ['Product discovery & interviews', 'Roadmap prioritization', 'Pricing & monetization', 'SQL / product analytics', 'A/B experimentation', 'Cross-functional leadership'],
      education: 'B.S. Information Systems — University of Washington, 2019',
    },
    tips: [
      ['Bullets end in business outcomes', 'NRR, conversion, churn — PM panels screen for evidence you moved a metric that mattered, not for the features you shipped. Name the metric and the movement.'],
      ['Show discovery, not just delivery', '"40+ customer interviews to GA" proves you find problems worth solving — the half of the job weak PM resumes skip.'],
      ['State your surface area', 'Product area, ARR touched, squads and headcount you work with — scope calibrates your level instantly and honestly.'],
    ],
  },
  {
    slug: 'retail-associate',
    role: 'Retail Sales Associate',
    description:
      'A retail sales associate resume example with sales-per-hour, KPI attainment and promotion evidence — how to make hourly retail work read like the results job it is.',
    person: {
      name: 'Jasmine Cole',
      title: 'Retail Sales Associate',
      location: 'Tampa, FL',
      summary:
        'Retail associate with 4 years in apparel and electronics. Consistently top-3 in sales per hour on a 15-person floor; keyholder trusted with opening/closing and new-hire training.',
      experience: [
        {
          role: 'Sales Associate (Keyholder)',
          company: 'Bayline Electronics',
          dates: '2023 – Present',
          bullets: [
            'Rank top-3 of 15 associates in sales per hour for 6 straight quarters; 118% of attachment-rate target on accessories and warranties',
            'Trusted keyholder: open/close the store solo twice weekly, including register reconciliation and deposits',
            'Train 2–3 new associates per quarter on POS, floor standards and the sales process',
          ],
        },
        {
          role: 'Sales Associate',
          company: 'Coastline Apparel',
          dates: '2021 – 2023',
          bullets: [
            'Drove fitting-room conversion 12 points above store average through active outfit-building',
            'Named employee of the month 4 times across two years for sales and customer-service scores',
          ],
        },
      ],
      skills: ['Consultative selling', 'POS systems', 'Cash handling & reconciliation', 'Visual merchandising', 'New-hire training', 'Loss-prevention awareness'],
      education: 'High school diploma — Tampa Bay Tech, 2021',
    },
    tips: [
      ['Retail is measured — use the numbers', 'Sales per hour, attachment rate, conversion, mystery-shop scores: your store already ranks you. Those rankings are your resume.'],
      ['Keyholder status is a trust signal', 'Opening/closing solo, deposits, register reconciliation — responsibilities that prove reliability matter more than any adjective.'],
      ['Show the promotion path', 'Trainer, keyholder, employee-of-the-month streaks — evidence you were repeatedly chosen is what gets you the next tier (lead, assistant manager).'],
    ],
  },
  {
    slug: 'warehouse-worker',
    role: 'Warehouse Worker',
    description:
      'A warehouse worker resume example with pick rates, safety record and equipment certifications — the three things distribution-center recruiters scan for first.',
    person: {
      name: 'Luis Herrera',
      title: 'Warehouse Associate',
      location: 'Riverside, CA',
      summary:
        'Warehouse associate with 5 years in high-volume distribution. Sustain 115% of pick-rate standard with 99.8% accuracy; certified forklift and reach-truck operator with zero safety incidents.',
      experience: [
        {
          role: 'Warehouse Associate II',
          company: 'Inland Empire Distribution Co.',
          dates: '2022 – Present',
          bullets: [
            'Pick 140+ units/hour (115% of standard) at 99.8% scan accuracy in a 500k sq ft RF-scanning facility',
            'Certified on sit-down forklift and reach truck; zero safety incidents across 5 years',
            'Cross-trained in receiving, cycle counts and loading; cover 3 departments during peak season',
          ],
        },
        {
          role: 'Warehouse Associate',
          company: 'Pacific Parcel Services',
          dates: '2020 – 2022',
          bullets: [
            'Loaded/unloaded 8–10 trailers per shift while maintaining damage rates under 0.1%',
            'Selected for the peak-season lead rotation, directing a 6-person temp crew',
          ],
        },
      ],
      skills: ['RF scanning', 'Forklift & reach truck (certified)', 'Picking/packing/receiving', 'Cycle counting', 'Safety compliance', 'Team lead rotation'],
      education: 'High school diploma — Riverside Poly, 2019 · OSHA forklift certification, renewed 2025',
    },
    tips: [
      ['Rates, accuracy, safety — in that order', 'Units per hour vs. standard, scan accuracy, incident record: DC recruiters screen on these three lines. Pull real numbers from your labor-management printouts.'],
      ['Equipment certifications are keywords', 'Forklift, reach truck, cherry picker, pallet jack — name each certification and the year, since postings filter on them literally.'],
      ['Cross-training shows flex value', 'Coverage across receiving, picking and loading makes you the associate schedulers protect — say which departments you can run.'],
    ],
  },
  {
    slug: 'electrician',
    role: 'Electrician',
    description:
      'An electrician resume example with license class, code compliance and callback rate — what electrical contractors and facilities managers actually verify before an interview.',
    person: {
      name: 'Miguel Herrera',
      title: 'Journeyman Electrician',
      location: 'Phoenix, AZ',
      summary:
        'Licensed journeyman electrician with 7 years across commercial fit-outs and light industrial service. Zero failed inspections in 3 years; runs 2-apprentice crews on tenant-improvement jobs up to 40,000 sq ft.',
      experience: [
        {
          role: 'Journeyman Electrician',
          company: 'Sunstate Electric Co.',
          dates: '2022 – Present',
          bullets: [
            'Lead electrician on 25+ commercial tenant-improvement jobs; zero failed rough-in or final inspections in 3 years',
            'Run a 2-apprentice crew: layout, panel schedules, task assignment and QC before every inspection',
            'Service callback rate under 2% across ~300 service tickets per year, best on a 9-electrician service desk',
          ],
        },
        {
          role: 'Apprentice → Journeyman Electrician',
          company: 'Desert Ridge Electrical',
          dates: '2019 – 2022',
          bullets: [
            'Completed 8,000-hour apprenticeship and passed the Arizona journeyman exam on the first attempt',
            'Wired 60+ residential and small-commercial panels to NEC 2020 with no correction notices',
          ],
        },
      ],
      skills: ['NEC 2023 code compliance', 'Commercial rough-in & finish', 'Panel & switchgear installation', 'Conduit bending (EMT/rigid)', 'Blueprint & panel-schedule reading', 'Troubleshooting & service calls'],
      education: 'Journeyman Electrician License (AZ) — Phoenix JATC apprenticeship, 2022 · OSHA 30, 2023',
    },
    tips: [
      ['License first, always', 'State, class and year in the title and top line — journeyman vs. master is the first filter every electrical posting applies, and recruiters verify it.'],
      ['Inspections are your metric', 'Passed inspections, correction notices and callback rate are the trade\u2019s quality numbers. "Zero failed finals in 3 years" beats any list of duties.'],
      ['Name the code year', 'NEC 2020 vs. 2023 matters to the estimator reading your resume — cite the code cycle you work to, plus OSHA cards and any manufacturer certs.'],
    ],
  },
  {
    slug: 'truck-driver',
    role: 'Truck Driver',
    description:
      'A CDL truck driver resume example with license class, endorsements, safety record and on-time rate — the four lines fleet recruiters check before anything else.',
    person: {
      name: 'Darnell Whitfield',
      title: 'CDL-A Truck Driver',
      location: 'Memphis, TN',
      summary:
        'CDL-A driver with 9 years and 800,000+ accident-free miles across OTR and regional dry van. Clean MVR, 99.2% on-time delivery over the last 3 years, Hazmat and tanker endorsed.',
      experience: [
        {
          role: 'Regional Driver (Dry Van)',
          company: 'Bluff City Freight Lines',
          dates: '2022 – Present',
          bullets: [
            '99.2% on-time delivery across ~480 loads per year on Mid-South regional lanes',
            'Zero preventable accidents and zero moving violations; clean DOT roadside inspections 11 for 11',
            'Mentor driver for 6 new CDL graduates on trip planning, ELD compliance and dock procedures',
          ],
        },
        {
          role: 'OTR Driver',
          company: 'Interline Carriers',
          dates: '2017 – 2022',
          bullets: [
            'Logged 500,000+ accident-free OTR miles in 48 states with full ELD/HOS compliance',
            'Ran Hazmat-placarded loads after earning H and N endorsements in 2019',
          ],
        },
      ],
      skills: ['CDL-A with Hazmat (H) & tanker (N) endorsements', 'ELD & HOS compliance', 'Pre-trip / post-trip inspections', 'Trip planning & fuel optimization', 'Drop-and-hook & live unload', 'DOT regulations'],
      education: 'CDL-A — Delta Technical College truck driving program, 2017',
    },
    tips: [
      ['License, endorsements, miles, record', 'CDL class, endorsement letters, accident-free miles and MVR status are the whole first screen — put all four above your work history.'],
      ['Safety numbers are hire/no-hire', 'Preventables, violations and DOT inspection results feed straight into a carrier\u2019s insurance rates. State yours plainly; vague resumes read as hiding something.'],
      ['On-time rate proves the job', 'Freight is a service-level business. An on-time percentage with load volume ("99.2% across 480 loads/year") is the strongest line a driver can write.'],
    ],
  },
  {
    slug: 'financial-analyst',
    role: 'Financial Analyst',
    description:
      'A financial analyst resume example with model scope, forecast accuracy and dollars influenced — how FP&A hiring managers separate report-runners from decision-drivers.',
    person: {
      name: 'Grace Okafor',
      title: 'Financial Analyst',
      location: 'Charlotte, NC',
      summary:
        'FP&A analyst with 5 years in retail and logistics. Owns the revenue model for a $220M division, cut forecast error to under 3%, and built the variance pack the CFO presents to the board.',
      experience: [
        {
          role: 'Senior Financial Analyst',
          company: 'Carolina Retail Group',
          dates: '2023 – Present',
          bullets: [
            'Own revenue and margin forecasting for a $220M division; reduced forecast error from 7% to under 3% by rebuilding the driver-based model',
            'Built the monthly variance pack (Excel + Power BI) the CFO takes to the board, replacing a 3-day manual process with a half-day refresh',
            'Modeled the business case for closing 2 underperforming distribution nodes, a decision worth $4.1M in annual savings',
          ],
        },
        {
          role: 'Financial Analyst',
          company: 'Piedmont Logistics',
          dates: '2020 – 2023',
          bullets: [
            'Ran annual budget consolidation across 14 cost centers and $85M of spend',
            'Automated weekly flash reporting in SQL and Excel, saving ~10 analyst-hours per week',
          ],
        },
      ],
      skills: ['Financial modeling (driver-based)', 'Budgeting & forecasting', 'Variance analysis', 'Excel (advanced) & Power BI', 'SQL', 'Business-case development'],
      education: 'B.S. Finance — UNC Charlotte, 2020 · CFA Level II candidate, 2026',
    },
    tips: [
      ['Size the money you touch', 'Division revenue, spend consolidated, savings identified — every bullet should carry a dollar figure, because your job is literally to quantify.'],
      ['Forecast accuracy is your batting average', 'Report the error rate before and after your model changes. "Cut forecast error 7% → 3%" is the single most convincing FP&A line.'],
      ['Show decisions, not decks', 'Reports are table stakes; name the decision your analysis drove ("closed 2 nodes, $4.1M/yr"). That is what separates analyst from senior analyst.'],
    ],
  },
  {
    slug: 'medical-assistant',
    role: 'Medical Assistant',
    description:
      'A medical assistant resume example with certification, patient volume and EHR systems — the credentials and clinical evidence outpatient practices screen for.',
    person: {
      name: 'Alyssa Trujillo',
      title: 'Certified Medical Assistant (CMA)',
      location: 'Albuquerque, NM',
      summary:
        'AAMA-certified medical assistant with 5 years in family medicine and cardiology. Rooms 25+ patients a day, maintains 99%+ vitals-documentation accuracy in Epic, and cut patient wait times by 12 minutes as clinic flow lead.',
      experience: [
        {
          role: 'Medical Assistant — Cardiology',
          company: 'Rio Grande Heart Associates',
          dates: '2023 – Present',
          bullets: [
            'Room and take intake vitals for 25–30 patients daily across 3 cardiologists; 99%+ documentation accuracy on Epic chart audits',
            'Perform EKGs, Holter hookups and point-of-care INR testing; flagged 2 critical arrhythmia strips that led to same-day admissions',
            'As clinic flow lead, re-sequenced rooming and pre-visit prep to cut average patient wait time by 12 minutes',
          ],
        },
        {
          role: 'Medical Assistant — Family Medicine',
          company: 'Sandia Family Health',
          dates: '2021 – 2023',
          bullets: [
            'Administered immunizations and injections, ran phlebotomy draws and processed in-house labs for a 4-provider practice',
            'Managed prior authorizations and refill queues, clearing a 200-item backlog in the first 60 days',
          ],
        },
      ],
      skills: ['Patient intake & vitals', 'EKG & Holter monitoring', 'Phlebotomy & point-of-care testing', 'Epic EHR', 'Immunizations & injections', 'Prior authorizations & refills'],
      education: 'CMA (AAMA), certified 2021 — Central New Mexico Community College medical assisting program, 2021 · BLS, renewed 2025',
    },
    tips: [
      ['Certification and EHR are the filters', 'CMA/RMA credential (with certifying body and year) plus the EHR you chart in — Epic, Cerner, Athena — are what practice managers search for. Put both in the top third.'],
      ['Volume proves clinical pace', 'Patients roomed per day, providers supported, draws per shift: outpatient clinics run on throughput, so show you keep up.'],
      ['List skills as procedures', 'EKGs, injections, phlebotomy, POC testing — name each procedure you are signed off on rather than writing "clinical duties," because postings list them literally.'],
    ],
  },
  {
    slug: 'restaurant-server',
    role: 'Restaurant Server',
    description:
      'A restaurant server resume example with covers per shift, check average and wine sales — turning service work into the sales numbers restaurant managers hire on.',
    person: {
      name: 'Bethany Kim',
      title: 'Restaurant Server',
      location: 'Nashville, TN',
      summary:
        'Server with 6 years from high-volume casual dining to upscale steakhouse. Handles a 6-table section at 40+ covers a night, holds the highest wine attachment rate on a 14-server floor, and trains new hires on service steps.',
      experience: [
        {
          role: 'Server',
          company: 'The Hartwell Steakhouse',
          dates: '2023 – Present',
          bullets: [
            'Run a 6-table fine-dining section averaging 40+ covers per night with a $78 check average, 9% above house average',
            'Highest wine attachment rate of 14 servers for 5 consecutive quarters after completing sommelier-led list training',
            'Train new servers on steps of service, allergen protocol and POS; 6 of 7 trainees passed their floor test first try',
          ],
        },
        {
          role: 'Server',
          company: 'Broadway Biscuit Co.',
          dates: '2019 – 2023',
          bullets: [
            'Turned a 7-table section through 3 seatings on weekend brunch shifts of 250+ covers with sub-2% comp rate',
            'Consistently top-2 in add-on sales during feature promotions across a 12-server team',
          ],
        },
      ],
      skills: ['High-volume section management', 'Wine & menu pairing sales', 'POS (Toast, Aloha)', 'Allergen & food-safety protocol', 'New-server training', 'Guest recovery'],
      education: 'ServSafe Food Handler, renewed 2025 · TABC/ABC alcohol service certification, 2023',
    },
    tips: [
      ['Serving is selling — show the numbers', 'Check average, covers per shift, attachment rate on wine or features: managers can pull these from the POS, and putting them on paper says you think in them.'],
      ['Volume plus tier tells the story', 'A 250-cover brunch and a fine-dining steakhouse prove different skills — name the volume and the service tier so the reader can place you instantly.'],
      ['Certifications go on top', 'ServSafe and state alcohol-service cards are legal requirements many postings filter on; list them with renewal years so the manager knows you can start tomorrow.'],
    ],
  },
  {
    slug: 'operations-manager',
    role: 'Operations Manager',
    description:
      'An operations manager resume example with throughput, cost-per-unit and headcount scope — the P&L-adjacent numbers ops directors screen for before anything else.',
    person: {
      name: 'Denise Okafor',
      title: 'Operations Manager',
      location: 'Columbus, OH',
      summary:
        'Operations manager with 9 years across distribution and light manufacturing. Runs a 3-shift, 85-person site; cut cost per unit 11% in two years while holding 99.2% on-time shipment through a 30% volume increase.',
      experience: [
        {
          role: 'Operations Manager',
          company: 'Midwest Fulfillment Partners',
          dates: '2022 – Present',
          bullets: [
            'Run a 140,000 sq ft site with 85 associates across 3 shifts; 99.2% on-time shipment through a 30% YoY volume increase',
            'Cut cost per unit 11% over two years via slotting redesign, wave-picking rollout and overtime rebalancing',
            'Reduced recordable incidents from 9 to 2 per year by rebuilding the safety-observation program with shift leads',
          ],
        },
        {
          role: 'Shift Supervisor → Assistant Operations Manager',
          company: 'Buckeye Packaging Co.',
          dates: '2017 – 2022',
          bullets: [
            'Promoted twice in five years; led a 28-person second shift to the plant\u2019s best scrap rate (1.8% vs 3.1% average)',
            'Co-led a line-changeover kaizen that cut average changeover time from 45 to 18 minutes',
          ],
        },
      ],
      skills: ['P&L & cost-per-unit management', 'Multi-shift labor planning', 'Lean / kaizen facilitation', 'WMS & ERP (Manhattan, NetSuite)', 'OSHA compliance & safety programs', 'KPI dashboards & reporting'],
      education: 'B.S. Business Administration — Ohio State University, 2016 · APICS CPIM, 2021',
    },
    tips: [
      ['Lead with scope, then results', 'Site size, headcount, shifts and volume are the first filter — "85 associates across 3 shifts" places you instantly. Then prove it moved: cost per unit, OTS, incidents.'],
      ['Cost numbers beat activity lists', '"Cut cost per unit 11%" outranks any paragraph about "overseeing daily operations". If you can\u2019t share absolute dollars, percentages against a named baseline still work.'],
      ['Safety is a hiring criterion', 'Recordable-incident trends are board-level numbers in ops. A concrete reduction with the mechanism ("safety-observation program") reads as management, not luck.'],
    ],
  },
  {
    slug: 'mechanical-engineer',
    role: 'Mechanical Engineer',
    description:
      'A mechanical engineer resume example with tolerance-critical design work, cost-down results and DFM collaboration — what engineering managers verify beyond the CAD keyword list.',
    person: {
      name: 'Priya Raghavan',
      title: 'Mechanical Engineer',
      location: 'Austin, TX',
      summary:
        'Mechanical engineer with 6 years in consumer-hardware enclosure and mechanism design. Shipped 4 products at 100k+ annual units; owns design from concept CAD through DFM, tooling release and first-article approval.',
      experience: [
        {
          role: 'Mechanical Engineer II',
          company: 'Halcyon Devices',
          dates: '2022 – Present',
          bullets: [
            'Own enclosure and hinge design for a 150k-unit/yr smart display; passed 1m drop and 10k-cycle hinge testing on the first tooling shot',
            'Cut part cost 18% on the flagship product via part consolidation (11 parts to 6) and a resin change validated with mold-flow analysis',
            'Run weekly DFM reviews with two contract manufacturers; reduced open tooling issues at T1 from 34 to 9 across two programs',
          ],
        },
        {
          role: 'Mechanical Design Engineer',
          company: 'Kinetic Labs',
          dates: '2019 – 2022',
          bullets: [
            'Designed sheet-metal and machined structures for lab-automation instruments in SolidWorks with GD&T to ±0.05 mm where required',
            'Built and maintained tolerance stack-ups that cut first-article rejections by half year over year',
          ],
        },
      ],
      skills: ['SolidWorks & Creo (surfacing, sheet metal)', 'GD&T & tolerance stack-ups', 'DFM/DFA & tooling release', 'Injection molding & sheet metal', 'FEA & mold-flow analysis', 'Prototyping (SLA/SLS, CNC)'],
      education: 'B.S. Mechanical Engineering — University of Texas at Austin, 2019 · EIT (Texas), 2019',
    },
    tips: [
      ['Shipped products are the proof', 'Units per year, programs taken from concept to production, first-shot pass rates — hardware managers hire people who have released tooling, and these numbers say you have.'],
      ['Name tolerances and processes', '"GD&T to ±0.05 mm" and "11 parts to 6" are checkable engineering claims; "proficient in SolidWorks" is not. Tie every tool to a thing it produced.'],
      ['Cost-downs are engineering wins', 'An 18% part-cost reduction with the mechanism (consolidation, resin change, mold-flow validation) shows judgment — the trait interviews probe hardest.'],
    ],
  },
  {
    slug: 'dental-assistant',
    role: 'Dental Assistant',
    description:
      'A dental assistant resume example with radiology certification, chairside volume and sterilization compliance — the checkable credentials dental offices screen for first.',
    person: {
      name: 'Marisol Vega',
      title: 'Registered Dental Assistant',
      location: 'San Antonio, TX',
      summary:
        'RDA with 5 years chairside across general and pediatric practices. Supports 2 doctors at 10-14 patients a day, holds Texas RDA and nitrous monitoring certifications, and passed 3 consecutive OSHA/HIPAA audits as sterilization lead.',
      experience: [
        {
          role: 'Registered Dental Assistant',
          company: 'Alamo Family Dental',
          dates: '2022 – Present',
          bullets: [
            'Chairside for 2 doctors at 10-14 patients daily: four-handed dentistry, digital X-rays (Dexis), impressions and provisional crowns',
            'Sterilization lead: passed 3 consecutive OSHA/HIPAA audits with zero findings; retrained 4 assistants on instrument-processing flow',
            'Cut average room-turnover time from 9 to 6 minutes, adding 2 bookable slots a day per operatory',
          ],
        },
        {
          role: 'Dental Assistant',
          company: 'Little Smiles Pediatric Dentistry',
          dates: '2020 – 2022',
          bullets: [
            'Assisted pediatric procedures including sealants and stainless-steel crowns for a 30-patient/day practice',
            'Maintained 98% chart-note same-day completion in Dentrix across a 4-assistant team',
          ],
        },
      ],
      skills: ['Four-handed chairside assisting', 'Digital radiography (Dexis, RVG)', 'Sterilization & OSHA compliance', 'Dentrix & Eaglesoft charting', 'Impressions & provisional crowns', 'Nitrous oxide monitoring (certified)'],
      education: 'RDA — Texas State Board of Dental Examiners, 2020 · Dental Assisting Certificate, San Antonio College, 2020 · Nitrous Oxide Monitoring Certification, 2021',
    },
    tips: [
      ['Certifications are the first filter', 'State registration, radiology and nitrous certifications with years — offices verify these against the state board before calling, so make them findable in seconds.'],
      ['Show volume and the software', 'Patients per day, doctors supported, and the exact systems (Dentrix, Dexis) tell an office manager you can slot into their schedule without a training month.'],
      ['Compliance wins are quantifiable', 'Clean audit streaks and turnover-time improvements are rare, concrete numbers on assistant resumes — they signal you run the back office, not just sit in it.'],
    ],
  },
  {
    slug: 'security-guard',
    role: 'Security Guard',
    description:
      'A security guard resume example with license class, incident-response record and post types — the verifiable credentials and calm-under-pressure evidence sites actually hire on.',
    person: {
      name: 'Andre Whitfield',
      title: 'Security Officer',
      location: 'Atlanta, GA',
      summary:
        'Licensed security officer with 6 years across corporate lobbies, distribution yards and event posts. Clean incident-report record over 400+ written reports, de-escalation trained, and trusted with new-guard site onboarding.',
      experience: [
        {
          role: 'Security Officer',
          company: 'Sentinel Protective Services',
          dates: '2021 – Present',
          bullets: [
            'Anchor officer for a 22-story corporate tower: access control for 2,000+ daily entries, visitor management and camera monitoring across 60+ feeds',
            'Wrote 400+ incident reports with zero returned for correction; reports used twice as primary documentation in successful insurance claims',
            'De-escalated 30+ confrontations without physical intervention; completed employer\u2019s verbal de-escalation and first-aid/CPR certifications',
          ],
        },
        {
          role: 'Security Guard',
          company: 'Peach State Event Security',
          dates: '2019 – 2021',
          bullets: [
            'Worked crowd and gate posts for 100+ events up to 15,000 attendees; certified for wand and bag-check screening',
            'Selected to train 12 new guards on post orders, radio protocol and report writing',
          ],
        },
      ],
      skills: ['Access control & visitor management', 'CCTV monitoring (60+ camera sites)', 'Incident reporting & documentation', 'Verbal de-escalation (certified)', 'First aid / CPR / AED (current)', 'Radio & emergency protocols'],
      education: 'Georgia Security Guard License (unarmed), renewed 2025 · First Aid/CPR/AED — American Red Cross, current · De-escalation Certification, 2022',
    },
    tips: [
      ['License class and state, up top', 'Armed vs unarmed, state and renewal year are the first three things a security employer checks — put them in the credentials line, not buried in a bullet.'],
      ['Reports are your work product', 'A clean record across hundreds of incident reports — especially reports later used in claims — proves reliability better than any adjective about being "detail-oriented".'],
      ['De-escalation beats force', '"30+ confrontations resolved without physical intervention" is the number modern sites hire on; pair it with the certification so it reads as training, not luck.'],
    ],
  },
  {
    slug: 'bartender',
    role: 'Bartender',
    description:
      'A bartender resume example with drinks-per-hour volume, check averages and inventory results — turning bar work into the sales and cost numbers bar managers actually compare.',
    person: {
      name: 'Jack Moreau',
      title: 'Bartender',
      location: 'New Orleans, LA',
      summary:
        'Bartender with 7 years from high-volume sports bars to a craft cocktail program. Runs a 3-deep Friday bar at 120+ drinks an hour, built a seasonal menu that lifted cocktail sales 22%, and cut pour cost 2 points as inventory lead.',
      experience: [
        {
          role: 'Lead Bartender',
          company: 'The Cane & Copper',
          dates: '2022 – Present',
          bullets: [
            'Run service for a 16-seat craft bar plus service well at 120+ drinks/hour on peak nights with a $62 average check',
            'Co-authored two seasonal cocktail menus; signature list lifted cocktail share of sales 22% year over year',
            'Inventory lead: weekly counts and par rebuilds cut pour cost from 24% to 22% while sales grew',
          ],
        },
        {
          role: 'Bartender',
          company: 'Crescent City Taphouse',
          dates: '2018 – 2022',
          bullets: [
            'Poured 3-deep game-day crowds of 300+ guests with two bartenders; zero register variance across 4 years',
            'Trained 8 new bartenders on builds, POS and responsible-service protocol',
          ],
        },
      ],
      skills: ['High-volume service (120+ drinks/hr)', 'Classic & craft cocktail builds', 'Inventory & pour-cost management', 'POS (Toast, Micros)', 'Responsible alcohol service (certified)', 'Menu development & costing'],
      education: 'Louisiana Responsible Vendor Permit, current · BarSmarts Advanced, 2021',
    },
    tips: [
      ['Volume and check average first', 'Drinks per hour, seats, and check average are how bar managers size you up — a "3-deep, 120 drinks/hour" bartender is a different hire than a slow-lounge one, so say which you are.'],
      ['Pour cost is the manager\u2019s number', 'If you\u2019ve touched inventory, show the before/after pour cost. Two points on a busy bar is real money and instantly separates you from pure service candidates.'],
      ['Keep the permit current and visible', 'State responsible-service permits are a legal box the manager must tick — list yours with "current" so scheduling you is frictionless.'],
    ],
  },
  {
    slug: 'devops-engineer',
    role: 'DevOps Engineer',
    description:
      'A DevOps engineer resume example with deploy frequency, MTTR and cost-reduction numbers — the reliability metrics platform teams actually screen for, not a tool list.',
    person: {
      name: 'Tomas Lindgren',
      title: 'DevOps Engineer',
      location: 'Denver, CO',
      summary:
        'DevOps engineer with 7 years building CI/CD and cloud infrastructure for SaaS teams. Took a 40-service platform from weekly to daily deploys, cut MTTR from 90 to 25 minutes, and reduced AWS spend 27% without capacity loss.',
      experience: [
        {
          role: 'Senior DevOps Engineer',
          company: 'Skyline Software',
          dates: '2022 – Present',
          bullets: [
            'Own CI/CD for 40 microservices (GitHub Actions, ArgoCD on EKS); moved the platform from weekly release trains to 15+ daily deploys with automated rollback',
            'Cut MTTR from 90 to 25 minutes by rebuilding alerting on SLOs (Prometheus/Grafana) and writing runbooks for the 12 most-paged scenarios',
            'Reduced AWS spend 27% ($41k/month) via rightsizing, Savings Plans and moving batch workloads to spot instances',
          ],
        },
        {
          role: 'DevOps Engineer',
          company: 'Bitfield Systems',
          dates: '2018 – 2022',
          bullets: [
            'Migrated 25 services from EC2/Chef to Kubernetes with Terraform-managed infrastructure, cutting environment-provision time from 2 days to 40 minutes',
            'Introduced trunk-based development and preview environments, halving average PR-to-production lead time',
          ],
        },
      ],
      skills: ['Kubernetes (EKS) & Docker', 'Terraform & infrastructure as code', 'CI/CD (GitHub Actions, ArgoCD)', 'Prometheus/Grafana & SLO alerting', 'AWS cost optimization', 'Incident response & runbooks'],
      education: 'B.S. Computer Science — Colorado State University, 2018 · CKA (Certified Kubernetes Administrator), 2023',
    },
    tips: [
      ['Reliability numbers beat tool lists', 'Every DevOps resume lists Kubernetes and Terraform; almost none show deploy frequency, MTTR or lead time moving. Those DORA-style numbers are what platform leads actually compare.'],
      ['Cost savings are a hiring trigger', 'A concrete "$41k/month, 27%" with the mechanism (rightsizing, spot) is often the single line that gets the interview — infra cost is a budget-line pain every engineering VP feels.'],
      ['Tie each tool to an outcome', '"Terraform-managed migration that cut provision time from 2 days to 40 minutes" proves fluency better than a skills-section keyword ever can.'],
    ],
  },
  {
    slug: 'ux-designer',
    role: 'UX Designer',
    description:
      'A UX designer resume example with task-success, conversion and research evidence — the outcome numbers hiring managers check before they ever open the portfolio.',
    person: {
      name: 'Amara Diallo',
      title: 'UX Designer',
      location: 'Chicago, IL',
      summary:
        'UX designer with 6 years across B2B SaaS and e-commerce. Redesigned an onboarding flow that lifted activation 31%, runs 6-8 usability sessions per quarter, and ships design-system components used by 4 product teams.',
      experience: [
        {
          role: 'Senior UX Designer',
          company: 'Fieldstone Commerce',
          dates: '2022 – Present',
          bullets: [
            'Redesigned merchant onboarding from 11 steps to 6; activation rose 31% and support tickets on setup fell 44% within one quarter',
            'Run 6-8 moderated usability sessions per quarter; findings drove a checkout revision that cut cart abandonment 9%',
            'Built and documented 23 design-system components (Figma) adopted by 4 product teams, cutting design-to-dev handoff questions by half',
          ],
        },
        {
          role: 'UX Designer',
          company: 'Meridian Software',
          dates: '2019 – 2022',
          bullets: [
            'Owned UX for a B2B analytics dashboard used by 800 accounts; task-success rate on the top 5 workflows rose from 62% to 88% across three iterations',
            'Introduced lightweight research ops (participant panel, session templates) that took study setup from 2 weeks to 3 days',
          ],
        },
      ],
      skills: ['End-to-end product design (Figma)', 'Usability testing & research ops', 'Design systems & documentation', 'Prototyping (Figma, Principle)', 'A/B test design with PMs', 'Accessibility (WCAG 2.1 AA)'],
      education: 'B.F.A. Design — University of Illinois Chicago, 2019 · Nielsen Norman Group UX Certification, 2021',
    },
    tips: [
      ['Outcomes get the portfolio opened', 'Hiring managers skim the resume to decide whether to open the portfolio — activation, task-success and abandonment numbers are what earn the click, not tool names.'],
      ['Show research as a habit, not a phase', '"6-8 sessions per quarter" signals continuous discovery; a single "conducted user research" bullet reads as a one-off class project.'],
      ['Design systems prove collaboration', 'Component counts with adoption ("used by 4 teams") demonstrate you work at organizational scale — the difference between senior and mid in most rubrics.'],
    ],
  },
  {
    slug: 'paralegal',
    role: 'Paralegal',
    description:
      'A paralegal resume example with caseload volume, filing accuracy and billable support numbers — plus the practice-area specifics law firms filter on first.',
    person: {
      name: 'Rachel Donnelly',
      title: 'Litigation Paralegal',
      location: 'Philadelphia, PA',
      summary:
        'Litigation paralegal with 8 years in insurance defense and commercial litigation. Manages 40-50 active matters, e-files in state and federal courts with zero rejected filings in 3 years, and supports 4 attorneys through discovery and trial.',
      experience: [
        {
          role: 'Senior Litigation Paralegal',
          company: 'Harmon & Price LLP',
          dates: '2021 – Present',
          bullets: [
            'Manage 40-50 active insurance-defense matters for 4 attorneys: pleadings, discovery responses, deposition scheduling and trial binders',
            'E-file in PA state courts and ED Pa. federal court with zero rejected filings in 3 years; maintain the firm\u2019s filing-deadline calendar across 200+ dates/quarter',
            'Built Relativity review workflows for document productions up to 120k documents; cut first-pass review time 30% with search-term reports',
          ],
        },
        {
          role: 'Paralegal',
          company: 'Keystone Legal Group',
          dates: '2016 – 2021',
          bullets: [
            'Supported commercial litigation and subrogation matters from intake through settlement; drafted discovery, subpoenas and settlement statements',
            'Averaged 130+ billable support hours monthly with under 2% write-off rate',
          ],
        },
      ],
      skills: ['Civil litigation support (state & federal)', 'E-filing (PACFile, ECF)', 'E-discovery (Relativity)', 'Deadline & docket management', 'Legal drafting (pleadings, discovery)', 'Trial preparation & exhibits'],
      education: 'Paralegal Certificate (ABA-approved) — Villanova University, 2016 · B.A. Political Science — Temple University, 2015 · Notary Public, PA',
    },
    tips: [
      ['Practice area is the first filter', 'Firms hire "insurance defense paralegal", not "paralegal" — name your practice areas in the title and summary so the recruiter\u2019s first scan matches the posting.'],
      ['Zero-error records are gold', 'Rejected filings and blown deadlines are the risks firms hire against. "Zero rejected filings in 3 years" plus a calendar-volume number is the strongest reliability evidence a paralegal can print.'],
      ['Billables show your economics', 'Billable support hours and write-off rates tell the hiring partner you understand you\u2019re a revenue role — a framing most paralegal resumes miss entirely.'],
    ],
  },
  {
    slug: 'construction-project-manager',
    role: 'Construction Project Manager',
    description:
      'A construction project manager resume example with contract values, schedule and budget variance, and safety record — the numbers GCs and owners verify on every hire.',
    person: {
      name: 'Victor Salazar',
      title: 'Construction Project Manager',
      location: 'Phoenix, AZ',
      summary:
        'Construction PM with 11 years delivering commercial ground-up and TI projects to $28M. Closed the last six projects at an average 1.8% under budget with zero lost-time incidents across 400k+ labor hours.',
      experience: [
        {
          role: 'Project Manager',
          company: 'Sonoran Builders',
          dates: '2019 – Present',
          bullets: [
            'Deliver commercial ground-up projects of $8M-$28M contract value: a 92k sq ft distribution facility finished 3 weeks early and 1.4% under budget',
            'Closed the last six projects at an average 1.8% under budget; kept owner change-order rate below 4% of contract value through preconstruction scope reviews',
            'Zero lost-time incidents across 400k+ labor hours; run weekly toolbox talks and subcontractor safety prequalification',
          ],
        },
        {
          role: 'Assistant Project Manager',
          company: 'Redrock Commercial Construction',
          dates: '2014 – 2019',
          bullets: [
            'Managed submittals, RFIs and pay applications for TI projects up to $6M; cut average RFI turnaround from 9 to 4 days',
            'Coordinated 20+ subcontractors per project with look-ahead schedules in Procore and MS Project',
          ],
        },
      ],
      skills: ['Ground-up & TI delivery to $28M', 'Budgeting & cost control', 'Scheduling (MS Project, look-aheads)', 'Procore & submittal/RFI management', 'Subcontractor management', 'OSHA 30 & site safety programs'],
      education: 'B.S. Construction Management — Arizona State University, 2014 · OSHA 30, current · CPR/First Aid, current',
    },
    tips: [
      ['Dollar values size you instantly', 'Contract values are how construction hiring reads seniority — "$8M-$28M ground-up" places you on the org chart before the second bullet. Always give the range.'],
      ['Variance numbers beat "on time and on budget"', 'Everyone claims on-time/on-budget; "average 1.8% under across six projects" and "change orders below 4%" are auditable and therefore believed.'],
      ['Safety record is a pass/fail check', 'EMR and lost-time history get verified in prequalification. A zero-LTI streak with the labor-hour denominator is the strongest line a field-side PM can carry.'],
    ],
  },
  {
    slug: 'pharmacy-technician',
    role: 'Pharmacy Technician',
    description:
      'A pharmacy technician resume example with certification, scripts-per-day volume and accuracy record — the checkable credentials retail and hospital pharmacies screen on.',
    person: {
      name: 'Kayla Nguyen',
      title: 'Certified Pharmacy Technician (CPhT)',
      location: 'Portland, OR',
      summary:
        'CPhT with 6 years across high-volume retail and hospital inpatient pharmacy. Fills 350+ scripts per shift at 99.9% scan accuracy, IV-certified with cleanroom experience, and trains new technicians on workflow and insurance resolution.',
      experience: [
        {
          role: 'Pharmacy Technician II',
          company: 'Providence Medical Center (Inpatient Pharmacy)',
          dates: '2022 – Present',
          bullets: [
            'Prepare unit-dose and IV admixtures (USP 797/800 cleanroom) for a 320-bed hospital; zero compounding errors across 3 annual competency audits',
            'Manage automated dispensing cabinet (Pyxis) restocks and discrepancies across 14 units, resolving 95% of discrepancies same-shift',
            'Train 5 new technicians on aseptic technique, Epic Willow workflow and controlled-substance documentation',
          ],
        },
        {
          role: 'Certified Pharmacy Technician',
          company: 'Rite Aid',
          dates: '2018 – 2022',
          bullets: [
            'Filled 350+ prescriptions per shift at 99.9% scan-verification accuracy in a store ranked top-10 in the district for volume',
            'Resolved 30+ insurance rejections daily (prior auths, DUR overrides), cutting patient wait-time complaints 40%',
          ],
        },
      ],
      skills: ['Sterile compounding (USP 797/800)', 'High-volume retail fill (350+/shift)', 'Pyxis & Epic Willow', 'Insurance adjudication & prior auths', 'Controlled-substance handling', 'Inventory & expiry management'],
      education: 'CPhT — PTCB, 2018 (current) · Oregon Board of Pharmacy license, current · Sterile Compounding Certificate, 2022',
    },
    tips: [
      ['Certification and license lead', 'PTCB certification and state license are verified before any interview — put both with "current" status in the title line and credentials section, not the bottom.'],
      ['Volume plus accuracy is the pairing', '350 scripts a shift means nothing without the 99.9%; accuracy means nothing at 40 scripts. Print both numbers together — pharmacists-in-charge read them as one.'],
      ['Setting-specific skills transfer poorly — name yours', 'Retail (insurance, patient-facing) and hospital (IV, Pyxis, unit-dose) are different jobs. List the systems and standards of the setting you\u2019re applying to, with certificates where they exist.'],
    ],
  },
]

function examplePage(p) {
  const canonical = `${SITE}/examples/${p.slug}/`
  const per = p.person
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${p.role} resume example`,
    description: p.description,
    url: canonical,
    mainEntityOfPage: canonical,
    dateModified: new Date().toISOString().slice(0, 10),
    author: { '@type': 'Organization', name: 'RezUp', url: SITE },
    publisher: { '@type': 'Organization', name: 'RezUp', url: SITE },
  }
  const ei = EXAMPLES.findIndex((e) => e.slug === p.slug)
  const related = [1, 2, 3]
    .map((d) => EXAMPLES[(ei + d) % EXAMPLES.length])
    .map((e) => ({ path: `/examples/${e.slug}/`, title: `${e.role} resume example` }))
  const guideLinks = [
    'resume-summary-examples',
    'resume-bullet-points',
    'ats-friendly-resume',
    'tailor-resume-to-job',
  ]
    .map((slug) => GUIDES.find((g) => g.path.endsWith(`/${slug}`)))
    .filter(Boolean)
    .map((g) => ({ path: `${g.path}/`, title: g.h1 }))
    .concat([{ path: '/guides/', title: 'All resume guides' }])
  const doc = `
<div class="exdoc" aria-label="Example resume">
<p class="exname">${esc(per.name)}</p>
<p class="exmeta">${esc(per.title)} · ${esc(per.location)}</p>
<h3>Summary</h3>
<p>${esc(per.summary)}</p>
<h3>Experience</h3>
${per.experience
  .map(
    (x) => `<p class="exrole">${esc(x.role)} — ${esc(x.company)} <span>${esc(x.dates)}</span></p>
<ul>${x.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
  )
  .join('\n')}
<h3>Skills</h3>
<p>${per.skills.map(esc).join(' · ')}</p>
<h3>Education</h3>
<p>${esc(per.education)}</p>
</div>`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>${esc(p.role)} Resume Example (2026) — RezUp</title>
<meta name="description" content="${esc(p.description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="RezUp" />
<meta property="og:title" content="${esc(p.role)} Resume Example (2026) — RezUp" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og2.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd([{ name: 'Resume examples', path: '/examples/' }, { name: `${p.role} resume example`, path: `/examples/${p.slug}` }]))}</script>
<style>${CSS}
.exdoc{border:1px solid var(--border);border-radius:10px;padding:1.5rem;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.06);margin:1.5rem 0}
.exdoc .exname{font-size:1.3rem;font-weight:700;margin:0}
.exdoc .exmeta{color:var(--muted);margin:.15rem 0 1rem;font-size:.9rem}
.exdoc h3{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--primary);border-bottom:1px solid var(--border);padding-bottom:.25rem;margin:1.25rem 0 .5rem}
.exdoc .exrole{font-weight:600;margin:.75rem 0 .25rem;display:flex;flex-wrap:wrap;gap:.25rem .75rem;justify-content:space-between}
.exdoc .exrole span{color:var(--muted);font-weight:400;font-size:.85rem}
.exdoc ul{margin:.25rem 0 .5rem 1.1rem;padding:0}
.exdoc li{margin:.25rem 0}
</style>
${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />RezUp</a>
${NAV_HTML}
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(p.role)} resume example</h1>
<p class="lede">${esc(p.description)}</p>
${doc}
<p style="color:var(--muted);font-size:.8rem">Fictional example for illustration — names, employers and numbers are invented, but every bullet follows the honest formula: action + scope + verifiable result. Never copy claims you can't defend in an interview.</p>
${p.tips.map(([h, t]) => `<h2 style="margin-top:1.75rem;font-size:1.2rem">${esc(h)}</h2>\n<p>${esc(t)}</p>`).join('\n')}
<div class="cta">
<p>${FREE_MODE ? 'Build yours in the same clean, ATS-safe layout — RezUp is free during beta: 25 templates, AI rewrites of your real experience, ATS match score and PDF/DOCX downloads.' : 'Build yours in the same clean, ATS-safe layout — free to try, one-time $9.99 download, no subscription.'}</p>
<a class="btn" href="/builder?example=${p.slug}">Edit this example in the builder</a> &nbsp; <a class="btn" href="/ats-checker" style="background:transparent;color:var(--primary);border:1px solid var(--border)">Check my ATS score</a>
</div>
<div class="related">
<h2>More examples</h2>
<ul>
${related.map((r) => `<li><a href="${r.path}">${esc(r.title)}</a></li>`).join('\n')}
</ul>
<h2>How to write yours</h2>
<ul>
${guideLinks.map((r) => `<li><a href="${r.path}">${esc(r.title)}</a></li>`).join('\n')}
</ul>
</div>
</main>
${siteFooter()}
</body>
</html>`
}

// Reader-intent grouping for the guides hub (34 flat links are unscannable).
// Any guide missing here still renders, under "More resume guides".
const GUIDE_GROUPS = [
  ['Start here: how resumes get read', ['what-is-an-ats', 'ats-friendly-resume', 'best-resume-format', 'best-resume-fonts', 'two-column-resume-ats', 'resume-file-format', 'how-long-should-a-resume-be', 'resume-vs-cv']],
  ['Writing the content', ['resume-summary-examples', 'resume-bullet-points', 'resume-action-verbs', 'resume-keywords', 'skills-for-resume', 'how-to-list-certifications', 'resume-objective-vs-summary']],
  ['Tailoring to a job', ['tailor-resume-to-job', 'remote-job-resume', 'multiple-positions-same-company']],
  ['Your situation', ['resume-with-no-experience', 'new-grad-resume', 'internship-resume', 'career-change-resume', 'employment-gap-resume', 'resume-for-teens', 'resume-summary-for-freshers', 'volunteer-work-on-resume']],
  ['What to include — and leave off', ['references-on-resume', 'hobbies-and-interests-on-resume', 'photo-on-resume', 'how-far-back-should-a-resume-go', 'common-resume-mistakes']],
  ['Beyond the resume', ['how-to-write-a-cover-letter', 'how-to-email-a-resume', 'linkedin-vs-resume', 'resume-vs-portfolio', 'thank-you-email-after-interview', 'salary-expectations-in-interviews']],
]

function groupedGuideItems() {
  const item = (g, group) => ({
    href: `${g.path}/`,
    label: g.title.split(' — ')[0].split(' (')[0],
    blurb: `${g.description.split('. ')[0].replace(/\.$/, '')}.`,
    group,
  })
  const bySlug = new Map(GUIDES.map((g) => [g.path.split('/').pop(), g]))
  const items = []
  for (const [group, slugs] of GUIDE_GROUPS) {
    for (const slug of slugs) {
      const g = bySlug.get(slug)
      if (!g) throw new Error(`GUIDE_GROUPS references unknown guide: ${slug}`)
      bySlug.delete(slug)
      items.push(item(g, group))
    }
  }
  for (const g of bySlug.values()) items.push(item(g, 'More resume guides'))
  return items
}

const EXAMPLE_GROUPS = [
  ['Tech & data', ['software-engineer', 'devops-engineer', 'data-analyst', 'product-manager', 'ux-designer', 'mechanical-engineer']],
  ['Business & finance', ['marketing-manager', 'project-manager', 'operations-manager', 'accountant', 'financial-analyst', 'human-resources', 'sales-representative', 'paralegal']],
  ['Healthcare & education', ['registered-nurse', 'medical-assistant', 'dental-assistant', 'pharmacy-technician', 'teacher']],
  ['Trades & transport', ['electrician', 'construction-project-manager', 'truck-driver', 'warehouse-worker']],
  ['Customer-facing & office', ['customer-service', 'retail-associate', 'restaurant-server', 'bartender', 'security-guard', 'administrative-assistant', 'graphic-designer']],
]

const EXAMPLE_THUMB_SLUGS = ['modern', 'classic', 'minimal', 'engineer', 'elegant', 'compact']
let exampleThumbIdx = 0

function groupedExampleItems() {
  const item = (e, group) => ({
    href: `/examples/${e.slug}/`,
    label: `${e.role} resume example`,
    blurb: `${e.description.split(' — ')[0].replace(/\.$/, '')}.`,
    thumb: templateThumbSvg(EXAMPLE_THUMB_SLUGS[exampleThumbIdx++ % EXAMPLE_THUMB_SLUGS.length], 56),
    group,
  })
  const bySlug = new Map(EXAMPLES.map((e) => [e.slug, e]))
  const items = []
  for (const [group, slugs] of EXAMPLE_GROUPS) {
    for (const slug of slugs) {
      const e = bySlug.get(slug)
      if (!e) throw new Error(`EXAMPLE_GROUPS references unknown example: ${slug}`)
      bySlug.delete(slug)
      items.push(item(e, group))
    }
  }
  for (const e of bySlug.values()) items.push(item(e, 'More roles'))
  return items
}

// Mutually exclusive style groups, mirroring the gallery filter chips
// (banded wins over serif; minimal = no divider, no band, sans body).
const TEMPLATE_GROUPS = [
  ['Banded headings', ['horizon', 'metro', 'scholar', 'ink', 'ruby']],
  ['Serif', ['classic', 'executive', 'elegant', 'ivy', 'corporate', 'atlas', 'quartz']],
  ['Minimal', ['minimal', 'startup', 'coral']],
  ['Modern sans', ['modern', 'compact', 'bold', 'engineer', 'slate', 'prairie', 'cobalt']],
]

function groupedTemplateItems() {
  const item = (t, group) => ({
    href: `${t.path}/`,
    label: `${t.name} resume template`,
    blurb: '',
    thumb: templateThumbSvg(t.path.split('/').pop(), 72),
    group,
  })
  const bySlug = new Map(TEMPLATE_PAGES.map((t) => [t.path.split('/').pop(), t]))
  const items = []
  for (const [group, slugs] of TEMPLATE_GROUPS) {
    for (const slug of slugs) {
      const t = bySlug.get(slug)
      if (!t) throw new Error(`TEMPLATE_GROUPS references unknown template: ${slug}`)
      bySlug.delete(slug)
      items.push(item(t, group))
    }
  }
  for (const t of bySlug.values()) items.push(item(t, 'More templates'))
  return items
}

// Curated hub groups (use-case first), each template appears exactly once.
const TEMPLATE_CURATED = [
  [
    'Recruiter picks',
    'Safe, familiar layouts that read instantly — strong defaults for any industry.',
    ['classic', 'modern', 'minimal', 'executive', 'ivy'],
  ],
  [
    'Tech & startup roles',
    'Contemporary, engineering-flavored looks for product, dev and startup applications.',
    ['engineer', 'circuit', 'startup', 'slate', 'cobalt', 'metro', 'bold'],
  ],
  [
    'High-density for experienced candidates',
    'Layouts tuned to fit long careers onto one page without shrinking below readable.',
    ['compact', 'ledger', 'sidebar', 'atlas', 'corporate', 'scholar', 'horizon'],
  ],
  [
    'Distinctive accents',
    'A touch more personality — still strictly single-column and ATS-safe.',
    ['elegant', 'ruby', 'ink', 'coral', 'quartz', 'prairie'],
  ],
]

const TPL_HUB_CSS = `
.tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.25rem;margin-top:1rem}
.tpl-card{border:1px solid var(--border);background:var(--card);border-radius:var(--radius);padding:1rem;display:flex;flex-direction:column;transition:box-shadow .2s cubic-bezier(0.165,0.84,0.44,1),transform .2s cubic-bezier(0.165,0.84,0.44,1)}
.tpl-card:hover{box-shadow:0 8px 24px rgb(0 0 0/.08);transform:translateY(-2px)}
.tpl-card svg{width:100%;height:auto;display:block}
.tpl-card h3{margin:.75rem 0 .25rem;font-size:1rem}
.tpl-card p{margin:0;color:var(--muted);font-size:.85rem;flex:1}
.tpl-cta{display:inline-flex;align-items:center;min-height:44px;margin-top:.25rem;font-weight:500;font-size:.9rem}
.tpl-group-lede{color:var(--muted);margin:-.25rem 0 0;font-size:.95rem}
`

/** Card-grid body for the /templates/ hub: big previews + direct builder CTA. */
function templateCardsHtml() {
  const bySlug = new Map(TEMPLATE_PAGES.map((t) => [t.path.split('/').pop(), t]))
  const seen = new Set()
  const sections = TEMPLATE_CURATED.map(([group, tagline, slugs]) => {
    const cards = slugs
      .map((slug) => {
        const t = bySlug.get(slug)
        if (!t) throw new Error(`TEMPLATE_CURATED references unknown template: ${slug}`)
        seen.add(slug)
        return `<div class="tpl-card">
<a href="${t.path}/" aria-label="${esc(t.name)} resume template details" style="line-height:0">${templateThumbSvg(slug, '100%')}</a>
<h3><a href="${t.path}/" style="color:inherit;text-decoration:none">${esc(t.name)}</a></h3>
<p>${esc(t.description.split(' — ')[0].replace(/\.$/, ''))}.</p>
<a class="tpl-cta" href="/builder?template=${slug}">Use this template →</a>
</div>`
      })
      .join('\n')
    return `<h2 style="margin-top:2.5rem">${esc(group)}</h2>\n<p class="tpl-group-lede">${esc(tagline)}</p>\n<div class="tpl-grid">\n${cards}\n</div>`
  })
  const missing = TEMPLATE_PAGES.filter((t) => !seen.has(t.path.split('/').pop()))
  if (missing.length) throw new Error(`TEMPLATE_CURATED missing templates: ${missing.map((t) => t.name).join(', ')}`)
  return sections.join('\n')
}

// Grouped by what the reader is escaping from / comparing against.
const VS_GROUPS = [
  ['Trial-to-subscription builders', ['zety', 'livecareer', 'resume-genius']],
  ['Freemium resume builders', ['resume-io', 'kickresume', 'novoresume', 'enhancv', 'flowcv']],
  ['AI & ATS-optimization tools', ['rezi', 'teal', 'jobscan', 'resume-worded']],
]

function groupedVsItems() {
  const item = (p, group) => ({
    href: `${p.path}/`,
    label: p.name,
    blurb: `${p.description.split('. ')[0].replace(/\.$/, '')}.`,
    group,
  })
  const bySlug = new Map(
    PAGES.filter((p) => p.path.startsWith('/vs/')).map((p) => [p.path.split('/').pop(), p])
  )
  const items = []
  for (const [group, slugs] of VS_GROUPS) {
    for (const slug of slugs) {
      const p = bySlug.get(slug)
      if (!p) throw new Error(`VS_GROUPS references unknown comparison: ${slug}`)
      bySlug.delete(slug)
      items.push(item(p, group))
    }
  }
  for (const p of bySlug.values()) items.push(item(p, 'More comparisons'))
  return items
}

const HUBS = [
  {
    pathname: '/vs/',
    title: 'RezUp vs Other Resume Builders — First-Hand Comparisons',
    description:
      'How RezUp compares to Zety, Resume.io, Rezi, Teal, Kickresume and other resume builders — based on our own first-hand tests, with pricing and free-tier limits documented.',
    h1: 'RezUp vs other resume builders',
    intro:
      'We sign up for competitors and run their full flows ourselves — build a resume, use the AI, check the ATS score, try to export — then document what the free tier actually allows and what the subscription really costs. No secondhand claims.',
    items: groupedVsItems(),
  },
  {
    pathname: '/guides/',
    title: 'Resume Guides — Practical Advice for 2026 | RezUp',
    description:
      'Free resume guides: ATS formatting, keywords, summaries, action verbs, employment gaps, tailoring to job descriptions, remote-job resumes and more.',
    h1: 'Resume guides',
    intro:
      'Practical, honest resume advice — no fluff, no fabricated-metrics tricks. Each guide is written to be actionable in minutes and pairs with our free in-browser ATS checker.',
    items: groupedGuideItems(),
    filterPlaceholder: 'Search guides \u2014 ATS, keywords, gap, cover letter\u2026',
    filterEmpty: 'No guides match that search \u2014 try a broader word like \u201cATS\u201d or \u201csummary\u201d.',
  },
  {
    pathname: '/examples/',
    title: 'Resume Examples by Role (2026) — RezUp',
    description:
      '30 complete, honest resume examples by role: software engineer, DevOps, UX designer, nurse, paralegal, pharmacy technician, construction PM and more — with tips to adapt each one.',
    h1: 'Resume examples by role',
    intro:
      'Full example resumes — summary, quantified bullets, skills, education — written the way we coach: every claim scoped, measurable and defensible in an interview. Pick your role, then build yours in the same ATS-safe layout.',
    items: groupedExampleItems(),
    filterPlaceholder: 'Search by job title — nurse, engineer, sales…',
  },
  {
    pathname: '/templates/',
    title: 'ATS-Friendly Resume Templates (Free) — RezUp',
    description:
      'All 25 RezUp resume templates: single-column, ATS-safe layouts with real text-based PDF and DOCX export. Fully included free during beta — no account, no subscription.',
    h1: 'ATS-friendly resume templates',
    intro:
      'Every RezUp template follows one rule: strictly single-column real text, the layout ATS parsers read most reliably. Pick a look below — you can switch templates any time without retyping.',
    items: groupedTemplateItems(),
    bodyHtml: templateCardsHtml(),
    extraCss: TPL_HUB_CSS,
    mainStyle: 'max-width:72rem',
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

for (const p of EXAMPLES) {
  const dir = path.join(OUT_DIR, `examples/${p.slug}`)
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), examplePage(p))
  console.log(`built /examples/${p.slug}/index.html`)
}
// Machine-readable example data so the builder can load one via ?example=<slug>
writeFileSync(
  path.join(OUT_DIR, 'examples/examples.json'),
  JSON.stringify(
    // Emit in EXAMPLE_GROUPS order so the builder picker's optgroups
    // appear in the same sector order as the /examples/ hub.
    EXAMPLE_GROUPS.flatMap(([sector, slugs]) =>
      slugs.map((slug) => {
        const e = EXAMPLES.find((x) => x.slug === slug)
        return { slug: e.slug, role: e.role, sector, person: e.person }
      })
    ).concat(
      EXAMPLES.filter((e) => !EXAMPLE_GROUPS.some(([, slugs]) => slugs.includes(e.slug))).map(
        (e) => ({ slug: e.slug, role: e.role, sector: 'More roles', person: e.person })
      )
    )
  )
)
console.log('built /examples/examples.json')

for (const p of TEMPLATE_PAGES) {
  const dir = path.join(OUT_DIR, p.path.slice(1))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), templatePage(p))
  console.log(`built ${p.path}/index.html`)
}

// ---- Standalone /pricing/ page: plan cards + full comparison + pricing FAQ ----
const PRICING_FAQ = [
  [
    'Is it really one payment?',
    'Yes. $9.99 (or $19.99 for the Career Bundle) is charged exactly once. There is no plan to cancel because there is no plan — we never store your card for recurring billing. During the beta, everything is free.',
  ],
  [
    'What is free before I pay anything?',
    'The full editor, all 22 ATS-safe templates, the live preview, the ATS match score against any pasted job description, and 5 AI rewrites. You only ever pay to download and for unlimited AI.',
  ],
  [
    'What does the Career Bundle add?',
    'Everything in Single Resume, plus AI cover letters tailored to each job posting, an interview prep brief (likely questions, STAR stories, gaps to expect), and all future features.',
  ],
  [
    'Is there a refund policy?',
    'Yes — a 7-day money-back guarantee. Email support@zalize.com and we refund the one-time payment, no questions asked.',
  ],
  [
    'Why not a subscription like everyone else?',
    'A resume is something you need for a few weeks, a couple of times a decade. Subscription builders profit from you forgetting to cancel; we would rather charge a fair price once.',
  ],
]

function pricingPage() {
  const canonical = `${SITE}/pricing/`
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRICING_FAQ.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
  const planCard = (name, price, tagline, features, dark) => `
<div style="border:1px solid ${dark ? 'transparent' : 'var(--border)'};border-radius:var(--radius);padding:1.5rem;${dark ? 'background:#0a0a0a;color:#fff;box-shadow:0 12px 32px rgb(0 0 0/.18)' : 'background:var(--card)'}">
<p style="margin:0;display:flex;justify-content:space-between;align-items:center"><strong>${name}</strong>${dark ? '<span style="background:#047857;color:#fff;border-radius:999px;padding:.15rem .6rem;font-size:.75rem;font-weight:600">Best value</span>' : '<span style="border:1px solid var(--border);border-radius:999px;padding:.15rem .6rem;font-size:.75rem">One-time</span>'}</p>
<p style="margin:.75rem 0 0;font-size:2.75rem;font-weight:700;letter-spacing:-.02em;line-height:1">${price} <span style="font-size:.85rem;font-weight:400;${dark ? 'color:#a3a3a3' : 'color:var(--muted)'}">once, forever</span></p>
<ul style="margin:1rem 0 0;padding:0;list-style:none;${dark ? 'color:#d4d4d4' : 'color:var(--muted)'};font-size:.9rem">
${features.map((f) => `<li style="margin:.4rem 0">· ${esc(f)}</li>`).join('\n')}
</ul>
<a class="btn" href="/builder" style="margin-top:1.25rem;width:100%;${dark ? 'background:#fff;color:#0a0a0a' : ''}">Start free</a>
<p style="margin:.5rem 0 0;font-size:.8rem;${dark ? 'color:#a3a3a3' : 'color:var(--muted)'}">${esc(tagline)}</p>
</div>`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>RezUp Pricing — $9.99 Once, Never a Subscription</title>
<meta name="description" content="RezUp pricing: everything free during beta. When billing opens: Single Resume $9.99 one-time, Career Bundle $19.99 one-time. No subscription, no stored card, nothing to cancel." />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="RezUp" />
<meta property="og:title" content="RezUp Pricing — $9.99 Once, Never a Subscription" />
<meta property="og:description" content="Single Resume $9.99 one-time, Career Bundle $19.99 one-time. Free during beta. No subscription, ever." />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og2.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd([{ name: 'Pricing', path: '/pricing/' }]))}</script>
<style>${CSS}
.price-grid{display:grid;gap:1.25rem;margin-top:1.5rem}
@media(min-width:640px){.price-grid{grid-template-columns:1fr 1fr}}
table.cmp{width:100%;border-collapse:collapse;font-size:.9rem;margin-top:1rem}
table.cmp th,table.cmp td{padding:.6rem .5rem;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}
table.cmp th:nth-child(2),table.cmp td:nth-child(2){background:oklch(0.5 0.18 265 / 0.06)}
table.cmp td:nth-child(2){color:#047857;font-weight:500}
table.cmp td:nth-child(3){color:var(--muted)}
table.cmp.plans th:nth-child(2),table.cmp.plans td:nth-child(2){background:none}
table.cmp.plans td:nth-child(2),table.cmp.plans td:nth-child(3){color:inherit;font-weight:400}
table.cmp.plans th:nth-child(4),table.cmp.plans td:nth-child(4){background:oklch(0.5 0.18 265 / 0.06)}
table.cmp.plans td:nth-child(4){color:#047857;font-weight:500}
.faq h3{margin:1.25rem 0 .25rem;font-size:1rem}
.faq p{margin:0;color:var(--muted);font-size:.9375rem}
</style>
${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />RezUp</a>
${NAV_HTML}
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>Simple pricing: pay once, or pay nothing</h1>
<p class="lede">${FREE_MODE ? 'Every plan is free during beta — no card, no auto-renewal, nothing that renews. When billing opens, prices below are one-time.' : 'Everything is free to try. Pay exactly once to download — never a subscription.'}</p>
<div class="price-grid">
${planCard('Single Resume', '$9.99', 'Everything you need to apply: unlimited exports of one polished, tailored resume.', ['Unlimited PDF + DOCX downloads, no watermark', 'Unlimited AI rewrites & job-targeted tailoring', 'All 22 ATS-friendly templates', 'Edit and re-download forever'], false)}
${planCard('Career Bundle', '$19.99', 'The full job-hunt kit: resume, cover letters and interview prep in one purchase.', ['Everything in Single Resume', 'AI cover letters tailored to each job posting', 'Interview prep brief: likely questions, STAR stories, gaps', 'All future features included'], true)}
</div>
<h2 style="margin-top:3rem">Compare our plans</h2>
<p style="color:var(--muted);font-size:.9375rem">${FREE_MODE ? 'During the beta everything below is free for everyone — this is what each plan covers when billing opens.' : 'Everything in the Free column stays free forever — you only pay to download.'}</p>
<div style="overflow-x:auto" tabindex="0" role="region" aria-label="Plan comparison">
<table class="cmp plans">
<thead><tr><th><span style="position:absolute;clip:rect(0 0 0 0)">Feature</span></th><th>Free</th><th>Single Resume<br /><span style="font-weight:400;color:var(--muted)">$9.99 once</span></th><th>Career Bundle<br /><span style="font-weight:400;color:var(--muted)">$19.99 once</span></th></tr></thead>
<tbody>
<tr><td>Full editor &amp; live preview</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td>All 22 ATS-safe templates</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td>ATS match score vs any job description</td><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><td>AI rewrites &amp; job-targeted tailoring</td><td>5 included</td><td>Unlimited</td><td>Unlimited</td></tr>
<tr><td>PDF + DOCX downloads, no watermark</td><td>—</td><td>Unlimited</td><td>Unlimited</td></tr>
<tr><td>Edit and re-download forever</td><td>—</td><td>✓</td><td>✓</td></tr>
<tr><td>AI cover letters tailored to each job posting</td><td>—</td><td>—</td><td>✓</td></tr>
<tr><td>Interview prep brief (questions, STAR stories, gaps)</td><td>—</td><td>—</td><td>✓</td></tr>
<tr><td>All future features included</td><td>—</td><td>—</td><td>✓</td></tr>
<tr><td>Account required</td><td>No</td><td>No</td><td>No</td></tr>
<tr><td>Recurring charges</td><td>Never</td><td>Never</td><td>Never</td></tr>
</tbody>
</table>
</div>
<h2 style="margin-top:3rem">What you get, next to a typical subscription builder</h2>
<div style="overflow-x:auto" tabindex="0" role="region" aria-label="Feature comparison">
<table class="cmp">
<thead><tr><th><span style="position:absolute;clip:rect(0 0 0 0)">Feature</span></th><th>RezUp</th><th>Typical subscription builder</th></tr></thead>
<tbody>
<tr><td>Cost to download your resume</td><td>$9.99 once</td><td>$1.95–$2.95 “trial” → $25.95–$29.95 every 4 weeks</td></tr>
<tr><td>Cost over a 6-month job search</td><td>$9.99</td><td>$150–$180</td></tr>
<tr><td>AI rewriting</td><td>Never invents facts — marks gaps with [add %]</td><td>Often fabricates metrics and experience</td></tr>
<tr><td>Auto-renews / recurring charges</td><td>Never</td><td>Yes — cancellation buried in menus</td></tr>
<tr><td>ATS match score</td><td>Free, before paying</td><td>Behind the paywall</td></tr>
<tr><td>Card stored after purchase</td><td>No</td><td>Yes, and charged again</td></tr>
<tr><td>Account required</td><td>No</td><td>Yes</td></tr>
<tr><td>Your resume data</td><td>Stays in your browser</td><td>Stored on their servers</td></tr>
</tbody>
</table>
</div>
<h2 style="margin-top:3rem">Pricing FAQ</h2>
<div class="faq">
${PRICING_FAQ.map(([q, a]) => `<h3>${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}
</div>
<div class="cta">
<p>${FREE_MODE ? 'Free during beta: editor, templates, ATS score, AI tools and downloads — all included.' : 'Free to try. $9.99 exactly once to download. Nothing to cancel, ever.'}</p>
<a class="btn" href="/builder">Start building free</a>
</div>
</main>
${siteFooter()}
</body>
</html>`
}

mkdirSync(path.join(OUT_DIR, 'pricing'), { recursive: true })
writeFileSync(path.join(OUT_DIR, 'pricing/index.html'), pricingPage())
console.log('built /pricing/index.html')

// ---- Standalone /ai/ page: the four AI abilities, one section each ----
const AI_SECTIONS = [
  {
    id: 'tailor',
    name: 'Tailor to any job posting',
    copy: 'Paste the job description and RezUp\u2019s AI rewrites your real bullets toward it \u2014 mirroring the posting\u2019s language without inventing employers, dates or metrics. You review and approve every suggested line before it lands in your resume.',
    svg: '<svg viewBox="0 0 200 120" role="img" aria-label="Tailoring suggestions illustration" style="width:100%;max-width:320px"><rect x="4" y="8" width="90" height="104" rx="6" fill="#fff" stroke="#e2e8f0"/><rect x="12" y="18" width="60" height="6" rx="2" fill="#cbd5e1"/><rect x="12" y="32" width="74" height="4" rx="2" fill="#e2e8f0"/><rect x="12" y="42" width="66" height="4" rx="2" fill="#e2e8f0"/><rect x="12" y="52" width="70" height="4" rx="2" fill="#e2e8f0"/><rect x="106" y="20" width="90" height="26" rx="6" fill="oklch(0.5 0.18 265 / 0.08)" stroke="oklch(0.5 0.18 265 / 0.3)"/><rect x="114" y="28" width="60" height="4" rx="2" fill="oklch(0.5 0.18 265 / 0.5)"/><rect x="114" y="36" width="48" height="4" rx="2" fill="oklch(0.5 0.18 265 / 0.35)"/><rect x="106" y="54" width="90" height="26" rx="6" fill="#ecfdf5" stroke="#a7f3d0"/><rect x="114" y="62" width="56" height="4" rx="2" fill="#34d399"/><rect x="114" y="70" width="44" height="4" rx="2" fill="#6ee7b7"/><path d="M94 60h12" stroke="#94a3b8" stroke-width="2" marker-end="none"/></svg>',
  },
  {
    id: 'score',
    name: 'Free ATS match score',
    copy: 'A transparent, rule-based score computed entirely in your browser: keyword coverage against the posting\u2019s top terms plus a 7-point structure checklist. See matched and missing keywords \u2014 free, before you ever pay.',
    svg: '<svg viewBox="0 0 200 120" role="img" aria-label="Score ring illustration" style="width:100%;max-width:320px"><circle cx="100" cy="60" r="38" fill="none" stroke="#e2e8f0" stroke-width="9"/><circle cx="100" cy="60" r="38" fill="none" stroke="#059669" stroke-width="9" stroke-linecap="round" stroke-dasharray="239" stroke-dashoffset="33" transform="rotate(-90 100 60)"/><text x="100" y="68" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="24" font-weight="700" fill="#059669">86</text></svg>',
  },
  {
    id: 'rewrite',
    name: 'Honest AI rewriting',
    copy: 'Bullet and summary rewrites that sharpen what you actually did. Where a number would help, the AI marks the gap with [add %] instead of fabricating one \u2014 because an invented metric can cost you the offer in the interview.',
    svg: '<svg viewBox="0 0 200 120" role="img" aria-label="Rewrite illustration" style="width:100%;max-width:320px"><rect x="10" y="26" width="180" height="20" rx="5" fill="#f8fafc" stroke="#e2e8f0"/><rect x="18" y="33" width="120" height="6" rx="2" fill="#cbd5e1"/><rect x="10" y="66" width="180" height="20" rx="5" fill="#ecfdf5" stroke="#a7f3d0"/><rect x="18" y="73" width="140" height="6" rx="2" fill="#34d399"/><path d="M100 50v10" stroke="#94a3b8" stroke-width="2"/><path d="M96 56l4 6 4-6" fill="none" stroke="#94a3b8" stroke-width="2"/></svg>',
  },
  {
    id: 'cover-letter',
    name: 'Cover letters, interview prep & resignation letters',
    copy: 'Three career documents built from the same resume: an AI cover letter written for the specific posting, an interview brief \u2014 likely questions, STAR stories drawn from your real experience, gaps to prepare \u2014 and a professional resignation letter, all exported on a letterhead.',
    links: [
      ['Cover letter generator', '/cover-letter-generator/'],
      ['Interview prep', '/interview-prep/'],
      ['Resignation letter generator', '/resignation-letter-generator/'],
    ],
    svg: '<svg viewBox="0 0 200 120" role="img" aria-label="Cover letter illustration" style="width:100%;max-width:320px"><rect x="30" y="10" width="80" height="100" rx="6" fill="#fff" stroke="#e2e8f0"/><rect x="40" y="22" width="40" height="6" rx="2" fill="#cbd5e1"/><rect x="40" y="36" width="60" height="4" rx="2" fill="#e2e8f0"/><rect x="40" y="46" width="56" height="4" rx="2" fill="#e2e8f0"/><rect x="40" y="56" width="60" height="4" rx="2" fill="#e2e8f0"/><rect x="40" y="66" width="48" height="4" rx="2" fill="#e2e8f0"/><rect x="120" y="34" width="56" height="52" rx="8" fill="oklch(0.5 0.18 265 / 0.08)" stroke="oklch(0.5 0.18 265 / 0.3)"/><rect x="128" y="44" width="40" height="4" rx="2" fill="oklch(0.5 0.18 265 / 0.5)"/><rect x="128" y="54" width="34" height="4" rx="2" fill="oklch(0.5 0.18 265 / 0.35)"/><rect x="128" y="64" width="38" height="4" rx="2" fill="oklch(0.5 0.18 265 / 0.35)"/></svg>',
  },
]

function aiPage() {
  const canonical = `${SITE}/ai/`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>AI Resume Tools — Tailoring, Scoring, Rewriting | RezUp</title>
<meta name="description" content="RezUp's AI toolkit: job-targeted tailoring, a free in-browser ATS match score, honest bullet rewriting that never invents facts, and AI cover letters with interview prep." />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="RezUp" />
<meta property="og:title" content="AI Resume Tools — Tailoring, Scoring, Rewriting | RezUp" />
<meta property="og:description" content="Job-targeted tailoring, free ATS scoring, honest AI rewriting and cover letters — RezUp's AI toolkit, free during beta." />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og2.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(breadcrumbLd([{ name: 'AI resume tools', path: '/ai/' }]))}</script>
<style>${CSS}
.ai-row{display:grid;gap:1.5rem;align-items:center;margin-top:3.5rem}
@media(min-width:640px){.ai-row{grid-template-columns:1fr 1fr}.ai-row.flip .ai-art{order:2}}
.ai-art{background:#f8fafc;border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;display:flex;justify-content:center}
.ai-row h2{margin:0 0 .5rem}
.ai-row p{margin:0;color:var(--muted)}
.ai-kicker{color:var(--primary);font-size:.8rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0 0 .35rem}
.ai-links{margin-top:.75rem !important;font-size:.9375rem}
.ai-links a{color:var(--primary);text-decoration:underline}
</style>
${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />RezUp</a>
${NAV_HTML}
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main style="max-width:56rem">
<h1>AI that gets you the interview — honestly</h1>
<p class="lede">Four AI abilities built into the RezUp builder. All of them work on your real experience: the AI sharpens what you did, and refuses to invent what you didn't.</p>
${AI_SECTIONS.map(
    (s, i) => `<section id="${s.id}" class="ai-row${i % 2 ? ' flip' : ''}">
<div class="ai-art" aria-hidden="true">${s.svg}</div>
<div><p class="ai-kicker">Ability ${i + 1}</p><h2>${esc(s.name)}</h2><p>${esc(s.copy)}</p>${
      s.links
        ? `<p class="ai-links">${s.links.map(([label, href]) => `<a href="${href}">${esc(label)}</a>`).join(' · ')}</p>`
        : ''
    }</div>
</section>`
  ).join('\n')}
<div class="cta" style="margin-top:3.5rem">
<p>${FREE_MODE ? 'Every AI tool is free during beta — no card, no account, nothing that renews.' : 'Try the AI free (5 rewrites included). Unlimited AI is a one-time $9.99 — never a subscription.'}</p>
<a class="btn" href="/builder">Try the AI builder free</a>
</div>
</main>
${siteFooter()}
</body>
</html>`
}

mkdirSync(path.join(OUT_DIR, 'ai'), { recursive: true })
writeFileSync(path.join(OUT_DIR, 'ai/index.html'), aiPage())
console.log('built /ai/index.html')

// ---- Standalone landing pages for the career-document tools ----
const TOOL_PAGES = [
  {
    slug: 'cover-letter-generator',
    title: 'AI Cover Letter Generator — From Your Resume, Free | RezUp',
    description:
      'Generate a tailored cover letter from your real resume and the specific job posting. Letterhead PDF and DOCX export, no invented experience, free during beta.',
    h1: 'AI cover letter generator',
    lede: 'Paste the job posting and RezUp writes a cover letter from your actual resume — your real roles, your real results, aimed at that specific job. It never invents experience you don\u2019t have.',
    cta: '/builder?doc=cover',
    ctaLabel: 'Write my cover letter free',
    steps: [
      ['Build or import your resume', 'The letter is grounded in your resume, so start there \u2014 build one in the editor or import an existing PDF/DOCX. Everything stays in your browser.'],
      ['Paste the job posting', 'Add the company name and paste the job description. The AI aligns your strongest, most relevant experience to what the posting asks for.'],
      ['Review, edit and export', 'Edit the draft in place, then download it as a letterhead PDF or DOCX \u2014 your name, contact line and the date, matching your resume\u2019s template style.'],
    ],
    faq: [
      ['Is the cover letter generator free?', 'Yes \u2014 during beta every AI feature is free within a daily credit allowance. When billing opens, unlimited AI is part of a one-time purchase, never a subscription.'],
      ['Will it make things up about me?', 'No. The letter is written only from what your resume actually says. Where a specific number or detail would strengthen a claim, it leaves a visible gap for you to fill instead of fabricating one.'],
      ['Where is my letter stored?', 'In your browser (localStorage), alongside your resume. We never store your resume or letters on a server.'],
      ['What formats can I download?', 'Letterhead PDF and DOCX \u2014 real text, not an image \u2014 with your name, clickable contact details and the date.'],
    ],
  },
  {
    slug: 'interview-prep',
    title: 'AI Interview Prep — Questions, STAR Stories, Practice | RezUp',
    description:
      'An interview brief built from your resume and the job description: likely questions, STAR stories from your real experience, gaps to prepare \u2014 plus answer practice with AI feedback.',
    h1: 'AI interview prep',
    lede: 'Get a prep brief for a specific job: the questions this posting is likely to raise, STAR stories drawn from your real experience, and the gaps you should prepare to address. Then practice answers and get AI feedback.',
    cta: '/builder?doc=interview',
    ctaLabel: 'Prep my interview free',
    steps: [
      ['Start from your resume and the posting', 'The brief is built from your resume plus the job description you\u2019re interviewing for, so the questions and stories are specific to you and the role.'],
      ['Read your brief', 'Likely interview questions, suggested STAR stories that use your actual accomplishments, and an honest list of gaps between your background and the posting.'],
      ['Practice answers with AI feedback', 'Type an answer to any question \u2014 yours or an AI-suggested one \u2014 and get structured feedback: what worked, what to improve, and a stronger version that stays true to your experience.'],
    ],
    faq: [
      ['Is interview prep free?', 'Yes \u2014 during beta every AI feature is free within a daily credit allowance. When billing opens, unlimited AI is part of a one-time purchase, never a subscription.'],
      ['Will the STAR stories be accurate?', 'They are drawn from the experience in your resume. The AI arranges your real accomplishments into the STAR shape \u2014 it does not invent employers, projects or metrics.'],
      ['Where is my brief stored?', 'In your browser (localStorage). You can save briefs to your dashboard and export them as text \u2014 nothing is stored on a server.'],
      ['Is this a video interview simulator?', 'No. RezUp\u2019s prep is text-based: a written brief plus written answer practice with feedback. There is no camera or recorded mock interview.'],
    ],
  },
  {
    slug: 'resignation-letter-generator',
    title: 'Resignation Letter Generator — Professional & Free | RezUp',
    description:
      'Write a professional, courteous resignation letter in minutes. Letterhead PDF and DOCX export with your details and the date. Free during beta, stored only in your browser.',
    h1: 'Resignation letter generator',
    lede: 'Leave on good terms with a short, professional resignation letter: your role, your last working day, and a courteous thank-you \u2014 exported on a letterhead with your name and contact details.',
    cta: '/builder?doc=resignation',
    ctaLabel: 'Write my resignation letter free',
    steps: [
      ['Fill in the basics', 'Your role, company, and last working day \u2014 plus an optional note of thanks or handover offer.'],
      ['Generate and edit', 'The AI drafts a concise, professional letter with the right tone \u2014 no oversharing, no burned bridges. Edit any line before you send it.'],
      ['Export on letterhead', 'Download a letterhead PDF or DOCX with your name, contact line and the date, or copy the text into an email.'],
    ],
    faq: [
      ['Is the resignation letter generator free?', 'Yes \u2014 during beta every AI feature is free within a daily credit allowance. When billing opens, unlimited AI is part of a one-time purchase, never a subscription.'],
      ['What should a resignation letter include?', 'Three things: a clear statement that you are resigning from your role, your last working day (typically two weeks out or per your contract), and a professional thank-you. Everything else \u2014 reasons, grievances, next plans \u2014 is optional and usually better left out.'],
      ['Where is my letter stored?', 'In your browser (localStorage). You can save it to your dashboard \u2014 nothing is stored on a server.'],
    ],
  },
]

function toolPage(p) {
  const canonical = `${SITE}/${p.slug}/`
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: p.faq.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
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
<meta property="og:site_name" content="RezUp" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og2.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(breadcrumbLd([{ name: p.h1, path: `/${p.slug}/` }]))}</script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<style>${CSS}
.steps{list-style:none;counter-reset:step;padding:0;margin:1rem 0 0;display:grid;gap:1rem}
.steps li{counter-increment:step;border:1px solid var(--border);background:var(--card);border-radius:var(--radius);padding:1rem 1.25rem;position:relative;padding-left:3.25rem}
.steps li::before{content:counter(step);position:absolute;left:1rem;top:1.1rem;width:1.5rem;height:1.5rem;border-radius:50%;background:var(--accent);color:var(--primary);font-weight:700;font-size:.8125rem;display:flex;align-items:center;justify-content:center}
.steps h3{margin:0 0 .25rem;font-size:1rem}
.steps p{margin:0;color:var(--muted);font-size:.9375rem}
.faq h3{margin:1.25rem 0 .25rem;font-size:1rem}
.faq p{margin:0;color:var(--muted);font-size:.9375rem}
</style>
${FP_BEACON}
</head>
<body>
<header class="site"><div class="in">
<a class="brand" href="/"><img src="/favicon.svg" alt="" />RezUp</a>
${NAV_HTML}
<a class="btn" href="/builder">Build my resume free</a>
</div></header>
<main>
<h1>${esc(p.h1)}</h1>
<p class="lede">${esc(p.lede)}</p>
<p style="margin-top:1.25rem"><a class="btn" href="${p.cta}">${esc(p.ctaLabel)}</a></p>
<h2 style="margin-top:3rem">How it works</h2>
<ol class="steps">
${p.steps.map(([h, t]) => `<li><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('\n')}
</ol>
<h2 style="margin-top:3rem">Frequently asked questions</h2>
<div class="faq">
${p.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('\n')}
</div>
<div class="cta">
<p>Everything runs on your real experience and stays in your browser \u2014 no account, no server-side storage, no subscription.</p>
<a class="btn" href="${p.cta}">${esc(p.ctaLabel)}</a>
</div>
</main>
${siteFooter()}
</body>
</html>`
}

for (const p of TOOL_PAGES) {
  mkdirSync(path.join(OUT_DIR, p.slug), { recursive: true })
  writeFileSync(path.join(OUT_DIR, p.slug, 'index.html'), toolPage(p))
  console.log(`built /${p.slug}/index.html`)
}

const urls = [
  '/',
  '/builder',
  '/ats-checker',
  '/pricing/',
  '/ai/',
  ...TOOL_PAGES.map((p) => `/${p.slug}/`),
  ...PAGES.map((p) => `${p.path}/`),
  ...HUBS.map((h) => h.pathname),
  ...GUIDES.map((p) => `${p.path}/`),
  ...EXAMPLES.map((e) => `/examples/${e.slug}/`),
  ...TEMPLATE_PAGES.map((p) => `${p.path}/`),
  ...LEGAL_PAGES.map((p) => `${p.path}/`),
  '/about/',
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
const llms = `# RezUp

> ATS-friendly resume builder with a one-time-payment model ($9.99/$19.99 once; every plan currently free during beta): 22 single-column templates, live preview, free ATS match score against any pasted job description, real text-based PDF and DOCX export. No account — resume data stays in the user's browser (localStorage). No subscription, no auto-renewal, no trial trap.

## Core tools

- [Resume builder](${SITE}/builder): full editor with templates, live preview and exports
- [Free ATS checker](${SITE}/ats-checker): paste a resume + job description for an instant match score with matched/missing keywords
- [Cover letter generator](${SITE}/cover-letter-generator/): AI cover letter from your real resume and a specific job posting, letterhead PDF/DOCX export
- [Interview prep](${SITE}/interview-prep/): interview brief (likely questions, STAR stories, gaps) plus answer practice with AI feedback
- [Resignation letter generator](${SITE}/resignation-letter-generator/): professional resignation letter with letterhead export

## Comparisons (first-hand tests)

${PAGES.filter((p) => p.path.startsWith('/vs/'))
  .map((p) => `- [${p.name}](${SITE}${p.path}/): ${p.description}`)
  .join('\n')}

## Guides

${GUIDES.map((g) => `- [${g.title.split(' — ')[0].split(' (')[0]}](${SITE}${g.path}/): ${g.description}`).join('\n')}

## Resume examples

${EXAMPLES.map((e) => `- [${e.role} resume example](${SITE}/examples/${e.slug}/): ${e.description}`).join('\n')}

## Templates

${TEMPLATE_PAGES.map((t) => `- [${t.name}](${SITE}${t.path}/): ${t.description}`).join('\n')}
`
writeFileSync(path.join(OUT_DIR, 'llms.txt'), llms)
console.log('built llms.txt')
