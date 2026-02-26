import React from 'react'

const difficultyColor = { easy: 'var(--easy)', medium: 'var(--medium)', hard: 'var(--hard)' }

export default function ProblemList({ problems, activeProblemId, progress, onSelect }) {
  return (
    <div style={{ overflow: 'auto', flex: 1 }}>
      <div style={{ padding: '8px 0' }}>
        {problems.length === 0 && (
          <div style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            No problems match filters
          </div>
        )}
        {problems.map(p => {
          const status = progress[p.id]?.status || 'unsolved'
          const isActive = p.id === activeProblemId

          return (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', cursor: 'pointer',
                background: isActive ? 'var(--bg-active)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                transition: 'background 0.1s'
              }}
              onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
            >
              {/* Status dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: status === 'solved' ? 'var(--accent-green)'
                  : status === 'attempted' ? 'var(--accent-yellow)'
                  : 'var(--bg-hover)',
                border: status === 'unsolved' ? '1.5px solid var(--border-light)' : 'none'
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  fontWeight: isActive ? 500 : 400
                }}>
                  {p.title}
                </div>
              </div>

              <div style={{
                fontSize: 10, fontWeight: 600, flexShrink: 0,
                color: difficultyColor[p.difficulty] || 'var(--text-muted)',
                textTransform: 'capitalize'
              }}>
                {p.difficulty[0].toUpperCase()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
