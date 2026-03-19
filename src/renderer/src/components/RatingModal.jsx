// src/renderer/src/components/RatingModal.jsx
import { useEffect, useState } from 'react'
import { previewRatings, newCardState } from '../fsrs.js'

const RATINGS = [
  { value: 1, label: 'Again', sublabel: 'Blanked out', color: 'var(--accent-red, #e05c5c)', testId: 'rate-again' },
  { value: 2, label: 'Hard',  sublabel: 'Struggled',   color: 'var(--accent-orange)',        testId: 'rate-hard' },
  { value: 3, label: 'Good',  sublabel: 'Got it',      color: 'var(--accent-blue)',          testId: 'rate-good' },
  { value: 4, label: 'Easy',  sublabel: 'Effortless',  color: 'var(--accent-green)',         testId: 'rate-easy' },
]

function formatNextReview(isoDate) {
  const now = new Date()
  const next = new Date(isoDate)
  const days = Math.round((next - now) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'in 1 day'
  return `in ${days} days`
}

export default function RatingModal({ problemId, srState, onRate, onDismiss }) {
  const [confirmed, setConfirmed] = useState(null) // { label, nextReview }
  const now = new Date()
  const state = srState || newCardState()
  const previews = previewRatings(state, now)

  useEffect(() => {
    if (confirmed) {
      const t = setTimeout(onDismiss, 1500)
      return () => clearTimeout(t)
    }
  }, [confirmed, onDismiss])

  function handleRate(rating) {
    const preview = previews.find(p => p.rating === rating)
    setConfirmed({ label: RATINGS.find(r => r.value === rating).label, nextReview: preview.nextReview })
    onRate(rating)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={onDismiss}
    >
      <div
        data-testid="rating-modal"
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 28, width: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {confirmed ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ color: 'var(--text-primary)', fontSize: 15, marginBottom: 6 }}>
              Next review {formatNextReview(confirmed.nextReview)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Rated <strong>{confirmed.label}</strong>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              color: 'var(--text-secondary)', fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.8px',
              marginBottom: 20, textAlign: 'center'
            }}>
              How did that feel?
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {RATINGS.map(({ value, label, sublabel, color, testId }) => {
                const preview = previews.find(p => p.rating === value)
                return (
                  <button
                    key={value}
                    data-testid={testId}
                    onClick={() => handleRate(value)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 6, padding: '12px 8px', borderRadius: 6,
                      border: `1px solid ${color}33`,
                      background: `${color}11`,
                      cursor: 'pointer', transition: 'background 0.12s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${color}22`}
                    onMouseLeave={e => e.currentTarget.style.background = `${color}11`}
                  >
                    <span style={{ color, fontSize: 13, fontWeight: 600 }}>{label}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{sublabel}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                      {formatNextReview(preview.nextReview)}
                    </span>
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                onClick={onDismiss}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: 18, cursor: 'pointer', padding: '4px 10px', lineHeight: 1,
                  borderRadius: 4, transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Skip rating"
              >
                ✕
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
