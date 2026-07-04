// Minimal toast pub/sub — no provider/context needed, just import and call.
// ToastHost (mounted once near the app root) subscribes and renders the stack.

let listeners = new Set()
let idCounter = 0

export function onToast(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function push(type, message, opts = {}) {
  const toast = {
    id: ++idCounter,
    type,
    message,
    duration: opts.duration ?? 4200
  }
  listeners.forEach(fn => fn(toast))
  return toast.id
}

export const toast = {
  success: (message, opts) => push('success', message, opts),
  error: (message, opts) => push('error', message, opts),
  info: (message, opts) => push('info', message, opts)
}
