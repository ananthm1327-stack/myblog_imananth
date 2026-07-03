const KEYS = {
  journal: 'ia_journal',
  photos: 'ia_photos',
  experiences: 'ia_experiences',
  articles: 'ia_articles',
  views: 'ia_views',
  owner: 'ia_owner',
  comments: 'ia_comments'
}

// Owner-only posting: change this password to whatever you want.
// Only whoever knows it can create/delete posts. Everyone else is read-only.
export const OWNER_PASSWORD = 'ananth2026'

export const SITE_URL = 'https://imananth.local'

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
    tags: Array.isArray(post.tags) ? post.tags : []
  }
  items.unshift(withId)
  save(key, items)
  return withId
}

export function deletePost(key, id) {
  const items = load(key).filter(p => p.id !== id)
  save(key, items)
}

export function getPost(key, id) {
  return load(key).find(p => p.id === id)
}

export function updatePost(key, id, patch) {
  const items = load(key).map(p => p.id === id ? { ...p, ...patch } : p)
  save(key, items)
}

// Public view = published only; owner sees everything.
export function loadVisible(key, owner) {
  const items = load(key)
  return owner ? items : items.filter(p => (p.status || 'published') === 'published')
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
function loadCommentMap() {
  try {
    const raw = localStorage.getItem(KEYS.comments)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
function saveCommentMap(map) {
  localStorage.setItem(KEYS.comments, JSON.stringify(map))
}
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
  return comment
}

export function moderateComment(sectionKey, postId, commentId, action) {
  const map = loadCommentMap()
  const k = commentKey(sectionKey, postId)
  const list = map[k] || []
  if (action === 'delete') {
    map[k] = list.filter(c => c.id !== commentId)
  } else if (action === 'approve') {
    map[k] = list.map(c => c.id === commentId ? { ...c, status: 'approved' } : c)
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
  const items = load(sectionKey).filter(p => (p.status || 'published') === 'published')
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
