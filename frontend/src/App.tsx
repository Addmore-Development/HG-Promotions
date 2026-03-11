import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'
import LoginPage    from './shared/auth/LoginPage'
import RegisterPage from './shared/auth/RegisterPage'
import { ViewAcceptJobs } from './promoter/jobs/ViewAcceptJobs.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/jobs" element={<ViewAcceptJobs />} />
          <Route path="*"         element={<Navigate to="/register" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}