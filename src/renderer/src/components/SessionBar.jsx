import React, { useState, useEffect } from 'react'

export default function SessionBar({ session, problems, onNext, onEnd, onNavigate }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!session) return
    const start = new Date(session.startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session?.startedAt])

  if (!session) return null

  const done = Object.keys(session.results).length
  const total = session.problems.length
  const currentId = session.problems[session.currentIndex]
  const currentProblem = problems.find(p => p.id === currentId)
  const pct = total > 0 ? (done / total) * 100 : 0

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`

  const overTime = session.timeTarget > 0 && elapsed > session.timeTarget * 60

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
      height: 36, background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)',
      fontSize: 13, flexShrink: 0
    }}>
      {/* Progress bar */}
      <div style={{
        width: 80, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden'
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: 'var(--accent-green)',
          transition: 'width 0.3s'
        }} />
      </div>

      <span style={{ color: 'var(--text-primary)' }}>
        Problem {session.currentIndex + 1}/{total}
      </span>

      {currentProblem && (
        <span style={{ color: 'var(--text-muted)' }}>{currentProblem.title}</span>
      )}

      <span style={{ color: overTime ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
        {timeStr} elapsed
        {session.timeTarget > 0 && ` / ${session.timeTarget}min`}
      </span>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {session.currentIndex < total - 1 || !session.results[currentId] ? (
          <button onClick={onNext} style={{
            padding: '4px 12px', borderRadius: 4, border: '1px solid var(--border)',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            cursor: 'pointer', fontSize: 12
          }}>
            {session.results[currentId] ? 'Next Problem' : 'Skip'}
          </button>
        ) : null}
        <button onClick={onEnd} style={{
          padding: '4px 12px', borderRadius: 4, border: '1px solid var(--accent-red)',
          background: 'transparent', color: 'var(--accent-red)',
          cursor: 'pointer', fontSize: 12
        }}>
          End Session
        </button>
      </div>
    </div>
  )
}
