const STYLES = {
  think: { background: '#eff6ff', borderLeft: '4px solid #2563eb', label: '🤔 Think', color: '#1e40af' },
  act:   { background: '#fff7ed', borderLeft: '4px solid #ea580c', label: '🔧 Act',   color: '#9a3412' },
  observe: { background: '#f9fafb', borderLeft: '4px solid #6b7280', label: '👁 Observe', color: '#374151' },
  done:  { background: '#f0fdf4', borderLeft: '4px solid #16a34a', label: '✅ Done',  color: '#15803d' },
  error: { background: '#fef2f2', borderLeft: '4px solid #dc2626', label: '❌ Error', color: '#991b1b' },
}

function EventCard({ event }) {
  const style = STYLES[event.type] || STYLES.observe
  const body = event.content ?? event.result ?? event.message
    ?? (event.tool ? `${event.tool}(${JSON.stringify(event.args)})` : '')

  return (
    <div style={{ padding: '12px 16px', marginBottom: 8, borderRadius: 4,
                  background: style.background, borderLeft: style.borderLeft }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: style.color, fontSize: 13 }}>
        {style.label}
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    fontSize: 13, color: '#374151' }}>
        {body}
      </pre>
    </div>
  )
}

export default function AgentStream({ events }) {
  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ marginBottom: 12, fontSize: 16 }}>Agent Trace</h2>
      {events.map((event, i) => <EventCard key={i} event={event} />)}
    </div>
  )
}
