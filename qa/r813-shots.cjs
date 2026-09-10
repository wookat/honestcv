// R813: screenshot the paginated preview (pages + flow) for one fixture at the given width.
const { run } = require('./lib.cjs')
const fs = require('fs')
const H = process.env.HOME
const width = Number(process.env.W || 1280)
const fx = JSON.parse(fs.readFileSync(`${H}/qa/r812/authored-resume.json`, 'utf8'))
run(async ({ page, seed, ORIGIN, shot }) => {
  await page.goto(ORIGIN + '/builder', { waitUntil: 'domcontentloaded' })
  const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
  try {
    for (const view of ['pages', 'flow']) {
      await seed({ 'honestcv.resume': { ...fx, templateId: process.env.TPL || 'classic' }, 'honestcv.previewView': view })
      await page.goto(ORIGIN + '/builder', { waitUntil: 'domcontentloaded' })
      if (width < 600) {
        const btn = await page.waitForSelector('button:has-text("Preview")', { timeout: 20000 })
        await btn.click()
      }
      await page.waitForSelector('[data-resume-preview]', { timeout: 20000 })
      for (let k = 0; k < 60; k++) {
        if (await page.evaluate(() => /Resume length: [\d.]+ page/.test(document.body.innerText))) break
        await page.waitForTimeout(500)
      }
      const info = await page.evaluate(() => {
        const first = document.querySelector('[data-resume-preview]')
        const r = first.getBoundingClientRect()
        const meter = (document.body.innerText.match(/Resume length: [\d.]+ pages?/) || [''])[0]
        const label = first.getAttribute('aria-label')
        const frames = document.querySelectorAll('[aria-label^="Resume preview page"]').length
        const wide = [...first.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > r.right + 1 && getComputedStyle(e).position !== 'absolute').length
        return { label, frames, meter, frameW: Math.round(r.width), docW: document.documentElement.scrollWidth, wideEls: wide }
      })
      console.log(view, JSON.stringify(info))
      const el = await page.$('[data-resume-preview]')
      await el.scrollIntoViewIfNeeded()
      await shot(`r813-${view}-${width}`)
    }
  } finally {
    await page.evaluate((b) => {
      localStorage.clear()
      for (const [k, v] of Object.entries(b)) localStorage.setItem(k, v)
    }, before)
  }
}, { width, height: width < 600 ? 800 : 900, tag: 'r813' })
