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

/** Accent color choices offered in the builder (all print-safe, ATS-neutral) */
export const ACCENT_CHOICES = [
  '#1a1a1a', '#0f766e', '#334155', '#7c2d12', '#1d4ed8', '#6d28d9', '#be123c', '#15803d',
]

/** Template with the user's accent color applied (falls back to template default) */
export function resolveTemplate(templateId: string, accentColor?: string): TemplateMeta {
  const tpl = getTemplate(templateId)
  const custom = accentColor?.trim()
  return custom && /^#[0-9a-fA-F]{6}$/.test(custom) ? { ...tpl, accent: custom } : tpl
}
