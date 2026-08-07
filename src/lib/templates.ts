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
  /** Header block alignment */
  headerAlign: 'center' | 'left'
  /** Candidate name casing */
  nameCase: 'normal' | 'upper'
  /** Short fit tags shown in pickers (e.g. industries or styles this suits) */
  tags: string[]
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless serif look — safe for any industry',
    tags: ['Any industry', 'Serif', 'Traditional'],
    accent: '#1a1a1a',
    headingCase: 'upper',
    serif: true,
    divider: 'line',
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean sans-serif with a subtle color accent',
    tags: ['Versatile', 'Tech', 'Modern'],
    accent: '#0f766e',
    headingCase: 'upper',
    serif: false,
    divider: 'thick',
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Fits more content — great for experienced candidates',
    tags: ['Dense content', 'Experienced', 'One page'],
    accent: '#334155',
    headingCase: 'title',
    serif: false,
    divider: 'line',
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Understated and formal for senior roles',
    tags: ['Senior roles', 'Formal', 'Serif'],
    accent: '#7c2d12',
    headingCase: 'upper',
    serif: true,
    divider: 'none',
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Left-aligned, whitespace-first — modern tech look',
    tags: ['Tech', 'Minimal', 'Whitespace'],
    accent: '#1a1a1a',
    headingCase: 'title',
    serif: false,
    divider: 'none',
    headerAlign: 'left',
    nameCase: 'normal',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong headings and rules — stands out in a stack',
    tags: ['Stands out', 'Sales', 'Marketing'],
    accent: '#1d4ed8',
    headingCase: 'upper',
    serif: false,
    divider: 'thick',
    headerAlign: 'left',
    nameCase: 'upper',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Refined serif with left-aligned header — polished and formal',
    tags: ['Polished', 'Formal', 'Serif'],
    accent: '#6d28d9',
    headingCase: 'title',
    serif: true,
    divider: 'line',
    headerAlign: 'left',
    nameCase: 'normal',
  },
  {
    id: 'engineer',
    name: 'Engineer',
    description: 'No-nonsense sans-serif built for technical resumes',
    tags: ['Engineering', 'Technical', 'No-nonsense'],
    accent: '#15803d',
    headingCase: 'upper',
    serif: false,
    divider: 'line',
    headerAlign: 'left',
    nameCase: 'normal',
  },
  {
    id: 'ivy',
    name: 'Ivy',
    description: 'Academic serif in deep green — consulting and grad-school ready',
    tags: ['Consulting', 'Academic', 'New grad'],
    accent: '#14532d',
    headingCase: 'title',
    serif: true,
    divider: 'line',
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Cool gray sans-serif with strong rules — calm and confident',
    tags: ['Versatile', 'Operations', 'Calm'],
    accent: '#475569',
    headingCase: 'title',
    serif: false,
    divider: 'thick',
    headerAlign: 'left',
    nameCase: 'normal',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Formal serif with commanding uppercase name — finance and law',
    tags: ['Finance', 'Law', 'Formal'],
    accent: '#7f1d1d',
    headingCase: 'upper',
    serif: true,
    divider: 'thick',
    headerAlign: 'center',
    nameCase: 'upper',
  },
  {
    id: 'startup',
    name: 'Startup',
    description: 'Energetic orange accent, no rules — product and growth roles',
    tags: ['Product', 'Growth', 'Startup'],
    accent: '#c2410c',
    headingCase: 'upper',
    serif: false,
    divider: 'none',
    headerAlign: 'left',
    nameCase: 'normal',
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
