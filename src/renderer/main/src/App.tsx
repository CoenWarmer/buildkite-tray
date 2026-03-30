import React, { useState, useEffect, useCallback } from 'react'
import { Build, CurrentUser, Settings } from '../../../shared/types'
import PipelineList from './components/PipelineList'
import SettingsView from './components/Settings'
import {
  BuildkiteLogo,
  ChevronLeftIcon,
  GearIcon,
  PinIcon,
  QuitIcon,
  RefreshIcon,
  WarningIcon
} from '../../shared/Icons'

type View = 'pipelines' | 'settings'

export default function App(): React.JSX.Element {
  const [view, setView] = useState<View>('pipelines')
  const [builds, setBuilds] = useState<Build[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [pollError, setPollError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    Promise.all([
      window.api.getSettings(),
      window.api.getBuilds(),
      window.api.getStatus(),
      window.api.getCurrentUser()
    ])
      .then(([s, b, status, user]) => {
        setSettings(s)
        setBuilds(b)
        setPollError(status.error)
        setCurrentUser(user)
        // If there's no token, or if the cache already has builds, stop loading.
        // Otherwise keep isLoading=true until the first onBuildsUpdated push.
        if (!s.apiToken || b.length > 0 || status.error) {
          setIsLoading(false)
        }
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [])

  // Refresh current user whenever builds update (user may have just been fetched)
  useEffect(() => {
    window.api.getCurrentUser().then(setCurrentUser)
  }, [builds])

  // Sync pinned state pushed from main process (e.g. on window close while pinned)
  useEffect(() => {
    return window.api.onPinnedChanged(setIsPinned)
  }, [])

  // Listen for pushed build updates — also clears any post-save loading state
  useEffect(() => {
    const unsubBuilds = window.api.onBuildsUpdated((newBuilds) => {
      setBuilds(newBuilds)
      setIsLoading(false)
    })
    const unsubError = window.api.onPollError((error) => {
      setPollError(error)
      setIsLoading(false)
    })
    return () => {
      unsubBuilds()
      unsubError()
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await window.api.refresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const handleSettingsSave = useCallback(async (newSettings: Settings) => {
    await window.api.saveSettings(newSettings)
    setSettings(newSettings)
    setPollError(null)
    setCurrentUser(null)
    // Clear stale builds and show loading immediately before switching view
    setBuilds([])
    setIsLoading(true)
    setView('pipelines')
    // Fire-and-forget — onBuildsUpdated will clear isLoading when data arrives
    window.api.refresh().catch(() => setIsLoading(false))
  }, [])

  const handleOpenSettings = useCallback(() => {
    setView('settings')
  }, [])

  const handleBackToPipelines = useCallback(() => {
    setView('pipelines')
  }, [])

  const handleTogglePin = useCallback(async () => {
    const next = !isPinned
    setIsPinned(next)
    await window.api.setPinned(next)
  }, [isPinned])

  return (
    <div className="flex flex-col h-screen bg-buildkite-dark text-white">
      {/* Header — becomes drag region when pinned */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-buildkite-border flex-shrink-0"
        style={isPinned ? ({ WebkitAppRegion: 'drag' } as React.CSSProperties) : undefined}
      >
        <div
          className="flex items-center gap-2"
          style={isPinned ? ({ WebkitAppRegion: 'no-drag' } as React.CSSProperties) : undefined}
        >
          {view === 'settings' ? (
            <button
              onClick={handleBackToPipelines}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              title="Back"
            >
              <ChevronLeftIcon />
              Back
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <BuildkiteLogo />
              <span className="font-semibold text-sm text-white">Buildkite</span>
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-1"
          style={isPinned ? ({ WebkitAppRegion: 'no-drag' } as React.CSSProperties) : undefined}
        >
          {view === 'pipelines' && (
            <>
              {pollError && (
                <div
                  className="flex items-center gap-1 text-xs text-buildkite-red cursor-help"
                  title={pollError}
                >
                  <WarningIcon />
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                title="Refresh"
              >
                <RefreshIcon spinning={isRefreshing} />
              </button>
              <button
                onClick={handleOpenSettings}
                className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Settings"
              >
                <GearIcon />
              </button>
            </>
          )}
          {view === 'settings' && (
            <span className="text-sm font-medium text-gray-300">Settings</span>
          )}
          {/* Pin button — always visible */}
          <button
            onClick={handleTogglePin}
            className={`inline-flex items-center justify-center p-1.5 rounded-md transition-colors ${
              isPinned
                ? 'text-buildkite-green bg-buildkite-green/10 hover:bg-buildkite-green/20'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title={isPinned ? 'Unpin window (close on blur)' : 'Pin window (keep open)'}
          >
            <PinIcon pinned={isPinned} />
          </button>
          <button
            onClick={() => window.api.quit()}
            className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
            title="Quit Buildkite Tray"
          >
            <QuitIcon />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {view === 'pipelines' && pollError && (
        <div className="flex-shrink-0 bg-buildkite-red/10 border-b border-buildkite-red/20 px-4 py-2">
          <p className="text-xs text-buildkite-red leading-snug">
            <strong>Error:</strong> {truncate(pollError, 120)}
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : view === 'pipelines' ? (
          <PipelineList
            builds={builds}
            settings={settings}
            currentUser={currentUser}
            onOpenSettings={handleOpenSettings}
          />
        ) : (
          <SettingsView
            settings={settings}
            currentUser={currentUser}
            onSave={handleSettingsSave}
            onCancel={handleBackToPipelines}
          />
        )}
      </div>
    </div>
  )
}

const DOT_COUNT = 8
const DOT_ANGLES = Array.from({ length: DOT_COUNT }, (_, i) => (i * 360) / DOT_COUNT)
const RADIUS = 14

function LoadingState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <svg width="48" height="48" viewBox="-24 -24 48 48">
        {DOT_ANGLES.map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const cx = RADIUS * Math.sin(rad)
          const cy = -RADIUS * Math.cos(rad)
          const delay = `${-(DOT_COUNT - i) * (0.8 / DOT_COUNT)}s`
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="2.5"
              fill="#14cc80"
              style={{ animation: `dotSpin 0.8s ${delay} ease-in-out infinite` }}
            />
          )
        })}
      </svg>
      <span className="text-xs text-gray-500">Connecting…</span>
    </div>
  )
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '…'
}
