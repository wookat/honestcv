// R812: evidence — a wrapped bullet whose next visual line opens with a
// capitalised word (a product name) is read as two bullets: the R793 2 + 2
// page-bottom split in our own PDF export, and any paste that kept its line
// breaks. Lowercase / figure-led wraps already rejoin (`continuesPrevious`).
// Run: npx vite-node qa/r812-evidence.mts   (compares with the frozen R811 parser)
import { parseResumeText } from '../src/lib/importText'
import { parseResumeText as parseOld } from '../../../qa/r812-wt/src/lib/importText'
import { buildResumePdf } from '../src/lib/pdf'
import { sampleResume } from '../src/lib/resume'
import { TEMPLATES } from '../src/lib/templates'
import { pdfTextOf } from '../tests/import/helpers'

// A. paste shapes
const head = 'Jane Doe\nSenior Engineer\njane@example.com · 555-111-2222\nEXPERIENCE\nSenior Engineer · Acme Corp, Austin, TX\nJan 2020 – Dec 2021\n'
const shapes: Record<string, string> = {
  lower_wrap: '• Led the migration of the billing platform to a new\nservice mesh, cutting p99 latency by 40% for 2M users.\n• Second bullet here.',
  Capital_wrap: '• Led the migration of the billing platform to the new\nKubernetes cluster, cutting p99 latency by 40% for 2M users.\n• Second bullet here.',
  Capital_wrap_page_break: '• Led the migration of the billing platform to the new\n\nKubernetes cluster, cutting p99 latency by 40% for 2M users.\n• Second bullet here.',
  Capital_third_line: '• Led the migration of the billing platform to a new\nservice mesh and moved the ledger onto the shared\nKubernetes cluster, cutting p99 latency by 40% for 2M users.\n• Second bullet here.',
  then_header: '• Led the migration of the billing platform to the new\nKubernetes cluster, cutting p99 latency by 40% for 2M users.\nStaff Engineer · Beta Inc, Austin, TX\nJan 2018 – Dec 2019\n• Other.',
  guard_markerless_list: 'Collaborate with top management to develop and implement strategic plans to achieve\norganizational objectives\nIdentify opportunities for process optimization and implement changes to enhance efficiency\nDevelop and manage budgets for operational activities, monitoring expenses and ensuring adherence',
  guard_header_after_open_bullet: '• Shipped the billing platform and the ledger\nStaff Engineer · Beta Inc, Austin, TX\nJan 2018 – Dec 2019\n• Other.',
  guard_at_header_after_open_bullet: '• Shipped the billing platform and the ledger\nStaff Engineer at Beta Inc\nJan 2018 – Dec 2019\n• Other.',
  guard_dated_line: '• Shipped the billing platform and the ledger\nJan 2018 – Dec 2019 · Beta Inc, Austin, TX — Staff Engineer on the payments team.\n• Other.',
  guard_tag_list: '• Shipped the billing platform and the ledger\nKubernetes, Helm, Terraform, Grafana, Postgres, Kafka, Redis, Airflow, Spark\n• Other.',
}
for (const [k, v] of Object.entries(shapes)) {
  const exps = (r: ReturnType<typeof parseResumeText>) => r.experience.map((e) => [e.role, e.company, e.startDate, e.bullets.map((b) => b.slice(0, 50))])
  const a = JSON.stringify(exps(parseOld(head + v))), b = JSON.stringify(exps(parseResumeText(head + v)))
  console.log(`${k}${a === b ? '' : '  [changed]'}\n  old ${a}\n  new ${b}`)
}

// B. our own PDF export across a page bottom: bullets made of capitalised
// product names so every split lands on a capital
const src = sampleResume()
const names = ['Kafka', 'Redis', 'Postgres', 'Kubernetes', 'Terraform', 'Grafana', 'Airflow', 'Spark', 'Flink', 'Envoy']
const run = (e: number, b: number, n: number) =>
  Array.from({ length: n }, (_, k) => `${names[(e * 3 + b * 7 + k) % names.length]} ${names[(e + b + k * 3) % names.length]} adapters`).join(' beside ')
src.experience = Array.from({ length: 6 }, (_, e) => ({
  ...src.experience[0],
  id: `x${e}`,
  role: 'Senior Engineer',
  company: `Company ${String.fromCharCode(65 + e)}`,
  location: 'Austin, TX',
  startDate: `Jan ${2010 + e}`,
  endDate: `Dec ${2010 + e}`,
  bullets: Array.from({ length: 6 }, (_, b) => `Migrated job ${e + 1}-${b + 1} onto the ${run(e, b, 14 + ((e + b) % 4) * 4)} platform.`),
}))
const bullets = src.experience.flatMap((e) => e.bullets)
let oldSplit = 0, newSplit = 0
for (const t of TEMPLATES) {
  const { text } = await pdfTextOf(await buildResumePdf({ ...src, templateId: t.id }))
  const pages = text.split('\n\n').length
  const o = parseOld(text).experience.flatMap((e) => e.bullets), n = parseResumeText(text).experience.flatMap((e) => e.bullets)
  const om = bullets.filter((b) => !o.includes(b)).length, nm = bullets.filter((b) => !n.includes(b)).length
  if (om) oldSplit++
  if (nm) newSplit++
  console.log(`${t.id}: pages ${pages}; R811 ${bullets.length} → ${o.length} (${om} split); now ${bullets.length} → ${n.length} (${nm} split)`)
}
console.log(`templates with a split bullet: R811 ${oldSplit}/${TEMPLATES.length}, now ${newSplit}/${TEMPLATES.length}`)
