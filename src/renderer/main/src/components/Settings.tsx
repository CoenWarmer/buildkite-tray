import React, { useState, useCallback, useEffect } from 'react'
import { CurrentUser, Settings } from '../../../../shared/types'
import { AddIcon, EyeIcon, EyeOffIcon, RemoveIcon } from '../../../shared/Icons'

interface Props {
  settings: Settings | null
  currentUser: CurrentUser | null
  onSave: (settings: Settings) => void
  onCancel: () => void
}

export default function SettingsView({
  settings,
  currentUser,
  onSave,
  onCancel
}: Props): React.JSX.Element {
  const [apiToken, setApiToken] = useState(settings?.apiToken ?? '')
  const [githubUsername, setGithubUsername] = useState(settings?.githubUsername ?? '')
  const [repoFilters, setRepoFilters] = useState<string[]>(
    settings?.repoFilters?.length ? settings.repoFilters : ['']
  )
  const [notifyOnFailure, setNotifyOnFailure] = useState(settings?.notifyOnFailure ?? true)
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(settings?.notifyOnSuccess ?? true)
  const [showToken, setShowToken] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [discoveredOrgs, setDiscoveredOrgs] = useState<string[]>([])
  const canSave = apiToken.trim().length > 0 && githubUsername.trim().length > 0

  useEffect(() => {
    window.api.getDiscoveredOrgs().then(setDiscoveredOrgs)
  }, [])

  const handleSave = useCallback(async () => {
    const newErrors: Record<string, string> = {}
    if (!apiToken.trim()) newErrors.apiToken = 'API token is required'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    setIsSaving(true)
    try {
      await onSave({
        apiToken: apiToken.trim(),
        githubUsername: githubUsername.trim(),
        repoFilters: repoFilters.map((r) => r.trim()).filter(Boolean),
        notifyOnFailure,
        notifyOnSuccess
      })
    } finally {
      setIsSaving(false)
    }
  }, [apiToken, githubUsername, repoFilters, notifyOnFailure, notifyOnSuccess, onSave])

  const addFilter = useCallback(() => {
    setRepoFilters((prev) => [...prev, ''])
  }, [])

  const removeFilter = useCallback((index: number) => {
    setRepoFilters((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateFilter = useCallback((index: number, value: string) => {
    setRepoFilters((prev) => prev.map((f, i) => (i === index ? value : f)))
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* API Token */}
        <section>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            API Token
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="bkua_xxxxxxxxxxxx"
              className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-buildkite-green/50 pr-10 ${
                errors.apiToken ? 'border-buildkite-red/50' : 'border-buildkite-border'
              }`}
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1"
              tabIndex={-1}
            >
              {showToken ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.apiToken && <p className="text-xs text-buildkite-red mt-1">{errors.apiToken}</p>}
          <p className="text-xs text-gray-500 mt-1.5">
            Create a token at{' '}
            <button
              className="text-buildkite-green hover:underline"
              onClick={() => window.api.openUrl('https://buildkite.com/user/api-access-tokens')}
            >
              buildkite.com/user/api-access-tokens
            </button>
          </p>
        </section>

        {/* Authenticated account */}
        {currentUser && (
          <section>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Authenticated as
            </label>
            <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-buildkite-green/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-buildkite-green">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              "Mine" matches builds by creator, commit author email, or GitHub username branch
              prefix.
            </p>
          </section>
        )}

        {/* GitHub username */}
        <section>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            GitHub username
          </label>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="e.g. CoenWarmer"
            className="w-full bg-white/5 border border-buildkite-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-buildkite-green/50"
            spellCheck={false}
            autoComplete="off"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Buildkite doesn't expose your GitHub username via the API, so enter it manually here.
            Case sensitive.
          </p>
        </section>

        {/* Repo filters */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Repository filter
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Filters the Mine and My team tabs. Leave empty to show all repos.
              </p>
            </div>
            <button
              onClick={addFilter}
              className="flex items-center gap-1 text-xs text-buildkite-green hover:text-green-400 transition-colors flex-shrink-0 ml-3"
            >
              <AddIcon />
              Add
            </button>
          </div>

          {repoFilters.length === 0 && (
            <div className="text-center py-3 text-gray-600 text-xs border border-dashed border-buildkite-border rounded-lg">
              No filters — all repos shown
            </div>
          )}

          <div className="space-y-2">
            {repoFilters.map((filter, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => updateFilter(i, e.target.value)}
                  placeholder="e.g. my-repo or org/repo"
                  className="flex-1 bg-white/5 border border-buildkite-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-buildkite-green/50"
                  spellCheck={false}
                />
                <button
                  onClick={() => removeFilter(i)}
                  className="text-gray-500 hover:text-buildkite-red transition-colors flex-shrink-0"
                  title="Remove filter"
                >
                  <RemoveIcon />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Notifications
          </label>
          <div className="space-y-2">
            <Toggle
              label="Notify when build fails"
              checked={notifyOnFailure}
              onChange={setNotifyOnFailure}
            />
            <Toggle
              label="Notify when build succeeds"
              checked={notifyOnSuccess}
              onChange={setNotifyOnSuccess}
            />
          </div>
        </section>

        {/* Discovered orgs — debug */}
        {discoveredOrgs.length > 0 && (
          <section>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Discovered organisations
            </label>
            <div className="flex flex-wrap gap-1.5">
              {discoveredOrgs.map((slug) => (
                <span
                  key={slug}
                  className="text-xs bg-white/5 text-gray-400 rounded px-2 py-1 font-mono"
                >
                  {slug}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-buildkite-border px-4 py-3 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className="flex-1 py-2 text-sm font-medium text-black bg-buildkite-green hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}): React.JSX.Element {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group">
      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-buildkite-green' : 'bg-buildkite-border'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}
