import { Link } from 'react-router-dom'
import {
  copyKeepsProvenance,
  copyTargetsJob,
  jobLinksLiveCopy,
  trackedJobOfCopy,
  type PipelineEntry,
} from '@/lib/jobs'
import type { ResumeVersion } from '@/lib/resume'
import { INLINE_ACTION, INLINE_LINK } from '@/lib/utils'

/**
 * Trailing " · …" note for a saved copy's meta line: which tracked job it is the
 * targeted resume for, or — when it targets a job without being linked — whether
 * that job is tracked through another copy, has no copy linked, or is no longer tracked.
 * `onLinkToJob` makes this copy the tracked job's linked one in place (the job's current copy stays saved).
 */
export function CopyTargetNote({
  version: v,
  pipeline,
  versions,
  onLinkToJob,
}: {
  version: ResumeVersion
  pipeline: PipelineEntry[]
  versions: readonly ResumeVersion[]
  onLinkToJob: (jobId: string) => void
}) {
  const entry = pipeline.find((e) => e.resumeVersionId === v.id)
  const role = v.data.targetRole.trim()
  const company = (v.data.targetCompany ?? '').trim()
  if (entry)
    return (
      <>
        {' '}
        · for{' '}
        <Link
          to={`/jobs?job=${encodeURIComponent(entry.job.id)}`}
          className={`${INLINE_LINK} underline underline-offset-2`}
        >
          {entry.job.title} at {entry.job.company}
        </Link>
        {role !== '' && !copyTargetsJob(v.data, entry.job) && (
          <>
            {' '}
            · now aimed at {role}
            {company ? ` at ${company}` : ''}
          </>
        )}
      </>
    )
  if (!role) return null
  const tracked = trackedJobOfCopy(v, pipeline)
  const origin = v.forJob && copyKeepsProvenance(v, pipeline) ? v.forJob : null
  return (
    <>
      {' '}
      · targeted at {role}
      {company ? ` at ${company}` : ''}
      {tracked ? (
        <>
          {' '}
          ·{' '}
          <Link
            to={`/jobs?job=${encodeURIComponent(tracked.job.id)}`}
            className={`${INLINE_LINK} underline underline-offset-2`}
          >
            {jobLinksLiveCopy(tracked, versions)
              ? 'tracked job uses another copy'
              : 'tracked job has no copy linked'}
          </Link>
          {' — '}
          <button
            type="button"
            className={`${INLINE_ACTION} text-primary underline-offset-2 hover:underline`}
            onClick={() => onLinkToJob(tracked.job.id)}
          >
            {jobLinksLiveCopy(tracked, versions) ? 'use this one instead' : 'reconnect it'}
          </button>
        </>
      ) : (
        v.data.jobDescription.trim() !== '' && (
          <>
            {' '}
            {origin ? (
              <>
                · job no longer tracked —{' '}
                <Link
                  to={`/jobs?q=${encodeURIComponent(origin.title)}&job=${encodeURIComponent(origin.id)}`}
                  className={`${INLINE_LINK} underline underline-offset-2`}
                >
                  open it to save it again
                </Link>
              </>
            ) : (
              <>
                · no tracked job —{' '}
                <Link
                  to={`/jobs?q=${encodeURIComponent(role)}`}
                  className={`${INLINE_LINK} underline underline-offset-2`}
                >
                  find it on the jobs board
                </Link>
              </>
            )}
          </>
        )
      )}
    </>
  )
}
