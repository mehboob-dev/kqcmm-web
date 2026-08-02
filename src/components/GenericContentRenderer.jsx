import { useState } from 'react'
import ContentView from './ContentView'
import QuickJump from './QuickJump'
import { normalizeGenericContent, cardForItem, toPlainNodes } from './genericContent'

// Renders a normalized card item (plain or master-child).
function Card({ item }) {
  if (item.kind === 'empty') return null
  if (item.kind === 'masterChild') {
    return (
      <div>
        {item.title && (
          <div className="card">
            <div className="card-title">{item.title}</div>
          </div>
        )}
        {item.blocks.map((b, bi) => (
          <div key={bi} className="card card-accent">
            {b.title && <div className="card-title">{b.title}</div>}
            {b.text && <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{b.text}</div>}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="card">
      {item.title && <div className="card-title">{item.title}</div>}
      {item.body && <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{item.body}</div>}
    </div>
  )
}

// Renders arbitrary unknown JSON values as safe plain-text groups/cards.
function PlainNodes({ nodes }) {
  if (!nodes || !nodes.length) return null
  return (
    <div>
      {nodes.map((node, i) => (
        <div key={i} className="card">
          {node.type === 'group' && node.label && <div className="card-title">{node.label}</div>}
          {node.type === 'group' && node.children ? (
            <PlainNodes nodes={node.children} />
          ) : (
            <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{node.label}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// Renders locale fields not handled by the known collection/title/intro schema.
function RenderExtra({ locale }) {
  const skip = ['title', 'intro', 'sections', 'duas', 'items', 'verses', 'lineage', 'paragraphs', 'quickJump']
  const extra = {}
  Object.keys(locale || {}).forEach(k => {
    if (!skip.includes(k)) extra[k] = locale[k]
  })
  if (!Object.keys(extra).length) return null
  return <PlainNodes nodes={toPlainNodes(extra)} />
}

export default function GenericContentRenderer({ content, pageKey }) {
  const [jumpToIdx, setJumpToIdx] = useState()
  const normalized = normalizeGenericContent(content)
  if (!normalized) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No content yet.</p>
  }

  const { title, intro, primary, primaryKey, quickJump } = normalized

  return (
    <div className="content-page">
      {title && <h2 className="page-title">{title}</h2>}
      {intro && <div className="page-section"><p style={{ whiteSpace: 'pre-line' }}>{intro}</p></div>}

      {primary && primary.length > 0 ? (
        <ContentView
          items={primary}
          pageKey={pageKey}
          jumpTo={jumpToIdx}
          renderItem={(item) => <Card item={cardForItem(item)} />}
        />
      ) : (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No content yet.</p>
      )}

      <RenderExtra locale={content} />

      {quickJump && quickJump.length > 0 && primary && (
        <QuickJump
          indices={quickJump}
          sourceItems={primary}
          labelKey={primaryKey === 'duas' ? 'heading' : 'title'}
          onJump={setJumpToIdx}
        />
      )}
    </div>
  )
}
