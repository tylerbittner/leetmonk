// CommonJS wrapper for fsrs.js — used by Jest tests only
// Jest cannot process ESM; this uses require() against ts-fsrs CJS build

const { fsrs, State } = require('ts-fsrs')

const f = fsrs()

function stateToCard(state) {
  const card = {
    due: state.nextReview ? new Date(state.nextReview) : new Date(),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: state.reps,
    lapses: state.lapses,
    learning_steps: 0,
    state: state.reps === 0 ? State.New : State.Review,
  }
  if (state.lastReview) {
    card.last_review = new Date(state.lastReview)
  }
  return card
}

function cardToState(card) {
  return {
    difficulty: card.difficulty,
    stability: card.stability,
    reps: card.reps,
    lapses: card.lapses,
    lastReview: card.last_review ? new Date(card.last_review).toISOString() : null,
    nextReview: card.due ? new Date(card.due).toISOString() : null,
  }
}

function newCardState() {
  return {
    difficulty: 5.0,
    stability: 1.0,
    reps: 0,
    lapses: 0,
    lastReview: null,
    nextReview: null,
  }
}

function processReview(state, rating, reviewDate) {
  const card = stateToCard(state)
  const scheduling = f.repeat(card, reviewDate)
  return cardToState(scheduling[rating].card)
}

function previewRatings(state, reviewDate) {
  return [1, 2, 3, 4].map(rating => {
    const result = processReview(state, rating, reviewDate)
    return { rating, nextReview: result.nextReview, stability: result.stability }
  })
}

function retrievability(stability, daysElapsed) {
  return f.forgetting_curve(daysElapsed, stability)
}

module.exports = { newCardState, processReview, previewRatings, retrievability }
