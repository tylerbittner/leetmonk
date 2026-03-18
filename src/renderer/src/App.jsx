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
import SettingsPanel from './components/SettingsPanel.jsx'
import LotusEffect from './components/LotusEffect.jsx'
import BugReportModal from './components/BugReportModal.jsx'
import DiffView from './components/DiffView.jsx'
import PatternLibrary from './components/PatternLibrary.jsx'

const DEFAULT_SETTINGS = {
  celebrationEffect: 'lotus',
  soundOnSolve: true,
  timerVisible: true,
  editorFontSize: 14,
  vimKeybindings: false,
  focusMode: 'standard',
}

function playBellSound() {
  try {
    const audio = new Audio(new URL('./public/sounds/bell.mp3', import.meta.url).href)
    audio.volume = 0.6
    audio.play().catch(() => {})
  } catch (_) {}
}
import RatingModal from './components/RatingModal.jsx'
import { processReview, newCardState } from './fsrs.js'

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
  const [showCelebration, setShowCelebration] = useState(false)
  const [session, setSession] = useState(null)
  const [showSessionPlanner, setShowSessionPlanner] = useState(false)
  const [completedSession, setCompletedSession] = useState(null)
  const [reviewData, setReviewData] = useState({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showBugReport, setShowBugReport] = useState(false)
  const [solutionsViewed, setSolutionsViewed] = useState({})
  const [diffViewOpen, setDiffViewOpen] = useState(false)
  const [diffSolutionIndex, setDiffSolutionIndex] = useState(0)
  const [showPatterns, setShowPatterns] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [srData, setSrData] = useState({})
  const [pendingRating, setPendingRating] = useState(null)
  const [languageMap, setLanguageMap] = useState({})

  const activeProblem = problems.find(p => p.id === activeProblemId) || null
  const currentLanguage = activeProblemId ? (languageMap[activeProblemId] ?? 'python') : 'python'

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

      const [prog, edState, revData, savedSettings, srStateAll] = await Promise.all([
        window.api.getProgress(),
        window.api.getEditorState(),
        window.api.getReviewData(),
        window.api.getAllSrState(),
        window.api.getSettings(),
      ])
      setProgress(prog)
      setEditorStateMap(edState)
      setReviewData(revData || {})
      setSettings({ ...DEFAULT_SETTINGS, ...savedSettings })
      setSrData(srStateAll || {})
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
      } else if (e.metaKey && e.key === ',') {
        e.preventDefault()
        setShowSettings(s => !s)
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
    setShowCelebration(false)
    setDiffViewOpen(false)
    setShowPatterns(false)
  }, [])

  const getCode = (problemId, lang) => {
    const p = problems.find(x => x.id === problemId)
    const language = lang ?? languageMap[problemId] ?? 'python'
    const key = `${problemId}:${language}`
    const starter = language === 'javascript'
      ? (p?.starterCode?.javascript ?? '')
      : (p?.starterCode?.python ?? '')
    return editorState[key] ?? starter
  }

  const handleCodeChange = useCallback((problemId, code) => {
    const language = languageMap[problemId] ?? 'python'
    const key = `${problemId}:${language}`
    setEditorStateMap(prev => ({ ...prev, [key]: code }))
    window.api.setEditorState({ problemId: key, code })

    setProgress(prev => {
      const cur = prev[problemId] || {}
      if (!cur.status || cur.status === 'unsolved') {
        const updated = { ...prev, [problemId]: { ...cur, status: 'attempted' } }
        window.api.setProgress({ problemId, data: { status: 'attempted' } })
        return updated
      }
      return prev
    })
  }, [languageMap])

  const handleLanguageChange = useCallback((problemId, language) => {
    setLanguageMap(prev => ({ ...prev, [problemId]: language }))
    setResults(null)
  }, [])

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

    try {
      const result = await window.api.runCode({ code, problem: activeProblem, mode, language: currentLanguage })
      setResults(result)

      const passed = result.results?.filter(r => r.passed).length ?? 0
      const total = result.results?.length ?? 0
      const allPassed = total > 0 && passed === total

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
          triggerCelebration()
          setPendingRating({ problemId: activeProblem.id, srState: null })
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
  }, [activeProblem, running, editorState, problems, markSessionProblemSolved, settings])

  const handleReset = useCallback(() => {
    if (!activeProblem) return
    if (!confirm('Reset to starter code? Your current code will be lost.')) return
    const language = languageMap[activeProblem.id] ?? 'python'
    const starter = language === 'javascript'
      ? (activeProblem.starterCode?.javascript ?? '')
      : (activeProblem.starterCode?.python ?? '')
    const key = `${activeProblem.id}:${language}`
    setEditorStateMap(prev => ({ ...prev, [key]: starter }))
    window.api.setEditorState({ problemId: key, code: starter })
    setResults(null)
  }, [activeProblem, languageMap])

  function triggerCelebration() {
    const effect = settings.celebrationEffect ?? 'lotus'
    // Bell for confetti mode (lotus effect plays its own bell internally)
    if (settings.soundOnSolve && effect === 'confetti') {
      playBellSound()
    }
    if (effect !== 'none') {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 4000)
    } else if (settings.soundOnSolve) {
      // Play bell even with no visual effect
      playBellSound()
    }
  }

  const handleSettingsChange = useCallback((next) => {
    setSettings(next)
  }, [])

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
    const currentId = session.problems[session.currentIndex]
    const updated = { ...session, currentIndex: nextIndex }
    if (!updated.results[currentId]) {
      updated.results = { ...updated.results, [currentId]: { solved: false, timeSpent: null } }
    }
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

  const handleResetSr = useCallback((problemId) => {
    setSrData(prev => {
      const next = { ...prev }
      delete next[problemId]
      return next
    })
    window.api.setSrState({ problemId, data: null })
  }, [])

  const handleRate = useCallback((problemId, rating) => {
    const currentState = srData[problemId] || newCardState()
    const newState = processReview(currentState, rating, new Date())
    setSrData(prev => ({ ...prev, [problemId]: newState }))
    window.api.setSrState({ problemId, data: newState })
    // Also flag for review if not already flagged
    if (!reviewData[problemId]) {
      const item = {
        flaggedAt: new Date().toISOString(),
        interval: Math.max(1, Math.round(newState.stability)),
        nextReview: newState.nextReview,
        reviewCount: newState.reps
      }
      setReviewData(prev => ({ ...prev, [problemId]: item }))
      window.api.setReviewItem({ problemId, data: item })
    } else {
      // Update existing review item's nextReview to match FSRS
      const updated = { ...reviewData[problemId], nextReview: newState.nextReview }
      setReviewData(prev => ({ ...prev, [problemId]: updated }))
      window.api.setReviewItem({ problemId, data: updated })
    }
  }, [srData, reviewData])

  const allTags = [...new Set(problems.flatMap(p => p.tags))].sort()
  const solvedCount = Object.values(progress).filter(p => p.status === 'solved').length
  const activeProblemIndex = activeProblem
    ? filteredProblems.findIndex(p => p.id === activeProblemId) + 1
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
        height: 48, borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)', flexShrink: 0, WebkitAppRegion: 'drag'
      }}>
        <div style={{ width: 70 }} />
        <span
          onClick={() => setShowAbout(true)}
          style={{
            fontWeight: 700, fontSize: 16, color: 'var(--accent-green)', letterSpacing: '-0.5px',
            WebkitAppRegion: 'no-drag', cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
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

        {activeProblem && (
          <div style={{ WebkitAppRegion: 'no-drag', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TopBarBtn onClick={() => navigateProblem(-1)} title="Previous problem (Cmd+[)">‹</TopBarBtn>
            <TopBarBtn onClick={() => navigateProblem(1)} title="Next problem (Cmd+])">›</TopBarBtn>
            <button onClick={() => setSidebarCollapsed(c => !c)} title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'} style={{
              padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)',
              background: sidebarCollapsed ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
              color: sidebarCollapsed ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: 12, transition: 'background 0.15s, color 0.15s',
            }}>
              {sidebarCollapsed ? '◧' : '▣'}
            </button>
            {settings.timerVisible && <Timer problemId={activeProblem.id} />}
          </div>
        )}

        {/* Pattern Library */}
        <div style={{ WebkitAppRegion: 'no-drag' }}>
          <TopBarBtn
            onClick={() => setShowPatterns(p => !p)}
            title="Pattern Library"
            active={showPatterns}
          >
            📖
          </TopBarBtn>
        </div>

        {/* Settings gear */}
        <div style={{ WebkitAppRegion: 'no-drag' }}>
          <TopBarBtn
            onClick={() => setShowSettings(true)}
            title="Settings (Cmd+,)"
            active={showSettings}
            iconSize={18}
          >
            ⚙
          </TopBarBtn>
        </div>
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
        {/* Sidebar — animated collapse */}
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <div style={{
            width: sidebarCollapsed ? 0 : 240,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            background: 'var(--bg-secondary)',
            transition: 'width 0.2s ease',
            flexShrink: 0,
          }}>
            <ProblemList
              problems={filteredProblems}
              activeProblemId={activeProblemId}
              progress={progress}
              onSelect={selectProblem}
              searchValue={filters.search}
              onSearchChange={(v) => setFilters(f => ({ ...f, search: v }))}
            />
            <ReviewQueue
              problems={problems}
              reviewData={reviewData}
              onSelect={selectProblem}
              activeProblemId={activeProblemId}
            />
            {/* Sidebar footer — subtle session planner */}
            <div style={{
              borderTop: '1px solid var(--border)', padding: '6px 10px',
              display: 'flex', justifyContent: 'flex-end', flexShrink: 0,
            }}>
              <button
                onClick={() => setShowSessionPlanner(true)}
                title={session ? 'Session active — click to manage' : 'Plan a session'}
                style={{
                  background: session ? 'var(--accent-blue)' : 'none',
                  border: '1px solid var(--border)', borderRadius: 4,
                  padding: '3px 8px', cursor: 'pointer', fontSize: 12,
                  color: session ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { if (!session) e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { if (!session) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                🗓 {session ? 'Active' : 'Plan'}
              </button>
            </div>
          </div>
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            title={sidebarCollapsed ? 'Expand problem list' : 'Collapse problem list'}
            className="sidebar-toggle"
            style={{
              width: 14, padding: 0, border: 'none',
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-secondary)', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, lineHeight: 1, flexShrink: 0,
              transition: 'color 0.15s, background 0.15s',
            }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Main panels */}
        {showPatterns ? (
          <PatternLibrary
            problems={problems}
            progress={progress}
            onSelectProblem={(id) => { setShowPatterns(false); selectProblem(id) }}
            onClose={() => setShowPatterns(false)}
          />
        ) : activeProblem ? (
          <PanelGroup direction="horizontal" style={{ flex: 1 }}>
            <Panel defaultSize={45} minSize={25}>
              <div
                key={activeProblem.id}
                className="problem-enter"
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div style={{ padding: '8px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
                  <ReviewFlag
                    problemId={activeProblem.id}
                    reviewData={reviewData[activeProblem.id] || null}
                    srState={srData[activeProblem.id]}
                    onFlag={handleReviewFlag}
                    onDismiss={handleReviewDismiss}
                    onResetSr={handleResetSr}
                  />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <ProblemDescription
                    problem={activeProblem}
                    submissions={progress[activeProblem.id]?.submissions || []}
                    onSolutionsViewed={() => setSolutionsViewed(prev => ({ ...prev, [activeProblem.id]: true }))}
                    userCode={getCode(activeProblem.id)}
                    onOpenDiff={(idx) => { setDiffSolutionIndex(idx ?? 0); setDiffViewOpen(true) }}
                    onOpenPatterns={() => setShowPatterns(true)}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="resize-handle-h" style={{
              width: 4, background: 'var(--border)', cursor: 'col-resize',
              transition: 'background 0.15s',
            }} />

            <Panel defaultSize={55} minSize={30}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={60} minSize={30}>
                  {diffViewOpen ? (
                    <DiffView
                      problem={activeProblem}
                      userCode={getCode(activeProblem.id)}
                      initialSolutionIndex={diffSolutionIndex}
                      onClose={() => setDiffViewOpen(false)}
                    />
                  ) : (
                  <CodeEditor
                    key={`${activeProblem.id}:${currentLanguage}`}
                    problem={activeProblem}
                    code={getCode(activeProblem.id)}
                    language={currentLanguage}
                    onChange={(code) => handleCodeChange(activeProblem.id, code)}
                    onLanguageChange={(lang) => handleLanguageChange(activeProblem.id, lang)}
                    onRun={() => handleRun('run')}
                    onSubmit={() => handleRun('submit')}
                    onReset={handleReset}
                    running={running}
                    settings={settings}
                  />
                  )}
                </Panel>

                <PanelResizeHandle className="resize-handle-v" style={{
                  height: 4, background: 'var(--border)', cursor: 'row-resize',
                  transition: 'background 0.15s',
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
          <EmptyState loading={problems.length === 0} />
        )}
      </div>

      {/* Status bar — hidden in minimal mode */}
      {settings.focusMode !== 'minimal' && (
        <div style={{
          height: 24, borderTop: '1px solid var(--border)', display: 'flex',
          alignItems: 'center', padding: '0 16px', gap: 16, fontSize: 11,
          color: 'var(--text-muted)', background: 'var(--bg-secondary)', flexShrink: 0
        }}>
          {activeProblem && (
            <>
              <span>{activeProblem.id}</span>
              <span style={{
                color: activeProblem.difficulty === 'easy' ? 'var(--easy)'
                  : activeProblem.difficulty === 'medium' ? 'var(--medium)'
                  : 'var(--hard)',
                fontWeight: 600, textTransform: 'capitalize',
              }}>{activeProblem.difficulty}</span>
              {filteredProblems.length > 0 && (
                <span>{activeProblemIndex} / {filteredProblems.length}</span>
              )}
            </>
          )}
          <span>Python 3</span>
          <span style={{ marginLeft: 'auto' }}>
            <span style={{ color: solvedCount > 0 ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: solvedCount > 0 ? 600 : 400 }}>
              {solvedCount}
            </span>
            {' / '}{problems.length} solved
          </span>
        </div>
      )}

      {/* Modals */}
      {showSessionPlanner && (
        <SessionPlanner
          problems={problems}
          progress={progress}
          reviewData={reviewData}
          onStart={handleStartSession}
          onClose={() => setShowSessionPlanner(false)}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
          onBugReport={() => { setShowSettings(false); setShowBugReport(true) }}
        />
      )}
      {pendingRating && (
        <RatingModal
          problemId={pendingRating.problemId}
          srState={srData[pendingRating.problemId] || null}
          onRate={(rating) => {
            const cur = srData[pendingRating.problemId] || { difficulty: 5, stability: 1, reps: 0, lapses: 0, lastReview: null, nextReview: null }
            const next = processReview(cur, rating)
            setSrData(d => ({ ...d, [pendingRating.problemId]: next }))
            window.api.setSrState({ problemId: pendingRating.problemId, data: next })
            setPendingRating(null)
          }}
          onDismiss={() => setPendingRating(null)}
        />
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} activeProblemId={activeProblemId} />}

      {completedSession && (
        <PostSessionReview
          session={completedSession}
          problems={problems}
          onClose={() => setCompletedSession(null)}
        />
      )}

      {/* Celebration effects */}
      {showCelebration && settings.celebrationEffect === 'lotus' && (
        <LotusEffect soundEnabled={settings.soundOnSolve} />
      )}
      {showCelebration && settings.celebrationEffect === 'confetti' && (
        <ConfettiEffect />
      )}
    </div>
  )
}

// ─── Top bar button helper ─────────────────────────────────────────────────

function TopBarBtn({ children, onClick, title, active, iconSize }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)',
        background: active || hovered ? 'var(--bg-hover)' : 'var(--bg-tertiary)',
        color: active || hovered ? 'var(--text-primary)' : 'var(--text-muted)',
        cursor: 'pointer', fontSize: iconSize ?? 14, lineHeight: 1,
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────

const ZEN_QUOTES = [
  'The obstacle is the path.',
  'A journey of a thousand miles begins with a single step.',
  "In the beginner's mind there are many possibilities.",
  'Focus on the journey, not the destination.',
  'Do the difficult things while they are easy.',
]

function EmptyState({ loading }) {
  const quote = ZEN_QUOTES[Math.floor(Date.now() / 86400000) % ZEN_QUOTES.length]
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading problems…</div>
      ) : (
        <>
          <LotusMark />
          <div style={{ textAlign: 'center', maxWidth: 300 }}>
            <div style={{
              fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic',
              lineHeight: 1.7, marginBottom: 14, letterSpacing: '0.01em',
            }}>
              "{quote}"
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
              Select a problem to begin
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function LotusMark() {
  return (
    <svg width="54" height="46" viewBox="0 0 54 46" fill="none" style={{ opacity: 0.16 }}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
        <g key={i} transform={`rotate(${deg} 27 30)`}>
          <path d="M27 30 C25 21 20 14 27 7 C34 14 29 21 27 30Z" fill="var(--text-muted)" />
        </g>
      ))}
      <circle cx="27" cy="30" r="3" fill="var(--text-muted)" />
    </svg>
  )
}

// ─── Confetti (kept as selectable option) ────────────────────────────────

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

  return <canvas ref={canvasRef} className="confetti-overlay" />
}
