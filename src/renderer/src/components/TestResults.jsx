import React, { useState } from 'react'

export default function TestResults({ results, running, mode, problem }) {
  const [activeCase, setActiveCase] = useState(0)

  if (running) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-secondary)', color: 'var(--text-muted)', gap: 10, fontSize: 14
      }}>
        <PulsingDot />
        Executing…
      </div>
    )
  }

  if (!results) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)',
        color: 'var(--text-muted)', gap: 8
      }}>
        <div style={{ fontSize: 28 }}>▶</div>
        <div style={{ fontSize: 13 }}>Run or submit your code to see results</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cmd+Enter to run · Cmd+Shift+Enter to submit</div>
      </div>
    )
  }

  if (results.error && (!results.results || results.results.length === 0)) {
    return (
      <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg-secondary)', padding: 14 }}>
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: 12
        }}>
          <div style={{ color: 'var(--accent-red)', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
            Execution Error
          </div>
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, color: '#fca5a5',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0
          }}>
            {results.error}
          </pre>
        </div>
      </div>
    )
  }

  const cases = results.results || []
  const passed = cases.filter(r => r.passed).length
  const total = cases.length
  const allPassed = passed === total && total > 0
  const isSubmit = mode === 'submit'

  if (cases.length === 0) {
    return (
      <div style={{ height: '100%', background: 'var(--bg-secondary)', padding: 14, color: 'var(--text-muted)', fontSize: 13 }}>
        No test results.
      </div>
    )
  }

  const activeResult = cases[activeCase] || cases[0]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
      {/* Summary bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        borderBottom: '1px solid var(--border)', flexShrink: 0
      }}>
        <div style={{
          fontSize: 14, fontWeight: 700,
          color: allPassed ? 'var(--accent-green)' : 'var(--accent-red)'
        }}>
          {allPassed
            ? (isSubmit ? '✓ Accepted' : '✓ All examples passed')
            : `✗ ${passed}/${total} passed`}
        </div>
        {isSubmit && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {allPassed ? `${total} test cases` : `${total - passed} failing`}
          </div>
        )}
        {results.stderr && (
          <div style={{ fontSize: 11, color: 'var(--accent-yellow)', marginLeft: 'auto' }}>
            ⚠ stderr output
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Case selector */}
        <div style={{
          width: 100, flexShrink: 0, borderRight: '1px solid var(--border)',
          overflow: 'auto', padding: '8px 4px'
        }}>
          {cases.map((c, i) => (
            <div
              key={i}
              onClick={() => setActiveCase(i)}
              style={{
                padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                background: activeCase === i ? 'var(--bg-active)' : 'transparent',
                fontSize: 12
              }}
            >
              <span style={{ color: c.passed ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 10 }}>
                {c.passed ? '●' : '●'}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                Case {i + 1}
              </span>
            </div>
          ))}
        </div>

        {/* Case detail */}
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {activeResult && <CaseDetail result={activeResult} />}
        </div>
      </div>
    </div>
  )
}

function CaseDetail({ result }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
      <StatusBadge passed={result.passed} runtimeMs={result.runtime_ms} />

      <ResultRow label="Input" value={formatInput(result.input)} mono />
      <ResultRow label="Expected" value={JSON.stringify(result.expected)} mono
        color="var(--accent-green)" />
      {result.actual !== null && result.actual !== undefined && (
        <ResultRow label="Output" value={JSON.stringify(result.actual)} mono
          color={result.passed ? 'var(--accent-green)' : 'var(--accent-red)'} />
      )}

      {result.stdout && (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>stdout</div>
          <pre style={{
            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '8px 10px', fontFamily: 'var(--font-mono)',
            fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-secondary)', margin: 0
          }}>
            {result.stdout}
          </pre>
        </div>
      )}

      {result.error && (
        <div>
          <div style={{ color: 'var(--accent-red)', fontSize: 11, marginBottom: 4 }}>Error / Traceback</div>
          <pre style={{
            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 6, padding: '8px 10px', fontFamily: 'var(--font-mono)',
            fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#fca5a5', margin: 0
          }}>
            {result.error}
          </pre>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ passed, runtimeMs }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: passed ? 'var(--accent-green)' : 'var(--accent-red)'
      }}>
        {passed ? '✓ Passed' : '✗ Failed'}
      </span>
      {runtimeMs !== null && runtimeMs !== undefined && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {runtimeMs} ms
        </span>
      )}
    </div>
  )
}

function ResultRow({ label, value, mono, color }) {
  return (
    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 3 }}>{label}</div>
      <div style={{
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        fontSize: mono ? 12 : 13, color: color || 'var(--text-primary)',
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        borderRadius: 6, padding: '6px 10px'
      }}>
        {value}
      </div>
    </div>
  )
}

function formatInput(input) {
  if (!input || typeof input !== 'object') return String(input)
  return Object.entries(input)
    .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
    .join(', ')
}

function PulsingDot() {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)',
      animation: 'pulse 1s infinite'
    }}>
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
    </div>
  )
}
