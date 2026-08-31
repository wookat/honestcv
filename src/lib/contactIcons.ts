/** 24×24 stroke icon paths for the contact line (lucide, ISC license).
 *  Rendered as `currentColor` strokes in the preview and vector strokes in
 *  the PDF; DOCX/TXT/MD keep plain text separators. */
export type ContactIconKind = 'mail' | 'phone' | 'pin' | 'globe' | 'linkedin'

export const CONTACT_ICON_PATHS: Record<ContactIconKind, string> = {
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6',
  phone:
    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  globe:
    'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20 M2 12h20',
  linkedin:
    'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v2.5A6 6 0 0 1 16 8z M2 9h4v12H2z M6 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
}
