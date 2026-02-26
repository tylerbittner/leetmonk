import React, { useState, useEffect, useRef, useCallback } from 'react'

export default function Timer({ problemId }) {
  const [elapsed, setElapsed] = useState(0)  // seconds
  const [running, setRunning] = useState(false)
  const [target, setTarget] = useState(0)  // 0 = no target
  const [showSettings, setShowSettings] = useState(false)
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const savedElapsedRef = useRef(0)
  const timerStateRef = useRef({})

  // Load timer state for this problem
  useEffect(() => {
    async function load() {
      const state = await window.api.getTimerState()
      timerStateRef.current = state
      const ps = state[problemId] || {}
      savedElapsedRef.current = ps.elapsed || 0
      setElapsed(ps.elapsed || 0)
      setTarget(ps.target || 0)
      setRunning(false)
    }
    load()
    return () => {
      stopTimer()
    }
  }, [problemId])

  // Save timer state periodically
  const saveState = useCallback((elapsedSecs, isRunning, targetSecs) => {
    const current = timerStateRef.current
    const updated = {
      ...current,
      [problemId]: { elapsed: elapsedSecs, target: targetSecs, lastSaved: Date.now() }
    }
    timerStateRef.current = updated
    window.api.setTimerState(updated)
  }, [problemId])

  function startTimer() {
    if (running) return
    startTimeRef.current = Date.now() - savedElapsedRef.current * 1000
    intervalRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsed(secs)
      savedElapsedRef.current = secs
    }, 500)
    setRunning(true)
  }

  function stopTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRunning(false)
    saveState(savedElapsedRef.current, false, target)
  }

  function resetTimer() {
    stopTimer()
    savedElapsedRef.current = 0
    setElapsed(0)
    saveState(0, false, target)
  }

  function toggleTimer() {
    if (running) stopTimer()
    else startTimer()
  }

  const exceeded = target > 0 && elapsed > target * 60
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
      {/* Time display */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, letterSpacing: '0.08em',
        color: exceeded ? 'var(--accent-red)' : running ? 'var(--text-primary)' : 'var(--text-muted)',
        minWidth: 54, textAlign: 'center',
      }}>
        {mm}:{ss}
      </div>

      {/* Start / Pause button — explicit label */}
      <button
        className="btn btn-ghost"
        onClick={toggleTimer}
        style={{
          fontSize: 12, padding: '5px 10px', gap: 5,
          color: running ? 'var(--accent-yellow)' : 'var(--accent-green)',
          borderColor: running ? 'rgba(234,179,8,0.4)' : 'rgba(34,197,94,0.4)',
          fontWeight: 600,
        }}
      >
        {running ? '⏸ Pause' : '▶ Start'}
      </button>

      {/* Reset */}
      <button
        className="btn btn-ghost"
        onClick={resetTimer}
        title="Reset timer to 0:00"
        style={{ fontSize: 12, padding: '5px 8px' }}
      >
        ↺
      </button>

      {/* Target time settings */}
      <button
        className="btn btn-ghost"
        onClick={() => setShowSettings(s => !s)}
        title="Set target time"
        style={{ fontSize: 11, padding: '5px 8px', color: target > 0 ? 'var(--accent-blue)' : 'var(--text-muted)' }}
      >
        {target > 0 ? `${target}m` : 'Target'}
      </button>

      {showSettings && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowSettings(false)} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, zIndex: 100, marginTop: 6,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 10, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Target time
            </div>
            {[0, 15, 20, 25, 30, 45].map(mins => (
              <div
                key={mins}
                onClick={() => {
                  setTarget(mins)
                  saveState(elapsed, running, mins)
                  setShowSettings(false)
                }}
                style={{
                  padding: '6px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 13,
                  color: target === mins ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  background: target === mins ? 'rgba(59,130,246,0.12)' : 'transparent',
                  fontWeight: target === mins ? 600 : 400,
                }}
              >
                {mins === 0 ? 'No target' : `${mins} minutes`}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
