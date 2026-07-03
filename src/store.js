const KEYS = {
  journal: 'ia_journal',
  photos: 'ia_photos',
  experiences: 'ia_experiences',
  articles: 'ia_articles',
  views: 'ia_views',
  owner: 'ia_owner'
}

// Owner-only posting: change this password to whatever you want.
// Only whoever knows it can create/delete posts. Everyone else is read-only.
export const OWNER_PASSWORD = 'ananth2026'

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
  const withId = { ...post, id: Date.now().toString(), createdAt: new Date().toISOString() }
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
