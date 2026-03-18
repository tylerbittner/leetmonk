// tests/fsrs.test.js
const {
  initialStability,
  initialDifficulty,
  retrievability,
  nextInterval,
  updateDifficulty,
  stabilityAfterRecall,
  stabilityAfterForget,
  processReview,
  DEFAULT_W,
  newCardState,
} = require('../src/renderer/src/fsrs.js')

describe('FSRS constants', () => {
  test('DEFAULT_W has 21 elements', () => {
    expect(DEFAULT_W).toHaveLength(21)
    expect(DEFAULT_W[0]).toBeCloseTo(0.4072, 4)
    expect(DEFAULT_W[3]).toBeCloseTo(15.4722, 4)
  })
})

describe('initialStability', () => {
  test('rating 1 (Again) → w[0]', () => {
    expect(initialStability(1)).toBeCloseTo(DEFAULT_W[0], 4)
  })
  test('rating 3 (Good) → w[2] = 3.1262', () => {
    expect(initialStability(3)).toBeCloseTo(3.1262, 4)
  })
  test('rating 4 (Easy) → w[3] = 15.4722', () => {
    expect(initialStability(4)).toBeCloseTo(15.4722, 4)
  })
})

describe('initialDifficulty', () => {
  test('clamped between 1 and 10', () => {
    for (let r = 1; r <= 4; r++) {
      const d = initialDifficulty(r)
      expect(d).toBeGreaterThanOrEqual(1)
      expect(d).toBeLessThanOrEqual(10)
    }
  })
  test('rating 4 (Easy) gives lowest difficulty', () => {
    expect(initialDifficulty(4)).toBeLessThan(initialDifficulty(1))
  })
})

describe('retrievability', () => {
  test('at t=0 → 1.0', () => {
    expect(retrievability(10, 0)).toBeCloseTo(1.0, 4)
  })
  test('decreases over time', () => {
    const r1 = retrievability(10, 5)
    const r2 = retrievability(10, 10)
    expect(r1).toBeGreaterThan(r2)
  })
  test('at desired_retention=0.9, interval ≈ stability', () => {
    const S = 10
    const interval = nextInterval(S)
    expect(retrievability(S, interval)).toBeGreaterThan(0.85)
    expect(retrievability(S, interval)).toBeLessThan(0.95)
  })
})

describe('nextInterval', () => {
  test('minimum 1 day', () => {
    expect(nextInterval(0.001)).toBe(1)
  })
  test('for stability=3.1262, interval ≈ 3 days at 0.9 retention', () => {
    const iv = nextInterval(3.1262)
    expect(iv).toBeGreaterThanOrEqual(3)
    expect(iv).toBeLessThanOrEqual(4)
  })
  test('for stability=15.4722, interval ≈ 15 days at 0.9 retention', () => {
    const iv = nextInterval(15.4722)
    expect(iv).toBeGreaterThanOrEqual(14)
    expect(iv).toBeLessThanOrEqual(16)
  })
})

describe('processReview - new card', () => {
  test('Good rating → stability = w[2]', () => {
    const state = newCardState()
    const result = processReview(state, 3, new Date())
    expect(result.stability).toBeCloseTo(3.1262, 4)
    expect(result.reps).toBe(1)
    expect(result.lapses).toBe(0)
  })
  test('Easy rating → stability = w[3]', () => {
    const state = newCardState()
    const result = processReview(state, 4, new Date())
    expect(result.stability).toBeCloseTo(15.4722, 4)
  })
  test('Again rating → lapses incremented on existing card', () => {
    const state = newCardState()
    const afterFirst = processReview(state, 3, new Date())
    const afterLapse = processReview(afterFirst, 1, new Date())
    expect(afterLapse.lapses).toBe(1)
  })
  test('nextReview is set to a future date', () => {
    const state = newCardState()
    const result = processReview(state, 3, new Date())
    expect(new Date(result.nextReview)).toBeInstanceOf(Date)
    expect(new Date(result.nextReview).getTime()).toBeGreaterThan(Date.now())
  })
})
