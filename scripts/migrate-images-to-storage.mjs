#!/usr/bin/env node
// One-off migration: fetch every post with a base64 data: URL image,
// upload the decoded bytes to Supabase Storage, and rewrite the row's
// image column to the public URL. Safe to re-run — it skips rows that
// already have http(s) URLs.
//
// Usage:  node scripts/migrate-images-to-storage.mjs
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_OWNER_TOKEN
// from .env.local. Rows are gated by the owner_token RLS policy, so
// the anon key + owner header is enough for the update.

import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envRaw = fs.readFileSync(envPath, 'utf8')
const env = {}
envRaw.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
})

const SUPABASE_URL = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
const OWNER = env.VITE_OWNER_TOKEN
if (!SUPABASE_URL || !ANON || !OWNER) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_OWNER_TOKEN in .env.local')
  process.exit(1)
}

const BUCKET = 'post-images'

const commonHeaders = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  'x-owner-token': OWNER
}

function extForContentType(ct) {
  if (!ct) return 'bin'
  const map = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' }
  return map[ct.toLowerCase()] || 'bin'
}

function parseDataUrl(s) {
  const m = /^data:([^;,]+);base64,(.*)$/.exec(s)
  if (!m) return null
  return { contentType: m[1], bytes: Buffer.from(m[2], 'base64') }
}

async function fetchPostsWithBase64() {
  const url = `${SUPABASE_URL}/rest/v1/posts?select=id,section,image&image=like.data%3A%25`
  const res = await fetch(url, { headers: commonHeaders })
  if (!res.ok) throw new Error(`fetch posts failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function uploadBytes(sectionKey, contentType, bytes) {
  const ext = extForContentType(contentType)
  const rand = Math.random().toString(36).slice(2, 10)
  const objectPath = `${sectionKey}/${Date.now()}-${rand}.${ext}`
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { ...commonHeaders, 'Content-Type': contentType, 'x-upsert': 'false' },
    body: bytes
  })
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${await res.text()}`)
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`
}

async function updatePostImage(id, publicUrl) {
  const url = `${SUPABASE_URL}/rest/v1/posts?id=eq.${encodeURIComponent(id)}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...commonHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ image: publicUrl })
  })
  if (!res.ok) throw new Error(`patch failed: ${res.status} ${await res.text()}`)
}

async function main() {
  console.log('scanning posts for base64 images...')
  const posts = await fetchPostsWithBase64()
  console.log(`found ${posts.length} rows to migrate.`)
  let ok = 0, fail = 0, skipped = 0
  for (const p of posts) {
    const parsed = parseDataUrl(p.image)
    if (!parsed) { skipped++; console.log(`skip ${p.id}: image not a base64 data: URL`); continue }
    const kb = Math.round(parsed.bytes.length / 1024)
    try {
      const publicUrl = await uploadBytes(p.section, parsed.contentType, parsed.bytes)
      await updatePostImage(p.id, publicUrl)
      console.log(`ok   ${p.id.padEnd(20)} ${p.section.padEnd(12)} ${String(kb).padStart(5)} KB -> ${publicUrl}`)
      ok++
    } catch (e) {
      console.error(`fail ${p.id.padEnd(20)} ${p.section.padEnd(12)} ${String(kb).padStart(5)} KB — ${e.message}`)
      fail++
    }
  }
  console.log(`\nmigrated ${ok}, failed ${fail}, skipped ${skipped}.`)
}

main().catch(e => { console.error(e); process.exit(1) })
