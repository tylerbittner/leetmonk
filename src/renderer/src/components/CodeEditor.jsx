import React, { useRef } from 'react'
import Editor from '@monaco-editor/react'

export default function CodeEditor({ problem, code, language, onChange, onLanguageChange, onRun, onSubmit, onReset, running }) {
  const editorRef = useRef(null)

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRun())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => onSubmit())
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => onReset())
    editor.focus()
  }

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

        <div style={{ flex: 1 }} />

        <button
          className="btn btn-ghost"
          onClick={onReset}
          disabled={running}
          title="Reset to starter code (Cmd+R)"
          style={{ fontSize: 12, padding: '5px 10px' }}
        >
          ↺ Reset
        </button>
        <button
          className="btn btn-ghost"
          onClick={onRun}
          disabled={running}
          title="Run against example cases (Cmd+Enter)"
          style={{ fontSize: 12, padding: '5px 12px' }}
        >
          {running ? <Spinner /> : '▶ Run'}
        </button>
        <button
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
            fontSize: 14,
            fontFamily: "'Fira Code', 'SF Mono', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize,
            insertSpaces: true,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            suggest: {
              showSnippets: true,
              showWords: true
            },
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            renderLineHighlight: 'line',
            cursorStyle: 'line',
            cursorBlinking: 'smooth'
          }}
        />
      </div>
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
