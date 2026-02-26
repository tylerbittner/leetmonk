import React, { useMemo } from 'react'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function difficultyColor(diff) {
  if (!diff) return 'var(--text-muted)'
  const d = diff.toLowerCase()
  if (d === 'easy') return 'var(--accent-green)'
  if (d === 'medium') return 'var(--accent-yellow)'
  if (d === 'hard') return 'var(--accent-red)'
  return 'var(--text-muted)'
}

function problemStatus(result) {
  if (!result) return { label: 'Skipped', color: 'var(--text-muted)', icon: '-' }
  if (result.solved) return { label: 'Solved', color: 'var(--accent-green)', icon: '\u2713' }
  return { label: 'Attempted', color: 'var(--accent-yellow)', icon: '\u2717' }
}

export default function PostSessionReview({ session, problems, onClose, onExportMarkdown }) {
  const problemMap = useMemo(() => {
    const map = {}
    if (problems) {
      for (const p of problems) {
        const id = p.titleSlug || p.id || p.slug
        if (id) map[id] = p
      }
    }
    return map
  }, [problems])

  const totalElapsed = useMemo(() => {
    if (!session.startedAt || !session.completedAt) return 0
    return Math.floor((new Date(session.completedAt) - new Date(session.startedAt)) / 1000)
  }, [session])

  const solvedCount = useMemo(() => {
    return session.problems.filter(id => session.results[id]?.solved).length
  }, [session])

  const totalProblems = session.problems.length

  const totalTimeSpent = useMemo(() => {
    return Object.values(session.results).reduce((sum, r) => sum + (r.timeSpent || 0), 0)
  }, [session])

  const targetSeconds = (session.timeTarget || 0) * 60

  // Topics summary: group by tags
  const topicsSummary = useMemo(() => {
    const topics = {}
    for (const pid of session.problems) {
      const prob = problemMap[pid]
      const tags = prob?.tags || prob?.topicTags || []
      const tagNames = tags.map(t => (typeof t === 'string' ? t : t.name || t.slug || ''))
      const solved = session.results[pid]?.solved || false
      for (const tag of tagNames) {
        if (!tag) continue
        if (!topics[tag]) topics[tag] = { total: 0, solved: 0 }
        topics[tag].total++
        if (solved) topics[tag].solved++
      }
    }
    return Object.entries(topics).sort((a, b) => a[0].localeCompare(b[0]))
  }, [session, problemMap])

  function generateMarkdown() {
    const date = formatDate(session.completedAt || session.startedAt)
    const lines = []
    lines.push(`# LeetMonk Session Review \u2014 ${date}`)
    lines.push('')
    lines.push('## Summary')
    lines.push(`- **Problems:** ${solvedCount}/${totalProblems} solved`)
    const timeStr = formatTime(totalTimeSpent)
    if (targetSeconds > 0) {
      lines.push(`- **Time:** ${timeStr} / ${formatTime(targetSeconds)} target`)
    } else {
      lines.push(`- **Time:** ${timeStr}`)
    }
    if (topicsSummary.length > 0) {
      const topicsStr = topicsSummary.map(([tag, s]) => `${tag} (${s.solved}/${s.total})`).join(', ')
      lines.push(`- **Topics:** ${topicsStr}`)
    }
    lines.push('')
    lines.push('## Problems')
    lines.push('| # | Problem | Difficulty | Status | Time |')
    lines.push('|---|---------|-----------|--------|------|')
    session.problems.forEach((pid, i) => {
      const prob = problemMap[pid]
      const title = prob?.title || pid
      const diff = prob?.difficulty || ''
      const result = session.results[pid]
      const status = problemStatus(result)
      const time = result ? formatTime(result.timeSpent) : '-'
      lines.push(`| ${i + 1} | ${title} | ${diff} | ${status.icon} ${status.label} | ${time} |`)
    })

    const weakTopics = topicsSummary.filter(([, s]) => s.solved === 0)
    if (weakTopics.length > 0) {
      lines.push('')
      lines.push('## Focus Areas')
      for (const [tag, s] of weakTopics) {
        lines.push(`- ${tag} (0% solved) \u2014 review needed`)
      }
    }

    return lines.join('\n')
  }

  function handleExport() {
    const md = generateMarkdown()
    if (onExportMarkdown) {
      onExportMarkdown(md)
    } else {
      navigator.clipboard.writeText(md)
    }
  }

  // Target comparison
  let targetLabel, targetColor
  if (!session.timeTarget || session.timeTarget === 0) {
    targetLabel = 'No target set'
    targetColor = 'var(--text-muted)'
  } else if (totalTimeSpent <= targetSeconds) {
    targetLabel = 'Under target'
    targetColor = 'var(--accent-green)'
  } else {
    const overBy = Math.ceil((totalTimeSpent - targetSeconds) / 60)
    targetLabel = `Over by ${overBy} min`
    targetColor = 'var(--accent-red)'
  }

  const cardStyle = {
    flex: 1,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '14px 16px',
    textAlign: 'center',
  }
  const cardValue = {
    fontSize: 22,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    marginBottom: 4,
  }
  const cardLabel = {
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        maxWidth: 700,
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '28px 32px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            margin: 0, fontSize: 22, fontWeight: 700,
            color: 'var(--text-primary)',
          }}>Session Complete</h2>
          <div style={{
            display: 'flex', gap: 16, marginTop: 6,
            fontSize: 13, color: 'var(--text-muted)',
          }}>
            <span>{formatDate(session.completedAt || session.startedAt)}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {formatTime(totalElapsed)} elapsed
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={cardStyle}>
            <div style={{
              ...cardValue,
              color: solvedCount === totalProblems ? 'var(--accent-green)' : solvedCount === 0 ? 'var(--accent-red)' : 'var(--accent-yellow)',
            }}>
              {solvedCount} / {totalProblems}
            </div>
            <div style={cardLabel}>Solved</div>
          </div>
          <div style={cardStyle}>
            <div style={{ ...cardValue, color: 'var(--text-primary)' }}>
              {formatTime(totalTimeSpent)}
            </div>
            <div style={cardLabel}>Total Time</div>
          </div>
          <div style={cardStyle}>
            <div style={{ ...cardValue, fontSize: 15, color: targetColor }}>
              {targetLabel}
            </div>
            <div style={cardLabel}>vs Target</div>
          </div>
        </div>

        {/* Problem breakdown */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            margin: '0 0 12px', fontSize: 14, fontWeight: 600,
            color: 'var(--text-secondary)', textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>Problem Breakdown</h3>
          <div style={{
            border: '1px solid var(--border)', borderRadius: 8,
            overflow: 'hidden',
          }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontSize: 13, color: 'var(--text-primary)',
            }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  {['#', 'Problem', 'Difficulty', 'Status', 'Time'].map(h => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: 'left',
                      fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {session.problems.map((pid, i) => {
                  const prob = problemMap[pid]
                  const title = prob?.title || pid
                  const diff = prob?.difficulty || ''
                  const result = session.results[pid]
                  const status = problemStatus(result)
                  const tags = prob?.tags || prob?.topicTags || []
                  const tagNames = tags.map(t => (typeof t === 'string' ? t : t.name || ''))

                  return (
                    <tr key={pid} style={{
                      borderBottom: i < session.problems.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div>{title}</div>
                        {tagNames.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                            {tagNames.filter(Boolean).map(tag => (
                              <span key={tag} style={{
                                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                background: 'var(--bg-primary)', color: 'var(--text-muted)',
                                border: '1px solid var(--border)',
                              }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: difficultyColor(diff),
                        }}>{diff}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: status.color, fontWeight: 600 }}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                        color: 'var(--text-secondary)',
                      }}>
                        {result ? formatTime(result.timeSpent) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Topics summary */}
        {topicsSummary.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{
              margin: '0 0 12px', fontSize: 14, fontWeight: 600,
              color: 'var(--text-secondary)', textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>Topics Summary</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topicsSummary.map(([tag, s]) => {
                const weak = s.solved === 0
                return (
                  <div key={tag} style={{
                    padding: '6px 12px', borderRadius: 6,
                    background: weak ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)',
                    border: `1px solid ${weak ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                    fontSize: 12,
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{tag}: </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 700,
                      color: weak ? 'var(--accent-red)' : s.solved === s.total ? 'var(--accent-green)' : 'var(--accent-yellow)',
                    }}>
                      {s.solved}/{s.total}
                    </span>
                    {weak && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent-red)' }}>
                        review needed
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          borderTop: '1px solid var(--border)', paddingTop: 20,
        }}>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
            }}
          >
            Copy as Markdown
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: 'var(--accent-blue)', color: '#fff',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
