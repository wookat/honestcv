import { accentTint, type TemplateMeta } from '@/lib/templates'

/** Schematic mini-preview of a template's layout (header alignment, divider, accent). */
export function TemplateThumb({ t }: { t: TemplateMeta }) {
  const align = t.headerAlign === 'center' ? 'items-center' : 'items-start'
  const divider =
    t.divider === 'none' ? '' : t.divider === 'thick' ? 'border-b-2' : 'border-b'
  return (
    <span
      aria-hidden
      className={`flex h-20 w-full flex-col gap-[3px] rounded-sm border bg-white p-1.5 ${
        t.serif ? 'font-serif' : ''
      }`}
    >
      <span className={`flex w-full flex-col gap-[2px] ${align}`}>
        <span
          className="h-[5px] w-7 rounded-[1px]"
          style={{ background: t.nameCase === 'upper' ? '#111' : '#333' }}
        />
        <span className="h-[3px] w-9 rounded-[1px] bg-neutral-300" />
      </span>
      {[0, 1].map((i) => (
        <span key={i} className="mt-[3px] flex w-full flex-col gap-[2px]">
          {t.band ? (
            <span
              className="flex h-[7px] w-full items-center rounded-[1px] px-[2px]"
              style={{ background: accentTint(t.accent) }}
            >
              <span className="h-[3px] w-5 rounded-[1px]" style={{ background: t.accent }} />
            </span>
          ) : (
            <span
              className={`h-[4px] w-5 rounded-[1px] ${divider}`}
              style={{ background: t.accent, borderColor: t.accent }}
            />
          )}
          <span className="h-[3px] w-full rounded-[1px] bg-neutral-200" />
          <span className="h-[3px] w-4/5 rounded-[1px] bg-neutral-200" />
        </span>
      ))}
    </span>
  )
}
