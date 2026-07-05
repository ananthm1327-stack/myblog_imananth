import { getDailyQuote } from '../lib/quotes.js'

export default function DailyQuote() {
  const { text, date } = getDailyQuote()
  const label = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <section className="daily-quote" aria-label="Quote of the day">
      <div className="daily-quote-inner">
        <div className="daily-quote-rail" aria-hidden="true">
          <span className="daily-quote-rail-text">Quote of the Day</span>
        </div>
        <div className="daily-quote-main">
          <span className="daily-quote-watermark" aria-hidden="true">&ldquo;</span>
          <blockquote className="daily-quote-body">
            <p>{text}</p>
          </blockquote>
          <div className="daily-quote-date">{label}</div>
        </div>
      </div>
    </section>
  )
}
