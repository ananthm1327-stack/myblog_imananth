import { isFirebaseEnabled } from '../lib/firebase.js'
import { getSyncStatus } from '../lib/sync.js'
import { useLiveData } from '../lib/bus.js'

// Tiny "connected to Firebase" indicator for the footer. Re-renders
// on the same data-change bus that pages listen to, so it flips to
// the "offline" state within one snapshot of a listener failure and
// back to "live" the moment reconnection lands.
export default function BackendStatus() {
  useLiveData()
  if (!isFirebaseEnabled) {
    return (
      <div className="backend-status is-off" title="Running against local demo content — no backend configured">
        <span className="backend-dot" aria-hidden="true" />
        <span>Local mode</span>
      </div>
    )
  }
  const { ok, hasPulled } = getSyncStatus()
  const isLive = !hasPulled || ok
  return (
    <div
      className={`backend-status ${isLive ? 'is-live' : 'is-degraded'}`}
      title={isLive ? 'Firestore listeners are open and streaming updates' : 'The last Firestore snapshot failed; the SDK is retrying'}
    >
      <span className="backend-dot" aria-hidden="true" />
      <span>Firebase &middot; {isLive ? 'live' : 'offline'}</span>
    </div>
  )
}
