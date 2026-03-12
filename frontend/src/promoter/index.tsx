// promoter/index.tsx
// Promoter section shell — rendered by App.tsx at /promoter/*
// Uses React Router v6 nested layout pattern.
// NO onboarding here — that is handled by /register in the auth flow.

import React, { useState, useEffect } from 'react';
import { AppLayout }      from '../shared/layout/AppLayout';
import { Dashboard }      from './dashboard/dashboard';
import { ViewAcceptJobs } from './jobs/ViewAcceptJobs';
import { GeoCheckInOut }  from './shifts/GeoCheckInOut';
import { ViewEarnings }   from './payments/ViewEarnings';
import { EditOwnProfile } from './users/EditOwnProfile';
import { useAuth }        from '../shared/hooks/useAuth';
import { usersService }   from '../shared/services/usersService';
import type { NavItem }   from '../shared/layout/Sidebar';
import type { OnboardingStatus } from '../shared/types/user.types';

type PromoterView = 'dashboard' | 'jobs' | 'shifts' | 'earnings' | 'profile';

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: '🏠' },
  { id: 'jobs',      label: 'Job Feed',   icon: '💼' },
  { id: 'shifts',    label: 'My Shifts',  icon: '📍' },
  { id: 'earnings',  label: 'Earnings',   icon: '💰' },
  { id: 'profile',   label: 'My Profile', icon: '👤' },
];

export const PromoterApp: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<PromoterView>('dashboard');
  const [status, setStatus] = useState<OnboardingStatus | null>(null);

  // Resolve the user's onboarding status from their profile
  useEffect(() => {
    if (!user) return;
    usersService.getProfile(user.id).then(p => {
      setStatus(p?.onboardingStatus ?? 'incomplete');
    });
  }, [user]);

  const handleNavigate = (id: string) => setView(id as PromoterView);

  // Jobs, Shifts, Earnings locked until approved
  const isLocked = status !== null && status !== 'approved';
  const navItems: NavItem[] = NAV.map(item => ({
    ...item,
    locked: isLocked && (item.id === 'jobs' || item.id === 'shifts' || item.id === 'earnings'),
  }));

  return (
    <AppLayout
      title="Promoter Portal"
      navItems={navItems}
      activeNav={view}
      onNavigate={handleNavigate}
    >
      {/* Status banner — only while not yet approved */}
      {isLocked && (
        <div style={{
          padding: '12px 20px', marginBottom: '28px', borderRadius: '12px', cursor: 'pointer',
          background: status === 'rejected' ? 'rgba(239,68,68,0.08)' : 'rgba(212,175,55,0.06)',
          border: `1px solid ${status === 'rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(212,175,55,0.2)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
          onClick={() => handleNavigate('profile')}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: status === 'rejected' ? '#f87171' : '#D4AF37' }}>
            {status === 'pending_review' && '⏳ Your profile is under review — you\'ll be notified within 24–48 hrs.'}
            {status === 'rejected'       && '❌ Your application was rejected. Update your profile and resubmit.'}
            {status === 'incomplete'     && '📝 Complete your profile to unlock job matching.'}
            {status === 'blacklisted'    && '🚫 Your account has been suspended. Contact support.'}
          </span>
          <span style={{ color: '#555', fontSize: '12px' }}>View profile →</span>
        </div>
      )}

      {view === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
      {view === 'jobs'      && <ViewAcceptJobs />}
      {view === 'shifts'    && <GeoCheckInOut />}
      {view === 'earnings'  && <ViewEarnings />}
      {view === 'profile'   && <EditOwnProfile />}
    </AppLayout>
  );
};