import { pushPost, pushDelete, pushComment, pushCommentUpdate, pushCommentDelete } from './lib/sync.js'
import { deleteImageByUrl } from './lib/storage.js'

const KEYS = {
  journal: 'ia_journal',
  photos: 'ia_photos',
  experiences: 'ia_experiences',
  articles: 'ia_articles',
  views: 'ia_views',
  owner: 'ia_owner',
  comments: 'ia_comments',
  bookmarks: 'ia_bookmarks',
  reactions: 'ia_reactions_mine'
}

export const SECTIONS_META = [
  { key: 'journal', label: 'Journal' },
  { key: 'photos', label: 'Photos' },
  { key: 'experiences', label: 'Experiences' },
  { key: 'articles', label: 'Articles' },
  { key: 'views', label: 'Views' }
]

// Owner-only posting: change this password to whatever you want.
// Only whoever knows it can create/delete posts. Everyone else is read-only.
export const OWNER_PASSWORD = 'ananth2026'

// Public URL of the site — used for canonical links, og:url, and the sitemap.
// Resolution order:
//   1. VITE_SITE_URL env var (set this in Vercel if you have a custom domain)
//   2. window.location.origin at runtime (best default — always matches the current deploy)
//   3. Fallback for build-time contexts
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://imananth.local')
).replace(/\/$/, '')

export function load(key) {
  try {
    const raw = localStorage.getItem(KEYS[key])
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function save(key, items) {
  localStorage.setItem(KEYS[key], JSON.stringify(items))
}

export function addPost(key, post) {
  const items = load(key)
  const withId = {
    ...post,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: post.status || 'published',
    tags: Array.isArray(post.tags) ? post.tags : [],
    publishAt: post.publishAt || null
  }
  items.unshift(withId)
  save(key, items)
  pushPost(key, withId)
  return withId
}

// True when a post should show to the public (owner sees everything).
// Scheduled posts (status=published, publishAt in the future) are hidden until then.
export function isLivePost(p) {
  if (!p) return false
  if ((p.status || 'published') !== 'published') return false
  if (p.publishAt) {
    const scheduled = new Date(p.publishAt).getTime()
    if (isFinite(scheduled) && scheduled > Date.now()) return false
  }
  return true
}
export function isScheduled(p) {
  if (!p || (p.status || 'published') !== 'published' || !p.publishAt) return false
  const t = new Date(p.publishAt).getTime()
  return isFinite(t) && t > Date.now()
}

export function deletePost(key, id) {
  const existing = load(key).find(p => p.id === id)
  const items = load(key).filter(p => p.id !== id)
  save(key, items)
  pushDelete(key, id)
  // Free the Storage object too, so deleted posts don't leave orphan images
  // eating quota. Best-effort — Storage delete is fire-and-forget.
  if (existing?.image) deleteImageByUrl(existing.image)
}

export function getPost(key, id) {
  return load(key).find(p => p.id === id)
}

export function updatePost(key, id, patch) {
  let updated = null
  const items = load(key).map(p => {
    if (p.id !== id) return p
    updated = { ...p, ...patch }
    return updated
  })
  save(key, items)
  if (updated) pushPost(key, updated)
}

// Public view = published + not-scheduled-in-the-future. Owner sees everything.
export function loadVisible(key, owner) {
  const items = load(key)
  return owner ? items : items.filter(isLivePost)
}

// ----- SEARCH -----
function scoreMatch(text, q) {
  if (!text) return 0
  const hay = String(text).toLowerCase()
  const needle = q.toLowerCase()
  const idx = hay.indexOf(needle)
  return idx === -1 ? 0 : (idx === 0 ? 3 : 1)
}
function textFromHtml(s) {
  if (!s) return ''
  try {
    const el = document.createElement('div')
    el.innerHTML = s
    return el.textContent || ''
  } catch { return String(s) }
}
export function searchAll(query, sectionKeys, { includeUnpublished = false } = {}) {
  const q = String(query || '').trim().toLowerCase()
  if (q.length < 2) return []
  const results = []
  sectionKeys.forEach(sectionKey => {
    load(sectionKey).forEach(p => {
      if (!includeUnpublished && !isLivePost(p)) return
      const title = textFromHtml(p.title)
      const body = textFromHtml(p.body)
      const tagLine = (p.tags || []).join(' ')
      const s = scoreMatch(title, q) * 5 + scoreMatch(body, q) * 2 + scoreMatch(tagLine, q) * 3
      if (s > 0) {
        const snippet = extractSnippet(body || title, q)
        results.push({ sectionKey, post: p, score: s, snippet, title })
      }
    })
  })
  return results.sort((a, b) => b.score - a.score)
}
function extractSnippet(text, q) {
  if (!text) return ''
  const hay = text
  const idx = hay.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return hay.slice(0, 140)
  const start = Math.max(0, idx - 40)
  const end = Math.min(hay.length, idx + q.length + 100)
  return (start > 0 ? '…' : '') + hay.slice(start, end) + (end < hay.length ? '…' : '')
}

// ----- BOOKMARKS (reader-side) -----
function loadBookmarkSet() {
  try {
    const raw = localStorage.getItem(KEYS.bookmarks)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}
function saveBookmarkSet(set) {
  localStorage.setItem(KEYS.bookmarks, JSON.stringify([...set]))
}
export function bookmarkKey(sectionKey, postId) { return `${sectionKey}:${postId}` }
export function isBookmarked(sectionKey, postId) {
  return loadBookmarkSet().has(bookmarkKey(sectionKey, postId))
}
export function toggleBookmark(sectionKey, postId) {
  const set = loadBookmarkSet()
  const k = bookmarkKey(sectionKey, postId)
  if (set.has(k)) set.delete(k); else set.add(k)
  saveBookmarkSet(set)
  return set.has(k)
}
export function allBookmarks() {
  const set = loadBookmarkSet()
  const out = []
  for (const k of set) {
    const [sectionKey, postId] = k.split(':')
    const post = getPost(sectionKey, postId)
    if (post && isLivePost(post)) out.push({ sectionKey, post })
  }
  return out
}

// ----- REACTIONS (♥ / ✦) — per-reader "already reacted" tracking + counts -----
function loadMyReactions() {
  try {
    const raw = localStorage.getItem(KEYS.reactions)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}
function saveMyReactions(set) {
  localStorage.setItem(KEYS.reactions, JSON.stringify([...set]))
}
function reactionKey(sectionKey, postId, commentId, kind) {
  return `${sectionKey}:${postId}:${commentId}:${kind}`
}
export function hasReacted(sectionKey, postId, commentId, kind) {
  return loadMyReactions().has(reactionKey(sectionKey, postId, commentId, kind))
}
export function toggleReaction(sectionKey, postId, commentId, kind) {
  const map = _loadCommentMap()
  const k = `${sectionKey}_${postId}`
  const list = map[k] || []
  const my = loadMyReactions()
  const myKey = reactionKey(sectionKey, postId, commentId, kind)
  const alreadyReacted = my.has(myKey)
  map[k] = list.map(c => {
    if (c.id !== commentId) return c
    const reactions = { heart: 0, sparkle: 0, ...(c.reactions || {}) }
    reactions[kind] = Math.max(0, (reactions[kind] || 0) + (alreadyReacted ? -1 : 1))
    return { ...c, reactions }
  })
  _saveCommentMap(map)
  if (alreadyReacted) my.delete(myKey); else my.add(myKey)
  saveMyReactions(my)
  const patched = (map[k] || []).find(c => c.id === commentId)
  if (patched) pushCommentUpdate(sectionKey, postId, commentId, { reactions: patched.reactions })
  return !alreadyReacted
}

// ----- TAGS -----
export function normalizeTags(raw) {
  if (Array.isArray(raw)) return raw.map(t => String(t).trim().toLowerCase()).filter(Boolean)
  return String(raw || '')
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
}

export function allTags(sectionKeys) {
  const counts = {}
  sectionKeys.forEach(k => {
    load(k).forEach(p => {
      if ((p.status || 'published') !== 'published') return
      ;(p.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1 })
    })
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }))
}

// ----- COMMENTS (moderated) -----
// Shape: { [`${sectionKey}_${postId}`]: [ { id, name, body, createdAt, status: 'pending' | 'approved' } ] }
function _loadCommentMap() {
  try {
    const raw = localStorage.getItem(KEYS.comments)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
function _saveCommentMap(map) {
  localStorage.setItem(KEYS.comments, JSON.stringify(map))
}
const loadCommentMap = _loadCommentMap
const saveCommentMap = _saveCommentMap
function commentKey(sectionKey, postId) { return `${sectionKey}_${postId}` }

export function loadComments(sectionKey, postId, { includePending = false } = {}) {
  const map = loadCommentMap()
  const list = map[commentKey(sectionKey, postId)] || []
  return includePending ? list : list.filter(c => c.status === 'approved')
}

export function addComment(sectionKey, postId, { name, body }) {
  const map = loadCommentMap()
  const k = commentKey(sectionKey, postId)
  const list = map[k] || []
  const comment = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    name: String(name || 'Anonymous').slice(0, 60),
    body: String(body || '').slice(0, 2000),
    createdAt: new Date().toISOString(),
    status: 'pending'
  }
  list.push(comment)
  map[k] = list
  saveCommentMap(map)
  pushComment(sectionKey, postId, comment)
  return comment
}

export function moderateComment(sectionKey, postId, commentId, action) {
  const map = loadCommentMap()
  const k = commentKey(sectionKey, postId)
  const list = map[k] || []
  if (action === 'delete') {
    map[k] = list.filter(c => c.id !== commentId)
    pushCommentDelete(sectionKey, postId, commentId)
  } else if (action === 'approve') {
    map[k] = list.map(c => c.id === commentId ? { ...c, status: 'approved' } : c)
    pushCommentUpdate(sectionKey, postId, commentId, { status: 'approved' })
  }
  saveCommentMap(map)
}

// Moderation queue — every pending comment across every post.
export function pendingComments() {
  const map = loadCommentMap()
  const out = []
  Object.entries(map).forEach(([k, list]) => {
    const [sectionKey, postId] = k.split('_')
    list.forEach(c => {
      if (c.status !== 'pending') return
      out.push({ ...c, sectionKey, postId })
    })
  })
  return out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// ----- AUTH -----
export function isOwner() {
  return sessionStorage.getItem(KEYS.owner) === '1'
}

export function login(password) {
  if (password === OWNER_PASSWORD) {
    sessionStorage.setItem(KEYS.owner, '1')
    return true
  }
  return false
}

export function logout() {
  sessionStorage.removeItem(KEYS.owner)
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return '' }
}

// ----- RSS -----
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlToPlain(html) {
  if (!html) return ''
  try {
    const el = document.createElement('div')
    el.innerHTML = html
    return el.textContent || ''
  } catch { return String(html) }
}

export function generateRSS(sectionKey, label, siteUrl = SITE_URL) {
  const items = load(sectionKey).filter(isLivePost)
  const now = new Date().toUTCString()
  const rssItems = items.map(p => {
    const desc = htmlToPlain(p.body).slice(0, 500)
    return `    <item>
      <title>${esc(htmlToPlain(p.title))}</title>
      <link>${siteUrl}/${sectionKey}/${p.id}</link>
      <guid isPermaLink="false">${sectionKey}-${p.id}</guid>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
      <description>${esc(desc)}${desc.length >= 500 ? '…' : ''}</description>
      ${(p.tags || []).map(t => `<category>${esc(t)}</category>`).join('\n      ')}
    </item>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>I'm Ananth — ${esc(label)}</title>
    <link>${siteUrl}/${sectionKey}</link>
    <description>The ${esc(label.toLowerCase())} feed from I'm Ananth.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
${rssItems}
  </channel>
</rss>`
}

// ----- SITEMAP -----
export function generateSitemap(siteUrl = SITE_URL) {
  const now = new Date().toISOString().slice(0, 10)
  const staticPages = ['', '/about', '/contact',
    ...SECTIONS_META.map(s => `/${s.key}`)]
  const urls = staticPages.map(path =>
    `  <url><loc>${siteUrl}${path}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`
  )
  SECTIONS_META.forEach(({ key }) => {
    load(key).filter(isLivePost).forEach(p => {
      const lastmod = (p.updatedAt || p.createdAt || new Date().toISOString()).slice(0, 10)
      urls.push(`  <url><loc>${siteUrl}/${key}/${p.id}</loc><lastmod>${lastmod}</lastmod></url>`)
    })
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}
