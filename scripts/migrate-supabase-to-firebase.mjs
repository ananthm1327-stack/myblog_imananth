#!/usr/bin/env node
// One-off migration: copies every post + comment + image from Supabase
// into Firestore + Firebase Storage. Idempotent within a run (skips
// docs that already exist in Firestore by matching id).
//
// Prerequisites in .env.local:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_OWNER_TOKEN
//     (must still be set — script reads FROM Supabase)
//   VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID,
//   VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_AUTH_DOMAIN,
//   VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
//     (must be set — script writes TO Firebase)
//
// Usage:
//   node scripts/migrate-supabase-to-firebase.mjs
//   node scripts/migrate-supabase-to-firebase.mjs --dry-run
//
// The script uses the Firebase client SDK (not admin) so it authenticates
// exactly the same way the browser does. Writes are gated by the
// ownerToken field which every doc includes — that matches the security
// rules in firebase/firestore.rules.

import fs from 'node:fs'
import path from 'node:path'

// ---------- env ----------
const envRaw = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8')
const env = {}
envRaw.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
})
for (const k of [
  'VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY','VITE_OWNER_TOKEN',
  'VITE_FIREBASE_API_KEY','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_APP_ID'
]) {
  if (!env[k]) { console.error(`Missing ${k} in .env.local`); process.exit(1) }
}
const DRY_RUN = process.argv.includes('--dry-run')

// ---------- Firebase client ----------
const { initializeApp } = await import('firebase/app')
const { getFirestore, doc, setDoc, collection, getDocs, query, where } = await import('firebase/firestore')
const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage')

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
})
const db = getFirestore(app)
const storage = getStorage(app)

// ---------- Helpers ----------
const supaHeaders = {
  apikey: env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
  'x-owner-token': env.VITE_OWNER_TOKEN
}
async function supa(pathAndQuery) {
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/${pathAndQuery}`
  const r = await fetch(url, { headers: supaHeaders })
  if (!r.ok) throw new Error(`Supabase ${pathAndQuery} → ${r.status} ${await r.text()}`)
  return r.json()
}

async function existingFirestoreIds(col) {
  // Filter by ownerToken so the rule allows the read — an unfiltered
  // collection scan can't be gated by "each doc must be published OR
  // owned", so Firestore rejects it upfront with permission-denied.
  const q = query(collection(db, col), where('ownerToken', '==', env.VITE_OWNER_TOKEN))
  const snap = await getDocs(q)
  const set = new Set()
  snap.forEach(d => set.add(d.id))
  return set
}

function extForContentType(ct) {
  const map = { 'image/jpeg':'jpg','image/jpg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg' }
  return map[ct?.toLowerCase()] || 'bin'
}

// ---------- Migrate images ----------
// For each post that has an image URL pointing at Supabase Storage,
// download the bytes, upload them to Firebase Storage under the same
// section prefix, and return the new download URL. Rows whose image is
// empty, a data: URI, or already a firebasestorage URL are passed through.
async function migrateImageUrl(oldUrl, section) {
  if (!oldUrl) return ''
  if (oldUrl.startsWith('data:')) {
    // Extremely rare — could theoretically still be a base64 leftover
    // from before the Supabase Storage migration. Push a warning.
    console.warn('  ! post has a base64 data: URL; leaving as-is (paste manually if needed)')
    return oldUrl
  }
  if (oldUrl.includes('firebasestorage.googleapis.com')) return oldUrl
  if (!oldUrl.includes('supabase.co/storage/')) return oldUrl

  const res = await fetch(oldUrl)
  if (!res.ok) throw new Error(`download ${oldUrl} → ${res.status}`)
  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  const bytes = new Uint8Array(await res.arrayBuffer())
  const ext = extForContentType(contentType)
  const rand = Math.random().toString(36).slice(2,10)
  const objectPath = `post-images/${section}/${Date.now()}-${rand}.${ext}`
  if (DRY_RUN) return `[DRY: would upload ${bytes.length} bytes → ${objectPath}]`
  const objectRef = ref(storage, objectPath)
  await uploadBytes(objectRef, bytes, {
    contentType,
    cacheControl: 'public, max-age=31536000, immutable',
    customMetadata: { ownerToken: env.VITE_OWNER_TOKEN }
  })
  return await getDownloadURL(objectRef)
}

// ---------- Migrate posts ----------
async function migratePosts() {
  console.log('\n=== POSTS ===')
  const rows = await supa('posts?select=*')
  console.log(`Supabase posts: ${rows.length}`)
  const existing = await existingFirestoreIds('posts')
  console.log(`Already in Firestore: ${existing.size}`)
  let migrated = 0, skipped = 0, failed = 0
  for (const p of rows) {
    if (existing.has(p.id)) { skipped++; console.log(`  skip ${p.id} (already in Firestore)`); continue }
    try {
      const newImage = await migrateImageUrl(p.image, p.section)
      const docData = {
        section: p.section,
        title: p.title,
        body: p.body || '',
        image: newImage || '',
        tags: p.tags || [],
        status: p.status || 'published',
        publishAt: p.publish_at || null,
        createdAt: p.created_at,
        updatedAt: p.updated_at || p.created_at,
        ownerToken: env.VITE_OWNER_TOKEN
      }
      if (DRY_RUN) {
        console.log(`  DRY: would write posts/${p.id} — ${p.title.slice(0, 40)}`)
      } else {
        await setDoc(doc(db, 'posts', p.id), docData)
        console.log(`  ok   posts/${p.id} — ${p.title.slice(0, 40)}`)
      }
      migrated++
    } catch (e) {
      failed++
      console.error(`  fail posts/${p.id} — ${e.message}`)
    }
  }
  console.log(`Posts done: migrated=${migrated} skipped=${skipped} failed=${failed}`)
}

// ---------- Migrate comments ----------
async function migrateComments() {
  console.log('\n=== COMMENTS ===')
  const rows = await supa('comments?select=*')
  console.log(`Supabase comments: ${rows.length}`)
  const existing = await existingFirestoreIds('comments')
  console.log(`Already in Firestore: ${existing.size}`)
  let migrated = 0, skipped = 0, failed = 0
  for (const c of rows) {
    if (existing.has(c.id)) { skipped++; continue }
    try {
      const docData = {
        section: c.section,
        postId: c.post_id,
        name: c.name,
        body: c.body,
        status: c.status || 'pending',
        reactions: c.reactions || { heart: 0, sparkle: 0 },
        createdAt: c.created_at,
        ownerToken: env.VITE_OWNER_TOKEN
      }
      if (DRY_RUN) {
        console.log(`  DRY: would write comments/${c.id} — ${c.name}`)
      } else {
        await setDoc(doc(db, 'comments', c.id), docData)
        console.log(`  ok   comments/${c.id} — ${c.name}`)
      }
      migrated++
    } catch (e) {
      failed++
      console.error(`  fail comments/${c.id} — ${e.message}`)
    }
  }
  console.log(`Comments done: migrated=${migrated} skipped=${skipped} failed=${failed}`)
}

// ---------- Main ----------
console.log(DRY_RUN ? 'DRY RUN — no writes' : 'LIVE RUN — data will be written to Firebase')
console.log(`Supabase: ${env.VITE_SUPABASE_URL}`)
console.log(`Firebase: ${env.VITE_FIREBASE_PROJECT_ID}`)
await migratePosts()
await migrateComments()
console.log('\nDone.')
process.exit(0)
