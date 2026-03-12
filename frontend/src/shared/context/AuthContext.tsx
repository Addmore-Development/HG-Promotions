import { createContext, useState, ReactNode, useEffect } from 'react'
import type { AuthContextType, User, RegisterPayload } from '../types/auth.types'
import { authService } from '../services/authService'
import { MOCK_PROFILES } from '../services/mockData'

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('hg_session')
    if (!raw) {
      setLoading(false)
      return
    }
    try {
      const data = JSON.parse(raw)
      if (data.loggedIn && data.email && data.role) {
        const mockProfile = MOCK_PROFILES.find(
          p => (p as typeof p & { email?: string }).email?.toLowerCase() === data.email?.toLowerCase()
        )
        setUser({
          id:    data.userId || mockProfile?.userId || data.email,
          name:  data.name   || mockProfile?.fullName || data.email,
          email: data.email,
          role:  data.role,
        })
      }
    } catch (e) {
      console.warn('Failed to restore session', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    const loggedInUser = await authService.login(email, password)
    setUser(loggedInUser)
  }

  const register = async (data: RegisterPayload): Promise<void> => {
    const newUser = await authService.register(data)
    setUser(newUser)
  }

  const logout = (): void => {
    authService.logout()
    setUser(null)
  }

  if (loading) {
    return (
      <div style={{
        background: '#080808',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F4EFE6',
        fontFamily: "'DM Sans', system-ui, sans-serif"
      }}>
        Loading...
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        login,
        logout,
        register,
        isAuthenticated: !!user,
        isLoading: loading, // 👈 expose loading state
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}