import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Build } from '../../../shared/types'
import {
  FailedJobIcon,
  NotificationBranchIcon,
  CheckIcon,
  CloseIcon,
  CrossIcon
} from '../../shared/Icons'

const DISMISS_MS = 5000

declare global {
  interface Window {
    notification: {
      ready: () => void
      resize: (height: number) => void
      onBuild: (cb: (build: Build) => void) => () => void
      close: () => void
      openUrl: (url: string) => void
    }
  }
}

export default function NotificationApp(): React.JSX.Element | null {
  const [build, setBuild] = useState<Build | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(100)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number>(0)
  const hoveredRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startCountdown = useCallback(() => {
    clearTimers()
    startedAtRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      if (hoveredRef.current) return
      const elapsed = Date.now() - startedAtRef.current
      const pct = Math.max(0, 100 - (elapsed / DISMISS_MS) * 100)
      setProgress(pct)
    }, 50)

    timerRef.current = setTimeout(() => {
      if (!hoveredRef.current) window.notification.close()
    }, DISMISS_MS)
  }, [clearTimers])

  useLayoutEffect(() => {
    if (!build || !wrapperRef.current) return
    const h = wrapperRef.current.scrollHeight
    if (h > 0) window.notification.resize(h + 2)
  }, [build])

  useEffect(() => {
    window.notification.ready()
    return window.notification.onBuild((b) => {
      setBuild(b)
      setProgress(100)
      startCountdown()
    })
  }, [startCountdown])

  const handleMouseEnter = useCallback(() => {
    hoveredRef.current = true
    clearTimers()
  }, [clearTimers])

  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = false
    startedAtRef.current = Date.now()
    startCountdown()
  }, [startCountdown])

  useEffect(() => () => clearTimers(), [clearTimers])

  if (!build) return null

  const failedJobNames = build.failedJobs.map((j) => j.name)
  const isPassed = build.state === 'passed'
  const accentColor = isPassed ? '#14cc80' : '#f83f23'
  const accentClass = isPassed ? 'text-buildkite-green' : 'text-buildkite-red'
  const accentBgClass = isPassed ? 'bg-buildkite-green/20' : 'bg-buildkite-red/20'
  const barClass = isPassed ? 'bg-buildkite-green/70' : 'bg-buildkite-red/70'
  const label = isPassed ? 'Build passed' : 'Build failed'

  return (
    <div
      ref={wrapperRef}
      className="p-0 bg-buildkite-dark"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative flex flex-col bg-buildkite-surface rounded-xl overflow-hidden select-none border border-buildkite-border/50">
        {/* Countdown bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-buildkite-border">
          <div className={`h-full ${barClass} transition-none`} style={{ width: `${progress}%` }} />
        </div>

        <div className="px-4 pt-5 pb-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-4 h-4 rounded-full ${accentBgClass} flex items-center justify-center flex-shrink-0`}
              >
                {isPassed ? <CheckIcon color={accentColor} /> : <CrossIcon color={accentColor} />}
              </div>
              <span className={`text-xs font-semibold ${accentClass} uppercase tracking-wider`}>
                {label}
              </span>
            </div>
            <button
              onClick={() => window.notification.close()}
              className="text-gray-600 hover:text-gray-400 flex-shrink-0 mt-0.5"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Pipeline + build number */}
          <button
            onClick={() => window.notification.openUrl(build.webUrl)}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white group-hover:text-buildkite-green transition-colors truncate">
                {build.pipelineName}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">#{build.number}</span>
            </div>

            <div className="flex items-center gap-1.5 mb-2">
              <NotificationBranchIcon />
              <span className="text-xs text-gray-400 truncate">{build.branch}</span>
            </div>

            <div
              className={`h-1.5 w-full rounded-full mb-3 ${isPassed ? 'bg-buildkite-green/15' : 'bg-buildkite-red/15'}`}
            >
              <div
                className={`h-full w-full rounded-full ${isPassed ? 'bg-buildkite-green' : 'bg-buildkite-red'}`}
              />
            </div>
          </button>

          {failedJobNames.length > 0 && (
            <div className="space-y-1">
              {failedJobNames.slice(0, 3).map((name, i) => (
                <button
                  key={i}
                  onClick={() => window.notification.openUrl(build.webUrl)}
                  className="flex items-center gap-1.5 w-full text-left group"
                >
                  <FailedJobIcon />
                  <span className="text-xs text-buildkite-red group-hover:text-red-400 truncate underline underline-offset-2 decoration-red-500/40">
                    {name}
                  </span>
                </button>
              ))}
              {failedJobNames.length > 3 && (
                <span className="text-xs text-gray-500 pl-4">
                  +{failedJobNames.length - 3} more
                </span>
              )}
            </div>
          )}

          {build.message && <p className="text-xs text-gray-500 mt-2 truncate">{build.message}</p>}
        </div>
      </div>
    </div>
  )
}
