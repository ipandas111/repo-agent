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
        const lines = text.split('\n').filter(l => l.startsWith('data: '))
        lines.forEach(line => {
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
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 24 }}>Repo Agent</h1>
      <InputPanel onSubmit={handleSubmit} loading={loading} />
      {events.length > 0 && <AgentStream events={events} />}
    </div>
  )
}
