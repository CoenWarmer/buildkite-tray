import React, { useEffect, useState } from 'react'
import { Build } from '../../../../shared/types'

interface Props {
  build: Build
}

export default function ProgressBar({ build }: Props): React.JSX.Element {
  const [progress, setProgress] = useState(build.progressPercent)

  // Animate progress for running builds based on elapsed time
  useEffect(() => {
    if (build.state !== 'running' || !build.startedAt) {
      setProgress(build.progressPercent) // eslint-disable-line react-hooks/set-state-in-effect
      return
    }

    const tick = (): void => {
      if (!build.startedAt || !build.estimatedDurationMs) {
        setProgress(build.progressPercent)
        return
      }
      const elapsed = Date.now() - new Date(build.startedAt).getTime()
      const pct = Math.min(Math.round((elapsed / build.estimatedDurationMs) * 100), 99)
      setProgress(pct)
    }

    tick()
    const interval = setInterval(tick, 5000)
    return () => clearInterval(interval)
  }, [build])

  const { color, bgColor } = getStateColors(build.state)

  const isRunning = build.state === 'running'

  return (
    <div className="relative h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: bgColor }}>
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${isRunning ? 'animate-progress-pulse' : ''}`}
        style={{
          width: `${progress}%`,
          backgroundColor: color,
          minWidth: progress > 0 ? '4px' : '0'
        }}
      />
      {isRunning && progress > 0 && (
        <div
          className="absolute inset-y-0 rounded-full opacity-60"
          style={{
            left: `${Math.max(0, progress - 8)}%`,
            width: '8%',
            background: `linear-gradient(90deg, transparent, ${color})`
          }}
        />
      )}
    </div>
  )
}

function getStateColors(state: Build['state']): { color: string; bgColor: string } {
  switch (state) {
    case 'passed':
      return { color: '#14cc80', bgColor: 'rgba(20, 204, 128, 0.15)' }
    case 'failed':
      return { color: '#f83f23', bgColor: 'rgba(248, 63, 35, 0.15)' }
    case 'running':
      return { color: '#14cc80', bgColor: 'rgba(20, 204, 128, 0.1)' }
    case 'canceled':
    case 'canceling':
      return { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' }
    case 'scheduled':
    case 'blocked':
      return { color: '#ffba00', bgColor: 'rgba(255, 186, 0, 0.1)' }
    default:
      return { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' }
  }
}
