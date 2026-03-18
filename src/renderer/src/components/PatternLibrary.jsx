import React, { useState, useMemo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { patterns, patternById } from '../data/patterns.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const diffColor = { easy: 'var(--easy)', medium: 'var(--medium)', hard: 'var(--hard)' }
const diffBg = {
  easy: 'rgba(34,197,94,0.1)',
  medium: 'rgba(234,179,8,0.1)',
  hard: 'rgba(239,68,68,0.1)',
}

const CATEGORY_ORDER = ['technique', 'data-structure']
const CATEGORY_LABEL = { technique: 'Techniques', 'data-structure': 'Data Structures' }
const CATEGORY_DESC = {
  technique: 'Algorithmic strategies — how to approach a problem class.',
  'data-structure': 'Core data structures — the containers that enable efficient solutions.',
}

// ─── PatternCard (collapsed) ──────────────────────────────────────────────────

function PatternCard({ pattern, problemCount, masteryPct, onClick, isActive }) {
  const mastery = Math.round(masteryPct)
  const masteryColor =
    mastery >= 80 ? 'var(--accent-green)' :
    mastery >= 40 ? 'var(--accent-yellow)' :
    'var(--text-muted)'

  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? 'var(--bg-active)' : 'var(--bg-secondary)',
        border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.background = 'var(--bg-secondary)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{pattern.emoji}</span>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>
          {pattern.name}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {problemCount} {problemCount === 1 ? 'problem' : 'problems'}
        </span>
      </div>

      <p style={{
        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        margin: 0,
      }}>
        {pattern.description}
      </p>

      {/* Mastery bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <div style={{
          flex: 1, height: 4, background: 'var(--bg-tertiary)',
          borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${mastery}%`,
            background: masteryColor,
            borderRadius: 2, transition: 'width 0.3s',
          }} />
        </div>
        <span style={{ fontSize: 11, color: masteryColor, minWidth: 32, textAlign: 'right' }}>
          {mastery}%
        </span>
      </div>
    </div>
  )
}

// ─── PatternDetail (expanded) ─────────────────────────────────────────────────

function PatternDetail({ pattern, linkedProblems, progress, onSelectProblem, onClose }) {
  const [showTemplate, setShowTemplate] = useState(false)

  return (
    <div style={{
      background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>
      {/* Detail header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>{pattern.emoji}</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              {pattern.name}
            </h2>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 10,
              background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {pattern.category === 'technique' ? 'Technique' : 'Data Structure'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 20, padding: 4, lineHeight: 1,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Complexity badges */}
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 6,
            background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)',
            border: '1px solid rgba(59,130,246,0.3)',
          }}>
            ⏱ {pattern.complexity.time}
          </span>
          <span style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 6,
            background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple)',
            border: '1px solid rgba(168,85,247,0.3)',
          }}>
            🗃 {pattern.complexity.space}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {/* Description */}
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
          {pattern.description}
        </p>

        {/* When to use */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            When to Use
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pattern.whenToUse.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 1 }}>›</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Template */}
        <section style={{ marginBottom: 24 }}>
          <button
            onClick={() => setShowTemplate(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: showTemplate ? '8px 8px 0 0' : 8,
              padding: '10px 14px', cursor: 'pointer', color: 'var(--text-primary)',
              fontSize: 13, fontWeight: 600, textAlign: 'left',
            }}
          >
            <span style={{ color: 'var(--accent-blue)' }}>{showTemplate ? '▾' : '▸'}</span>
            Code Template
          </button>
          {showTemplate && (
            <div style={{
              border: '1px solid var(--border)', borderTop: 'none',
              borderRadius: '0 0 8px 8px', overflow: 'hidden',
            }}>
              <SyntaxHighlighter
                style={vscDarkPlus}
                language="python"
                customStyle={{ margin: 0, borderRadius: 0, fontSize: 12 }}
              >
                {pattern.template}
              </SyntaxHighlighter>
            </div>
          )}
        </section>

        {/* Related patterns */}
        {pattern.relatedPatterns?.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Related Patterns
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {pattern.relatedPatterns.map(relId => {
                const rel = patternById[relId]
                return rel ? (
                  <span key={relId} style={{
                    fontSize: 12, padding: '3px 10px', borderRadius: 10,
                    background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}>
                    {rel.emoji} {rel.name}
                  </span>
                ) : null
              })}
            </div>
          </section>
        )}

        {/* Linked problems */}
        {linkedProblems.length > 0 && (
          <section>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Problems ({linkedProblems.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {linkedProblems.map(p => {
                const status = progress[p.id]?.status
                const statusDot = status === 'solved'
                  ? { color: 'var(--accent-green)', label: '●' }
                  : status === 'attempted'
                  ? { color: 'var(--accent-yellow)', label: '●' }
                  : { color: 'var(--text-muted)', label: '○' }

                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectProblem(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 6,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  >
                    <span style={{ color: statusDot.color, fontSize: 10 }}>{statusDot.label}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{p.title}</span>
                    <span style={{
                      fontSize: 11, padding: '1px 7px', borderRadius: 8,
                      background: diffBg[p.difficulty],
                      color: diffColor[p.difficulty],
                      border: `1px solid ${diffColor[p.difficulty]}40`,
                      textTransform: 'capitalize',
                    }}>
                      {p.difficulty}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// ─── PatternLibrary (main) ────────────────────────────────────────────────────

export default function PatternLibrary({ problems, progress, onSelectProblem }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activePatternId, setActivePatternId] = useState(null)

  // Build problem lookup by pattern id
  const problemsByPattern = useMemo(() => {
    const map = {}
    for (const p of problems) {
      for (const pid of (p.patterns || [])) {
        if (!map[pid]) map[pid] = []
        map[pid].push(p)
      }
    }
    return map
  }, [problems])

  // Mastery percentage per pattern
  const masteryByPattern = useMemo(() => {
    const m = {}
    for (const pat of patterns) {
      const linked = problemsByPattern[pat.id] || []
      if (linked.length === 0) { m[pat.id] = 0; continue }
      const solved = linked.filter(p => progress[p.id]?.status === 'solved').length
      m[pat.id] = (solved / linked.length) * 100
    }
    return m
  }, [problemsByPattern, progress])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return patterns.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, categoryFilter])

  const activePattern = activePatternId ? patternById[activePatternId] : null

  const handleSelectProblem = (id) => {
    onSelectProblem(id)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left panel: grid */}
      <div style={{
        flex: activePattern ? '0 0 55%' : '1',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        borderRight: activePattern ? '1px solid var(--border)' : 'none',
        transition: 'flex 0.2s',
      }}>
        {/* Library header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            📖 Pattern Library
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            {patterns.length} patterns · {problems.length} problems
          </p>

          {/* Search + filter row */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Search patterns…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, padding: '7px 12px', borderRadius: 6,
                border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              }}
            />
            {['all', 'technique', 'data-structure'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '7px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${categoryFilter === cat ? 'var(--accent-blue)' : 'var(--border)'}`,
                  background: categoryFilter === cat ? 'rgba(59,130,246,0.15)' : 'var(--bg-tertiary)',
                  color: categoryFilter === cat ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {cat === 'all' ? 'All' : cat === 'technique' ? 'Techniques' : 'Data Structures'}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {CATEGORY_ORDER.map(cat => {
            const inCat = filtered.filter(p => p.category === cat)
            if (inCat.length === 0) return null
            return (
              <div key={cat} style={{ marginBottom: 32 }}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {CATEGORY_LABEL[cat]}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {CATEGORY_DESC[cat]}
                  </p>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: activePattern
                    ? 'repeat(auto-fill, minmax(220px, 1fr))'
                    : 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 10,
                }}>
                  {inCat.map(pattern => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                      problemCount={(problemsByPattern[pattern.id] || []).length}
                      masteryPct={masteryByPattern[pattern.id] || 0}
                      isActive={activePatternId === pattern.id}
                      onClick={() => setActivePatternId(
                        activePatternId === pattern.id ? null : pattern.id
                      )}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              No patterns match "{search}"
            </div>
          )}
        </div>
      </div>

      {/* Right panel: detail */}
      {activePattern && (
        <div style={{ flex: '0 0 45%', overflow: 'hidden' }}>
          <PatternDetail
            pattern={activePattern}
            linkedProblems={problemsByPattern[activePattern.id] || []}
            progress={progress}
            onSelectProblem={handleSelectProblem}
            onClose={() => setActivePatternId(null)}
          />
        </div>
      )}
    </div>
  )
}
