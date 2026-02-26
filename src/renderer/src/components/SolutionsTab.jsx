import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function SolutionsTab({ solutions = [] }) {
  const [expanded, setExpanded] = useState({ 0: true })

  if (solutions.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No solutions available.</div>
  }

  // Sort: obvious/brute force first, then optimal
  const sorted = [...solutions].sort((a, b) => {
    const order = { obvious: 0, brute_force: 0, optimal: 1 }
    return (order[a.approach] ?? 2) - (order[b.approach] ?? 2)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sorted.map((sol, i) => (
        <div key={i} style={{
          border: '1px solid var(--border)', borderRadius: 8,
          background: 'var(--bg-secondary)', overflow: 'hidden'
        }}>
          {/* Header */}
          <div
            onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', cursor: 'pointer',
              background: expanded[i] ? 'var(--bg-tertiary)' : 'transparent',
              transition: 'background 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {sol.label}
              </span>
              {sol.approach === 'optimal' && (
                <span style={{
                  fontSize: 10, padding: '1px 7px', borderRadius: 10,
                  background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)',
                  border: '1px solid rgba(34,197,94,0.3)', fontWeight: 600
                }}>
                  OPTIMAL
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ComplexityBadge label="Time" value={sol.timeComplexity} />
              <ComplexityBadge label="Space" value={sol.spaceComplexity} />
              <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                {expanded[i] ? '▲' : '▼'}
              </span>
            </div>
          </div>

          {expanded[i] && (
            <div style={{ padding: '0 14px 14px' }}>
              <SyntaxHighlighter
                style={vscDarkPlus}
                language="python"
                customStyle={{
                  marginTop: 10, marginBottom: 12,
                  borderRadius: 6, fontSize: 13,
                  border: '1px solid var(--border)'
                }}
              >
                {sol.code}
              </SyntaxHighlighter>

              {sol.explanation && (
                <div className="markdown" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <ReactMarkdown>{sol.explanation}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ComplexityBadge({ label, value }) {
  return (
    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
      <span>{label}: </span>
      <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  )
}
