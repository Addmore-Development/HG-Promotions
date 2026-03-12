import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

function getSessionStatus(): string {
  try {
    const sess = JSON.parse(localStorage.getItem('hg_session') || '{}');
    return sess.status || 'pending_review';
  } catch {
    return 'pending_review';
  }
}

export const PromoterApp: React.FC = () => {
  const { user, isLoading } = useAuth(); // 👈 get isLoading
  const navigate = useNavigate();
  const [view,   setView]   = useState<PromoterView>('dashboard');
  const [status, setStatus] = useState<string>(() => getSessionStatus());

  // Wait for auth to finish loading before redirecting
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    setStatus(getSessionStatus());
  }, [user?.id]);

  // Show nothing while auth is loading or redirecting
  if (isLoading || !user) return null;

  const handleNavigate = (id: string) => setView(id as PromoterView);

  const isBlacklisted = status === 'blacklisted';
  const navItems: NavItem[] = NAV.map(item => ({
    ...item,
    locked: isBlacklisted && item.id !== 'profile',
  }));

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