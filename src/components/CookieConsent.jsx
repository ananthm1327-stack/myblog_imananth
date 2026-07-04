import { useEffect, useState } from 'react'

const KEY = 'ia_cookie_consent'

export default function CookieConsent({ delay = 0 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(KEY)) return
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const accept = () => {
    localStorage.setItem(KEY, 'accepted')
    setVisible(false)
  }
  const decline = () => {
    localStorage.setItem(KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie notice">
      <div className="cookie-banner-inner">
        <div className="cookie-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
            <circle cx="14" cy="9" r="1" fill="currentColor" stroke="none" />
            <circle cx="13" cy="14" r="1" fill="currentColor" stroke="none" />
            <circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <p className="cookie-text">
          This site uses your browser's local storage to remember preferences like bookmarks and sign-in state.
          Nothing is sold or shared with advertisers.
        </p>
        <div className="cookie-actions">
          <button className="btn small ghost" onClick={decline}>Decline</button>
          <button className="btn small cookie-accept" onClick={accept}>Accept</button>
        </div>
      </div>
    </div>
  )
}
