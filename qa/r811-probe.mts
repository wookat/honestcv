// R811: synthetic probe — bare-city contact rows without a name (A–C, I) and
// non-English document titles over the name (D–H). Run: npx vite-node qa/r811-probe.mts
import { parseResumeText } from '@/lib/importText'
const shapes: Record<string, string> = {
  A_bare_city_contact_no_name: `New York | 555-010-0000 | jane@example.com
EXPERIENCE
Engineer · Acme
2019 – 2020
- Did things.`,
  B_city_st_contact_no_name: `Austin, TX | 555-010-0000 | jane@example.com
EXPERIENCE
Engineer · Acme
2019 – 2020
- Did things.`,
  C_name_then_bare_city_contact: `Jane Doe
New York | 555-010-0000 | jane@example.com
EXPERIENCE
Engineer · Acme
2019 – 2020`,
  D_lebenslauf: `Lebenslauf
Jane Doe
jane@example.com
EXPERIENCE
Engineer · Acme
2019 – 2020`,
  E_cv_fr: `Curriculum Vitæ
Jane Doe
jane@example.com`,
  F_hoja_de_vida: `Hoja de Vida
Jane Doe
jane@example.com`,
  G_curriculo_pt: `Currículo
Jane Doe
jane@example.com`,
  H_cv_es: `Currículum Vitae
Jane Doe
jane@example.com`,
  I_bare_city_line_under_name: `Jane Doe
New York
jane@example.com
EXPERIENCE
Engineer · Acme
2019 – 2020`,
}
for (const [k, t] of Object.entries(shapes)) {
  const r = parseResumeText(t)
  console.log(
    k,
    JSON.stringify({
      name: r.contact.fullName,
      title: r.contact.title,
      loc: r.contact.location,
      email: r.contact.email,
      phone: r.contact.phone,
      summary: r.summary,
      exp: r.experience.map((e) => [e.role, e.company, e.startDate, e.endDate, e.bullets.length]),
    }),
  )
}
