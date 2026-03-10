import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@shared/context/AuthContext'

import LoginPage    from './auth/LoginPage'
import RegisterPage from './auth/RegisterPage'

import PromoterRoutes from './promoter/index'
import BusinessRoutes from './business/index'    // ← was SupervisorRoutes
import AdminRoutes    from './admin/index'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Role routes */}
        <PromoterRoutes />
        <BusinessRoutes />
        <AdminRoutes />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}