import { parseResumeText } from '../src/lib/importText'
const shapes: Record<string, string> = {
  pipeTitle: 'Jane Doe | Senior Engineer\njane@example.com · 555-111-2222\nEXPERIENCE\nEngineer · Acme\n2020 – 2021',
  pipeTitleLong: 'Jane Doe | Senior Software Engineer, Platform\njane@example.com\nEXPERIENCE\nEngineer · Acme\n2020 – 2021',
  dotTitle: 'Jane Doe · Senior Engineer\njane@example.com\nEXPERIENCE\nEngineer · Acme\n2020 – 2021',
  commaTitle: 'Jane Doe, Senior Engineer\njane@example.com\nEXPERIENCE\nEngineer · Acme\n2020 – 2021',
  pipeContact: 'Jane Doe | jane@example.com | 555-111-2222\nEXPERIENCE\nEngineer · Acme\n2020 – 2021',
  pipeCity: 'Jane Doe | Austin, TX\njane@example.com\nEXPERIENCE\nEngineer · Acme\n2020 – 2021',
  yearAboveEdu: 'Jane Doe\njane@example.com\nEDUCATION\n2018\nMS Data Science · Tech Institute\n2016\nBS Computer Science · State University',
  yearAboveExp: 'Jane Doe\njane@example.com\nEXPERIENCE\n2020 – 2021\nEngineer · Acme\n- Built.\n2017 – 2019\nStaff Engineer · Beta Ltd\n- Led.',
  rangeAboveExpSingle: 'Jane Doe\njane@example.com\nEXPERIENCE\nJan 2020 – Present\nSenior Engineer · Acme Corp\n- Built things.',
}
for (const [k, t] of Object.entries(shapes)) {
  const r = parseResumeText(t)
  console.log(k, JSON.stringify({ name: r.contact.fullName, title: r.contact.title, loc: r.contact.location, email: r.contact.email,
    edu: r.education.map((e) => [e.degree, e.school, e.startDate, e.endDate]),
    exp: r.experience.map((e) => [e.role, e.company, e.startDate, e.endDate, e.bullets.length]) }))
}
for (const [k, t] of Object.entries({
  nodeTitle: 'Jane Doe | Node.js Developer | github.com/jane\njane@example.com\nEXPERIENCE\nEngineer · Acme\n2020 – 2021',
  headless: 'Senior Engineer · Acme Corp\n- Built things.\n- Led.',
  cityRow: 'New York | 555-111-2222 | jane@example.com\nEXPERIENCE\nEngineer · Acme\n2020 – 2021',
  nameDashEmail: 'Jane Doe — jane@example.com\nEXPERIENCE\nEngineer · Acme\n2020 – 2021',
  multiTitle: 'Jane Doe | Senior Engineer | Portfolio: jane.dev\njane@example.com',
})) {
  const r = parseResumeText(t)
  console.log(k, JSON.stringify({ name: r.contact.fullName, title: r.contact.title, web: r.contact.website, exp: r.experience.map((e) => [e.role, e.company, e.bullets.length]) }))
}
