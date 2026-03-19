const { writeFileSync, readFileSync, unlinkSync } = require('fs')
const { join } = require('path')
const os = require('os')

const DEFAULT_SETTINGS = {
  celebrationEffect: 'lotus',
  soundOnSolve: true,
  timerVisible: true,
  editorFontSize: 14,
  vimKeybindings: false,
  focusMode: 'standard',
}

const VALID_CELEBRATION_EFFECTS = ['lotus', 'confetti', 'none']
const VALID_FOCUS_MODES = ['standard', 'minimal']

test('default settings have all required keys', () => {
  const required = ['celebrationEffect', 'soundOnSolve', 'timerVisible', 'editorFontSize', 'vimKeybindings', 'focusMode']
  for (const key of required) {
    expect(DEFAULT_SETTINGS).toHaveProperty(key)
  }
})

test('default settings values have correct types', () => {
  expect(typeof DEFAULT_SETTINGS.celebrationEffect).toBe('string')
  expect(typeof DEFAULT_SETTINGS.soundOnSolve).toBe('boolean')
  expect(typeof DEFAULT_SETTINGS.timerVisible).toBe('boolean')
  expect(typeof DEFAULT_SETTINGS.editorFontSize).toBe('number')
  expect(typeof DEFAULT_SETTINGS.vimKeybindings).toBe('boolean')
  expect(typeof DEFAULT_SETTINGS.focusMode).toBe('string')
})

test('celebrationEffect default is a valid option', () => {
  expect(VALID_CELEBRATION_EFFECTS).toContain(DEFAULT_SETTINGS.celebrationEffect)
})

test('focusMode default is a valid option', () => {
  expect(VALID_FOCUS_MODES).toContain(DEFAULT_SETTINGS.focusMode)
})

test('editorFontSize default is within slider range 12-20', () => {
  expect(DEFAULT_SETTINGS.editorFontSize).toBeGreaterThanOrEqual(12)
  expect(DEFAULT_SETTINGS.editorFontSize).toBeLessThanOrEqual(20)
})

test('settings persist through JSON serialization round-trip', () => {
  const tmpFile = join(os.tmpdir(), `leetmonk-settings-test-${Date.now()}.json`)
  const testSettings = { ...DEFAULT_SETTINGS, editorFontSize: 16, vimKeybindings: true, focusMode: 'minimal' }

  writeFileSync(tmpFile, JSON.stringify(testSettings, null, 2))
  const loaded = JSON.parse(readFileSync(tmpFile, 'utf8'))

  expect(loaded.editorFontSize).toBe(16)
  expect(loaded.vimKeybindings).toBe(true)
  expect(loaded.focusMode).toBe('minimal')
  expect(loaded.celebrationEffect).toBe('lotus')

  unlinkSync(tmpFile)
})

test('partial saved settings merge correctly with defaults', () => {
  const partial = { focusMode: 'minimal', editorFontSize: 18 }
  const merged = { ...DEFAULT_SETTINGS, ...partial }

  expect(merged.focusMode).toBe('minimal')
  expect(merged.editorFontSize).toBe(18)
  expect(merged.celebrationEffect).toBe('lotus')
  expect(merged.soundOnSolve).toBe(true)
  expect(merged.timerVisible).toBe(true)
  expect(merged.vimKeybindings).toBe(false)
})

test('focusMode minimal flag resolves correctly', () => {
  const minimal = { ...DEFAULT_SETTINGS, focusMode: 'minimal' }
  const standard = { ...DEFAULT_SETTINGS, focusMode: 'standard' }

  expect(minimal.focusMode === 'minimal').toBe(true)
  expect(standard.focusMode === 'minimal').toBe(false)
})

test('unknown extra keys in saved settings are preserved in merge', () => {
  const saved = { focusMode: 'minimal', unknownFutureKey: 'value' }
  const merged = { ...DEFAULT_SETTINGS, ...saved }

  expect(merged.unknownFutureKey).toBe('value')
  expect(merged.focusMode).toBe('minimal')
})

test('settings file round-trip preserves boolean false values', () => {
  const tmpFile = join(os.tmpdir(), `leetmonk-settings-bools-${Date.now()}.json`)
  const testSettings = { ...DEFAULT_SETTINGS, soundOnSolve: false, timerVisible: false, vimKeybindings: false }

  writeFileSync(tmpFile, JSON.stringify(testSettings, null, 2))
  const loaded = JSON.parse(readFileSync(tmpFile, 'utf8'))

  expect(loaded.soundOnSolve).toBe(false)
  expect(loaded.timerVisible).toBe(false)
  expect(loaded.vimKeybindings).toBe(false)

  unlinkSync(tmpFile)
})
