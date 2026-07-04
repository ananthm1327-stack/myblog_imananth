import { useState } from 'react'
import { loadComments, addComment, moderateComment, isOwner, formatDate, toggleReaction, hasReacted } from '../store.js'
import { toast } from '../lib/toast.js'

export default function Comments({ sectionKey, postId }) {
  const owner = isOwner()
  const [refresh, setRefresh] = useState(0)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const approved = loadComments(sectionKey, postId)
  const all = owner ? loadComments(sectionKey, postId, { includePending: true }) : approved
  const pending = owner ? all.filter(c => c.status === 'pending') : []
  const visible = owner ? all : approved

  const submit = (e) => {
    e.preventDefault()
    const errors = {}
    if (name.trim().length < 2) errors.name = 'Please enter your name (at least 2 characters).'
    if (body.trim().length < 3) errors.body = 'Your comment is too short.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0])
      return
    }
    addComment(sectionKey, postId, { name: name.trim(), body: body.trim() })
    setName(''); setBody(''); setFieldErrors({})
    setStatus({ ok: true, msg: 'Thanks — your comment is awaiting review by Ananth.' })
    toast.success('Comment submitted — awaiting review.')
    setRefresh(x => x + 1)
    setTimeout(() => setStatus(null), 4000)
  }

  const moderate = (id, action) => {
    moderateComment(sectionKey, postId, id, action)
    setRefresh(x => x + 1)
    toast.success(action === 'approve' ? 'Comment approved.' : 'Comment deleted.')
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
              {c.status !== 'pending' && (
                <div className="reactions">
                  <button
                    className={`rx-btn ${hasReacted(sectionKey, postId, c.id, 'heart') ? 'on' : ''}`}
                    onClick={() => { toggleReaction(sectionKey, postId, c.id, 'heart'); setRefresh(x => x + 1) }}
                    aria-label="Heart this comment"
                  >
                    <span className="rx-glyph">&#9829;</span>
                    <span className="rx-count">{(c.reactions?.heart) || 0}</span>
                  </button>
                  <button
                    className={`rx-btn ${hasReacted(sectionKey, postId, c.id, 'sparkle') ? 'on' : ''}`}
                    onClick={() => { toggleReaction(sectionKey, postId, c.id, 'sparkle'); setRefresh(x => x + 1) }}
                    aria-label="Sparkle this comment"
                  >
                    <span className="rx-glyph">&#10022;</span>
                    <span className="rx-count">{(c.reactions?.sparkle) || 0}</span>
                  </button>
                </div>
              )}
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

      <form className="comments-form" onSubmit={submit} noValidate>
        <h4>Leave a comment</h4>
        <p className="comments-note">Comments are moderated. Ananth will read yours before it appears here.</p>
        <label>Your name</label>
        <input
          value={name}
          onChange={e => { setName(e.target.value); fieldErrors.name && setFieldErrors(f => ({ ...f, name: null })) }}
          className={fieldErrors.name ? 'has-error' : ''}
          maxLength={60}
        />
        {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
        <label>Your comment</label>
        <textarea
          value={body}
          onChange={e => { setBody(e.target.value); fieldErrors.body && setFieldErrors(f => ({ ...f, body: null })) }}
          className={fieldErrors.body ? 'has-error' : ''}
          maxLength={2000}
        />
        {fieldErrors.body && <div className="field-error">{fieldErrors.body}</div>}
        <button className="btn" type="submit">Post comment</button>
        {status && <div className={`status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</div>}
      </form>
    </section>
  )
}
