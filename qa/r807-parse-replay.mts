// R804: R803 parser vs this branch on the 114 retained texts and on the 72
// R777-extractor PDF texts. Prints every file whose parse changed, per section.
import { readFileSync, writeFileSync } from 'node:fs'
import { parseResumeText as parseNew } from '../src/lib/importText'
import { parseResumeText as parseOld } from '../src/lib/_r806_importText'

const strip = (v: unknown) => {
  const r = v as { customSections: { id: string; title: string }[]; sectionOrder: string[] }
  const titles = new Map(r.customSections.map((s) => [`custom:${s.id}`, `custom:${s.title.toLowerCase()}`]))
  r.sectionOrder = r.sectionOrder.map((k) => titles.get(k) ?? k)
  return JSON.parse(JSON.stringify(v, (k, x) => (k === 'id' ? undefined : x)))
}
const texts: Record<string, string> = {}
for (const k of Object.keys(JSON.parse(readFileSync('/home/ubuntu/qa/r776-text-replay.json', 'utf8'))))
  texts[`text:${k}`] = readFileSync(k, 'utf8')
const pdf = JSON.parse(readFileSync('/home/ubuntu/qa/r786-extract-after.json', 'utf8')) as Record<string, string>
for (const k of Object.keys(pdf)) texts[`pdf:${k}`] = pdf[k]

let same = 0
const changed: string[] = []
const out: Record<string, { before: unknown; after: unknown }> = {}
for (const k of Object.keys(texts).sort()) {
  const b = strip(parseOld(texts[k]))
  const a = strip(parseNew(texts[k]))
  if (JSON.stringify(a) === JSON.stringify(b)) same++
  else {
    changed.push(k)
    out[k] = { before: b, after: a }
    const secs = Object.keys(a).filter((s) => JSON.stringify(a[s]) !== JSON.stringify(b[s]))
    console.log(`CHANGED ${k} :: ${secs.join(', ')}`)
  }
}
writeFileSync('/home/ubuntu/qa/r807-parse-replay-diff.json', JSON.stringify(out, null, 1))
console.log(`same ${same} / ${Object.keys(texts).length}; changed ${changed.length}`)
const onlyOrder = changed.filter((k) => {
  const { before, after } = out[k] as { before: Record<string, unknown>; after: Record<string, unknown> }
  return Object.keys(after).every((s) => s === 'customSections' || JSON.stringify(after[s]) === JSON.stringify(before[s]))
})
console.log(`changed only in customSections: ${onlyOrder.length} / ${changed.length}`)
