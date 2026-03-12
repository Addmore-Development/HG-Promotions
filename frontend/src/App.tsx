import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }      from './shared/context/AuthContext'
import LandingPage           from './shared/auth/LandingPage'
import LoginPage             from './shared/auth/LoginPage'
import RegisterPage          from './shared/auth/RegisterPage'
import AdminDashboard        from './Admin/dashboard/adminDashboard'
import FullCRUDUsers         from './Admin/users/FullCRUDUsers'
import CRUDJobsLogic         from './Admin/jobs/CRUDJobsLogic'
import ViewLiveMap           from './Admin/shifts/ViewLiveMap'
import ApproveExport         from './Admin/payments/ApproveExport'
import ReviewApproveDocs     from './Admin/onboarding/ReviewApproveDocs'
import { PromoterApp }      from './promoter/index'
import { Dashboard }         from './promoter/dashboard/dashboard'
import { ViewAcceptJobs }    from './promoter/jobs/ViewAcceptJobs'
import { RegisterUploadDocs } from './promoter/onboarding/RegisterUploadDocs' 
import { ViewEarnings }      from './promoter/payments/ViewEarnings'
import { GeoCheckInOut }     from './promoter/shifts/GeoCheckInOut' 
import { EditOwnProfile }    from './promoter/users/EditOwnProfile' 
import JobDetailPage         from './shared/jobs/JobdetailPage'
import BusinessLayout        from './Business/BusinessLayout'
import BusinessDashboard     from './Business/Businessdashboard'
import BusinessJobs          from './Business/Businessjobs'
import BusinessTracking      from './Business/Businesstracking'
import BusinessPayroll       from './Business/Businesspayroll'
import JobsPage              from './shared/jobs/JobsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public ── */}
          <Route path="/"         element={<LandingPage />}  />
          <Route path="/login"    element={<LoginPage />}    />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Jobs (public browse with T&C + payment demo) ── */}
          <Route path="/jobs"        element={<JobsPage />}      />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />

          {/* ── Promoter ── */}
          <Route path="/promoter/" element={<PromoterApp />} />
          <Route path="/promoter/dashboard" element={<Dashboard />} />
          <Route path="/promoter/jobs" element={<ViewAcceptJobs />} />
          <Route path="/promoter/onboarding" element={<RegisterUploadDocs />} />
          <Route path="/promoter/payments" element={<ViewEarnings />} />
          <Route path="/promoter/shifts" element={<GeoCheckInOut />} />
          <Route path="/promoter/user" element={<EditOwnProfile />} />

          {/* ── Admin ── */}
          <Route path="/admin"            element={<AdminDashboard />}    />
          <Route path="/admin/users"      element={<FullCRUDUsers />}     />
          <Route path="/admin/jobs"       element={<CRUDJobsLogic />}     />
          <Route path="/admin/map"        element={<ViewLiveMap />}       />
          <Route path="/admin/payments"   element={<ApproveExport />}     />
          <Route path="/admin/onboarding" element={<ReviewApproveDocs />} />

          {/* ── Business ── */}
          <Route path="/business" element={<BusinessLayout />}>
            <Route index            element={<Navigate to="/business/dashboard" replace />} />
            <Route path="dashboard" element={<BusinessDashboard />} />
            <Route path="jobs"      element={<BusinessJobs />}      />
            <Route path="tracking"  element={<BusinessTracking />}  />
            <Route path="payroll"   element={<BusinessPayroll />}   />
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}