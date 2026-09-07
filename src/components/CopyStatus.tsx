export type CopyState = 'idle' | 'copied' | 'failed'

/**
 * Always-mounted polite live region for clipboard buttons whose visible feedback is
 * only a label swap ("Copy" → "Copied"). Empty at rest so the region exists before
 * its text changes.
 */
export function CopyStatus({
  state,
  copied = 'Copied to clipboard.',
  failed = 'Copy failed.',
}: {
  state: CopyState
  copied?: string
  failed?: string
}) {
  return (
    <span role="status" className="sr-only">
      {state === 'copied' ? copied : state === 'failed' ? failed : ''}
    </span>
  )
}
