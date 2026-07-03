import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPost, deletePost, isOwner, formatDate } from '../store.js'
import Comments from '../components/Comments.jsx'
import { Page } from '../components/Decor.jsx'
import { sanitize } from '../lib/sanitize.js'

export default function PostDetail({ sectionKey, label }) {
  const { id } = useParams()
  const nav = useNavigate()
  const post = getPost(sectionKey, id)
  const owner = isOwner()

  if (!post) {
    return (
      <Page label={label}>
        <div className="post-detail">
          <Link to={`/${sectionKey}`} className="back-link">&larr; Back to {label}</Link>
          <div className="empty">Post not found.</div>
        </div>
      </Page>
    )
  }

  // Non-owners can't see drafts directly by URL either.
  if (post.status === 'draft' && !owner) {
    return (
      <Page label={label}>
        <div className="post-detail">
          <Link to={`/${sectionKey}`} className="back-link">&larr; Back to {label}</Link>
          <div className="empty">This post isn't published yet.</div>
        </div>
      </Page>
    )
  }

  return (
    <Page label={label}>
    <div className="post-detail">
      <Link to={`/${sectionKey}`} className="back-link">&larr; Back to {label}</Link>
      {post.status === 'draft' && (
        <div className="draft-banner">Draft — visible only to you until you publish it.</div>
      )}
      <h1 dangerouslySetInnerHTML={{ __html: sanitize(post.title) }} />
      <div className="meta">{formatDate(post.createdAt)} &middot; {label}</div>
      {post.image && <img src={post.image} alt="" />}
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
        <div
          role="img"
          aria-label="Signed, Ananth Machiraju"
          className="signature-img"
        />
        <div className="signature-caption">Ananth Machiraju</div>
      </div>

      {owner && (
        <button className="btn danger" onClick={() => {
          if (confirm('Delete this post?')) { deletePost(sectionKey, id); nav(`/${sectionKey}`) }
        }}>Delete</button>
      )}

      <Comments sectionKey={sectionKey} postId={id} />
    </div>
    </Page>
  )
}
