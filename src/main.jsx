import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { seedIfEmpty } from './seed.js'
import { pullAll, subscribeRealtime, startPolling, subscribeLifecycle } from './lib/sync.js'
import { isSupabaseEnabled } from './lib/supabase.js'
import './styles.css'

if (isSupabaseEnabled) {
  // Backend is the source of truth — don't seed demo content that would
  // never exist in Supabase. Pull immediately, then stay live via realtime
  // (with a slow poll as a backup in case realtime isn't enabled on the project).
  pullAll().then(res => {
    if (res.ok) console.info(`[sync] pulled ${res.postCount} posts, ${res.commentCount} comments`)
  })
  subscribeRealtime()
  startPolling()
  subscribeLifecycle()
} else {
  // No backend configured — fall back to local demo content so the site
  // isn't empty on first run.
  seedIfEmpty()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
