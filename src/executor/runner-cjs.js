// CommonJS wrapper for runner.js — used by Jest tests
const { spawn } = require('child_process')
const { writeFileSync, unlinkSync, existsSync, readFileSync } = require('fs')
const { join } = require('path')
const { tmpdir } = require('os')
const { randomUUID } = require('crypto')

const TIMEOUT_MS = 12000
const harnessTemplate = readFileSync(join(__dirname, 'harness_template.py'), 'utf8')

function detectFunctionName(code) {
  const match = code.match(/^def\s+(\w+)\s*\(/m)
  return match ? match[1] : null
}

async function execRunner({ code, cases, problem }) {
  const functionName = problem.functionName || detectFunctionName(code)
  if (!functionName) {
    return { results: [], error: 'Could not detect function name.' }
  }

  const tmpId = randomUUID()
  const tmpFile = join(tmpdir(), `leetmonk_test_${tmpId}.py`)

  try {
    const harness = harnessTemplate
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
        resolve({ results: parsed.results, error: null })
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

module.exports = { execRunner }
