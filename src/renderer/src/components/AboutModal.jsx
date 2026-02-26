import React from 'react'

export default function AboutModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '32px 40px', maxWidth: 420, width: '90%',
          textAlign: 'center', color: 'var(--text-primary)'
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 4 }}>
          LeetMonk
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Offline algorithm practice
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 20 }}>
          35 hand-curated problems across arrays, strings, binary search, sliding window,
          two pointers, stack, heap, dynamic programming, and backtracking.
        </div>

        <div style={{ fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: 'var(--text-muted)' }}>Created by </span>
          <a
            href="https://github.com/tylerbittner"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}
          >
            @tylerbittner
          </a>
        </div>

        <div style={{ fontSize: 13, marginBottom: 20 }}>
          <a
            href="https://github.com/tylerbittner/leetmonk"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}
          >
            github.com/tylerbittner/leetmonk
          </a>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>
          Apache 2.0 License
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '6px 24px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
