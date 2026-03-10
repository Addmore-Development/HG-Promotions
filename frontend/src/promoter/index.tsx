import React, { useState, useEffect } from 'react';
import { AppLayout } from '../shared/layout/AppLayout';
import { RegisterUploadDocs } from './onboarding/RegisterUploadDocs';
import { ViewAcceptJobs } from './jobs/ViewAcceptJobs';
import { GeoCheckInOut } from './shifts/GeoCheckInOut';
import { ViewEarnings } from './payments/ViewEarnings';
import { EditOwnProfile } from './users/EditOwnProfile';
import { useAuth } from '../shared/hooks/useAuth';
import { usersService } from '../shared/services/usersService';
import type { NavItem } from '../shared/layout/Sidebar';
import type { OnboardingStatus } from '../shared/types/user.types';

type PromoterView = 'jobs' | 'shifts' | 'earnings' | 'profile' | 'onboarding';

const NAV_ITEMS: NavItem[] = [
  { id: 'jobs',       label: 'Job Feed',    icon: '💼' },
  { id: 'shifts',     label: 'My Shifts',   icon: '📍' },
  { id: 'earnings',   label: 'Earnings',    icon: '💰' },
  { id: 'profile',    label: 'My Profile',  icon: '👤' },
  { id: 'onboarding', label: 'Onboarding',  icon: '📋' },
];

const STATUS_LABELS: Record<OnboardingStatus, string> = {
  incomplete:     'Complete Onboarding',
  pending_review: 'Application Under Review',
  approved:       'Active Promoter',
  rejected:       'Action Required',
  blacklisted:    'Account Suspended',
};

export const PromoterApp: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<PromoterView>('jobs');
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('incomplete');

  useEffect(() => {
    if (!user) return;
    usersService.getProfile(user.id).then(profile => {
      if (profile) {
        setOnboardingStatus(profile.onboardingStatus);
        // New or incomplete users go to onboarding first
        if (profile.onboardingStatus === 'incomplete' || profile.onboardingStatus === 'rejected') {
          setView('onboarding');
        }
      } else {
        setView('onboarding');
      }
    });
  }, [user]);

  const isLocked = onboardingStatus !== 'approved';

  const handleNavigate = (id: string) => {
    // Only allow jobs/shifts/earnings if approved
    if (isLocked && (id === 'jobs' || id === 'shifts' || id === 'earnings')) {
      setView('onboarding');
      return;
    }
    setView(id as PromoterView);
  };

  const navWithBadge: NavItem[] = NAV_ITEMS.map(item => {
    if (item.id === 'onboarding' && onboardingStatus === 'pending_review') {
      return { ...item, badge: 1 };
    }
    return item;
  });

  return (
    <AppLayout
      title="Promoter Portal"
      navItems={navWithBadge}
      activeNav={view}
      onNavigate={handleNavigate}
    >
      {/* Onboarding status banner */}
      {onboardingStatus !== 'approved' && view !== 'onboarding' && (
        <div
          onClick={() => setView('onboarding')}
          style={{
            padding: '12px 20px',
            background: onboardingStatus === 'rejected' ? 'rgba(239,68,68,0.08)' : 'rgba(212,175,55,0.06)',
            border: `1px solid ${onboardingStatus === 'rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(212,175,55,0.2)'}`,
            borderRadius: '12px',
            marginBottom: '28px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: onboardingStatus === 'rejected' ? '#f87171' : '#D4AF37', fontSize: '13px', fontWeight: 600 }}>
            {STATUS_LABELS[onboardingStatus]}
          </span>
          <span style={{ color: '#666', fontSize: '12px' }}>View →</span>
        </div>
      )}

      {view === 'jobs'       && <ViewAcceptJobs />}
      {view === 'shifts'     && <GeoCheckInOut />}
      {view === 'earnings'   && <ViewEarnings />}
      {view === 'profile'    && <EditOwnProfile />}
      {view === 'onboarding' && <RegisterUploadDocs onComplete={() => { setOnboardingStatus('pending_review'); setView('profile'); }} />}
    </AppLayout>
  );
};