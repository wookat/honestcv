// R734 evidence: how many real ads repeat a whole paragraph / sentence verbatim,
// and how many of the current 30 keywords those repeats manufacture.
import { readFileSync } from 'node:fs'
import { extractKeywords } from '/home/ubuntu/repos/honestcv/src/lib/ats.ts'
const jds = JSON.parse(readFileSync('/home/ubuntu/qa/r723-jds.json', 'utf8')) as { company: string; title: string; desc: string }[]
const perk = JSON.parse(readFileSync('/home/ubuntu/qa/r733-perk-jd.json', 'utf8'))
jds.push({ company: perk.company, title: perk.title, desc: perk.description })
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
let adsWithDup = 0
for (const j of jds) {
  const paras = j.desc.split(/\n+/).map(norm).filter((p) => p.split(' ').length >= 8)
  const seen = new Map<string, number>()
  for (const p of paras) seen.set(p, (seen.get(p) ?? 0) + 1)
  const dups = [...seen.entries()].filter(([, n]) => n > 1)
  if (dups.length === 0) continue
  adsWithDup++
  const dedup = j.desc.split(/\n+/).filter((line, i, arr) => arr.findIndex((l) => norm(l) === norm(line)) === i).join('\n')
  const before = extractKeywords(j.desc, 30, j.company)
  const after = extractKeywords(dedup, 30, j.company)
  const gone = before.filter((k) => !after.includes(k))
  const added = after.filter((k) => !before.includes(k))
  console.log(`${j.company} | ${j.title}: ${dups.length} repeated paragraph(s) (${dups.map(([p, n]) => `${p.split(' ').length}w×${n}`).join(', ')})`)
  console.log(`   gone (${gone.length}): ${gone.join(' ')}`)
  console.log(`   added (${added.length}): ${added.join(' ')}`)
}
console.log({ ads: jds.length, adsWithDup })
