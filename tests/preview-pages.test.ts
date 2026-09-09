import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ResumePreview } from '../src/components/ResumePreview'
import { FONT_SCALE, sampleResume, type Resume } from '../src/lib/resume'

/** CSS px per PDF point — the page frames are 96dpi Letter/A4, the export lays text out in pt. */
const PX_PER_PT = 96 / 72

const render = (r: Resume, props: { paginated?: boolean; view?: 'pages' | 'flow' } = {}) =>
  renderToStaticMarkup(createElement(ResumePreview, { resume: r, ...props }))
/** The `zoom` of the content column inside the first page window / flow page / card. */
const contentZoom = (html: string) => {
  const m = html.match(/style="[^"]*\bzoom:([\d.]+)/)
  if (!m) throw new Error('no zoom in ' + html.slice(0, 200))
  return Number(m[1])
}

describe('R813: paginated preview lays text out in PDF points', () => {
  for (const fontScale of ['xs', 'm', 'xl'] as const) {
    const r: Resume = { ...sampleResume(), fontScale }
    it(`page frames zoom the content by 96/72 × ${fontScale} text size`, () => {
      const html = render(r, { paginated: true })
      expect(html).toContain('Resume preview page 1 of')
      expect(contentZoom(html)).toBeCloseTo(FONT_SCALE[fontScale] * PX_PER_PT, 4)
    })
    it(`the continuous flow view uses the same geometry (${fontScale})`, () => {
      const html = render(r, { paginated: true, view: 'flow' })
      expect(html).toContain('Resume preview (continuous)')
      expect(contentZoom(html)).toBeCloseTo(FONT_SCALE[fontScale] * PX_PER_PT, 4)
    })
  }
  it('the unpaginated card (thumbnails) keeps its own text scale', () => {
    const html = render({ ...sampleResume(), fontScale: 'l' })
    expect(html).toContain('aria-label="Resume preview"')
    expect(contentZoom(html)).toBeCloseTo(FONT_SCALE.l, 4)
  })
})
