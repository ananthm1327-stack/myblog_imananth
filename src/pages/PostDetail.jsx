import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPost, deletePost, isOwner, formatDate } from '../store.js'
import Comments from '../components/Comments.jsx'

export default function PostDetail({ sectionKey, label }) {
  const { id } = useParams()
  const nav = useNavigate()
  const post = getPost(sectionKey, id)
  const owner = isOwner()

  if (!post) {
    return (
      <div className="post-detail">
        <Link to={`/${sectionKey}`} className="back-link">&larr; Back to {label}</Link>
        <div className="empty">Post not found.</div>
      </div>
    )
  }

  // Non-owners can't see drafts directly by URL either.
  if (post.status === 'draft' && !owner) {
    return (
      <div className="post-detail">
        <Link to={`/${sectionKey}`} className="back-link">&larr; Back to {label}</Link>
        <div className="empty">This post isn't published yet.</div>
      </div>
    )
  }

  return (
    <div className="post-detail">
      <Link to={`/${sectionKey}`} className="back-link">&larr; Back to {label}</Link>
      {post.status === 'draft' && (
        <div className="draft-banner">Draft — visible only to you until you publish it.</div>
      )}
      <h1>{post.title}</h1>
      <div className="meta">{formatDate(post.createdAt)} &middot; {label}</div>
      {post.image && <img src={post.image} alt="" />}
      {post.body && <div className="body">{post.body}</div>}

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
  )
}
