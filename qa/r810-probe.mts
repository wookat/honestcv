import { parseResumeText } from '@/lib/importText'
const shapes: Record<string,string> = {
  A_at_noheading: `Jane Doe
jane@example.com | 555-010-0000
Senior Engineer at Acme Corp
Jan 2020 – Present
- Built the billing platform.
- Led a team of four.`,
  B_at_with_heading: `Jane Doe
EXPERIENCE
Senior Engineer at Acme Corp
Jan 2020 – Present
- Built the billing platform.`,
  C_comma_name_title: `Jane Doe, Senior Engineer
jane@example.com | 555-010-0000
EXPERIENCE
Engineer · Acme
2019 – 2020
- Did things.`,
  D_comma_suffix_guard: `Jane Doe, PhD
jane@example.com
EXPERIENCE
Engineer · Acme
2019 – 2020
- Did things.`,
  E_comma_title_first: `Director, Engineering
Jane Doe
jane@example.com`,
  F_at_undated_bullets: `Jane Doe
jane@example.com
Senior Engineer at Acme Corp
- Built the billing platform.
- Led a team of four.`,
  G_at_dash: `Jane Doe
jane@example.com
Senior Engineer — Acme Corp
Jan 2020 – Present
- Built the billing platform.`,
  H_at_prose_guard: `Jane Doe
jane@example.com
Engineer with 8 years at scale-ups and at Acme.
EXPERIENCE
Engineer · Acme
2019 – 2020
- Did things.`,
}
for (const [k, t] of Object.entries(shapes)) {
  const r = parseResumeText(t)
  console.log(k, JSON.stringify({ name: r.contact.fullName, title: r.contact.title, summary: r.summary.slice(0,60), exp: r.experience.map(e => [e.role, e.company, e.startDate, e.endDate, e.bullets.length]), custom: r.customSections.map(c => c.title) }))
}
