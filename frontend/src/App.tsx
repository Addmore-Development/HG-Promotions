import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'
import LandingPage  from './shared/auth/LandingPage'
import LoginPage    from './shared/auth/LoginPage'
import RegisterPage from './shared/auth/RegisterPage'
import { ViewAcceptJobs } from './promoter/jobs/ViewAcceptJobs.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
<<<<<<< HEAD
          <Route path="*"         element={<Navigate to="/" replace />} />
=======
          <Route path="/jobs" element={<ViewAcceptJobs />} />
          <Route path="*"         element={<Navigate to="/register" replace />} />
>>>>>>> 5d866962da583194fc94524eecc483ae2beaab63
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}