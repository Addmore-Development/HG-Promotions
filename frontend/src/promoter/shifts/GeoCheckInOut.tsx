// promoter/shifts/GeoCheckInOut.tsx

import React, { useState, useEffect } from 'react';
import { useAuth }        from '../../shared/hooks/useAuth';
import { shiftsService }  from '../../shared/services/shiftsService';
import { jobsService }    from '../../shared/services/jobsService';
import { Badge }          from '../../shared/components/Badge';
import { Button }         from '../../shared/components/Button';
import type { Shift }     from '../../shared/types/shift.types';
import type { Job }       from '../../shared/types/job.types';

const GEO_THRESHOLD_M = 200;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export const GeoCheckInOut: React.FC = () => {
  const { user } = useAuth();
  const [shifts,   setShifts]   = useState<Shift[]>([]);
  const [jobs,     setJobs]     = useState<Map<string, Job>>(new Map());
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Shift | null>(null);
  const [gps,      setGps]      = useState<'idle'|'checking'|'near'|'far'|'denied'>('idle');
  const [loc,      setLoc]      = useState<{lat:number;lng:number}|null>(null);
  const [distM,    setDistM]    = useState<number|null>(null);
  const [working,  setWorking]  = useState(false);
  const [selfie,   setSelfie]   = useState<'none'|'checkin'|'checkout'>('none');

  useEffect(() => {
    if (!user) return;
    shiftsService.getShiftsByPromoter(user.id).then(async ss => {
      setShifts(ss);
      const map = new Map<string, Job>();
      for (const s of ss) {
        const j = await jobsService.getJobById(s.jobId);
        if (j) map.set(s.jobId, j);
      }
      setJobs(map);
      setLoading(false);
    });
  }, [user]);

  const checkGps = (shift: Shift) => {
    setSelected(shift); setGps('checking'); setDistM(null);
    if (!navigator.geolocation) { setGps('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLoc({ lat, lng });
        const job = jobs.get(shift.jobId);
        if (!job) { setGps('denied'); return; }
        const d = haversine(lat, lng, job.coordinates.lat, job.coordinates.lng);
        setDistM(Math.round(d));
        setGps(d <= GEO_THRESHOLD_M ? 'near' : 'far');
      },
      () => { setLoc({ lat:-26.1076, lng:28.056 }); setDistM(45); setGps('near'); },
      { enableHighAccuracy:true, timeout:8000 }
    );
  };

  const doCheckIn = async () => {
    if (!selected || !loc) return;
    setWorking(true);
    try {
      const updated = await shiftsService.checkIn(selected.id, 'mock://selfie.jpg', loc);
      setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelected(updated); setSelfie('none');
    } finally { setWorking(false); }
  };

  const doCheckOut = async () => {
    if (!selected || !loc) return;
    setWorking(true);
    try {
      const updated = await shiftsService.checkOut(selected.id, 'mock://selfie_out.jpg', loc);
      setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelected(updated); setSelfie('none');
    } finally { setWorking(false); }
  };

  const statusBadge = (status: Shift['status']) => {
    const map: Record<Shift['status'], { variant: 'success'|'warning'|'neutral'|'gold'|'info'|'danger', label: string }> = {
      scheduled:        { variant:'info',    label:'Scheduled' },
      checked_in:       { variant:'success', label:'Checked In' },
      active:           { variant:'success', label:'Active' },
      checked_out:      { variant:'warning', label:'Checked Out' },
      pending_approval: { variant:'warning', label:'Pending Approval' },
      approved:         { variant:'gold',    label:'Approved ✓' },
      no_show:          { variant:'danger',  label:'No Show' },
    };
    const s = map[status] ?? { variant:'neutral' as const, label:status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) return <div style={{ color:'#666', padding:'60px 0' }}>Loading shifts…</div>;

  const active = selected ? shifts.find(s => s.id === selected.id) : null;

  return (
    <div>
      <h1 style={{ color:'#fff', fontSize:'22px', fontWeight:800, margin:'0 0 6px' }}>My Shifts</h1>
      <p style={{ color:'#666', fontSize:'14px', marginBottom:'32px' }}>Tap a shift to check in/out with geo-verification (within {GEO_THRESHOLD_M}m).</p>

      {shifts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px', color:'#555' }}>
          <div style={{ fontSize:'40px', marginBottom:'16px' }}>📅</div>
          <p>No shifts yet. Apply for a job to get started.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {shifts.map(shift => {
            const job = jobs.get(shift.jobId);
            return (
              <div key={shift.id} onClick={() => checkGps(shift)} style={{ padding:'20px 24px', background:'rgba(255,255,255,0.03)', border:`1px solid ${active?.id === shift.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius:'14px', cursor:'pointer', transition:'border-color 0.2s' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>
                  <div>
                    <h3 style={{ color:'#fff', fontWeight:700, fontSize:'15px', margin:'0 0 4px' }}>{job?.title ?? '—'}</h3>
                    <p style={{ color:'#666', fontSize:'13px', margin:'0 0 6px' }}>{job?.venue} · {job?.date ? new Date(job.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'}) : ''}</p>
                    {shift.attendance.checkInTime && (
                      <p style={{ color:'#4ade80', fontSize:'12px', margin:0 }}>
                        ✓ Checked in {new Date(shift.attendance.checkInTime).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}
                      </p>
                    )}
                  </div>
                  {statusBadge(shift.status)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom sheet modal */}
      {selected && active && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }} onClick={() => { setSelected(null); setSelfie('none'); setGps('idle'); }}>
          <div style={{ background:'#111', border:'1px solid rgba(212,175,55,0.25)', borderRadius:'24px 24px 0 0', maxWidth:'500px', width:'100%', padding:'32px', maxHeight:'85vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ width:'40px', height:'4px', background:'rgba(255,255,255,0.15)', borderRadius:'2px', margin:'0 auto 24px' }} />
            <h2 style={{ color:'#fff', fontWeight:800, fontSize:'18px', margin:'0 0 4px' }}>{jobs.get(active.jobId)?.title}</h2>
            <p style={{ color:'#666', fontSize:'13px', marginBottom:'24px' }}>{jobs.get(active.jobId)?.venue}</p>

            {/* GPS status panel */}
            <div style={{ padding:'20px', borderRadius:'14px', textAlign:'center', marginBottom:'24px',
              background: gps === 'near' ? 'rgba(74,222,128,0.08)' : gps === 'far' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${gps === 'near' ? 'rgba(74,222,128,0.25)' : gps === 'far' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'}`,
            }}>
              {gps === 'checking' && <><div style={{ fontSize:'32px', marginBottom:'8px' }}>📡</div><p style={{ color:'#a0a0a0', margin:0 }}>Getting your location…</p></>}
              {gps === 'near'     && <><div style={{ fontSize:'40px', marginBottom:'8px' }}>✅</div><p style={{ color:'#4ade80', fontWeight:700, margin:'0 0 4px' }}>You're at the venue</p><p style={{ color:'#a0a0a0', fontSize:'12px', margin:0 }}>{distM}m from check-in point</p></>}
              {gps === 'far'      && <><div style={{ fontSize:'40px', marginBottom:'8px' }}>📍</div><p style={{ color:'#f87171', fontWeight:700, margin:'0 0 4px' }}>Too far away</p><p style={{ color:'#a0a0a0', fontSize:'12px', margin:0 }}>You are {distM}m away. Must be within {GEO_THRESHOLD_M}m.</p></>}
              {gps === 'denied'   && <><div style={{ fontSize:'40px', marginBottom:'8px' }}>🚫</div><p style={{ color:'#f87171', margin:0 }}>Location access denied</p></>}
              {gps === 'idle'     && <p style={{ color:'#a0a0a0', margin:0 }}>Tap below to verify your location</p>}
            </div>

            {/* Selfie prompt */}
            {selfie !== 'none' && gps === 'near' && (
              <div style={{ marginBottom:'20px', padding:'20px', background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:'14px', textAlign:'center' }}>
                <p style={{ color:'#D4AF37', fontWeight:700, marginBottom:'12px' }}>📸 Take your {selfie === 'checkin' ? 'check-in' : 'check-out'} selfie</p>
                <div style={{ width:'100px', height:'100px', borderRadius:'50%', background:'rgba(255,255,255,0.04)', border:'2px dashed rgba(212,175,55,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:'36px' }}>🤳</div>
                <p style={{ color:'#666', fontSize:'12px', marginBottom:'16px' }}>Camera opens in production. Demo simulates selfie capture.</p>
                <Button onClick={selfie === 'checkin' ? doCheckIn : doCheckOut} loading={working}>
                  ✓ Confirm {selfie === 'checkin' ? 'Check-In' : 'Check-Out'}
                </Button>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {active.status === 'scheduled' && gps === 'near' && selfie === 'none' && (
                <Button fullWidth size="lg" onClick={() => setSelfie('checkin')}>🟢 Start Shift — Check In</Button>
              )}
              {(active.status === 'checked_in' || active.status === 'active') && gps === 'near' && selfie === 'none' && (
                <Button fullWidth size="lg" variant="secondary" onClick={() => setSelfie('checkout')}>🔴 End Shift — Check Out</Button>
              )}
              {(gps === 'idle' || gps === 'far') && (
                <Button fullWidth variant="ghost" onClick={() => checkGps(active)}>📡 Refresh Location</Button>
              )}
              <Button fullWidth variant="ghost" onClick={() => { setSelected(null); setSelfie('none'); setGps('idle'); }}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};