import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useDismissedBuilds } from '../hooks/useDismissedBuilds'
import React, { useMemo, useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react'
import { Build, CurrentUser, Settings } from '../../../../shared/types'
import PipelineItem from './PipelineItem'
import { CheckIcon, KeyIcon } from '../../../shared/Icons'

type Tab = 'mine' | 'team' | 'all'

const STABILIZE_MS = 15_000

interface Props {
  builds: Build[]
  settings: Settings | null
  currentUser: CurrentUser | null
  onOpenSettings: () => void
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function matchesRepoFilters(build: Build, filters: string[]): boolean {
  if (!filters.length) return true
  if (!build.repositoryUrl) return true
  const url = build.repositoryUrl.toLowerCase()
  return filters.some((f) => f && url.includes(f.toLowerCase()))
}

function isVisible(build: Build): boolean {
  if (['running', 'scheduled', 'blocked', 'canceling'].includes(build.state)) return true
  if (build.finishedAt) {
    return Date.now() - new Date(build.finishedAt).getTime() < ONE_DAY_MS
  }
  return true
}

function sortBuilds(builds: Build[], frozenIds: Set<string>): Build[] {
  const stateOrder: Record<string, number> = {
    running: 0,
    scheduled: 1,
    blocked: 2,
    canceling: 3,
    failed: 4,
    passed: 5,
    canceled: 6
  }
  return [...builds].sort((a, b) => {
    const aOrder = frozenIds.has(a.id) ? 0 : (stateOrder[a.state] ?? 99)
    const bOrder = frozenIds.has(b.id) ? 0 : (stateOrder[b.state] ?? 99)
    const diff = aOrder - bOrder
    if (diff !== 0) return diff
    const aTime = a.startedAt || a.createdAt
    const bTime = b.startedAt || b.createdAt
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })
}

function deduplicateBuilds(builds: Build[]): Build[] {
  const seen = new Set<string>()
  return builds.filter((b) => {
    if (seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })
}

export default function PipelineList({
  builds,
  settings,
  currentUser,
  onOpenSettings
}: Props): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('mine')
  const [isTabRefreshing, setIsTabRefreshing] = useState(false)
  const [mineBuilds, setMineBuilds] = useState<Build[]>([])
  const { dismissedIds, dismiss } = useDismissedBuilds()

  // Fast dedicated poll for Mine tab — runs every 5s while Mine is active
  useEffect(() => {
    if (activeTab !== 'mine') return
    let cancelled = false
    const run = async () => {
      const fresh = await window.api.getMineBuilds()
      if (!cancelled) setMineBuilds(fresh)
    }
    run()
    const id = setInterval(run, 5_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [activeTab])
  // frozenIds: permanent sort freeze — builds stay at their position until they age out
  const [frozenIds, setFrozenIds] = useState<Set<string>>(new Set())
  // highlightIds: temporary visual indicator that a build just finished
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set())

  const [animateRef] = useAutoAnimate({ duration: 200 })

  // Scroll preservation refs (effect is declared after filteredBuilds below)
  const scrollRef = useRef<HTMLDivElement>(null)
  const savedScrollTopRef = useRef(0)
  const prevTabRef = useRef(activeTab)

  const handleScroll = useCallback(() => {
    savedScrollTopRef.current = scrollRef.current?.scrollTop ?? 0
  }, [])

  // Idempotent tracking refs — safe under React Strict Mode double-invocation
  // because both sets only ever grow (first-write wins).
  const seenRunningRef = useRef<Set<string>>(new Set()) // builds we observed as running
  const seenFinishedRef = useRef<Set<string>>(new Set()) // builds we already froze
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // useLayoutEffect fires synchronously after render, before the browser paints.
  // setState inside it causes React to re-render synchronously (also before paint),
  // so the user never sees the build in its post-sort position — the freeze is
  // always active on the same visible frame that shows the new build state.
  useLayoutEffect(() => {
    const newlyFrozen: string[] = []

    builds.forEach((build) => {
      // Track every build we've seen while running
      if (build.state === 'running') {
        seenRunningRef.current.add(build.id)
      }

      // A build "just finished" if:
      //   1. we saw it running earlier in this session, AND
      //   2. it now has a finishedAt, AND
      //   3. we haven't already started a freeze for it
      if (
        build.finishedAt &&
        seenRunningRef.current.has(build.id) &&
        !seenFinishedRef.current.has(build.id)
      ) {
        seenFinishedRef.current.add(build.id)
        newlyFrozen.push(build.id)
      }
    })

    if (newlyFrozen.length === 0) return

    // Intentional: setState in useLayoutEffect prevents the build from visually
    // jumping to its new sort position before the freeze is applied.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrozenIds((prev) => new Set([...prev, ...newlyFrozen]))
    setHighlightIds((prev) => new Set([...prev, ...newlyFrozen]))
    newlyFrozen.forEach((id) => {
      const t = setTimeout(() => {
        setHighlightIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        timeoutsRef.current.delete(id)
      }, STABILIZE_MS)
      timeoutsRef.current.set(id, t)
    })
  }, [builds])

  // Clean up timeouts on unmount
  useEffect(
    () => () => {
      timeoutsRef.current.forEach(clearTimeout)
    },
    []
  )

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    setIsTabRefreshing(true)
    window.api.refresh().finally(() => setIsTabRefreshing(false))
  }, [])

  const hasNoToken = !settings?.apiToken
  const repoFilters = useMemo(() => settings?.repoFilters ?? [], [settings?.repoFilters])
  const githubUsername = settings?.githubUsername?.toLowerCase() ?? ''

  const filteredBuilds = useMemo(() => {
    // Mine tab: merge fast mine-specific builds on top of the regular cache
    const source = activeTab === 'mine' ? deduplicateBuilds([...mineBuilds, ...builds]) : builds
    const visible = deduplicateBuilds(source.filter((b) => isVisible(b) && !dismissedIds.has(b.id)))

    switch (activeTab) {
      case 'mine':
        return sortBuilds(
          visible.filter(
            (b) =>
              currentUser &&
              (b.creatorId === currentUser.id ||
                (b.authorEmail && b.authorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
                (githubUsername && b.branch.toLowerCase().startsWith(`${githubUsername}:`))) &&
              matchesRepoFilters(b, repoFilters)
          ),
          frozenIds
        )
      case 'team':
        return sortBuilds(
          visible.filter((b) => matchesRepoFilters(b, repoFilters)),
          frozenIds
        )
      default:
        return sortBuilds(visible, frozenIds)
    }
  }, [builds, mineBuilds, activeTab, currentUser, frozenIds, repoFilters, dismissedIds, githubUsername])

  // Restore scroll position after every list update (declared here so filteredBuilds is in scope)
  useLayoutEffect(() => {
    if (!scrollRef.current) return
    if (activeTab !== prevTabRef.current) {
      scrollRef.current.scrollTop = 0
      savedScrollTopRef.current = 0
      prevTabRef.current = activeTab
    } else {
      scrollRef.current.scrollTop = savedScrollTopRef.current
    }
  }, [filteredBuilds, activeTab])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'mine', label: 'Mine' },
    { id: 'team', label: 'My team' },
    { id: 'all', label: 'All' }
  ]

  if (hasNoToken) {
    return (
      <EmptyState
        icon={<KeyIcon />}
        title="No API token"
        description="Add your Buildkite API token in Settings to get started."
        action={{ label: 'Open Settings', onClick: onOpenSettings }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-buildkite-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex-1 py-2 text-xs font-medium transition-colors relative
                ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
              `}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-buildkite-green rounded-t" />
              )}
            </button>
          ))}
        </div>
        {isTabRefreshing && (
          <div className="h-0.5 w-full overflow-hidden bg-transparent">
            <div
              className="h-full bg-buildkite-green/70"
              style={{ animation: 'tabLoad 1.2s ease-in-out infinite' }}
            />
          </div>
        )}
      </div>

      {/* Build list */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        {filteredBuilds.length === 0 ? (
          <EmptyTabState
            tab={activeTab}
            currentUser={currentUser}
            onOpenSettings={onOpenSettings}
          />
        ) : (
          <div ref={animateRef}>
            {filteredBuilds.map((build) => (
              <PipelineItem
                key={`${build.pipelineSlug}-${build.number}`}
                build={build}
                stabilizing={highlightIds.has(build.id)}
                onDismiss={dismiss}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyTabState({
  tab,
  currentUser,
  onOpenSettings
}: {
  tab: Tab
  currentUser: CurrentUser | null
  onOpenSettings: () => void
}): React.JSX.Element {
  const [debugInfo, setDebugInfo] = useState<{ orgs: string[]; totalBuilds: number; liveProbe: string; sampleBranches: string[] } | null>(null)

  useEffect(() => {
    if (tab === 'mine') {
      window.api.getDebugInfo().then((info) => setDebugInfo(info))
    }
  }, [tab])

  if (tab === 'mine' && !currentUser) {
    return (
      <EmptyState
        icon={<KeyIcon />}
        title="Not signed in"
        description="Couldn't load your Buildkite user. Check your API token in Settings."
        action={{ label: 'Open Settings', onClick: onOpenSettings }}
      />
    )
  }

  if (tab === 'mine') {
    const hasRepoFilter = !!(currentUser && debugInfo !== null)
    return (
      <EmptyState
        icon={<CheckIcon />}
        title="No builds by you"
        description={
          hasRepoFilter && !debugInfo
            ? "Searching…"
            : "No builds matched. If you work in a large org, set a Repository filter in Settings (e.g. 'kibana') to search more efficiently."
        }
        action={hasRepoFilter ? undefined : { label: 'Open Settings', onClick: onOpenSettings }}
      />
    )
  }

  const messages: Record<Tab, { title: string; description: string }> = {
    mine: { title: 'No builds by you', description: "You haven't triggered any builds in the last 24 hours." },
    team: { title: 'All clear', description: 'No active builds.' },
    all: { title: 'Nothing recent', description: 'No builds across your organisations in the last 24 hours.' }
  }

  const { title, description } = messages[tab]
  return <EmptyState icon={<CheckIcon />} title={title} description={description} />
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

function EmptyState({ icon, title, description, action }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-white mb-2">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-xs font-medium bg-buildkite-green/20 text-buildkite-green rounded-lg hover:bg-buildkite-green/30 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
