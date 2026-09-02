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
  /** Tinted band behind section headings (still real text — ATS-safe) */
  band?: boolean
  /** Light hairline between entries within a section (vector line — ATS-safe) */
  entryDivider?: boolean
}

/** Light tint of an accent color (used for heading bands) */
export function accentTint(hex: string, alpha = 0.12): string {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(c * alpha + 255 * (1 - alpha))
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/** Style filters for template galleries, derived from template metadata. */
export const TEMPLATE_FILTERS: { id: string; label: string; match: (t: TemplateMeta) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'serif', label: 'Serif', match: (t) => t.serif },
  { id: 'sans', label: 'Modern sans', match: (t) => !t.serif },
  { id: 'banded', label: 'Banded headings', match: (t) => t.band === true },
  { id: 'minimal', label: 'Minimal', match: (t) => t.divider === 'none' && !t.band && !t.entryDivider },
  { id: 'ruled', label: 'Ruled entries', match: (t) => t.entryDivider === true },
]

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
  {
    id: 'horizon',
    name: 'Horizon',
    description: 'Teal heading bands — modern and easy to scan',
    tags: ['Modern', 'Tech', 'Scannable'],
    accent: '#0e7490',
    headingCase: 'upper',
    serif: false,
    divider: 'none',
    band: true,
    headerAlign: 'left',
    nameCase: 'normal',
  },
  {
    id: 'metro',
    name: 'Metro',
    description: 'Blue banded headings with a centered header — clean and structured',
    tags: ['Structured', 'Business', 'Clean'],
    accent: '#1e40af',
    headingCase: 'upper',
    serif: false,
    divider: 'none',
    band: true,
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Serif with warm banded headings — research and teaching roles',
    tags: ['Academic', 'Research', 'Serif'],
    accent: '#713f12',
    headingCase: 'title',
    serif: true,
    divider: 'none',
    band: true,
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'ink',
    name: 'Ink',
    description: 'Near-black bands and uppercase name — maximum contrast',
    tags: ['High contrast', 'Design', 'Bold'],
    accent: '#111827',
    headingCase: 'upper',
    serif: false,
    divider: 'none',
    band: true,
    headerAlign: 'left',
    nameCase: 'upper',
  },
  {
    id: 'coral',
    name: 'Coral',
    description: 'Warm rose accent, no rules — friendly and approachable',
    tags: ['Friendly', 'Creative', 'People roles'],
    accent: '#be123c',
    headingCase: 'title',
    serif: false,
    divider: 'none',
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'Deep navy serif with strong rules — global and established',
    tags: ['Consulting', 'International', 'Serif'],
    accent: '#0c4a6e',
    headingCase: 'upper',
    serif: true,
    divider: 'thick',
    headerAlign: 'left',
    nameCase: 'normal',
  },
  {
    id: 'prairie',
    name: 'Prairie',
    description: 'Earthy green with fine rules — calm, grounded and readable',
    tags: ['Calm', 'Healthcare', 'Education'],
    accent: '#3f6212',
    headingCase: 'title',
    serif: false,
    divider: 'line',
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'quartz',
    name: 'Quartz',
    description: 'Quiet gray serif, no rules — understated and refined',
    tags: ['Understated', 'Editorial', 'Serif'],
    accent: '#57534e',
    headingCase: 'title',
    serif: true,
    divider: 'none',
    headerAlign: 'left',
    nameCase: 'normal',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    description: 'Deep red banded serif — formal with a confident edge',
    tags: ['Formal', 'Law', 'Confident'],
    accent: '#9f1239',
    headingCase: 'upper',
    serif: true,
    divider: 'none',
    band: true,
    headerAlign: 'center',
    nameCase: 'normal',
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    description: 'Indigo accents with thick rules — assertive and modern',
    tags: ['Assertive', 'Product', 'Modern'],
    accent: '#312e81',
    headingCase: 'upper',
    serif: false,
    divider: 'thick',
    headerAlign: 'left',
    nameCase: 'upper',
  },
  {
    id: 'circuit',
    name: 'Circuit',
    description: 'Full-width with hairlines between entries — dense developer resumes',
    tags: ['Developers', 'Dense content', 'Ruled'],
    accent: '#0369a1',
    headingCase: 'upper',
    serif: false,
    divider: 'line',
    headerAlign: 'left',
    nameCase: 'normal',
    entryDivider: true,
  },
  {
    id: 'ledger',
    name: 'Ledger',
    description: 'Serif with ruled entries and quiet headings — editorial and structured',
    tags: ['Editorial', 'Experienced', 'Ruled'],
    accent: '#3f3f46',
    headingCase: 'title',
    serif: true,
    divider: 'none',
    headerAlign: 'left',
    nameCase: 'normal',
    entryDivider: true,
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
