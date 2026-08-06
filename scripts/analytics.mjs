/**
 * Traffic report for cv.zalize.com from Cloudflare Web Analytics (RUM).
 * The zalize.com zone has Web Analytics auto-install enabled, so pageloads on
 * cv.zalize.com are collected without a manual beacon snippet.
 *
 * Usage: CLOUDFLARE_API_TOKEN=<token with Account Analytics read> node scripts/analytics.mjs [days]
 * Prints per-day PV (pageloads) + UV (visits) and top paths.
 */
const ACCOUNT = 'ddff52d24ee44e21a021c15eaffcc86d'
const HOST = 'cv.zalize.com'
const token = process.env.CLOUDFLARE_API_TOKEN
if (!token) throw new Error('Set CLOUDFLARE_API_TOKEN')

const days = Number(process.argv[2] ?? 14)
const end = new Date()
const start = new Date(end.getTime() - days * 86400_000)
const d = (x) => x.toISOString().slice(0, 10)

const query = `query($acc:String!,$start:Date!,$end:Date!){
  viewer{accounts(filter:{accountTag:$acc}){
    byDay:rumPageloadEventsAdaptiveGroups(limit:100,filter:{date_geq:$start,date_leq:$end,requestHost:"${HOST}"},orderBy:[date_ASC]){
      count sum{visits} dimensions{date}
    }
    byPath:rumPageloadEventsAdaptiveGroups(limit:25,filter:{date_geq:$start,date_leq:$end,requestHost:"${HOST}"},orderBy:[count_DESC]){
      count sum{visits} dimensions{requestPath}
    }
  }}
}`

const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify({ query, variables: { acc: ACCOUNT, start: d(start), end: d(end) } }),
})
const body = await res.json()
if (body.errors) throw new Error(JSON.stringify(body.errors))
const acc = body.data.viewer.accounts[0]

let pv = 0
let uv = 0
console.log(`\n${HOST} — last ${days} days\n`)
console.log('date        PV    UV')
for (const row of acc.byDay) {
  pv += row.count
  uv += row.sum.visits
  console.log(`${row.dimensions.date}  ${String(row.count).padStart(4)}  ${String(row.sum.visits).padStart(4)}`)
}
console.log(`TOTAL       ${String(pv).padStart(4)}  ${String(uv).padStart(4)}\n`)
console.log('top paths (PV / UV):')
for (const row of acc.byPath) {
  console.log(`  ${row.dimensions.requestPath}  ${row.count} / ${row.sum.visits}`)
}

// Email leads collected in KV (waitlist + free-download subscribes)
const KV_ID = '580004279c364a678ad3eeaf4f604425'
const kvToken = process.env.CLOUDFLARE_WORKERS_API_TOKEN ?? token

// First-party pageview hits (adblock-proof /api/hit beacon), keyed hit:<day>:<ts>
{
  const byDayFP = new Map()
  let cur = ''
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
      break
    }
    for (const k of kv.result) {
      const day = k.name.split(':')[1]
      if (day >= d(start)) byDayFP.set(day, (byDayFP.get(day) ?? 0) + 1)
    }
    cur = kv.result_info?.cursor ?? ''
    if (cur === '') {
      console.log('\nfirst-party hits (adblock-proof beacon):')
      for (const [day, n] of [...byDayFP].sort()) console.log(`  ${day}  ${n}`)
      if (byDayFP.size === 0) console.log('  none yet')
    }
  } while (cur)
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
