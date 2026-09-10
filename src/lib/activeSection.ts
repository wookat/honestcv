/**
 * Which section chip should be highlighted. Prefer the first section whose anchor intersects
 * the observer zone; when none does (page top above the first section, or a jump the
 * observer only saw the end of), fall back to the last section whose anchor already starts
 * above the zone, else the first section. `null` when nothing is laid out (hidden pane) so
 * the caller keeps its previous choice.
 */
export function activeSection(
  keys: readonly string[],
  visible: ReadonlySet<string>,
  tops: ReadonlyMap<string, number>,
  zoneTop: number,
): string | null {
  const seen = keys.find((k) => visible.has(k));
  if (seen) return seen;
  const laidOut = keys.filter((k) => tops.has(k));
  if (laidOut.length === 0) return null;
  let last: string | null = null;
  for (const k of laidOut) {
    const top = tops.get(k);
    if (top !== undefined && top < zoneTop) last = k;
  }
  return last ?? laidOut[0];
}
