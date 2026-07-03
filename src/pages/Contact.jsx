import { useState } from 'react'

const OWNER_EMAIL = 'ananth.machiraju@outlook.com'
// FormSubmit.co lets you receive form emails without any signup or backend.
// On the very first submission you'll get a confirmation email at OWNER_EMAIL —
// click the link once, and every future submission will land in your inbox.
const FORM_ENDPOINT = `https://formsubmit.co/${OWNER_EMAIL}`

const TOPICS = ['Journal', 'Photos', 'Experiences', 'Articles', 'Views on a Topic', 'Something Else']

export default function Contact() {
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)

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
      } else {
        setStatus({ ok: false, msg: 'Something went wrong. Please try again — or email ' + OWNER_EMAIL + ' directly.' })
      }
    } catch {
      setStatus({ ok: false, msg: 'Network error. You can also email ' + OWNER_EMAIL + ' directly.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="section-header">
        <h2>Write to Ananth</h2>
      </div>
      <p style={{ maxWidth: 640, margin: '0 auto 30px', textAlign: 'center' }}>
        Thoughts on a journal entry, a photo, an experience, an article, or a view I've shared?
        Send it here — every message goes straight to <a href={`mailto:${OWNER_EMAIL}`}>{OWNER_EMAIL}</a>.
      </p>

      <form className="form" onSubmit={onSubmit}>
        <input type="hidden" name="_subject" value="New message from I'm Ananth" />
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_template" value="table" />

        <label>Your Name</label>
        <input name="name" required />

        <label>Your Email</label>
        <input name="email" type="email" required />

        <label>About</label>
        <select name="topic" defaultValue={TOPICS[0]}>
          {TOPICS.map(t => <option key={t}>{t}</option>)}
        </select>

        <label>Message</label>
        <textarea name="message" required placeholder="Say what's on your mind…" />

        <button className="btn" type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Send Message'}
        </button>

        {status && (
          <div className={`status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</div>
        )}
      </form>
    </>
  )
}
