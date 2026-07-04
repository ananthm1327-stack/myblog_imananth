// Two-way sync between localStorage and Supabase.
// Local storage stays the display layer — this module just mirrors changes.
//
// - pullAll() runs once on app boot when Supabase is configured.
//   It fetches all rows and merges into localStorage without clobbering unsynced local edits.
// - pushPost / pushDelete / pushComment / pushModerate are fire-and-forget mirrors
//   called from store.js after a successful local write. Failures are logged, not thrown.

import { client, isSupabaseEnabled, OWNER_TOKEN } from './supabase.js'

const SECTION_KEYS = ['journal', 'photos', 'experiences', 'articles', 'views']

function lsKey(section) { return `ia_${section}` }
function loadLocal(section) {
  try { return JSON.parse(localStorage.getItem(lsKey(section)) || '[]') } catch { return [] }
}
function saveLocal(section, items) {
  localStorage.setItem(lsKey(section), JSON.stringify(items))
}

// Merge remote rows into local: keep whichever version has the newer updated_at.
// Preserves any local-only posts (e.g. saved offline before backend was enabled).
function mergeInto(local, remote) {
  const byId = new Map()
  local.forEach(p => byId.set(p.id, p))
  remote.forEach(r => {
    const existing = byId.get(r.id)
    if (!existing) { byId.set(r.id, r); return }
    const lu = new Date(existing.updatedAt || existing.createdAt || 0).getTime()
    const ru = new Date(r.updatedAt || r.createdAt || 0).getTime()
    byId.set(r.id, ru >= lu ? r : existing)
  })
  return [...byId.values()].sort((a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  )
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

// ----- PULL -----
export async function pullAll() {
  if (!isSupabaseEnabled) return { ok: false, reason: 'disabled' }
  try {
    const [postsRes, commentsRes] = await Promise.all([
      client.from('posts').select('*'),
      client.from('comments').select('*')
    ])
    if (postsRes.error) throw postsRes.error
    if (commentsRes.error) throw commentsRes.error

    // Group posts by section and merge.
    const bySection = {}
    SECTION_KEYS.forEach(k => bySection[k] = [])
    postsRes.data.forEach(row => {
      const arr = bySection[row.section]
      if (arr) arr.push(fromRow(row))
    })
    SECTION_KEYS.forEach(section => {
      const merged = mergeInto(loadLocal(section), bySection[section])
      saveLocal(section, merged)
    })

    // Rebuild comment map from remote (owner + reader view differ; store all).
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
    // Merge with existing local comments (keep pending local, take approved remote).
    const localMapRaw = localStorage.getItem('ia_comments')
    const localMap = localMapRaw ? JSON.parse(localMapRaw) : {}
    Object.keys(localMap).forEach(k => {
      const localList = localMap[k] || []
      const remoteList = map[k] || []
      const remoteIds = new Set(remoteList.map(c => c.id))
      const localOnly = localList.filter(c => !remoteIds.has(c.id))
      map[k] = [...remoteList, ...localOnly]
    })
    localStorage.setItem('ia_comments', JSON.stringify(map))

    return { ok: true, postCount: postsRes.data.length, commentCount: commentsRes.data.length }
  } catch (e) {
    console.warn('[sync] pull failed', e)
    return { ok: false, reason: e.message }
  }
}

// ----- PUSH (fire-and-forget) -----
export function pushPost(section, post) {
  if (!isSupabaseEnabled || !OWNER_TOKEN) return
  client.from('posts').upsert(toRow(section, post)).then(({ error }) => {
    if (error) console.warn('[sync] pushPost failed', error)
  })
}
export function pushDelete(section, id) {
  if (!isSupabaseEnabled || !OWNER_TOKEN) return
  client.from('posts').delete().match({ id, section, owner_token: OWNER_TOKEN }).then(({ error }) => {
    if (error) console.warn('[sync] pushDelete failed', error)
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
    reactions: comment.reactions || { heart: 0, sparkle: 0 }
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
