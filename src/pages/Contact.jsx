import { useState } from 'react'
import { Page } from '../components/Decor.jsx'

const OWNER_EMAIL = 'ananth.machiraju@outlook.com'
// FormSubmit.co lets you receive form emails without any signup or backend.
// On the very first submission you'll get a confirmation email at OWNER_EMAIL —
// click the link once, and every future submission will land in your inbox.
const FORM_ENDPOINT = `https://formsubmit.co/${OWNER_EMAIL}`

const TOPICS = [
  { value: 'Journal',           label: 'A journal entry', hint: 'Reactions, corrections, or your own version.' },
  { value: 'Photos',            label: 'A photograph',    hint: 'Where it made you go, what it reminded you of.' },
  { value: 'Experiences',       label: 'An experience',   hint: 'Something similar you\'ve lived through.' },
  { value: 'Articles',          label: 'An article',      hint: 'Where you disagreed. Where you didn\'t.' },
  { value: 'Views on a Topic',  label: 'A view I shared', hint: 'A counter, a nudge, or an "amen".' },
  { value: 'Something Else',    label: 'Something else',  hint: 'Whatever\'s on your mind.' }
]

const CONTACT_METHODS = [
  {
    key: 'email',
    label: 'Email',
    value: OWNER_EMAIL,
    href: `mailto:${OWNER_EMAIL}`,
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
      </svg>
    )
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    value: 'in/saiananthmachiraju',
    href: 'https://www.linkedin.com/in/saiananthmachiraju',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M4.98 3.5a2.5 2.5 0 11-.02 5.01A2.5 2.5 0 014.98 3.5zM3 9h4v12H3V9zm7 0h3.8v1.7h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.34c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.81V21h-4V9z"/>
      </svg>
    )
  },
  {
    key: 'location',
    label: 'Based in',
    value: 'Bengaluru, India',
    href: null,
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>
      </svg>
    )
  },
  {
    key: 'reply',
    label: 'Reply time',
    value: 'Usually within 48 hours',
    href: null,
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
      </svg>
    )
  }
]

export default function Contact() {
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)
  const [topic, setTopic] = useState(TOPICS[0].value)
  const activeTopic = TOPICS.find(t => t.value === topic) || TOPICS[0]

  const onSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setStatus(null)
    const form = e.target
    const data = new FormData(form)

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      })
      if (res.ok) {
        setStatus({ ok: true, msg: 'Your message has been sent. Ananth will read every word.' })
        form.reset()
        setTopic(TOPICS[0].value)
      } else {
        setStatus({ ok: false, msg: `Something went wrong. Please try again — or email ${OWNER_EMAIL} directly.` })
      }
    } catch {
      setStatus({ ok: false, msg: `Network error. You can also email ${OWNER_EMAIL} directly.` })
    } finally {
      setSending(false)
    }
  }

  return (
    <Page label="Contact">
      <article className="contact-v2">
        {/* ---------- HERO ---------- */}
        <header className="ct-hero">
          <div className="ct-eyebrow">Say hello</div>
          <h1 className="ct-title">Write to <em>Ananth</em></h1>
          <div className="ct-divider" aria-hidden="true">
            <span /><span className="ct-diamond">&#10022;</span><span />
          </div>
          <p className="ct-intro">
            Every message goes straight to my inbox. There's no support team, no autoresponder,
            no template — just me, reading what you sent, usually while making coffee.
          </p>
        </header>

        {/* ---------- MAIN LAYOUT ---------- */}
        <section className="ct-body">
          {/* Left: methods + quote */}
          <aside className="ct-side">
            <div className="ct-methods">
              {CONTACT_METHODS.map(m => {
                const inner = (
                  <>
                    <span className="ct-method-icon">{m.icon}</span>
                    <span className="ct-method-info">
                      <span className="ct-method-label">{m.label}</span>
                      <span className="ct-method-value">{m.value}</span>
                    </span>
                  </>
                )
                return m.href ? (
                  <a key={m.key} href={m.href} target={m.href.startsWith('http') ? '_blank' : undefined}
                     rel="noreferrer noopener" className="ct-method">
                    {inner}
                  </a>
                ) : (
                  <div key={m.key} className="ct-method">{inner}</div>
                )
              })}
            </div>

            <blockquote className="ct-quote">
              <span className="ct-quote-mark" aria-hidden="true">&ldquo;</span>
              <p>The best conversations I had this year were with people who asked me questions I couldn't answer immediately.</p>
              <cite>— from the Journal</cite>
            </blockquote>
          </aside>

          {/* Right: form */}
          <form className="ct-form" onSubmit={onSubmit}>
            <input type="hidden" name="_subject" value="New message from I'm Ananth" />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="table" />

            <div className="ct-row ct-row-2">
              <div className="ct-field">
                <label htmlFor="ct-name">Your name</label>
                <input id="ct-name" name="name" required placeholder="What should I call you?" />
              </div>
              <div className="ct-field">
                <label htmlFor="ct-email">Your email</label>
                <input id="ct-email" name="email" type="email" required placeholder="you@somewhere.com" />
              </div>
            </div>

            <div className="ct-field">
              <label>What's this about?</label>
              <div className="ct-topics">
                {TOPICS.map(t => (
                  <label key={t.value} className={`ct-topic ${topic === t.value ? 'active' : ''}`}>
                    <input type="radio" name="topic" value={t.value}
                      checked={topic === t.value}
                      onChange={() => setTopic(t.value)} />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
              <div className="ct-topic-hint">{activeTopic.hint}</div>
            </div>

            <div className="ct-field">
              <label htmlFor="ct-message">Your message</label>
              <textarea id="ct-message" name="message" required rows={7}
                placeholder="Take your time. There's no character limit and no hurry." />
            </div>

            <div className="ct-submit-row">
              <button className="btn ct-submit" type="submit" disabled={sending}>
                {sending ? 'Sending…' : 'Send message'}
                <span className="ct-submit-arrow" aria-hidden="true">&rarr;</span>
              </button>
              <span className="ct-fine-print">Delivered straight to Ananth's inbox &middot; no third-party tracking</span>
            </div>

            {status && (
              <div className={`ct-status ${status.ok ? 'ok' : 'err'}`}>
                {status.ok && <span className="ct-status-icon" aria-hidden="true">&#10003;</span>}
                {status.msg}
              </div>
            )}
          </form>
        </section>

        {/* ---------- SIGNATURE ---------- */}
        <div className="ct-signature">
          <div className="ct-signature-line" aria-hidden="true" />
          <div
            role="img"
            aria-label="Signed, Ananth Machiraju"
            className="signature-img"
          />
          <div className="signature-caption">Ananth Machiraju</div>
        </div>
      </article>
    </Page>
  )
}
