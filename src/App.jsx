import { Routes, Route, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Home from './pages/Home.jsx'
import Section from './pages/Section.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Contact from './pages/Contact.jsx'
import Footer from './components/Footer.jsx'
import { isOwner, login, logout } from './store.js'

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
      <Link to="#" onClick={(e) => { e.preventDefault(); logout(); force(x => x+1); }}>Sign Out</Link>
    )
  }
  return (
    <>
      <Link to="#" onClick={(e) => { e.preventDefault(); setShowModal(true); }}>Sign In</Link>
      {showModal && (
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
              if (login(pw)) { setShowModal(false); force(x => x+1); }
              else setErr('Incorrect password. Access denied.')
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
        </div>
      )}
    </>
  )
}

function MobileNav({ open, onClose }) {
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
          <NavLink to="/" onClick={onClose}>Home</NavLink>
          {SECTIONS.map(s => (
            <NavLink key={s.key} to={`/${s.key}`} onClick={onClose}>{s.label}</NavLink>
          ))}
          <NavLink to="/contact" onClick={onClose}>Contact</NavLink>
          <div className="nav-drawer-divider" />
          <div className="nav-drawer-owner"><OwnerToggle /></div>
        </nav>
      </aside>
    </>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="app">
      <div className="site-bg" aria-hidden="true">
        <div className="site-bg-paper" />
        <div className="site-bg-rules" />
        <div className="site-bg-aurora aurora-a" />
        <div className="site-bg-aurora aurora-b" />
        <div className="site-bg-aurora aurora-c" />
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
          <NavLink to="/contact">Contact</NavLink>
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
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />

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
        </Routes>
      </main>

      <Footer />
    </div>
  )
}
