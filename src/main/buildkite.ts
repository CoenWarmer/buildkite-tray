import { Build, CurrentUser, FailedJob, Settings } from '../shared/types'

const BASE_URL = 'https://api.buildkite.com/v2'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

interface BkOrg {
  id: string
  slug: string
  name: string
}

interface BkCreator {
  id: string
  name: string
  email: string
  avatar_url: string
}

interface BkAuthor {
  name: string
  email: string
  avatar_url: string
}

interface BkJob {
  id: string
  name: string
  state: string
  type: string
}

interface BkBuild {
  id: string
  number: number
  state: string
  url: string
  web_url: string
  branch: string
  message: string
  created_at: string
  started_at: string | null
  finished_at: string | null
  creator: BkCreator | null
  author: BkAuthor | null
  pipeline: {
    name: string
    slug: string
    repository: string | null
  }
  jobs: BkJob[]
}

interface BkUser {
  id: string
  name: string
  email: string
  avatar_url: string
}

const durationCache = new Map<string, number>()
let cachedCurrentUser: CurrentUser | null = null
let cachedOrgSlugs: string[] | null = null

async function apiFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  })
  if (!res.ok) throw new Error(`Buildkite API ${res.status}: ${res.statusText} (${path})`)
  return res.json() as Promise<T>
}

export async function fetchCurrentUser(token: string): Promise<CurrentUser | null> {
  if (cachedCurrentUser) return cachedCurrentUser
  try {
    const user = await apiFetch<BkUser>(token, '/user')
    cachedCurrentUser = { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatar_url || null }
    return cachedCurrentUser
  } catch {
    return null
  }
}

export async function fetchOrganizations(token: string): Promise<string[]> {
  if (cachedOrgSlugs) return cachedOrgSlugs
  try {
    const orgs = await apiFetch<BkOrg[]>(token, '/organizations?per_page=100')
    cachedOrgSlugs = orgs.map((o) => o.slug)
    return cachedOrgSlugs
  } catch {
    return []
  }
}

export function getCachedOrgSlugs(): string[] {
  return cachedOrgSlugs ?? []
}

/** Fire-and-forget org pre-fetch so the cache is warm for subsequent calls. */
export function prefetchOrganizations(token: string): Promise<string[]> {
  return fetchOrganizations(token)
}

/** Extracts the org slug from a Buildkite build URL. */
function extractOrgSlug(buildUrl: string): string {
  const match = buildUrl.match(/\/organizations\/([^/]+)\//)
  return match?.[1] ?? ''
}

/**
 * Fetches the current user's builds using the global builds endpoint filtered
 * by branch pattern. GitHub PR branches are named "{username}:{branch}", so
 * `branch=*{githubUsername}:*` efficiently returns all their builds across
 * every org and pipeline in a single request.
 */
export async function fetchMineBuilds(token: string, githubUsername: string): Promise<Build[]> {
  if (!githubUsername) return []
  const createdFrom = new Date(Date.now() - ONE_DAY_MS).toISOString()
  const builds = await apiFetch<BkBuild[]>(
    token,
    `/builds?branch=*${githubUsername}:*` +
      `&state[]=running&state[]=scheduled&state[]=passed&state[]=failed` +
      `&created_from=${createdFrom}&per_page=100`
  )
  return builds.map((b) => mapBuild(b, extractOrgSlug(b.url), null))
}

export function invalidateUserCache(): void {
  cachedCurrentUser = null
  cachedOrgSlugs = null
  durationCache.clear()
}

async function _estimateDuration(token: string, orgSlug: string, pipelineSlug: string): Promise<number | null> {
  const key = `${orgSlug}/${pipelineSlug}`
  if (durationCache.has(key)) return durationCache.get(key)!
  try {
    const builds = await apiFetch<BkBuild[]>(token, `/organizations/${orgSlug}/pipelines/${pipelineSlug}/builds?state[]=passed&per_page=5`)
    const durations = builds
      .filter((b) => b.started_at && b.finished_at)
      .map((b) => new Date(b.finished_at!).getTime() - new Date(b.started_at!).getTime())
      .filter((d) => d > 0)
    if (!durations.length) return null
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    durationCache.set(key, avg)
    return avg
  } catch {
    return null
  }
}

function computeProgress(build: BkBuild, estimatedMs: number | null): number {
  if (['passed', 'failed', 'canceled'].includes(build.state)) return 100
  if (!build.started_at || !estimatedMs) return 0
  const elapsed = Date.now() - new Date(build.started_at).getTime()
  return Math.min(Math.round((elapsed / estimatedMs) * 100), 99)
}

function mapBuild(bk: BkBuild, orgSlug: string, estimatedMs: number | null): Build {
  const failedJobs: FailedJob[] = (bk.jobs || [])
    .filter((j) => j.state === 'failed' && j.type === 'script')
    .map((j) => ({ id: j.id, name: j.name, state: j.state }))

  return {
    id: bk.id,
    number: bk.number,
    state: bk.state as Build['state'],
    url: bk.url,
    webUrl: bk.web_url,
    pipelineName: bk.pipeline.name,
    pipelineSlug: bk.pipeline.slug,
    orgSlug,
    branch: bk.branch,
    message: bk.message || '',
    createdAt: bk.created_at,
    startedAt: bk.started_at,
    finishedAt: bk.finished_at,
    estimatedDurationMs: estimatedMs,
    progressPercent: computeProgress(bk, estimatedMs),
    failedJobs,
    creatorId: bk.creator?.id ?? null,
    creatorName: bk.creator?.name ?? null,
    authorEmail: bk.author?.email ?? null,
    repositoryUrl: bk.pipeline.repository ?? null
  }
}

export async function fetchOrgBuilds(token: string, orgSlug: string): Promise<Build[]> {
  // Fetch recent builds + running builds separately to ensure active builds
  // are never pushed out of the result window in busy orgs.
  const [recent, running] = await Promise.all([
    apiFetch<BkBuild[]>(token, `/organizations/${orgSlug}/builds?per_page=100`),
    apiFetch<BkBuild[]>(token, `/organizations/${orgSlug}/builds?state[]=running&state[]=scheduled&per_page=100`)
  ])
  const seen = new Set<string>()
  return [...recent, ...running]
    .filter((b) => { if (seen.has(b.id)) return false; seen.add(b.id); return true })
    .map((b) => mapBuild(b, orgSlug, null))
}

export async function fetchAllBuilds(settings: Settings): Promise<Build[]> {
  if (!settings.apiToken) return []

  const orgSlugs = await fetchOrganizations(settings.apiToken)
  if (!orgSlugs.length) return []

  const results = await Promise.all(
    orgSlugs.map((org) =>
      fetchOrgBuilds(settings.apiToken, org).catch((err) => {
        console.error(`Failed org builds for ${org}:`, err.message)
        return []
      })
    )
  )

  return results.flat()
}

