import React, { useState } from 'react'

export default function FilterBar({ filters, onFiltersChange, allTags, problems, progress }) {
  const [tagOpen, setTagOpen] = useState(false)

  const update = (patch) => onFiltersChange({ ...filters, ...patch })

  const solvedCount = Object.values(progress).filter(p => p.status === 'solved').length
  const total = problems.length

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      {/* Search */}
      <input
        type="text"
        placeholder="Search problems…"
        value={filters.search}
        onChange={e => update({ search: e.target.value })}
        style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '5px 10px', color: 'var(--text-primary)',
          fontSize: 12, outline: 'none', width: 160
        }}
      />

      {/* Difficulty filter */}
      <select
        value={filters.difficulty}
        onChange={e => update({ difficulty: e.target.value })}
        style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '5px 8px', color: 'var(--text-primary)',
          fontSize: 12, outline: 'none', cursor: 'pointer'
        }}
      >
        <option value="all">All Difficulties</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={e => update({ status: e.target.value })}
        style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '5px 8px', color: 'var(--text-primary)',
          fontSize: 12, outline: 'none', cursor: 'pointer'
        }}
      >
        <option value="all">All Status</option>
        <option value="solved">Solved</option>
        <option value="unsolved">Unsolved</option>
      </select>

      {/* Tags filter */}
      <div style={{ position: 'relative' }}>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: '5px 10px' }}
          onClick={() => setTagOpen(o => !o)}
        >
          Topics {filters.tags.length > 0 && `(${filters.tags.length})`}
        </button>
        {tagOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 100,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 8, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            maxHeight: 300, overflow: 'auto', marginTop: 4
          }}>
            {filters.tags.length > 0 && (
              <button
                onClick={() => update({ tags: [] })}
                style={{ color: 'var(--accent-blue)', background: 'none', border: 'none', fontSize: 11, cursor: 'pointer', marginBottom: 6 }}
              >
                Clear all
              </button>
            )}
            {allTags.map(tag => (
              <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px', cursor: 'pointer', borderRadius: 4 }}>
                <input
                  type="checkbox"
                  checked={filters.tags.includes(tag)}
                  onChange={e => {
                    update({ tags: e.target.checked ? [...filters.tags, tag] : filters.tags.filter(t => t !== tag) })
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tag}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
        {solvedCount}/{total} solved
      </span>

      {tagOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setTagOpen(false)} />
      )}
    </div>
  )
}
