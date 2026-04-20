import { useState } from 'react'
import InputPanel from './components/InputPanel'
import AgentStream from './components/AgentStream'

export default function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = ({ github_url, user_request }) => {
    setEvents([])
    setLoading(true)

    fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ github_url, user_request })
    }).then(res => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      const read = () => reader.read().then(({ done, value }) => {
        if (done) { setLoading(false); return }
        const text = decoder.decode(value)
        text.split('\n').filter(l => l.startsWith('data: ')).forEach(line => {
          try {
            const event = JSON.parse(line.slice(6))
            setEvents(prev => [...prev, event])
            if (event.type === 'done' || event.type === 'error') setLoading(false)
          } catch {}
        })
        read()
      })
      read()
    }).catch(() => setLoading(false))
  }

  return (
    <div style={{
      maxWidth: 640,
      margin: '0 auto',
      padding: '60px 32px 80px',
      fontFamily: '"DM Sans", sans-serif',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #1a1a1a', paddingBottom: 16, marginBottom: 40 }}>
        <h1 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 32,
          fontWeight: 700,
          color: '#1a1a1a',
          letterSpacing: '-0.5px',
          lineHeight: 1,
          marginBottom: 6,
        }}>
          Repo Agent
        </h1>
        <p style={{ fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase', color: '#999' }}>
          Codebase Intelligence
        </p>
      </div>

      <InputPanel onSubmit={handleSubmit} loading={loading} />
      {events.length > 0 && <AgentStream events={events} />}
    </div>
  )
}
