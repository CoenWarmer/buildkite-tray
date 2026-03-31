import React, { useCallback, useEffect, useState } from 'react'
import { Build } from '../../../../shared/types'
import ProgressBar from './ProgressBar'
import FailedJob from './FailedJob'
import { BranchIcon, DismissIcon, StateIcon } from '../../../shared/Icons'

interface Props {
  build: Build
  stabilizing?: boolean
  onDismiss?: (buildId: string) => void
}

export default function PipelineItem({
  build,
  stabilizing = false,
  onDismiss
}: Props): React.JSX.Element {
  const handleClick = useCallback(() => {
    window.api.openUrl(build.webUrl)
  }, [build.webUrl])

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDismiss?.(build.id)
    },
    [build.id, onDismiss]
  )

  // Tick every second for running builds so elapsed time counts up live.
  // Finished builds use their real finishedAt and don't need a ticker.
  const isRunning = build.state === 'running' || build.state === 'canceling'
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isRunning])

  const stateLabel = getStateLabel(build.state)
  const stateColor = getStateLabelColor(build.state)
  const elapsed = getElapsedLabel(build.startedAt, build.finishedAt, isRunning ? now : undefined)

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors group border-b border-buildkite-border/50 last:border-0 ${
        stabilizing ? 'animate-[stabilize_10s_ease-out_forwards]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <StateIcon state={build.state} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-white truncate group-hover:text-buildkite-green transition-colors">
                {build.pipelineName}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">#{build.number}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <BranchIcon />
              <span className="text-xs text-gray-400 truncate">{build.branch}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 ml-2">
          <div className="flex flex-col items-end gap-0.5">
            <span className={`text-xs font-medium ${stateColor}`}>{stateLabel}</span>
            {elapsed && <span className="text-xs text-gray-500">{elapsed}</span>}
          </div>
          <button
            onClick={handleDismiss}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/10 transition-all flex-shrink-0"
            title="Hide this build"
          >
            <DismissIcon />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2">
        <ProgressBar build={build} />
      </div>

      {/* Failed jobs */}
      {build.failedJobs.length > 0 && (
        <div className="mt-2 space-y-1">
          {build.failedJobs.slice(0, 3).map((job) => (
            <FailedJob key={job.id} job={job} build={build} />
          ))}
          {build.failedJobs.length > 3 && (
            <span className="text-xs text-gray-500 pl-4">
              +{build.failedJobs.length - 3} more failed
            </span>
          )}
        </div>
      )}

      {/* Commit message */}
      {build.message && (
        <p className="text-xs text-gray-500 mt-1.5 truncate leading-relaxed">{build.message}</p>
      )}
    </button>
  )
}

function getStateLabel(state: Build['state']): string {
  switch (state) {
    case 'running':
      return 'Running'
    case 'passed':
      return 'Passed'
    case 'failed':
      return 'Failed'
    case 'canceled':
      return 'Canceled'
    case 'canceling':
      return 'Canceling'
    case 'scheduled':
      return 'Scheduled'
    case 'blocked':
      return 'Blocked'
    default:
      return state
  }
}

function getStateLabelColor(state: Build['state']): string {
  switch (state) {
    case 'running':
      return 'text-buildkite-yellow'
    case 'passed':
      return 'text-buildkite-green'
    case 'failed':
      return 'text-buildkite-red'
    case 'canceled':
    case 'canceling':
      return 'text-gray-400'
    case 'scheduled':
    case 'blocked':
      return 'text-buildkite-yellow'
    default:
      return 'text-gray-400'
  }
}

function getElapsedLabel(
  startedAt: string | null,
  finishedAt: string | null,
  nowOverride?: number
): string | null {
  if (!startedAt) return null

  const start = new Date(startedAt).getTime()
  const end = finishedAt ? new Date(finishedAt).getTime() : (nowOverride ?? Date.now())
  const durationMs = end - start

  if (durationMs < 0) return null

  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) return `${seconds}s`
  if (minutes < 60) return `${minutes}m ${seconds}s`

  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  return `${hours}h ${remainMinutes}m`
}
