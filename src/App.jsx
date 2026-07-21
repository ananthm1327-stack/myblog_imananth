import { Routes, Route, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Home from './pages/Home.jsx'
import Section from './pages/Section.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Contact from './pages/Contact.jsx'
import About from './pages/About.jsx'
import Moderation from './pages/Moderation.jsx'
import Bookmarks from './pages/Bookmarks.jsx'
import Legal from './pages/Legal.jsx'
import Footer from './components/Footer.jsx'
import Meta from './components/Meta.jsx'
import SearchOverlay from './components/SearchOverlay.jsx'
import Preloader from './components/Preloader.jsx'
import CookieConsent from './components/CookieConsent.jsx'
import ToastHost from './components/ToastHost.jsx'
import ClickSpark from './components/ClickSpark.jsx'
import { isOwner, login, logout, pendingComments } from './store.js'
import { toast } from './lib/toast.js'

const SECTIONS = [
  { key: 'journal', label: 'Journal' },
  { key: 'photos', label: 'Photos' },
  { key: 'experiences', label: 'Experiences' },
  { key: 'articles', label: 'Articles' },
  { key: 'views', label: 'Views' }
]

function OwnerToggle() {
  const [showModal, setShowModal] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [, force] = useState(0)

  const owner = isOwner()

  if (owner) {
    return (
      <Link to="#" onClick={(e) => { e.preventDefault(); logout(); force(x => x+1); toast.info('Signed out.') }}>Sign Out</Link>
    )
  }
  return (
    <>
      <Link to="#" onClick={(e) => { e.preventDefault(); setShowModal(true); }}>Sign In</Link>
      {showModal && createPortal(
        <div className="modal-backdrop signin-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal signin-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">&times;</button>
            <div className="signin-lock" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
            <div className="signin-eyebrow">Restricted Area</div>
            <h2 className="signin-title">Owner Access Only</h2>
            <p className="signin-body">
              This sign-in exists so <strong>Ananth</strong> can publish journals, photos, experiences,
              articles and views. Readers do not need to sign in — you can already browse everything freely.
            </p>
            <form className="signin-form" onSubmit={(e) => {
              e.preventDefault()
              if (!pw.trim()) { setErr('Please enter the owner password.'); return }
              if (login(pw)) { setShowModal(false); force(x => x+1); toast.success('Signed in as owner.') }
              else { setErr('Incorrect password. Access denied.'); toast.error('Incorrect password.') }
            }}>
              <label htmlFor="signin-pw" className="signin-label">Owner Password</label>
              <input
                id="signin-pw"
                type="password"
                autoFocus
                placeholder="Enter password"
                value={pw}
                onChange={e => { setPw(e.target.value); setErr('') }}
                className="signin-input"
              />
              {err && <div className="status err signin-err">{err}</div>}
              <button className="btn signin-btn" type="submit">Unlock</button>
              <button type="button" className="signin-cancel" onClick={() => setShowModal(false)}>
                Just browsing — take me back
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function MobileNav({ open, onClose, onSearch }) {
  const location = useLocation()
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    onClose()
  }, [location.pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  return (
    <>
      <div className={`nav-drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`nav-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="nav-drawer-head">
          <Link to="/" className="nav-brand" aria-label="Home" onClick={onClose}>
            <img src="/logo.svg" alt="" className="nav-logo" />
            <span className="nav-brand-text">I'm Ananth</span>
          </Link>
          <button className="nav-drawer-close" aria-label="Close menu" onClick={onClose}>&times;</button>
        </div>
        <nav className="nav-drawer-links">
          <button type="button" className="nav-drawer-search" onClick={() => { onClose(); onSearch(); }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            Search
          </button>
          <NavLink to="/" onClick={onClose}>Home</NavLink>
          {SECTIONS.map(s => (
            <NavLink key={s.key} to={`/${s.key}`} onClick={onClose}>{s.label}</NavLink>
          ))}
          <NavLink to="/about" onClick={onClose}>About</NavLink>
          <NavLink to="/contact" onClick={onClose}>Contact</NavLink>
          {isOwner() && (
            <NavLink to="/moderation" onClick={onClose}>Moderation</NavLink>
          )}
          <div className="nav-drawer-divider" />
          <div className="nav-drawer-owner"><OwnerToggle /></div>
        </nav>
      </aside>
    </>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      const isSearchShortcut = (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && !document.activeElement?.isContentEditable)
        || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
      if (isSearchShortcut) { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <Preloader />
      <ClickSpark />
      <ToastHost />
      <CookieConsent delay={3400} />
      <Meta />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="site-bg" aria-hidden="true">
        <div className="site-bg-paper" />
        <div className="site-bg-rules" />
        <div className="site-bg-margin-line" />
        <div className="site-bg-aurora aurora-a" />
        <div className="site-bg-aurora aurora-b" />
        <div className="site-bg-aurora aurora-c" />

        <div className="site-bg-constellation">
          <span className="bg-star s1">&#10022;</span>
          <span className="bg-star s2">&#10022;</span>
          <span className="bg-star s3">&#10022;</span>
          <span className="bg-star s4">&#10022;</span>
          <span className="bg-star s5">&#10022;</span>
          <span className="bg-star s6">&#10022;</span>
          <span className="bg-star s7">&#10022;</span>
          <span className="bg-star s8">&#10022;</span>
          <span className="bg-star s9">&#10022;</span>
          <span className="bg-star s10">&#10022;</span>
          <span className="bg-star s11">&#10022;</span>
          <span className="bg-star s12">&#10022;</span>
        </div>

        {/* Scattered italic script — a writer's ambient wash of the site's own five sections */}
        <div className="site-bg-words" aria-hidden="true">
          <span className="bg-word bw-1">words.</span>
          <span className="bg-word bw-2">observed.</span>
          <span className="bg-word bw-3">quiet mornings.</span>
          <span className="bg-word bw-4">journal</span>
          <span className="bg-word bw-5">photographs</span>
          <span className="bg-word bw-6">experiences</span>
          <span className="bg-word bw-7">articles</span>
          <span className="bg-word bw-8">views</span>
          <span className="bg-word bw-9">written.</span>
        </div>

        {/* Ornate compass / postmark seal on the right */}
        <svg className="site-bg-seal" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path id="seal-outer" d="M120,120 m-98,0 a98,98 0 1,1 196,0 a98,98 0 1,1 -196,0" />
          </defs>
          <g fill="none" stroke="#c8a24b" strokeLinecap="round">
            <circle cx="120" cy="120" r="112" strokeWidth="1" opacity="0.7" />
            <circle cx="120" cy="120" r="106" strokeWidth="0.6" opacity="0.5" />
            <circle cx="120" cy="120" r="74"  strokeWidth="0.8" opacity="0.6" />
            <circle cx="120" cy="120" r="70"  strokeWidth="0.4" opacity="0.35" />
            {/* Cardinal ticks */}
            <line x1="120" y1="10"  x2="120" y2="26"  strokeWidth="1" />
            <line x1="120" y1="214" x2="120" y2="230" strokeWidth="1" />
            <line x1="10"  y1="120" x2="26"  y2="120" strokeWidth="1" />
            <line x1="214" y1="120" x2="230" y2="120" strokeWidth="1" />
            {/* Ordinal ticks (diagonals) */}
            <line x1="42"  y1="42"  x2="54"  y2="54"  strokeWidth="0.7" opacity="0.7" />
            <line x1="198" y1="42"  x2="186" y2="54"  strokeWidth="0.7" opacity="0.7" />
            <line x1="42"  y1="198" x2="54"  y2="186" strokeWidth="0.7" opacity="0.7" />
            <line x1="198" y1="198" x2="186" y2="186" strokeWidth="0.7" opacity="0.7" />
            {/* Compass rose */}
            <path d="M120 46 L128 120 L120 194 L112 120 Z" fill="#c8a24b" stroke="none" opacity="0.55" />
            <path d="M46 120 L120 128 L194 120 L120 112 Z" fill="#c8a24b" stroke="none" opacity="0.4" />
            <circle cx="120" cy="120" r="6" fill="#c8a24b" stroke="none" opacity="0.75" />
            {/* Roman numerals — cardinals */}
            {/* N/S/E/W nested into the empty band between the compass rose tips
                (r=74) and the outer curved-text ring (r=106) so they no longer
                collide with the site-name text that wraps the outer ring. */}
            <text x="120" y="38"  textAnchor="middle" dominantBaseline="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fontWeight="600" fill="#a8842f" opacity="0.9">N</text>
            <text x="120" y="204" textAnchor="middle" dominantBaseline="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fontWeight="600" fill="#a8842f" opacity="0.9">S</text>
            <text x="36"  y="122" textAnchor="middle" dominantBaseline="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fontWeight="600" fill="#a8842f" opacity="0.9">W</text>
            <text x="204" y="122" textAnchor="middle" dominantBaseline="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fontWeight="600" fill="#a8842f" opacity="0.9">E</text>
          </g>
          {/* Curved text around the outer ring */}
          <text fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="4" fill="#c8a24b" opacity="0.7">
            <textPath href="#seal-outer" startOffset="0">I&#8217;M ANANTH &#183;&#183;&#183; JOURNAL &#183;&#183; PHOTOGRAPHS &#183;&#183; EXPERIENCES &#183;&#183; ARTICLES &#183;&#183; VIEWS &#183;&#183;&#183;</textPath>
          </text>
        </svg>

        <div className="site-bg-grain" />
        <div className="site-bg-vignette" />
      </div>
      <nav className="nav">
        <Link to="/" className="nav-brand" aria-label="I'm Ananth — Home">
          <img src="/logo.svg" alt="I'm Ananth" className="nav-logo" />
          <span className="nav-brand-text">I'm Ananth</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/">Home</NavLink>
          {SECTIONS.map(s => (
            <NavLink key={s.key} to={`/${s.key}`}>{s.label}</NavLink>
          ))}
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          {isOwner() && (
            <NavLink to="/moderation" className="nav-mod-link">
              Mod {pendingComments().length > 0 && <span className="nav-mod-pill">{pendingComments().length}</span>}
            </NavLink>
          )}
          <button
            type="button"
            className="nav-icon-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Search (press / or Ctrl+K)"
            title="Search — /"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </button>
          <OwnerToggle />
        </div>
        <button
          className={`nav-burger ${menuOpen ? 'open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(v => !v)}
        >
          <span /><span /><span />
        </button>
      </nav>
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} onSearch={() => setSearchOpen(true)} />

      <main>
        <Routes>
          <Route path="/" element={<Home sections={SECTIONS} />} />
          {SECTIONS.map(s => (
            <Route key={s.key} path={`/${s.key}`} element={<Section sectionKey={s.key} label={s.label} />} />
          ))}
          {SECTIONS.map(s => (
            <Route key={s.key + '-d'} path={`/${s.key}/:id`} element={<PostDetail sectionKey={s.key} label={s.label} />} />
          ))}
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/moderation" element={<Moderation />} />
          <Route path="/privacy" element={<Legal slug="privacy" />} />
          <Route path="/disclaimer" element={<Legal slug="disclaimer" />} />
          <Route path="/terms" element={<Legal slug="terms" />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}
