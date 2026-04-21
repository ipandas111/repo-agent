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

function FinalReport({ result }) {
  const lines = result.split('\n')
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
        Repository Report
      </div>

      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />

        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <h2 key={i} style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: 16,
              letterSpacing: '-0.3px',
            }}>
              {line.slice(2, -2)}
            </h2>
          )
        }

        if (line.startsWith('•')) {
          return (
            <div key={i} style={{
              display: 'flex',
              gap: 10,
              fontSize: 13,
              color: '#444',
              lineHeight: 1.8,
              marginBottom: 4,
              fontFamily: '"DM Sans", sans-serif',
            }}>
              <span style={{ color: '#ccc', flexShrink: 0 }}>—</span>
              <span>{line.slice(1).trim()}</span>
            </div>
          )
        }

        return (
          <p key={i} style={{
            fontSize: 13,
            color: '#555',
            lineHeight: 1.8,
            fontFamily: '"DM Sans", sans-serif',
            marginBottom: 4,
          }}>
            {line}
          </p>
        )
      })}
    </div>
  )
}

export default function AgentStream({ events, loading }) {
  const doneEvent = events.find(e => e.type === 'done')
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

      {traceEvents.map((event, i) => <TraceRow key={i} event={event} />)}

      {loading && (
        <div style={{ padding: '12px 0', fontSize: 14, color: '#bbb' }}>· · ·</div>
      )}
    </div>
  )
}
