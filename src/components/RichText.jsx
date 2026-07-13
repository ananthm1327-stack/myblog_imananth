import { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import { sanitize } from '../lib/sanitize.js'

// A minimal contentEditable rich-text editor with a toolbar, plus two
// escape hatches for people who'd rather write raw markup: an "HTML"
// source view (same underlying value, just edited as text), and a
// "Markdown" import panel that converts pasted/typed markdown to HTML
// and drops it into the field. Everything ultimately becomes the same
// HTML string — sanitize() at render time is what keeps it safe,
// regardless of which mode produced it.

// Shift markdown headings down one level (# -> h2, ## -> h3, ...) so a
// pasted "# Title" can't produce a second <h1> on the page — the post's
// own title is already the page's h1. Matches the toolbar, which only
// offers H2/H3 for the same reason.
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const level = Math.min(depth + 1, 6)
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`
    }
  }
})

const INLINE_ACTIONS = [
  { cmd: 'bold',           label: 'B',  title: 'Bold (Ctrl+B)',       style: { fontWeight: 700 } },
  { cmd: 'italic',         label: 'I',  title: 'Italic (Ctrl+I)',     style: { fontStyle: 'italic' } },
  { cmd: 'underline',      label: 'U',  title: 'Underline (Ctrl+U)',  style: { textDecoration: 'underline' } },
  { cmd: 'strikeThrough',  label: 'S',  title: 'Strikethrough',       style: { textDecoration: 'line-through' } }
]

const BLOCK_ACTIONS = [
  { cmd: 'formatBlock', arg: 'H2',         label: 'H2',   title: 'Heading 2' },
  { cmd: 'formatBlock', arg: 'H3',         label: 'H3',   title: 'Heading 3' },
  { cmd: 'formatBlock', arg: 'BLOCKQUOTE', label: '"',    title: 'Blockquote' },
  { cmd: 'formatBlock', arg: 'P',          label: 'P',    title: 'Paragraph' },
  { cmd: 'insertUnorderedList', label: '• List', title: 'Bulleted list' },
  { cmd: 'insertOrderedList',   label: '1. List', title: 'Numbered list' }
]

function exec(cmd, arg) {
  document.execCommand(cmd, false, arg)
}

export default function RichText({ value, onChange, placeholder, singleLine = false, minHeight = 160 }) {
  const editorRef = useRef(null)
  const [mode, setMode] = useState('write') // 'write' | 'html'
  const [showMdPanel, setShowMdPanel] = useState(false)
  const [mdDraft, setMdDraft] = useState('')

  // Keep the DOM in sync when the parent resets/loads a value.
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== (value || '')) el.innerHTML = value || ''
  }, [value, mode])

  const handleInput = () => {
    const html = editorRef.current.innerHTML
    onChange(html)
  }

  const runCmd = (cmd, arg) => {
    editorRef.current.focus()
    exec(cmd, arg)
    handleInput()
  }

  const insertLink = () => {
    const url = prompt('Enter URL (https://…)')
    if (!url) return
    editorRef.current.focus()
    exec('createLink', url)
    handleInput()
  }

  const clearFormat = () => {
    editorRef.current.focus()
    exec('removeFormat')
    exec('formatBlock', 'P')
    handleInput()
  }

  const onKeyDown = (e) => {
    if (singleLine && e.key === 'Enter') { e.preventDefault(); return }
    // Handle default Ctrl+B/I/U — browser does it already, but ensure input fires.
    if ((e.ctrlKey || e.metaKey) && ['b','i','u'].includes(e.key.toLowerCase())) {
      setTimeout(handleInput, 0)
    }
  }

  const onPaste = (e) => {
    // HTML pasted from another page/editor is sanitized and kept as
    // formatting; anything else falls back to plain text (so Word/Google
    // Docs junk doesn't come in) — either way it goes through sanitize()
    // again at render time.
    e.preventDefault()
    const htmlData = e.clipboardData.getData('text/html')
    if (htmlData && htmlData.trim()) {
      document.execCommand('insertHTML', false, sanitize(htmlData))
    } else {
      const text = e.clipboardData.getData('text/plain')
      document.execCommand('insertText', false, text)
    }
  }

  const insertMarkdown = () => {
    const html = sanitize(marked.parse(mdDraft || ''))
    onChange(html)
    setShowMdPanel(false)
    setMdDraft('')
    setMode('write')
  }

  return (
    <div className={`rt ${singleLine ? 'rt-single' : ''}`}>
      <div className="rt-toolbar" role="toolbar" aria-label="Text formatting">
        {mode === 'write' && INLINE_ACTIONS.map(a => (
          <button key={a.cmd} type="button" className="rt-btn" title={a.title}
            style={a.style} onMouseDown={(e) => { e.preventDefault(); runCmd(a.cmd) }}>
            {a.label}
          </button>
        ))}
        {mode === 'write' && !singleLine && <span className="rt-sep" />}
        {mode === 'write' && !singleLine && BLOCK_ACTIONS.map(a => (
          <button key={a.label} type="button" className="rt-btn" title={a.title}
            onMouseDown={(e) => { e.preventDefault(); runCmd(a.cmd, a.arg) }}>
            {a.label}
          </button>
        ))}
        {mode === 'write' && <span className="rt-sep" />}
        {mode === 'write' && (
          <>
            <button type="button" className="rt-btn" title="Insert link"
              onMouseDown={(e) => { e.preventDefault(); insertLink() }}>Link</button>
            <button type="button" className="rt-btn" title="Clear formatting"
              onMouseDown={(e) => { e.preventDefault(); clearFormat() }}>&times;</button>
          </>
        )}

        {!singleLine && (
          <>
            <span className="rt-sep" />
            <button
              type="button"
              className={`rt-btn rt-mode-btn ${mode === 'html' ? 'active' : ''}`}
              title={mode === 'html' ? 'Switch to the visual editor' : 'Edit raw HTML source'}
              onMouseDown={(e) => { e.preventDefault(); setMode(m => m === 'html' ? 'write' : 'html') }}
            >
              &lt;/&gt; HTML
            </button>
            <button
              type="button"
              className={`rt-btn rt-mode-btn ${showMdPanel ? 'active' : ''}`}
              title="Paste or write Markdown and convert it into the post"
              onMouseDown={(e) => { e.preventDefault(); setShowMdPanel(s => !s) }}
            >
              Markdown
            </button>
          </>
        )}
      </div>

      {showMdPanel && (
        <div className="rt-md-panel">
          <textarea
            className="rt-md-input"
            placeholder={'# Heading\n\n**bold**, _italic_, [a link](https://example.com)\n\n- a list item\n- another one'}
            value={mdDraft}
            onChange={(e) => setMdDraft(e.target.value)}
            rows={8}
          />
          <div className="rt-md-actions">
            <span className="rt-md-hint">Converts to HTML and replaces the content above.</span>
            <button type="button" className="rt-btn" onClick={() => { setShowMdPanel(false); setMdDraft('') }}>Cancel</button>
            <button type="button" className="rt-btn rt-md-insert" onClick={insertMarkdown} disabled={!mdDraft.trim()}>
              Convert &amp; insert
            </button>
          </div>
        </div>
      )}

      {mode === 'html' ? (
        <textarea
          className="rt-html"
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={{ minHeight: singleLine ? 'auto' : minHeight }}
        />
      ) : (
        <div
          ref={editorRef}
          className="rt-editor"
          contentEditable
          role="textbox"
          aria-multiline={!singleLine}
          data-placeholder={placeholder}
          style={{ minHeight: singleLine ? 'auto' : minHeight }}
          onInput={handleInput}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          suppressContentEditableWarning
        />
      )}
    </div>
  )
}
