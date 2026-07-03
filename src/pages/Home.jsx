import { Link } from 'react-router-dom'
import { load, formatDate } from '../store.js'

export default function Home({ sections }) {
  return (
    <>
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-monogram" aria-hidden="true">A</div>
        <div className="hero-inner">
          <div className="hero-eyebrow">Writer &middot; Photographer &middot; Observer</div>
          <h1 className="hero-title">
            <span className="hero-title-line">I'm</span>
            <span className="hero-title-name shiny-text" data-text="Ananth">Ananth</span>
          </h1>
          <div className="hero-divider" aria-hidden="true">
            <span className="hero-divider-line" />
            <span className="hero-divider-diamond">&#10022;</span>
            <span className="hero-divider-line" />
          </div>
          <p className="hero-tagline">
            A quiet corner of the internet for <em>journals</em>, <em>photographs</em>,
            <em>experiences</em>, <em>articles</em>, and honest <em>views</em> on the world.
          </p>
          <div className="hero-ctas">
            <Link to="/journal" className="btn hero-btn">Read the Journal</Link>
            <Link to="/contact" className="hero-link">Say hello &rarr;</Link>
          </div>
        </div>
      </section>

      {sections.map(s => {
        const items = load(s.key).slice(0, 3)
        return (
          <section key={s.key} style={{ marginBottom: 50 }}>
            <div className="section-header">
              <h2>{s.label}</h2>
              <Link to={`/${s.key}`} style={{ color: 'var(--gold-deep)', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>View all &rarr;</Link>
            </div>
            {items.length === 0 ? (
              <div className="empty">Nothing here yet.</div>
            ) : (
              <div className="grid">
                {items.map(p => (
                  <Link key={p.id} to={`/${s.key}/${p.id}`} className="card">
                    {p.image && <img src={p.image} alt="" />}
                    <div className="meta">{formatDate(p.createdAt)}</div>
                    <h3>{p.title}</h3>
                    <p>{(p.body || p.caption || '').slice(0, 120)}{(p.body || p.caption || '').length > 120 ? '…' : ''}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
