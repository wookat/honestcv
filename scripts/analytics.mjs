/**
 * Traffic report for cv.zalize.com from first-party analytics in KV.
 * (Cloudflare Web Analytics/RUM produced zero rows for this host and its
 * beacon was removed — the first-party /api/hit beacon plus ev:* funnel
 * counters are the single source of truth.)
 *
 * Usage: CLOUDFLARE_API_TOKEN=<token> node scripts/analytics.mjs [days]
 */
const ACCOUNT = 'ddff52d24ee44e21a021c15eaffcc86d'
const token = process.env.CLOUDFLARE_API_TOKEN
if (!token) throw new Error('Set CLOUDFLARE_API_TOKEN')

const days = Number(process.argv[2] ?? 14)
const end = new Date()
const start = new Date(end.getTime() - days * 86400_000)
const d = (x) => x.toISOString().slice(0, 10)

console.log(`\ncv.zalize.com — last ${days} days (first-party)\n`)

// Email leads collected in KV (waitlist + free-download subscribes)
const KV_ID = '580004279c364a678ad3eeaf4f604425'
const kvToken = process.env.CLOUDFLARE_WORKERS_API_TOKEN ?? token

// Daily funnel counters (ev:<day>:<event>) — distinct browsers per day
{
  let cur = ''
  const rows = []
  do {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${KV_ID}/keys`
    )
    url.searchParams.set('prefix', 'ev:')
    url.searchParams.set('limit', '1000')
    if (cur) url.searchParams.set('cursor', cur)
    const kv = await (
      await fetch(url, { headers: { authorization: `Bearer ${kvToken}` } })
    ).json()
    if (!kv.success) {
      console.log(`funnel events: unavailable (${JSON.stringify(kv.errors)})`)
      break
    }
    rows.push(...kv.result.map((k) => k.name))
    cur = kv.result_info?.cursor ?? ''
  } while (cur)
  const inRange = rows.filter((k) => k.split(':')[1] >= d(start))
  if (inRange.length === 0) {
    console.log('funnel events: none yet')
  } else {
    console.log('funnel events (day event count — distinct browsers/day):')
    for (const key of inRange.sort()) {
      const [, day, event] = key.split(':')
      const n = await (
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${KV_ID}/values/${encodeURIComponent(key)}`,
          { headers: { authorization: `Bearer ${kvToken}` } }
        )
      ).text()
      console.log(`  ${day}  ${event}  ${n}`)
    }
  }
}

// First-party pageview hits (adblock-proof /api/hit beacon), keyed hit:<day>:<ts>
{
  const byDayFP = new Map()
  const inRange = []
  let cur = ''
  let failed = false
  do {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${KV_ID}/keys`
    )
    url.searchParams.set('prefix', 'hit:')
    url.searchParams.set('limit', '1000')
    if (cur) url.searchParams.set('cursor', cur)
    const kv = await (
      await fetch(url, { headers: { authorization: `Bearer ${kvToken}` } })
    ).json()
    if (!kv.success) {
      console.log(`\nfirst-party hits: unavailable (${JSON.stringify(kv.errors)})`)
      failed = true
      break
    }
    for (const k of kv.result) {
      const day = k.name.split(':')[1]
      if (day >= d(start)) {
        byDayFP.set(day, (byDayFP.get(day) ?? 0) + 1)
        inRange.push(k.name)
      }
    }
    cur = kv.result_info?.cursor ?? ''
  } while (cur)
  if (!failed) {
    // Pulse days: a single day far above the window's typical day is almost
    // always an internal walkthrough that forgot the QA flag, not organic
    // traffic. Flag (never delete) so the export reads honestly.
    const counts = [...byDayFP.values()].sort((a, b) => a - b)
    const median = counts.length ? counts[Math.floor(counts.length / 2)] : 0
    const pulseMin = Math.max(50, median * 5)
    const isPulse = (n) => n >= pulseMin
    let pulseTotal = 0
    console.log(`\nfirst-party hits (adblock-proof beacon; ⚠ = pulse day ≥ ${pulseMin}, likely unflagged internal QA):`)
    for (const [day, n] of [...byDayFP].sort()) {
      if (isPulse(n)) pulseTotal += n
      console.log(`  ${day}  ${n}${isPulse(n) ? '  ⚠ pulse' : ''}`)
    }
    if (byDayFP.size === 0) console.log('  none yet')
    else {
      const total = counts.reduce((a, b) => a + b, 0)
      console.log(`  total ${total}, of which ${pulseTotal} on pulse days → ${total - pulseTotal} on ordinary days`)
    }
    // Per-path breakdown needs the values; cap reads to keep the report fast.
    const sample = inRange.slice(-2000)
    const byPath = new Map()
    const byRef = new Map()
    for (const key of sample) {
      const v = await (
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${KV_ID}/values/${encodeURIComponent(key)}`,
          { headers: { authorization: `Bearer ${kvToken}` } }
        )
      ).text()
      try {
        const rec = JSON.parse(v)
        const p = rec.p ?? '(unknown)'
        if (p.startsWith('/qa-')) continue // internal QA pages
        byPath.set(p, (byPath.get(p) ?? 0) + 1)
        if (rec.r) byRef.set(rec.r, (byRef.get(rec.r) ?? 0) + 1)
      } catch {
        byPath.set('(unparsed)', (byPath.get('(unparsed)') ?? 0) + 1)
      }
    }
    if (byPath.size > 0) {
      console.log('  top paths (first-party):')
      for (const [p, n] of [...byPath].sort((a, b) => b[1] - a[1]).slice(0, 15))
        console.log(`    ${p}  ${n}`)
    }
    if (byRef.size > 0) {
      console.log('  top referrers (first-party):')
      for (const [r, n] of [...byRef].sort((a, b) => b[1] - a[1]).slice(0, 15))
        console.log(`    ${r}  ${n}`)
    } else {
      console.log('  referrers: none recorded yet')
    }
  }
}
let cursor = ''
let leads = 0
do {
  const url = new URL(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${KV_ID}/keys`
  )
  url.searchParams.set('prefix', 'lead:')
  url.searchParams.set('limit', '1000')
  if (cursor) url.searchParams.set('cursor', cursor)
  const kv = await (
    await fetch(url, { headers: { authorization: `Bearer ${kvToken}` } })
  ).json()
  if (!kv.success) {
    console.log(`\nleads: unavailable (${JSON.stringify(kv.errors)})`)
    break
  }
  leads += kv.result.length
  cursor = kv.result_info?.cursor ?? ''
  if (cursor === '') console.log(`\nemail leads collected: ${leads}`)
} while (cursor)
