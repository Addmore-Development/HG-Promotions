import { createContext, useState, ReactNode } from 'react'
import { AuthContextType, User, RegisterPayload } from '../types/auth.types'
import { authService } from '../services/authService'

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string) => {
    const loggedInUser = await authService.login(email, password)
    setUser(loggedInUser)
  }

  const register = async (data: RegisterPayload) => {
    const newUser = await authService.register(data)
    setUser(newUser)
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role ?? null,
      login,
      logout,
      register,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}