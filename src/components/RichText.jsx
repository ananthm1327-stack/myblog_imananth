import { useEffect, useRef } from 'react'

// A minimal contentEditable rich-text editor with a toolbar.
// Uses document.execCommand under the hood — deprecated in the spec but
// still supported everywhere and perfect for a single-author blog.

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

  // Keep the DOM in sync when the parent resets/loads a value.
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== (value || '')) el.innerHTML = value || ''
  }, [value])

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
    // Force plain text on paste so nothing ugly comes in from Word/Google Docs.
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  return (
    <div className={`rt ${singleLine ? 'rt-single' : ''}`}>
      <div className="rt-toolbar" role="toolbar" aria-label="Text formatting">
        {INLINE_ACTIONS.map(a => (
          <button key={a.cmd} type="button" className="rt-btn" title={a.title}
            style={a.style} onMouseDown={(e) => { e.preventDefault(); runCmd(a.cmd) }}>
            {a.label}
          </button>
        ))}
        {!singleLine && <span className="rt-sep" />}
        {!singleLine && BLOCK_ACTIONS.map(a => (
          <button key={a.label} type="button" className="rt-btn" title={a.title}
            onMouseDown={(e) => { e.preventDefault(); runCmd(a.cmd, a.arg) }}>
            {a.label}
          </button>
        ))}
        <span className="rt-sep" />
        <button type="button" className="rt-btn" title="Insert link"
          onMouseDown={(e) => { e.preventDefault(); insertLink() }}>Link</button>
        <button type="button" className="rt-btn" title="Clear formatting"
          onMouseDown={(e) => { e.preventDefault(); clearFormat() }}>&times;</button>
      </div>
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
    </div>
  )
}
