// promoter/index.tsx
// Promoter portal shell using the dedicated PromoterLayout.

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PromoterLayout } from './PromoterLayout';
import { Dashboard } from './dashboard/dashboard';
import { ViewAcceptJobs } from './jobs/ViewAcceptJobs';
import { GeoCheckInOut } from './shifts/GeoCheckInOut';
import { ViewEarnings } from './payments/ViewEarnings';
import { EditOwnProfile } from './users/EditOwnProfile';
import { FullCRUDUsers } from './users/FullCRUDUsers';
import { useAuth } from '../shared/hooks/useAuth';

// Design tokens (only needed for banner)
const G = '#C4973A';

function getSessionStatus(): string {
  try {
    const sess = JSON.parse(localStorage.getItem('hg_session') || '{}');
    return sess.status || 'pending_review';
  } catch {
    return 'pending_review';
  }
}

export const PromoterApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';
  const [status, setStatus] = useState<string>(() => getSessionStatus());

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    setStatus(getSessionStatus());
  }, [user?.id]);

  if (isLoading || !user) return null;

  const isBlacklisted = status === 'blacklisted';
  const showBanner = status !== 'approved' && !isBlacklisted;

  const BANNER: Record<string, string> = {
    pending_review: '⏳ Your application is under review. You\'ll be notified within 24–48 hours.',
    rejected:       '❌ Your application was not approved. Please contact support or update your documents.',
    incomplete:     '📝 Your registration is incomplete. Please contact support.',
  };

  return (
    <PromoterLayout>
      {showBanner && (
        <div style={{
          padding: '12px 20px', marginBottom: '24px', borderRadius: '12px',
          background: status === 'rejected' ? 'rgba(239,68,68,0.08)' : 'rgba(196,151,58,0.06)',
          border: `1px solid ${status === 'rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(196,151,58,0.2)'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: status === 'rejected' ? '#f87171' : G }}>
            {BANNER[status] ?? '⏳ Pending review.'}
          </span>
          <span
            onClick={() => navigate('/promoter?tab=profile')}
            style={{ color: 'rgba(244,239,230,0.22)', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
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

      {tab === 'dashboard' && <Dashboard onNavigate={(view: string) => navigate(`/promoter?tab=${view}`)} />}
      {tab === 'jobs'      && <ViewAcceptJobs />}
      {tab === 'shifts'    && <GeoCheckInOut />}
      {tab === 'earnings'  && <ViewEarnings />}
      {tab === 'profile'   && <EditOwnProfile />}
      {tab === 'users'     && <FullCRUDUsers />}
    </PromoterLayout>
  );
};