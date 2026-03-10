import { Route } from 'react-router-dom'
import ProtectedRoute    from '@shared/routes/ProtectedRoute'
import { ROLES }         from '@shared/constants/roles'

import ViewAssignedTeam  from './jobs/ViewAssignedTeam'
import MonitorAttendance from './shifts/MonitorAttendance'
import ViewTeamProfiles  from './users/ViewTeamProfiles'
import OnboardingNA      from './onboarding/OnboardingNA'
import PaymentsNoAccess  from './payments/PaymentsNoAccess'

export default function BusinessRoutes() {
  return (
    <Route element={<ProtectedRoute allowedRole={ROLES.BUSINESS} />}>
      <Route path="/business/onboarding" element={<OnboardingNA />} />
      <Route path="/business/jobs"       element={<ViewAssignedTeam />} />
      <Route path="/business/shifts"     element={<MonitorAttendance />} />
      <Route path="/business/payments"   element={<PaymentsNoAccess />} />
      <Route path="/business/users"      element={<ViewTeamProfiles />} />
    </Route>
  )
}