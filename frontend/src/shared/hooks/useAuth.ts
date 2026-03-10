import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { AuthContextType } from '../types/auth.types'

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}