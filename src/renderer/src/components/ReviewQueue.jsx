import { retrievability } from '../fsrs.js'

const DIFFICULTY_COLORS = {
  Easy: 'var(--accent-green)',
  Medium: 'var(--accent-yellow)',
  Hard: 'var(--accent-orange)'
}

function daysDiff(dateStr) {
  const now = new Date()
  const d = new Date(dateStr)
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
}

function formatOverdue(nextReview) {
  const days = daysDiff(nextReview)
  if (days === 0) return 'due today'
  if (days < 0) return `overdue by ${Math.abs(days)}d`
  return `in ${days}d`
}

function getRetrievability(srState) {
  if (!srState || !srState.lastReview) return null
  const elapsed = (Date.now() - new Date(srState.lastReview)) / 86400000
  const r = retrievability(srState.stability, elapsed)
  return Math.round(r * 100)
}

function StatusDot({ nextReview }) {
  const days = daysDiff(nextReview)
  let color
  if (days < 0) color = 'var(--accent-red, #e05c5c)'
  else if (days === 0) color = 'var(--accent-yellow, #e0c050)'
  else color = 'var(--accent-green)'
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6,
      borderRadius: '50%', background: color, flexShrink: 0
    }} />
  )
}

export default function ReviewQueue({ problems, reviewData, srData = {}, onSelect, activeProblemId }) {
  const now = new Date()

  const flagged = Object.entries(reviewData || {}).map(([id, data]) => {
    const problem = problems.find(p => p.id === id)
    if (!problem) return null
    return { ...problem, review: data, sr: srData[id] || null }
  }).filter(Boolean)

  const due = flagged
    .filter(p => new Date(p.review.nextReview) <= now)
    .sort((a, b) => new Date(a.review.nextReview) - new Date(b.review.nextReview))

  const upcoming = flagged
    .filter(p => new Date(p.review.nextReview) > now)
    .sort((a, b) => new Date(a.review.nextReview) - new Date(b.review.nextReview))
    .slice(0, 5)

  const itemStyle = (isActive) => ({
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: 6,
    background: isActive ? 'var(--bg-tertiary)' : 'transparent',
    borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
    transition: 'background 0.15s'
  })

  const renderItem = (p, showTiming) => {
    const retPct = getRetrievability(p.sr)
    return (
      <div
        key={p.id}
        onClick={() => onSelect(p.id)}
        style={itemStyle(p.id === activeProblemId)}
        onMouseEnter={e => { if (p.id !== activeProblemId) e.currentTarget.style.background = 'var(--bg-secondary)' }}
        onMouseLeave={e => { if (p.id !== activeProblemId) e.currentTarget.style.background = 'transparent' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
          <StatusDot nextReview={p.review.nextReview} />
          <span style={{ color: 'var(--text-primary)', fontSize: 13, flex: 1 }}>{p.title}</span>
          <span style={{
            fontSize: 11,
            color: DIFFICULTY_COLORS[p.difficulty] || 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            {p.difficulty}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2, paddingLeft: 12 }}>
          <span>{showTiming}</span>
          {retPct !== null && (
            <span style={{ fontFamily: 'var(--font-mono)' }}>{retPct}% recall</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{
        padding: '0 12px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)'
      }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
          Review Queue
        </span>
        {due.length > 0 && (
          <span style={{
            background: 'var(--accent-orange)',
            color: '#fff',
            fontSize: 11,
            padding: '1px 7px',
            borderRadius: 10,
            fontWeight: 600
          }}>
            {due.length} due
          </span>
        )}
      </div>

      {due.length === 0 && upcoming.length === 0 && (
        <div style={{ padding: '20px 12px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
          No reviews due. Keep practicing!
        </div>
      )}

      {due.length > 0 && (
        <div style={{ padding: '8px 0' }}>
          {due.map(p => renderItem(p, formatOverdue(p.review.nextReview)))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ padding: '4px 0' }}>
          <div style={{
            padding: '4px 12px 4px',
            fontSize: 11,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Upcoming
          </div>
          {upcoming.map(p => renderItem(p, formatOverdue(p.review.nextReview)))}
        </div>
      )}
    </div>
  )
}
