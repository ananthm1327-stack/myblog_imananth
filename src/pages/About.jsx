import { Link } from 'react-router-dom'
import { Page } from '../components/Decor.jsx'
import Meta from '../components/Meta.jsx'

// ------- EDIT THIS OBJECT TO PERSONALIZE THE PAGE -------
// Everything the page renders is driven from here so you can update
// details without touching JSX.
const ABOUT = {
  intro: `I'm Ananth Machiraju — a Project Manager and IT Delivery Lead who writes here, in between meetings, deliveries, and quiet weekends. This site is a small slice of my mind: journals, photographs, essays, and honest views on the world.`,

  family: {
    hometown: 'Amalapuram, India',
    basedIn: 'Bengaluru, India',
    // Feel free to edit / add fields below. Anything left empty just won't render.
    parents: 'Grew up in a close-knit South Indian family that valued reading, questions, and long dinner-table conversations.',
    partner: '',
    siblings: '',
    languages: ['English', 'Telugu', 'Hindi']
  },

  professional: {
    role: 'Project Manager & IT Delivery Lead',
    experienceYears: 10,
    location: 'Bengaluru, India',
    industries: [
      { name: 'Financial Services', clients: ['NEST Pensions (UK)', 'TCS'] },
      { name: 'Logistics', clients: ['PostNord', 'Capgemini'] },
      { name: 'Healthcare', clients: ['Pareto', 'Medvensys'] }
    ],
    skills: [
      'Agile / Scrum delivery',
      'Stakeholder management',
      'Cross-timezone team leadership',
      'Product strategy',
      'Roadmapping & prioritization',
      'AI-assisted rapid prototyping'
    ],
    bio: `Ten years spent shipping software across financial services, logistics, and healthcare — from pensions platforms in London to logistics automation in the Nordics. My day job is delivery: keeping teams unblocked, roadmaps honest, and stakeholders in the loop. My nights and weekends I spend building small things with code, which is where projects like this one come from.`
  },

  website: {
    label: 'Portfolio',
    url: 'https://ananth-pm.vercel.app/'
  },

  socials: [
    { name: 'LinkedIn',  href: 'https://www.linkedin.com/in/saiananthmachiraju', handle: '/in/saiananthmachiraju' },
    { name: 'X',         href: 'https://x.com/saiananthmachiraju',              handle: '@saiananthmachiraju' },
    { name: 'Instagram', href: 'https://www.instagram.com/ananth.og',            handle: '@ananth.og' },
    { name: 'GitHub',    href: 'https://github.com/ananthm1327-stack',           handle: 'ananthm1327-stack' },
    { name: 'Email',     href: 'mailto:ananth.machiraju@outlook.com',            handle: 'ananth.machiraju@outlook.com' }
  ]
}

function SocialIcon({ name }) {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'Instagram': return (
      <svg viewBox="0 0 24 24" width="18" height="18" {...stroke}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    )
    case 'X': return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M17.53 3H20.5l-6.49 7.42L22 21h-6.16l-4.83-6.32L5.4 21H2.43l6.95-7.94L2 3h6.32l4.36 5.77L17.53 3zm-1.08 16.2h1.64L7.62 4.7H5.86L16.45 19.2z"/>
      </svg>
    )
    case 'LinkedIn': return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M4.98 3.5a2.5 2.5 0 11-.02 5.01A2.5 2.5 0 014.98 3.5zM3 9h4v12H3V9zm7 0h3.8v1.7h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.34c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.81V21h-4V9z"/>
      </svg>
    )
    case 'GitHub': return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 2a10 10 0 00-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.92-.62.07-.6.07-.6 1.01.07 1.54 1.04 1.54 1.04.9 1.54 2.36 1.1 2.94.84.09-.65.35-1.1.64-1.35-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.7-.1-.25-.45-1.28.1-2.66 0 0 .84-.27 2.75 1.02a9.6 9.6 0 015 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.41.1 2.66.64.71 1.03 1.6 1.03 2.7 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z"/>
      </svg>
    )
    case 'Email': return (
      <svg viewBox="0 0 24 24" width="18" height="18" {...stroke}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    )
    default: return null
  }
}

export default function About() {
  const { intro, family, professional, website, socials } = ABOUT
  return (
    <Page label="About">
      <Meta
        title="About"
        description="Project Manager and IT Delivery Lead by day, writer and photographer by night. Meet Ananth Machiraju."
        path="/about"
      />
      <div className="section-header">
        <h1>About Ananth</h1>
      </div>

      <article className="about">
        <section className="about-intro">
          <div className="about-mono" aria-hidden="true">A</div>
          <p>{intro}</p>
        </section>

        {/* ---------- FAMILY ---------- */}
        <section className="about-block">
          <div className="about-eyebrow">Family &amp; Personal</div>
          <h3 className="about-heading">Where I come from</h3>
          <div className="about-grid">
            {family.hometown && <div className="about-cell"><span className="cell-label">Hometown</span><span>{family.hometown}</span></div>}
            {family.basedIn && <div className="about-cell"><span className="cell-label">Currently in</span><span>{family.basedIn}</span></div>}
            {family.languages?.length > 0 && (
              <div className="about-cell"><span className="cell-label">Languages</span><span>{family.languages.join(' · ')}</span></div>
            )}
            {family.partner && <div className="about-cell"><span className="cell-label">Partner</span><span>{family.partner}</span></div>}
            {family.siblings && <div className="about-cell"><span className="cell-label">Siblings</span><span>{family.siblings}</span></div>}
          </div>
          {family.parents && <p className="about-para">{family.parents}</p>}
        </section>

        {/* ---------- PROFESSIONAL ---------- */}
        <section className="about-block">
          <div className="about-eyebrow">Work</div>
          <h3 className="about-heading">{professional.role}</h3>
          <p className="about-role-meta">
            {professional.experienceYears}+ years &middot; based in {professional.location}
          </p>
          <p className="about-para">{professional.bio}</p>

          <div className="about-industries">
            {professional.industries.map(ind => (
              <div key={ind.name} className="about-industry">
                <div className="about-industry-name">{ind.name}</div>
                <ul className="about-clients">
                  {ind.clients.map(c => <li key={c}>{c}</li>)}
                </ul>
              </div>
            ))}
          </div>

          {professional.skills?.length > 0 && (
            <>
              <div className="about-subhead">What I do</div>
              <ul className="about-skills">
                {professional.skills.map(s => <li key={s}>{s}</li>)}
              </ul>
            </>
          )}
        </section>

        {/* ---------- WEBSITE ---------- */}
        <section className="about-block">
          <div className="about-eyebrow">Website</div>
          <h3 className="about-heading">Also me, elsewhere</h3>
          <a href={website.url} target="_blank" rel="noreferrer noopener" className="about-website">
            <span className="about-website-label">{website.label}</span>
            <span className="about-website-url">{website.url.replace(/^https?:\/\//, '')} &rarr;</span>
          </a>
        </section>

        {/* ---------- SOCIALS ---------- */}
        <section className="about-block">
          <div className="about-eyebrow">Elsewhere</div>
          <h3 className="about-heading">Find me on the internet</h3>
          <div className="about-socials">
            {socials.map(s => (
              <a key={s.name} href={s.href} target="_blank" rel="noreferrer noopener" className="about-social">
                <span className="about-social-icon"><SocialIcon name={s.name} /></span>
                <span className="about-social-info">
                  <span className="about-social-name">{s.name}</span>
                  <span className="about-social-handle">{s.handle}</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <div className="about-cta">
          <p>Want to say hello, share thoughts, or just be in touch?</p>
          <Link to="/contact" className="btn hero-btn">Write to Ananth</Link>
        </div>

        <div className="about-signature signature-block">
          <div className="signature-line" aria-hidden="true" />
          <img
            src="/signature.png"
            alt="Signed, Ananth Machiraju"
            className="signature-img"
          />
          <div className="signature-caption">Ananth Machiraju</div>
        </div>
      </article>
    </Page>
  )
}
