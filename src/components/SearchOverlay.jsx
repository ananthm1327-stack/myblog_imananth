import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchAll, formatDate, SECTIONS_META, isOwner } from '../store.js'

const SECTION_KEYS = SECTIONS_META.map(s => s.key)
const SECTION_LABELS = Object.fromEntries(SECTIONS_META.map(s => [s.key, s.label]))

function highlight(text, q) {
  if (!q || !text) return text
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig')
  const parts = String(text).split(re)
  return parts.map((p, i) =>
    i % 2 === 1 ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>
  )
}

export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const results = useMemo(() => {
    if (!q || q.trim().length < 2) return []
    return searchAll(q.trim(), SECTION_KEYS, { includeUnpublished: isOwner() })
  }, [q])

  if (!open) return null
  return (
    <div className="sx-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search">
      <div className="sx-panel" onClick={e => e.stopPropagation()}>
        <div className="sx-input-wrap">
          <span className="sx-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </span>
          <input
            ref={inputRef}
            className="sx-input"
            placeholder="Search journals, photos, articles…"
            value={q}
            onChange={e => setQ(e.target.value)}
            autoComplete="off"
          />
          <button className="sx-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        {q.trim().length >= 2 && (
          <div className="sx-meta">
            {results.length === 0 ? 'No matches yet — try a shorter word.' : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </div>
        )}

        <div className="sx-results">
          {results.slice(0, 25).map(r => (
            <Link
              key={`${r.sectionKey}-${r.post.id}`}
              to={`/${r.sectionKey}/${r.post.id}`}
              className="sx-result"
              onClick={onClose}
            >
              <div className="sx-result-head">
                <span className="sx-section">{SECTION_LABELS[r.sectionKey]}</span>
                <span className="sx-date">{formatDate(r.post.createdAt)}</span>
              </div>
              <div className="sx-title">{highlight(r.title, q.trim())}</div>
              <div className="sx-snippet">{highlight(r.snippet, q.trim())}</div>
              {(r.post.tags || []).length > 0 && (
                <div className="sx-tags">
                  {r.post.tags.slice(0, 4).map(t => <span key={t} className="sx-tag">#{t}</span>)}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="sx-hint">
          <kbd>Esc</kbd> to close &middot; results include titles, bodies, and tags across every section
        </div>
      </div>
    </div>
  )
}
