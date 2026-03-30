import React from 'react'
import { Build, FailedJob as FailedJobType } from '../../../../shared/types'
import { FailedJobIcon } from '../../../shared/Icons'

interface Props {
  job: FailedJobType
  build: Build
}

export default function FailedJob({ job, build }: Props): React.JSX.Element {
  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    window.api.openUrl(build.webUrl)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 w-full text-left group"
      title={`Open failed job: ${job.name}`}
    >
      <FailedJobIcon />
      <span className="text-xs text-buildkite-red group-hover:text-red-400 truncate leading-tight underline underline-offset-2 decoration-red-500/40">
        {job.name}
      </span>
    </button>
  )
}
