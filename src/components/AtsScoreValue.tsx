import { useMemo } from 'react'
import { scoreResume } from '@/lib/ats'
import { visibleResume, type Resume } from '@/lib/resume'
import { usePdfPages } from '@/lib/usePdfLength'

/** Same stored copy → same visible copy, so every surface showing it shares one PDF measurement. */
const visible = new WeakMap<Resume, Resume>()
function visibleOf(resume: Resume): Resume {
  let v = visible.get(resume)
  if (!v) {
    v = visibleResume(resume)
    visible.set(resume, v)
  }
  return v
}

/** `NN/100` for a stored resume, scored the way the Builder scores the open draft: against
 * the measured page count of its PDF export. Renders `…` until the PDF has been measured so a
 * page-count-blind number is never shown next to the Builder's. */
export function AtsScoreValue({ resume }: { resume: Resume }) {
  const shown = useMemo(() => visibleOf(resume), [resume])
  const pages = usePdfPages(shown)
  const score = useMemo(
    () => (pages === undefined ? null : scoreResume(shown, shown.jobDescription, pages).score),
    [shown, pages]
  )
  if (score === null)
    return (
      <span title="Measuring the exported PDF's page count">
        <span aria-hidden="true">…</span>
        <span className="sr-only">measuring</span>
      </span>
    )
  return <>{score}/100</>
}
