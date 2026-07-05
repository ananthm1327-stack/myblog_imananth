import { useState } from 'react'
import { getSyncStatus, pullAll } from '../lib/sync.js'
import { isSupabaseEnabled } from '../lib/supabase.js'
import { toast } from '../lib/toast.js'

// Tells "genuinely nothing published yet" apart from "the pull from the
// backend failed on this device" — previously both looked identical
// (an empty section), which is exactly what made the cross-device sync
// bug so hard to notice: a reader had no way to tell the difference.
export default function EmptyState({ label = 'Nothing here yet.' }) {
  const [retrying, setRetrying] = useState(false)
  const { ok, hasPulled } = getSyncStatus()
  const showRetry = isSupabaseEnabled && hasPulled && !ok

  if (!showRetry) return <div className="empty">{label}</div>

  const retry = async () => {
    setRetrying(true)
    const res = await pullAll()
    setRetrying(false)
    if (!res.ok) toast.error("Still couldn't reach the server — check your connection.")
  }

  return (
    <div className="empty empty-error">
      Couldn't load the latest posts. Your connection may have dropped.
      <button type="button" className="empty-retry" onClick={retry} disabled={retrying}>
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  )
}
