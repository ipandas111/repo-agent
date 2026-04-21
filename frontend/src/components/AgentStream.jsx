import ReactMarkdown from 'react-markdown'

const TAG_STYLES = {
  think:   { bg: '#e8f0ff', color: '#2563eb', label: 'Think' },
  act:     { bg: '#fff3e0', color: '#d97706', label: 'Act' },
  observe: { bg: '#f1f5f9', color: '#64748b', label: 'Observe' },
  done:    { bg: '#e8f5e9', color: '#16a34a', label: 'Done' },
  error:   { bg: '#fef2f2', color: '#dc2626', label: 'Error' },
}

function TraceRow({ event }) {
  const tag = TAG_STYLES[event.type] || TAG_STYLES.observe
  const text = event.content ?? event.message
    ?? (event.tool ? `${event.tool}(${JSON.stringify(event.args)})` : '')

  return (
    <div style={{
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      padding: '10px 0',
      borderBottom: '1px solid #ede8e0',
    }}>
      <span style={{
        display: 'inline-block',
        fontSize: 9,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        padding: '3px 7px',
        background: tag.bg,
        color: tag.color,
        fontFamily: '"DM Sans", sans-serif',
        fontWeight: 600,
        flexShrink: 0,
        marginTop: 2,
        whiteSpace: 'nowrap',
      }}>
        {tag.label}
      </span>
      <span style={{
        fontSize: 12,
        color: '#666',
        lineHeight: 1.6,
        fontFamily: 'monospace',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {text}
      </span>
    </div>
  )
}

const mdComponents = {
  h1: ({ children }) => (
    <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 12, marginTop: 0, letterSpacing: '-0.3px' }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, marginTop: 28, letterSpacing: '-0.2px' }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8, marginTop: 20, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{children}</h3>
  ),
  p: ({ children }) => (
    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.8, fontFamily: '"DM Sans", sans-serif', marginBottom: 10, marginTop: 0 }}>{children}</p>
  ),
  li: ({ children }) => (
    <li style={{ fontSize: 13, color: '#444', lineHeight: 1.8, fontFamily: '"DM Sans", sans-serif', marginBottom: 4 }}>{children}</li>
  ),
  ul: ({ children }) => (
    <ul style={{ paddingLeft: 20, marginBottom: 12, marginTop: 4 }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ paddingLeft: 20, marginBottom: 12, marginTop: 4 }}>{children}</ol>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 600, color: '#1a1a1a' }}>{children}</strong>
  ),
  code: ({ children }) => (
    <code style={{ background: '#f0ede8', padding: '1px 5px', borderRadius: 3, fontSize: 12, fontFamily: 'monospace', color: '#444' }}>{children}</code>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid #e0dbd2', margin: '20px 0' }} />
  ),
}

function FinalReport({ result }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        color: '#999',
        marginBottom: 20,
        fontFamily: '"DM Sans", sans-serif',
      }}>
        分析报告
      </div>
      <ReactMarkdown components={mdComponents}>{result}</ReactMarkdown>
    </div>
  )
}

function FollowupDivider({ round }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '16px 0 8px',
    }}>
      <div style={{ flex: 1, height: '1px', background: '#e0dbd2' }} />
      <span style={{
        fontSize: 9,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: '#bbb',
        fontFamily: '"DM Sans", sans-serif',
        whiteSpace: 'nowrap',
      }}>
        Follow-up {round}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#e0dbd2' }} />
    </div>
  )
}

export default function AgentStream({ events, loading }) {
  // Show the last done event as the report (updated by follow-ups)
  const doneEvents = events.filter(e => e.type === 'done')
  const doneEvent = doneEvents[doneEvents.length - 1] || null
  const traceEvents = events.filter(e => e.type !== 'done')

  return (
    <div>
      {doneEvent && <FinalReport result={doneEvent.result} />}

      {doneEvent && (
        <div style={{ borderTop: '1.5px solid #e0dbd2', marginBottom: 28, paddingTop: 28 }}>
          <div style={{
            fontSize: 10,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: '#bbb',
            fontFamily: '"DM Sans", sans-serif',
            marginBottom: 16,
          }}>
            Agent Trace
          </div>
        </div>
      )}

      {!doneEvent && (
        <div style={{
          fontSize: 10,
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: '#999',
          marginBottom: 16,
          fontFamily: '"DM Sans", sans-serif',
        }}>
          {loading ? 'Analyzing…' : 'Agent Trace'}
        </div>
      )}

      {traceEvents.map((event, i) =>
        event.type === 'followup_divider'
          ? <FollowupDivider key={i} round={event.round} />
          : <TraceRow key={i} event={event} />
      )}

      {loading && (
        <div style={{ padding: '12px 0', fontSize: 14, color: '#bbb' }}>· · ·</div>
      )}
    </div>
  )
}
