const { execRunner } = require('../src/executor/runner-cjs.js')

// Simple two-sum problem for testing
const TWO_SUM_PROBLEM = {
  id: 'two-sum',
  functionName: 'two_sum',
  exampleCases: [
    { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
    { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] }
  ],
  hiddenCases: []
}

const CORRECT_TWO_SUM = `
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
`

const WRONG_TWO_SUM = `
def two_sum(nums, target):
    return [0, 0]
`

const SYNTAX_ERROR = `
def two_sum(nums target):
    return [0, 1]
`

const RUNTIME_ERROR = `
def two_sum(nums, target):
    return nums[9999]
`

const INFINITE_LOOP = `
def two_sum(nums, target):
    while True:
        pass
`

test('correct solution passes all test cases', async () => {
  const result = await execRunner({ code: CORRECT_TWO_SUM, cases: TWO_SUM_PROBLEM.exampleCases, problem: TWO_SUM_PROBLEM })
  expect(result.error).toBeNull()
  expect(result.results).toHaveLength(2)
  expect(result.results.every(r => r.passed)).toBe(true)
}, 15000)

test('wrong solution fails test cases', async () => {
  const result = await execRunner({ code: WRONG_TWO_SUM, cases: TWO_SUM_PROBLEM.exampleCases, problem: TWO_SUM_PROBLEM })
  expect(result.results.some(r => !r.passed)).toBe(true)
}, 15000)

test('syntax error is captured', async () => {
  const result = await execRunner({ code: SYNTAX_ERROR, cases: TWO_SUM_PROBLEM.exampleCases, problem: TWO_SUM_PROBLEM })
  expect(result.error || (result.results && result.results.some(r => r.error))).toBeTruthy()
}, 15000)

test('runtime error is captured with traceback', async () => {
  const result = await execRunner({ code: RUNTIME_ERROR, cases: TWO_SUM_PROBLEM.exampleCases, problem: TWO_SUM_PROBLEM })
  const hasError = result.error || result.results?.some(r => r.error)
  expect(hasError).toBeTruthy()
}, 15000)

test('infinite loop is killed with TLE message', async () => {
  const result = await execRunner({ code: INFINITE_LOOP, cases: TWO_SUM_PROBLEM.exampleCases, problem: TWO_SUM_PROBLEM })
  expect(result.error).toMatch(/time limit|timeout|killed/i)
}, 15000)

test('stdout is captured', async () => {
  const codeWithPrint = `
def two_sum(nums, target):
    print("checking", nums, target)
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
`
  const result = await execRunner({ code: codeWithPrint, cases: [TWO_SUM_PROBLEM.exampleCases[0]], problem: TWO_SUM_PROBLEM })
  expect(result.results[0].stdout).toContain('checking')
}, 15000)

test('runtime_ms is returned', async () => {
  const result = await execRunner({ code: CORRECT_TWO_SUM, cases: [TWO_SUM_PROBLEM.exampleCases[0]], problem: TWO_SUM_PROBLEM })
  expect(result.results[0].runtime_ms).toBeDefined()
  expect(typeof result.results[0].runtime_ms).toBe('number')
}, 15000)
