const TAG_STYLES = {
  think:   { bg: '#e8f0ff', color: '#2563eb', label: 'Think' },
  act:     { bg: '#fff3e0', color: '#d97706', label: 'Act' },
  observe: { bg: '#f1f5f9', color: '#64748b', label: 'Observe' },
  done:    { bg: '#e8f5e9', color: '#16a34a', label: 'Done' },
  error:   { bg: '#fef2f2', color: '#dc2626', label: 'Error' },
}

function EventRow({ event }) {
  const tag = TAG_STYLES[event.type] || TAG_STYLES.observe
  const text = event.content ?? event.result ?? event.message
    ?? (event.tool ? `${event.tool}(${JSON.stringify(event.args)})` : '')

  return (
    <div style={{
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      padding: '12px 0',
      borderBottom: '1px solid #e8e2d9',
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
        fontWeight: 500,
        flexShrink: 0,
        marginTop: 2,
        whiteSpace: 'nowrap',
      }}>
        {tag.label}
      </span>
      <span style={{
        fontSize: 13,
        color: '#444',
        lineHeight: 1.6,
        fontFamily: '"DM Sans", sans-serif',
        wordBreak: 'break-word',
      }}>
        {text}
      </span>
    </div>
  )
}

export default function AgentStream({ events }) {
  return (
    <div style={{ marginTop: 48 }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        color: '#999',
        marginBottom: 16,
        fontFamily: '"DM Sans", sans-serif',
      }}>
        Agent Trace
      </div>
      {events.map((event, i) => <EventRow key={i} event={event} />)}
    </div>
  )
}
