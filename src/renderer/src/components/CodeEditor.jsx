import React, { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'

export default function CodeEditor({ problem, code, language, onChange, onLanguageChange, onRun, onSubmit, onReset, running, settings, canDiff, onOpenDiff }) {
  const editorRef = useRef(null)
  const vimModeRef = useRef(null)
  const vimStatusRef = useRef(null)

  const fontSize = settings?.editorFontSize ?? 14
  const vimEnabled = settings?.vimKeybindings ?? false

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRun())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => onSubmit())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => onReset())
    editor.focus()
    // Vim init is handled solely by the useEffect below so settings loaded
    // from disk after mount trigger it correctly.
  }

  // Sole vim init/teardown path — runs on mount (after editorRef is set) and
  // whenever vimEnabled changes, including when settings load from disk.
  useEffect(() => {
    if (!editorRef.current) return
    if (vimEnabled) {
      import('monaco-vim').then(mod => {
        const initVimMode = mod.initVimMode || mod.default
        if (initVimMode && vimStatusRef.current && !vimModeRef.current) {
          vimModeRef.current = initVimMode(editorRef.current, vimStatusRef.current)
        }
      }).catch(() => {})
    } else {
      if (vimModeRef.current) {
        vimModeRef.current.dispose()
        vimModeRef.current = null
      }
    }
  }, [vimEnabled, editorRef.current]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep Monaco font size in sync when the setting changes — Monaco's options
  // prop only applies at initial render, so we must call updateOptions directly.
  useEffect(() => {
    if (!editorRef.current) return
    editorRef.current.updateOptions({ fontSize, lineHeight: Math.round(fontSize * 1.6) })
  }, [fontSize])

  // Clean up vim mode on unmount
  useEffect(() => {
    return () => {
      if (vimModeRef.current) {
        vimModeRef.current.dispose()
        vimModeRef.current = null
      }
    }
  }, [])

  const monacoLang = language === 'javascript' ? 'javascript' : 'python'
  const tabSize = language === 'javascript' ? 2 : 4

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0
      }}>
        <select
          data-testid="language-select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          style={{
            fontSize: 12, background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 4, padding: '3px 6px',
            cursor: 'pointer', outline: 'none'
          }}
        >
          <option value="python">Python 3</option>
          <option value="javascript">JavaScript</option>
        </select>
        {vimEnabled && (
          <span style={{ fontSize: 10, color: 'var(--accent-green)', marginLeft: 4, opacity: 0.8 }}>VIM</span>
        )}

        <div style={{ flex: 1 }} />

        <button
          data-testid="btn-reset"
          className="btn btn-ghost"
          onClick={onReset}
          disabled={running}
          title="Reset to starter code (Cmd+R)"
          style={{ fontSize: 12, padding: '5px 10px' }}
        >
          ↺ Reset
        </button>
        <button
          data-testid="btn-run"
          className="btn btn-ghost"
          onClick={onRun}
          disabled={running}
          title="Run against example cases (Cmd+Enter)"
          style={{ fontSize: 12, padding: '5px 12px' }}
        >
          {running ? <Spinner /> : '▶ Run'}
        </button>
        <button
          data-testid="btn-submit"
          className="btn btn-success"
          onClick={onSubmit}
          disabled={running}
          title="Submit against all test cases (Cmd+Shift+Enter)"
          style={{ fontSize: 12, padding: '5px 14px' }}
        >
          {running ? <Spinner /> : '✓ Submit'}
        </button>
      </div>

      {/* Monaco Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language={monacoLang}
          value={code}
          onChange={(val) => onChange(val ?? '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize,
            fontFamily: "'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            lineHeight: Math.round(fontSize * 1.6),
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize,
            insertSpaces: true,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            suggest: { showSnippets: true, showWords: true },
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            renderLineHighlight: 'line',
            cursorStyle: 'line',
            cursorBlinking: 'smooth'
          }}
        />
      </div>

      {/* Vim status bar */}
      <div
        ref={vimStatusRef}
        data-testid="vim-statusbar"
        style={{
          height: vimEnabled ? 22 : 0,
          overflow: 'hidden',
          padding: vimEnabled ? '0 12px' : 0,
          background: 'var(--bg-secondary)',
          borderTop: vimEnabled ? '1px solid var(--border)' : 'none',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-purple)',
          display: 'flex', alignItems: 'center',
          transition: 'height 0.15s',
          flexShrink: 0,
        }}
      />
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 12, height: 12,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}
