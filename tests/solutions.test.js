/**
 * Solution Verification Tests
 *
 * For EVERY problem, runs EACH solution against ALL test cases (example + hidden).
 * Every solution must pass every test case. This ensures the solutions, example
 * cases, and hidden edge cases are all consistent and correct.
 */

const { readdirSync, readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { execRunner } = require('../src/executor/runner-cjs.js')

const PROBLEMS_DIR = join(__dirname, '../data/problems')
const TIMEOUT_PER_SOLUTION = 30000  // 30s total per solution

let problems = []

beforeAll(() => {
  if (!existsSync(PROBLEMS_DIR)) return
  const files = readdirSync(PROBLEMS_DIR).filter(f => f.endsWith('.json'))
  for (const file of files) {
    try {
      const problem = JSON.parse(readFileSync(join(PROBLEMS_DIR, file), 'utf8'))
      if (problem.id && problem.functionName && problem.solutions) {
        problems.push(problem)
      }
    } catch {}
  }
  console.log(`Loaded ${problems.length} problems for solution verification`)
})

test('problems are loaded', () => {
  expect(problems.length).toBeGreaterThan(0)
})

// Dynamically create a test for each problem × solution
describe('Solution verification', () => {
  // We can't use dynamic test generation easily in Jest with async, so we do one big test
  test('all solutions pass all test cases', async () => {
    const failures = []

    for (const problem of problems) {
      const allCases = [
        ...(problem.exampleCases || []),
        ...(problem.hiddenCases || [])
      ]

      if (allCases.length === 0) continue

      for (let si = 0; si < problem.solutions.length; si++) {
        const sol = problem.solutions[si]
        if (!sol.code) continue

        const result = await execRunner({
          code: sol.code,
          cases: allCases,
          problem
        })

        if (result.error) {
          failures.push(`[${problem.id}] solution[${si}] "${sol.label}": execution error: ${result.error}`)
          continue
        }

        const failed = result.results.filter(r => !r.passed)
        for (const f of failed) {
          failures.push(
            `[${problem.id}] solution[${si}] "${sol.label}" case[${f.index}]: ` +
            `expected ${JSON.stringify(f.expected)}, got ${JSON.stringify(f.actual)}` +
            (f.error ? ` (error: ${f.error.split('\n')[0]})` : '')
          )
        }
      }
    }

    if (failures.length > 0) {
      console.error('\nSolution verification failures:\n' + failures.join('\n'))
    }
    expect(failures).toHaveLength(0)
  }, 120000)  // 2 min total for all solutions
})
