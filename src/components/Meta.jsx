import { useEffect } from 'react'
import { SITE_URL } from '../store.js'

const DEFAULTS = {
  title: "I'm Ananth",
  description: "Journals, photographs, experiences, articles, and honest views by Ananth Machiraju.",
  image: '/logo.png',
  type: 'website'
}

function setMeta(name, content, isProperty = false) {
  if (content == null) return
  const attr = isProperty ? 'property' : 'name'
  let el = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', String(content))
}

function setCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

// Renders no DOM; imperatively syncs the document.title, canonical URL,
// og:*, and twitter:* meta tags whenever its props change.
export default function Meta({ title, description, image, path, type, article }) {
  useEffect(() => {
    const t = title ? `${title} · I'm Ananth` : DEFAULTS.title
    const d = description || DEFAULTS.description
    const rawImg = image || DEFAULTS.image
    const img = rawImg.startsWith('http') || rawImg.startsWith('data:') ? rawImg : `${SITE_URL}${rawImg}`
    const url = `${SITE_URL}${path || (typeof window !== 'undefined' ? window.location.pathname : '/')}`
    const tp = type || DEFAULTS.type

    document.title = t
    setMeta('description', d)
    setCanonical(url)

    setMeta('og:title', t, true)
    setMeta('og:description', d, true)
    setMeta('og:image', img, true)
    setMeta('og:url', url, true)
    setMeta('og:type', tp, true)
    setMeta('og:site_name', "I'm Ananth", true)

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', t)
    setMeta('twitter:description', d)
    setMeta('twitter:image', img)

    if (article) {
      if (article.publishedTime) setMeta('article:published_time', article.publishedTime, true)
      if (article.author) setMeta('article:author', article.author, true)
      if (article.section) setMeta('article:section', article.section, true)
      if (Array.isArray(article.tags)) {
        // Remove old article:tag entries
        document.head.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove())
        article.tags.forEach(tag => {
          const el = document.createElement('meta')
          el.setAttribute('property', 'article:tag')
          el.setAttribute('content', tag)
          document.head.appendChild(el)
        })
      }
    }
  }, [title, description, image, path, type, article])

  return null
}
