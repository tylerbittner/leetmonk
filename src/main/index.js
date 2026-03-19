import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs'
import { spawnSync } from 'child_process'
import { execRunner } from '../executor/runner.js'
import { execRunnerJs } from '../executor/runner-js.js'

// Enable remote debugging for E2E tests
if (process.env.E2E_CDP_PORT) {
  app.commandLine.appendSwitch('remote-debugging-port', process.env.E2E_CDP_PORT)
}

const dataDir = process.env.LEETMONK_DATA_DIR
  || (app.isPackaged ? join(process.resourcesPath, 'data') : join(app.getAppPath(), 'data'))

const progressFile = join(dataDir, 'progress.json')
const editorStateFile = join(dataDir, 'editor-state.json')
const sessionsFile = join(dataDir, 'sessions.json')
const reviewFile = join(dataDir, 'review-schedule.json')
const srStateFile = join(dataDir, 'sr-state.json')
const settingsFile = join(dataDir, 'settings.json')

function loadSettings() {
  try {
    if (existsSync(settingsFile)) {
      return JSON.parse(readFileSync(settingsFile, 'utf8'))
    }
  } catch {}
  return {}
}

function saveSettings(data) {
  writeFileSync(settingsFile, JSON.stringify(data, null, 2))
}

function loadReviewData() {
  try {
    if (existsSync(reviewFile)) {
      return JSON.parse(readFileSync(reviewFile, 'utf8'))
    }
  } catch {}
  return {}
}

function saveReviewData(data) {
  writeFileSync(reviewFile, JSON.stringify(data, null, 2))
}

function loadSrState() {
  try {
    if (existsSync(srStateFile)) {
      return JSON.parse(readFileSync(srStateFile, 'utf8'))
    }
  } catch {}
  return {}
}

function saveSrState(data) {
  writeFileSync(srStateFile, JSON.stringify(data, null, 2))
}

function loadSessions() {
  try {
    if (existsSync(sessionsFile)) {
      return JSON.parse(readFileSync(sessionsFile, 'utf8'))
    }
  } catch {}
  return []
}

function saveSessions(data) {
  writeFileSync(sessionsFile, JSON.stringify(data, null, 2))
}

function loadProgress() {
  try {
    if (existsSync(progressFile)) {
      return JSON.parse(readFileSync(progressFile, 'utf8'))
    }
  } catch {}
  return {}
}

function saveProgress(data) {
  writeFileSync(progressFile, JSON.stringify(data, null, 2))
}

function loadEditorState() {
  try {
    if (existsSync(editorStateFile)) {
      return JSON.parse(readFileSync(editorStateFile, 'utf8'))
    }
  } catch {}
  return {}
}

function saveEditorState(data) {
  writeFileSync(editorStateFile, JSON.stringify(data, null, 2))
}

function loadProblems() {
  const problemsDir = join(dataDir, 'problems')
  const problems = []
  const errors = []

  try {
    const files = readdirSync(problemsDir).filter(f => f.endsWith('.json'))
    for (const file of files) {
      try {
        const raw = readFileSync(join(problemsDir, file), 'utf8')
        const problem = JSON.parse(raw)
        // Basic schema validation
        const required = ['id', 'title', 'difficulty', 'tags', 'description', 'exampleCases', 'hiddenCases', 'starterCode', 'solutions', 'hints']
        const missing = required.filter(f => !(f in problem))
        if (missing.length > 0) {
          errors.push(`${file}: missing fields: ${missing.join(', ')}`)
        } else {
          problems.push(problem)
        }
      } catch (e) {
        errors.push(`${file}: parse error: ${e.message}`)
      }
    }
  } catch (e) {
    errors.push(`Cannot read problems dir: ${e.message}`)
  }

  return { problems, errors }
}

function createWindow() {
  // Check Python at startup
  const py3 = spawnSync('python3', ['--version'], { stdio: 'ignore' })
  if (py3.error) {
    const py = spawnSync('python', ['--version'], { stdio: 'ignore' })
    if (py.error) {
      dialog.showErrorBox(
        'Python Not Found',
        'LeetMonk requires Python 3.9 or later.\n\nInstall it with: brew install python3\nor download from: https://python.org'
      )
    }
  }

  const win = new BrowserWindow({
    title: 'LeetMonk',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#1a1a1a',
    titleBarStyle: 'hiddenInset',
    show: process.env.NODE_ENV !== 'test',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (!app.isPackaged) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    if (!process.env.E2E_CDP_PORT && process.env.NODE_ENV !== 'test') {
      win.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  app.setAboutPanelOptions({
    applicationName: 'LeetMonk',
    copyright: 'Copyright © 2026 Tyler Bittner',
    credits: 'github.com/tylerbittner/leetmonk'
  })

  const template = [
    {
      label: app.name,
      submenu: [
        { label: 'About LeetMonk', role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings...',
          accelerator: 'Cmd+,',
          click: () => {
            const win = BrowserWindow.getAllWindows()[0]
            if (win) win.webContents.send('open-settings')
          }
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        { role: 'close' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))

  createWindow()

  // IPC: Load all problems
  ipcMain.handle('load-problems', () => loadProblems())

  // IPC: Run code
  ipcMain.handle('run-code', async (_, { code, problem, mode, language }) => {
    const cases = mode === 'run' ? problem.exampleCases : [...problem.exampleCases, ...problem.hiddenCases]
    const runner = language === 'javascript' ? execRunnerJs : execRunner
    return runner({ code, cases, problem })
  })

  // IPC: Progress
  ipcMain.handle('get-progress', () => loadProgress())
  ipcMain.handle('set-progress', (_, { problemId, data }) => {
    const progress = loadProgress()
    progress[problemId] = { ...progress[problemId], ...data }
    saveProgress(progress)
    return progress
  })

  // IPC: Submission history
  ipcMain.handle('add-submission', (_, { problemId, submission }) => {
    const progress = loadProgress()
    const cur = progress[problemId] || {}
    const submissions = cur.submissions || []
    submissions.unshift(submission)           // newest first
    if (submissions.length > 20) submissions.length = 20  // cap at 20
    progress[problemId] = { ...cur, submissions }
    saveProgress(progress)
    return progress[problemId]
  })

  // IPC: Editor state
  ipcMain.handle('get-editor-state', () => loadEditorState())
  ipcMain.handle('set-editor-state', (_, { problemId, code }) => {
    const state = loadEditorState()
    state[problemId] = code
    saveEditorState(state)
  })

  // IPC: Timer state (stored in editor-state file)
  ipcMain.handle('get-timer-state', () => {
    try {
      const timerFile = join(dataDir, 'timer-state.json')
      if (existsSync(timerFile)) return JSON.parse(readFileSync(timerFile, 'utf8'))
    } catch {}
    return {}
  })
  // IPC: Sessions
  ipcMain.handle('get-sessions', () => loadSessions())
  ipcMain.handle('save-session', (_, session) => {
    const sessions = loadSessions()
    const idx = sessions.findIndex(s => s.id === session.id)
    if (idx >= 0) sessions[idx] = session
    else sessions.unshift(session)
    saveSessions(sessions)
    return sessions
  })

  ipcMain.handle('set-timer-state', (_, data) => {
    const timerFile = join(dataDir, 'timer-state.json')
    writeFileSync(timerFile, JSON.stringify(data, null, 2))
  })

  // IPC: Review schedule (spaced repetition)
  ipcMain.handle('get-review-data', () => loadReviewData())
  ipcMain.handle('set-review-item', (_, { problemId, data }) => {
    const review = loadReviewData()
    review[problemId] = data
    saveReviewData(review)
    return review
  })
  ipcMain.handle('remove-review-item', (_, { problemId }) => {
    const review = loadReviewData()
    delete review[problemId]
    saveReviewData(review)
    return review
  })

  // IPC: FSRS SR state
  ipcMain.handle('get-sr-state', (_, { problemId }) => {
    const state = loadSrState()
    return state[problemId] || null
  })
  ipcMain.handle('set-sr-state', (_, { problemId, data }) => {
    const state = loadSrState()
    if (data === null) {
      delete state[problemId]
    } else {
      state[problemId] = data
    }
    saveSrState(state)
    return state[problemId] || null
  })
  ipcMain.handle('get-all-sr-state', () => loadSrState())

  // IPC: Settings
  ipcMain.handle('get-settings', () => loadSettings())
  ipcMain.handle('set-settings', (_, data) => {
    saveSettings(data)
    return data
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
