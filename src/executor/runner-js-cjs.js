// CommonJS wrapper for JS runner — used by Jest tests
const { spawn } = require('child_process')
const { writeFileSync, unlinkSync, existsSync } = require('fs')
const { join } = require('path')
const { tmpdir } = require('os')
const { randomUUID } = require('crypto')

const TIMEOUT_MS = 12000

const HARNESS_TEMPLATE = `\
// === USER CODE START ===
{user_code}
// === USER CODE END ===

const __testCases = JSON.parse(Buffer.from('{test_cases_b64}', 'base64').toString('utf8'));

function __getArgs(fn, inputObj) {
  const src = fn.toString();
  const match = src.match(/^function\\s+\\w+\\s*\\(([^)]*)\\)/m);
  if (!match) return Object.values(inputObj);
  const params = match[1].split(',').map(p => p.trim()).filter(Boolean);
  if (params.length === 0) return [];
  return params.map(p => inputObj[p]);
}

function __deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => __deepEqual(v, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (ka.join(',') !== kb.join(',')) return false;
    return ka.every(k => __deepEqual(a[k], b[k]));
  }
  return false;
}

let __fn;
try { __fn = {function_name}; } catch (e) {}
if (typeof __fn !== 'function') {
  process.stdout.write(JSON.stringify({ results: [], error: 'Function "{function_name}" not found. Make sure your code defines a top-level function with that name.' }) + '\\n');
  process.exit(0);
}

const __results = [];

for (let __i = 0; __i < __testCases.length; __i++) {
  const __tc = __testCases[__i];
  const __logs = [];
  const __origLog = console.log;
  console.log = (...args) => __logs.push(args.map(String).join(' '));

  const __t0 = performance.now();
  try {
    const __args = __getArgs(__fn, __tc.input);
    const __actual = __fn(...__args);
    const __ms = performance.now() - __t0;
    console.log = __origLog;
    let __stdout = __logs.join('\\n');
    if (__stdout.length > 10240) __stdout = __stdout.slice(0, 10240) + '\\n[stdout truncated at 10KB]';
    __results.push({
      index: __i,
      passed: __deepEqual(__actual, __tc.expected),
      input: __tc.input,
      expected: __tc.expected,
      actual: __actual,
      stdout: __stdout,
      runtime_ms: Math.round(__ms * 100) / 100,
      error: null
    });
  } catch (__err) {
    const __ms = performance.now() - __t0;
    console.log = __origLog;
    let __stdout = __logs.join('\\n');
    if (__stdout.length > 10240) __stdout = __stdout.slice(0, 10240) + '\\n[stdout truncated]';
    __results.push({
      index: __i,
      passed: false,
      input: __tc.input,
      expected: __tc.expected,
      actual: null,
      stdout: __stdout,
      runtime_ms: null,
      error: __err.stack || __err.message
    });
  }
}

process.stdout.write(JSON.stringify({ results: __results }) + '\\n');
`

function snakeToCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function detectFunctionName(code, problem) {
  // Try to find the camelCase JS equivalent of the Python function name
  if (problem && problem.functionName) {
    const jsName = snakeToCamel(problem.functionName)
    if (new RegExp(`^function\\s+${jsName}\\s*\\(`, 'm').test(code)) {
      return jsName
    }
  }
  // Fall back to last top-level function declaration
  const matches = [...code.matchAll(/^function\s+(\w+)\s*\(/mg)]
  return matches.length > 0 ? matches[matches.length - 1][1] : null
}

async function execRunnerJs({ code, cases, problem }) {
  const functionName = detectFunctionName(code, problem)
  if (!functionName) {
    return { results: [], error: 'Could not detect JS function name. Make sure your code has a top-level function definition (function functionName(...)).' }
  }

  const tmpId = randomUUID()
  const tmpFile = join(tmpdir(), `leetmonk_js_test_${tmpId}.js`)

  try {
    const harness = HARNESS_TEMPLATE
      .replace('{user_code}', code)
      .replace('{test_cases_b64}', Buffer.from(JSON.stringify(cases)).toString('base64'))
      .replace(/\{function_name\}/g, functionName)

    writeFileSync(tmpFile, harness, 'utf8')
    return await runNode(tmpFile)
  } finally {
    try { if (existsSync(tmpFile)) unlinkSync(tmpFile) } catch {}
  }
}

function runNode(scriptPath) {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let timedOut = false

    const child = spawn('node', [scriptPath])

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, TIMEOUT_MS)

    child.stdout.on('data', d => { stdout += d.toString() })
    child.stderr.on('data', d => { stderr += d.toString() })

    child.on('close', () => {
      clearTimeout(timer)

      if (timedOut) {
        resolve({ results: [], error: 'Time Limit Exceeded (killed after 12s).' })
        return
      }

      if (stderr && !stdout) {
        resolve({ results: [], error: stderr.trim() })
        return
      }

      try {
        const parsed = JSON.parse(stdout.trim())
        resolve({ results: parsed.results, error: parsed.error || null })
      } catch {
        resolve({ results: [], error: stderr || stdout || 'Unknown execution error' })
      }
    })

    child.on('error', err => {
      clearTimeout(timer)
      resolve({ results: [], error: err.message })
    })
  })
}

module.exports = { execRunnerJs }
