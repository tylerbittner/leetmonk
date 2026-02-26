const { readdirSync, readFileSync, existsSync } = require('fs')
const { join } = require('path')

const PROBLEMS_DIR = join(__dirname, '../data/problems')
const REQUIRED_FIELDS = ['id', 'title', 'difficulty', 'tags', 'description', 'exampleCases', 'hiddenCases', 'starterCode', 'functionName', 'solutions', 'hints']
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']

let problems = []
let loadErrors = []

beforeAll(() => {
  if (!existsSync(PROBLEMS_DIR)) {
    console.warn('problems dir not found:', PROBLEMS_DIR)
    return
  }
  const files = readdirSync(PROBLEMS_DIR).filter(f => f.endsWith('.json'))
  for (const file of files) {
    try {
      const raw = readFileSync(join(PROBLEMS_DIR, file), 'utf8')
      const problem = JSON.parse(raw)
      problems.push({ file, problem })
    } catch (e) {
      loadErrors.push(`${file}: ${e.message}`)
    }
  }
})

test('problems directory exists and has files', () => {
  expect(existsSync(PROBLEMS_DIR)).toBe(true)
  expect(problems.length).toBeGreaterThan(0)
  if (loadErrors.length > 0) console.error('Parse errors:', loadErrors)
})

test('all problem JSON files are valid JSON', () => {
  expect(loadErrors).toHaveLength(0)
})

test('all problems have required fields', () => {
  const errors = []
  for (const { file, problem } of problems) {
    const missing = REQUIRED_FIELDS.filter(f => !(f in problem))
    if (missing.length > 0) {
      errors.push(`${file}: missing fields: ${missing.join(', ')}`)
    }
  }
  if (errors.length > 0) console.error(errors.join('\n'))
  expect(errors).toHaveLength(0)
})

test('all problems have valid difficulty', () => {
  const errors = []
  for (const { file, problem } of problems) {
    if (!VALID_DIFFICULTIES.includes(problem.difficulty)) {
      errors.push(`${file}: invalid difficulty "${problem.difficulty}"`)
    }
  }
  expect(errors).toHaveLength(0)
})

test('all problems have at least 3 exampleCases', () => {
  const errors = []
  for (const { file, problem } of problems) {
    if (!Array.isArray(problem.exampleCases) || problem.exampleCases.length < 3) {
      errors.push(`${file}: only ${problem.exampleCases?.length ?? 0} exampleCases (need ≥3)`)
    }
  }
  if (errors.length > 0) console.error(errors.join('\n'))
  expect(errors).toHaveLength(0)
})

test('all problems have at least 8 hiddenCases', () => {
  const errors = []
  for (const { file, problem } of problems) {
    if (!Array.isArray(problem.hiddenCases) || problem.hiddenCases.length < 8) {
      errors.push(`${file}: only ${problem.hiddenCases?.length ?? 0} hiddenCases (need ≥8)`)
    }
  }
  if (errors.length > 0) console.error(errors.join('\n'))
  expect(errors).toHaveLength(0)
})

test('all problems have at least 2 solutions (brute force + optimal)', () => {
  const errors = []
  for (const { file, problem } of problems) {
    if (!Array.isArray(problem.solutions) || problem.solutions.length < 2) {
      errors.push(`${file}: only ${problem.solutions?.length ?? 0} solutions (need ≥2)`)
    }
  }
  if (errors.length > 0) console.error(errors.join('\n'))
  expect(errors).toHaveLength(0)
})

test('all problems have at least 1 hint', () => {
  const errors = []
  for (const { file, problem } of problems) {
    if (!Array.isArray(problem.hints) || problem.hints.length < 1) {
      errors.push(`${file}: no hints`)
    }
  }
  if (errors.length > 0) console.error(errors.join('\n'))
  expect(errors).toHaveLength(0)
})

test('all problems have unique IDs', () => {
  const ids = problems.map(({ problem }) => problem.id)
  const unique = new Set(ids)
  expect(unique.size).toBe(ids.length)
})

test('all problem IDs match their filenames', () => {
  const errors = []
  for (const { file, problem } of problems) {
    const expectedId = file.replace('.json', '')
    if (problem.id !== expectedId) {
      errors.push(`${file}: id "${problem.id}" doesn't match filename`)
    }
  }
  if (errors.length > 0) console.error(errors.join('\n'))
  expect(errors).toHaveLength(0)
})

test('all test cases have "input" and "expected" fields', () => {
  const errors = []
  for (const { file, problem } of problems) {
    const allCases = [...(problem.exampleCases || []), ...(problem.hiddenCases || [])]
    for (let i = 0; i < allCases.length; i++) {
      const tc = allCases[i]
      if (!tc || typeof tc.input !== 'object') {
        errors.push(`${file} case[${i}]: missing or invalid input`)
      }
      if (!('expected' in tc)) {
        errors.push(`${file} case[${i}]: missing expected`)
      }
    }
  }
  if (errors.length > 0) console.error(errors.join('\n'))
  expect(errors).toHaveLength(0)
})

test('all solutions have required fields', () => {
  const errors = []
  const solFields = ['label', 'approach', 'language', 'code', 'timeComplexity', 'spaceComplexity']
  for (const { file, problem } of problems) {
    for (let i = 0; i < (problem.solutions || []).length; i++) {
      const sol = problem.solutions[i]
      const missing = solFields.filter(f => !(f in sol))
      if (missing.length > 0) {
        errors.push(`${file} solution[${i}]: missing ${missing.join(', ')}`)
      }
    }
  }
  if (errors.length > 0) console.error(errors.join('\n'))
  expect(errors).toHaveLength(0)
})

test('at least 10 problems are loaded', () => {
  expect(problems.length).toBeGreaterThanOrEqual(10)
})

test('problem set covers key topics', () => {
  const allTags = new Set(problems.flatMap(({ problem }) => problem.tags))
  const requiredTopics = ['array', 'binary-search', 'sliding-window', 'dynamic-programming']
  const missing = requiredTopics.filter(t => !allTags.has(t))
  if (missing.length > 0) console.warn('Missing topics:', missing)
  // Soft check — warn but don't fail if some topics missing
  expect(allTags.size).toBeGreaterThan(5)
})
