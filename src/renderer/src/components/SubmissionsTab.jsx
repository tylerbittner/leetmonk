import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function SubmissionsTab({ submissions = [] }) {
  const [expanded, setExpanded] = useState(null)

  if (submissions.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 8 }}>
        No submissions yet. Hit <strong style={{ color: 'var(--text-secondary)' }}>Submit</strong> to record your first attempt.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {submissions.map((sub, i) => {
        const isOpen = expanded === i
        const statusColor = sub.accepted
          ? 'var(--accent-green)'
          : sub.executionError
          ? 'var(--accent-red)'
          : sub.mode === 'run'
          ? 'var(--accent-blue)'
          : 'var(--accent-red)'

        const statusLabel = sub.accepted
          ? 'Accepted'
          : sub.executionError
          ? 'Error'
          : sub.mode === 'run'
          ? `Run ${sub.passed}/${sub.total}`
          : `Wrong Answer ${sub.passed}/${sub.total}`

        return (
          <div
            key={sub.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg-secondary)',
              overflow: 'hidden',
            }}
          >
            {/* Row */}
            <div
              onClick={() => setExpanded(isOpen ? null : i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', cursor: 'pointer',
                background: isOpen ? 'var(--bg-tertiary)' : 'transparent',
              }}
            >
              {/* Status dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: statusColor,
              }} />

              {/* Status label */}
              <span style={{ fontSize: 13, fontWeight: 600, color: statusColor, minWidth: 110 }}>
                {statusLabel}
              </span>

              {/* Mode badge */}
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
                background: sub.mode === 'submit' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)',
                color: sub.mode === 'submit' ? 'var(--accent-purple)' : 'var(--accent-blue)',
                border: `1px solid ${sub.mode === 'submit' ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)'}`,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {sub.mode}
              </span>

              <span style={{ flex: 1 }} />

              {/* Timestamp */}
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {formatRelative(sub.timestamp)}
              </span>

              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {isOpen ? '▲' : '▼'}
              </span>
            </div>

            {/* Expanded code view */}
            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '0 12px 12px' }}>
                {sub.executionError && (
                  <div style={{
                    marginTop: 10,
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 6, padding: '8px 10px',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--accent-red)', marginBottom: 4, fontWeight: 600 }}>Error</div>
                    <pre style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fca5a5',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                    }}>
                      {sub.executionError}
                    </pre>
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Code submitted
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language="python"
                  customStyle={{
                    margin: 0, borderRadius: 6, fontSize: 12,
                    border: '1px solid var(--border)', maxHeight: 320, overflow: 'auto',
                  }}
                >
                  {sub.code || '# (no code recorded)'}
                </SyntaxHighlighter>
                {/* Restore button */}
                <button
                  className="btn btn-ghost"
                  style={{ marginTop: 8, fontSize: 12 }}
                  onClick={() => {
                    navigator.clipboard.writeText(sub.code || '')
                  }}
                >
                  Copy code
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatRelative(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
