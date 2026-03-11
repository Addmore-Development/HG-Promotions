// promoter/dashboard/Dashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Home screen shown to an approved promoter after login.
// Sections: greeting + avatar, stat cards, next shift, matched jobs,
//           recent activity feed.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useAuth }         from '../../shared/hooks/useAuth';
import { usersService }    from '../../shared/services/usersService';
import { jobsService }     from '../../shared/services/jobsService';
import { shiftsService }   from '../../shared/services/shiftsService';
import { paymentsService } from '../../shared/services/paymentsService';
import { Badge }           from '../../shared/components/Badge';
import { Button }          from '../../shared/components/Button';
import type { UserProfile }     from '../../shared/types/user.types';
import type { Job }             from '../../shared/types/job.types';
import type { Shift }           from '../../shared/types/shift.types';
import type { EarningsSummary } from '../../shared/types/payment.types';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHead: React.FC<{ title: string; linkLabel?: string; onLink?: () => void }> = ({ title, linkLabel, onLink }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
    <h2 style={{ color: '#fff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>{title}</h2>
    {linkLabel && onLink && (
      <button onClick={onLink} style={{ background: 'none', border: 'none', color: '#D4AF37', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
        {linkLabel} →
      </button>
    )}
  </div>
);

const StatCard: React.FC<{ label: string; value: string; sub: string; accent?: string; onClick?: () => void }> = ({
  label, value, sub, accent = '#D4AF37', onClick,
}) => (
  <div
    onClick={onClick}
    style={{ flex: 1, minWidth: '140px', padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.2s, transform 0.15s' }}
    onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.3)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}}
    onMouseLeave={e => { if (onClick) { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}}
  >
    <p style={{ color: '#555', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>{label}</p>
    <p style={{ color: accent, fontSize: '26px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
    <p style={{ color: '#3a3a3a', fontSize: '11px', margin: 0 }}>{sub}</p>
  </div>
);

const ReliabilityRing: React.FC<{ score: number }> = ({ score }) => {
  const SIZE = 76, R = 28, CIRC = 2 * Math.PI * R;
  const fill = (score / 5) * CIRC;
  const color = score >= 4 ? '#4ade80' : score >= 3 ? '#D4AF37' : '#f87171';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${fill} ${CIRC}`} strokeLinecap="round" />
        <text x={SIZE/2} y={SIZE/2 + 1} textAnchor="middle" dominantBaseline="middle"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${SIZE/2}px ${SIZE/2}px` }}
          fill={color} fontSize="15" fontWeight="800" fontFamily="inherit">
          {score > 0 ? score.toFixed(1) : '–'}
        </text>
      </svg>
      <span style={{ color: '#444', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Rating</span>
    </div>
  );
};

const ActivityRow: React.FC<{ icon: string; text: string; time: string; color?: string }> = ({ icon, text, time, color = '#a0a0a0' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <p style={{ color, fontSize: '13px', margin: '0 0 2px', lineHeight: 1.4 }}>{text}</p>
      <p style={{ color: '#3a3a3a', fontSize: '11px', margin: 0 }}>{time}</p>
    </div>
  </div>
);

// ─── Helpers — read from UserProfile without assuming which field is set ──────

/** Best display name: fullName > name > 'Promoter' */
const getDisplayName = (p: UserProfile | null) =>
  p?.fullName || p?.name || 'Promoter';

/** Best avatar: profilePhoto > avatarUrl */
const getAvatar = (p: UserProfile | null) =>
  p?.profilePhoto || p?.avatarUrl || null;

/** Reliability score — 0 if not present */
const getScore = (p: UserProfile | null) =>
  p?.reliabilityScore ?? 0;

// ─── Main component ───────────────────────────────────────────────────────────

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [jobs,     setJobs]     = useState<Job[]>([]);
  const [shifts,   setShifts]   = useState<Shift[]>([]);
  const [summary,  setSummary]  = useState<EarningsSummary | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      usersService.getProfile(user.id),
      jobsService.getAvailableJobs(user.id),
      shiftsService.getShiftsByPromoter(user.id),
      paymentsService.getEarningsSummary(user.id),
    ]).then(([p, j, s, sum]) => {
      setProfile(p);
      setJobs(j);
      setShifts(s);
      setSummary(sum);
      setLoading(false);
    });
  }, [user]);

  const firstName   = getDisplayName(profile).split(' ')[0];
  const avatarSrc   = getAvatar(profile);
  const score       = getScore(profile);
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const matchedJobs = jobs.filter(j => {
    if (!profile || j.status !== 'open') return false;
    const { gender, minHeight } = j.filters;
    if (gender && gender !== 'any' && gender !== profile.gender) return false;
    if (minHeight && profile.physicalAttributes.height < minHeight) return false;
    return true;
  }).slice(0, 3);

  const upcomingShift = shifts.find(s => s.status === 'scheduled');

  const activityFeed = [
    ...shifts.filter(s => s.attendance.checkInTime).map(s => ({
      icon:  s.status === 'approved' ? '✅' : '📍',
      text:  s.status === 'approved' ? 'Shift approved by admin' : 'Shift pending approval',
      time:  new Date(s.attendance.checkInTime!).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
      color: s.status === 'approved' ? '#4ade80' : '#fbbf24',
      ts:    new Date(s.attendance.checkInTime!).getTime(),
    })),
    ...shifts.filter(s => s.attendance.issues.length > 0).map(s => ({
      icon: '⚠️',
      text: `Supervisor note: ${s.attendance.issues[0]?.note}`,
      time: s.attendance.issues[0]?.loggedAt
        ? new Date(s.attendance.issues[0].loggedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
        : '',
      color: '#f87171',
      ts: new Date(s.attendance.issues[0]?.loggedAt ?? 0).getTime(),
    })),
    ...(summary && summary.totalPaid > 0 ? [{
      icon: '💰', text: `R${summary.totalPaid.toLocaleString()} paid into your account`,
      time: 'Recent', color: '#D4AF37', ts: Date.now() - 100_000,
    }] : []),
  ].sort((a, b) => b.ts - a.ts).slice(0, 5);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', padding: '60px 0' }}>
      <div style={{ width: 20, height: 20, border: '2px solid #D4AF37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading dashboard…
    </div>
  );

  return (
    <div>
      {/* ── Hero greeting ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '16px',
        padding: '28px 32px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(212,175,55,0.14)',
        borderRadius: '18px', marginBottom: '28px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(212,175,55,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <p style={{ color: '#555', fontSize: '11px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', margin: '0 0 6px' }}>{greeting}</p>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 8px', lineHeight: 1.1, background: 'linear-gradient(135deg, #fff 55%, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {firstName} 👋
          </h1>
          <p style={{ color: '#666', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
            {matchedJobs.length > 0
              ? `${matchedJobs.length} job${matchedJobs.length > 1 ? 's' : ''} matching your profile right now.`
              : 'No matched jobs at the moment — check back soon.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexShrink: 0 }}>
          <ReliabilityRing score={score} />
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #D4AF37, #B8962E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900, color: '#0A0A0A', border: '2px solid rgba(212,175,55,0.3)', flexShrink: 0 }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : firstName.charAt(0)}
          </div>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <StatCard label="Total Earned"  value={`R${(summary?.totalEarned ?? 0).toLocaleString()}`}  sub="All time"          accent="#D4AF37" onClick={() => onNavigate('earnings')} />
        <StatCard label="Pending Pay"   value={`R${(summary?.totalPending ?? 0).toLocaleString()}`} sub="Awaiting approval" accent="#fbbf24" onClick={() => onNavigate('earnings')} />
        <StatCard label="Shifts Done"   value={String(summary?.shiftsCompleted ?? 0)}               sub="Completed"         accent="#63b3ed" onClick={() => onNavigate('shifts')}  />
        <StatCard label="Jobs Open"     value={String(jobs.filter(j => j.status === 'open').length)} sub={`${matchedJobs.length} match your profile`} accent="#4ade80" onClick={() => onNavigate('jobs')} />
      </div>

      {/* ── Two-column: Next Shift + Matched Jobs ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Next Shift */}
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
          <SectionHead title="Next Shift" linkLabel="All Shifts" onLink={() => onNavigate('shifts')} />
          {upcomingShift ? (() => {
            const job = jobs.find(j => j.id === upcomingShift.jobId);
            return (
              <div>
                <div style={{ padding: '16px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 3px' }}>{job?.title ?? '—'}</h3>
                      <p style={{ color: '#a0a0a0', fontSize: '12px', margin: 0 }}>{job?.client}</p>
                    </div>
                    <Badge variant="info">Scheduled</Badge>
                  </div>
                  {[
                    { icon: '📍', text: job?.venue ?? '—' },
                    { icon: '📅', text: job?.date ?? '—' },
                    { icon: '⏰', text: job ? `${job.startTime} – ${job.endTime}` : '—' },
                    { icon: '💰', text: job ? `R${job.hourlyRate}/hr` : '—' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', width: '16px', textAlign: 'center', flexShrink: 0 }}>{r.icon}</span>
                      <span style={{ color: '#a0a0a0', fontSize: '12px' }}>{r.text}</span>
                    </div>
                  ))}
                </div>
                <Button fullWidth variant="secondary" size="sm" onClick={() => onNavigate('shifts')}>View Check-In Details</Button>
              </div>
            );
          })() : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#555' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📅</div>
              <p style={{ fontSize: '13px', margin: '0 0 16px' }}>No upcoming shifts.</p>
              <Button size="sm" onClick={() => onNavigate('jobs')}>Browse Jobs</Button>
            </div>
          )}
        </div>

        {/* Matched Jobs */}
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
          <SectionHead title="⚡ Matched Jobs" linkLabel="See All" onLink={() => onNavigate('jobs')} />
          {matchedJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#555' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</div>
              <p style={{ fontSize: '13px', margin: 0 }}>No matched jobs right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {matchedJobs.map(job => {
                const slotsLeft = job.totalSlots - job.filledSlots;
                return (
                  <div key={job.id} onClick={() => onNavigate('jobs')}
                    style={{ padding: '13px 15px', background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', transition: 'border-color 0.18s, transform 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.4)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(3px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.15)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)'; }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</p>
                      <p style={{ color: '#555', fontSize: '11px', margin: 0 }}>{job.venue} · {job.distanceKm}km</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ color: '#D4AF37', fontSize: '15px', fontWeight: 800, margin: '0 0 3px' }}>
                        R{job.hourlyRate}<span style={{ color: '#555', fontSize: '10px', fontWeight: 400 }}>/hr</span>
                      </p>
                      <Badge variant={slotsLeft <= 1 ? 'warning' : 'success'}>{slotsLeft} left</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Activity feed ──────────────────────────────────────────────── */}
      <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
        <SectionHead title="Recent Activity" />
        {activityFeed.length === 0 ? (
          <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px 0', margin: 0 }}>
            No activity yet. Apply to your first job to get started.
          </p>
        ) : activityFeed.map((item, i) => (
          <ActivityRow key={i} icon={item.icon} text={item.text} time={item.time} color={item.color} />
        ))}
      </div>
    </div>
  );
};