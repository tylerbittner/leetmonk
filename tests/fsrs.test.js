// tests/fsrs.test.js
const { retrievability, processReview, newCardState, previewRatings } = require('../src/renderer/src/fsrs-cjs.js')

describe('newCardState', () => {
  test('returns zero-state with expected shape', () => {
    const s = newCardState()
    expect(s.reps).toBe(0)
    expect(s.lapses).toBe(0)
    expect(s.lastReview).toBeNull()
    expect(s.nextReview).toBeNull()
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
  test('higher stability → higher retrievability at same elapsed time', () => {
    expect(retrievability(20, 10)).toBeGreaterThan(retrievability(5, 10))
  })
})

describe('processReview - new card', () => {
  test('Good rating → stability > 0, difficulty in [1,10], reps=1', () => {
    const state = newCardState()
    const result = processReview(state, 3, new Date())
    expect(result.stability).toBeGreaterThan(0)
    expect(result.difficulty).toBeGreaterThanOrEqual(1)
    expect(result.difficulty).toBeLessThanOrEqual(10)
    expect(result.reps).toBe(1)
    expect(result.lapses).toBe(0)
  })
  test('Easy rating → higher stability than Good', () => {
    const now = new Date()
    const resultGood = processReview(newCardState(), 3, now)
    const resultEasy = processReview(newCardState(), 4, now)
    expect(resultEasy.stability).toBeGreaterThan(resultGood.stability)
  })
  test('nextReview is set to a future date', () => {
    const state = newCardState()
    const now = new Date()
    const result = processReview(state, 3, now)
    expect(new Date(result.nextReview)).toBeInstanceOf(Date)
    expect(new Date(result.nextReview).getTime()).toBeGreaterThan(now.getTime())
  })
  test('lastReview is set to reviewDate', () => {
    const state = newCardState()
    const now = new Date()
    const result = processReview(state, 3, now)
    expect(new Date(result.lastReview).getTime()).toBeCloseTo(now.getTime(), -3)
  })
})

describe('processReview - review card', () => {
  test('Again rating → lapses incremented', () => {
    const state = newCardState()
    const afterFirst = processReview(state, 3, new Date())
    const afterLapse = processReview(afterFirst, 1, new Date())
    expect(afterLapse.lapses).toBe(1)
  })
  test('Good rating → reps incremented, lapses unchanged', () => {
    const state = newCardState()
    const afterFirst = processReview(state, 3, new Date())
    const afterGood = processReview(afterFirst, 3, new Date())
    expect(afterGood.reps).toBe(2)
    expect(afterGood.lapses).toBe(0)
  })
})

describe('previewRatings', () => {
  test('returns 4 entries for ratings 1-4', () => {
    const previews = previewRatings(newCardState(), new Date())
    expect(previews).toHaveLength(4)
    expect(previews.map(p => p.rating)).toEqual([1, 2, 3, 4])
  })
  test('all previews have nextReview and stability > 0', () => {
    const previews = previewRatings(newCardState(), new Date())
    for (const p of previews) {
      expect(p.nextReview).toBeTruthy()
      expect(p.stability).toBeGreaterThan(0)
    }
  })
  test('Easy has longer nextReview than Again', () => {
    const previews = previewRatings(newCardState(), new Date())
    const again = new Date(previews[0].nextReview).getTime()
    const easy = new Date(previews[3].nextReview).getTime()
    expect(easy).toBeGreaterThan(again)
  })
})
