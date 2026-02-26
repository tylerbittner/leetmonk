import { useState, useRef, useEffect } from 'react'

const INTERVALS = [1, 3, 7, 14, 30]

function getNextInterval(current) {
  const idx = INTERVALS.indexOf(current)
  if (idx === -1 || idx === INTERVALS.length - 1) return 30
  return INTERVALS[idx + 1]
}

function formatDaysUntil(nextReview) {
  const now = new Date()
  const review = new Date(nextReview)
  const diffMs = review - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Review today!'
  if (diffDays === 1) return 'Review in 1d'
  return `Review in ${diffDays}d`
}

function isDue(nextReview) {
  return new Date(nextReview) <= new Date()
}

export default function ReviewFlag({ problemId, reviewData, onFlag, onDismiss }) {
  const [showPopup, setShowPopup] = useState(false)
  const popupRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false)
      }
    }
    if (showPopup) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPopup])

  const flagged = reviewData !== null && reviewData !== undefined

  const handleClick = () => {
    if (!flagged) {
      onFlag(problemId)
    } else {
      setShowPopup(!showPopup)
    }
  }

  const due = flagged && isDue(reviewData.nextReview)

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={handleClick}
        title={flagged ? 'Review options' : 'Flag for review'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          color: flagged
            ? (due ? 'var(--accent-orange)' : 'var(--accent-blue)')
            : 'var(--text-muted)',
          padding: '2px 4px',
          borderRadius: 4,
          transition: 'color 0.15s'
        }}
      >
        {flagged ? '⚑' : '⚐'}
      </button>

      {flagged && (
        <span style={{
          fontSize: 11,
          color: due ? 'var(--accent-orange)' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap'
        }}>
          {formatDaysUntil(reviewData.nextReview)}
        </span>
      )}

      {showPopup && flagged && (
        <div
          ref={popupRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: 4,
            zIndex: 100,
            minWidth: 150,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}
        >
          {[
            { label: 'Mark reviewed', action: 'review' },
            { label: 'Reset interval', action: 'reset' },
            { label: 'Remove flag', action: 'remove' }
          ].map(({ label, action }) => (
            <button
              key={action}
              onClick={() => {
                setShowPopup(false)
                if (action === 'remove') {
                  onDismiss(problemId)
                } else if (action === 'review') {
                  const newInterval = getNextInterval(reviewData.interval)
                  const nextReview = new Date()
                  nextReview.setDate(nextReview.getDate() + newInterval)
                  onFlag(problemId, {
                    ...reviewData,
                    interval: newInterval,
                    nextReview: nextReview.toISOString(),
                    reviewCount: (reviewData.reviewCount || 0) + 1
                  })
                } else if (action === 'reset') {
                  const nextReview = new Date()
                  nextReview.setDate(nextReview.getDate() + 1)
                  onFlag(problemId, {
                    ...reviewData,
                    interval: 1,
                    nextReview: nextReview.toISOString()
                  })
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                background: 'none',
                border: 'none',
                color: action === 'remove' ? 'var(--accent-orange)' : 'var(--text-primary)',
                padding: '6px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: 4,
                fontSize: 13
              }}
              onMouseEnter={e => e.target.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.target.style.background = 'none'}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
