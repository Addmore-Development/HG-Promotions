import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface Props {
  allowedRole: string
}

export default function ProtectedRoute({ allowedRole }: Props) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role !== allowedRole) return <Navigate to="/login" replace />

  return <Outlet />
}