import React, { useState } from 'react'

export default function HintsTab({ hints = [] }) {
  const [revealed, setRevealed] = useState(0)

  if (hints.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hints available.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>
        Hints are revealed one at a time. Try to solve it first!
      </p>

      {hints.slice(0, revealed).map((hint, i) => (
        <div key={i} style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 14px'
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
            HINT {i + 1}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{hint}</div>
        </div>
      ))}

      {revealed < hints.length && (
        <button
          className="btn btn-ghost"
          onClick={() => setRevealed(r => r + 1)}
          style={{ alignSelf: 'flex-start' }}
        >
          {revealed === 0 ? '💡 Reveal first hint' : `💡 Reveal hint ${revealed + 1}`}
        </button>
      )}

      {revealed === hints.length && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          All hints revealed. Check Solutions tab if still stuck.
        </div>
      )}
    </div>
  )
}
