// promoter/dashboard/dashboard.tsx
// Home screen for the promoter portal – now using exact admin design tokens.

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

// Updated palette – same as admin
const G   = '#D4880A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const B   = '#0C0A07'
const D1  = '#121008'
const D2  = '#1A1508'
const D3  = '#221C0C'
const BB  = 'rgba(212,136,10,0.14)'
const BB2 = 'rgba(212,136,10,0.07)'
const W   = '#FAF3E8'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'
const FD  = "'Playfair Display', Georgia, serif"
const FB  = "'DM Sans', system-ui, sans-serif"

// Status colors
const TEAL   = '#4AABB8'
const AMBER  = '#E8A820'
const CORAL  = '#C4614A'
const SKY    = '#5A9EC4'

interface Props { onNavigate: (view: string) => void; }

// ─── Stat card (exactly like admin) ───────────────────────────────────────────
function StatCard({ label, value, sub, color, onClick }: { label: string; value: any; sub?: string; color: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: D2, padding: '24px 22px', position: 'relative', overflow: 'hidden', borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, border-color 0.2s',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${G}30`; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}
    >
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      <div style={{ position:'absolute', top:0, right:0, width:60, height:60, background:`${color}06`, borderRadius:'0 0 0 60px' }} />
      <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: W55, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: FD, fontSize: 38, fontWeight: 700, color: W, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 8, fontWeight: 600 }}>{sub}</div>}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHead({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 18 }}>
      <h2 style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: W, letterSpacing: '-0.02em' }}>{title}</h2>
      {link && onLink && (
        <button onClick={onLink} style={{ background:'none', border:'none', color: GL, fontSize: 12, fontWeight: 600, cursor:'pointer', fontFamily: FB }}>
          {link} <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
        </button>
      )}
    </div>
  )
}

// ─── Reliability ring (kept as is) ────────────────────────────────────────────
const ReliabilityRing: React.FC<{ score: number }> = ({ score }) => {
  const S = 80, R = 30, C = 2 * Math.PI * R;
  const fill = (Math.min(score, 5) / 5) * C;
  const color = score >= 4 ? TEAL : score >= 3 ? GL : CORAL;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={S/2} cy={S/2} r={R} fill="none" stroke={W28} strokeWidth="6" />
        <circle cx={S/2} cy={S/2} r={R} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${fill} ${C}`} strokeLinecap="round" />
        <text x={S/2} y={S/2+2} textAnchor="middle" dominantBaseline="middle"
          style={{ transform:`rotate(90deg)`, transformOrigin:`${S/2}px ${S/2}px` }}
          fill={color} fontSize="16" fontWeight="800" fontFamily={FB}>
          {score > 0 ? score.toFixed(1) : '–'}
        </text>
      </svg>
      <span style={{ color: W28, fontSize:'11px', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Reliability</span>
    </div>
  );
};

// ─── Activity row ─────────────────────────────────────────────────────────────
const ActivityRow: React.FC<{ icon: string; text: string; time: string; color?: string }> = ({ icon, text, time, color = W55 }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:'14px', padding:'12px 0', borderBottom:`1px solid ${BB}` }}>
    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:BB2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>{icon}</div>
    <div style={{ flex:1 }}>
      <p style={{ color, fontSize:'14px', margin:'0 0 3px', lineHeight:1.5 }}>{text}</p>
      <p style={{ color: W28, fontSize:'11px', margin:0 }}>{time}</p>
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
      color: s.status === 'approved' ? TEAL : AMBER,
      ts: new Date(s.attendance.checkInTime!).getTime(),
    })),
    ...shifts.filter(s => s.attendance.issues.length > 0).map(s => ({
      icon: '⚠️', text: `Supervisor note: ${s.attendance.issues[0]?.note}`,
      time: new Date(s.attendance.issues[0]?.loggedAt ?? 0).toLocaleDateString('en-ZA', { day:'numeric', month:'short' }),
      color: CORAL,
      ts: new Date(s.attendance.issues[0]?.loggedAt ?? 0).getTime(),
    })),
    ...(summary && summary.totalPaid > 0 ? [{
      icon: '💰', text: `R${summary.totalPaid.toLocaleString()} paid into your account`, time: 'Recent', color: GL, ts: Date.now() - 100_000,
    }] : []),
  ].sort((a, b) => b.ts - a.ts).slice(0, 5);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', color: W28, padding:'80px 0', justifyContent:'center' }}>
      <div style={{ width:24, height:24, border:`2px solid ${GL}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ fontSize:'15px', color:W55 }}>Loading your dashboard…</span>
    </div>
  );

  return (
    <div style={{ padding:'40px 48px' }}>
      {/* Header with greeting and time */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:36 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>Promoter Dashboard</div>
          <h1 style={{ fontFamily:FD, fontSize:32, fontWeight:700, color:W }}>{greeting}, {firstName}.</h1>
          <p style={{ fontSize:13, color:W55, marginTop:6 }}>
            {matchedJobs.length > 0
              ? `${matchedJobs.length} job${matchedJobs.length > 1 ? 's' : ''} matching your profile right now.`
              : 'Welcome back to your Honey Group promoter portal.'}
          </p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:FD, fontSize:26, color:GL }}>{new Date().toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</div>
          <div style={{ fontSize:11, color:W55, marginTop:4 }}>{new Date().toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long'})}</div>
        </div>
      </div>

      {/* Stat cards grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:BB, marginBottom:32 }}>
        <StatCard label="Total Earned"  value={`R${(summary?.totalEarned ?? 0).toLocaleString()}`} sub="All time" color={G} onClick={() => onNavigate('earnings')} />
        <StatCard label="Pending Pay"   value={`R${(summary?.totalPending ?? 0).toLocaleString()}`} sub="Awaiting approval" color={AMBER} onClick={() => onNavigate('earnings')} />
        <StatCard label="Shifts Done"   value={String(summary?.shiftsCompleted ?? 0)} sub="Completed" color={SKY} onClick={() => onNavigate('shifts')} />
        <StatCard label="Jobs Open"     value={String(jobs.filter(j => j.status === 'open').length)} sub={`${matchedJobs.length} match your profile`} color={TEAL} onClick={() => onNavigate('jobs')} />
      </div>

      {/* Two‑column grid: Next Shift & Matched Jobs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:BB, marginBottom:24 }}>
        {/* Next Shift */}
        <div style={{ background:D2, padding:28 }}>
          <SectionHead title="Next Shift" link="All Shifts" onLink={() => onNavigate('shifts')} />
          {upcomingShift ? (() => {
            const job = jobs.find(j => j.id === upcomingShift.jobId);
            return (
              <div>
                <div style={{ padding:'18px', background:`${GL}0f`, border:`1px solid ${GL}30`, borderRadius:2, marginBottom:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                    <div>
                      <h3 style={{ color: W, fontSize:'16px', fontWeight:700, margin:'0 0 4px' }}>{job?.title ?? '—'}</h3>
                      <p style={{ color: W55, fontSize:'13px', margin:0 }}>{job?.client}</p>
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
                      <span style={{ fontSize:'13px', width:'20px', textAlign:'center', flexShrink:0, color:W55 }}>{r.icon}</span>
                      <span style={{ color: W55, fontSize:'13px' }}>{r.text}</span>
                    </div>
                  ))}
                </div>
                <Button fullWidth variant="secondary" size="sm" onClick={() => onNavigate('shifts')}>View Check-In Details</Button>
              </div>
            );
          })() : (
            <div style={{ textAlign:'center', padding:'36px 0', color:W55 }}>
              <div style={{ fontSize:'40px', marginBottom:'12px', color:GL }}>📅</div>
              <p style={{ fontSize:'14px', margin:'0 0 20px' }}>No upcoming shifts yet.</p>
              <Button size="sm" onClick={() => onNavigate('jobs')}>Browse Jobs</Button>
            </div>
          )}
        </div>

        {/* Matched Jobs */}
        <div style={{ background:D2, padding:28 }}>
          <SectionHead title="⚡ Matched Jobs" link="See All" onLink={() => onNavigate('jobs')} />
          {matchedJobs.length === 0 ? (
            <div style={{ textAlign:'center', padding:'36px 0', color:W55 }}>
              <div style={{ fontSize:'40px', marginBottom:'12px', color:GL }}>🔍</div>
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
                      background:`${GL}08`,
                      border:`1px solid ${GL}20`,
                      borderRadius:2,
                      cursor:'pointer',
                      display:'flex',
                      justifyContent:'space-between',
                      alignItems:'center',
                      gap:'12px',
                      transition:'border-color 0.2s, transform 0.15s, background 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = GL + '80';
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.background = `${GL}12`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = GL + '20';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.background = `${GL}08`;
                    }}
                  >
                    <div style={{ minWidth:0 }}>
                      <p style={{ color: W, fontSize:'15px', fontWeight:600, margin:'0 0 4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{job.title}</p>
                      <p style={{ color: W55, fontSize:'12px', margin:0 }}>{job.venue} · {job.distanceKm}km away</p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ color: GL, fontSize:'17px', fontWeight:800, margin:'0 0 3px' }}>
                        R{job.hourlyRate}<span style={{ color: W55, fontSize:'11px', fontWeight:400 }}>/hr</span>
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

      {/* Activity feed */}
      <div style={{ background:D2, padding:28, border:`1px solid ${BB}`, borderRadius:2 }}>
        <SectionHead title="Recent Activity" />
        {activityFeed.length === 0 ? (
          <p style={{ color: W55, fontSize:'14px', textAlign:'center', padding:'24px 0', margin:0 }}>No activity yet. Apply to your first job to get started.</p>
        ) : activityFeed.map((item, i) => (
          <ActivityRow key={i} icon={item.icon} text={item.text} time={item.time} color={item.color} />
        ))}
      </div>
    </div>
  );
};