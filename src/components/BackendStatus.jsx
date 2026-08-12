import { isFirebaseEnabled } from '../lib/firebase.js'
import { getSyncStatus } from '../lib/sync.js'
import { useLiveData } from '../lib/bus.js'

// Hand-drawn flame in the Firebase silhouette, tinted to match the
// site's gold. A subtle flicker (gentle scaleY + opacity wobble) plays
// while listeners are streaming; the flame goes still and cool when
// the last snapshot errored, and disappears entirely if there's no
// backend configured.
function Flame({ className = '' }) {
  return (
    <svg className={`bs-flame ${className}`} viewBox="0 0 24 24" width="14" height="16" aria-hidden="true">
      <defs>
        <linearGradient id="bs-flame-fill" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"   stopColor="#e6c37a" />
          <stop offset="55%"  stopColor="#c8a24b" />
          <stop offset="100%" stopColor="#a8842f" />
        </linearGradient>
      </defs>
      {/* Outer flame body */}
      <path
        d="M12 1.4c.5 3.6 3.2 5.4 5.1 7.9 1.8 2.4 2.2 5.4 1.3 8-1.2 3.4-4.5 5.3-6.6 5.3-2.6 0-6-1.9-7-5.4-.9-3.4.3-6 2.4-7.9C7 8 8.5 6.6 8.8 4.6c1 1.4 1.6 2.9 1.8 4.6.9-1.5 1.4-3.4 1.4-7.8z"
        fill="url(#bs-flame-fill)"
      />
      {/* Inner brighter flame — animated flicker only affects this one */}
      <path
        className="bs-flame-inner"
        d="M12.6 9.8c-.2 1.6.4 2.7 1.5 3.9 1 1.1 1.4 2.4 1 3.9-.5 1.6-2 2.7-3.4 2.7-1.5 0-3.2-1-3.6-2.9-.3-1.6.4-2.9 1.5-3.9.9-.8 1.4-1.6 1.6-2.6.5.4.9.7 1.4 1z"
        fill="#fdf3d6"
        opacity="0.75"
      />
    </svg>
  )
}

export default function BackendStatus() {
  useLiveData()

  if (!isFirebaseEnabled) {
    return (
      <div className="backend-status is-off" title="Running against local demo content — no backend configured">
        <span className="bs-dot" aria-hidden="true" />
        <span className="bs-text">Local mode</span>
      </div>
    )
  }

  const { ok, hasPulled } = getSyncStatus()
  const isLive = !hasPulled || ok

  return (
    <div
      className={`backend-status ${isLive ? 'is-live' : 'is-degraded'}`}
      title={isLive
        ? 'Firestore listeners are open and streaming updates in real time'
        : 'The last Firestore snapshot failed — the SDK is retrying automatically'}
    >
      <Flame />
      <span className="bs-text">
        <span className="bs-brand">Firebase</span>
        <span className="bs-sep" aria-hidden="true">&middot;</span>
        <span className="bs-state">{isLive ? 'Live' : 'Reconnecting'}</span>
      </span>
      {isLive && <span className="bs-pulse" aria-hidden="true" />}
    </div>
  )
}
