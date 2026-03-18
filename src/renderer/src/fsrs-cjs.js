// CommonJS wrapper for fsrs.js — used by Jest tests only
// Jest cannot process ESM; this re-implements the same logic with module.exports

const DECAY = -0.5
const FACTOR = 19.0 / 81.0

const DEFAULT_W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589,
  1.5330, 0.1544, 1.0071, 1.9395, 0.1100, 0.2900, 2.2700, 0.1600,
  2.9898, 0.5100, 0.3921, 0.2921, 0.1284
]

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

function initialStability(rating) {
  return DEFAULT_W[rating - 1]
}

function initialDifficulty(rating) {
  return clamp(DEFAULT_W[4] - Math.exp(DEFAULT_W[5] * (rating - 1)) + 1, 1, 10)
}

function retrievability(stability, daysElapsed) {
  return Math.pow(1 + FACTOR * daysElapsed / stability, DECAY)
}

function nextInterval(stability, desiredRetention = 0.9) {
  const interval = stability / FACTOR * (Math.pow(desiredRetention, 1 / DECAY) - 1)
  return Math.max(1, Math.round(interval))
}

function updateDifficulty(d, rating) {
  const easyInitD = initialDifficulty(4)
  const delta = -DEFAULT_W[6] * (rating - 3)
  const newD = d + delta * ((10 - d) / 9)
  return clamp(DEFAULT_W[7] * easyInitD + (1 - DEFAULT_W[7]) * newD, 1, 10)
}

function stabilityAfterRecall(d, s, r, rating) {
  const hardPenalty = rating === 2 ? DEFAULT_W[15] : 1
  const easyBonus = rating === 4 ? DEFAULT_W[16] : 1
  return s * (
    Math.exp(DEFAULT_W[8]) *
    (11 - d) *
    Math.pow(s, -DEFAULT_W[9]) *
    (Math.exp((1 - r) * DEFAULT_W[10]) - 1) *
    hardPenalty *
    easyBonus
  + 1)
}

function stabilityAfterForget(d, s, r) {
  return (
    DEFAULT_W[11] *
    Math.pow(d, -DEFAULT_W[12]) *
    (Math.pow(s + 1, DEFAULT_W[13]) - 1) *
    Math.exp((1 - r) * DEFAULT_W[14])
  )
}

function newCardState() {
  return {
    difficulty: 5.0,
    stability: 1.0,
    reps: 0,
    lapses: 0,
    lastReview: null,
    nextReview: null
  }
}

function processReview(state, rating, reviewDate) {
  const dateStr = reviewDate.toISOString()
  let newState

  if (state.reps === 0) {
    const s = initialStability(rating)
    const d = initialDifficulty(rating)
    const interval = nextInterval(s)
    const next = new Date(reviewDate)
    next.setDate(next.getDate() + interval)
    newState = {
      difficulty: d,
      stability: s,
      reps: 1,
      lapses: state.lapses,
      lastReview: dateStr,
      nextReview: next.toISOString()
    }
  } else {
    const elapsed = state.lastReview
      ? Math.max(0, (reviewDate - new Date(state.lastReview)) / 86400000)
      : 1
    const r = retrievability(state.stability, elapsed)

    let newS, newD
    if (rating === 1) {
      newS = stabilityAfterForget(state.difficulty, state.stability, r)
      newD = updateDifficulty(state.difficulty, rating)
      const interval = nextInterval(newS)
      const next = new Date(reviewDate)
      next.setDate(next.getDate() + interval)
      newState = {
        difficulty: newD,
        stability: Math.max(0.1, newS),
        reps: state.reps + 1,
        lapses: state.lapses + 1,
        lastReview: dateStr,
        nextReview: next.toISOString()
      }
    } else {
      newS = stabilityAfterRecall(state.difficulty, state.stability, r, rating)
      newD = updateDifficulty(state.difficulty, rating)
      const interval = nextInterval(newS)
      const next = new Date(reviewDate)
      next.setDate(next.getDate() + interval)
      newState = {
        difficulty: newD,
        stability: Math.max(0.1, newS),
        reps: state.reps + 1,
        lapses: state.lapses,
        lastReview: dateStr,
        nextReview: next.toISOString()
      }
    }
  }

  return newState
}

function previewRatings(state, reviewDate) {
  return [1, 2, 3, 4].map(rating => {
    const result = processReview(state, rating, reviewDate)
    return { rating, nextReview: result.nextReview, stability: result.stability }
  })
}

module.exports = {
  DEFAULT_W,
  DECAY,
  FACTOR,
  initialStability,
  initialDifficulty,
  retrievability,
  nextInterval,
  updateDifficulty,
  stabilityAfterRecall,
  stabilityAfterForget,
  newCardState,
  processReview,
  previewRatings,
}
