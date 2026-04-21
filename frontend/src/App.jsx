import { useState, useRef, useEffect } from 'react'
import InputPanel from './components/InputPanel'
import AgentStream from './components/AgentStream'

export default function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const rightRef = useRef(null)

  useEffect(() => {
    if (rightRef.current) {
      rightRef.current.scrollTop = rightRef.current.scrollHeight
    }
  }, [events])

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
      display: 'flex',
      height: '100vh',
      fontFamily: '"DM Sans", sans-serif',
      background: '#faf7f2',
    }}>
      {/* LEFT PANEL — Input */}
      <div style={{
        width: '42%',
        minWidth: 340,
        borderRight: '1.5px solid #e0dbd2',
        padding: '52px 48px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}>
        <div style={{ borderBottom: '2px solid #1a1a1a', paddingBottom: 16, marginBottom: 44 }}>
          <h1 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 30,
            fontWeight: 700,
            color: '#1a1a1a',
            letterSpacing: '-0.5px',
            lineHeight: 1,
            marginBottom: 6,
          }}>
            Repo Agent
          </h1>
          <p style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: '#999' }}>
            Codebase Intelligence
          </p>
        </div>

        <InputPanel onSubmit={handleSubmit} loading={loading} />

        <div style={{ marginTop: 'auto', paddingTop: 40 }}>
          <p style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.3px', lineHeight: 1.7 }}>
            Enter any public GitHub repository URL and describe what you want to know.
            The agent will explore it using real-time GitHub API calls.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — Report */}
      <div
        ref={rightRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '52px 52px 60px',
          background: events.length === 0 ? '#f5f1eb' : '#faf7f2',
          transition: 'background 0.4s',
        }}
      >
        {events.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ccc',
            userSelect: 'none',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>⬡</div>
            <div style={{
              fontSize: 11,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#bbb',
            }}>
              Report will appear here
            </div>
          </div>
        ) : (
          <AgentStream events={events} loading={loading} />
        )}
      </div>
    </div>
  )
}
