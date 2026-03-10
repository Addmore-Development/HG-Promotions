import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  return (
    <div style={{ color: '#fff', textAlign: 'center', marginTop: '20vh' }}>
      <h2>Login Page</h2>
      <p style={{ color: '#555' }}>Coming soon</p>
      <button
        onClick={() => navigate('/register')}
        style={{ color: '#ffbe32', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Go to Register →
      </button>
    </div>
  )
}