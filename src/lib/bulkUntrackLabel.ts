/** Label of the Tracked-tab bulk "Untrack" button; it stays mounted (disabled) while nothing is ticked. */
export function bulkUntrackLabel(selected: number): string {
  return selected > 0 ? `Untrack ${selected}` : 'Untrack'
}
