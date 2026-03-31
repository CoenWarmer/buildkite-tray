import React from 'react'
import { Build } from '../../shared/types'

export function EyeIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1 7C1 7 3 3 7 3C11 3 13 7 13 7C13 7 11 11 7 11C3 11 1 7 1 7Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export function EyeOffIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2L12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path
        d="M6 3.2C6.3 3.1 6.6 3 7 3C11 3 13 7 13 7C13 7 12.4 8.2 11.4 9.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M4 4.6C2.4 5.6 1 7 1 7C1 7 3 11 7 11C8.2 11 9.2 10.5 10 9.9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function KeyIcon(): React.JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="15" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13 10L21 10M19 10L19 13M16 10L16 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CheckIcon({ color = 'currentColor' }: { color?: string }): React.JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path
        d="M8 12L11 15L16 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BranchIcon(): React.JSX.Element {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="text-gray-500 flex-shrink-0"
    >
      <circle cx="3" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="3" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="7.5" cy="4" r="1.5" stroke="currentColor" strokeWidth="1" />
      <path
        d="M3 4V6M3 4C3 5.5 7.5 5.5 7.5 4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function StateIcon({ state }: { state: Build['state'] }): React.JSX.Element {
  if (state === 'running') {
    return (
      <div className="flex-shrink-0 w-4 h-4 relative">
        <div className="absolute inset-0 rounded-full bg-buildkite-yellow/20 animate-ping" />
        <div className="relative w-4 h-4 rounded-full bg-buildkite-yellow/30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-buildkite-yellow" />
        </div>
      </div>
    )
  }

  if (state === 'passed') {
    return (
      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-buildkite-green/20 flex items-center justify-center">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M1.5 4L3 5.5L6.5 2"
            stroke="#14cc80"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  if (state === 'failed') {
    return (
      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-buildkite-red/20 flex items-center justify-center">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M2 2L6 6M6 2L2 6" stroke="#f83f23" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  if (state === 'scheduled' || state === 'blocked') {
    return (
      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-buildkite-yellow/20 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-buildkite-yellow" />
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-600/30 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-gray-500" />
    </div>
  )
}

export function BuildkiteLogo(): React.JSX.Element {
  return (
    <div className="w-5 h-5 rounded flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 480 320">
        <g clipPath="url(#a)">
          <path fill="#14CC80" d="M320 160v160l160-80V80l-160 80Z" />
          <path fill="#30F2A2" d="M320 0v160l160-80L320 0Z" />
          <path fill="#14CC80" d="M160 80v160l160-80V0L160 80Z" />
          <path fill="#30F2A2" d="M0 0v160l160 80V80L0 0Z" />
        </g>
        <defs>
          <clipPath id="a">
            <path fill="#fff" d="M0 0h480v320H0z" />
          </clipPath>
        </defs>
      </svg>
    </div>
  )
}

export function ChevronLeftIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 12L6 8L10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function RefreshIcon({ spinning }: { spinning: boolean }): React.JSX.Element {
  return (
    <svg
      className={spinning ? 'animate-spin' : ''}
      focusable="false"
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
    >
      <path
        fill="currentColor"
        d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z"
      ></path>
    </svg>
  )
}

export function GearIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      id="Settings--Streamline-Solar-Ar"
      height="16"
      width="16"
    >
      <path stroke="currentColor" d="M9 12a3 3 0 1 0 6 0 3 3 0 1 0 -6 0" strokeWidth="2"></path>
      <path
        d="M13.7654 2.15224C13.3978 2 12.9319 2 12 2c-0.9319 0 -1.3978 0 -1.7654 0.15224 -0.49003 0.20299 -0.87938 0.59234 -1.08237 1.08239 -0.09266 0.22371 -0.12893 0.48387 -0.14312 0.86336 -0.02085 0.55769 -0.30685 1.0739 -0.79017 1.35294 -0.4833 0.27903 -1.07335 0.26861 -1.56675 0.00783 -0.33574 -0.17746 -0.57918 -0.27614 -0.81925 -0.30774 -0.5259 -0.06924 -1.05776 0.07327 -1.47858 0.39618 -0.31562 0.24218 -0.54859 0.6457 -1.01453 1.45273 -0.46594 0.80704 -0.69891 1.21055 -0.75084 1.60498 -0.06923 0.52589 0.07328 1.05775 0.39619 1.47859 0.14738 0.1921 0.35452 0.3535 0.67601 0.5555 0.47261 0.297 0.7767 0.8029 0.77667 1.361 -0.00003 0.5581 -0.30411 1.0639 -0.77668 1.3608 -0.32153 0.2021 -0.5287 0.3636 -0.6761 0.5557 -0.32291 0.4208 -0.46542 0.9526 -0.39618 1.4785 0.05192 0.3944 0.28489 0.798 0.75083 1.605 0.46595 0.807 0.69892 1.2106 1.01453 1.4527 0.42082 0.3229 0.95268 0.4654 1.47858 0.3962 0.24005 -0.0316 0.48348 -0.1303 0.8192 -0.3077 0.49343 -0.2608 1.08352 -0.2712 1.56686 0.0078 0.48334 0.2791 0.76936 0.7953 0.79021 1.3531 0.0142 0.3794 0.05046 0.6396 0.14312 0.8633 0.20299 0.49 0.59234 0.8794 1.08237 1.0824C10.6022 22 11.0681 22 12 22c0.9319 0 1.3978 0 1.7654 -0.1522 0.49 -0.203 0.8794 -0.5924 1.0823 -1.0824 0.0927 -0.2237 0.129 -0.4839 0.1432 -0.8634 0.0208 -0.5577 0.3068 -1.0739 0.7901 -1.353 0.4833 -0.2791 1.0734 -0.2686 1.5669 -0.0078 0.3357 0.1774 0.5791 0.276 0.8191 0.3076 0.5259 0.0693 1.0578 -0.0732 1.4786 -0.3961 0.3156 -0.2422 0.5486 -0.6457 1.0145 -1.4528 0.466 -0.807 0.699 -1.2105 0.7509 -1.6049 0.0692 -0.5259 -0.0733 -1.0578 -0.3962 -1.4786 -0.1474 -0.1921 -0.3546 -0.3536 -0.6761 -0.5556 -0.4725 -0.2969 -0.7766 -0.8028 -0.7766 -1.3609s0.3041 -1.0638 0.7766 -1.3607c0.3216 -0.2021 0.5288 -0.3635 0.6762 -0.5557 0.3229 -0.42077 0.4654 -0.95263 0.3962 -1.47853 -0.0519 -0.39442 -0.2849 -0.79794 -0.7509 -1.60497 -0.4659 -0.80703 -0.6989 -1.21055 -1.0145 -1.45273 -0.4208 -0.32291 -0.9527 -0.46542 -1.4786 -0.39618 -0.24 0.0316 -0.4834 0.13027 -0.8192 0.30771 -0.4934 0.26079 -1.0835 0.27122 -1.5668 -0.00784 -0.4834 -0.27905 -0.7694 -0.7953 -0.7902 -1.35302 -0.0142 -0.37946 -0.0505 -0.63961 -0.1432 -0.86331 -0.2029 -0.49005 -0.5923 -0.8794 -1.0823 -1.08239Z"
        stroke="currentColor"
        strokeWidth="2"
      ></path>
    </svg>
  )
}

export function PinIcon({ pinned }: { pinned: boolean }): React.JSX.Element {
  return pinned ? (
    // Filled pin — window is locked open
    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path
        fill-rule="evenodd"
        fill="currentColor"
        d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3"
      ></path>
    </svg>
  ) : (
    // Outline pin — click to pin
    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="currentColor"
        d="M14 4v5c0 1.12.37 2.16 1 3H9c.65-.86 1-1.9 1-3V4zm3-2H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3V4h1c.55 0 1-.45 1-1s-.45-1-1-1"
      ></path>
    </svg>
  )
}

export function QuitIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M9 4.5L12 7L9 9.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function WarningIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L13 13H1L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 6V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
    </svg>
  )
}

export function DismissIcon(): React.JSX.Element {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function AddIcon(): React.JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function RemoveIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function FailedJobIcon(): React.JSX.Element {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="flex-shrink-0 text-buildkite-red"
    >
      <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1" />
      <path
        d="M3.5 3.5L6.5 6.5M6.5 3.5L3.5 6.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Notification icons

export function NotificationCheckIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path
        d="M1.5 4L3 5.5L6.5 2"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CrossIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M2 2L6 6M6 2L2 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function CloseIcon(): React.JSX.Element {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function NotificationBranchIcon(): React.JSX.Element {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="text-gray-500 flex-shrink-0"
    >
      <circle cx="3" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="3" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="7.5" cy="4" r="1.5" stroke="currentColor" strokeWidth="1" />
      <path
        d="M3 4V6M3 4C3 5.5 7.5 5.5 7.5 4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function NotificationFailedJobIcon(): React.JSX.Element {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className="flex-shrink-0 text-buildkite-red"
    >
      <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1" />
      <path
        d="M3.5 3.5L6.5 6.5M6.5 3.5L3.5 6.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
