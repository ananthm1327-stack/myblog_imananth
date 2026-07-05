// Backend-first sync between Supabase and localStorage.
//
// Supabase is the single source of truth for posts + comments once configured:
// pullAll() REPLACES the local mirror with whatever's in the database (no merge,
// no "keep my local-only demo posts" logic) so every reader always sees exactly
// what's in the backend. Reader-only state (bookmarks, "have I reacted") stays
// local by design — it's per-browser, not shared content.
//
// - pullAll() runs at boot, on a background poll, and whenever a realtime event
//   fires, then notifies the UI via emitDataChange() so open pages re-render.
// - pushPost / pushDelete / pushComment / pushCommentUpdate / pushCommentDelete
//   mirror local writes to Supabase, fire-and-forget. Failures are logged, not thrown.

import { client, isSupabaseEnabled, OWNER_TOKEN } from './supabase.js'
import { emitDataChange } from './bus.js'
import { toast } from './toast.js'

const SECTION_KEYS = ['journal', 'photos', 'experiences', 'articles', 'views']
const POLL_INTERVAL_MS = 45_000

function lsKey(section) { return `ia_${section}` }
function saveLocal(section, items) {
  localStorage.setItem(lsKey(section), JSON.stringify(items))
}

// Convert a DB row to the shape store.js expects.
function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body || '',
    image: row.image || '',
    tags: row.tags || [],
    status: row.status || 'published',
    publishAt: row.publish_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
function toRow(section, post) {
  return {
    id: post.id,
    section,
    title: post.title || '',
    body: post.body || '',
    image: post.image || '',
    tags: post.tags || [],
    status: post.status || 'published',
    publish_at: post.publishAt || null,
    created_at: post.createdAt,
    updated_at: new Date().toISOString(),
    owner_token: OWNER_TOKEN
  }
}

// ----- PULL (backend replaces local — no merge) -----
export async function pullAll({ silent = false } = {}) {
  if (!isSupabaseEnabled) return { ok: false, reason: 'disabled' }
  try {
    const [postsRes, commentsRes] = await Promise.all([
      client.from('posts').select('*'),
      client.from('comments').select('*')
    ])
    if (postsRes.error) throw postsRes.error
    if (commentsRes.error) throw commentsRes.error

    const bySection = {}
    SECTION_KEYS.forEach(k => bySection[k] = [])
    postsRes.data.forEach(row => {
      const arr = bySection[row.section]
      if (arr) arr.push(fromRow(row))
    })
    SECTION_KEYS.forEach(section => {
      const sorted = bySection[section].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      saveLocal(section, sorted)
    })

    // Comment map is fully rebuilt from remote too — the backend is authoritative.
    const map = {}
    commentsRes.data.forEach(c => {
      const key = `${c.section}_${c.post_id}`
      if (!map[key]) map[key] = []
      map[key].push({
        id: c.id,
        name: c.name,
        body: c.body,
        createdAt: c.created_at,
        status: c.status,
        reactions: c.reactions || { heart: 0, sparkle: 0 }
      })
    })
    localStorage.setItem('ia_comments', JSON.stringify(map))

    if (!silent) emitDataChange()
    return { ok: true, postCount: postsRes.data.length, commentCount: commentsRes.data.length }
  } catch (e) {
    console.warn('[sync] pull failed', e)
    return { ok: false, reason: e.message }
  }
}

// ----- REALTIME -----
// Subscribes to postgres_changes on posts + comments. Any insert/update/delete
// anywhere triggers a fresh full pull (debounced) so every open tab converges
// on the backend's current state within ~1s of any change, on any device.
//
// Requires the tables to be added to the `supabase_realtime` publication —
// see supabase/schema.sql for the one-line SQL that enables this.
let realtimeChannel = null
let pollTimer = null
let debounceTimer = null

function debouncedPull() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => pullAll(), 300)
}

export function subscribeRealtime() {
  if (!isSupabaseEnabled || realtimeChannel) return
  realtimeChannel = client
    .channel('ia-live-data')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, debouncedPull)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, debouncedPull)
    .subscribe()
  return () => {
    if (realtimeChannel) { client.removeChannel(realtimeChannel); realtimeChannel = null }
  }
}

// Backup for projects where the realtime publication isn't enabled — polls
// on a slow interval so data still converges on the backend eventually.
export function startPolling() {
  if (!isSupabaseEnabled || pollTimer) return
  pollTimer = setInterval(() => pullAll({ silent: false }), POLL_INTERVAL_MS)
  return () => { clearInterval(pollTimer); pollTimer = null }
}

// ----- PUSH (fire-and-forget, but surfaced to the owner on failure) -----
// A silent failure here means the post only ever exists in this browser's
// localStorage — every other device stays stuck on whatever pullAll last saw.
// That's the exact "why can't I see it on my other devices" bug, so any
// push failure (including a missing/misconfigured owner token) gets a toast.
function warnNotSynced(message) {
  toast.error(message, { duration: 6000 })
}
export function pushPost(section, post) {
  if (!isSupabaseEnabled) return
  if (!OWNER_TOKEN) {
    warnNotSynced("Owner token isn't configured — this post is only saved on this device.")
    return
  }
  client.from('posts').upsert(toRow(section, post)).then(({ error }) => {
    if (error) {
      console.warn('[sync] pushPost failed', error)
      warnNotSynced("Couldn't sync this post to the server — it's only on this device for now.")
    }
  })
}
export function pushDelete(section, id) {
  if (!isSupabaseEnabled) return
  if (!OWNER_TOKEN) {
    warnNotSynced("Owner token isn't configured — this delete only applied on this device.")
    return
  }
  client.from('posts').delete().match({ id, section, owner_token: OWNER_TOKEN }).then(({ error }) => {
    if (error) {
      console.warn('[sync] pushDelete failed', error)
      warnNotSynced("Couldn't sync this delete to the server — it may still show on other devices.")
    }
  })
}
export function pushComment(section, postId, comment) {
  if (!isSupabaseEnabled) return
  const row = {
    id: comment.id,
    section, post_id: postId,
    name: comment.name,
    body: comment.body,
    created_at: comment.createdAt,
    status: comment.status || 'pending',
    reactions: comment.reactions || { heart: 0, sparkle: 0 },
    // Stamped on every comment (not just the owner's) so pullAll can select
    // pending rows for moderation. See the note in supabase/schema.sql.
    owner_token: OWNER_TOKEN
  }
  client.from('comments').upsert(row).then(({ error }) => {
    if (error) console.warn('[sync] pushComment failed', error)
  })
}
export function pushCommentUpdate(section, postId, commentId, patch) {
  if (!isSupabaseEnabled) return
  const dbPatch = {}
  if (patch.status !== undefined) dbPatch.status = patch.status
  if (patch.reactions !== undefined) dbPatch.reactions = patch.reactions
  client.from('comments').update(dbPatch).match({ id: commentId, section, post_id: postId }).then(({ error }) => {
    if (error) console.warn('[sync] pushCommentUpdate failed', error)
  })
}
export function pushCommentDelete(section, postId, commentId) {
  if (!isSupabaseEnabled || !OWNER_TOKEN) return
  client.from('comments').delete().match({ id: commentId, section, post_id: postId, owner_token: OWNER_TOKEN }).then(({ error }) => {
    if (error) console.warn('[sync] pushCommentDelete failed', error)
  })
}
