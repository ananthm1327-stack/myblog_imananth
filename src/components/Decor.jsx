// Shared page ornaments — watermark word, chapter numeral,
// ornate SVG divider, and closing flourish. Used across every page
// so the empty background between hero/header and footer stays alive.

export function Ornament() {
  return (
    <div className="ornament" aria-hidden="true">
      <svg viewBox="0 0 500 40" width="100%" height="40" preserveAspectRatio="xMidYMid meet">
        <g fill="none" stroke="#c8a24b" strokeWidth="1.2" strokeLinecap="round">
          <path d="M40 20 Q90 4, 140 20 T240 20" />
          <path d="M460 20 Q410 4, 360 20 T260 20" />
          <path d="M120 20 Q160 34, 200 20" opacity="0.6" />
          <path d="M380 20 Q340 34, 300 20" opacity="0.6" />
          <circle cx="250" cy="20" r="6" fill="#c8a24b" stroke="none" />
          <circle cx="250" cy="20" r="10" opacity="0.5" />
          <circle cx="250" cy="20" r="14" opacity="0.3" />
          <path d="M232 20 L250 12 L268 20 L250 28 Z" fill="#c8a24b" stroke="none" opacity="0.9" />
          <line x1="30" y1="20" x2="10" y2="20" opacity="0.4" />
          <line x1="470" y1="20" x2="490" y2="20" opacity="0.4" />
        </g>
      </svg>
    </div>
  )
}

export function ClosingFlourish() {
  return (
    <div className="closing-flourish" aria-hidden="true">
      <span className="closing-line" />
      <span className="closing-mark">&#10022;</span>
      <span className="closing-line" />
    </div>
  )
}

// Wrap a page's content to establish a positioning context for the
// watermark + chapter numeral. Optional numeral (Roman or a symbol).
export function Page({ label, numeral, children, className = '' }) {
  return (
    <div className={`page-frame ${className}`}>
      {numeral && <span className="chapter-numeral" aria-hidden="true">{numeral}</span>}
      {label && <span className="page-watermark" aria-hidden="true">{label}</span>}
      {children}
      <ClosingFlourish />
    </div>
  )
}
