// Image storage: uploads go to Firebase Storage (a separate bucket that
// isn't hit by the sync listener on every reader's device) instead of
// getting stuffed into posts.image as base64.
//
// posts.image holds a small public URL (~150 bytes) instead of a
// multi-MB blob, so the pull payload stays tiny — that was the actual
// root cause of the free-tier egress warning back on Supabase, and the
// same shape carries over here.

import { ref, uploadBytes, getDownloadURL, deleteObject, updateMetadata } from 'firebase/storage'
import { storage, isFirebaseEnabled, OWNER_TOKEN } from './firebase.js'

const BUCKET_PREFIX = 'post-images'

function makeObjectPath(sectionKey, file) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const rand = Math.random().toString(36).slice(2, 10)
  return `${BUCKET_PREFIX}/${sectionKey}/${Date.now()}-${rand}.${ext}`
}

export async function uploadImage(file, sectionKey) {
  if (!isFirebaseEnabled) throw new Error('Storage disabled — Firebase not configured.')
  if (!OWNER_TOKEN) throw new Error('Owner token not configured; cannot upload.')

  const path = makeObjectPath(sectionKey, file)
  const objectRef = ref(storage, path)
  const contentType = file.type || 'image/jpeg'
  // Storage rules read customMetadata.ownerToken to gate writes — same
  // shared-token model we used with Supabase. Cache-Control kept long
  // and immutable because the object path embeds a timestamp+random
  // suffix, so a given URL is always the same bytes.
  await uploadBytes(objectRef, file, {
    contentType,
    cacheControl: 'public, max-age=31536000, immutable',
    customMetadata: { ownerToken: OWNER_TOKEN }
  })
  return await getDownloadURL(objectRef)
}

// Deleting a post also removes its Storage object so the bucket doesn't
// accumulate orphans. Best-effort — failures log but don't throw.
export async function deleteImageByUrl(url) {
  if (!isFirebaseEnabled || !OWNER_TOKEN) return
  if (!url || typeof url !== 'string') return
  // Firebase download URLs look like:
  //   https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<url-encoded-path>?alt=media&token=...
  // Ignore data: URIs and any external URLs that might be in older rows.
  if (!url.includes('firebasestorage.googleapis.com') && !url.includes('storage.googleapis.com')) return
  try {
    const m = /\/o\/([^?]+)/.exec(url)
    if (!m) return
    const path = decodeURIComponent(m[1])
    // Re-stamp ownerToken metadata just before delete — Storage rules
    // check it on the delete verb too.
    const objectRef = ref(storage, path)
    try { await updateMetadata(objectRef, { customMetadata: { ownerToken: OWNER_TOKEN } }) } catch {}
    await deleteObject(objectRef)
  } catch (e) {
    console.warn('[storage] deleteImageByUrl failed', e)
  }
}

export function isDataUrl(url) {
  return typeof url === 'string' && url.startsWith('data:')
}
