/**
 * Always-mounted polite live region beside a list filter input, so the number of
 * results left after typing is announced. Empty while the query is empty so the
 * region exists before its text changes.
 */
export function FilterResultStatus({
  query,
  shown,
  total,
  noun,
}: {
  query: string
  shown: number
  total: number
  /** Plural noun, e.g. "saved copies" */
  noun: string
}) {
  const q = query.trim()
  return (
    <p role="status" className="sr-only">
      {!q
        ? ''
        : shown === 0
          ? `No ${noun} match “${q}”.`
          : `${shown} of ${total} ${noun} match “${q}”.`}
    </p>
  )
}
