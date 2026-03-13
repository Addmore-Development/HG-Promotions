import { createContext, useState, ReactNode, useEffect } from 'react'
import type { AuthContextType, User } from '../types/auth.types'
import { authService } from '../services/authService'
import { MOCK_PROFILES } from '../services/mockData'

export const AuthContext = createContext<AuthContextType | null>(null)

function buildUserFromSession(s: any): User | null {
  if (s?.loggedIn && s?.email && s?.role) {
    return { id: s.email, name: s.name, email: s.email, role: s.role }
  }
  return null
}

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

  const login = async (email: string, password: string) => {
    const raw = localStorage.getItem('hg_users')
    const users: any[] = raw ? JSON.parse(raw) : []
    const found = users.find((u: any) => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid email or password.')

    // ── FIX: for business accounts use companyName, for promoters use fullName ──
    const displayName =
      found.role === 'business'
        ? (found.companyName || found.name || email)
        : (found.fullName || found.name || email)

    const session = {
      role:        found.role,
      email:       found.email,
      name:        displayName,
      // ── also store companyName separately so dashboard can read it directly ──
      companyName: found.role === 'business' ? (found.companyName || '') : undefined,
      loggedIn:    true,
      status:      found.status,
    }
    localStorage.setItem('hg_session', JSON.stringify(session))
    setUser({ id: found.email, name: displayName, email: found.email, role: found.role })
  }

  const syncSession = () => {
    const raw = localStorage.getItem('hg_session')
    if (raw) {
      try {
        const u = buildUserFromSession(JSON.parse(raw))
        if (u) setUser(u)
      } catch { /* ignore */ }
    }
  }

  const logout = (): void => {
    authService.logout()
    setUser(null)
    window.location.href = '/'
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
        isAuthenticated: !!user,
        isLoading: loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}