// R814: 375px pass — Pages page count / bisected lines at each boundary, then Flow markers vs Pages starts.
const { run } = require('./lib.cjs')
const fs = require('fs')
const H = process.env.HOME
const fixtures = {
  authored: JSON.parse(fs.readFileSync(`${H}/qa/r812/authored-resume.json`, 'utf8')),
  kenneth: JSON.parse(fs.readFileSync(`${H}/qa/r813/kenneth.json`, 'utf8')),
  sumit: JSON.parse(fs.readFileSync(`${H}/qa/r813/sumit.json`, 'utf8')),
}
const variants = {
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
const rows = [
  ['authored', 'classic', 'xl'],
  ['kenneth', 'modern', 'xs'],
  ['authored', 'sidebar', 'xs'],
  ['sumit', 'classic', 'm'],
  ['kenneth', 'classic', 'm'],
]
const width = Number(process.env.W || 375)
run(
  async ({ page, seed, ORIGIN, cdp }) => {
    if (width < 1024) await cdp.send('Emulation.setScrollbarsHidden', { hidden: true })
    await page.goto(ORIGIN + '/builder', { waitUntil: 'domcontentloaded' })
    const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push('pageerror ' + e.message))
    try {
      for (const [fname, tpl, v] of rows) {
        const r = { ...fixtures[fname], templateId: tpl, ...variants[v] }
        const got = {}
        for (const view of ['pages', 'flow']) {
          await seed({ 'honestcv.resume': r, 'honestcv.previewView': view })
          await page.goto(ORIGIN + '/builder', {
            waitUntil: 'domcontentloaded',
          })
          if (width < 1024) {
            await page.click('[data-pane-switcher] button:has-text("Preview")')
          }
          const sel =
            view === 'pages'
              ? '[aria-label^="Resume preview page 1 of"]'
              : '[aria-label="Resume preview (continuous)"]'
          await page.waitForSelector(sel, { timeout: 20000 })
          let meterText = ''
          for (let k = 0; k < 80; k++) {
            meterText = await page.evaluate(
              () => (document.body.innerText.match(/Resume length: ([\d.]+) page/) || [])[1] || '',
            )
            if (meterText) break
            await page.waitForTimeout(500)
          }
          await page.waitForTimeout(1500)
          got[view] = await page.evaluate((view) => {
            const out = {
              meter: (document.body.innerText.match(/Resume length: ([\d.]+) page/) || [])[1],
              scrollW: document.documentElement.scrollWidth,
              vw: visualViewport.width,
              zoom: '',
            }
            if (view === 'pages') {
              const frames = [...document.querySelectorAll('[aria-label^="Resume preview page"]')]
              out.pages = frames.length
              out.labels = frames.map((f) => f.getAttribute('aria-label'))
              out.starts = frames.map((f) => {
                const inner = f.querySelector('[data-resume-page-window]').firstElementChild
                  .firstElementChild
                const m = /-(\d+(?:\.\d+)?)px/.exec(inner.style.transform || '')
                return m ? +Number(m[1]).toFixed(2) : 0
              })
              const first = frames[0].querySelector('[data-resume-page-window]').firstElementChild
              out.frameW = frames[0]
                .querySelector('[data-resume-page-window]')
                .getBoundingClientRect().width
              out.zoom = getComputedStyle(first.firstElementChild.firstElementChild).zoom
              out.bisected = 0
              out.samples = []
              frames.forEach((f, i) => {
                if (i + 1 === frames.length) return
                const clip = f.querySelector('[data-resume-page-window]').firstElementChild
                const cb = clip.getBoundingClientRect().bottom
                const walker = document.createTreeWalker(clip, NodeFilter.SHOW_TEXT)
                const range = document.createRange()
                for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                  if (!n.textContent.trim()) continue
                  range.selectNodeContents(n)
                  for (const rc of range.getClientRects()) {
                    if (rc.height > 0 && rc.top < cb - 0.5 && rc.bottom > cb + 0.5) {
                      out.bisected++
                      if (out.samples.length < 3)
                        out.samples.push(`p${i + 1}:${n.textContent.trim().slice(0, 30)}`)
                      break
                    }
                  }
                }
              })
            } else {
              const flow = document.querySelector('[aria-label="Resume preview (continuous)"]')
              out.pageLabels = document.querySelectorAll(
                '[aria-label^="Resume preview page"]',
              ).length
              const marks = [...flow.querySelectorAll('.border-dashed')]
              out.markers = marks.map((m) => +parseFloat(m.style.top).toFixed(2))
              const content = flow.querySelector('[data-resume-preview]') || flow.firstElementChild
              out.zoom = getComputedStyle(document.querySelector('[data-resume-preview]')).zoom
              out.text = flow.innerText.length
            }
            return out
          }, view)
        }
        const pad =
          got.flow.markers.length && got.pages.starts.length > 1
            ? +(got.flow.markers[0] - got.pages.starts[1]).toFixed(2)
            : null
        const aligned =
          got.flow.markers.length === got.pages.starts.length - 1 &&
          got.flow.markers.every((m, i) => Math.abs(m - pad - got.pages.starts[i + 1]) < 0.02)
        console.log(
          `${fname} ${tpl} ${v} @${width}: meter=${got.pages.meter}/${got.flow.meter} pages=${got.pages.pages} bisected=${got.pages.bisected} ${got.pages.samples.join('|')} zoom=${got.pages.zoom}/${got.flow.zoom} frameW=${got.pages.frameW.toFixed(1)} scrollW=${got.pages.scrollW} vw=${got.pages.vw} starts=${JSON.stringify(got.pages.starts)} flowMarkers=${JSON.stringify(got.flow.markers)} pad=${pad} aligned=${aligned} flowPageLabels=${got.flow.pageLabels}`,
        )
      }
    } finally {
      await page.evaluate((b) => {
        localStorage.clear()
        for (const [k, v] of Object.entries(b)) localStorage.setItem(k, v)
      }, before)
      const after = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
      console.log('storage restored:', JSON.stringify(after) === JSON.stringify(before))
      if (width < 1024) await cdp.send('Emulation.setScrollbarsHidden', { hidden: false })
      console.log('errors', errors)
    }
  },
  { width, height: width < 1024 ? 667 : 800 },
)
