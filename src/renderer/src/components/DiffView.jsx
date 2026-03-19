import React, { useState } from 'react'
import { DiffEditor } from '@monaco-editor/react'

export default function DiffView({ problem, userCode, initialSolutionIndex = 0, onClose }) {
  const [solutionIndex, setSolutionIndex] = useState(initialSolutionIndex)

  const sorted = [...(problem.solutions || [])].sort((a, b) => {
    const order = { obvious: 0, brute_force: 0, optimal: 1 }
    return (order[a.approach] ?? 2) - (order[b.approach] ?? 2)
  })

  const solution = sorted[solutionIndex] || sorted[0]
  if (!solution) return null

  const userLines = (userCode || '').split('\n').filter(l => l.trim()).length
  const solLines = (solution.code || '').split('\n').filter(l => l.trim()).length

  function handleBeforeMount(monaco) {
    monaco.editor.defineTheme('monk-diff', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'diffEditor.insertedTextBackground': '#22c55e1a',
        'diffEditor.removedTextBackground': '#f472b61a',
        'diffEditor.insertedLineBackground': '#22c55e0d',
        'diffEditor.removedLineBackground': '#f472b60d',
        'diffEditorGutter.insertedLineBackground': '#22c55e20',
        'diffEditorGutter.removedLineBackground': '#f472b620',
      }
    })
  }

  return (
    <div data-testid="diff-view" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0,
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Compare</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your code vs</span>

        {sorted.length > 1 ? (
          <select
            value={solutionIndex}
            onChange={e => setSolutionIndex(Number(e.target.value))}
            style={{
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', borderRadius: 4, padding: '3px 8px',
              fontSize: 12, cursor: 'pointer'
            }}
          >
            {sorted.map((sol, i) => (
              <option key={i} value={i}>{sol.label}</option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{solution.label}</span>
        )}

        <div style={{ flex: 1 }} />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)', alignItems: 'center' }}>
          <span>
            Lines:{' '}
            <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{userLines}</span>
            <span style={{ margin: '0 3px' }}>vs</span>
            <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{solLines}</span>
          </span>
          {solution.timeComplexity && (
            <span>
              Time:{' '}
              <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{solution.timeComplexity}</span>
            </span>
          )}
          {solution.spaceComplexity && (
            <span>
              Space:{' '}
              <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{solution.spaceComplexity}</span>
            </span>
          )}
        </div>

        <button
          data-testid="btn-close-diff"
          onClick={onClose}
          style={{
            padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)',
            background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 12, marginLeft: 4
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Column labels */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        padding: '5px 14px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0
      }}>
        <span>Your Solution</span>
        <span style={{ paddingLeft: 14 }}>Reference: {solution.label}</span>
      </div>

      {/* Diff editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <DiffEditor
          height="100%"
          language="python"
          original={userCode || ''}
          modified={solution.code || ''}
          theme="monk-diff"
          beforeMount={handleBeforeMount}
          options={{
            readOnly: true,
            fontSize: 14,
            fontFamily: "'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 4,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            renderSideBySide: true,
            ignoreTrimWhitespace: false,
            overviewRulerLanes: 0,
          }}
        />
      </div>
    </div>
  )
}
