import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { onToast } from '../lib/toast.js'

const ICONS = {
  success: '✓',
  error: '✕',
  info: '✦'
}

export default function ToastHost() {
  const [toasts, setToasts] = useState([])

  useEffect(() => onToast(t => {
    setToasts(list => [...list, t])
    setTimeout(() => {
      setToasts(list => list.filter(x => x.id !== t.id))
    }, t.duration)
  }), [])

  const dismiss = (id) => setToasts(list => list.filter(x => x.id !== id))

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
          <span className="toast-icon" aria-hidden="true">{ICONS[t.type] || ICONS.info}</span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); dismiss(t.id) }}>&times;</button>
        </div>
      ))}
    </div>,
    document.body
  )
}
