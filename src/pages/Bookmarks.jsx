import { useState } from 'react'
import { Link } from 'react-router-dom'
import { allBookmarks, toggleBookmark, formatDate } from '../store.js'
import { Page } from '../components/Decor.jsx'
import { stripHtml } from '../lib/sanitize.js'
import Meta from '../components/Meta.jsx'

export default function Bookmarks() {
  const [rev, setRev] = useState(0)
  const items = allBookmarks()

  const removeBookmark = (sectionKey, id) => {
    toggleBookmark(sectionKey, id)
    setRev(x => x + 1)
  }

  return (
    <Page label="Bookmarks">
      <Meta title="Bookmarks" description="Posts you've saved for later reading." />
      <div className="section-header">
        <h2>Bookmarks</h2>
        <span className="meta" style={{ margin: 0 }}>{items.length} saved</span>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          Nothing saved yet. Tap the bookmark icon on any post to save it here.
        </div>
      ) : (
        <div className="grid">
          {items.map(({ sectionKey, post }) => (
            <div key={`${sectionKey}-${post.id}`} className="card" style={{ position: 'relative' }}>
              <Link to={`/${sectionKey}/${post.id}`} style={{ display: 'block' }}>
                {post.image && <img src={post.image} alt="" />}
                <div className="meta">
                  {formatDate(post.createdAt)} &middot; <span style={{ color: 'var(--gold-deep)' }}>{sectionKey}</span>
                </div>
                <h3 dangerouslySetInnerHTML={{ __html: stripHtml(post.title) }} />
                <p>{stripHtml(post.body || '').slice(0, 140)}{stripHtml(post.body || '').length > 140 ? '…' : ''}</p>
              </Link>
              <button
                className="btn small danger"
                style={{ marginTop: 12 }}
                onClick={() => removeBookmark(sectionKey, post.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </Page>
  )
}
