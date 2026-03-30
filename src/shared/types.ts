export interface Settings {
  apiToken: string
  githubUsername: string
  repoFilters: string[]
  notifyOnFailure: boolean
  notifyOnSuccess: boolean
}

export interface FailedJob {
  id: string
  name: string
  state: string
}

export interface Build {
  id: string
  number: number
  state: 'running' | 'passed' | 'failed' | 'canceled' | 'canceling' | 'scheduled' | 'blocked'
  url: string
  webUrl: string
  pipelineName: string
  pipelineSlug: string
  orgSlug: string
  branch: string
  message: string
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  estimatedDurationMs: number | null
  progressPercent: number
  failedJobs: FailedJob[]
  creatorId: string | null
  creatorName: string | null
  authorEmail: string | null
  repositoryUrl: string | null
}

export interface CurrentUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export interface PollStatus {
  error: string | null
  isPolling: boolean
}

export interface IpcApi {
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<void>
  getBuilds: () => Promise<Build[]>
  getStatus: () => Promise<PollStatus>
  getCurrentUser: () => Promise<CurrentUser | null>
  getDiscoveredOrgs: () => Promise<string[]>
  getDebugInfo: () => Promise<{ orgs: string[]; totalBuilds: number; buildBranches: Array<{ branch: string; state: string; pipeline: string; creatorId: string | null; authorEmail: string | null }> }>
  refresh: () => Promise<void>
  setPinned: (value: boolean) => Promise<void>
  quit: () => Promise<void>
  openUrl: (url: string) => Promise<void>
  onBuildsUpdated: (callback: (builds: Build[]) => void) => () => void
  onPollError: (callback: (error: string | null) => void) => () => void
  onPinnedChanged: (callback: (pinned: boolean) => void) => () => void
}

declare global {
  interface Window {
    api: IpcApi
  }
}
