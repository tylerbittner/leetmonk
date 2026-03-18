#!/usr/bin/env node
// Adds a `patterns` array to each problem JSON file.
// Run once from project root: node scripts/add-patterns.js

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const problemsDir = join(__dirname, '..', 'data', 'problems')

// Pattern mapping per problem id → array of pattern ids (ordered by relevance)
const PROBLEM_PATTERNS = {
  'best-time-buy-sell':            ['greedy', 'array'],
  'binary-search':                  ['binary-search', 'array'],
  'binary-tree-level-order':        ['breadth-first-search', 'tree'],
  'binary-tree-max-path-sum':       ['depth-first-search', 'dynamic-programming', 'tree'],
  'binary-tree-right-side-view':    ['breadth-first-search', 'depth-first-search', 'tree'],
  'capacity-to-ship-packages':      ['binary-search', 'array'],
  'climbing-stairs':                ['dynamic-programming'],
  'coin-change':                    ['dynamic-programming', 'array'],
  'combination-sum':                ['backtracking', 'array'],
  'construct-binary-tree':          ['depth-first-search', 'tree', 'hash-map'],
  'container-most-water':           ['two-pointers', 'array'],
  'contains-duplicate':             ['hash-map', 'array'],
  'count-connected-components':     ['union-find', 'depth-first-search', 'graph'],
  'counting-bits':                  ['bit-manipulation', 'dynamic-programming'],
  'course-schedule':                ['topological-sort', 'depth-first-search', 'graph'],
  'cutting-ribbons':                ['binary-search', 'array'],
  'daily-temperatures':             ['monotonic-stack', 'array', 'stack'],
  'decode-ways':                    ['dynamic-programming', 'string'],
  'find-minimum-rotated':           ['binary-search', 'array'],
  'graph-valid-tree':               ['union-find', 'depth-first-search', 'graph'],
  'group-anagrams':                 ['hash-map', 'string'],
  'house-robber-ii':                ['dynamic-programming', 'array'],
  'house-robber':                   ['dynamic-programming', 'array'],
  'insert-interval':                ['intervals', 'array'],
  'invert-binary-tree':             ['depth-first-search', 'tree'],
  'jump-game':                      ['greedy', 'array'],
  'koko-eating-bananas':            ['binary-search', 'array'],
  'kth-largest-element':            ['heap', 'array'],
  'kth-smallest-in-bst':           ['binary-search-tree', 'depth-first-search', 'tree'],
  'linked-list-cycle':              ['two-pointers', 'linked-list'],
  'longest-common-prefix':          ['string', 'array'],
  'longest-common-subsequence':     ['dynamic-programming', 'string'],
  'longest-consecutive-sequence':   ['hash-map', 'array'],
  'longest-increasing-subsequence': ['dynamic-programming', 'binary-search', 'array'],
  'longest-palindromic-substring':  ['dynamic-programming', 'two-pointers', 'string'],
  'longest-repeating-char-replacement': ['sliding-window', 'hash-map', 'string'],
  'longest-substring-no-repeat':    ['sliding-window', 'hash-map', 'string'],
  'lowest-common-ancestor-bst':     ['binary-search-tree', 'depth-first-search', 'tree'],
  'max-depth-binary-tree':          ['depth-first-search', 'tree'],
  'max-product-subarray':           ['dynamic-programming', 'array'],
  'maximum-subarray':               ['dynamic-programming', 'greedy', 'array'],
  'meeting-rooms-ii':               ['intervals', 'heap', 'array'],
  'meeting-rooms':                  ['intervals', 'array'],
  'merge-intervals':                ['intervals', 'array'],
  'merge-k-sorted-lists':           ['heap', 'linked-list', 'divide-and-conquer'],
  'merge-sorted-arrays':            ['two-pointers', 'array'],
  'merge-two-sorted-lists':         ['two-pointers', 'linked-list'],
  'minimum-column-average':         ['matrix', 'array'],
  'minimum-window-substring':       ['sliding-window', 'hash-map', 'string'],
  'missing-number':                 ['bit-manipulation', 'array'],
  'move-zeroes':                    ['two-pointers', 'array'],
  'non-overlapping-intervals':      ['intervals', 'greedy', 'array'],
  'number-of-1-bits':               ['bit-manipulation'],
  'number-of-islands':              ['depth-first-search', 'breadth-first-search', 'matrix', 'graph'],
  'pacific-atlantic-water-flow':    ['depth-first-search', 'breadth-first-search', 'matrix', 'graph'],
  'palindromic-substrings':         ['two-pointers', 'dynamic-programming', 'string'],
  'permutations':                   ['backtracking', 'array'],
  'product-except-self':            ['prefix-sum', 'array'],
  'remove-nth-from-end':            ['two-pointers', 'linked-list'],
  'reorder-list':                   ['two-pointers', 'linked-list'],
  'reverse-bits':                   ['bit-manipulation'],
  'reverse-linked-list':            ['linked-list'],
  'rotate-image':                   ['matrix'],
  'same-tree':                      ['depth-first-search', 'tree'],
  'search-2d-matrix':               ['binary-search', 'matrix'],
  'search-rotated-sorted':          ['binary-search', 'array'],
  'set-matrix-zeroes':              ['matrix', 'hash-map'],
  'sliding-window-maximum':         ['monotonic-stack', 'sliding-window', 'array'],
  'spiral-matrix':                  ['matrix', 'array'],
  'split-array-largest-sum':        ['binary-search', 'dynamic-programming', 'array'],
  'subsets':                        ['backtracking', 'array'],
  'subtree-of-another-tree':        ['depth-first-search', 'tree'],
  'sum-of-two-integers':            ['bit-manipulation'],
  'three-sum':                      ['two-pointers', 'array'],
  'top-k-frequent-elements':        ['heap', 'hash-map', 'array'],
  'trapping-rain-water':            ['two-pointers', 'monotonic-stack', 'array'],
  'two-sum-sorted':                 ['two-pointers', 'binary-search', 'array'],
  'two-sum':                        ['hash-map', 'array'],
  'unique-paths':                   ['dynamic-programming', 'matrix'],
  'valid-anagram':                  ['hash-map', 'string'],
  'valid-palindrome':               ['two-pointers', 'string'],
  'valid-parentheses':              ['stack', 'string'],
  'valid-sudoku':                   ['matrix', 'hash-map'],
  'validate-binary-search-tree':    ['binary-search-tree', 'depth-first-search', 'tree'],
  'word-break':                     ['dynamic-programming', 'string'],
  'word-search':                    ['backtracking', 'depth-first-search', 'matrix'],
}

const files = readdirSync(problemsDir).filter(f => f.endsWith('.json'))
let updated = 0
let skipped = 0
let missing = 0

for (const file of files) {
  const id = file.replace('.json', '')
  const path = join(problemsDir, file)
  const problem = JSON.parse(readFileSync(path, 'utf8'))

  const patterns = PROBLEM_PATTERNS[id]
  if (!patterns) {
    console.warn(`⚠  No pattern mapping for: ${id}`)
    missing++
    continue
  }

  // Insert `patterns` after `tags` to keep related fields together
  const newProblem = {}
  for (const [k, v] of Object.entries(problem)) {
    newProblem[k] = v
    if (k === 'tags') {
      newProblem.patterns = patterns
    }
  }
  // In case `tags` wasn't found, still add patterns
  if (!('patterns' in newProblem)) {
    newProblem.patterns = patterns
  }

  writeFileSync(path, JSON.stringify(newProblem, null, 2) + '\n')
  updated++
}

console.log(`✓ Updated ${updated} files, skipped ${skipped}, missing mappings: ${missing}`)
