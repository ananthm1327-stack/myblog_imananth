// Image storage: uploads go to Supabase Storage (a separate 1GB bucket
// that isn't hammered by the sync poll on every reader's device) instead
// of getting stuffed into posts.image as base64 text.
//
// posts.image now holds a small public URL string (~120 bytes) instead of
// a multi-MB blob, so every pullAll() gets dramatically smaller — that
// was the actual root cause of the egress warning, not Supabase itself.

import { client, isSupabaseEnabled, OWNER_TOKEN } from './supabase.js'

const BUCKET = 'post-images'

// Safe, short, collision-free object name for a file.
function makeObjectPath(sectionKey, file) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const rand = Math.random().toString(36).slice(2, 10)
  return `${sectionKey}/${Date.now()}-${rand}.${ext}`
}

export async function uploadImage(file, sectionKey) {
  if (!isSupabaseEnabled) throw new Error('Storage disabled — Supabase not configured.')
  if (!OWNER_TOKEN) throw new Error('Owner token not configured; cannot upload.')

  const path = makeObjectPath(sectionKey, file)
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, file, {
      // Object paths embed a timestamp + random suffix, so a given URL is
      // effectively immutable — safe to cache aggressively at the CDN
      // edge so most image loads become cache hits (billed separately and
      // far cheaper) instead of counting against origin egress.
      cacheControl: '31536000, immutable',
      upsert: false,
      contentType: file.type || 'image/jpeg'
    })
  if (error) throw error

  const { data } = client.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// Given the public URL previously returned by uploadImage(), best-effort
// delete the underlying object. Fire-and-forget: called on post delete so
// old images don't accumulate. A failure here isn't fatal — the DB row is
// already gone, and worst case the object lingers until you clean up.
export async function deleteImageByUrl(url) {
  if (!isSupabaseEnabled || !OWNER_TOKEN) return
  if (!url || typeof url !== 'string') return
  // Only manage objects we actually put in Storage; ignore data: URIs and
  // any external URLs that might exist in older/imported rows.
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return
  const path = url.slice(i + marker.length).split('?')[0]
  try {
    const { error } = await client.storage.from(BUCKET).remove([path])
    if (error) console.warn('[storage] deleteImageByUrl failed', error)
  } catch (e) {
    console.warn('[storage] deleteImageByUrl threw', e)
  }
}

// Old rows may still have raw base64 data: URLs. Detect so callers can
// decide (e.g. migration script, or skip a delete attempt).
export function isDataUrl(url) {
  return typeof url === 'string' && url.startsWith('data:')
}
