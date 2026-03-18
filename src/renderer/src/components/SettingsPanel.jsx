import React from 'react'

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-label={value ? 'On' : 'Off'}
      style={{
        width: 38, height: 22, borderRadius: 11, flexShrink: 0,
        background: value ? 'var(--accent-green)' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: value ? 19 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        display: 'block',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      padding: '16px 0 6px',
    }}>
      {children}
    </div>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '9px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{description}</div>
        )}
      </div>
      {children}
    </div>
  )
}

function StyledSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '5px 10px',
        fontSize: 13,
        cursor: 'pointer',
        outline: 'none',
        minWidth: 148,
        flexShrink: 0,
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

const DEFAULT_SETTINGS = {
  celebrationEffect: 'lotus',
  soundOnSolve: true,
  timerVisible: true,
  editorFontSize: 14,
  vimKeybindings: false,
  focusMode: 'standard',
}

export default function SettingsPanel({ settings, onSettingsChange, onClose }) {
  const s = { ...DEFAULT_SETTINGS, ...settings }

  function update(key, value) {
    const next = { ...s, [key]: value }
    onSettingsChange(next)
    window.api.setSettings(next)
  }

  return (
    <div
      onClick={onClose}
      className="overlay-enter"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-enter"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: 440,
          maxWidth: '92vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Settings
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 18, lineHeight: 1,
              padding: '2px 6px', borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '4px 24px 24px' }}>

          {/* Editor section */}
          <SectionLabel>Editor</SectionLabel>

          <SettingRow
            label="Font size"
            description={`${s.editorFontSize}px`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>12</span>
              <input
                type="range"
                min={12}
                max={20}
                step={1}
                value={s.editorFontSize}
                onChange={e => update('editorFontSize', Number(e.target.value))}
                style={{ width: 100, accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>20</span>
            </div>
          </SettingRow>

          <SettingRow
            label="Vim keybindings"
            description="Modal editing with Vim motions"
          >
            <Toggle value={s.vimKeybindings} onChange={v => update('vimKeybindings', v)} />
          </SettingRow>

          {/* Display section */}
          <SectionLabel>Display</SectionLabel>

          <SettingRow
            label="Timer visible"
            description="Show per-problem timer in the top bar"
          >
            <Toggle value={s.timerVisible} onChange={v => update('timerVisible', v)} />
          </SettingRow>

          <SettingRow
            label="Focus mode"
            description="Minimal hides the status bar for fewer distractions"
          >
            <StyledSelect
              value={s.focusMode}
              onChange={v => update('focusMode', v)}
              options={[
                { value: 'standard', label: 'Standard' },
                { value: 'minimal', label: 'Minimal' },
              ]}
            />
          </SettingRow>

          {/* Celebration section */}
          <SectionLabel>On Solve</SectionLabel>

          <SettingRow
            label="Celebration effect"
            description="Visual reward when all tests pass"
          >
            <StyledSelect
              value={s.celebrationEffect}
              onChange={v => update('celebrationEffect', v)}
              options={[
                { value: 'lotus', label: 'Lotus Petals' },
                { value: 'confetti', label: 'Confetti' },
                { value: 'none', label: 'None' },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Sound on solve"
            description="Meditation bell when you pass all tests"
          >
            <Toggle value={s.soundOnSolve} onChange={v => update('soundOnSolve', v)} />
          </SettingRow>

        </div>
      </div>
    </div>
  )
}
