const { run } = require('./lib.cjs')
const fs = require('fs')
const H = process.env.HOME
const fx = JSON.parse(fs.readFileSync(`${H}/qa/r813/${process.env.FX || 'kenneth'}.json`, 'utf8'))
const V = {
  m: {
    fontScale: 'm',
    lineSpacing: 'normal',
    pageMargins: 'normal',
    sectionSpacing: 'normal',
  },
  xl: {
    fontScale: 'xl',
    lineSpacing: 'loose',
    pageMargins: 'wide',
    sectionSpacing: 'xroomy',
  },
  xs: {
    fontScale: 'xs',
    lineSpacing: 'xtight',
    pageMargins: 'narrow',
    sectionSpacing: 'tight',
  },
}
const P = Number(process.env.P || 4)
const S = Number(process.env.S || 4)
const CLIP = Number(process.env.CLIP || 24)
run(async ({ page, seed, ORIGIN }) => {
  await page.goto(ORIGIN + '/builder', { waitUntil: 'domcontentloaded' })
  const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
  try {
    await seed({
      'honestcv.resume': {
        ...fx,
        templateId: process.env.TPL || 'classic',
        ...V[process.env.V || 'm'],
      },
      'honestcv.previewView': 'pages',
    })
    await page.goto(ORIGIN + '/builder', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[aria-label^="Resume preview page 1 of"]', {
      timeout: 20000,
    })
    await page.waitForTimeout(2000)
    const cdp = await page.context().newCDPSession(page)
    const DSF = Number(process.env.DSF || 1)
    if (DSF !== 1) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1280,
        height: 800,
        deviceScaleFactor: DSF,
        mobile: false,
      })
      await page.waitForTimeout(1500)
    }
    const needle = process.env.NEEDLE || 'Education'
    console.log(
      'dpr',
      await page.evaluate(() => devicePixelRatio),
      'tops',
      JSON.stringify(
        await page.evaluate((needle) => {
          const frames = [...document.querySelectorAll('[aria-label^="Resume preview page"]')]
          return frames.map((f) => {
            const inner = f.querySelector('[data-resume-page-window]').firstElementChild
              .firstElementChild
            const ir = inner.getBoundingClientRect()
            const scale = ir.width / inner.offsetWidth
            const walker = document.createTreeWalker(inner, NodeFilter.SHOW_TEXT)
            const range = document.createRange()
            for (let n = walker.nextNode(); n; n = walker.nextNode())
              if (n.textContent.trim() === needle) {
                range.selectNodeContents(n)
                const rc = range.getClientRects()[0]
                return +((rc.top - ir.top) / scale).toFixed(2)
              }
          })
        }, needle),
      ),
      'starts',
      JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll('[aria-label^="Resume preview page"]')].map(
            (f) =>
              +(f
                .querySelector('[data-resume-page-window]')
                .firstElementChild.firstElementChild.style.transform.match(/-([\d.]+)px/) || [
                0, 0,
              ])[1],
          ),
        ),
      ),
    )
    const grab = async (p, edge) => {
      const f = page.locator(`[aria-label^="Resume preview page ${p} of"]`)
      await f.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      const box = await f.evaluate((el) => {
        const w = el
          .querySelector('[data-resume-page-window]')
          .firstElementChild.getBoundingClientRect()
        return {
          l: w.left,
          t: w.top,
          b: w.bottom,
          r: w.right,
          vw: innerWidth,
          vh: innerHeight,
        }
      })
      const out = `${H}/qa/r814/shots/${process.env.TAG || 'shot'}-${process.env.FX}-${process.env.TPL}-${process.env.V}-p${p}-${edge}.png`
      const y = edge === 'bottom' ? box.b : box.t
      await page.screenshot({
        path: out,
        clip: {
          x: box.l,
          y: y - CLIP / 2,
          width: Math.min(Number(process.env.CW || 260), box.r - box.l),
          height: CLIP,
        },
      })
      fs.writeFileSync(out + '.json', JSON.stringify(box))
      return out
    }
    console.log(await grab(P, 'bottom'))
    console.log(await grab(P + 1, 'top'))
  } finally {
    await page.evaluate((b) => {
      localStorage.clear()
      for (const [k, v] of Object.entries(b)) localStorage.setItem(k, v)
    }, before)
  }
})
