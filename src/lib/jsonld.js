// Structured data (schema.org JSON-LD) shared between the homepage and
// individual posts, so search engines can attribute content to a real
// author/entity instead of guessing from plain text.

import { SITE_URL } from '../store.js'

const SOCIAL_LINKS = [
  'https://www.instagram.com/ananth.og',
  'https://x.com/saiananthmachiraju',
  'https://www.linkedin.com/in/saiananthmachiraju',
  'https://github.com/ananthm1327-stack'
]

export const PERSON = {
  '@type': 'Person',
  name: 'Ananth Machiraju',
  url: SITE_URL,
  sameAs: SOCIAL_LINKS,
  jobTitle: 'Project Manager & IT Delivery Lead'
}

export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      PERSON,
      {
        '@type': 'WebSite',
        name: "I'm Ananth",
        url: SITE_URL,
        description: 'Journals, photographs, experiences, articles, and honest views by Ananth Machiraju.',
        author: PERSON
      }
    ]
  }
}

export function postJsonLd({ title, description, image, path, createdAt, updatedAt }) {
  const img = image
    ? (image.startsWith('http') || image.startsWith('data:') ? image : `${SITE_URL}${image}`)
    : `${SITE_URL}/logo.png`
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: img,
    datePublished: createdAt,
    dateModified: updatedAt || createdAt,
    author: PERSON,
    publisher: PERSON,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${path}` }
  }
}
