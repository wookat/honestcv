import type { ReactNode, SVGProps } from 'react'

import { accentTint, type TemplateMeta } from '@/lib/templates'

/** Sample resume fragment rendered inside template thumbnails (same as scripts/build-seo.mjs). */
const SAMPLE = {
  name: 'Jordan Reyes',
  sub: 'Senior Software Engineer · Austin, TX',
  summary: [
    'Engineer with 8 years on high-traffic services.',
    'Led a 5-person team; cut p95 latency 38%.',
  ],
  jobs: [
    ['Senior Engineer — Nimbus Cloud · 2021–now', ['Scaled checkout to 2.1M orders/month.', 'Cut infra spend $340K/yr.']],
    ['Engineer — Brightline Labs · 2018–2021', ['Shipped billing API used by 40+ teams.']],
  ],
  skills: 'TypeScript · React · Node.js · SQL · AWS',
  education: 'B.S. Computer Science — UT Austin · 2018',
} as const

const W = 120
const H = 155
const L = 10

/** Mini-preview of a template rendering real sample content. */
export function TemplateThumb({ t }: { t: TemplateMeta }) {
  const font = t.serif ? "Georgia,'Times New Roman',serif" : 'Helvetica,Arial,sans-serif'
  const centered = t.headerAlign === 'center'
  const nodes: ReactNode[] = []
  let y = 14
  let key = 0
  const text = (x: number, ty: number, size: number, fill: string, str: string, extra?: SVGProps<SVGTextElement>) =>
    nodes.push(
      <text key={key++} x={x} y={ty} fontSize={size} fill={fill} {...extra}>
        {str}
      </text>
    )
  text(centered ? W / 2 : L, y, 8, '#111', t.nameCase === 'upper' ? SAMPLE.name.toUpperCase() : SAMPLE.name, {
    fontWeight: 700,
    textAnchor: centered ? 'middle' : 'start',
    letterSpacing: t.nameCase === 'upper' ? '.5' : undefined,
  })
  y += 8
  text(centered ? W / 2 : L, y, 3.6, '#777', SAMPLE.sub, { textAnchor: centered ? 'middle' : 'start' })
  y += 9
  const heading = (label: string) => {
    if (t.band) {
      nodes.push(<rect key={key++} x={L - 3} y={y - 5} width={W - 2 * (L - 3)} height={7.5} rx={1} fill={accentTint(t.accent)} />)
    }
    text(L, y, 4.4, t.accent, label.toUpperCase(), { fontWeight: 700, letterSpacing: '.6' })
    if (!t.band && t.divider !== 'none') {
      nodes.push(<rect key={key++} x={L} y={y + 2} width={W - 2 * L} height={t.divider === 'thick' ? 1.4 : 0.6} fill={t.accent} />)
    }
    y += t.band || t.divider !== 'none' ? 8 : 6.5
  }
  heading('Summary')
  for (const line of SAMPLE.summary) {
    text(L, y, 3.8, '#444', line)
    y += 5.5
  }
  y += 4
  heading('Experience')
  for (const [job, bullets] of SAMPLE.jobs) {
    text(L, y, 3.9, '#333', job, { fontWeight: 600 })
    y += 5.5
    for (const b of bullets) {
      text(L, y, 3.8, '#444', `•  ${b}`)
      y += 5.5
    }
    y += 1.5
  }
  y += 2.5
  heading('Skills')
  text(L, y, 3.8, '#444', SAMPLE.skills)
  y += 9.5
  heading('Education')
  text(L, y, 3.8, '#444', SAMPLE.education)
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      fontFamily={font}
      className="w-full rounded-sm border bg-white"
    >
      {nodes}
    </svg>
  )
}
