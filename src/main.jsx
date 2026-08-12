import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { seedIfEmpty } from './seed.js'
import { subscribeAll } from './lib/sync.js'
import { isFirebaseEnabled } from './lib/firebase.js'
import './styles.css'

if (isFirebaseEnabled) {
  // Firestore is the source of truth. subscribeAll() opens onSnapshot
  // listeners on posts + comments that rehydrate the local mirror
  // whenever anything changes, so all pages re-render automatically.
  // The Firebase SDK handles reconnect/backoff/visibility natively —
  // no separate poll or lifecycle wiring needed.
  subscribeAll()
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
