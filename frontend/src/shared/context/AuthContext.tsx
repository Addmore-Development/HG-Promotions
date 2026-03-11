import { createContext, useState, ReactNode, useEffect } from 'react'
import type { AuthContextType, User, RegisterPayload } from '../types/auth.types'
import { authService } from '../services/authService'
// Import mock profiles to map email → id (only needed for mock data)
import { MOCK_PROFILES } from '../services/mockData'  // adjust path if needed

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Restore session from localStorage on mount
  useEffect(() => {
    const session = localStorage.getItem('hg_session')
    if (session) {
      try {
        const data = JSON.parse(session)
        if (data.loggedIn && data.email && data.role) {
          // Find the matching mock profile to get the correct user id
          const profile = MOCK_PROFILES.find(p => p.email === data.email)
          const mockUser: User = {
            id: profile?.userId || data.email, // fallback to email if not found
            name: data.name,
            email: data.email,
            role: data.role,
          }
          setUser(mockUser)
        }
      } catch (e) {
        console.warn('Failed to restore session', e)
      }
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
    localStorage.removeItem('hg_session')
    setUser(null)
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}