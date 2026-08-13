import { useEffect, useRef, useState } from 'react'
import { toast } from '../lib/toast.js'
import { SITE_URL } from '../store.js'

// Share widget for a post — attempts to use the native Web Share sheet
// on capable devices (most phones, newer desktops), else falls back to
// a small popover offering "Copy link" and one-tap shares to X,
// LinkedIn, WhatsApp, Facebook, and Email.
//
// The share URL is always the post's canonical URL — SITE_URL joined
// with the current pathname — which matches what <Meta canonical> and
// the JSON-LD BlogPosting already publish for that post.
export default function ShareButton({ title, path }) {
  const [open, setOpen] = useState(false)
  const [supportsNative, setSupportsNative] = useState(false)
  const popRef = useRef(null)
  const btnRef = useRef(null)

  const shareUrl = `${SITE_URL}${path}`
  const shareText = title ? title : "I'm Ananth"

  // Feature-detect on mount so SSR / non-browser envs don't blow up.
  useEffect(() => {
    setSupportsNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  // Click-outside + Esc-to-close for the popover.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (popRef.current?.contains(e.target)) return
      if (btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onShare = async () => {
    if (supportsNative) {
      try {
        await navigator.share({ title: shareText, url: shareUrl })
        // Native sheet handles its own toast/UI; no follow-up needed.
        return
      } catch (err) {
        // AbortError is what fires when the user cancels the sheet —
        // don't fall through to the popover in that case.
        if (err && err.name === 'AbortError') return
        // Any other error → open the fallback popover.
      }
    }
    setOpen(v => !v)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied.')
      setOpen(false)
    } catch {
      // Older browsers: select the input so the user can copy manually.
      const input = popRef.current?.querySelector('input[type="text"]')
      if (input) { input.select(); document.execCommand('copy') }
      toast.info('Link ready — press Ctrl+C to copy.')
    }
  }

  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedText = encodeURIComponent(shareText)
  const targets = [
    {
      key: 'x', label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.53 3H20.5l-6.49 7.42L22 21h-6.16l-4.83-6.32L5.4 21H2.43l6.95-7.94L2 3h6.32l4.36 5.77L17.53 3zm-1.08 16.2h1.64L7.62 4.7H5.86L16.45 19.2z"/></svg>
    },
    {
      key: 'linkedin', label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.01A2.5 2.5 0 014.98 3.5zM3 9h4v12H3V9zm7 0h3.8v1.7h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.34c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.81V21h-4V9z"/></svg>
    },
    {
      key: 'whatsapp', label: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1.1 1.1-1.1 2.6c0 1.6 1.1 3.1 1.3 3.3.2.2 2.2 3.4 5.4 4.7.8.3 1.4.5 1.9.6.8.3 1.5.2 2.1.1.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5 0-.1-.3-.2-.6-.4zM12 2a10 10 0 00-8.6 15l-1 3.7 3.8-1a10 10 0 105.8-17.7zm0 18.3c-1.5 0-3-.4-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.3 8.3 0 1120.3 12 8.3 8.3 0 0112 20.3z"/></svg>
    },
    {
      key: 'facebook', label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.7c0-.9.3-1.6 1.6-1.6h1.6V3.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8V13h2.7v8h3z"/></svg>
    },
    {
      key: 'email', label: 'Email',
      href: `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`,
      icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
    }
  ]

  return (
    <div className="share-wrap">
      <button
        ref={btnRef}
        type="button"
        className={`share-btn ${open ? 'open' : ''}`}
        onClick={onShare}
        aria-label="Share this post"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Share"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="2.4" />
          <circle cx="18" cy="6" r="2.4" />
          <circle cx="18" cy="18" r="2.4" />
          <line x1="8" y1="10.8" x2="16" y2="7.2" />
          <line x1="8" y1="13.2" x2="16" y2="16.8" />
        </svg>
        <span>Share</span>
      </button>

      {open && (
        <div ref={popRef} className="share-pop" role="menu" aria-label="Share options">
          <div className="share-pop-eyebrow">Share this post</div>
          <div className="share-link-row">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              aria-label="Post URL"
            />
            <button type="button" className="share-copy-btn" onClick={copyLink}>Copy</button>
          </div>
          <div className="share-targets">
            {targets.map(t => (
              <a
                key={t.key}
                className={`share-target share-${t.key}`}
                href={t.href}
                target={t.key === 'email' ? undefined : '_blank'}
                rel="noreferrer noopener"
                aria-label={`Share on ${t.label}`}
                title={`Share on ${t.label}`}
                onClick={() => setOpen(false)}
              >
                {t.icon}
                <span>{t.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
