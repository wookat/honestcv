// R813: 7 fixtures × 3 templates × 3 typography variants — read the PDF length meter, then apply
// candidate preview geometry combos in-page and compare predicted length with the meter.
const { run } = require('./lib.cjs')
const fs = require('fs')
const H = process.env.HOME
const fixtures = {
  authored: JSON.parse(fs.readFileSync(`${H}/qa/r812/authored-resume.json`, 'utf8')),
  ...Object.fromEntries(
    ['sumit', 'oxford', 'kenneth', 'giovanni', 'bhu', 'alex'].map((n) => [n, JSON.parse(fs.readFileSync(`${H}/qa/r813/${n}.json`, 'utf8'))]),
  ),
}
const variants = [
  { fontScale: 'm', lineSpacing: 'normal', sectionSpacing: 'normal', pageMargins: 'normal' },
  { fontScale: 'xl', lineSpacing: 'loose', sectionSpacing: 'roomy', pageMargins: 'wide' },
  { fontScale: 'xs', lineSpacing: 'xtight', sectionSpacing: 'xtight', pageMargins: 'narrow' },
]
const templates = (process.env.TPLS || 'classic,modern,sidebar').split(',')
const LS = { xtight: 1.12, compact: 1.22, normal: 1.35, relaxed: 1.52, loose: 1.65 }
const PM = { narrow: 36, normal: 54, wide: 72 }
// [zoom factor, true-margin padding?, drop the +0.1 line-height?]
const combos = [
  [1, false, false],
  [4 / 3, false, false],
  [4 / 3, false, true],
  [1.25, false, true],
  [1.3, false, true],
  [1.25, true, true],
  [4 / 3, true, true],
]
const key = (c) => c.join('/')

run(async ({ page, seed, ORIGIN }) => {
  await page.goto(ORIGIN + '/builder', { waitUntil: 'domcontentloaded' })
  const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
  const out = []
  try {
    for (const [fname, fx] of Object.entries(fixtures)) {
      for (const template of templates) {
        for (const v of variants) {
          const r = { ...fx, templateId: template, ...v }
          await seed({ 'honestcv.resume': r, 'honestcv.previewView': 'pages' })
          await page.goto(ORIGIN + '/builder', { waitUntil: 'domcontentloaded' })
          await page.waitForSelector('[aria-label^="Resume preview page 1 of"]', { timeout: 20000 })
          let meterText = ''
          for (let k = 0; k < 80; k++) {
            meterText = await page.evaluate(() => (document.body.innerText.match(/Resume length: ([\d.]+) page/) || [])[1] || '')
            if (meterText) break
            await page.waitForTimeout(500)
          }
          await page.waitForTimeout(400)
          const res = await page.evaluate(({ combos, lh, marginPx }) => {
            const first = document.querySelector('[aria-label^="Resume preview page 1 of"]')
            const preview = parseInt(first.getAttribute('aria-label').match(/of (\d+)/)[1], 10)
            const win = first.querySelector('[data-resume-page-window]')
            const pad = parseFloat(getComputedStyle(win).paddingTop)
            const outer = win.firstElementChild.firstElementChild
            const styled = outer.firstElementChild
            const baseZoom = parseFloat(styled.style.zoom || '1')
            const baseLH = styled.style.lineHeight
            const baseH = win.offsetHeight
            const o = { preview, windowH: baseH - 2 * pad, pred: {} }
            for (const c of combos) {
              const [f, truePad, dropLH] = c
              styled.style.zoom = String(baseZoom * f)
              styled.style.lineHeight = dropLH ? String(lh) : baseLH
              if (truePad) win.style.padding = marginPx + 'px'
              o.pred[c.join('/')] = outer.scrollHeight / (truePad ? baseH - 2 * marginPx : o.windowH)
              win.style.padding = pad + 'px'
            }
            styled.style.zoom = String(baseZoom)
            styled.style.lineHeight = baseLH
            return o
          }, { combos, lh: LS[v.lineSpacing], marginPx: (PM[v.pageMargins] * 96) / 72 })
          const meter = parseFloat(meterText)
          const row = { fixture: fname, template, ...v, meter, preview: res.preview, pred: res.pred }
          out.push(row)
          console.log(
            `${fname.padEnd(9)}${template.padEnd(8)}${v.fontScale.padEnd(3)} meter=${meterText.padEnd(5)} preview=${res.preview} ` +
              combos.map((c) => `${key(c)}:${res.pred[key(c)].toFixed(2)}`).join(' '),
          )
        }
      }
    }
  } finally {
    await page.evaluate((b) => {
      localStorage.clear()
      for (const [k, v] of Object.entries(b)) localStorage.setItem(k, v)
    }, before)
    const after = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
    console.log('storage restored:', JSON.stringify(after) === JSON.stringify(before))
  }
  fs.writeFileSync(`${H}/qa/r813-sweep2.json`, JSON.stringify(out, null, 2))
  const ok = out.filter((r) => !Number.isNaN(r.meter))
  console.log(`rows with meter: ${ok.length}/${out.length}; current preview page-count match ${ok.filter((r) => r.preview === Math.ceil(r.meter)).length}/${ok.length}`)
  for (const c of combos) {
    const k = key(c)
    const errs = ok.map((r) => r.pred[k] - r.meter)
    const hits = ok.filter((r) => Math.ceil(r.pred[k] - 1e-6) === Math.ceil(r.meter)).length
    const under = ok.filter((r) => Math.ceil(r.pred[k] - 1e-6) < Math.ceil(r.meter)).length
    const mae = errs.reduce((a, b) => a + Math.abs(b), 0) / errs.length
    console.log(`combo ${k}: page-count match ${hits}/${ok.length} (under ${under}), mean|err| ${mae.toFixed(2)}, bias ${(errs.reduce((a, b) => a + b, 0) / errs.length).toFixed(2)}`)
  }
}, { width: 1280, height: 800, tag: 'r813' })
