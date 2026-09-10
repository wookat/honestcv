export const REVEAL_SCROLL_MARGIN = 8

export type ScrollBox = { scrollLeft: number; clientWidth: number; scrollWidth: number }

/**
 * scrollLeft that brings an item fully into a horizontally scrolling box, keeping `margin`
 * from the edge it was hidden behind. `itemLeft`/`itemRight` are measured in the box's
 * content coordinates (client offset + current scrollLeft). Unchanged when the item already
 * shows; clamped to the box's scroll range.
 */
export function revealScrollLeft(
  box: ScrollBox,
  item: { left: number; right: number },
  margin = REVEAL_SCROLL_MARGIN,
): number {
  const max = Math.max(0, box.scrollWidth - box.clientWidth)
  const clamp = (n: number) => Math.min(max, Math.max(0, n))
  if (item.left - margin < box.scrollLeft) return clamp(item.left - margin)
  if (item.right + margin > box.scrollLeft + box.clientWidth)
    return clamp(item.right + margin - box.clientWidth)
  return box.scrollLeft
}
