import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/hooks/useAuth'
import { ROLES, Role } from '@shared/constants/roles'
import { RegisterPayload } from '@shared/types/auth.types'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form,    setForm]    = useState<RegisterPayload>({
    name: '', email: '', password: '', role: ROLES.PROMOTER,
  })
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (field: keyof RegisterPayload, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleRegister = async () => {
    setLoading(true)
    setError(null)
    try {
      await register(form)
      const redirectMap: Record<Role, string> = {
        [ROLES.PROMOTER]: '/promoter/jobs',
        [ROLES.BUSINESS]: '/business/jobs',
        [ROLES.ADMIN]:    '/admin/jobs',
      }
      navigate(redirectMap[form.role])
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Register</h1>

      <input
        placeholder="Full Name"
        value={form.name}
        onChange={e => handleChange('name', e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={e => handleChange('email', e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={e => handleChange('password', e.target.value)}
      />

      <select
        value={form.role}
        onChange={e => handleChange('role', e.target.value)}
      >
        <option value={ROLES.PROMOTER}>Promoter</option>
        <option value={ROLES.BUSINESS}>Business</option>
        <option value={ROLES.ADMIN}>Admin</option>
      </select>

      {error && <p>{error}</p>}

      <button onClick={handleRegister} disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>

      <p>
        Already have an account?{' '}
        <span onClick={() => navigate('/login')}>Login</span>
      </p>
    </div>
  )
}