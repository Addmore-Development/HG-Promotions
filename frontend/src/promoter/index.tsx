// promoter/index.tsx
// Promoter portal shell.
// Status is read directly from localStorage hg_session — no async wait.
// Only 'blacklisted' accounts are hard-locked. All others can browse freely.
// pending_review / rejected users see an informational banner only.

import React, { useState, useEffect } from 'react';
import { AppLayout }      from '../shared/layout/AppLayout';
import { Dashboard }      from './dashboard/dashboard';
import { ViewAcceptJobs } from './jobs/ViewAcceptJobs';
import { GeoCheckInOut }  from './shifts/GeoCheckInOut';
import { ViewEarnings }   from './payments/ViewEarnings';
import { EditOwnProfile } from './users/EditOwnProfile';
import { useAuth }        from '../shared/hooks/useAuth';
import type { NavItem }   from '../shared/layout/Sidebar';

type PromoterView = 'dashboard' | 'jobs' | 'shifts' | 'earnings' | 'profile';

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: '🏠' },
  { id: 'jobs',      label: 'Job Feed',   icon: '💼' },
  { id: 'shifts',    label: 'My Shifts',  icon: '📍' },
  { id: 'earnings',  label: 'Earnings',   icon: '💰' },
  { id: 'profile',   label: 'My Profile', icon: '👤' },
];

/** Read status directly from localStorage — synchronous, no flicker */
function getSessionStatus(): string {
  try {
    const sess = JSON.parse(localStorage.getItem('hg_session') || '{}');
    return sess.status || 'pending_review';
  } catch {
    return 'pending_review';
  }
}

export const PromoterApp: React.FC = () => {
  const { user } = useAuth();
  const [view,   setView]   = useState<PromoterView>('dashboard');
  // Read status synchronously — no loading state needed
  const [status, setStatus] = useState<string>(() => getSessionStatus());

  // Re-sync if user object changes (login/logout)
  useEffect(() => {
    setStatus(getSessionStatus());
  }, [user?.id]);

  const handleNavigate = (id: string) => setView(id as PromoterView);

  // Hard lock ONLY for blacklisted accounts
  const isBlacklisted = status === 'blacklisted';

  const navItems: NavItem[] = NAV.map(item => ({
    ...item,
    locked: isBlacklisted && item.id !== 'profile',
  }));

  // Show informational banner for non-approved, non-blacklisted users
  const showBanner = status !== 'approved' && !isBlacklisted;

  const BANNER: Record<string, string> = {
    pending_review: '⏳ Your application is under review. You\'ll be notified within 24–48 hours.',
    rejected:       '❌ Your application was not approved. Please contact support or update your documents.',
    incomplete:     '📝 Your registration is incomplete. Please contact support.',
  };

  return (
    <AppLayout
      title="Promoter Portal"
      navItems={navItems}
      activeNav={view}
      onNavigate={handleNavigate}
    >
      {/* Informational banner — never blocks access */}
      {showBanner && (
        <div style={{
          padding: '12px 20px', marginBottom: '24px', borderRadius: '12px',
          background: status === 'rejected' ? 'rgba(239,68,68,0.08)' : 'rgba(212,175,55,0.06)',
          border: `1px solid ${status === 'rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(212,175,55,0.2)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: status === 'rejected' ? '#f87171' : '#D4AF37' }}>
            {BANNER[status] ?? '⏳ Pending review.'}
          </span>
          <span
            onClick={() => handleNavigate('profile')}
            style={{ color: '#555', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
          >
            View profile →
          </span>
        </div>
      )}

      {/* Blacklisted hard block */}
      {isBlacklisted && (
        <div style={{ padding: '32px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ color: '#f87171', fontSize: '15px', fontWeight: 700, margin: 0 }}>
            🚫 Your account has been suspended. Please contact support.
          </p>
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