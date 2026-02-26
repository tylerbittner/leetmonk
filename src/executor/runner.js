import { spawn } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

const TIMEOUT_MS = 10000

// Harness inlined so it survives electron-vite bundling (no runtime readFileSync needed)
const HARNESS_TEMPLATE = `\
import json as _json, sys, io, traceback, time, base64

# ===== USER CODE START =====
{user_code}
# ===== USER CODE END =====

test_cases = _json.loads(base64.b64decode("{test_cases_b64}").decode("utf-8"))
function_name = "{function_name}"

results = []

for i, tc in enumerate(test_cases):
    captured = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = captured
    try:
        start = time.perf_counter()
        fn = globals()[function_name]
        actual = fn(**tc["input"])
        elapsed = time.perf_counter() - start
        sys.stdout = old_stdout
        stdout_val = captured.getvalue()
        if len(stdout_val) > 10240:
            stdout_val = stdout_val[:10240] + "\\n[stdout truncated at 10KB]"
        passed = actual == tc["expected"]
        results.append({
            "index": i,
            "passed": passed,
            "input": tc["input"],
            "expected": tc["expected"],
            "actual": actual,
            "stdout": stdout_val,
            "runtime_ms": round(elapsed * 1000, 2),
            "error": None
        })
    except Exception as e:
        sys.stdout = old_stdout
        stdout_val = captured.getvalue()
        if len(stdout_val) > 10240:
            stdout_val = stdout_val[:10240] + "\\n[stdout truncated]"
        results.append({
            "index": i,
            "passed": False,
            "input": tc["input"],
            "expected": tc["expected"],
            "actual": None,
            "stdout": stdout_val,
            "runtime_ms": None,
            "error": traceback.format_exc()
        })

sys.stdout = sys.__stdout__
print(_json.dumps({"results": results}))
`

function detectFunctionName(code) {
  const match = code.match(/^def\s+(\w+)\s*\(/m)
  return match ? match[1] : null
}

export async function execRunner({ code, cases, problem }) {
  const functionName = problem.functionName || detectFunctionName(code)
  if (!functionName) {
    return {
      results: [],
      error: 'Could not detect function name. Make sure your code has a top-level function definition (def function_name(...)).'
    }
  }

  const tmpId = randomUUID()
  const tmpFile = join(tmpdir(), `leetmonk_${tmpId}.py`)

  try {
    const harness = HARNESS_TEMPLATE
      .replace('{user_code}', code)
      .replace('{test_cases_b64}', Buffer.from(JSON.stringify(cases)).toString('base64'))
      .replace('{function_name}', functionName)

    writeFileSync(tmpFile, harness, 'utf8')
    return await runPython(tmpFile)
  } finally {
    try { if (existsSync(tmpFile)) unlinkSync(tmpFile) } catch {}
  }
}

function runPython(scriptPath) {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let timedOut = false

    const pythonBin = process.platform === 'win32' ? 'python' : 'python3'
    const child = spawn(pythonBin, [scriptPath], {
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }
    })

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, TIMEOUT_MS)

    child.stdout.on('data', (data) => { stdout += data.toString() })
    child.stderr.on('data', (data) => { stderr += data.toString() })

    child.on('close', () => {
      clearTimeout(timer)

      if (timedOut) {
        resolve({ results: [], error: 'Time Limit Exceeded (10s). Check for infinite loops.' })
        return
      }

      if (stderr && !stdout) {
        resolve({ results: [], error: stderr.trim() })
        return
      }

      try {
        const parsed = JSON.parse(stdout.trim())
        resolve({ results: parsed.results, error: null, stderr: stderr || null })
      } catch {
        resolve({ results: [], error: stderr || stdout || 'Unknown execution error' })
      }
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      if (err.code === 'ENOENT') {
        resolve({
          results: [],
          error: 'Python 3 not found. Please install Python 3.9+ and ensure `python3` is in your PATH.'
        })
      } else {
        resolve({ results: [], error: err.message })
      }
    })
  })
}
