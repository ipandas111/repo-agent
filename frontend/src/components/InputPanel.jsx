export default function InputPanel({ onSubmit, loading }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    onSubmit({ github_url: form.get('github_url'), user_request: form.get('user_request') })
  }

  const labelStyle = {
    display: 'block',
    fontSize: 10,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: '#999',
    marginBottom: 6,
    fontFamily: '"DM Sans", sans-serif',
  }

  const inputStyle = {
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
    transition: 'border-color 0.2s',
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Repository URL</label>
        <input
          name="github_url"
          type="url"
          placeholder="https://github.com/owner/repo"
          required
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#1a1a1a'}
          onBlur={e => e.target.style.borderColor = '#ccc'}
        />
      </div>

      <div style={{ marginBottom: 32 }}>
        <label style={labelStyle}>Your Request</label>
        <textarea
          name="user_request"
          placeholder="What do you want to know about this codebase?"
          required
          rows={3}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
          onFocus={e => e.target.style.borderColor = '#1a1a1a'}
          onBlur={e => e.target.style.borderColor = '#ccc'}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          background: loading ? '#888' : '#1a1a1a',
          color: '#faf7f2',
          border: 'none',
          padding: '14px 20px',
          fontSize: 11,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 500,
          transition: 'background 0.2s',
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze \u2192'}
      </button>
    </form>
  )
}
