import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPost, deletePost, isOwner, formatDate } from '../store.js'

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

  return (
    <div className="post-detail">
      <Link to={`/${sectionKey}`} className="back-link">&larr; Back to {label}</Link>
      <h1>{post.title}</h1>
      <div className="meta">{formatDate(post.createdAt)} &middot; {label}</div>
      {post.image && <img src={post.image} alt="" />}
      {post.body && <div className="body">{post.body}</div>}
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
    </div>
  )
}
