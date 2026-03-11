import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './shared/context/AuthContext'
import LandingPage       from './shared/auth/LandingPage'
import LoginPage         from './shared/auth/LoginPage'
import RegisterPage      from './shared/auth/RegisterPage'
import AdminDashboard    from './Admin/dashboard/adminDashboard'
import FullCRUDUsers     from './Admin/users/FullCRUDUsers'
import CRUDJobsLogic     from './Admin/jobs/CRUDJobsLogic'
import ViewLiveMap       from './Admin/shifts/ViewLiveMap'
import ApproveExport     from './Admin/payments/ApproveExport'
import ReviewApproveDocs from './Admin/onboarding/ReviewApproveDocs'
import BusinessLayout    from './Business/BusinessLayout'
import BusinessDashboard from './Business/Businessdashboard'
import BusinessJobs      from './Business/Businessjobs'
import BusinessPayroll   from './Business/Businesspayroll'
import BusinessTracking  from './Business/Businesstracking'
import JobDetailPage     from './shared/jobs/JobDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public ── */}
          <Route path="/"         element={<LandingPage />}   />
          <Route path="/login"    element={<LoginPage />}     />
          <Route path="/register" element={<RegisterPage />}  />

          {/* ── Job Detail (accessible to logged-in promoters + businesses) ── */}
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />

          {/* ── Admin ── */}
          <Route path="/admin"            element={<AdminDashboard />}    />
          <Route path="/admin/users"      element={<FullCRUDUsers />}     />
          <Route path="/admin/jobs"       element={<CRUDJobsLogic />}     />
          <Route path="/admin/map"        element={<ViewLiveMap />}       />
          <Route path="/admin/payments"   element={<ApproveExport />}     />
          <Route path="/admin/onboarding" element={<ReviewApproveDocs />} />

          {/* ── Business ── */}
          <Route path="/business" element={<BusinessLayout />}>
            <Route index             element={<Navigate to="/business/dashboard" replace />} />
            <Route path="dashboard"  element={<BusinessDashboard />} />
            <Route path="jobs"       element={<BusinessJobs />}      />
            <Route path="payroll"    element={<BusinessPayroll />}   />
            <Route path="tracking"   element={<BusinessTracking />}  />
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}