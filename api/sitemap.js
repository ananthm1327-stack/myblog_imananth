// Serverless function (Vercel) serving a live sitemap.xml at /sitemap.xml
// (see the rewrite in vercel.json). Queries Firestore via its public
// REST API at request time so the sitemap is always current — no
// service account key needed on Vercel, no admin SDK dependency.
// Firestore Security Rules already allow public reads of published
// posts, so the same rules that let a browser render the site let the
// sitemap function fetch it.

const SECTIONS = ['journal', 'photos', 'experiences', 'articles', 'views']

async function fetchPublishedPosts(projectId, apiKey) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`
  const nowIso = new Date().toISOString()
  // Firestore StructuredQuery. Filter to published + not-scheduled-in-future.
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'posts' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } }
          ]
        }
      }
    }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`Firestore query failed: ${res.status} ${await res.text()}`)
  const rows = await res.json()
  const nowMs = Date.now()
  return rows
    .filter(r => r.document)
    .map(r => {
      const fields = r.document.fields || {}
      const val = (f) => f?.stringValue ?? f?.timestampValue ?? null
      return {
        id: r.document.name.split('/').pop(),
        section: val(fields.section),
        publishAt: val(fields.publishAt),
        createdAt: val(fields.createdAt),
        updatedAt: val(fields.updatedAt)
      }
    })
    .filter(p => !p.publishAt || new Date(p.publishAt).getTime() <= nowMs)
}

export default async function handler(req, res) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID
  const apiKey = process.env.VITE_FIREBASE_API_KEY
  const siteUrl = (process.env.VITE_SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '')
  const now = new Date().toISOString().slice(0, 10)

  const staticPages = ['', '/about', '/contact', '/privacy', '/disclaimer', '/terms', ...SECTIONS.map(s => `/${s}`)]
  const urls = staticPages.map(path =>
    `  <url><loc>${siteUrl}${path}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`
  )

  if (projectId && apiKey) {
    try {
      const posts = await fetchPublishedPosts(projectId, apiKey)
      posts.forEach(p => {
        if (!p.section) return
        const lastmod = (p.updatedAt || p.createdAt || new Date().toISOString()).slice(0, 10)
        urls.push(`  <url><loc>${siteUrl}/${p.section}/${p.id}</loc><lastmod>${lastmod}</lastmod></url>`)
      })
    } catch (e) {
      console.error('[sitemap] Firestore query failed', e)
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600')
  res.status(200).send(xml)
}
