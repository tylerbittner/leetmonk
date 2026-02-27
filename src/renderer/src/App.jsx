import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import ProblemList from './components/ProblemList.jsx'
import FilterBar from './components/FilterBar.jsx'
import ProblemDescription from './components/ProblemDescription.jsx'
import CodeEditor from './components/CodeEditor.jsx'
import TestResults from './components/TestResults.jsx'
import Timer from './components/Timer.jsx'
import SessionPlanner from './components/SessionPlanner.jsx'
import SessionBar from './components/SessionBar.jsx'
import PostSessionReview from './components/PostSessionReview.jsx'
import ReviewFlag from './components/ReviewFlag.jsx'
import ReviewQueue from './components/ReviewQueue.jsx'
import AboutModal from './components/AboutModal.jsx'

export default function App() {
  const [problems, setProblems] = useState([])
  const [loadErrors, setLoadErrors] = useState([])
  const [activeProblemId, setActiveProblemId] = useState(null)
  const [filters, setFilters] = useState({ difficulty: 'all', tags: [], status: 'all', search: '' })
  const [progress, setProgress] = useState({})
  const [editorState, setEditorStateMap] = useState({})
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [lastRunMode, setLastRunMode] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiRef = useRef(null)
  const [session, setSession] = useState(null)
  const [showSessionPlanner, setShowSessionPlanner] = useState(false)
  const [completedSession, setCompletedSession] = useState(null)
  const [reviewData, setReviewData] = useState({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  const activeProblem = problems.find(p => p.id === activeProblemId) || null

  // Load everything on startup
  useEffect(() => {
    async function init() {
      const { problems: loaded, errors } = await window.api.loadProblems()
      setProblems(loaded.sort((a, b) => {
        const order = { easy: 0, medium: 1, hard: 2 }
        return (order[a.difficulty] ?? 3) - (order[b.difficulty] ?? 3)
      }))
      setLoadErrors(errors)
      if (loaded.length > 0) setActiveProblemId(loaded[0].id)

      const [prog, edState, revData] = await Promise.all([
        window.api.getProgress(),
        window.api.getEditorState(),
        window.api.getReviewData()
      ])
      setProgress(prog)
      setEditorStateMap(edState)
      setReviewData(revData || {})
    }
    init()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (e.metaKey && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleRun('run')
      } else if (e.metaKey && e.shiftKey && e.key === 'Enter') {
        e.preventDefault()
        handleRun('submit')
      } else if (e.metaKey && e.key === '[') {
        e.preventDefault()
        navigateProblem(-1)
      } else if (e.metaKey && e.key === ']') {
        e.preventDefault()
        navigateProblem(1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeProblemId, problems, running, editorState])

  const filteredProblems = problems.filter(p => {
    if (filters.difficulty !== 'all' && p.difficulty !== filters.difficulty) return false
    if (filters.tags.length > 0 && !filters.tags.some(t => p.tags.includes(t))) return false
    if (filters.status === 'solved' && progress[p.id]?.status !== 'solved') return false
    if (filters.status === 'unsolved' && progress[p.id]?.status === 'solved') return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!p.title.toLowerCase().includes(q) && !p.tags.some(t => t.includes(q))) return false
    }
    return true
  })

  const navigateProblem = (dir) => {
    const idx = filteredProblems.findIndex(p => p.id === activeProblemId)
    const next = filteredProblems[idx + dir]
    if (next) selectProblem(next.id)
  }

  const selectProblem = useCallback((id) => {
    setActiveProblemId(id)
    setResults(null)
    setShowConfetti(false)
  }, [])

  const getCode = (problemId) => {
    const p = problems.find(x => x.id === problemId)
    return editorState[problemId] ?? p?.starterCode?.python ?? ''
  }

  const handleCodeChange = useCallback((problemId, code) => {
    setEditorStateMap(prev => ({ ...prev, [problemId]: code }))
    window.api.setEditorState({ problemId, code })

    // Mark as attempted on first edit
    setProgress(prev => {
      const cur = prev[problemId] || {}
      if (!cur.status || cur.status === 'unsolved') {
        const updated = { ...prev, [problemId]: { ...cur, status: 'attempted' } }
        window.api.setProgress({ problemId, data: { status: 'attempted' } })
        return updated
      }
      return prev
    })
  }, [])

  // Mark problem solved in session when submit succeeds
  const markSessionProblemSolved = useCallback((problemId) => {
    if (!session || !session.problems.includes(problemId)) return
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
    const updated = {
      ...session,
      results: { ...session.results, [problemId]: { solved: true, timeSpent: elapsed } }
    }
    if (Object.keys(updated.results).length >= updated.problems.length) {
      updated.completedAt = new Date().toISOString()
    }
    setSession(updated)
    window.api.saveSession(updated)
  }, [session])

  const handleRun = useCallback(async (mode) => {
    if (!activeProblem || running) return
    setRunning(true)
    setResults(null)
    setLastRunMode(mode)

    const code = getCode(activeProblem.id)
    const startTime = Date.now()

    try {
      const result = await window.api.runCode({ code, problem: activeProblem, mode })
      setResults(result)

      const passed = result.results?.filter(r => r.passed).length ?? 0
      const total = result.results?.length ?? 0
      const allPassed = total > 0 && passed === total

      // Save submission record for both run and submit
      if (!result.error || total > 0) {
        const submission = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          mode,
          code,
          passed,
          total,
          accepted: mode === 'submit' && allPassed,
          executionError: result.error || null,
        }
        const updated = await window.api.addSubmission({ problemId: activeProblem.id, submission })
        setProgress(prev => ({ ...prev, [activeProblem.id]: { ...prev[activeProblem.id], ...updated } }))
      }

      if (mode === 'submit') {
        if (allPassed) {
          setProgress(prev => {
            const cur = prev[activeProblem.id] || {}
            const data = {
              ...cur,
              status: 'solved',
              attempts: (cur.attempts || 0) + 1,
              solvedAt: cur.solvedAt || new Date().toISOString(),
              lastCode: code,
            }
            window.api.setProgress({ problemId: activeProblem.id, data })
            return { ...prev, [activeProblem.id]: data }
          })
          markSessionProblemSolved(activeProblem.id)
          triggerConfetti()
        } else {
          setProgress(prev => {
            const cur = prev[activeProblem.id] || {}
            if (cur.status !== 'solved') {
              const data = { ...cur, status: 'attempted', attempts: (cur.attempts || 0) + 1 }
              window.api.setProgress({ problemId: activeProblem.id, data })
              return { ...prev, [activeProblem.id]: data }
            }
            return prev
          })
        }
      }
    } catch (err) {
      setResults({ results: [], error: err.message })
    } finally {
      setRunning(false)
    }
  }, [activeProblem, running, editorState, problems, markSessionProblemSolved])

  const handleReset = useCallback(() => {
    if (!activeProblem) return
    if (!confirm('Reset to starter code? Your current code will be lost.')) return
    const starter = activeProblem.starterCode?.python ?? ''
    setEditorStateMap(prev => ({ ...prev, [activeProblem.id]: starter }))
    window.api.setEditorState({ problemId: activeProblem.id, code: starter })
    setResults(null)
  }, [activeProblem])

  function triggerConfetti() {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 4000)
  }

  // Session handlers
  const handleStartSession = useCallback((newSession) => {
    setSession(newSession)
    setShowSessionPlanner(false)
    window.api.saveSession(newSession)
    if (newSession.problems.length > 0) {
      selectProblem(newSession.problems[0])
    }
  }, [selectProblem])

  const handleSessionNext = useCallback(() => {
    if (!session) return
    const nextIndex = Math.min(session.currentIndex + 1, session.problems.length - 1)
    // If current problem not yet in results, mark as skipped
    const currentId = session.problems[session.currentIndex]
    const updated = { ...session, currentIndex: nextIndex }
    if (!updated.results[currentId]) {
      updated.results = { ...updated.results, [currentId]: { solved: false, timeSpent: null } }
    }
    // Check if all done
    if (Object.keys(updated.results).length >= updated.problems.length) {
      updated.completedAt = new Date().toISOString()
    }
    setSession(updated)
    window.api.saveSession(updated)
    selectProblem(updated.problems[nextIndex])
  }, [session, selectProblem])

  const handleEndSession = useCallback(() => {
    if (!session) return
    const ended = { ...session, completedAt: new Date().toISOString() }
    setSession(null)
    setCompletedSession(ended)
    window.api.saveSession(ended)
  }, [session])

  const handleReviewFlag = useCallback((problemId, data) => {
    const item = data || {
      flaggedAt: new Date().toISOString(),
      interval: 1,
      nextReview: new Date(Date.now() + 86400000).toISOString(),
      reviewCount: 0
    }
    setReviewData(prev => ({ ...prev, [problemId]: item }))
    window.api.setReviewItem({ problemId, data: item })
  }, [])

  const handleReviewDismiss = useCallback((problemId) => {
    setReviewData(prev => {
      const next = { ...prev }
      delete next[problemId]
      return next
    })
    window.api.removeReviewItem({ problemId })
  }, [])

  const allTags = [...new Set(problems.flatMap(p => p.tags))].sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
        height: 48, borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)', flexShrink: 0, WebkitAppRegion: 'drag'
      }}>
        <div style={{ width: 70 }} /> {/* macOS traffic lights space */}
        <span
          onClick={() => setShowAbout(true)}
          style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-green)', letterSpacing: '-0.5px', WebkitAppRegion: 'no-drag', cursor: 'pointer' }}
          title="About LeetMonk"
        >
          LeetMonk &gt;_
        </span>

        <div style={{ flex: 1, WebkitAppRegion: 'no-drag' }}>
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            allTags={allTags}
            problems={problems}
            progress={progress}
          />
        </div>

        <div style={{ WebkitAppRegion: 'no-drag' }}>
          <button onClick={() => setShowSessionPlanner(true)} style={{
            padding: '4px 12px', borderRadius: 4, border: '1px solid var(--border)',
            background: session ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
            color: session ? '#fff' : 'var(--text-primary)',
            cursor: 'pointer', fontSize: 12
          }}>
            {session ? 'Session Active' : 'Plan Session'}
          </button>
        </div>

        {activeProblem && (
          <div style={{ WebkitAppRegion: 'no-drag', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setSidebarCollapsed(c => !c)} title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'} style={{
              padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)',
              background: sidebarCollapsed ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
              color: sidebarCollapsed ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: 12
            }}>
              {sidebarCollapsed ? '◧' : '▣'}
            </button>
            <Timer problemId={activeProblem.id} />
          </div>
        )}
      </div>

      {session && (
        <SessionBar
          session={session}
          problems={problems}
          onNext={handleSessionNext}
          onEnd={handleEndSession}
          onNavigate={selectProblem}
        />
      )}

      {loadErrors.length > 0 && (
        <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '6px 16px', fontSize: 12 }}>
          ⚠ Schema errors in {loadErrors.length} problem file(s). Check console for details.
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Problem sidebar */}
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {!sidebarCollapsed && (
            <div style={{
              width: 240, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)'
            }}>
              <ProblemList
                problems={filteredProblems}
                activeProblemId={activeProblemId}
                progress={progress}
                onSelect={selectProblem}
              />
              <ReviewQueue
                problems={problems}
                reviewData={reviewData}
                onSelect={selectProblem}
                activeProblemId={activeProblemId}
              />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            title={sidebarCollapsed ? 'Expand problem list' : 'Collapse problem list'}
            style={{
              width: 14, padding: 0, border: 'none',
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, lineHeight: 1, flexShrink: 0
            }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Main panels */}
        {activeProblem ? (
          <PanelGroup direction="horizontal" style={{ flex: 1 }}>
            <Panel defaultSize={45} minSize={25}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '8px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
                  <ReviewFlag
                    problemId={activeProblem.id}
                    reviewData={reviewData[activeProblem.id] || null}
                    onFlag={handleReviewFlag}
                    onDismiss={handleReviewDismiss}
                  />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <ProblemDescription
                    problem={activeProblem}
                    submissions={progress[activeProblem.id]?.submissions || []}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle style={{
              width: 4, background: 'var(--border)', cursor: 'col-resize',
              transition: 'background 0.15s'
            }} />

            <Panel defaultSize={55} minSize={30}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={60} minSize={30}>
                  <CodeEditor
                    key={activeProblem.id}
                    problem={activeProblem}
                    code={getCode(activeProblem.id)}
                    onChange={(code) => handleCodeChange(activeProblem.id, code)}
                    onRun={() => handleRun('run')}
                    onSubmit={() => handleRun('submit')}
                    onReset={handleReset}
                    running={running}
                  />
                </Panel>

                <PanelResizeHandle style={{
                  height: 4, background: 'var(--border)', cursor: 'row-resize'
                }} />

                <Panel defaultSize={40} minSize={20}>
                  <TestResults
                    results={results}
                    running={running}
                    mode={lastRunMode}
                    problem={activeProblem}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: 16
          }}>
            {problems.length === 0 ? 'Loading problems…' : 'Select a problem to begin'}
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div style={{
        height: 24, borderTop: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', padding: '0 16px', gap: 16, fontSize: 11,
        color: 'var(--text-muted)', background: 'var(--bg-secondary)', flexShrink: 0
      }}>
        {activeProblem && <span>{activeProblem.id}</span>}
        <span>Python 3</span>
        <span style={{ marginLeft: 'auto' }}>
          {Object.values(progress).filter(p => p.status === 'solved').length} / {problems.length} solved
        </span>
      </div>

      {showSessionPlanner && (
        <SessionPlanner
          problems={problems}
          progress={progress}
          onStart={handleStartSession}
          onClose={() => setShowSessionPlanner(false)}
        />
      )}

      {showConfetti && <ConfettiEffect />}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {completedSession && (
        <PostSessionReview
          session={completedSession}
          problems={problems}
          onClose={() => setCompletedSession(null)}
        />
      )}
    </div>
  )
}

function ConfettiEffect() {
  const canvasRef = React.useRef(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      color: ['#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316'][Math.floor(Math.random() * 5)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10
    }))

    let frame
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.rotation += p.rotSpeed
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2)
        ctx.restore()
      }
      frame = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="confetti-overlay"
    />
  )
}
