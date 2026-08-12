// Firestore-backed sync between backend and localStorage.
//
// Firestore is the single source of truth once configured. The local
// mirror is kept for two reasons:
//   1. Every existing UI reader (Home/Section/PostDetail/Bookmarks/…)
//      reads synchronously via `load()` in store.js. Keeping the mirror
//      means we don't have to rewrite them all to be async.
//   2. Offline-friendly: last-known content still renders even if
//      Firestore listeners haven't reconnected yet.
//
// Where Supabase used `pullAll()` + a 45s poll + realtime, Firestore
// uses `onSnapshot`: a single listener per collection that fires
// whenever *any* document changes, delivering just the changed docs.
// So there is no poll, no debounce, no reconnect timer — the SDK
// handles all of that for us. subscribeAll() sets up two listeners
// (posts, comments) and returns an unsubscribe function.

import {
  collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs
} from 'firebase/firestore'
import { db, isFirebaseEnabled, OWNER_TOKEN } from './firebase.js'
import { emitDataChange } from './bus.js'
import { toast } from './toast.js'

const SECTION_KEYS = ['journal', 'photos', 'experiences', 'articles', 'views']

function lsKey(section) { return `ia_${section}` }
function saveLocal(section, items) {
  localStorage.setItem(lsKey(section), JSON.stringify(items))
}

// Firestore doc → the shape store.js expects.
function fromDoc(snap) {
  const d = snap.data()
  return {
    id: snap.id,
    title: d.title,
    body: d.body || '',
    image: d.image || '',
    tags: d.tags || [],
    status: d.status || 'published',
    publishAt: d.publishAt || null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt || d.createdAt,
    section: d.section
  }
}
function toDoc(section, post) {
  return {
    section,
    title: post.title || '',
    body: post.body || '',
    image: post.image || '',
    tags: post.tags || [],
    status: post.status || 'published',
    publishAt: post.publishAt || null,
    createdAt: post.createdAt,
    updatedAt: new Date().toISOString(),
    ownerToken: OWNER_TOKEN
  }
}

// ---------- Sync-status API (unchanged shape from Supabase) ----------
let lastSyncOk = true
let hasSyncedOnce = false
export function getSyncStatus() { return { ok: lastSyncOk, hasPulled: hasSyncedOnce } }

// ---------- The initial + subscription flow ----------
let unsubPosts = null
let unsubComments = null

// Rebuild the local mirror for a single section from a Firestore snapshot.
function applyPostsSnapshot(snap) {
  const bySection = {}
  SECTION_KEYS.forEach(k => bySection[k] = [])
  snap.forEach(d => {
    const p = fromDoc(d)
    const arr = bySection[p.section]
    if (arr) arr.push(p)
  })
  SECTION_KEYS.forEach(section => {
    const sorted = bySection[section].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    saveLocal(section, sorted)
  })
}

function applyCommentsSnapshot(snap) {
  const map = {}
  snap.forEach(d => {
    const c = d.data()
    const key = `${c.section}_${c.postId}`
    if (!map[key]) map[key] = []
    map[key].push({
      id: d.id,
      name: c.name,
      body: c.body,
      createdAt: c.createdAt,
      status: c.status,
      reactions: c.reactions || { heart: 0, sparkle: 0 }
    })
  })
  localStorage.setItem('ia_comments', JSON.stringify(map))
}

export function subscribeAll() {
  if (!isFirebaseEnabled) return { ok: false, reason: 'disabled' }
  if (unsubPosts) return { ok: true, alreadyRunning: true }

  // Posts listener — receives every published + owner-visible doc.
  // Security rules gate what a given caller can see (public gets only
  // published, owner-token queries can pull drafts + scheduled).
  unsubPosts = onSnapshot(
    collection(db, 'posts'),
    (snap) => {
      applyPostsSnapshot(snap)
      hasSyncedOnce = true
      lastSyncOk = true
      emitDataChange()
    },
    (err) => {
      console.warn('[sync] posts listener error', err)
      hasSyncedOnce = true
      lastSyncOk = false
      emitDataChange()
    }
  )

  // Comments listener — approved for everyone, plus owner-token
  // pending for the moderation queue.
  unsubComments = onSnapshot(
    collection(db, 'comments'),
    (snap) => {
      applyCommentsSnapshot(snap)
      emitDataChange()
    },
    (err) => {
      console.warn('[sync] comments listener error', err)
    }
  )

  return { ok: true }
}

export function unsubscribeAll() {
  if (unsubPosts) { unsubPosts(); unsubPosts = null }
  if (unsubComments) { unsubComments(); unsubComments = null }
}

// Manual refresh (used by EmptyState's retry button when a listener has
// failed and the user wants to force a fresh fetch).
export async function pullAll() {
  if (!isFirebaseEnabled) return { ok: false, reason: 'disabled' }
  try {
    const [postsSnap, commentsSnap] = await Promise.all([
      getDocs(collection(db, 'posts')),
      getDocs(collection(db, 'comments'))
    ])
    applyPostsSnapshot(postsSnap)
    applyCommentsSnapshot(commentsSnap)
    hasSyncedOnce = true
    lastSyncOk = true
    emitDataChange()
    return { ok: true, postCount: postsSnap.size, commentCount: commentsSnap.size }
  } catch (e) {
    console.warn('[sync] pull failed', e)
    hasSyncedOnce = true
    lastSyncOk = false
    emitDataChange()
    return { ok: false, reason: e.message }
  }
}

// ---------- Kept for API compatibility with old call sites ----------
export function subscribeRealtime() { subscribeAll() }
export function startPolling() { /* no-op — onSnapshot handles this natively */ }
export function subscribeLifecycle() {
  // Firestore SDK re-establishes listeners on network reconnect and tab
  // visibility change automatically; nothing for us to do here. Left as
  // a no-op so main.jsx's import chain doesn't break.
}

// ---------- PUSH (fire-and-forget with visible failure) ----------
function warnNotSynced(message) { toast.error(message, { duration: 6000 }) }

export function pushPost(section, post) {
  if (!isFirebaseEnabled) return
  if (!OWNER_TOKEN) {
    warnNotSynced("Owner token isn't configured — this post is only saved on this device.")
    return
  }
  setDoc(doc(db, 'posts', post.id), toDoc(section, post))
    .catch(e => {
      console.warn('[sync] pushPost failed', e)
      warnNotSynced("Couldn't sync this post to the server — it's only on this device for now.")
    })
}

export function pushDelete(section, id) {
  if (!isFirebaseEnabled) return
  if (!OWNER_TOKEN) {
    warnNotSynced("Owner token isn't configured — this delete only applied on this device.")
    return
  }
  deleteDoc(doc(db, 'posts', id))
    .catch(e => {
      console.warn('[sync] pushDelete failed', e)
      warnNotSynced("Couldn't sync this delete to the server — it may still show on other devices.")
    })
}

export function pushComment(section, postId, comment) {
  if (!isFirebaseEnabled) return
  const payload = {
    section, postId,
    name: comment.name,
    body: comment.body,
    createdAt: comment.createdAt,
    status: comment.status || 'pending',
    reactions: comment.reactions || { heart: 0, sparkle: 0 },
    // Stamped on every comment (not just the owner's) so the owner's
    // moderation listener can select pending rows. Same rationale as
    // the Supabase schema note.
    ownerToken: OWNER_TOKEN
  }
  setDoc(doc(db, 'comments', comment.id), payload)
    .catch(e => console.warn('[sync] pushComment failed', e))
}

export function pushCommentUpdate(section, postId, commentId, patch) {
  if (!isFirebaseEnabled) return
  const dbPatch = {}
  if (patch.status !== undefined) dbPatch.status = patch.status
  if (patch.reactions !== undefined) dbPatch.reactions = patch.reactions
  if (Object.keys(dbPatch).length === 0) return
  updateDoc(doc(db, 'comments', commentId), dbPatch)
    .catch(e => console.warn('[sync] pushCommentUpdate failed', e))
}

export function pushCommentDelete(section, postId, commentId) {
  if (!isFirebaseEnabled || !OWNER_TOKEN) return
  deleteDoc(doc(db, 'comments', commentId))
    .catch(e => console.warn('[sync] pushCommentDelete failed', e))
}
