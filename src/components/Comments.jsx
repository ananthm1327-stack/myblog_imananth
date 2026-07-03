import { useState } from 'react'
import { loadComments, addComment, moderateComment, isOwner, formatDate } from '../store.js'

export default function Comments({ sectionKey, postId }) {
  const owner = isOwner()
  const [refresh, setRefresh] = useState(0)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState(null)

  const approved = loadComments(sectionKey, postId)
  const all = owner ? loadComments(sectionKey, postId, { includePending: true }) : approved
  const pending = owner ? all.filter(c => c.status === 'pending') : []
  const visible = owner ? all : approved

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim() || !body.trim()) return
    addComment(sectionKey, postId, { name, body })
    setName(''); setBody('')
    setStatus({ ok: true, msg: 'Thanks — your comment is awaiting review by Ananth.' })
    setRefresh(x => x + 1)
    setTimeout(() => setStatus(null), 4000)
  }

  const moderate = (id, action) => {
    moderateComment(sectionKey, postId, id, action)
    setRefresh(x => x + 1)
  }

  return (
    <section className="comments">
      <div className="comments-head">
        <h3>Comments {approved.length > 0 && <span className="comments-count">({approved.length})</span>}</h3>
        {owner && pending.length > 0 && (
          <span className="comments-pending-pill">{pending.length} pending</span>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="comments-empty">Be the first to share what you think.</p>
      ) : (
        <ul className="comments-list">
          {visible.map(c => (
            <li key={c.id} className={`comment ${c.status === 'pending' ? 'is-pending' : ''}`}>
              <div className="comment-head">
                <strong className="comment-name">{c.name}</strong>
                <span className="comment-date">{formatDate(c.createdAt)}</span>
                {c.status === 'pending' && <span className="comment-badge">Pending</span>}
              </div>
              <div className="comment-body">{c.body}</div>
              {owner && (
                <div className="comment-mod">
                  {c.status === 'pending' && (
                    <button className="btn small" onClick={() => moderate(c.id, 'approve')}>Approve</button>
                  )}
                  <button className="btn small danger" onClick={() => moderate(c.id, 'delete')}>Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="comments-form" onSubmit={submit}>
        <h4>Leave a comment</h4>
        <p className="comments-note">Comments are moderated. Ananth will read yours before it appears here.</p>
        <label>Your name</label>
        <input value={name} onChange={e => setName(e.target.value)} required maxLength={60} />
        <label>Your comment</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} required maxLength={2000} />
        <button className="btn" type="submit">Post comment</button>
        {status && <div className={`status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</div>}
      </form>
    </section>
  )
}
