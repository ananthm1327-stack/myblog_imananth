// Optional Supabase backend for cross-device sync.
// If env vars aren't set, `client` is null and the app runs local-only.
//
// Configure by creating a .env.local file at the repo root with:
//   VITE_SUPABASE_URL=https://<project>.supabase.co
//   VITE_SUPABASE_ANON_KEY=<anon key>
//   VITE_OWNER_TOKEN=<a long random string, must match db.owner_secret>
//
// See supabase/schema.sql for the tables + RLS policies to run once.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
export const OWNER_TOKEN = import.meta.env.VITE_OWNER_TOKEN || ''

export const isSupabaseEnabled = Boolean(url && anon)

// Attach the owner token to every request so RLS policies that check
// current_setting('request.headers', true)::json->>'x-owner-token' can authenticate the writer.
// The header is safe on reads (RLS ignores it for public policies) and gates every write.
export const client = isSupabaseEnabled
  ? createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: OWNER_TOKEN ? { headers: { 'x-owner-token': OWNER_TOKEN } } : undefined
    })
  : null

export function backendStatus() {
  if (!isSupabaseEnabled) return { enabled: false, reason: 'env not configured' }
  return { enabled: true, url }
}
