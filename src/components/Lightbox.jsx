import { useEffect } from 'react'

export default function Lightbox({ items, index, onClose, onIndex }) {
  const current = items[index]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [index, items.length])

  if (!current) return null
  return (
    <div className="lb-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Photo viewer">
      <button className="lb-close" onClick={onClose} aria-label="Close">&times;</button>
      <button
        className="lb-nav lb-prev"
        onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + items.length) % items.length) }}
        aria-label="Previous photo"
      >&#8249;</button>
      <figure className="lb-frame" onClick={(e) => e.stopPropagation()}>
        <img src={current.image} alt={current.title || ''} className="lb-img" />
        {(current.title || current.body) && (
          <figcaption className="lb-caption">
            {current.title && <div className="lb-title">{current.title}</div>}
            {current.body && <div className="lb-body">{current.body}</div>}
            <div className="lb-count">{index + 1} / {items.length}</div>
          </figcaption>
        )}
      </figure>
      <button
        className="lb-nav lb-next"
        onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % items.length) }}
        aria-label="Next photo"
      >&#8250;</button>
    </div>
  )
}
