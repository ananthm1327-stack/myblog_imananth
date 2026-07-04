import { useState } from 'react'
import { Link } from 'react-router-dom'
import { pendingComments, moderateComment, isOwner, formatDate, generateSitemap } from '../store.js'
import { isSupabaseEnabled, backendStatus } from '../lib/supabase.js'
import { pullAll } from '../lib/sync.js'
import { useLiveData } from '../lib/bus.js'
import { Page } from '../components/Decor.jsx'

export default function Moderation() {
  useLiveData()
  const [rev, setRev] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const owner = isOwner()

  const doPull = async () => {
    setSyncing(true); setSyncMsg(null)
    const res = await pullAll()
    setSyncing(false)
    if (res.ok) setSyncMsg({ ok: true, msg: `Pulled ${res.postCount} posts, ${res.commentCount} comments.` })
    else setSyncMsg({ ok: false, msg: 'Pull failed: ' + res.reason })
    setRev(x => x + 1)
    setTimeout(() => setSyncMsg(null), 5000)
  }

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

      <div className="backend-strip">
        <span className={`backend-pill ${isSupabaseEnabled ? 'on' : 'off'}`}>
          Backend: {isSupabaseEnabled ? 'Supabase connected · live sync on' : 'local only (env not set)'}
        </span>
        {isSupabaseEnabled && (
          <button className="btn small ghost" onClick={doPull} disabled={syncing}>
            {syncing ? 'Pulling…' : 'Pull now'}
          </button>
        )}
        {syncMsg && (
          <span className={`sync-msg ${syncMsg.ok ? 'ok' : 'err'}`}>{syncMsg.msg}</span>
        )}
      </div>
      {isSupabaseEnabled && (
        <p className="backend-note">
          All posts and comments shown here come directly from Supabase — every write is mirrored to the
          database and every open tab stays in sync via realtime updates (with a background pull every 45s
          as a fallback).
        </p>
      )}

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
