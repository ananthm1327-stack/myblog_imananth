import { useState } from 'react'
import { Link } from 'react-router-dom'
import { pendingComments, moderateComment, isOwner, formatDate, generateSitemap } from '../store.js'
import { useLiveData } from '../lib/bus.js'
import { Page } from '../components/Decor.jsx'
import { toast } from '../lib/toast.js'

export default function Moderation() {
  useLiveData()
  const [rev, setRev] = useState(0)
  const owner = isOwner()

  if (!owner) {
    return (
      <Page label="Moderation">
        <div className="post-detail">
          <h1>Moderation</h1>
          <p style={{ color: 'var(--titanium)' }}>You need to sign in as owner to see this page.</p>
        </div>
      </Page>
    )
  }

  const pending = pendingComments()
  const act = (c, action) => {
    moderateComment(c.sectionKey, c.postId, c.id, action)
    setRev(x => x + 1)
    toast.success(action === 'approve' ? 'Comment approved.' : 'Comment deleted.')
  }

  const downloadSitemap = () => {
    const xml = generateSitemap(window.location.origin)
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.xml'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
  const openSitemap = () => {
    const xml = generateSitemap(window.location.origin)
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <Page label="Moderation">
      <div className="section-header">
        <h2>Moderation Queue</h2>
        <div className="section-actions">
          <button className="btn small ghost" onClick={openSitemap}>View sitemap</button>
          <button className="btn small ghost" onClick={downloadSitemap}>Download sitemap.xml</button>
          <span className="meta" style={{ margin: 0 }}>{pending.length} pending</span>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="empty">No comments waiting. Inbox zero.</div>
      ) : (
        <ul className="mod-list">
          {pending.map(c => (
            <li key={c.id} className="mod-item">
              <div className="mod-head">
                <strong>{c.name}</strong>
                <span className="mod-context">
                  on <Link to={`/${c.sectionKey}/${c.postId}`}>{c.sectionKey}/{c.postId}</Link>
                </span>
                <span className="mod-date">{formatDate(c.createdAt)}</span>
              </div>
              <div className="mod-body">{c.body}</div>
              <div className="mod-actions">
                <button className="btn small" onClick={() => act(c, 'approve')}>Approve</button>
                <button className="btn small danger" onClick={() => act(c, 'delete')}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
