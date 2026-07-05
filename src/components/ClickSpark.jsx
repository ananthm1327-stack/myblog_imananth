import { useEffect, useState } from 'react'

// Gold "spark" burst on every click — a few thin rays plus a couple of
// diamond glyphs (the site's recurring ornament) radiating outward, so
// clicking anywhere feels like a small flourish rather than a plain tap.
const RAYS = 6
const DIAMONDS = 4
let uid = 0

function buildParticles() {
  const particles = []
  for (let i = 0; i < RAYS; i++) {
    const angle = (360 / RAYS) * i + (Math.random() * 18 - 9)
    particles.push({ key: `r${i}`, type: 'ray', angle, dist: 24 + Math.random() * 14 })
  }
  for (let i = 0; i < DIAMONDS; i++) {
    const angle = (360 / DIAMONDS) * i + 45 + (Math.random() * 22 - 11)
    particles.push({ key: `d${i}`, type: 'diamond', angle, dist: 18 + Math.random() * 16 })
  }
  return particles
}

export default function ClickSpark() {
  const [bursts, setBursts] = useState([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onClick = (e) => {
      if (e.target.closest('input, textarea, [contenteditable="true"], [contenteditable=""]')) return
      const id = ++uid
      setBursts(b => [...b, { id, x: e.clientX, y: e.clientY, particles: buildParticles() }])
      setTimeout(() => setBursts(b => b.filter(burst => burst.id !== id)), 700)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  if (bursts.length === 0) return null

  return (
    <div className="click-spark-layer" aria-hidden="true">
      {bursts.map(burst => (
        <span key={burst.id} className="click-spark-burst" style={{ left: burst.x, top: burst.y }}>
          <span className="click-spark-ring" />
          {burst.particles.map(p => (
            <span
              key={p.key}
              className={`click-spark-particle spark-${p.type}`}
              style={{ '--angle': `${p.angle}deg`, '--dist': `${p.dist}px` }}
            >
              {p.type === 'diamond' ? '✦' : ''}
            </span>
          ))}
        </span>
      ))}
    </div>
  )
}
