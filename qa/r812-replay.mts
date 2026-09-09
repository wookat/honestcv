// R812: replay the 186 retained texts against the frozen R811 parser (/home/ubuntu/qa/r812-wt)
// and print every difference.
// Run: npx vite-node qa/r812-replay.mts
import { readFileSync } from 'node:fs'
import { parseResumeText } from '../src/lib/importText'
import { parseResumeText as parseOld } from '../../../qa/r812-wt/src/lib/importText'

const texts: Record<string, string> = {}
for (const k of Object.keys(JSON.parse(readFileSync('/home/ubuntu/qa/r776-text-replay.json', 'utf8'))))
  texts[`text:${k}`] = readFileSync(k, 'utf8')
const pdf = JSON.parse(readFileSync('/home/ubuntu/qa/r786-extract-after.json', 'utf8')) as Record<string, string>
for (const k of Object.keys(pdf)) texts[`pdf:${k}`] = pdf[k]
const strip = (v: unknown) => {
  const r = v as { customSections: { id: string; title: string }[]; sectionOrder: string[] }
  const titles = new Map(r.customSections.map((s) => [`custom:${s.id}`, `custom:${s.title.toLowerCase()}`]))
  return JSON.stringify({ ...r, sectionOrder: r.sectionOrder.map((k) => titles.get(k) ?? k) }, (k, x) => (k === 'id' ? undefined : x))
}
const edu = (r: ReturnType<typeof parseResumeText>) =>
  r.education.map((e) => [e.degree, e.school, e.startDate, e.endDate, e.details.slice(0, 70)])

let same = 0
const changed: string[] = []
for (const k of Object.keys(texts).sort()) {
  const a = parseOld(texts[k]), b = parseResumeText(texts[k])
  if (strip(a) === strip(b)) { same++; continue }
  changed.push(k)
  console.log(`CHANGED ${k}`)
  const ab = a.experience.flatMap((e) => e.bullets), bb = b.experience.flatMap((e) => e.bullets)
  console.log(`  bullets ${ab.length} → ${bb.length}`)
  for (const x of ab.filter((x) => !bb.includes(x))) console.log('  -', JSON.stringify(x.slice(0, 110)))
  for (const x of bb.filter((x) => !ab.includes(x))) console.log('  +', JSON.stringify(x.slice(0, 110)))
}
console.log(`identical ${same}/${Object.keys(texts).length}; changed ${changed.length}`)
