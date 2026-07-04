// Tiny pub/sub so pages re-render whenever backend data changes underneath them
// (after a pull, a realtime event, or a background poll). Pages that read
// straight from localStorage during render just need to re-render — no need
// to lift state up, since load()/loadVisible()/etc. always re-read fresh.

import { useEffect, useState } from 'react'

const listeners = new Set()

export function emitDataChange() {
  listeners.forEach(fn => fn())
}

export function onDataChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Drop into any component that reads store.js data during render.
// Forces a re-render (and therefore a fresh read) whenever the backend
// pushes new data in via pull/realtime/poll.
export function useLiveData() {
  const [, setTick] = useState(0)
  useEffect(() => onDataChange(() => setTick(t => t + 1)), [])
}
