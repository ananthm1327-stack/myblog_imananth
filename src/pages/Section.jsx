import { useState } from 'react'
import { Link } from 'react-router-dom'
import { load, addPost, deletePost, isOwner, formatDate } from '../store.js'

export default function Section({ sectionKey, label }) {
  const [items, setItems] = useState(load(sectionKey))
  const [showForm, setShowForm] = useState(false)
  const owner = isOwner()

  const refresh = () => setItems(load(sectionKey))

  const onDelete = (id) => {
    if (confirm('Delete this post?')) { deletePost(sectionKey, id); refresh() }
  }

  const isPhotos = sectionKey === 'photos'

  return (
    <>
      <div className="section-header">
        <h2>{label}</h2>
        {owner && (
          <button className="btn small" onClick={() => setShowForm(true)}>+ New {label.slice(0, -1) || label}</button>
        )}
      </div>

      {!owner && (
        <p style={{ color: 'var(--titanium)', fontStyle: 'italic', marginBottom: 24 }}>
          Read-only view. Only Ananth can post here.
        </p>
      )}

      {items.length === 0 ? (
        <div className="empty">No posts yet.</div>
      ) : isPhotos ? (
        <div className="photo-grid">
          {items.map(p => (
            <div key={p.id} className="photo" style={{ position: 'relative' }}>
              <Link to={`/${sectionKey}/${p.id}`}>
                <img src={p.image} alt={p.title} />
              </Link>
              <div className="photo-caption">{p.title}</div>
              {owner && (
                <button className="btn small danger" style={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={() => onDelete(p.id)}>×</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid">
          {items.map(p => (
            <div key={p.id} className="card" style={{ position: 'relative' }}>
              <Link to={`/${sectionKey}/${p.id}`} style={{ display: 'block' }}>
                {p.image && <img src={p.image} alt="" />}
                <div className="meta">{formatDate(p.createdAt)}</div>
                <h3>{p.title}</h3>
                <p>{(p.body || '').slice(0, 140)}{(p.body || '').length > 140 ? '…' : ''}</p>
              </Link>
              {owner && (
                <button className="btn small danger" style={{ marginTop: 12 }}
                  onClick={() => onDelete(p.id)}>Delete</button>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PostForm
          sectionKey={sectionKey}
          isPhotos={isPhotos}
          onClose={() => setShowForm(false)}
          onSaved={() => { refresh(); setShowForm(false) }}
        />
      )}
    </>
  )
}

function PostForm({ sectionKey, isPhotos, onClose, onSaved }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState('')

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result)
    reader.readAsDataURL(f)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    if (isPhotos && !image) { alert('Please choose a photo.'); return }
    addPost(sectionKey, { title, body, image })
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>New Post</h2>
        <form className="form" onSubmit={submit}>
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required />

          {!isPhotos && (
            <>
              <label>Body</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your thoughts…" />
            </>
          )}

          <label>{isPhotos ? 'Photo' : 'Image (optional)'}</label>
          <input type="file" accept="image/*" onChange={onFile} />
          {image && <img src={image} alt="" style={{ maxWidth: '100%', marginTop: 12 }} />}

          {isPhotos && (
            <>
              <label>Caption (optional)</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} />
            </>
          )}

          <button className="btn" type="submit">Publish</button>
        </form>
      </div>
    </div>
  )
}
