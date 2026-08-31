import { useEffect, useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

function yearOf(value: string): number {
  const m = /\b(19|20)\d{2}\b/.exec(value)
  return m ? Number(m[0]) : new Date().getFullYear()
}

/**
 * Free-text date input with a month + year picker popover.
 * Values stay plain strings ("Jun 2023", "Present"), typing always works.
 */
export function MonthYearField({
  value,
  onChange,
  placeholder,
  allowPresent = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowPresent?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => yearOf(value))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (text: string) => {
    onChange(text)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-8"
      />
      <button
        type="button"
        aria-label={open ? 'Close date picker' : 'Open date picker'}
        aria-expanded={open}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-8 items-center justify-center"
        onClick={() => {
          if (!open) setYear(yearOf(value))
          setOpen((o) => !o)
        }}
      >
        <Calendar aria-hidden className="size-4" />
      </button>
      {open && (
        <div className="bg-background absolute right-0 top-full z-30 mt-1 w-56 rounded-md border p-2 shadow-lg">
          <div className="flex items-center justify-between px-1 pb-1.5">
            <button
              type="button"
              aria-label="Previous year"
              className="hover:bg-accent flex size-8 items-center justify-center rounded-sm text-sm"
              onClick={() => setYear((y) => y - 1)}
            >
              ‹
            </button>
            <span className="text-sm font-medium">{year}</span>
            <button
              type="button"
              aria-label="Next year"
              className="hover:bg-accent flex size-8 items-center justify-center rounded-sm text-sm"
              onClick={() => setYear((y) => y + 1)}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((m) => (
              <button
                key={m}
                type="button"
                className="hover:bg-accent min-h-9 rounded-sm text-xs"
                onClick={() => pick(`${m} ${year}`)}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1 border-t pt-1">
            <button
              type="button"
              className="hover:bg-accent min-h-9 rounded-sm text-xs"
              onClick={() => pick(String(year))}
            >
              {year} only
            </button>
            {allowPresent ? (
              <button
                type="button"
                className="hover:bg-accent min-h-9 rounded-sm text-xs font-medium"
                onClick={() => pick('Present')}
              >
                Present
              </button>
            ) : (
              <button
                type="button"
                className="text-muted-foreground hover:bg-accent min-h-9 rounded-sm text-xs"
                onClick={() => pick('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
