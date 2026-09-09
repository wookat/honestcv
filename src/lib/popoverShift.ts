export const POPOVER_VIEWPORT_MARGIN = 8

/**
 * Horizontal shift (px) that brings an absolutely positioned popover back inside the viewport,
 * keeping `margin` from the edge it would have crossed. 0 when it already fits.
 */
export function popoverShift(
  rect: { left: number; right: number },
  viewportWidth: number,
  margin = POPOVER_VIEWPORT_MARGIN,
): number {
  if (rect.left < margin) return margin - rect.left
  if (rect.right > viewportWidth - margin) return viewportWidth - margin - rect.right
  return 0
}
