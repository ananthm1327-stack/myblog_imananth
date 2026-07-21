import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { load, formatDate, isLivePost, isOwner } from '../store.js'
import { ClosingFlourish } from '../components/Decor.jsx'
import { stripHtml } from '../lib/sanitize.js'
import Meta from '../components/Meta.jsx'
import DailyQuote from '../components/DailyQuote.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useLiveData } from '../lib/bus.js'
import { siteJsonLd } from '../lib/jsonld.js'

const ROMAN = ['I', 'II', 'III', 'IV', 'V']

export default function Home({ sections }) {
  useLiveData()
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

      <DailyQuote />

      <Meta jsonLd={siteJsonLd()} />
      {sections.map((s, i) => {
        const owner = isOwner()
        const items = load(s.key).filter(p => owner || isLivePost(p)).slice(0, 3)
        return (
          <Fragment key={s.key}>
            <section className="home-section">
              <span className="chapter-numeral" aria-hidden="true">{ROMAN[i]}</span>
              <span className="section-watermark" aria-hidden="true">{s.label}</span>
              <div className="section-header">
                <h2>{s.label}</h2>
              </div>
              {items.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <div className="grid">
                    {items.map(p => (
                      <Link key={p.id} to={`/${s.key}/${p.id}`} className="card">
                        {p.image && <img src={p.image} alt={stripHtml(p.title)} />}
                        <div className="meta">{formatDate(p.createdAt)}</div>
                        <h3 dangerouslySetInnerHTML={{ __html: stripHtml(p.title) }} />
                        <p>{stripHtml(p.body || p.caption || '').slice(0, 120)}{stripHtml(p.body || p.caption || '').length > 120 ? '…' : ''}</p>
                      </Link>
                    ))}
                  </div>
                  <div className="section-footer">
                    <Link to={`/${s.key}`} className="view-all-link">View all &rarr;</Link>
                  </div>
                </>
              )}
            </section>
          </Fragment>
        )
      })}
      <ClosingFlourish />
    </>
  )
}
