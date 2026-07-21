import { Page } from '../components/Decor.jsx'
import Meta from '../components/Meta.jsx'

// The three legal / policy pages share a single component. Which one
// renders is decided by the `slug` prop from the route, and the copy
// lives inline below so a future edit is one file, no data plumbing.

const CONTACT_EMAIL = 'ananth.machiraju@outlook.com'
const SITE_NAME = "I'm Ananth"
const SITE_URL = 'https://iamananth.blog'
const LAST_UPDATED = '17 July 2026'

const CONTENT = {
  privacy: {
    label: 'Privacy',
    title: 'Privacy Policy',
    metaDescription: `How ${SITE_NAME} handles the small amount of information it collects — plainly, in a personal blog's terms.`,
    intro: `${SITE_NAME} is a personal editorial site run by Ananth Machiraju. This page is an honest summary of what data touches this site, why, and what happens to it.`,
    sections: [
      {
        h: 'What this site actually collects',
        body: [
          `This is a personal blog, not a product. There are no accounts to create, no logins to remember, and no tracking pixels. Everything below is what actually happens when you visit or interact with the site.`,
          `• Your browser sends its usual request headers to Vercel (the host) — that includes your IP address and user agent, which Vercel logs briefly for standard operations reasons. I don't receive this data personally and don't use it for anything.`,
          `• Publicly readable content (posts, comments, photos) is served from Supabase, whose database receives the read requests. No personal identifiers are attached to a read.`,
          `• If you leave a comment, the name and comment text you type are stored in the site's database and shown publicly once approved. Only that; no email required.`,
          `• If you subscribe to the newsletter or send a message via the contact form, the email address (and message body) you type are delivered to my inbox through a third-party form service called FormSubmit. That inbox is mine (${CONTACT_EMAIL}); nothing else is done with the address.`,
          `• Anything you save with the bookmark button, or any reaction you leave on a comment, is stored only in your own browser (localStorage) — it never leaves your device.`,
          `• If you accept the cookie notice, a single "accepted" flag is stored in your browser's localStorage so the notice doesn't reappear. Declining stores a "declined" flag with the same behavior.`
        ]
      },
      {
        h: 'What this site does not do',
        body: [
          `• No advertising. No ad-tech scripts, no third-party trackers, no fingerprinting, no data brokers.`,
          `• No analytics platforms (Google Analytics, Meta pixel, or similar) are loaded.`,
          `• No selling, renting, or sharing your data with anyone. Ever. If that changes, this page changes first.`,
          `• No profile-building or behavior scoring of visitors.`
        ]
      },
      {
        h: 'Third parties this site relies on',
        body: [
          `Because this is a small solo project, a few well-known services provide plumbing under the hood. Each has its own privacy policy:`,
          `• Vercel — hosts the site and serves it to your browser.`,
          `• Supabase — stores posts, photos, and comments in a Postgres database and object storage.`,
          `• FormSubmit — receives contact-form and newsletter submissions and forwards them to my email.`,
          `• Google Fonts — serves the Cormorant Garamond, Great Vibes, and Inter fonts used across the site.`
        ]
      },
      {
        h: 'Your rights, plainly',
        body: [
          `You can ask me at any time to delete a comment you submitted, remove your email from the newsletter list, or clarify what data (if any) I hold about you. Email ${CONTACT_EMAIL} and I'll handle it personally, usually within a few days.`,
          `You can clear the site's use of your own device's storage by clearing your browser data for iamananth.blog — that removes bookmarks, reaction history, and the cookie-consent flag.`
        ]
      },
      {
        h: 'Children',
        body: [
          `This site isn't directed at children under 13 and doesn't knowingly collect information from them. If you believe a child has submitted a comment or subscribed to the newsletter, please email ${CONTACT_EMAIL} and I'll remove it.`
        ]
      },
      {
        h: 'Changes to this policy',
        body: [
          `If this policy meaningfully changes, the "Last updated" date at the top will change, and any change will apply going forward, not retroactively.`
        ]
      }
    ]
  },
  disclaimer: {
    label: 'Disclaimer',
    title: 'Disclaimer',
    metaDescription: `What ${SITE_NAME} is and isn't — the honest limits on the opinions, articles, and photographs published here.`,
    intro: `Everything on ${SITE_NAME} is personal. This page exists so readers know exactly what that means, and what it doesn't.`,
    sections: [
      {
        h: 'Personal views only',
        body: [
          `Every journal entry, photograph, essay, article, view, and reaction on this site is my own — Ananth Machiraju's — written in my personal capacity. Nothing here is published on behalf of any employer, past or present, or any client, team, industry, or organization I've been part of. Any resemblance to an official position of any such organization is coincidental and not intended.`
        ]
      },
      {
        h: 'Not professional advice',
        body: [
          `Articles and views on this site are reflections, not advice. They are not legal advice, medical advice, financial advice, investment advice, career counseling, mental health counseling, or professional recommendations of any kind. Reading a post here does not create any professional relationship with me.`,
          `If you need real advice on a decision that affects your life, work, or health, please consult a licensed professional in the relevant field. Do not rely on this site's content to make important decisions.`
        ]
      },
      {
        h: 'Accuracy — done in good faith',
        body: [
          `I try to write carefully and check what I know before I publish. That said, everything here can contain mistakes, outdated information, or opinions I've since changed. If you spot something wrong, I'd genuinely like to hear about it — email ${CONTACT_EMAIL}. I'll correct or add a note to the post promptly.`,
          `Where a post makes a factual claim, prefer to verify it independently through a source that specialises in the topic before acting on it.`
        ]
      },
      {
        h: 'External links',
        body: [
          `This site sometimes links to articles, tools, or resources hosted elsewhere. Those links are shared because I found them useful or interesting at the time of writing; I don't control the content on the other side, can't guarantee its accuracy, and don't endorse anything else the linked site may promote.`
        ]
      },
      {
        h: 'Photographs and imagery',
        body: [
          `Photographs published on this site are mine unless clearly attributed otherwise. If you spot an image you believe belongs to you or was used without proper credit, please email ${CONTACT_EMAIL} and I'll investigate and correct it quickly.`
        ]
      },
      {
        h: 'AI-assisted work',
        body: [
          `Some of the code powering this site was written with the help of AI assistants; some sentences in editorial posts may have been shaped with the help of AI tools too. Regardless of how a piece was produced, I take full personal responsibility for what appears on this site under my name.`
        ]
      },
      {
        h: 'No warranty',
        body: [
          `This site is provided as-is. I make no warranties, express or implied, about its accuracy, reliability, availability, or fitness for any particular purpose. Your use of the site is at your own discretion.`
        ]
      }
    ]
  },
  terms: {
    label: 'Terms',
    title: 'Terms & Conditions',
    metaDescription: `The simple ground rules for reading, commenting, and using ${SITE_NAME}.`,
    intro: `By using ${SITE_NAME} at ${SITE_URL}, you're agreeing to these terms. They're short and mostly common sense.`,
    sections: [
      {
        h: 'Using this site',
        body: [
          `You may read, share, quote, and link to anything on this site freely for personal or non-commercial use. If you quote a post, a short attribution and a link back is appreciated.`,
          `You may not scrape or bulk-download the site's content for the purpose of training a commercial AI model, reselling it, or republishing it as your own work.`,
          `You may not attempt to break, overload, deface, or reverse-engineer any part of the site or its underlying services (Supabase database, storage, forms, etc.).`
        ]
      },
      {
        h: 'Ownership',
        body: [
          `All words, photographs, essays, and views published on this site are the personal work of Ananth Machiraju and are copyrighted accordingly. The site's code is open-source under the MIT license (see the repository), but the content is not — please don't republish it as your own.`,
          `Trademarks, brand names, and product names referenced on this site (companies, clients, employers, cities, publications) belong to their respective owners; their appearance here is descriptive, not an endorsement.`
        ]
      },
      {
        h: 'Comments and submissions',
        body: [
          `Comments are moderated. When you submit a comment, you confirm that (a) the content is yours to submit, (b) it doesn't infringe anyone's rights, and (c) it isn't unlawful, hateful, harassing, spam, or otherwise abusive.`,
          `Once submitted, you grant a non-exclusive, royalty-free, worldwide license to display your comment publicly on this site. You can ask me to remove your comment at any time by emailing ${CONTACT_EMAIL}.`,
          `I may edit for basic formatting, decline to publish anything at my discretion, or remove approved comments later if circumstances change. There is no obligation to publish or preserve any submission.`,
          `The newsletter is opt-in. If you subscribe and later change your mind, email ${CONTACT_EMAIL} and I'll take you off the list.`
        ]
      },
      {
        h: 'Availability',
        body: [
          `I try to keep the site up and current, but there's no guarantee of uptime, uninterrupted access, or that any specific post will remain published indefinitely. Content may be moved, edited, or removed without notice.`
        ]
      },
      {
        h: 'Limitation of liability',
        body: [
          `To the extent permitted by law, I'm not liable for any loss or damage arising from your use of, or reliance on, this site or its content. Please read the Disclaimer for the shape of that limit in plain language.`
        ]
      },
      {
        h: 'Governing law',
        body: [
          `These terms are governed by the laws of India, and any dispute relating to the site will be handled by the appropriate courts in Bengaluru, India. If you're reading from somewhere else, that's fine — those are just the rules that apply if there ever were a formal dispute.`
        ]
      },
      {
        h: 'Changes',
        body: [
          `If these terms change meaningfully, the "Last updated" date at the top will change, and the new terms will apply from that date forward.`
        ]
      },
      {
        h: 'Contact',
        body: [
          `Any question about these terms, the disclaimer, or the privacy policy — email ${CONTACT_EMAIL}. I read every message.`
        ]
      }
    ]
  }
}

export default function Legal({ slug }) {
  const doc = CONTENT[slug]
  if (!doc) {
    return (
      <Page label="Not found">
        <Meta title="Not found" noindex />
        <div className="post-detail">
          <div className="empty">Page not found.</div>
        </div>
      </Page>
    )
  }
  return (
    <Page label={doc.label}>
      <Meta title={doc.title} description={doc.metaDescription} path={`/${slug}`} />
      <article className="legal">
        <header className="legal-head">
          <div className="legal-eyebrow">Ground rules</div>
          <h1 className="legal-title">{doc.title}</h1>
          <div className="legal-meta">Last updated {LAST_UPDATED}</div>
        </header>

        <p className="legal-intro">{doc.intro}</p>

        {doc.sections.map((s, i) => (
          <section key={i} className="legal-section">
            <h2>{s.h}</h2>
            {s.body.map((p, j) => <p key={j}>{p}</p>)}
          </section>
        ))}

        <footer className="legal-foot">
          Written and maintained personally by Ananth Machiraju. Questions? {' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </footer>
      </article>
    </Page>
  )
}
