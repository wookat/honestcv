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
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean sans-serif with a subtle color accent',
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
    accent: '#15803d',
    headingCase: 'upper',
    serif: false,
    divider: 'line',
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
