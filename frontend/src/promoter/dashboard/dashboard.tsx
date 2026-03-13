// promoter/dashboard/dashboard.tsx
// Home screen for the promoter portal.
// Reads: profile (name, photo, score), earnings summary, upcoming shift, matched jobs, activity.
// Uses: user.id from useAuth (can be userId OR email — usersService handles both)

import React, { useState, useEffect } from 'react';
import { useAuth }           from '../../shared/hooks/useAuth';
import { usersService }      from '../../shared/services/usersService';
import { jobsService }       from '../../shared/services/jobsService';
import { shiftsService }     from '../../shared/services/shiftsService';
import { paymentsService }   from '../../shared/services/paymentsService';
import { Badge }             from '../../shared/components/Badge';
import { Button }            from '../../shared/components/Button';
import type { UserProfile }     from '../../shared/types/user.types';
import type { Job }             from '../../shared/types/job.types';
import type { Shift }           from '../../shared/types/shift.types';
import type { EarningsSummary } from '../../shared/types/payment.types';

// Design tokens – matching other promoter pages
const G = '#D4AF37';
const GL = '#DDB55A';
const B = '#080808';
const BC = '#161616';
const BB = 'rgba(255,255,255,0.07)';
const W = '#F4EFE6';
const WM = 'rgba(244,239,230,0.55)';
const WD = '#555';
const FB = "'DM Sans', system-ui, sans-serif";
const FD = "'Playfair Display', Georgia, serif";

interface Props { onNavigate: (view: string) => void; }

// ─── Inline sub-components ────────────────────────────────────────────────────

const SectionHead: React.FC<{ title: string; link?: string; onLink?: () => void }> = ({ title, link, onLink }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
    <h2 style={{ color: W, fontSize:'14px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', margin:0 }}>{title}</h2>
    {link && onLink && (
      <button onClick={onLink} style={{ background:'none', border:'none', color: G, fontSize:'13px', fontWeight:600, cursor:'pointer', padding:0, fontFamily:FB }}>
        {link} <span style={{ fontSize:'16px', lineHeight:1 }}>→</span>
      </button>
    )}
  </div>
);

const StatCard: React.FC<{ label: string; value: string; sub: string; accent?: string; onClick?: () => void }> = ({
  label, value, sub, accent = G, onClick
}) => (
  <div
    onClick={onClick}
    style={{
      flex:1, minWidth:'160px', padding:'22px 20px',
      background: BC,
      border: `1px solid ${BB}`,
      borderRadius: '20px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={e => {
      if (onClick) {
        e.currentTarget.style.borderColor = G + '80';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 8px 20px ${G}20`;
      }
    }}
    onMouseLeave={e => {
      if (onClick) {
        e.currentTarget.style.borderColor = BB;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }
    }}
  >
    {/* Top accent bar */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: accent, opacity: 0.7 }} />
    <p style={{ color: WM, fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', margin:'0 0 10px' }}>{label}</p>
    <p style={{ color: accent, fontSize:'28px', fontWeight:800, margin:'0 0 6px', letterSpacing:'-0.02em', lineHeight:1 }}>{value}</p>
    <p style={{ color: WD, fontSize:'12px', margin:0 }}>{sub}</p>
  </div>
);

const ReliabilityRing: React.FC<{ score: number }> = ({ score }) => {
  const S = 80, R = 30, C = 2 * Math.PI * R;
  const fill = (Math.min(score, 5) / 5) * C;
  const color = score >= 4 ? '#4ade80' : score >= 3 ? G : '#f87171';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={S/2} cy={S/2} r={R} fill="none" stroke={BB} strokeWidth="6" />
        <circle cx={S/2} cy={S/2} r={R} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${fill} ${C}`} strokeLinecap="round" />
        <text x={S/2} y={S/2+2} textAnchor="middle" dominantBaseline="middle"
          style={{ transform:`rotate(90deg)`, transformOrigin:`${S/2}px ${S/2}px` }}
          fill={color} fontSize="16" fontWeight="800" fontFamily={FB}>
          {score > 0 ? score.toFixed(1) : '–'}
        </text>
      </svg>
      <span style={{ color: WD, fontSize:'11px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Reliability</span>
    </div>
  );
};

const ActivityRow: React.FC<{ icon: string; text: string; time: string; color?: string }> = ({ icon, text, time, color = WM }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:'14px', padding:'12px 0', borderBottom:`1px solid ${BB}` }}>
    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>{icon}</div>
    <div style={{ flex:1 }}>
      <p style={{ color, fontSize:'14px', margin:'0 0 3px', lineHeight:1.5 }}>{text}</p>
      <p style={{ color: WD, fontSize:'11px', margin:0 }}>{time}</p>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export const Dashboard: React.FC<Props> = ({ onNavigate }) => {
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

  // Derive display name: profile.fullName → user.name → fallback to 'Promoter'
  const firstName = (profile?.fullName || (user as { name?: string })?.name || '').split(' ')[0] || 'Promoter';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
      icon: s.status === 'approved' ? '✅' : '📍',
      text: s.status === 'approved' ? 'Shift approved and payment queued' : 'Shift checked out — pending approval',
      time: new Date(s.attendance.checkInTime!).toLocaleDateString('en-ZA', { day:'numeric', month:'short' }),
      color: s.status === 'approved' ? '#4ade80' : '#fbbf24',
      ts: new Date(s.attendance.checkInTime!).getTime(),
    })),
    ...shifts.filter(s => s.attendance.issues.length > 0).map(s => ({
      icon: '⚠️', text: `Supervisor note: ${s.attendance.issues[0]?.note}`,
      time: new Date(s.attendance.issues[0]?.loggedAt ?? 0).toLocaleDateString('en-ZA', { day:'numeric', month:'short' }),
      color: '#f87171',
      ts: new Date(s.attendance.issues[0]?.loggedAt ?? 0).getTime(),
    })),
    ...(summary && summary.totalPaid > 0 ? [{
      icon: '💰', text: `R${summary.totalPaid.toLocaleString()} paid into your account`, time: 'Recent', color: G, ts: Date.now() - 100_000,
    }] : []),
  ].sort((a, b) => b.ts - a.ts).slice(0, 5);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', color: WD, padding:'80px 0', justifyContent:'center' }}>
      <div style={{ width:24, height:24, border:`2px solid ${G}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ fontSize:'15px', color:WM }}>Loading your dashboard…</span>
    </div>
  );

  return (
    <div style={{ padding:'0 4px' }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding:'36px 40px', marginBottom:'32px', borderRadius:'28px',
        background: BC,
        border: `1px solid ${BB}`,
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'20px',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'260px', height:'260px', background:`radial-gradient(circle, ${G}18 0%, transparent 70%)`, pointerEvents:'none' }} />

        <div>
          <p style={{ color: WM, fontSize:'12px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', margin:'0 0 8px' }}>{greeting}</p>
          <h1 style={{
            fontSize:'32px', fontWeight:900, margin:'0 0 10px', lineHeight:1.2,
            background:`linear-gradient(135deg, ${W} 55%, ${G})`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>
            {firstName} 👋
          </h1>
          <p style={{ color: WM, fontSize:'15px', margin:0, maxWidth:450 }}>
            {matchedJobs.length > 0
              ? `${matchedJobs.length} job${matchedJobs.length > 1 ? 's' : ''} matching your profile right now.`
              : 'Welcome back to your Honey Group promoter portal.'}
          </p>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'24px', flexShrink:0 }}>
          <ReliabilityRing score={profile?.reliabilityScore ?? 0} />
          <div style={{
            width:'72px', height:'72px', borderRadius:'50%', overflow:'hidden', flexShrink:0,
            background:`linear-gradient(135deg, ${G}, ${GL})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'28px', fontWeight:900, color:'#0A0A0A',
            border:`2px solid ${G}80`,
          }}>
            {profile?.profilePhoto
              ? <img src={profile.profilePhoto} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : firstName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:'16px', marginBottom:'32px', flexWrap:'wrap' }}>
        <StatCard label="Total Earned"  value={`R${(summary?.totalEarned ?? 0).toLocaleString()}`}  sub="All time"            accent={G}  onClick={() => onNavigate('earnings')} />
        <StatCard label="Pending Pay"   value={`R${(summary?.totalPending ?? 0).toLocaleString()}`} sub="Awaiting approval"   accent="#fbbf24"  onClick={() => onNavigate('earnings')} />
        <StatCard label="Shifts Done"   value={String(summary?.shiftsCompleted ?? 0)}               sub="Completed"          accent="#63b3ed"  onClick={() => onNavigate('shifts')}   />
        <StatCard label="Jobs Open"     value={String(jobs.filter(j => j.status === 'open').length)} sub={`${matchedJobs.length} match your profile`} accent="#4ade80" onClick={() => onNavigate('jobs')} />
      </div>

      {/* ── Two-column grid ──────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px' }}>

        {/* Next shift */}
        <div style={{ padding:'28px', background: BC, border: `1px solid ${BB}`, borderRadius:'24px' }}>
          <SectionHead title="Next Shift" link="All Shifts" onLink={() => onNavigate('shifts')} />
          {upcomingShift ? (() => {
            const job = jobs.find(j => j.id === upcomingShift.jobId);
            return (
              <div>
                <div style={{ padding:'18px', background:`${G}0f`, border:`1px solid ${G}30`, borderRadius:'16px', marginBottom:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                    <div>
                      <h3 style={{ color: W, fontSize:'16px', fontWeight:700, margin:'0 0 4px' }}>{job?.title ?? '—'}</h3>
                      <p style={{ color: WM, fontSize:'13px', margin:0 }}>{job?.client}</p>
                    </div>
                    <Badge variant="info">Scheduled</Badge>
                  </div>
                  {[
                    { icon:'📍', text: job?.venue ?? '—' },
                    { icon:'📅', text: job?.date ? new Date(job.date).toLocaleDateString('en-ZA', { weekday:'short', day:'numeric', month:'short' }) : '—' },
                    { icon:'⏰', text: job ? `${job.startTime} – ${job.endTime}` : '—' },
                    { icon:'💰', text: job ? `R${job.hourlyRate}/hr` : '—' },
                  ].map((r, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                      <span style={{ fontSize:'13px', width:'20px', textAlign:'center', flexShrink:0, color:WM }}>{r.icon}</span>
                      <span style={{ color: WM, fontSize:'13px' }}>{r.text}</span>
                    </div>
                  ))}
                </div>
                <Button fullWidth variant="secondary" size="sm" onClick={() => onNavigate('shifts')}>View Check-In Details</Button>
              </div>
            );
          })() : (
            <div style={{ textAlign:'center', padding:'36px 0', color:WM }}>
              <div style={{ fontSize:'40px', marginBottom:'12px', color:G }}>📅</div>
              <p style={{ fontSize:'14px', margin:'0 0 20px' }}>No upcoming shifts yet.</p>
              <Button size="sm" onClick={() => onNavigate('jobs')}>Browse Jobs</Button>
            </div>
          )}
        </div>

        {/* Matched jobs */}
        <div style={{ padding:'28px', background: BC, border: `1px solid ${BB}`, borderRadius:'24px' }}>
          <SectionHead title="⚡ Matched Jobs" link="See All" onLink={() => onNavigate('jobs')} />
          {matchedJobs.length === 0 ? (
            <div style={{ textAlign:'center', padding:'36px 0', color:WM }}>
              <div style={{ fontSize:'40px', marginBottom:'12px', color:G }}>🔍</div>
              <p style={{ fontSize:'14px', margin:0 }}>No matched jobs right now.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {matchedJobs.map(job => {
                const slotsLeft = job.totalSlots - job.filledSlots;
                return (
                  <div key={job.id} onClick={() => onNavigate('jobs')}
                    style={{
                      padding:'16px 18px',
                      background:`${G}08`,
                      border:`1px solid ${G}20`,
                      borderRadius:'14px',
                      cursor:'pointer',
                      display:'flex',
                      justifyContent:'space-between',
                      alignItems:'center',
                      gap:'12px',
                      transition:'border-color 0.2s, transform 0.15s, background 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = G + '80';
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.background = `${G}12`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = G + '20';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.background = `${G}08`;
                    }}
                  >
                    <div style={{ minWidth:0 }}>
                      <p style={{ color: W, fontSize:'15px', fontWeight:600, margin:'0 0 4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{job.title}</p>
                      <p style={{ color: WM, fontSize:'12px', margin:0 }}>{job.venue} · {job.distanceKm}km away</p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ color: G, fontSize:'17px', fontWeight:800, margin:'0 0 3px' }}>
                        R{job.hourlyRate}<span style={{ color: WM, fontSize:'11px', fontWeight:400 }}>/hr</span>
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

      {/* ── Activity feed ─────────────────────────────────────────────────── */}
      <div style={{ padding:'28px', background: BC, border: `1px solid ${BB}`, borderRadius:'24px' }}>
        <SectionHead title="Recent Activity" />
        {activityFeed.length === 0 ? (
          <p style={{ color: WM, fontSize:'14px', textAlign:'center', padding:'24px 0', margin:0 }}>No activity yet. Apply to your first job to get started.</p>
        ) : activityFeed.map((item, i) => (
          <ActivityRow key={i} icon={item.icon} text={item.text} time={item.time} color={item.color} />
        ))}
      </div>
    </div>
  );
};