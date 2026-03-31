import { app } from 'electron'

const RELEASES_API = 'https://api.github.com/repos/CoenWarmer/buildkite-tray/releases/latest'
const RELEASES_PAGE = 'https://github.com/CoenWarmer/buildkite-tray/releases/latest'

export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  releaseUrl: string
  releaseName: string | null
}

function parseVersion(v: string): number[] {
  return v.replace(/^v/, '').split('.').map(Number)
}

function isNewer(latest: string, current: string): boolean {
  const l = parseVersion(latest)
  const c = parseVersion(current)
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const diff = (l[i] ?? 0) - (c[i] ?? 0)
    if (diff !== 0) return diff > 0
  }
  return false
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  const currentVersion = app.getVersion()

  try {
    const res = await fetch(RELEASES_API, {
      headers: { 'User-Agent': 'buildkite-tray' }
    })

    if (!res.ok) {
      return { currentVersion, latestVersion: currentVersion, hasUpdate: false, releaseUrl: RELEASES_PAGE, releaseName: null }
    }

    const release = await res.json() as { tag_name: string; name: string; html_url: string }
    const latestVersion = release.tag_name.replace(/^v/, '')
    const hasUpdate = isNewer(latestVersion, currentVersion)

    return {
      currentVersion,
      latestVersion,
      hasUpdate,
      releaseUrl: release.html_url ?? RELEASES_PAGE,
      releaseName: release.name ?? null
    }
  } catch {
    return { currentVersion, latestVersion: currentVersion, hasUpdate: false, releaseUrl: RELEASES_PAGE, releaseName: null }
  }
}
