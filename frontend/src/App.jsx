import { useState, useRef, useEffect } from 'react'
import InputPanel from './components/InputPanel'
import AgentStream from './components/AgentStream'

const MAX_FOLLOWUPS = 3

export default function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [followupsLeft, setFollowupsLeft] = useState(MAX_FOLLOWUPS)
  const rightRef = useRef(null)

  useEffect(() => {
    if (rightRef.current) {
      rightRef.current.scrollTop = rightRef.current.scrollHeight
    }
  }, [events])

  const streamSSE = (url, body, onEvent, onDone) => {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(res => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      const read = () => reader.read().then(({ done, value }) => {
        if (done) { onDone(); return }
        const text = decoder.decode(value)
        text.split('\n').filter(l => l.startsWith('data: ')).forEach(line => {
          try {
            const event = JSON.parse(line.slice(6))
            onEvent(event)
            if (event.type === 'done' || event.type === 'error') onDone()
          } catch {}
        })
        read()
      })
      read()
    }).catch(() => onDone())
  }

  const handleSubmit = ({ github_url, user_request }) => {
    setEvents([])
    setSessionId(null)
    setFollowupsLeft(MAX_FOLLOWUPS)
    setLoading(true)

    streamSSE(
      '/analyze',
      { github_url, user_request },
      (event) => {
        if (event.type === 'session') {
          setSessionId(event.session_id)
        } else {
          setEvents(prev => [...prev, event])
        }
      },
      () => setLoading(false)
    )
  }

  const handleFollowup = (question) => {
    if (!sessionId || followupsLeft <= 0) return
    setFollowupsLeft(n => n - 1)
    setLoading(true)
    setEvents(prev => [...prev, { type: 'followup_divider', round: MAX_FOLLOWUPS - followupsLeft + 1 }])

    streamSSE(
      '/followup',
      { session_id: sessionId, question },
      (event) => setEvents(prev => [...prev, event]),
      () => setLoading(false)
    )
  }

  const hasDone = events.some(e => e.type === 'done')

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: '"DM Sans", sans-serif',
      background: '#faf7f2',
    }}>
      {/* LEFT PANEL */}
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

        {hasDone && !loading && sessionId && followupsLeft > 0 && (
          <FollowupPanel
            followupsLeft={followupsLeft}
            onSubmit={handleFollowup}
          />
        )}

        <div style={{ marginTop: 'auto', paddingTop: 40 }}>
          <p style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.3px', lineHeight: 1.7 }}>
            Enter any public GitHub repository URL and describe what you want to know.
            The agent will explore it using real-time GitHub API calls.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
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

function FollowupPanel({ followupsLeft, onSubmit }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim()) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 36 }}>
      <div style={{
        borderTop: '1.5px solid #e0dbd2',
        paddingTop: 24,
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 10,
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: '#999',
          marginBottom: 4,
          fontFamily: '"DM Sans", sans-serif',
        }}>
          Follow-up
        </div>
        <div style={{ fontSize: 11, color: '#bbb', fontFamily: '"DM Sans", sans-serif' }}>
          {followupsLeft} question{followupsLeft !== 1 ? 's' : ''} remaining
        </div>
      </div>

      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Ask a follow-up question..."
        rows={2}
        style={{
          display: 'block',
          width: '100%',
          border: 'none',
          borderBottom: '1.5px solid #ccc',
          background: 'transparent',
          padding: '8px 0',
          fontSize: 14,
          color: '#1a1a1a',
          fontFamily: '"DM Sans", sans-serif',
          outline: 'none',
          resize: 'none',
          lineHeight: 1.6,
          marginBottom: 16,
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#1a1a1a'}
        onBlur={e => e.target.style.borderColor = '#ccc'}
      />

      <button
        type="submit"
        disabled={!value.trim()}
        style={{
          width: '100%',
          background: value.trim() ? '#1a1a1a' : '#ccc',
          color: '#faf7f2',
          border: 'none',
          padding: '12px 20px',
          fontSize: 11,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          cursor: value.trim() ? 'pointer' : 'not-allowed',
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 500,
          transition: 'background 0.2s',
        }}
      >
        Ask →
      </button>
    </form>
  )
}
