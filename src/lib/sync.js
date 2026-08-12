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
// Firestore's rule engine can only allow a query when the query's own
// filters guarantee every returned doc will pass the read rule. That
// means an unfiltered `collection('posts')` scan is rejected upfront
// even if all current docs happen to be public — a future draft could
// be returned, so Firestore refuses the query in advance.
//
// So we run TWO listeners per collection:
//   • a "public" listener filtered to what the reader-facing rule
//     allows (status == 'published' / status == 'approved')
//   • an "owner" listener filtered by ownerToken (drafts, scheduled
//     posts, pending comments — anything the owner needs to moderate)
// Their results are merged into a single local mirror by id.
//
// The Firebase SDK handles reconnect / backoff / visibility natively,
// so there is no poll, no debounce, no lifecycle wiring here.

import {
  collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs
} from 'firebase/firestore'
import { db, isFirebaseEnabled, OWNER_TOKEN } from './firebase.js'
import { emitDataChange } from './bus.js'
import { toast } from './toast.js'

const SECTION_KEYS = ['journal', 'photos', 'experiences', 'articles', 'views']

function lsKey(section) { return `ia_${section}` }
function saveLocal(section, items) {
  localStorage.setItem(lsKey(section), JSON.stringify(items))
}

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

// ---------- Sync-status API (unchanged shape) ----------
let lastSyncOk = true
let hasSyncedOnce = false
export function getSyncStatus() { return { ok: lastSyncOk, hasPulled: hasSyncedOnce } }

// ---------- Merged caches from the two listeners ----------
// Keyed by doc id. Owner cache overrides public cache when the same
// doc appears in both (they'll be identical if published — this just
// means owner-only drafts also make it into the mirror).
let postsPublicCache = new Map()
let postsOwnerCache = new Map()
let commentsPublicCache = new Map()
let commentsOwnerCache = new Map()

function rebuildPostsMirror() {
  const merged = new Map()
  for (const [id, p] of postsPublicCache) merged.set(id, p)
  for (const [id, p] of postsOwnerCache)  merged.set(id, p)
  const bySection = {}
  SECTION_KEYS.forEach(k => bySection[k] = [])
  for (const post of merged.values()) {
    const arr = bySection[post.section]
    if (arr) arr.push(post)
  }
  SECTION_KEYS.forEach(section => {
    const sorted = bySection[section].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    saveLocal(section, sorted)
  })
}

function rebuildCommentsMirror() {
  const merged = new Map()
  for (const [id, c] of commentsPublicCache) merged.set(id, c)
  for (const [id, c] of commentsOwnerCache)  merged.set(id, c)
  const map = {}
  for (const c of merged.values()) {
    const key = `${c.section}_${c.postId}`
    if (!map[key]) map[key] = []
    map[key].push(c)
  }
  localStorage.setItem('ia_comments', JSON.stringify(map))
}

// ---------- Subscriptions ----------
let unsubs = []

function subOnce(fn, label) {
  try { return fn() }
  catch (e) { console.warn(`[sync] ${label} subscribe threw`, e); return null }
}

export function subscribeAll() {
  if (!isFirebaseEnabled) return { ok: false, reason: 'disabled' }
  if (unsubs.length) return { ok: true, alreadyRunning: true }

  // Public posts listener — anyone can subscribe; rule permits every
  // returned doc because the query guarantees status == 'published'.
  const publicPostsQ = query(collection(db, 'posts'), where('status', '==', 'published'))
  unsubs.push(subOnce(() => onSnapshot(
    publicPostsQ,
    (snap) => {
      postsPublicCache = new Map()
      snap.forEach(d => postsPublicCache.set(d.id, fromDoc(d)))
      rebuildPostsMirror()
      hasSyncedOnce = true; lastSyncOk = true
      emitDataChange()
    },
    (err) => {
      console.warn('[sync] public posts listener error', err)
      hasSyncedOnce = true; lastSyncOk = false
      emitDataChange()
    }
  ), 'public posts'))

  // Owner posts listener — filtered by ownerToken so the rule can
  // verify. Returns drafts + scheduled + everything else the owner
  // has authored. The token is embedded in the bundle already (same
  // shared-secret model as Supabase), so this listener is present in
  // every reader's session; the UI gates draft visibility client-side
  // via isOwner() in store.js.
  if (OWNER_TOKEN) {
    const ownerPostsQ = query(collection(db, 'posts'), where('ownerToken', '==', OWNER_TOKEN))
    unsubs.push(subOnce(() => onSnapshot(
      ownerPostsQ,
      (snap) => {
        postsOwnerCache = new Map()
        snap.forEach(d => postsOwnerCache.set(d.id, fromDoc(d)))
        rebuildPostsMirror()
        emitDataChange()
      },
      (err) => { console.warn('[sync] owner posts listener error', err) }
    ), 'owner posts'))
  }

  // Public comments listener — approved only, so any reader's client
  // can render the thread on a post detail page.
  const publicCommentsQ = query(collection(db, 'comments'), where('status', '==', 'approved'))
  unsubs.push(subOnce(() => onSnapshot(
    publicCommentsQ,
    (snap) => {
      commentsPublicCache = new Map()
      snap.forEach(d => {
        const c = d.data()
        commentsPublicCache.set(d.id, {
          id: d.id, section: c.section, postId: c.postId, name: c.name,
          body: c.body, createdAt: c.createdAt, status: c.status,
          reactions: c.reactions || { heart: 0, sparkle: 0 }
        })
      })
      rebuildCommentsMirror()
      emitDataChange()
    },
    (err) => { console.warn('[sync] public comments listener error', err) }
  ), 'public comments'))

  // Owner comments listener — includes pending for the moderation queue.
  if (OWNER_TOKEN) {
    const ownerCommentsQ = query(collection(db, 'comments'), where('ownerToken', '==', OWNER_TOKEN))
    unsubs.push(subOnce(() => onSnapshot(
      ownerCommentsQ,
      (snap) => {
        commentsOwnerCache = new Map()
        snap.forEach(d => {
          const c = d.data()
          commentsOwnerCache.set(d.id, {
            id: d.id, section: c.section, postId: c.postId, name: c.name,
            body: c.body, createdAt: c.createdAt, status: c.status,
            reactions: c.reactions || { heart: 0, sparkle: 0 }
          })
        })
        rebuildCommentsMirror()
        emitDataChange()
      },
      (err) => { console.warn('[sync] owner comments listener error', err) }
    ), 'owner comments'))
  }

  return { ok: true }
}

export function unsubscribeAll() {
  unsubs.forEach(u => { if (typeof u === 'function') u() })
  unsubs = []
}

// Manual refresh (EmptyState "retry" button when a listener errored).
// getDocs mirrors the split-query pattern the listeners use.
export async function pullAll() {
  if (!isFirebaseEnabled) return { ok: false, reason: 'disabled' }
  try {
    const publicPosts = await getDocs(query(collection(db, 'posts'), where('status', '==', 'published')))
    postsPublicCache = new Map()
    publicPosts.forEach(d => postsPublicCache.set(d.id, fromDoc(d)))

    const publicComments = await getDocs(query(collection(db, 'comments'), where('status', '==', 'approved')))
    commentsPublicCache = new Map()
    publicComments.forEach(d => {
      const c = d.data()
      commentsPublicCache.set(d.id, {
        id: d.id, section: c.section, postId: c.postId, name: c.name,
        body: c.body, createdAt: c.createdAt, status: c.status,
        reactions: c.reactions || { heart: 0, sparkle: 0 }
      })
    })

    if (OWNER_TOKEN) {
      const ownerPosts = await getDocs(query(collection(db, 'posts'), where('ownerToken', '==', OWNER_TOKEN)))
      postsOwnerCache = new Map()
      ownerPosts.forEach(d => postsOwnerCache.set(d.id, fromDoc(d)))
      const ownerComments = await getDocs(query(collection(db, 'comments'), where('ownerToken', '==', OWNER_TOKEN)))
      commentsOwnerCache = new Map()
      ownerComments.forEach(d => {
        const c = d.data()
        commentsOwnerCache.set(d.id, {
          id: d.id, section: c.section, postId: c.postId, name: c.name,
          body: c.body, createdAt: c.createdAt, status: c.status,
          reactions: c.reactions || { heart: 0, sparkle: 0 }
        })
      })
    }

    rebuildPostsMirror()
    rebuildCommentsMirror()
    hasSyncedOnce = true; lastSyncOk = true
    emitDataChange()
    const totalPosts = new Set([...postsPublicCache.keys(), ...postsOwnerCache.keys()]).size
    const totalComments = new Set([...commentsPublicCache.keys(), ...commentsOwnerCache.keys()]).size
    return { ok: true, postCount: totalPosts, commentCount: totalComments }
  } catch (e) {
    console.warn('[sync] pull failed', e)
    hasSyncedOnce = true; lastSyncOk = false
    emitDataChange()
    return { ok: false, reason: e.message }
  }
}

// ---------- Kept for API compatibility ----------
export function subscribeRealtime() { subscribeAll() }
export function startPolling() { /* no-op — onSnapshot handles this natively */ }
export function subscribeLifecycle() { /* no-op — SDK handles it */ }

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
