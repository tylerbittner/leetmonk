import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import SolutionsTab from './SolutionsTab.jsx'
import HintsTab from './HintsTab.jsx'
import SubmissionsTab from './SubmissionsTab.jsx'

const diffBg = { easy: 'rgba(34,197,94,0.1)', medium: 'rgba(234,179,8,0.1)', hard: 'rgba(239,68,68,0.1)' }
const diffColor = { easy: 'var(--easy)', medium: 'var(--medium)', hard: 'var(--hard)' }

function MarkdownContent({ children }) {
  return (
    <ReactMarkdown
      className="markdown"
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              customStyle={{ margin: '8px 0', borderRadius: 6, fontSize: 13 }}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>{children}</code>
          )
        }
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

export default function ProblemDescription({ problem, submissions = [] }) {
  const [activeTab, setActiveTab] = useState('description')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {problem.title}
          </h1>
          <span style={{
            padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
            background: diffBg[problem.difficulty],
            color: diffColor[problem.difficulty],
            border: `1px solid ${diffColor[problem.difficulty]}40`,
            textTransform: 'capitalize'
          }}>
            {problem.difficulty}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {problem.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        {problem.lcEquivalent && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            LC: {problem.lcEquivalent}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ flexShrink: 0 }}>
        {[
          { id: 'description', label: 'Description' },
          { id: 'hints', label: 'Hints', count: problem.hints?.length },
          { id: 'solutions', label: 'Solutions' },
          { id: 'submissions', label: 'Submissions', count: submissions.length || null },
        ].map(({ id, label, count }) => (
          <div
            key={id}
            className={`tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
            {count > 0 && (
              <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                ({count})
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {activeTab === 'description' && (
          <div>
            <MarkdownContent>{problem.description}</MarkdownContent>

            {/* Example cases */}
            {problem.exampleCases && problem.exampleCases.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Example Cases
                </h3>
                {problem.exampleCases.map((tc, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 13
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, fontSize: 11 }}>
                      Example {i + 1}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Input: </span>
                        <span style={{ color: 'var(--text-primary)' }}>{formatInput(tc.input)}</span>
                      </div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Output: </span>
                        <span style={{ color: 'var(--accent-green)' }}>{JSON.stringify(tc.expected)}</span>
                      </div>
                      {tc.explanation && (
                        <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Explanation: </span>{tc.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'hints' && (
          <HintsTab hints={problem.hints || []} />
        )}

        {activeTab === 'solutions' && (
          <SolutionsTab solutions={problem.solutions} />
        )}

        {activeTab === 'submissions' && (
          <SubmissionsTab submissions={submissions} />
        )}
      </div>
    </div>
  )
}

function formatInput(input) {
  return Object.entries(input)
    .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
    .join(', ')
}
