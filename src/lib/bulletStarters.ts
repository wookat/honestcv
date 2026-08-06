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
