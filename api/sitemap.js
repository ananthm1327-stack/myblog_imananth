// Serverless function (Vercel) serving a live sitemap.xml at /sitemap.xml
// (see the rewrite in vercel.json). Queries Supabase directly at request
// time so it's always current — unlike a build-time-generated sitemap,
// it never goes stale between deploys, since posts are added live via the
// browser without ever triggering a redeploy.

import { createClient } from '@supabase/supabase-js'

const SECTIONS = ['journal', 'photos', 'experiences', 'articles', 'views']

export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  const siteUrl = (process.env.VITE_SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '')
  const now = new Date().toISOString().slice(0, 10)

  const staticPages = ['', '/about', '/contact', ...SECTIONS.map(s => `/${s}`)]
  const urls = staticPages.map(path =>
    `  <url><loc>${siteUrl}${path}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`
  )

  if (url && anon) {
    try {
      const client = createClient(url, anon)
      const { data, error } = await client
        .from('posts')
        .select('id, section, status, publish_at, created_at, updated_at')
        .eq('status', 'published')
      if (!error && data) {
        const nowMs = Date.now()
        data
          .filter(p => !p.publish_at || new Date(p.publish_at).getTime() <= nowMs)
          .forEach(p => {
            const lastmod = (p.updated_at || p.created_at || new Date().toISOString()).slice(0, 10)
            urls.push(`  <url><loc>${siteUrl}/${p.section}/${p.id}</loc><lastmod>${lastmod}</lastmod></url>`)
          })
      }
    } catch (e) {
      console.error('[sitemap] Supabase query failed', e)
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600')
  res.status(200).send(xml)
}
