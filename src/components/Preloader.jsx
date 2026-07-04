import { useEffect, useState } from 'react'

const MIN_DURATION = 3000

export default function Preloader() {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaving(true)
      setTimeout(() => setVisible(false), 700) // matches fade-out transition
    }, MIN_DURATION)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className={`preloader ${leaving ? 'is-leaving' : ''}`} role="status" aria-label="Loading">
      <div className="preloader-glow" aria-hidden="true" />
      <div className="preloader-rules" aria-hidden="true" />

      <div className="preloader-emblem" aria-hidden="true">
        <svg viewBox="0 0 120 120" className="preloader-ring">
          <circle cx="60" cy="60" r="52" className="preloader-ring-track" />
          <circle cx="60" cy="60" r="52" className="preloader-ring-sweep" />
        </svg>
        <span className="preloader-letter">A</span>
      </div>

      <div className="preloader-word">I'm <em>Ananth</em></div>
      <div className="preloader-tagline">A quiet corner of the internet</div>

      <div className="preloader-bar">
        <div className="preloader-bar-fill" />
      </div>
    </div>
  )
}
