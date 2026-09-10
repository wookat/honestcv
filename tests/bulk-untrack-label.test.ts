import { describe, expect, it } from 'vitest'

import { bulkUntrackLabel } from '../src/lib/bulkUntrackLabel'

describe('R859: bulkUntrackLabel', () => {
  it('names the count once something is ticked', () => {
    expect(bulkUntrackLabel(1)).toBe('Untrack 1')
    expect(bulkUntrackLabel(12)).toBe('Untrack 12')
  })
  it('reads plainly on the disabled button while nothing is ticked (no "Untrack 0")', () => {
    expect(bulkUntrackLabel(0)).toBe('Untrack')
  })
})
