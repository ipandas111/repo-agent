export default function InputPanel({ onSubmit, loading }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    onSubmit({
      github_url: form.get('github_url'),
      user_request: form.get('user_request')
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        name="github_url"
        placeholder="https://github.com/owner/repo"
        required
        style={{ padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
      />
      <textarea
        name="user_request"
        placeholder="What do you want to know about this repo?"
        required
        rows={3}
        style={{ padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{ padding: '10px 20px', background: '#2563eb', color: 'white',
                 border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  )
}
