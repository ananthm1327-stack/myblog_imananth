import { useState } from 'react'
import { Link } from 'react-router-dom'
import { pendingComments, moderateComment, isOwner, formatDate } from '../store.js'
import { Page } from '../components/Decor.jsx'

export default function Moderation() {
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
  const act = (c, action) => { moderateComment(c.sectionKey, c.postId, c.id, action); setRev(x => x + 1) }

  return (
    <Page label="Moderation">
      <div className="section-header">
        <h2>Moderation Queue</h2>
        <span className="meta" style={{ margin: 0 }}>{pending.length} pending</span>
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
