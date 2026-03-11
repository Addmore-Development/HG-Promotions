import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'
import LandingPage       from './shared/auth/LandingPage'
import LoginPage         from './shared/auth/LoginPage'
import RegisterPage      from './shared/auth/RegisterPage'
import { ViewAcceptJobs } from './promoter/jobs/ViewAcceptJobs'
import BusinessLayout    from './Business/BusinessLayout'
import BusinessDashboard from './Business/Businessdashboard'
import BusinessJobs      from './Business/Businessjobs'
import BusinessTracking  from './Business/Businesstracking'
import BusinessPayroll   from './Business/Businesspayroll'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/jobs"     element={<ViewAcceptJobs />} />

          {/* Business dashboard */}
          <Route path="/business" element={<BusinessLayout />}>
            <Route index          element={<Navigate to="/business/dashboard" replace />} />
            <Route path="dashboard" element={<BusinessDashboard />} />
            <Route path="jobs"      element={<BusinessJobs />} />
            <Route path="tracking"  element={<BusinessTracking />} />
            <Route path="payroll"   element={<BusinessPayroll />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}