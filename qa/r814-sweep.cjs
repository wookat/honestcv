// R814: 63-row sweep — page count vs meter plus, at every page boundary, whether a text
// line box is bisected by the frame's visible bottom (R813 QA finding). Any origin.
const { run } = require('./lib.cjs')
const fs = require('fs')
const H = process.env.HOME
const fixtures = {
  authored: JSON.parse(fs.readFileSync(`${H}/qa/r812/authored-resume.json`, 'utf8')),
  ...Object.fromEntries(
    ['sumit', 'oxford', 'kenneth', 'giovanni', 'bhu', 'alex'].map((n) => [
      n,
      JSON.parse(fs.readFileSync(`${H}/qa/r813/${n}.json`, 'utf8')),
    ]),
  ),
}
const templates = ['classic', 'modern', 'sidebar']
const variants = [
  {
    fontScale: 'm',
    lineSpacing: 'normal',
    pageMargins: 'normal',
    sectionSpacing: 'normal',
  },
  {
    fontScale: 'xl',
    lineSpacing: 'loose',
    pageMargins: 'wide',
    sectionSpacing: 'xroomy',
  },
  {
    fontScale: 'xs',
    lineSpacing: 'xtight',
    pageMargins: 'narrow',
    sectionSpacing: 'tight',
  },
]
const tag = process.env.TAG || 'r814'
run(async ({ page, seed, ORIGIN }) => {
  await page.goto(ORIGIN + '/builder', { waitUntil: 'domcontentloaded' })
  const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
  const out = []
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push('pageerror ' + e.message))
  try {
    for (const [fname, fx] of Object.entries(fixtures)) {
      for (const template of templates) {
        for (const v of variants) {
          const r = { ...fx, templateId: template, ...v }
          await seed({ 'honestcv.resume': r, 'honestcv.previewView': 'pages' })
          await page.goto(ORIGIN + '/builder', {
            waitUntil: 'domcontentloaded',
          })
          await page.waitForSelector('[aria-label^="Resume preview page 1 of"]', { timeout: 20000 })
          let meterText = ''
          for (let k = 0; k < 80; k++) {
            meterText = await page.evaluate(
              () => (document.body.innerText.match(/Resume length: ([\d.]+) page/) || [])[1] || '',
            )
            if (meterText) break
            await page.waitForTimeout(500)
          }
          await page.waitForTimeout(400)
          const res = await page.evaluate(() => {
            const frames = [...document.querySelectorAll('[aria-label^="Resume preview page"]')]
            const preview = frames.length
            let bisected = 0
            let shownH = []
            const samples = []
            frames.forEach((f, i) => {
              const win = f.querySelector('[data-resume-page-window]')
              const clip = win.firstElementChild
              const cb = clip.getBoundingClientRect().bottom
              shownH.push(Math.round(clip.offsetHeight))
              if (i + 1 === frames.length) return
              const walker = document.createTreeWalker(clip, NodeFilter.SHOW_TEXT)
              const range = document.createRange()
              for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                if (!n.textContent.trim()) continue
                range.selectNodeContents(n)
                for (const rc of range.getClientRects()) {
                  if (rc.height > 0 && rc.top < cb - 0.5 && rc.bottom > cb + 0.5) {
                    bisected++
                    if (samples.length < 3)
                      samples.push(`p${i + 1}:${n.textContent.trim().slice(0, 30)}`)
                    break
                  }
                }
              }
            })
            return { preview, bisected, shownH, samples }
          })
          const meter = parseFloat(meterText)
          const row = { fixture: fname, template, ...v, meter, ...res }
          out.push(row)
          console.log(
            `${fname.padEnd(9)}${template.padEnd(8)}${v.fontScale.padEnd(3)} meter=${meterText.padEnd(5)} preview=${res.preview} bisected=${res.bisected} ${res.samples.join(' | ')}`,
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
  fs.writeFileSync(`${H}/qa/${tag}-sweep.json`, JSON.stringify(out, null, 2))
  const ok = out.filter((r) => !Number.isNaN(r.meter))
  const hits = ok.filter((r) => r.preview === Math.ceil(r.meter)).length
  const under = ok.filter((r) => r.preview < Math.ceil(r.meter)).length
  const boundaries = ok.reduce((a, r) => a + r.preview - 1, 0)
  const bis = ok.reduce((a, r) => a + r.bisected, 0)
  console.log(
    `rows with meter: ${ok.length}/${out.length}; page-count match ${hits}/${ok.length} (under ${under}); boundaries ${boundaries}, bisected lines ${bis} in ${ok.filter((r) => r.bisected).length} rows`,
  )
  console.log('console errors:', errors.length, JSON.stringify(errors.slice(0, 3)))
})
