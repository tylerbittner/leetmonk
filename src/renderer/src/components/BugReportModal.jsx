import React, { useState, useEffect, useRef } from 'react'

export default function BugReportModal({ onClose, activeProblemId }) {
  const [description, setDescription] = useState('')
  const [visible, setVisible] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true))
    setTimeout(() => textareaRef.current?.focus(), 150)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  function handleReport() {
    const appVersion = '1.0.3'
    const os = navigator.userAgentData?.platform || navigator.platform || 'Unknown'

    const contextBlock = [
      '### Context',
      '```',
      `App version: v${appVersion}`,
      `Problem: ${activeProblemId || 'none'}`,
      `Language: Python 3`,
      `OS: ${os}`,
      '```',
    ].join('\n')

    const body = description.trim()
      ? `${description.trim()}\n\n${contextBlock}`
      : contextBlock

    const title = description.trim()
      ? description.trim().split('\n')[0].slice(0, 72)
      : ''

    const params = new URLSearchParams({
      labels: 'bug',
      body,
    })
    if (title) params.set('title', title)

    const url = `https://github.com/tylerbittner/leetmonk/issues/new?${params.toString()}`
    window.api.openExternal(url)
    handleClose()
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '28px 32px', maxWidth: 480, width: '90%',
          color: 'var(--text-primary)',
          transform: visible ? 'scale(1)' : 'scale(0.94)',
          transition: 'transform 0.2s ease, opacity 0.2s ease',
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            🐛 Found a bug?
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Thanks for taking a moment — bug reports really do help. A good one usually includes:
          </div>
        </div>

        {/* Checklist */}
        <ul style={{
          margin: '0 0 20px', padding: 0, listStyle: 'none',
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
        }}>
          {[
            'What you expected to happen',
            'What actually happened',
            'Steps to reproduce (if you remember them)',
          ].map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600, flexShrink: 0 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe what happened… (optional, but appreciated 🙏)"
          rows={5}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '10px 12px', fontSize: 13,
            color: 'var(--text-primary)', resize: 'vertical', lineHeight: 1.5,
            outline: 'none', marginBottom: 8,
            fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />

        {/* Auto-collected context note */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>
          We'll automatically include: problem ID, app version, and OS.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '7px 18px', borderRadius: 6,
              border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleReport}
            style={{
              padding: '7px 18px', borderRadius: 6,
              border: 'none', background: 'var(--accent-blue)',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            Report on GitHub →
          </button>
        </div>
      </div>
    </div>
  )
}
