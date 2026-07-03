// Very small HTML sanitizer for a whitelist of tags/attrs.
// Runs on all rich-text content before render. Since only the owner posts,
// this is defense-in-depth (paste hygiene, accidental script tags, etc.).

const ALLOWED_TAGS = new Set([
  'A','B','I','U','STRONG','EM','MARK','CODE',
  'P','BR','DIV','SPAN',
  'H1','H2','H3','H4','H5','H6',
  'UL','OL','LI',
  'BLOCKQUOTE','PRE',
  'HR'
])

// Only allow safe attributes; href gets a scheme check.
const ALLOWED_ATTRS = {
  A: ['href', 'target', 'rel'],
  '*': [] // no others
}

function isSafeUrl(url) {
  if (!url) return false
  const trimmed = String(url).trim().toLowerCase()
  return trimmed.startsWith('http://') ||
         trimmed.startsWith('https://') ||
         trimmed.startsWith('mailto:') ||
         trimmed.startsWith('/') ||
         trimmed.startsWith('#')
}

function cleanNode(node) {
  const children = [...node.childNodes]
  children.forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName
      if (!ALLOWED_TAGS.has(tag)) {
        // Unwrap unknown tags — keep their text content.
        while (child.firstChild) node.insertBefore(child.firstChild, child)
        node.removeChild(child)
        return
      }
      // Strip attributes not in the allowlist for this tag.
      const allowed = new Set(ALLOWED_ATTRS[tag] || ALLOWED_ATTRS['*'])
      const attrs = [...child.attributes]
      attrs.forEach(a => {
        if (!allowed.has(a.name)) { child.removeAttribute(a.name); return }
        if (a.name === 'href' && !isSafeUrl(a.value)) { child.removeAttribute(a.name) }
      })
      // Force external links to open safely.
      if (tag === 'A') {
        const href = child.getAttribute('href') || ''
        if (/^https?:/.test(href)) {
          child.setAttribute('target', '_blank')
          child.setAttribute('rel', 'noopener noreferrer')
        }
      }
      cleanNode(child)
    } else if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child)
    }
  })
}

export function sanitize(html) {
  if (typeof html !== 'string' || !html) return ''
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstChild
  cleanNode(root)
  return root.innerHTML
}

// Convert HTML to plain text — used for card previews and RSS descriptions.
export function stripHtml(html) {
  if (!html) return ''
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent || ''
}
