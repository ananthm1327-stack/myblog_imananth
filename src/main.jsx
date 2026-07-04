import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { seedIfEmpty } from './seed.js'
import { pullAll } from './lib/sync.js'
import { isSupabaseEnabled } from './lib/supabase.js'
import './styles.css'

seedIfEmpty()

// Pull once at boot so local storage catches up with any cross-device edits.
// Failures are logged but never block the UI.
if (isSupabaseEnabled) {
  pullAll().then(res => {
    if (res.ok) console.info(`[sync] pulled ${res.postCount} posts, ${res.commentCount} comments`)
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
