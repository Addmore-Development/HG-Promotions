import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'
import LandingPage  from './shared/auth/LandingPage'
import LoginPage    from './shared/auth/LoginPage'
import RegisterPage from './shared/auth/RegisterPage'
import { ViewAcceptJobs } from './promoter/jobs/ViewAcceptJobs'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/jobs"     element={<ViewAcceptJobs />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}