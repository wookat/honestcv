// R734 evidence: which keywords recur across many unrelated ads (pool and high-priority)?
import { readFileSync } from 'node:fs'
import { extractKeywords, highPriorityKeywords } from '/home/ubuntu/repos/honestcv/src/lib/ats.ts'
const jds = JSON.parse(readFileSync('/home/ubuntu/qa/r723-jds.json', 'utf8')) as { company: string; title: string; desc: string }[]
const pool = new Map<string, number>(), high = new Map<string, number>(), top10 = new Map<string, number>()
let hiTotal = 0, poolTotal = 0, single = 0
for (const j of jds) {
  const k = extractKeywords(j.desc, 30, j.company)
  const h = highPriorityKeywords(j.desc, k)
  poolTotal += k.length; hiTotal += h.size
  k.forEach((x, i) => { pool.set(x, (pool.get(x) ?? 0) + 1); if (i < 10) top10.set(x, (top10.get(x) ?? 0) + 1) })
  h.forEach((x) => high.set(x, (high.get(x) ?? 0) + 1))
  single += k.filter((x) => !x.includes(' ')).length
}
const fmt = (m: Map<string, number>, n = 40) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([t, c]) => `${t}×${c}`).join(' ')
console.log({ ads: jds.length, poolTotal, hiTotal, singleWordShare: (single / poolTotal).toFixed(2) })
console.log('POOL most shared:', fmt(pool))
console.log('TOP10 most shared:', fmt(top10))
console.log('HIGH most shared:', fmt(high))
