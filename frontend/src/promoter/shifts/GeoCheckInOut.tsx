import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { showToast } from '../../shared/utils/toast';

const G   = '#D4880A';
const GL  = '#E8A820';
const G2  = '#8B5A1A';
const B   = '#0C0A07';
const BC  = '#141008';
const BB  = 'rgba(212,136,10,0.12)';
const W   = '#FAF3E8';
const WM  = 'rgba(250,243,232,0.65)';
const WD  = 'rgba(250,243,232,0.28)';
const FD  = "'Playfair Display', Georgia, serif";
const FB  = "'DM Sans', system-ui, sans-serif";
const TEAL  = '#4AABB8';
const AMBER = '#E8A820';
const CORAL = '#C4614A';
const GREEN = '#4ade80';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GEO_THRESHOLD_M  = 500;
const LOCATION_PING_MS = 30_000; // ping server every 30 seconds

function authHdr() {
  const t = localStorage.getItem('hg_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hex2rgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

// ── Live earnings timer ───────────────────────────────────────────────────────
function LiveEarningsTimer({ checkInTime, hourlyRate }: { checkInTime: string; hourlyRate: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () => setElapsed((Date.now() - new Date(checkInTime).getTime()) / 1000);
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [checkInTime]);
  const hrs    = Math.floor(elapsed / 3600);
  const min    = Math.floor((elapsed % 3600) / 60);
  const sec    = Math.floor(elapsed % 60);
  const earned = (elapsed / 3600) * hourlyRate;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: GREEN, letterSpacing: '0.1em' }}>
        {String(hrs).padStart(2, '0')}:{String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 13, color: GL, marginTop: 6, fontWeight: 700 }}>
        R{earned.toFixed(2)} earned so far
      </div>
      <div style={{ fontSize: 11, color: WD, marginTop: 2 }}>
        R{hourlyRate}/hr × {(elapsed / 3600).toFixed(2)} hrs
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export const GeoCheckInOut: React.FC = () => {
  const { user } = useAuth();

  const [shifts, setShifts]               = useState<any[]>([]);
  const [jobs, setJobs]                   = useState<Map<string, any>>(new Map());
  const [loading, setLoading]             = useState(true);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [gps, setGps]                     = useState<'idle' | 'checking' | 'near' | 'far' | 'denied'>('idle');
  const [loc, setLoc]                     = useState<{ lat: number; lng: number } | null>(null);
  const [distM, setDistM]                 = useState<number | null>(null);
  const [working, setWorking]             = useState(false);
  const [selfieAction, setSelfieAction]   = useState<'none' | 'checkin' | 'checkout'>('none');
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile]       = useState<File | null>(null);
  const [statusFilter, setStatusFilter]   = useState<string>('all');
  const [trackingActive, setTrackingActive] = useState(false);

  // Refs — never go stale in callbacks
  const watchIdRef    = useRef<number | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const activeShiftIdRef = useRef<string | null>(null);

  // Derive activeShift always from latest state
  const activeShift = selectedId ? (shifts.find(s => s.id === selectedId) || null) : null;

  // ── Load shifts + jobs ──────────────────────────────────────────────────────
  const loadShifts = useCallback(async () => {
    if (!user) return;
    try {
      const [shiftsRes, jobsRes] = await Promise.all([
        fetch(`${API}/shifts/my`, { headers: authHdr() as any }),
        fetch(`${API}/jobs`,      { headers: authHdr() as any }),
      ]);
      const ss: any[] = shiftsRes.ok ? await shiftsRes.json() : [];
      const jj: any[] = jobsRes.ok   ? await jobsRes.json()  : [];
      setShifts(ss);
      const map = new Map<string, any>();
      jj.forEach((j: any) => map.set(j.id, j));
      setJobs(map);
    } catch (e) {
      console.error('[GeoCheckInOut] loadShifts error:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadShifts(); }, [loadShifts]);

  // ── Send location ping to server ────────────────────────────────────────────
  const sendLocationPing = useCallback(async (shiftId: string) => {
    const currentLoc = currentLocRef.current;
    if (!currentLoc) return;
    try {
      await fetch(`${API}/shifts/location/update`, {
        method:  'POST',
        headers: { ...authHdr(), 'Content-Type': 'application/json' } as any,
        body:    JSON.stringify({
          lat:     currentLoc.lat,
          lng:     currentLoc.lng,
          shiftId,
        }),
      });
    } catch (e) {
      // Non-fatal — location ping failure doesn't break the shift
      console.warn('[Location] Ping failed (non-fatal):', e);
    }
  }, []);

  // ── Start continuous location tracking ─────────────────────────────────────
  const startTracking = useCallback((shiftId: string) => {
    if (trackingActive) return;
    console.log('[Location] Starting continuous tracking for shift:', shiftId);
    activeShiftIdRef.current = shiftId;
    setTrackingActive(true);

    if (!navigator.geolocation) {
      console.warn('[Location] Geolocation not supported');
      return;
    }

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(newLoc);
        currentLocRef.current = newLoc;
      },
      err => console.warn('[Location] Watch error:', err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    // Ping server every 30 seconds
    pingIntervalRef.current = setInterval(() => {
      if (activeShiftIdRef.current) {
        sendLocationPing(activeShiftIdRef.current);
      }
    }, LOCATION_PING_MS);

    // Send first ping immediately
    setTimeout(() => sendLocationPing(shiftId), 2000);
  }, [trackingActive, sendLocationPing]);

  // ── Stop continuous location tracking ──────────────────────────────────────
  const stopTracking = useCallback(() => {
    console.log('[Location] Stopping tracking');
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pingIntervalRef.current !== null) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    activeShiftIdRef.current = null;
    setTrackingActive(false);
  }, []);

  // ── Auto-start/stop tracking based on shift status ──────────────────────────
  useEffect(() => {
    const checkedInShift = shifts.find(s => s.status === 'CHECKED_IN');
    if (checkedInShift && !trackingActive) {
      startTracking(checkedInShift.id);
    } else if (!checkedInShift && trackingActive) {
      stopTracking();
    }
  }, [shifts, trackingActive, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
      if (pingIntervalRef.current !== null) clearInterval(pingIntervalRef.current);
    };
  }, []);

  // ── Filtered shifts ─────────────────────────────────────────────────────────
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => statusFilter === 'all' || s.status === statusFilter);
  }, [shifts, statusFilter]);

  // ── Close modal ─────────────────────────────────────────────────────────────
  const closeModal = () => {
    setSelectedId(null);
    setSelfieAction('none');
    setSelfiePreview(null);
    setSelfieFile(null);
    setGps('idle');
    setDistM(null);
  };

  // ── GPS verification ────────────────────────────────────────────────────────
  const checkGps = (shift: any) => {
    setSelectedId(shift.id);
    setGps('checking');
    setDistM(null);
    setSelfieAction('none');
    setSelfiePreview(null);
    setSelfieFile(null);

    if (!navigator.geolocation) {
      setLoc({ lat: -26.2041, lng: 28.0473 });
      currentLocRef.current = { lat: -26.2041, lng: 28.0473 };
      setDistM(0);
      setGps('near');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const newLoc = { lat, lng };
        setLoc(newLoc);
        currentLocRef.current = newLoc;
        const job = jobs.get(shift.jobId);
        if (!job || !job.lat || !job.lng) {
          setDistM(0);
          setGps('near');
          return;
        }
        const d = haversine(lat, lng, job.lat, job.lng);
        setDistM(Math.round(d));
        setGps(d <= GEO_THRESHOLD_M ? 'near' : 'far');
      },
      () => {
        // Fallback — allow check-in
        const fallback = { lat: -26.2041, lng: 28.0473 };
        setLoc(fallback);
        currentLocRef.current = fallback;
        setDistM(0);
        setGps('near');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ── Check In ────────────────────────────────────────────────────────────────
  const doCheckIn = async () => {
    if (!selectedId) return;
    const currentShift = shifts.find(s => s.id === selectedId);
    if (!currentShift) { showToast('Shift not found', 'error'); return; }
    if (currentShift.status === 'CHECKED_IN') {
      setSelfieAction('none');
      showToast('You are already checked in to this shift.', 'info');
      return;
    }
    if (['PENDING_APPROVAL', 'APPROVED'].includes(currentShift.status)) {
      setSelfieAction('none');
      showToast('This shift has already been completed.', 'info');
      return;
    }

    setWorking(true);
    try {
      const currentLoc = currentLocRef.current || loc || { lat: -26.2041, lng: 28.0473 };
      const formData = new FormData();
      formData.append('lat', String(currentLoc.lat));
      formData.append('lng', String(currentLoc.lng));
      if (selfieFile) formData.append('selfie', selfieFile);

      const res = await fetch(`${API}/shifts/${selectedId}/checkin`, {
        method:  'POST',
        headers: authHdr() as any,
        body:    formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
        setSelfieAction('none');
        setSelfiePreview(null);
        setSelfieFile(null);
        // Start continuous tracking immediately
        startTracking(selectedId);
        showToast('✅ Checked in! Your location and earnings are now being tracked.', 'success');
      } else {
        const errBody = await res.json().catch(() => ({ error: 'Check-in failed' }));
        if (errBody.error?.toLowerCase().includes('already checked in')) {
          await loadShifts();
          setSelfieAction('none');
          showToast('You are already checked in to this shift.', 'info');
        } else {
          showToast(errBody.error || 'Check-in failed', 'error');
        }
      }
    } catch (e) {
      console.error('[CheckIn] error:', e);
      showToast('Check-in failed — please try again', 'error');
    }
    setWorking(false);
  };

  // ── Check Out ───────────────────────────────────────────────────────────────
  const doCheckOut = async () => {
    if (!selectedId) return;
    const currentShift = shifts.find(s => s.id === selectedId);
    if (!currentShift) { showToast('Shift not found', 'error'); return; }
    if (currentShift.status !== 'CHECKED_IN') {
      setSelfieAction('none');
      showToast('You need to check in before checking out.', 'error');
      return;
    }

    setWorking(true);
    try {
      const currentLoc = currentLocRef.current || loc || { lat: -26.2041, lng: 28.0473 };
      const formData = new FormData();
      formData.append('lat', String(currentLoc.lat));
      formData.append('lng', String(currentLoc.lng));
      if (selfieFile) formData.append('selfie', selfieFile);

      const res = await fetch(`${API}/shifts/${selectedId}/checkout`, {
        method:  'POST',
        headers: authHdr() as any,
        body:    formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
        setSelfieAction('none');
        setSelfiePreview(null);
        setSelfieFile(null);
        // Stop tracking
        stopTracking();
        showToast('✅ Checked out! Earnings submitted for payment.', 'success');
        await loadShifts();
      } else {
        const errBody = await res.json().catch(() => ({ error: 'Check-out failed' }));
        showToast(errBody.error || 'Check-out failed', 'error');
      }
    } catch (e) {
      console.error('[CheckOut] error:', e);
      showToast('Check-out failed — please try again', 'error');
    }
    setWorking(false);
  };

  // ── Status badge ────────────────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string; bg: string }> = {
      SCHEDULED:        { color: '#5A9EC4', label: 'Scheduled',        bg: 'rgba(90,158,196,0.1)'  },
      CHECKED_IN:       { color: GREEN,     label: '🟢 On Shift',      bg: 'rgba(74,222,128,0.1)'  },
      PENDING_APPROVAL: { color: AMBER,     label: 'Pending Approval', bg: 'rgba(232,168,32,0.1)'  },
      APPROVED:         { color: GL,        label: '✓ Approved',       bg: 'rgba(232,168,32,0.1)'  },
      NO_SHOW:          { color: CORAL,     label: 'No Show',          bg: 'rgba(196,97,74,0.1)'   },
    };
    const s = map[status] || { color: WD, label: status, bg: 'transparent' };
    return (
      <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.color}44`, padding: '3px 9px', borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        {s.label}
      </span>
    );
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: WD, padding: '60px 0', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: `2px solid ${GL}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 15, color: WM }}>Loading shifts…</span>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '40px 48px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700 }}>Shifts</div>
            <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>My Shifts</h1>
            <p style={{ fontSize: 13, color: WM, marginTop: 6 }}>Earnings = Hours × Rate. Location is tracked continuously while on shift.</p>
          </div>
          {/* Live tracking indicator */}
          {trackingActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(74,222,128,0.08)', border: `1px solid rgba(74,222,128,0.3)`, borderRadius: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, color: GREEN, fontWeight: 700, fontFamily: FD }}>Location Tracking Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Active shift banner */}
      {shifts.filter(s => s.status === 'CHECKED_IN').map(s => {
        const job = jobs.get(s.jobId);
        if (!job) return null;
        return (
          <div key={s.id} style={{ padding: '20px 24px', background: 'rgba(74,222,128,0.06)', border: `1px solid rgba(74,222,128,0.3)`, borderRadius: 3, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: GREEN, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                🟢 Active Shift — Earning Now
              </div>
              {trackingActive && loc && (
                <div style={{ fontSize: 10, color: GREEN, fontFamily: FB }}>
                  📍 {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                </div>
              )}
            </div>
            <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: W, marginBottom: 4 }}>{job.title}</div>
            <div style={{ fontSize: 12, color: WM, marginBottom: 16 }}>{job.venue} · R{job.hourlyRate}/hr</div>
            {s.checkInTime && <LiveEarningsTimer checkInTime={s.checkInTime} hourlyRate={job.hourlyRate} />}
            <button onClick={() => checkGps(s)}
              style={{ marginTop: 16, width: '100%', padding: '12px', background: 'rgba(74,222,128,0.1)', border: `1px solid rgba(74,222,128,0.4)`, color: GREEN, fontFamily: FD, fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Check Out →
            </button>
          </div>
        );
      })}

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { v: 'all',              l: 'All'       },
          { v: 'SCHEDULED',        l: 'Scheduled' },
          { v: 'CHECKED_IN',       l: 'On Shift'  },
          { v: 'PENDING_APPROVAL', l: 'Pending'   },
          { v: 'APPROVED',         l: 'Approved'  },
        ].map(opt => {
          const count = opt.v === 'all' ? shifts.length : shifts.filter(s => s.status === opt.v).length;
          return (
            <button key={opt.v} onClick={() => setStatusFilter(opt.v)}
              style={{ padding: '7px 16px', border: `1px solid ${statusFilter === opt.v ? GL : BB}`, background: statusFilter === opt.v ? 'rgba(232,168,32,0.12)' : 'transparent', color: statusFilter === opt.v ? GL : WM, fontFamily: FB, fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 2, transition: 'all 0.2s' }}>
              {opt.l}
              {count > 0 && <span style={{ marginLeft: 6, fontSize: 10, color: statusFilter === opt.v ? GL : WD }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Shifts list */}
      {filteredShifts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: WD, background: BC, border: `1px solid ${BB}`, borderRadius: 2 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 14, color: WM, marginBottom: 8 }}>No shifts found</p>
          <p style={{ fontSize: 12, color: WD }}>
            {statusFilter === 'all'
              ? 'Once a business confirms you for a job, your shift will appear here.'
              : `No ${statusFilter.toLowerCase().replace(/_/g, ' ')} shifts right now.`}
          </p>
        </div>
      ) : (
        <div style={{ background: BC, border: `1px solid ${BB}`, overflow: 'hidden', borderRadius: 2 }}>
          {filteredShifts.map((shift, i) => {
            const job      = jobs.get(shift.jobId);
            const isActive = shift.status === 'CHECKED_IN';
            return (
              <div key={shift.id} onClick={() => checkGps(shift)}
                style={{ padding: '18px 22px', borderBottom: i < filteredShifts.length - 1 ? `1px solid ${BB}` : 'none', cursor: 'pointer', background: isActive ? 'rgba(74,222,128,0.03)' : 'transparent', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(74,222,128,0.03)' : 'transparent'; }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: W, fontFamily: FD, marginBottom: 3 }}>{job?.title || 'Loading…'}</div>
                  <div style={{ fontSize: 12, color: WM, marginBottom: 2 }}>
                    {job?.venue || '—'} · {job?.date ? new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: WD }}>{job?.startTime}–{job?.endTime} · R{job?.hourlyRate}/hr</div>
                  {shift.checkInTime && (
                    <div style={{ fontSize: 11, color: TEAL, marginTop: 4 }}>
                      ✓ Checked in: {new Date(shift.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {shift.totalHours != null && job && (
                    <div style={{ fontSize: 11, color: GL, marginTop: 2 }}>
                      💰 {shift.totalHours}h × R{job.hourlyRate} = R{Math.round(shift.totalHours * job.hourlyRate)}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  {statusBadge(shift.status)}
                  {shift.status === 'SCHEDULED' && <div style={{ marginTop: 8, fontSize: 10, color: GL,   fontWeight: 700 }}>Tap to Check In →</div>}
                  {shift.status === 'CHECKED_IN' && <div style={{ marginTop: 8, fontSize: 10, color: GREEN, fontWeight: 700 }}>Tap to Check Out →</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {activeShift && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
          onClick={closeModal}>
          <div style={{ background: BC, border: `1px solid ${BB}`, borderRadius: 4, maxWidth: 520, width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: 32, position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${GL}, ${G2})` }} />
            <button onClick={closeModal} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: WD, fontSize: 18, lineHeight: 1 }}>✕</button>

            {(() => {
              const job = jobs.get(activeShift.jobId);
              return (
                <>
                  <h2 style={{ color: W, fontWeight: 800, fontSize: 20, marginBottom: 4, paddingRight: 24 }}>{job?.title || 'Shift'}</h2>
                  <p style={{ color: WM, fontSize: 13, marginBottom: 8 }}>{job?.venue || '—'} · R{job?.hourlyRate}/hr</p>
                  <div style={{ marginBottom: 20 }}>{statusBadge(activeShift.status)}</div>

                  {/* Shift details */}
                  {job && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                      {[
                        { label: 'Date',   value: new Date(job.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }) },
                        { label: 'Time',   value: `${job.startTime} – ${job.endTime}` },
                        { label: 'Rate',   value: `R${job.hourlyRate}/hr` },
                        { label: 'Client', value: job.client },
                      ].map(r => (
                        <div key={r.label} style={{ background: hex2rgba(GL, 0.04), border: `1px solid ${BB}`, padding: '8px 12px', borderRadius: 2 }}>
                          <div style={{ fontSize: 9, color: WD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>{r.label}</div>
                          <div style={{ fontSize: 12, color: W, fontWeight: 600 }}>{r.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Live earnings */}
                  {activeShift.status === 'CHECKED_IN' && activeShift.checkInTime && job && (
                    <div style={{ padding: 20, background: 'rgba(74,222,128,0.06)', border: `1px solid rgba(74,222,128,0.3)`, borderRadius: 3, marginBottom: 20, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: GREEN, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Live Earnings</div>
                      <LiveEarningsTimer checkInTime={activeShift.checkInTime} hourlyRate={job.hourlyRate} />
                      {trackingActive && loc && (
                        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(74,222,128,0.06)', border: `1px solid rgba(74,222,128,0.2)`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s ease-in-out infinite' }} />
                          <span style={{ fontSize: 10, color: GREEN, fontFamily: FB }}>
                            Location tracked · {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* GPS panel */}
                  <div style={{ padding: 16, borderRadius: 2, textAlign: 'center', marginBottom: 20, background: gps === 'near' ? 'rgba(74,171,184,0.08)' : gps === 'far' ? 'rgba(196,97,74,0.08)' : BC, border: `1px solid ${gps === 'near' ? 'rgba(74,171,184,0.4)' : gps === 'far' ? 'rgba(196,97,74,0.4)' : BB}` }}>
                    {gps === 'checking' && (<><div style={{ fontSize: 32, marginBottom: 8 }}>📡</div><p style={{ color: WM, margin: 0 }}>Getting your location…</p></>)}
                    {gps === 'near' && (<><div style={{ fontSize: 36, marginBottom: 8 }}>✅</div><p style={{ color: TEAL, fontWeight: 700, margin: '0 0 4px' }}>You're at the venue</p>{distM !== null && distM > 0 && <p style={{ color: WM, fontSize: 12, margin: 0 }}>{distM}m from check-in point</p>}</>)}
                    {gps === 'far'  && (<><div style={{ fontSize: 36, marginBottom: 8 }}>📍</div><p style={{ color: CORAL, fontWeight: 700, margin: '0 0 4px' }}>Too far away</p><p style={{ color: WM, fontSize: 12, margin: 0 }}>{distM}m away — must be within {GEO_THRESHOLD_M}m</p></>)}
                    {gps === 'denied' && (<><div style={{ fontSize: 36, marginBottom: 8 }}>🚫</div><p style={{ color: CORAL, margin: 0 }}>Location access denied</p></>)}
                    {gps === 'idle'   && (<p style={{ color: WM, margin: 0, fontSize: 13 }}>Tap below to verify your location</p>)}
                  </div>

                  {/* Selfie panel */}
                  {selfieAction !== 'none' && gps === 'near' && (
                    <div style={{ marginBottom: 20, padding: 20, background: hex2rgba(GL, 0.04), border: `1px solid ${hex2rgba(GL, 0.28)}`, borderRadius: 2, textAlign: 'center' }}>
                      <p style={{ color: GL, fontWeight: 700, marginBottom: 16, fontSize: 13 }}>
                        📸 {selfieAction === 'checkin' ? 'Check-in' : 'Check-out'} selfie (optional)
                      </p>
                      <label htmlFor="selfie-input" style={{ cursor: 'pointer', display: 'block', marginBottom: 16 }}>
                        <input id="selfie-input" type="file" accept="image/*" capture="user" style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelfieFile(file);
                              const reader = new FileReader();
                              reader.onload = () => setSelfiePreview(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} />
                        {selfiePreview
                          ? <img src={selfiePreview} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 3, border: `1px solid ${BB}` }} />
                          : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: `2px dashed ${GL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 32 }}>🤳</div>
                        }
                      </label>
                      <button onClick={selfieAction === 'checkin' ? doCheckIn : doCheckOut} disabled={working}
                        style={{ width: '100%', padding: '12px', background: working ? BB : `linear-gradient(135deg,${GL},${G})`, border: 'none', color: working ? WM : B, fontFamily: FD, fontSize: 11, fontWeight: 700, cursor: working ? 'not-allowed' : 'pointer', borderRadius: 3, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                        {working ? 'Processing…' : selfieAction === 'checkin' ? '✓ Confirm Check-In' : '✓ Confirm Check-Out'}
                      </button>
                      <button onClick={selfieAction === 'checkin' ? doCheckIn : doCheckOut} disabled={working}
                        style={{ background: 'none', border: 'none', color: WD, fontSize: 11, cursor: 'pointer', textDecoration: 'underline', fontFamily: FB }}>
                        Skip selfie and {selfieAction === 'checkin' ? 'check in' : 'check out'} anyway
                      </button>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeShift.status === 'SCHEDULED' && gps === 'near' && selfieAction === 'none' && (
                      <button onClick={() => setSelfieAction('checkin')}
                        style={{ padding: '13px', background: `linear-gradient(135deg,${GL},${G})`, border: 'none', color: B, fontFamily: FD, fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                        🟢 Start Shift — Check In
                      </button>
                    )}
                    {activeShift.status === 'CHECKED_IN' && gps === 'near' && selfieAction === 'none' && (
                      <button onClick={() => setSelfieAction('checkout')}
                        style={{ padding: '13px', background: 'rgba(196,97,74,0.15)', border: `1px solid ${CORAL}`, color: CORAL, fontFamily: FD, fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                        🔴 End Shift — Check Out
                      </button>
                    )}
                    {['PENDING_APPROVAL', 'APPROVED'].includes(activeShift.status) && (
                      <div style={{ padding: '13px', background: hex2rgba(GL, 0.06), border: `1px solid ${BB}`, borderRadius: 3, textAlign: 'center', fontSize: 13, color: GL, fontFamily: FD }}>
                        ✓ Shift completed — {activeShift.totalHours ? `${activeShift.totalHours}h worked · R${Math.round(activeShift.totalHours * (jobs.get(activeShift.jobId)?.hourlyRate || 0))} earned` : 'pending approval'}
                      </div>
                    )}
                    {(gps === 'idle' || gps === 'far') && (
                      <button onClick={() => checkGps(activeShift)}
                        style={{ padding: '11px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 12, cursor: 'pointer', borderRadius: 3 }}>
                        📡 Refresh Location
                      </button>
                    )}
                    <button onClick={closeModal}
                      style={{ padding: '11px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 12, cursor: 'pointer', borderRadius: 3 }}>
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};