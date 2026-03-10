import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/hooks/useAuth'
import { ROLES, Role } from '@shared/constants/roles'

export default function LoginPage() {
  const { login, role: authRole } = useAuth()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      // Redirect based on role returned from auth
      const redirectMap: Record<Role, string> = {
        [ROLES.PROMOTER]: '/promoter/jobs',
        [ROLES.BUSINESS]: '/business/jobs',
        [ROLES.ADMIN]:    '/admin/jobs',
      }
      navigate(redirectMap[authRole!])
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      {error && <p>{error}</p>}

      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p>
        Don't have an account?{' '}
        <span onClick={() => navigate('/register')}>Register</span>
      </p>
    </div>
  )
}