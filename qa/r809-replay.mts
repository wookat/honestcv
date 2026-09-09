// R809: replay the 186 retained texts against the frozen R808 parser (/home/ubuntu/qa/r809-wt)
// and print every education difference.
// Run: npx vite-node qa/r809-replay.mts
import { readFileSync } from 'node:fs'
import { parseResumeText } from '../src/lib/importText'
import { parseResumeText as parseOld } from '../../../qa/r809-wt/src/lib/importText'

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
  const onlyEdu = strip({ ...a, education: [] }) === strip({ ...b, education: [] })
  console.log(`CHANGED ${k} (${onlyEdu ? 'education only' : 'OTHER FIELDS TOO'})`)
  console.log('  old', JSON.stringify(edu(a)))
  console.log('  new', JSON.stringify(edu(b)))
}
console.log(`identical ${same}/${Object.keys(texts).length}; changed ${changed.length}`)
