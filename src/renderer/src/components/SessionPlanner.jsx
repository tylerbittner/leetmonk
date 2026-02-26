import React, { useState, useMemo } from 'react'

const PROBLEM_COUNTS = [3, 5, 8]
const TIME_TARGETS = [30, 45, 60, 90]

export default function SessionPlanner({ problems, progress, onStart, onClose }) {
  const [problemCount, setProblemCount] = useState(5)
  const [customCount, setCustomCount] = useState('')
  const [useCustomCount, setUseCustomCount] = useState(false)
  const [timeTarget, setTimeTarget] = useState(45)
  const [noTimeLimit, setNoTimeLimit] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState([])
  const [selectedDifficulties, setSelectedDifficulties] = useState(['easy', 'medium', 'hard'])
  const [selectedProblems, setSelectedProblems] = useState(null) // null = not yet generated

  const allTags = useMemo(() => [...new Set(problems.flatMap(p => p.tags))].sort(), [problems])

  const effectiveCount = useCustomCount ? (parseInt(customCount) || 1) : problemCount

  function matchesFilters(p) {
    if (!selectedDifficulties.includes(p.difficulty)) return false
    if (selectedTopics.length > 0 && !selectedTopics.some(t => p.tags.includes(t))) return false
    return true
  }

  function generateProblems() {
    const matching = problems.filter(matchesFilters)

    // Sort: unsolved/attempted first, then solved
    const unsolved = matching.filter(p => progress[p.id]?.status !== 'solved')
    const solved = matching.filter(p => progress[p.id]?.status === 'solved')

    // Shuffle each group
    const shuffle = arr => {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
      }
      return a
    }

    const pool = [...shuffle(unsolved), ...shuffle(solved)]
    const picked = pool.slice(0, effectiveCount).map(p => p.id)
    setSelectedProblems(picked)
  }

  function removeProblem(id) {
    setSelectedProblems(prev => prev.filter(x => x !== id))
  }

  function swapProblem(id) {
    const currentIds = new Set(selectedProblems)
    const matching = problems.filter(matchesFilters).filter(p => !currentIds.has(p.id))
    if (matching.length === 0) return
    const replacement = matching[Math.floor(Math.random() * matching.length)]
    setSelectedProblems(prev => prev.map(x => x === id ? replacement.id : x))
  }

  function handleStart() {
    if (!selectedProblems || selectedProblems.length === 0) return
    onStart({
      id: Date.now(),
      problems: selectedProblems,
      currentIndex: 0,
      timeTarget: noTimeLimit ? 0 : timeTarget,
      startedAt: new Date().toISOString(),
      completedAt: null,
      results: {}
    })
  }

  const toggleDifficulty = (d) => {
    setSelectedDifficulties(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
    setSelectedProblems(null)
  }

  const toggleTopic = (t) => {
    setSelectedTopics(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    )
    setSelectedProblems(null)
  }

  const diffColors = { easy: 'var(--easy)', medium: 'var(--medium)', hard: 'var(--hard)' }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 8, width: 520, maxHeight: '80vh', overflow: 'auto',
        padding: 24, display: 'flex', flexDirection: 'column', gap: 20
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600, margin: 0 }}>Plan Session</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 20, cursor: 'pointer', padding: '0 4px'
          }}>x</button>
        </div>

        {/* Problem count */}
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8, display: 'block' }}>
            Number of problems
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PROBLEM_COUNTS.map(n => (
              <button key={n} onClick={() => { setProblemCount(n); setUseCustomCount(false); setSelectedProblems(null) }}
                style={{
                  padding: '6px 16px', borderRadius: 4, border: '1px solid var(--border)',
                  background: !useCustomCount && problemCount === n ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13
                }}>{n}</button>
            ))}
            <input type="number" min="1" max="50" placeholder="Custom"
              value={customCount}
              onChange={e => { setCustomCount(e.target.value); setUseCustomCount(true); setSelectedProblems(null) }}
              onFocus={() => setUseCustomCount(true)}
              style={{
                width: 80, padding: '6px 10px', borderRadius: 4,
                border: `1px solid ${useCustomCount ? 'var(--accent-blue)' : 'var(--border)'}`,
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13
              }} />
          </div>
        </div>

        {/* Time target */}
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8, display: 'block' }}>
            Time target (minutes)
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TIME_TARGETS.map(t => (
              <button key={t} onClick={() => { setTimeTarget(t); setNoTimeLimit(false) }}
                style={{
                  padding: '6px 16px', borderRadius: 4, border: '1px solid var(--border)',
                  background: !noTimeLimit && timeTarget === t ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13
                }}>{t}</button>
            ))}
            <button onClick={() => setNoTimeLimit(!noTimeLimit)}
              style={{
                padding: '6px 16px', borderRadius: 4, border: '1px solid var(--border)',
                background: noTimeLimit ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13
              }}>No limit</button>
          </div>
        </div>

        {/* Difficulty filter */}
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8, display: 'block' }}>
            Difficulty
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['easy', 'medium', 'hard'].map(d => (
              <button key={d} onClick={() => toggleDifficulty(d)}
                style={{
                  padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13,
                  border: `1px solid ${selectedDifficulties.includes(d) ? diffColors[d] : 'var(--border)'}`,
                  background: selectedDifficulties.includes(d) ? diffColors[d] + '22' : 'var(--bg-tertiary)',
                  color: selectedDifficulties.includes(d) ? diffColors[d] : 'var(--text-muted)',
                  textTransform: 'capitalize'
                }}>{d}</button>
            ))}
          </div>
        </div>

        {/* Topic filter */}
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8, display: 'block' }}>
            Topics {selectedTopics.length > 0 ? `(${selectedTopics.length} selected)` : '(all)'}
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 80, overflow: 'auto' }}>
            {allTags.map(t => (
              <button key={t} onClick={() => toggleTopic(t)}
                style={{
                  padding: '3px 10px', borderRadius: 3, cursor: 'pointer', fontSize: 11,
                  border: `1px solid ${selectedTopics.includes(t) ? 'var(--accent-blue)' : 'var(--border)'}`,
                  background: selectedTopics.includes(t) ? 'var(--accent-blue)' + '33' : 'var(--bg-tertiary)',
                  color: selectedTopics.includes(t) ? 'var(--accent-blue)' : 'var(--text-muted)'
                }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Generate / Problem list */}
        <div>
          <button onClick={generateProblems} style={{
            padding: '8px 20px', borderRadius: 4, border: '1px solid var(--border)',
            background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
            cursor: 'pointer', fontSize: 13, marginBottom: 10
          }}>
            {selectedProblems ? 'Re-shuffle' : 'Generate problem list'}
          </button>

          {selectedProblems && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {selectedProblems.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  No problems match your filters.
                </div>
              )}
              {selectedProblems.map((id, i) => {
                const p = problems.find(x => x.id === id)
                if (!p) return null
                return (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                    background: 'var(--bg-tertiary)', borderRadius: 4, fontSize: 13
                  }}>
                    <span style={{ color: 'var(--text-muted)', width: 20 }}>{i + 1}.</span>
                    <span style={{ color: diffColors[p.difficulty], fontSize: 11, width: 8 }}>
                      {p.difficulty === 'easy' ? 'E' : p.difficulty === 'medium' ? 'M' : 'H'}
                    </span>
                    <span style={{ color: 'var(--text-primary)', flex: 1 }}>{p.title}</span>
                    <button onClick={() => swapProblem(id)} title="Swap" style={{
                      background: 'none', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', fontSize: 12, padding: '2px 6px'
                    }}>swap</button>
                    <button onClick={() => removeProblem(id)} title="Remove" style={{
                      background: 'none', border: 'none', color: 'var(--accent-red)',
                      cursor: 'pointer', fontSize: 12, padding: '2px 6px'
                    }}>x</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Start */}
        <button onClick={handleStart}
          disabled={!selectedProblems || selectedProblems.length === 0}
          style={{
            padding: '10px 24px', borderRadius: 6, border: 'none',
            background: selectedProblems && selectedProblems.length > 0 ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
            color: selectedProblems && selectedProblems.length > 0 ? '#fff' : 'var(--text-muted)',
            cursor: selectedProblems && selectedProblems.length > 0 ? 'pointer' : 'default',
            fontSize: 14, fontWeight: 600
          }}>
          Start Session
        </button>
      </div>
    </div>
  )
}
