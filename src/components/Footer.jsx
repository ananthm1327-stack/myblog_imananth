import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from '../lib/toast.js'

const OWNER_EMAIL = 'ananth.machiraju@outlook.com'
const SUBSCRIBE_ENDPOINT = `https://formsubmit.co/${OWNER_EMAIL}`
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SECTIONS = [
  { key: 'journal', label: 'Journal' },
  { key: 'photos', label: 'Photos' },
  { key: 'experiences', label: 'Experiences' },
  { key: 'articles', label: 'Articles' },
  { key: 'views', label: 'Views' }
]

const SOCIALS = [
  { name: 'Instagram', href: 'https://www.instagram.com/ananth.og', icon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )},
  { name: 'X', href: 'https://x.com/saiananthmachiraju', icon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M17.53 3H20.5l-6.49 7.42L22 21h-6.16l-4.83-6.32L5.4 21H2.43l6.95-7.94L2 3h6.32l4.36 5.77L17.53 3zm-1.08 16.2h1.64L7.62 4.7H5.86L16.45 19.2z"/>
    </svg>
  )},
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/saiananthmachiraju', icon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 11-.02 5.01A2.5 2.5 0 014.98 3.5zM3 9h4v12H3V9zm7 0h3.8v1.7h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.34c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.81V21h-4V9z"/>
    </svg>
  )},
  { name: 'GitHub', href: 'https://github.com/ananthm1327-stack', icon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 2a10 10 0 00-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.92-.62.07-.6.07-.6 1.01.07 1.54 1.04 1.54 1.04.9 1.54 2.36 1.1 2.94.84.09-.65.35-1.1.64-1.35-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.7-.1-.25-.45-1.28.1-2.66 0 0 .84-.27 2.75 1.02a9.6 9.6 0 015 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.41.1 2.66.64.71 1.03 1.6 1.03 2.7 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z"/>
    </svg>
  )},
  { name: 'Email', href: `mailto:${OWNER_EMAIL}`, icon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )}
]

function Subscribe() {
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)
  const [invalid, setInvalid] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    const data = new FormData(form)
    const email = String(data.get('email') || '').trim()

    if (!EMAIL_RE.test(email)) {
      setInvalid(true)
      setStatus({ ok: false, msg: 'Please enter a valid email address.' })
      toast.error('That email address doesn\'t look right.')
      return
    }
    setInvalid(false)
    setSending(true); setStatus(null)
    try {
      const res = await fetch(SUBSCRIBE_ENDPOINT, {
        method: 'POST', body: data, headers: { Accept: 'application/json' }
      })
      if (res.ok) {
        setStatus({ ok: true, msg: 'You\'re on the list. Thank you.' })
        toast.success('Subscribed — welcome aboard.')
        form.reset()
      } else {
        setStatus({ ok: false, msg: 'Something went wrong. Try again?' })
        toast.error('Could not subscribe. Please try again.')
      }
    } catch {
      setStatus({ ok: false, msg: 'Network error. Try again?' })
      toast.error('Network error — please try again.')
    }
    finally { setSending(false) }
  }

  return (
    <form className="sub-form" onSubmit={onSubmit} noValidate>
      <input type="hidden" name="_subject" value="New subscriber — I'm Ananth" />
      <input type="hidden" name="_captcha" value="false" />
      <input type="hidden" name="_template" value="table" />
      <input type="hidden" name="intent" value="subscribe" />
      <div className={`sub-row ${invalid ? 'has-error' : ''}`}>
        <input type="email" name="email" placeholder="you@somewhere.com" aria-label="Email"
          onChange={() => invalid && setInvalid(false)} />
        <button type="submit" disabled={sending}>{sending ? '…' : 'Subscribe'}</button>
      </div>
      {status && <div className={`sub-status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</div>}
    </form>
  )
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-glow" aria-hidden="true" />
      <div className="footer-monogram" aria-hidden="true">A</div>

      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col footer-about">
            <div className="footer-brand">
              <img src="/logo.svg" alt="" className="footer-logo" />
              <span>I'm Ananth</span>
            </div>
            <p className="footer-tagline">
              A quiet corner of the internet — words, photographs, and a few honest views.
              Written from wherever I happen to be.
            </p>
            <div className="footer-socials">
              {SOCIALS.map(s => (
                <a key={s.name} href={s.href} target="_blank" rel="noreferrer noopener"
                   className="footer-social" aria-label={s.name} title={s.name}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col">
            <div className="footer-heading">Explore</div>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              {SECTIONS.map(s => <li key={s.key}><Link to={`/${s.key}`}>{s.label}</Link></li>)}
              <li><Link to="/about">About Ananth</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-col footer-subscribe">
            <div className="footer-heading">The Newsletter</div>
            <p className="footer-sub-copy">
              New journal entries, photo essays, and articles — sent occasionally, never noisy.
            </p>
            <Subscribe />
            <div className="footer-sub-note">No spam. Unsubscribe any time.</div>
          </div>
        </div>

        <div className="footer-divider" aria-hidden="true">
          <span className="footer-divider-line" />
          <span className="footer-divider-diamond">&#10022;</span>
          <span className="footer-divider-line" />
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">
            &copy; {new Date().getFullYear()} I'm Ananth &middot; All words, photos &amp; views by Ananth Machiraju
          </div>
          <div className="footer-made">
            Made with <span className="heart">&#9825;</span> and slow mornings
          </div>
        </div>
      </div>
    </footer>
  )
}
