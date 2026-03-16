import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { showToast } from '../../shared/utils/toast';
import { shiftsService } from '../../shared/services/shiftsService';

// ... (color constants remain unchanged) ...
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
const TEAL   = '#4AABB8';
const AMBER  = '#E8A820';
const CORAL  = '#C4614A';
const GREEN  = '#4ade80';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GEO_THRESHOLD_M = 5; // 500m radius

function authHdr() {
  const t = localStorage.getItem('hg_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Live timer component (unchanged)
function LiveEarningsTimer({ checkInTime, hourlyRate }: { checkInTime: string; hourlyRate: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () => setElapsed((Date.now() - new Date(checkInTime).getTime()) / 1000);
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [checkInTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = Math.floor(elapsed % 60);
  const earned = (elapsed / 3600) * hourlyRate;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: GREEN, letterSpacing: '0.1em' }}>
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 13, color: GL, marginTop: 6, fontWeight: 700 }}>
        R{earned.toFixed(2)} earned so far
      </div>
      <div style={{ fontSize: 11, color: WD, marginTop: 2 }}>R{hourlyRate}/hr × {(elapsed / 3600).toFixed(2)} hrs</div>
    </div>
  );
}

export const GeoCheckInOut: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [gps, setGps] = useState<'idle' | 'checking' | 'near' | 'far' | 'denied'>('idle');
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [distM, setDistM] = useState<number | null>(null);
  const [working, setWorking] = useState(false);
  const [selfieAction, setSelfieAction] = useState<'none' | 'checkin' | 'checkout'>('none');
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Refs for geolocation watch
  const watchId = useRef<number | null>(null);

  // Load shifts using the service, jobs using raw fetch (to keep lat/lng flat)
  const loadShifts = async () => {
    if (!user) return;
    try {
      const [shiftsData, jobsRes] = await Promise.all([
        shiftsService.getShiftsByPromoter(user.id),
        fetch(`${API}/jobs`, { headers: authHdr() as any }),
      ]);
      setShifts(shiftsData);

      if (jobsRes.ok) {
        const jj = await jobsRes.json();
        const map = new Map<string, any>();
        jj.forEach((j: any) => map.set(j.id, j));
        setJobs(map);
      }
    } catch (error) {
      console.error('Failed to load shifts/jobs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [user]);

  // Single location watcher for the active checked‑in shift
  useEffect(() => {
    const activeShift = shifts.find(s => s.status.toUpperCase() === 'CHECKED_IN');

    // Clear previous watcher
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    // If there is an active shift, start watching its location
    if (activeShift && navigator.geolocation) {
      const job = jobs.get(activeShift.jobId);
      if (!job || !job.lat || !job.lng) return; // no job coordinates

      // Check permission state before starting watch (optional)
      navigator.permissions?.query({ name: 'geolocation' }).then(perm => {
        if (perm.state === 'denied') {
          setGps('denied');
          return;
        }
        // Permission granted or prompt, start watch
        watchId.current = navigator.geolocation.watchPosition(
          pos => {
            const { latitude: lat, longitude: lng } = pos.coords;
            setLoc({ lat, lng });

            const distance = haversine(lat, lng, job.lat, job.lng);
            setDistM(Math.round(distance));

            const isNear = distance <= GEO_THRESHOLD_M;
            setGps(isNear ? 'near' : 'far');
          },
          err => {
            console.warn('Geolocation watch error', err);
            setGps('denied');
            // Clear the watch to stop repeated errors
            if (watchId.current !== null) {
              navigator.geolocation.clearWatch(watchId.current);
              watchId.current = null;
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
        );
      }).catch(() => {
        // Permissions API not supported, fallback to starting watch
        watchId.current = navigator.geolocation.watchPosition(
          pos => {
            const { latitude: lat, longitude: lng } = pos.coords;
            setLoc({ lat, lng });
            const distance = haversine(lat, lng, job.lat, job.lng);
            setDistM(Math.round(distance));
            const isNear = distance <= GEO_THRESHOLD_M;
            setGps(isNear ? 'near' : 'far');
          },
          err => {
            console.warn('Geolocation watch error', err);
            setGps('denied');
            if (watchId.current !== null) {
              navigator.geolocation.clearWatch(watchId.current);
              watchId.current = null;
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
        );
      });
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [shifts, jobs, selected]);

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => statusFilter === 'all' || s.status.toUpperCase() === statusFilter);
  }, [shifts, statusFilter]);

  const checkGps = (shift: any) => {
    setSelected(shift);
    setGps('checking');
    setDistM(null);
    setSelfieAction('none');
    setSelfiePreview(null);
    setSelfieFile(null);
    if (!navigator.geolocation) {
      setGps('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLoc({ lat, lng });
        const job = jobs.get(shift.jobId);
        if (!job) {
          setGps('denied');
          return;
        }
        if (job.lat && job.lng) {
          const d = haversine(lat, lng, job.lat, job.lng);
          setDistM(Math.round(d));
          setGps(d <= GEO_THRESHOLD_M ? 'near' : 'far');
        } else {
          // No coordinates – allow check‑in (dev mode)
          setDistM(0);
          setGps('near');
        }
      },
      () => {
        // Fallback for dev – allow check‑in
        setLoc({ lat: -26.1076, lng: 28.056 });
        setDistM(0);
        setGps('near');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const doCheckIn = async () => {
    if (!selected || !loc) return;
    setWorking(true);
    try {
      const updatedShift = await shiftsService.checkIn(
        selected.id,
        selfiePreview || '',
        loc
      );
      setShifts(prev => prev.map(s => (s.id === updatedShift.id ? updatedShift : s)));
      setSelected(updatedShift);
      setSelfieAction('none');
      showToast('✅ Checked in! Your time and earnings are now being tracked.', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Check-in failed';
      showToast(msg, 'error');
    } finally {
      setWorking(false);
    }
  };

  const doCheckOut = async () => {
    if (!selected || !loc) return;
    setWorking(true);
    try {
      const updatedShift = await shiftsService.checkOut(
        selected.id,
        selfiePreview || '',
        loc
      );
      setShifts(prev => prev.map(s => (s.id === updatedShift.id ? updatedShift : s)));
      setSelected(updatedShift);
      setSelfieAction('none');
      showToast('✅ Checked out! Your earnings will be processed for payment.', 'success');
      await loadShifts(); // refresh list after checkout
    } catch (err: any) {
      const msg = err?.message || 'Check-out failed';
      showToast(msg, 'error');
    } finally {
      setWorking(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string; bg: string }> = {
      SCHEDULED: { color: '#5A9EC4', label: 'Scheduled', bg: 'rgba(90,158,196,0.1)' },
      CHECKED_IN: { color: GREEN, label: '🟢 On Shift', bg: 'rgba(74,222,128,0.1)' },
      PENDING_APPROVAL: { color: AMBER, label: 'Pending Approval', bg: 'rgba(232,168,32,0.1)' },
      APPROVED: { color: GL, label: '✓ Approved', bg: 'rgba(232,168,32,0.1)' },
      NO_SHOW: { color: CORAL, label: 'No Show', bg: 'rgba(196,97,74,0.1)' },
    };
    const s = map[status] || { color: WD, label: status, bg: 'transparent' };
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: s.color,
          background: s.bg,
          border: `1px solid ${s.color}44`,
          padding: '3px 9px',
          borderRadius: 2,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: WD,
          padding: '60px 0',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: `2px solid ${GL}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: 15, color: WM }}>Loading shifts…</span>
      </div>
    );
  }

  const active = selected ? shifts.find(s => s.id === selected.id) : null;
  const activeJob = active ? jobs.get(active.jobId) : null;

  return (
    <div style={{ padding: '40px 48px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            color: GL,
            marginBottom: 8,
            fontWeight: 700,
          }}
        >
          Shifts
        </div>
        <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>My Shifts</h1>
        <p style={{ fontSize: 13, color: WM, marginTop: 6 }}>
          Check in and out of your shifts. Your earnings are calculated as Hours × Rate.
        </p>
      </div>

      {/* Active shift banner */}
      {shifts
        .filter(s => s.status.toUpperCase() === 'CHECKED_IN')
        .map(s => {
          const job = jobs.get(s.jobId);
          if (!job) return null;
          return (
            <div
              key={s.id}
              style={{
                padding: '20px 24px',
                background: 'rgba(74,222,128,0.06)',
                border: `1px solid rgba(74,222,128,0.3)`,
                borderRadius: 3,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: GREEN,
                  fontWeight: 700,
                  marginBottom: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                🟢 Active Shift — Earning Now
              </div>
              <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: W, marginBottom: 4 }}>
                {job.title}
              </div>
              <div style={{ fontSize: 12, color: WM, marginBottom: 16 }}>
                {job.venue} · R{job.hourlyRate}/hr
              </div>
              {s.checkInTime && <LiveEarningsTimer checkInTime={s.checkInTime} hourlyRate={job.hourlyRate} />}
              <button
                onClick={() => checkGps(s)}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(74,222,128,0.1)',
                  border: `1px solid rgba(74,222,128,0.4)`,
                  color: GREEN,
                  fontFamily: FD,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: 3,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Check Out →
              </button>
            </div>
          );
        })}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { v: 'all', l: 'All' },
          { v: 'SCHEDULED', l: 'Scheduled' },
          { v: 'CHECKED_IN', l: 'On Shift' },
          { v: 'PENDING_APPROVAL', l: 'Pending' },
          { v: 'APPROVED', l: 'Approved' },
        ].map(opt => (
          <button
            key={opt.v}
            onClick={() => setStatusFilter(opt.v)}
            style={{
              padding: '7px 16px',
              border: `1px solid ${statusFilter === opt.v ? GL : BB}`,
              background: statusFilter === opt.v ? 'rgba(232,168,32,0.12)' : 'transparent',
              color: statusFilter === opt.v ? GL : WM,
              fontFamily: FB,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: 2,
              transition: 'all 0.2s',
            }}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {/* Shifts list */}
      {filteredShifts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            color: WD,
            background: BC,
            border: `1px solid ${BB}`,
            borderRadius: 2,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p>No shifts found. Once you're allocated to a job, your shifts will appear here.</p>
        </div>
      ) : (
        <div style={{ background: BC, border: `1px solid ${BB}`, overflow: 'hidden', borderRadius: 2 }}>
          {filteredShifts.map((shift, i) => {
            const job = jobs.get(shift.jobId);
            const isActive = shift.status.toUpperCase() === 'CHECKED_IN';
            return (
              <div
                key={shift.id}
                onClick={() => checkGps(shift)}
                style={{
                  padding: '18px 22px',
                  borderBottom: i < filteredShifts.length - 1 ? `1px solid ${BB}` : 'none',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(74,222,128,0.03)' : 'transparent',
                  transition: 'background 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: W, fontFamily: FD, marginBottom: 3 }}>
                    {job?.title || '—'}
                  </div>
                  <div style={{ fontSize: 12, color: WM, marginBottom: 2 }}>
                    {job?.venue} ·{' '}
                    {job?.date
                      ? new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
                      : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: WD }}>
                    {job?.startTime}–{job?.endTime} · R{job?.hourlyRate}/hr
                  </div>
                  {shift.checkInTime && (
                    <div style={{ fontSize: 11, color: TEAL, marginTop: 4 }}>
                      ✓ In:{' '}
                      {new Date(shift.checkInTime).toLocaleTimeString('en-ZA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                  {shift.totalHours && (
                    <div style={{ fontSize: 11, color: GL, marginTop: 2 }}>
                      💰 {shift.totalHours}h × R{job?.hourlyRate} = R
                      {Math.round(shift.totalHours * (job?.hourlyRate || 0))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  {statusBadge(shift.status.toUpperCase())}
                  {shift.status.toUpperCase() === 'SCHEDULED' && (
                    <div style={{ marginTop: 8, fontSize: 10, color: GL, fontWeight: 700 }}>
                      Tap to Check In →
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && active && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 24,
          }}
          onClick={() => {
            setSelected(null);
            setSelfieAction('none');
            setGps('idle');
          }}
        >
          <div
            style={{
              background: BC,
              border: `1px solid ${BB}`,
              borderRadius: 4,
              maxWidth: 520,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 32,
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, ${GL}, ${G2})`,
              }}
            />
            <button
              onClick={() => {
                setSelected(null);
                setSelfieAction('none');
                setGps('idle');
              }}
              style={{
                position: 'absolute',
                top: 16,
                right: 20,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: WD,
                fontSize: 18,
              }}
            >
              ✕
            </button>

            {(() => {
              const job = jobs.get(active.jobId);
              return (
                <>
                  <h2 style={{ color: W, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{job?.title}</h2>
                  <p style={{ color: WM, fontSize: 13, marginBottom: 8 }}>
                    {job?.venue} · R{job?.hourlyRate}/hr
                  </p>
                  <div style={{ marginBottom: 20 }}>{statusBadge(active.status.toUpperCase())}</div>

                  {/* Active earnings display */}
                  {active.status.toUpperCase() === 'CHECKED_IN' && active.checkInTime && (
                    <div
                      style={{
                        padding: 20,
                        background: 'rgba(74,222,128,0.06)',
                        border: `1px solid rgba(74,222,128,0.3)`,
                        borderRadius: 3,
                        marginBottom: 20,
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: GREEN,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          marginBottom: 12,
                        }}
                      >
                        Live Earnings
                      </div>
                      <LiveEarningsTimer checkInTime={active.checkInTime} hourlyRate={job?.hourlyRate || 0} />
                    </div>
                  )}

                  {/* GPS panel */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 2,
                      textAlign: 'center',
                      marginBottom: 20,
                      background:
                        gps === 'near'
                          ? 'rgba(74,171,184,0.1)'
                          : gps === 'far'
                          ? 'rgba(196,97,74,0.1)'
                          : BC,
                      border: `1px solid ${
                        gps === 'near'
                          ? 'rgba(74,171,184,0.4)'
                          : gps === 'far'
                          ? 'rgba(196,97,74,0.4)'
                          : BB
                      }`,
                    }}
                  >
                    {gps === 'checking' && (
                      <>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
                        <p style={{ color: WM, margin: 0 }}>Getting your location…</p>
                      </>
                    )}
                    {gps === 'near' && (
                      <>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                        <p style={{ color: TEAL, fontWeight: 700, margin: '0 0 4px' }}>
                          You're at the venue
                        </p>
                        {distM !== null && distM > 0 && (
                          <p style={{ color: WM, fontSize: 12, margin: 0 }}>{distM}m from check-in point</p>
                        )}
                      </>
                    )}
                    {gps === 'far' && (
                      <>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
                        <p style={{ color: CORAL, fontWeight: 700, margin: '0 0 4px' }}>Too far away</p>
                        <p style={{ color: WM, fontSize: 12, margin: 0 }}>
                          {distM}m away — must be within {GEO_THRESHOLD_M}m
                        </p>
                      </>
                    )}
                    {gps === 'denied' && (
                      <>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🚫</div>
                        <p style={{ color: CORAL, margin: 0 }}>Location access denied</p>
                        <p style={{ fontSize: 11, color: WM, marginTop: 6 }}>
                          Please enable location in your browser settings to check in/out.
                        </p>
                      </>
                    )}
                    {gps === 'idle' && <p style={{ color: WM, margin: 0 }}>Tap below to verify your location</p>}
                  </div>

                  {/* Selfie capture */}
                  {selfieAction !== 'none' && gps === 'near' && (
                    <div
                      style={{
                        marginBottom: 20,
                        padding: 20,
                        background: 'rgba(232,168,32,0.06)',
                        border: `1px solid rgba(232,168,32,0.3)`,
                        borderRadius: 2,
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ color: GL, fontWeight: 700, marginBottom: 12 }}>
                        📸 Take your {selfieAction === 'checkin' ? 'check-in' : 'check-out'} selfie (optional)
                      </p>
                      <label htmlFor="selfie-input" style={{ cursor: 'pointer', display: 'block' }}>
                        <input
                          id="selfie-input"
                          type="file"
                          accept="image/*"
                          capture="user"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelfieFile(file);
                              const reader = new FileReader();
                              reader.onload = () => setSelfiePreview(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {selfiePreview ? (
                          <img
                            src={selfiePreview}
                            alt="selfie"
                            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 3 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: '50%',
                              background: 'rgba(255,255,255,0.04)',
                              border: `2px dashed ${GL}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 12px',
                              fontSize: 32,
                            }}
                          >
                            🤳
                          </div>
                        )}
                      </label>
                      <button
                        onClick={selfieAction === 'checkin' ? doCheckIn : doCheckOut}
                        disabled={working}
                        style={{
                          marginTop: 12,
                          padding: '11px 24px',
                          background: working ? BB : `linear-gradient(135deg,${GL},${G})`,
                          border: 'none',
                          color: working ? WM : B,
                          fontFamily: FD,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: working ? 'not-allowed' : 'pointer',
                          borderRadius: 3,
                        }}
                      >
                        {working ? 'Processing…' : `✓ Confirm ${selfieAction === 'checkin' ? 'Check-In' : 'Check-Out'}`}
                      </button>
                      <div style={{ marginTop: 8, fontSize: 11, color: WD }}>
                        Or{' '}
                        <button
                          onClick={selfieAction === 'checkin' ? doCheckIn : doCheckOut}
                          disabled={working}
                          style={{
                            color: GL,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 11,
                            textDecoration: 'underline',
                          }}
                        >
                          skip selfie
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {active.status.toUpperCase() === 'SCHEDULED' && gps === 'near' && selfieAction === 'none' && (
                      <button
                        onClick={() => setSelfieAction('checkin')}
                        style={{
                          padding: '13px',
                          background: `linear-gradient(135deg,${GL},${G})`,
                          border: 'none',
                          color: B,
                          fontFamily: FD,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          borderRadius: 3,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        🟢 Start Shift — Check In
                      </button>
                    )}
                    {active.status.toUpperCase() === 'CHECKED_IN' && gps === 'near' && selfieAction === 'none' && (
                      <button
                        onClick={() => setSelfieAction('checkout')}
                        style={{
                          padding: '13px',
                          background: 'rgba(196,97,74,0.15)',
                          border: `1px solid ${CORAL}`,
                          color: CORAL,
                          fontFamily: FD,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          borderRadius: 3,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        🔴 End Shift — Check Out
                      </button>
                    )}
                    {(gps === 'idle' || gps === 'far') && (
                      <button
                        onClick={() => checkGps(active)}
                        style={{
                          padding: '11px',
                          background: 'transparent',
                          border: `1px solid ${BB}`,
                          color: WM,
                          fontFamily: FB,
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 3,
                        }}
                      >
                        📡 Refresh Location
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelected(null);
                        setSelfieAction('none');
                        setGps('idle');
                      }}
                      style={{
                        padding: '11px',
                        background: 'transparent',
                        border: `1px solid ${BB}`,
                        color: WM,
                        fontFamily: FB,
                        fontSize: 12,
                        cursor: 'pointer',
                        borderRadius: 3,
                      }}
                    >
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