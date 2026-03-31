import { BrowserWindow } from 'electron'
import { Build, CurrentUser } from '../shared/types'

export function isMyBuild(build: Build, user: CurrentUser, githubUsername?: string): boolean {
  if (build.creatorId === user.id) return true
  if (build.authorEmail && build.authorEmail.toLowerCase() === user.email.toLowerCase()) return true
  // Match PR branches like "{GithubUsername}:{branch-name}"
  if (githubUsername && build.branch.toLowerCase().startsWith(`${githubUsername.toLowerCase()}:`)) return true
  return false
}
import { fetchAllBuilds, fetchMineBuilds, fetchCurrentUser, invalidateUserCache } from './buildkite'
import { getSettings } from './store'
import { showBuildNotification, getNotifiedBuildIds } from './notification'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Merge fresh API results into the existing cache.
 * - Fresh builds overwrite cached builds with the same ID (state may have changed).
 * - Cached builds NOT returned by the API are kept as long as they are still
 *   within the 24-hour visibility window, preventing them from disappearing just
 *   because they fell off the API's per_page result window.
 * - Builds older than 24 hours are evicted.
 */
function mergeBuilds(cached: Build[], fresh: Build[]): Build[] {
  const freshMap = new Map(fresh.map((b) => [b.id, b]))
  const now = Date.now()

  const retained = cached.filter((b) => {
    if (freshMap.has(b.id)) return false // will be replaced by fresh copy
    if (b.state === 'running' || b.state === 'scheduled' || b.state === 'blocked') return true
    if (b.finishedAt) return now - new Date(b.finishedAt).getTime() < ONE_DAY_MS
    return true
  })

  return [...retained, ...fresh]
}

const INTERVAL_WINDOW_OPEN_MS = 5_000
const INTERVAL_WINDOW_CLOSED_MS = 30_000

let timer: ReturnType<typeof setTimeout> | null = null
let cachedBuilds: Build[] = []
let cachedCurrentUser: CurrentUser | null = null
let lastError: string | null = null
let isPolling = false
let windowVisible = false
let mainWindow: BrowserWindow | null = null
let onPollComplete: (() => void) | null = null
// Timestamp set when the user opens the window; terminal-state builds that
// finished before this are considered "seen" and don't drive the tray icon.
let lastAcknowledgedAt: number = 0

export function getCachedBuilds(): Build[] {
  return cachedBuilds
}

export function getCachedCurrentUser(): CurrentUser | null {
  return cachedCurrentUser
}

export function getLastError(): string | null {
  return lastError
}

export function getIsPolling(): boolean {
  return isPolling
}

export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win
}

export function setOnPollComplete(cb: () => void): void {
  onPollComplete = cb
}

export function acknowledgeBuilds(): void {
  lastAcknowledgedAt = Date.now()
}

export function getLastAcknowledgedAt(): number {
  return lastAcknowledgedAt
}

let dismissedBuildIds: Set<string> = new Set()
let onDismissedBuildsChanged: (() => void) | null = null

export function setOnDismissedBuildsChanged(cb: () => void): void {
  onDismissedBuildsChanged = cb
}

export function setDismissedBuilds(ids: string[]): void {
  dismissedBuildIds = new Set(ids)
  onDismissedBuildsChanged?.()
}

export function getDismissedBuildIds(): Set<string> {
  return dismissedBuildIds
}

export function setWindowVisible(visible: boolean): void {
  windowVisible = visible
  // Reschedule immediately so the new interval takes effect right away
  if (timer) {
    clearTimeout(timer)
    timer = null
    scheduleNext()
  }
}

function pushToRenderer(builds: Build[], error: string | null): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('builds-updated', builds)
    mainWindow.webContents.send('poll-error', error)
  }
}

async function poll(): Promise<void> {
  const settings = getSettings()

  if (!settings.apiToken) {
    cachedBuilds = []
    cachedCurrentUser = null
    lastError = null
    pushToRenderer([], null)
    return
  }

  isPolling = true

  try {
    // Fetch current user and mine builds in parallel
    const [user, mineBuilds] = await Promise.all([
      fetchCurrentUser(settings.apiToken),
      settings.githubUsername
        ? fetchMineBuilds(settings.apiToken, settings.githubUsername)
        : Promise.resolve([] as Build[])
    ])

    cachedCurrentUser = user
    cachedBuilds = mergeBuilds(cachedBuilds, mineBuilds)
    pushToRenderer(cachedBuilds, null)
    onPollComplete?.()

    if (windowVisible) {
      // Full org-wide fetch for the All / My team tabs
      const fullBuilds = await fetchAllBuilds(settings)
      cachedBuilds = mergeBuilds(cachedBuilds, fullBuilds)
      pushToRenderer(cachedBuilds, null)
    }

    lastError = null

    // Notify for builds that just completed (only when the main window is hidden)
    if (!windowVisible && user) {
      const notified = getNotifiedBuildIds()
      const ONE_MINUTE = 60_000
      const recentMyBuilds = cachedBuilds.filter(
        (b) =>
          isMyBuild(b, user, settings.githubUsername) &&
          b.finishedAt &&
          Date.now() - new Date(b.finishedAt).getTime() < ONE_MINUTE &&
          !notified.has(b.id)
      )

      for (const b of recentMyBuilds) {
        if (b.state === 'failed' && settings.notifyOnFailure) {
          showBuildNotification(b)
        } else if (b.state === 'passed' && settings.notifyOnSuccess) {
          showBuildNotification(b)
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    lastError = msg
    console.error('Poll error:', msg)
    pushToRenderer(cachedBuilds, msg)
  } finally {
    isPolling = false
  }
}

export async function startPoller(): Promise<void> {
  await poll()
  scheduleNext()
}

function scheduleNext(): void {
  if (timer) clearTimeout(timer)
  const intervalMs = windowVisible ? INTERVAL_WINDOW_OPEN_MS : INTERVAL_WINDOW_CLOSED_MS
  timer = setTimeout(async () => {
    await poll()
    scheduleNext()
  }, intervalMs)
}

export async function triggerRefresh(resetUser = false): Promise<void> {
  if (timer) { clearTimeout(timer); timer = null }
  if (resetUser) invalidateUserCache()
  await poll()
  scheduleNext()
}

export function stopPoller(): void {
  if (timer) { clearTimeout(timer); timer = null }
}
