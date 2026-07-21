import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPost, deletePost, isOwner, formatDate, isLivePost, isScheduled, isBookmarked, toggleBookmark } from '../store.js'
import Comments from '../components/Comments.jsx'
import { Page } from '../components/Decor.jsx'
import Meta from '../components/Meta.jsx'
import { postJsonLd } from '../lib/jsonld.js'
import { sanitize, stripHtml } from '../lib/sanitize.js'
import { useLiveData } from '../lib/bus.js'
import { toast } from '../lib/toast.js'

export default function PostDetail({ sectionKey, label }) {
  useLiveData()
  const { id } = useParams()
  const nav = useNavigate()
  const post = getPost(sectionKey, id)
  const owner = isOwner()
  const [bookmarked, setBookmarked] = useState(() => post ? isBookmarked(sectionKey, id) : false)

  if (!post) {
    return (
      <Page label={label}>
        <Meta title="Post not found" noindex />
        <div className="post-detail">
          <Link to={`/${sectionKey}`} className="back-link">&larr; Back to {label}</Link>
          <div className="empty">Post not found.</div>
        </div>
      </Page>
    )
  }

  // Non-owners can't see drafts or scheduled posts.
  if (!isLivePost(post) && !owner) {
    return (
      <Page label={label}>
        <Meta title="Not published yet" noindex />
        <div className="post-detail">
          <Link to={`/${sectionKey}`} className="back-link">&larr; Back to {label}</Link>
          <div className="empty">This post isn't published yet.</div>
        </div>
      </Page>
    )
  }

  const scheduled = isScheduled(post)
  const postTitle = stripHtml(post.title)
  const postDescription = stripHtml(post.body || '').slice(0, 200)
  const postPath = `/${sectionKey}/${post.id}`

  return (
    <Page label={label}>
    <Meta
      title={postTitle}
      description={postDescription}
      image={post.image || undefined}
      path={postPath}
      type="article"
      article={{
        publishedTime: post.createdAt,
        author: 'Ananth Machiraju',
        section: label,
        tags: post.tags || []
      }}
      jsonLd={postJsonLd({
        title: postTitle,
        description: postDescription,
        image: post.image,
        path: postPath,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      })}
    />
    <div className="post-detail">
      <div className="post-top-row">
        <Link to={`/${sectionKey}`} className="back-link">&larr; Back to {label}</Link>
        <button
          className={`bookmark-btn ${bookmarked ? 'on' : ''}`}
          onClick={() => {
            const next = toggleBookmark(sectionKey, id)
            setBookmarked(next)
            toast.info(next ? 'Saved to bookmarks.' : 'Removed from bookmarks.')
          }}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this post'}
          title={bookmarked ? 'Bookmarked — click to remove' : 'Save for later'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h12v17l-6-4-6 4V4z" />
          </svg>
          <span>{bookmarked ? 'Saved' : 'Save'}</span>
        </button>
      </div>
      {post.status === 'draft' && (
        <div className="draft-banner">Draft — visible only to you until you publish it.</div>
      )}
      {scheduled && (
        <div className="scheduled-banner">
          Scheduled for {new Date(post.publishAt).toLocaleString()} — hidden from readers until then.
        </div>
      )}
      <h1 dangerouslySetInnerHTML={{ __html: sanitize(post.title) }} />
      <div className="meta">{formatDate(post.createdAt)} &middot; {label}</div>
      {post.image && <img src={post.image} alt={stripHtml(post.title)} />}
      {post.body && <div className="body rt-content" dangerouslySetInnerHTML={{ __html: sanitize(post.body) }} />}

      {(post.tags || []).length > 0 && (
        <div className="tag-row post-tags">
          {post.tags.map(t => (
            <Link key={t} to={`/${sectionKey}?tag=${encodeURIComponent(t)}`} className="tag-chip">
              #{t}
            </Link>
          ))}
        </div>
      )}

      <div className="signature-block">
        <div className="signature-line" aria-hidden="true" />
        <img
          src="/signature.png"
          alt="Signed, Ananth Machiraju"
          className="signature-img"
        />
        <div className="signature-caption">Ananth Machiraju</div>
      </div>

      {owner && (
        <button className="btn danger" onClick={() => {
          if (confirm('Delete this post?')) {
            deletePost(sectionKey, id)
            toast.success('Post deleted.')
            nav(`/${sectionKey}`)
          }
        }}>Delete</button>
      )}

      <Comments sectionKey={sectionKey} postId={id} />
    </div>
    </Page>
  )
}
