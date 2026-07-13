import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import {
  load, loadVisible, addPost, deletePost, updatePost, isOwner, formatDate,
  normalizeTags, generateRSS, isScheduled
} from '../store.js'
import Lightbox from '../components/Lightbox.jsx'
import RichText from '../components/RichText.jsx'
import { Page } from '../components/Decor.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Meta from '../components/Meta.jsx'
import { stripHtml } from '../lib/sanitize.js'
import { useLiveData } from '../lib/bus.js'
import { toast } from '../lib/toast.js'

const SECTION_NUMERAL = { journal: 'I', photos: 'II', experiences: 'III', articles: 'IV', views: 'V' }
const SECTION_DESCRIPTIONS = {
  journal: "Personal journal entries from Ananth Machiraju — everyday reflections, unfiltered.",
  photos: 'A photo essay collection by Ananth Machiraju.',
  experiences: 'Lived experiences and stories from Ananth Machiraju.',
  articles: 'Long-form articles and essays by Ananth Machiraju.',
  views: "Honest views and opinions on technology, cities, books, and the world, from Ananth Machiraju."
}

export default function Section({ sectionKey, label }) {
  useLiveData()
  const [rev, setRev] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [lbIndex, setLbIndex] = useState(-1)
  const [params, setParams] = useSearchParams()
  const activeTag = params.get('tag')
  const owner = isOwner()

  const all = loadVisible(sectionKey, owner) // owner sees drafts too
  const items = useMemo(() => {
    if (!activeTag) return all
    return all.filter(p => (p.tags || []).includes(activeTag.toLowerCase()))
  }, [all, activeTag, rev])

  const refresh = () => setRev(x => x + 1)
  const publishedItems = items.filter(p => (p.status || 'published') === 'published')
  const draftItems = items.filter(p => p.status === 'draft')

  const onDelete = (id) => {
    if (confirm('Delete this post?')) {
      deletePost(sectionKey, id)
      refresh()
      toast.success('Post deleted.')
    }
  }
  const togglePublish = (post) => {
    const next = post.status === 'draft' ? 'published' : 'draft'
    updatePost(sectionKey, post.id, { status: next })
    refresh()
    toast.success(next === 'published' ? 'Post published.' : 'Moved to drafts.')
  }
  const clearTag = () => { params.delete('tag'); setParams(params) }

  const isPhotos = sectionKey === 'photos'
  const isJournal = sectionKey === 'journal'

  const downloadRss = () => {
    const xml = generateRSS(sectionKey, label, window.location.origin)
    const blob = new Blob([xml], { type: 'application/rss+xml' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const openLightbox = (idx) => setLbIndex(idx)
  const closeLightbox = () => setLbIndex(-1)

  return (
    <Page label={label} numeral={SECTION_NUMERAL[sectionKey]}>
      <Meta title={label} description={SECTION_DESCRIPTIONS[sectionKey]} path={`/${sectionKey}`} />
      <div className="section-header">
        <div>
          <h1>{label}</h1>
          {activeTag && (
            <div className="tag-filter-active">
              Filtering by <span className="tag-chip is-active">#{activeTag}</span>
              <button className="tag-clear" onClick={clearTag}>clear</button>
            </div>
          )}
        </div>
        <div className="section-actions">
          {isJournal && (
            <button className="btn small ghost" onClick={downloadRss} title="Open RSS feed">
              <span className="rss-icon" aria-hidden="true">&#10098;/&#10099;</span> RSS
            </button>
          )}
          {owner && (
            <button className="btn small" onClick={() => { setEditing(null); setShowForm(true) }}>
              + New
            </button>
          )}
        </div>
      </div>

      {!owner && (
        <p style={{ color: 'var(--titanium)', fontStyle: 'italic', marginBottom: 24 }}>
          Read-only view. Only Ananth can post here.
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState label="No posts here yet." />
      ) : isPhotos ? (
        <>
          <div className="photo-grid">
            {items.map((p, i) => (
              <div key={p.id} className="photo" style={{ position: 'relative' }}>
                <button className="photo-btn" onClick={() => openLightbox(i)} aria-label={stripHtml(p.title) || 'Photo'}>
                  <img src={p.image} alt={stripHtml(p.title) || ''} />
                </button>
                <div className="photo-caption">
                  <span dangerouslySetInnerHTML={{ __html: stripHtml(p.title) }} />
                  {p.status === 'draft' && <span className="badge-draft"> DRAFT</span>}
                </div>
                {owner && (
                  <div className="photo-owner-actions">
                    <button className="btn small" onClick={() => togglePublish(p)}>
                      {p.status === 'draft' ? 'Publish' : 'Draft'}
                    </button>
                    <button className="btn small danger" onClick={() => onDelete(p.id)}>×</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {lbIndex >= 0 && (
            <Lightbox
              items={items}
              index={lbIndex}
              onIndex={setLbIndex}
              onClose={closeLightbox}
            />
          )}
        </>
      ) : (
        <>
          {owner && draftItems.length > 0 && (
            <div className="drafts-strip">
              <strong>{draftItems.length}</strong> draft{draftItems.length === 1 ? '' : 's'} — only visible to you.
            </div>
          )}
          <div className="grid">
            {items.map(p => (
              <div key={p.id} className={`card ${p.status === 'draft' ? 'is-draft' : ''}`} style={{ position: 'relative' }}>
                <Link to={`/${sectionKey}/${p.id}`} style={{ display: 'block' }}>
                  {p.image && <img src={p.image} alt={stripHtml(p.title)} />}
                  <div className="meta">
                    {formatDate(p.createdAt)}
                    {p.status === 'draft' && <span className="badge-draft">DRAFT</span>}
                    {isScheduled(p) && <span className="badge-scheduled">SCHEDULED</span>}
                  </div>
                  <h3 dangerouslySetInnerHTML={{ __html: stripHtml(p.title) }} />
                  <p>{stripHtml(p.body || '').slice(0, 140)}{stripHtml(p.body || '').length > 140 ? '…' : ''}</p>
                </Link>
                {(p.tags || []).length > 0 && (
                  <div className="tag-row">
                    {p.tags.map(t => (
                      <Link key={t} to={`/${sectionKey}?tag=${encodeURIComponent(t)}`} className="tag-chip">
                        #{t}
                      </Link>
                    ))}
                  </div>
                )}
                {owner && (
                  <div className="card-owner-actions">
                    <button className="btn small" onClick={() => { setEditing(p); setShowForm(true) }}>Edit</button>
                    <button className="btn small" onClick={() => togglePublish(p)}>
                      {p.status === 'draft' ? 'Publish' : 'Unpublish'}
                    </button>
                    <button className="btn small danger" onClick={() => onDelete(p.id)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <PostForm
          sectionKey={sectionKey}
          isPhotos={isPhotos}
          existing={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { refresh(); setShowForm(false); setEditing(null) }}
        />
      )}
    </Page>
  )
}

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fromLocalInput(v) {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d) ? null : d.toISOString()
}

function PostForm({ sectionKey, isPhotos, existing, onClose, onSaved }) {
  const [title, setTitle] = useState(existing?.title || '')
  const [body, setBody] = useState(existing?.body || '')
  const [image, setImage] = useState(existing?.image || '')
  const [tags, setTags] = useState((existing?.tags || []).join(', '))
  const [status, setStatus] = useState(existing?.status || 'published')
  const [publishAt, setPublishAt] = useState(toLocalInput(existing?.publishAt))
  const [fieldErrors, setFieldErrors] = useState({})

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast.error('That file isn\'t an image. Please choose a JPG, PNG, or WebP.')
      return
    }
    if (f.size > 6 * 1024 * 1024) {
      toast.error('Image is too large (max 6MB). Try a smaller file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result)
    reader.readAsDataURL(f)
  }

  const validate = () => {
    const errors = {}
    if (!stripHtml(title).trim()) errors.title = 'A title is required.'
    if (isPhotos && !image) errors.image = 'Please choose a photo.'
    if (publishAt) {
      const t = fromLocalInput(publishAt)
      if (!t) errors.publishAt = 'That date doesn\'t look valid.'
    }
    return errors
  }

  const submit = (e) => {
    e.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0])
      return
    }
    const patch = {
      title,
      body,
      image,
      tags: normalizeTags(tags),
      status,
      publishAt: status === 'published' ? fromLocalInput(publishAt) : null
    }
    if (existing) {
      updatePost(sectionKey, existing.id, patch)
      toast.success('Post updated.')
    } else {
      addPost(sectionKey, patch)
      toast.success(status === 'draft' ? 'Draft saved.' : 'Post published.')
    }
    onSaved()
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{existing ? 'Edit Post' : 'New Post'}</h2>
        <form className="form" onSubmit={submit} noValidate>
          <label>Title</label>
          <RichText
            value={title}
            onChange={setTitle}
            placeholder="Post title"
            singleLine
          />
          {fieldErrors.title && <div className="field-error">{fieldErrors.title}</div>}

          {!isPhotos && (
            <>
              <label>Body</label>
              <RichText
                value={body}
                onChange={setBody}
                placeholder="Write your thoughts…"
                minHeight={220}
              />
            </>
          )}

          <label>{isPhotos ? 'Photo' : 'Image (optional)'}</label>
          <input type="file" accept="image/*" onChange={onFile} />
          {fieldErrors.image && <div className="field-error">{fieldErrors.image}</div>}
          {image && <img src={image} alt="" style={{ maxWidth: '100%', marginTop: 12 }} />}

          {isPhotos && (
            <>
              <label>Caption (optional)</label>
              <RichText
                value={body}
                onChange={setBody}
                placeholder="Caption…"
                minHeight={120}
              />
            </>
          )}

          <label>Tags <span className="form-hint">comma-separated (e.g. reflection, travel, poetry)</span></label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="tag one, tag two" />

          <label>Publish status</label>
          <div className="status-toggle">
            <label className={`toggle-opt ${status === 'published' ? 'active' : ''}`}>
              <input type="radio" name="status" value="published"
                checked={status === 'published'} onChange={() => setStatus('published')} />
              <span>Publish</span>
            </label>
            <label className={`toggle-opt ${status === 'draft' ? 'active' : ''}`}>
              <input type="radio" name="status" value="draft"
                checked={status === 'draft'} onChange={() => setStatus('draft')} />
              <span>Save as draft</span>
            </label>
          </div>

          {status === 'published' && (
            <>
              <label>
                Schedule <span className="form-hint">optional — leave blank to publish now</span>
              </label>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={e => setPublishAt(e.target.value)}
              />
              {fieldErrors.publishAt && <div className="field-error">{fieldErrors.publishAt}</div>}
              {publishAt && fromLocalInput(publishAt) && new Date(publishAt).getTime() > Date.now() && (
                <div className="scheduled-hint">
                  Will go live on {new Date(publishAt).toLocaleString()}
                </div>
              )}
            </>
          )}

          <button className="btn" type="submit">
            {existing ? 'Save changes' : (status === 'draft' ? 'Save draft' : 'Publish')}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
