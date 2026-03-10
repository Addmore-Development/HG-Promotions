import { User, RegisterPayload } from '../types/auth.types'

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Replace with real API call
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Login failed')
    return res.json()
  },

  register: async (data: RegisterPayload): Promise<User> => {
    // Replace with real API call
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Registration failed')
    return res.json()
  },

  logout: async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' })
  },
}
