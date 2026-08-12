// Firebase client init. Migrated from Supabase; the app's data model and
// UX stayed the same, only the transport underneath changed.
//
// Configure by creating a .env.local with:
//   VITE_FIREBASE_API_KEY=…
//   VITE_FIREBASE_AUTH_DOMAIN=…
//   VITE_FIREBASE_PROJECT_ID=…
//   VITE_FIREBASE_STORAGE_BUCKET=…
//   VITE_FIREBASE_MESSAGING_SENDER_ID=…
//   VITE_FIREBASE_APP_ID=…
//   VITE_OWNER_TOKEN=…   (same shared-secret pattern as before)

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const OWNER_TOKEN = import.meta.env.VITE_OWNER_TOKEN || ''
export const isFirebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let _app = null, _db = null, _storage = null
if (isFirebaseEnabled) {
  _app = initializeApp(firebaseConfig)
  _db = getFirestore(_app)
  _storage = getStorage(_app)
}

export const app = _app
export const db = _db
export const storage = _storage

export function backendStatus() {
  if (!isFirebaseEnabled) return { enabled: false, reason: 'env not configured' }
  return { enabled: true, projectId: firebaseConfig.projectId }
}
