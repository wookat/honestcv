/** ATS-friendly resume templates: single-column, real text, no graphics. */

export interface TemplateMeta {
  id: string
  name: string
  description: string
  /** Accent color used for headings/rules (hex) */
  accent: string
  /** Heading style */
  headingCase: 'upper' | 'title'
  /** Serif body? */
  serif: boolean
  /** Divider style under section headings */
  divider: 'line' | 'thick' | 'none'
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless serif look — safe for any industry',
    accent: '#1a1a1a',
    headingCase: 'upper',
    serif: true,
    divider: 'line',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean sans-serif with a subtle color accent',
    accent: '#0f766e',
    headingCase: 'upper',
    serif: false,
    divider: 'thick',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Fits more content — great for experienced candidates',
    accent: '#334155',
    headingCase: 'title',
    serif: false,
    divider: 'line',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Understated and formal for senior roles',
    accent: '#7c2d12',
    headingCase: 'upper',
    serif: true,
    divider: 'none',
  },
]

export const getTemplate = (id: string): TemplateMeta =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
