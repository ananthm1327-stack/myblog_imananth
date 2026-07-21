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

        <svg className="site-bg-corner corner-tl" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#c8a24b" strokeWidth="1.1" strokeLinecap="round">
            <path d="M8 8 L8 44" opacity="0.6" />
            <path d="M8 8 L44 8" opacity="0.6" />
            <path d="M8 8 Q34 8, 44 20 Q56 32, 56 56" opacity="0.55" />
            <circle cx="56" cy="56" r="3" fill="#c8a24b" stroke="none" opacity="0.7" />
            <path d="M50 50 L56 44 L62 50 L56 56 Z" fill="#c8a24b" stroke="none" opacity="0.5" />
          </g>
        </svg>
        <svg className="site-bg-corner corner-tr" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#c8a24b" strokeWidth="1.1" strokeLinecap="round">
            <path d="M112 8 L112 44" opacity="0.6" />
            <path d="M112 8 L76 8" opacity="0.6" />
            <path d="M112 8 Q86 8, 76 20 Q64 32, 64 56" opacity="0.55" />
            <circle cx="64" cy="56" r="3" fill="#c8a24b" stroke="none" opacity="0.7" />
            <path d="M58 50 L64 44 L70 50 L64 56 Z" fill="#c8a24b" stroke="none" opacity="0.5" />
          </g>
        </svg>
        <svg className="site-bg-corner corner-bl" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#c8a24b" strokeWidth="1.1" strokeLinecap="round">
            <path d="M8 112 L8 76" opacity="0.6" />
            <path d="M8 112 L44 112" opacity="0.6" />
            <path d="M8 112 Q34 112, 44 100 Q56 88, 56 64" opacity="0.55" />
            <circle cx="56" cy="64" r="3" fill="#c8a24b" stroke="none" opacity="0.7" />
            <path d="M50 70 L56 64 L62 70 L56 76 Z" fill="#c8a24b" stroke="none" opacity="0.5" />
          </g>
        </svg>
        <svg className="site-bg-corner corner-br" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#c8a24b" strokeWidth="1.1" strokeLinecap="round">
            <path d="M112 112 L112 76" opacity="0.6" />
            <path d="M112 112 L76 112" opacity="0.6" />
            <path d="M112 112 Q86 112, 76 100 Q64 88, 64 64" opacity="0.55" />
            <circle cx="64" cy="64" r="3" fill="#c8a24b" stroke="none" opacity="0.7" />
            <path d="M58 70 L64 64 L70 70 L64 76 Z" fill="#c8a24b" stroke="none" opacity="0.5" />
          </g>
        </svg>

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
        </div>

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
        </Routes>
      </main>

      <Footer />
    </div>
  )
}
