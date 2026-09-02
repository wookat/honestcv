/**
 * Curated bullet starters by role family. Deliberately use [add …] placeholders
 * instead of invented numbers — the user fills in their real facts.
 */
interface StarterGroup {
  match: RegExp
  starters: string[]
}

const GROUPS: StarterGroup[] = [
  {
    match: /engineer|developer|programmer|swe|devops|sre|architect/i,
    starters: [
      'Shipped [feature] used by [add #] users, reducing [metric] by [add %]',
      'Cut [build/deploy/page-load] time by [add %] by [what you changed]',
      'Led migration from [old system] to [new system] with zero downtime',
      'Designed and built [service/API] handling [add #] requests per day',
      'Reduced production incidents by [add %] by introducing [tests/monitoring/alerts]',
      'Mentored [add #] engineers; ran code reviews and design discussions',
    ],
  },
  {
    match: /sales|account exec|business development|bdr|sdr/i,
    starters: [
      'Exceeded quota by [add %] for [add #] consecutive quarters',
      'Closed [add #] new accounts worth $[add amount] in annual revenue',
      'Grew territory pipeline from $[add amount] to $[add amount] in [add #] months',
      'Shortened average sales cycle by [add #] days by [what you changed]',
      'Won back [add #] churned customers, recovering $[add amount] ARR',
    ],
  },
  {
    match: /marketing|growth|seo|content|social media|brand/i,
    starters: [
      'Grew [channel] traffic by [add %] in [add #] months through [tactic]',
      'Launched [campaign] that generated [add #] qualified leads at $[add amount] CAC',
      'Increased email open rate from [add %] to [add %] by [what you changed]',
      'Ranked #[add #] for [keyword] with [add #] monthly searches',
      'Managed $[add amount] budget across [channels], improving ROAS by [add %]',
    ],
  },
  {
    match: /product manager|product owner|\bpm\b/i,
    starters: [
      'Launched [product/feature] adopted by [add %] of users within [add #] months',
      'Prioritized roadmap across [add #] teams, shipping [add #] releases per quarter',
      'Increased activation rate by [add %] by redesigning [flow]',
      'Ran [add #] customer interviews to define [feature]; NPS rose [add #] points',
      'Reduced churn by [add %] by shipping [feature] top customers requested',
    ],
  },
  {
    match: /designer|ux|ui|creative/i,
    starters: [
      'Redesigned [flow/page], improving [conversion/task completion] by [add %]',
      'Built and maintained the design system used across [add #] products',
      'Ran usability tests with [add #] participants; fixes lifted [metric] by [add %]',
      'Delivered [add #] high-fidelity prototypes per sprint in Figma',
      'Partnered with engineering to ship [feature] on time across [platforms]',
    ],
  },
  {
    match: /data|analyst|analytics|scientist|machine learning|\bml\b|\bai\b/i,
    starters: [
      'Built [model/dashboard] that improved [decision/metric] by [add %]',
      'Automated [report/pipeline], saving [add #] hours per week',
      'Analyzed [add #] records to identify [insight], driving [add %] improvement in [metric]',
      'Deployed [model] to production serving [add #] predictions per day',
      'Defined KPIs and built dashboards used by [add #] stakeholders weekly',
    ],
  },
  {
    match: /support|customer success|customer service|helpdesk/i,
    starters: [
      'Maintained [add %] CSAT across [add #] tickets per month',
      'Reduced first-response time from [add #] to [add #] hours by [what you changed]',
      'Onboarded [add #] enterprise accounts with [add %] retention after one year',
      'Wrote [add #] help-center articles that deflected [add %] of tickets',
      'Identified churn risks early, saving [add #] accounts worth $[add amount]',
    ],
  },
  {
    match: /operations|project manager|program manager|coordinator|logistics/i,
    starters: [
      'Delivered [project] [add #] weeks ahead of schedule and [add %] under budget',
      'Streamlined [process], cutting turnaround time by [add %]',
      'Coordinated [add #] stakeholders across [add #] teams to launch [initiative]',
      'Negotiated vendor contracts saving $[add amount] annually',
      'Introduced [tool/process] that eliminated [add #] hours of manual work weekly',
    ],
  },
]

const GENERIC = [
  'Improved [metric] by [add %] by [what you did]',
  'Led [project/initiative] that delivered [result] for [team/company]',
  'Saved [add #] hours per week by [what you automated or streamlined]',
  'Recognized with [award/promotion] for [accomplishment]',
  'Trained [add #] teammates on [skill/process/tool]',
]

/** Returns bullet starters matched to a job title / target role, generic if no match. */
export function bulletStartersFor(role: string): string[] {
  for (const g of GROUPS) if (g.match.test(role)) return g.starters
  return GENERIC
}

/**
 * Skill-tailored starter templates by role family — the same action-verb +
 * [add …] placeholder style as the role starters, with the skill woven in.
 */
const SKILL_TEMPLATES: { match: RegExp; templates: ((skill: string) => string)[] }[] = [
  {
    match: /engineer|developer|programmer|swe|devops|sre|architect/i,
    templates: [
      (s) => `Used ${s} to build [feature/service], improving [metric] by [add %]`,
      (s) => `Automated [process] with ${s}, saving [add #] hours per week`,
      (s) => `Led adoption of ${s} across [team/project], cutting [metric] by [add %]`,
    ],
  },
  {
    match: /sales|account exec|business development|bdr|sdr/i,
    templates: [
      (s) => `Used ${s} to manage [add #] accounts, growing revenue by [add %]`,
      (s) => `Built a ${s} workflow that shortened the sales cycle by [add #] days`,
      (s) => `Leveraged ${s} to source [add #] qualified leads per month`,
    ],
  },
  {
    match: /marketing|growth|seo|content|social media|brand/i,
    templates: [
      (s) => `Ran ${s} campaigns that generated [add #] leads at $[add amount] CAC`,
      (s) => `Used ${s} to grow [channel] traffic by [add %] in [add #] months`,
      (s) => `Improved [metric] by [add %] through ${s}`,
    ],
  },
  {
    match: /product manager|product owner|\bpm\b/i,
    templates: [
      (s) => `Used ${s} to prioritize [roadmap/backlog], shipping [add #] releases per quarter`,
      (s) => `Applied ${s} to identify [insight], lifting [metric] by [add %]`,
      (s) => `Drove ${s} adoption across [add #] teams`,
    ],
  },
  {
    match: /designer|ux|ui|creative/i,
    templates: [
      (s) => `Used ${s} to deliver [add #] high-fidelity prototypes per sprint`,
      (s) => `Applied ${s} in usability tests with [add #] participants, lifting [metric] by [add %]`,
      (s) => `Built [design system/components] with ${s} used across [add #] products`,
    ],
  },
  {
    match: /data|analyst|analytics|scientist|machine learning|\bml\b|\bai\b/i,
    templates: [
      (s) => `Built [model/dashboard] with ${s} that improved [metric] by [add %]`,
      (s) => `Used ${s} to analyze [add #] records, surfacing [insight]`,
      (s) => `Automated [pipeline/report] with ${s}, saving [add #] hours per week`,
    ],
  },
  {
    match: /support|customer success|customer service|helpdesk/i,
    templates: [
      (s) => `Used ${s} to resolve [add #] tickets per month at [add %] CSAT`,
      (s) => `Built ${s} workflows that cut first-response time by [add %]`,
      (s) => `Documented ${s} processes that deflected [add %] of tickets`,
    ],
  },
  {
    match: /operations|project manager|program manager|coordinator|logistics/i,
    templates: [
      (s) => `Used ${s} to deliver [project] [add #] weeks ahead of schedule`,
      (s) => `Streamlined [process] with ${s}, cutting turnaround time by [add %]`,
      (s) => `Coordinated [add #] stakeholders using ${s} to launch [initiative]`,
    ],
  },
]

const GENERIC_SKILL_TEMPLATES: ((skill: string) => string)[] = [
  (s) => `Used ${s} to deliver [project/result], improving [metric] by [add %]`,
  (s) => `Applied ${s} to [what you did], saving [add #] hours per week`,
  (s) => `Led [initiative] using ${s}, recognized for [accomplishment]`,
]

/** One starter per skill, cycling the role family's skill templates (generic if no match). */
export function skillBulletStarters(role: string, skills: string[]): string[] {
  const templates =
    SKILL_TEMPLATES.find((g) => g.match.test(role))?.templates ?? GENERIC_SKILL_TEMPLATES
  return skills.map((s, i) => templates[i % templates.length](s))
}

/** Common skills by role family — chips the user taps only if they actually have them. */
const SKILL_GROUPS: { match: RegExp; skills: string[] }[] = [
  {
    match: /engineer|developer|programmer|swe|devops|sre|architect/i,
    skills: [
      'JavaScript',
      'TypeScript',
      'Python',
      'React',
      'Node.js',
      'SQL',
      'Docker',
      'Kubernetes',
      'AWS',
      'CI/CD',
      'Git',
      'REST APIs',
    ],
  },
  {
    match: /sales|account exec|business development|bdr|sdr/i,
    skills: [
      'Salesforce',
      'HubSpot',
      'Prospecting',
      'Cold outreach',
      'Pipeline management',
      'Negotiation',
      'CRM',
      'Forecasting',
    ],
  },
  {
    match: /marketing|growth|seo|content|social media|brand/i,
    skills: [
      'SEO',
      'Google Analytics',
      'Content marketing',
      'Email marketing',
      'Paid social',
      'Google Ads',
      'Copywriting',
      'A/B testing',
    ],
  },
  {
    match: /product manager|product owner|\bpm\b/i,
    skills: [
      'Roadmapping',
      'User research',
      'A/B testing',
      'SQL',
      'Jira',
      'Agile',
      'Stakeholder management',
      'Product analytics',
    ],
  },
  {
    match: /designer|ux|ui|creative/i,
    skills: [
      'Figma',
      'Prototyping',
      'User research',
      'Design systems',
      'Usability testing',
      'Wireframing',
      'Adobe Creative Suite',
      'Accessibility',
    ],
  },
  {
    match: /data|analyst|analytics|scientist|machine learning|\bml\b|\bai\b/i,
    skills: [
      'SQL',
      'Python',
      'Tableau',
      'Excel',
      'Pandas',
      'Machine learning',
      'Statistics',
      'Data visualization',
      'dbt',
    ],
  },
  {
    match: /support|customer success|customer service|helpdesk/i,
    skills: [
      'Zendesk',
      'Intercom',
      'CRM',
      'Onboarding',
      'Ticket triage',
      'Knowledge base writing',
      'Escalation management',
    ],
  },
  {
    match: /operations|project manager|program manager|coordinator|logistics/i,
    skills: [
      'Project management',
      'Jira',
      'Asana',
      'Process improvement',
      'Budgeting',
      'Vendor management',
      'Excel',
      'Stakeholder communication',
    ],
  },
]

/** Returns common-skill chips for a role, empty for unrecognized roles. */
export function skillSuggestionsFor(role: string): string[] {
  for (const g of SKILL_GROUPS) if (g.match.test(role)) return g.skills
  return []
}
