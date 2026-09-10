import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Inline text button inside a sentence: 32px-tall hit area on touch widths without changing the line box. Wrap its label in INLINE_LABEL. */
export const INLINE_ACTION = 'relative -my-2 inline-flex items-center py-2 sm:my-0 sm:py-0'
/** Same for an inline link whose text may wrap: padding on an inline box grows the hit area, not the line. */
export const INLINE_LINK = 'relative py-2 sm:py-0'
/** Visible label of an INLINE_ACTION / INLINE_LINK; paints above a neighbour's invisible hit padding. */
export const INLINE_LABEL = 'relative z-[1]'
