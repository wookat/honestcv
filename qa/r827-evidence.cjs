// R827 evidence: every MonthYearField picker popover on /builder — open it, measure its rect against the
// viewport, list the controls that fall outside, close with Escape. W=375 (default) | 1024 | 1280
const { run } = require('/home/ubuntu/qa/lib.cjs')
const fs = require('fs')
const fixture = JSON.parse(fs.readFileSync(process.env.HOME + '/qa/r815/all-sections.json', 'utf8'))
const width = Number(process.env.W || 375)

run(async ({ page, cdp, shot, seed, ORIGIN }) => {
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
  try {
    await seed({ 'honestcv.resume': fixture })
    await page.goto(ORIGIN + '/builder', { waitUntil: 'networkidle' })
    await page.waitForSelector('main', { timeout: 15000 })
    await page.waitForTimeout(800)
    // expand collapsed optional sections so every date field mounts
    for (const h of await page.$$('main section > button[aria-expanded="false"]')) { await h.click().catch(() => {}); await page.waitForTimeout(100) }
    const n = await page.$$eval('button[aria-label="Open date picker"]', (b) => b.length)
    console.log(`\n## /builder @${width} pickers=${n}`)
    let bad = 0
    for (let i = 0; i < n; i++) {
      const btns = await page.$$('button[aria-label="Open date picker"]')
      const btn = btns[i]
      if (!btn) break
      await btn.scrollIntoViewIfNeeded()
      await btn.click()
      await page.waitForTimeout(150)
      const r = await page.evaluate(() => {
        const open = document.querySelector('button[aria-label="Close date picker"]')
        const pop = open?.nextElementSibling
        if (!pop) return null
        const pr = pop.getBoundingClientRect()
        const input = open.previousElementSibling
        const ir = input.getBoundingClientRect()
        const section = input.closest('section')?.querySelector('h2,h3')?.textContent?.trim().slice(0, 18) || '?'
        const out = [...pop.querySelectorAll('button')]
          .map((b) => ({ t: (b.getAttribute('aria-label') || b.textContent).trim(), r: b.getBoundingClientRect() }))
          .filter((x) => x.r.left < 0 || x.r.right > innerWidth)
          .map((x) => `${x.t}@${Math.round(x.r.left)}..${Math.round(x.r.right)}`)
        return {
          section, name: input.getAttribute('aria-label') || input.id, box: Math.round(ir.width), ix: Math.round(ir.left),
          left: Math.round(pr.left), right: Math.round(pr.right), w: Math.round(pr.width), vw: innerWidth, sw: document.documentElement.scrollWidth, out,
        }
      })
      if (!r) { console.log(`?? picker ${i} did not open`); continue }
      const fail = r.left < 0 || r.right > r.vw
      if (fail) bad++
      console.log(`${fail ? 'OUT' : ' ok'} ${r.section.padEnd(18)} ${String(r.name).padEnd(22)} input x=${r.ix} w=${r.box} popover ${r.left}..${r.right} (w=${r.w}) vw=${r.vw} sw=${r.sw} ${r.out.length ? 'outside: ' + r.out.join(' ') : ''}`)
      if (fail && bad === 1) await shot(`picker-out-${width}`)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(100)
    }
    console.log(`## @${width} pickers=${n} outside-viewport=${bad}`)
  } finally {
    await page.evaluate((b) => { localStorage.clear(); for (const [k, v] of Object.entries(b)) localStorage.setItem(k, v) }, before)
  }
}, { tag: 'r827', width, height: width < 640 ? 667 : 800 })
