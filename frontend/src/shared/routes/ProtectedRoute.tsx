import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Role } from '../constants/roles'

interface Props {
  allowedRole: Role
}

export default function ProtectedRoute({ allowedRole }: Props) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated)        return <Navigate to="/login" replace />
  if (role !== allowedRole)    return <Navigate to="/unauthorized" replace />

  return <Outlet />
}