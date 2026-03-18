import { useState, useRef, useEffect, useCallback } from 'react'
import { retrievability } from '../fsrs.js'

function formatDaysUntil(nextReview) {
  const now = new Date()
  const review = new Date(nextReview)
  const diffMs = review - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Review now'
  if (diffDays === 1) return 'in 1d'
  return `in ${diffDays}d`
}

function isDue(nextReview) {
  return new Date(nextReview) <= new Date()
}

function getRetPct(srState) {
  if (!srState || !srState.lastReview) return null
  const elapsed = (Date.now() - new Date(srState.lastReview)) / 86400000
  return Math.round(retrievability(srState.stability, elapsed) * 100)
}

export default function ReviewFlag({ problemId, reviewData, srState, onFlag, onDismiss, onResetSr }) {
  const [showPopup, setShowPopup] = useState(false)
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 })
  const popupRef = useRef(null)
  const buttonRef = useRef(null)

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
  const due = flagged && isDue(reviewData.nextReview)
  const retPct = getRetPct(srState)

  const handleClick = () => {
    if (!flagged) {
      onFlag(problemId)
    } else {
      if (!showPopup && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setPopupPos({ top: rect.bottom + 4, left: rect.left })
      }
      setShowPopup(!showPopup)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button
        ref={buttonRef}
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
          {retPct !== null
            ? `${retPct}% · ${formatDaysUntil(reviewData.nextReview)}`
            : formatDaysUntil(reviewData.nextReview)
          }
        </span>
      )}

      {showPopup && flagged && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed',
            top: popupPos.top,
            left: popupPos.left,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: 4,
            zIndex: 1000,
            minWidth: 150,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}
        >
          {[
            { label: 'Reset SR state', action: 'reset' },
            { label: 'Remove flag', action: 'remove' }
          ].map(({ label, action }) => (
            <button
              key={action}
              onClick={() => {
                setShowPopup(false)
                if (action === 'remove') {
                  onDismiss(problemId)
                } else if (action === 'reset') {
                  const nextReview = new Date()
                  nextReview.setDate(nextReview.getDate() + 1)
                  onFlag(problemId, {
                    ...reviewData,
                    interval: 1,
                    nextReview: nextReview.toISOString()
                  })
                  onResetSr && onResetSr(problemId)
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
