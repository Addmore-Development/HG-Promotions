import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { showToast } from '../../shared/utils/toast';
import { shiftsService } from '../../shared/services/shiftsService';

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
const GEO_THRESHOLD_M  = 5;
const LOCATION_PING_MS = 30_000;
const LATE_THRESHOLD_MS = 1 * 60 * 1000;

function authHdr(): HeadersInit {
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

function calcLateMinutes(jobDate: string | Date, startTime: string): number {
  const [h, m] = startTime.split(':').map(Number);
  const shiftStart = new Date(jobDate);
  shiftStart.setHours(h, m, 0, 0);
  const diffMs = Date.now() - shiftStart.getTime();
  if (diffMs <= LATE_THRESHOLD_MS) return 0;
  return Math.floor(diffMs / 60_000);
}

function MapsButton({ lat, lng }: { lat: number; lng: number }) {
  return (
    <a
      href={`https://www.google.com/maps?q=${lat},${lng}`}
      target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(232,168,32,0.08)', border: '1px solid rgba(232,168,32,0.3)', borderRadius: 3, color: GL, fontSize: 11, fontFamily: FD, fontWeight: 700, textDecoration: 'none' }}
    >
      Open in Google Maps
    </a>
  );
}

function LiveEarningsTimer({ checkInTime, hourlyRate }: { checkInTime: string; hourlyRate: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () => setElapsed((Date.now() - new Date(checkInTime).getTime()) / 1000);
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [checkInTime]);
  const hrs = Math.floor(elapsed / 3600);
  const min = Math.floor((elapsed % 3600) / 60);
  const sec = Math.floor(elapsed % 60);
  const earned = (elapsed / 3600) * hourlyRate;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: GREEN, letterSpacing: '0.1em' }}>
        {String(hrs).padStart(2, '0')}:{String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 13, color: GL, marginTop: 6, fontWeight: 700 }}>R{earned.toFixed(2)} earned so far</div>
      <div style={{ fontSize: 11, color: WD, marginTop: 2 }}>R{hourlyRate}/hr x {(elapsed / 3600).toFixed(2)} hrs</div>
    </div>
  );
}

// ── In-page camera component (works on desktop AND mobile) ───────────────────
function CameraCapture({ onCapture, onCancel, action }: {
  onCapture: (file: File, preview: string) => void;
  onCancel: () => void;
  action: 'checkin' | 'checkout';
}) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const [ready,     setReady]     = useState(false);
  const [captured,  setCaptured]  = useState<string | null>(null);
  const [camError,  setCamError]  = useState('');

  // Start camera on mount
  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setReady(true);
        }
      })
      .catch(err => {
        console.error('[Camera]', err);
        setCamError('Camera access denied. Please allow camera access and try again.');
      });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const takePicture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror the image (selfie orientation)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCaptured(dataUrl);
    // Stop stream after capture
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const retake = () => {
    setCaptured(null);
    // Restart camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(() => setCamError('Could not restart camera.'));
  };

  const confirmPhoto = () => {
    if (!captured || !canvasRef.current) return;
    canvasRef.current.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file, captured);
    }, 'image/jpeg', 0.85);
  };

  if (camError) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
        <p style={{ color: CORAL, fontSize: 13, fontFamily: FB, marginBottom: 16 }}>{camError}</p>
        <button onClick={onCancel} style={{ padding: '10px 24px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 12, cursor: 'pointer', borderRadius: 4 }}>Cancel</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: GL, fontWeight: 700, fontSize: 14, fontFamily: FD, marginBottom: 4 }}>
        {action === 'checkin' ? 'Check-in selfie required' : 'Check-out selfie required'}
      </p>
      <p style={{ color: WD, fontSize: 11, marginBottom: 14, fontFamily: FB }}>
        Take a clear photo of your face.
      </p>

      {/* Live video preview (hidden once captured) */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', marginBottom: 14, display: captured ? 'none' : 'block' }}>
        <video
          ref={videoRef}
          style={{ width: '100%', maxHeight: 240, objectFit: 'cover', transform: 'scaleX(-1)', borderRadius: 8, display: ready ? 'block' : 'none', background: '#000' }}
          playsInline muted
        />
        {!ready && (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', borderRadius: 8 }}>
            <span style={{ color: WD, fontSize: 13, fontFamily: FB }}>Starting camera...</span>
          </div>
        )}
      </div>

      {/* Captured photo preview */}
      {captured && (
        <div style={{ marginBottom: 14 }}>
          <img src={captured} alt="selfie" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 8, border: `1px solid ${hex2rgba(GL, 0.3)}` }} />
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'flex', gap: 10 }}>
        {!captured ? (
          <>
            <button onClick={onCancel}
              style={{ flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 12, cursor: 'pointer', borderRadius: 6 }}>
              Cancel
            </button>
            <button onClick={takePicture} disabled={!ready}
              style={{ flex: 2, padding: '11px', background: ready ? `linear-gradient(135deg,${GL},${G})` : BB, border: 'none', color: ready ? B : WM, fontFamily: FD, fontSize: 12, fontWeight: 700, cursor: ready ? 'pointer' : 'not-allowed', borderRadius: 6, letterSpacing: '0.06em' }}>
              {ready ? 'Take Photo' : 'Loading...'}
            </button>
          </>
        ) : (
          <>
            <button onClick={retake}
              style={{ flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 12, cursor: 'pointer', borderRadius: 6 }}>
              Retake
            </button>
            <button onClick={confirmPhoto}
              style={{ flex: 2, padding: '11px', background: `linear-gradient(135deg,${GL},${G})`, border: 'none', color: B, fontFamily: FD, fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 6, letterSpacing: '0.06em' }}>
              Use This Photo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

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
  const [lateMinutes, setLateMinutes]     = useState<number>(0);
  // ── Camera open state ───────────────────────────────────────────────────────
  const [cameraOpen, setCameraOpen]       = useState(false);

  const watchIdRef       = useRef<number | null>(null);
  const pingIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentLocRef    = useRef<{ lat: number; lng: number } | null>(null);
  const activeShiftIdRef = useRef<string | null>(null);

  const activeShift = selectedId ? (shifts.find(s => s.id === selectedId) || null) : null;

  const loadShifts = useCallback(async () => {
    if (!user) return;
    try {
      const [shiftsRes, jobsRes] = await Promise.all([
        fetch(`${API}/shifts/my`, { headers: authHdr() }),
        fetch(`${API}/jobs`,      { headers: authHdr() }),
      ]);
      const ss: any[] = shiftsRes.ok ? await shiftsRes.json() : [];
      const jj: any[] = jobsRes.ok   ? await jobsRes.json()  : [];
      setShifts(ss);
      const map = new Map<string, any>();
      jj.forEach((j: any) => map.set(j.id, j));
      setJobs(map);
    } catch (e) { console.error('[GeoCheckInOut] loadShifts error:', e); }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadShifts(); }, [loadShifts]);

  const sendLocationPing = useCallback(async (shiftId: string) => {
    const currentLoc = currentLocRef.current;
    if (!currentLoc) return;
    try {
      await fetch(`${API}/shifts/location/update`, {
        method: 'POST',
        headers: { ...authHdr(), 'Content-Type': 'application/json' } as HeadersInit,
        body: JSON.stringify({ lat: currentLoc.lat, lng: currentLoc.lng, shiftId }),
      });
    } catch (e) { console.warn('[Location] Ping failed (non-fatal):', e); }
  }, []);

  const startTracking = useCallback((shiftId: string) => {
    if (trackingActive) return;
    activeShiftIdRef.current = shiftId;
    setTrackingActive(true);
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(newLoc); currentLocRef.current = newLoc;
      },
      err => console.warn('[Location] Watch error:', err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
    pingIntervalRef.current = setInterval(() => {
      if (activeShiftIdRef.current) sendLocationPing(activeShiftIdRef.current);
    }, LOCATION_PING_MS);
    setTimeout(() => sendLocationPing(shiftId), 2000);
  }, [trackingActive, sendLocationPing]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) { navigator.geolocation?.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (pingIntervalRef.current !== null) { clearInterval(pingIntervalRef.current); pingIntervalRef.current = null; }
    activeShiftIdRef.current = null;
    setTrackingActive(false);
  }, []);

  useEffect(() => {
    const checkedInShift = shifts.find(s => s.status === 'CHECKED_IN');
    if (checkedInShift && !trackingActive) startTracking(checkedInShift.id);
    else if (!checkedInShift && trackingActive) stopTracking();
  }, [shifts, trackingActive, startTracking, stopTracking]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
      if (pingIntervalRef.current !== null) clearInterval(pingIntervalRef.current);
    };
  }, []);

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => statusFilter === 'all' || s.status.toUpperCase() === statusFilter);
  }, [shifts, statusFilter]);

  const closeModal = () => {
    setSelectedId(null);
    setSelfieAction('none');
    setSelfiePreview(null);
    setSelfieFile(null);
    setGps('idle');
    setDistM(null);
    setLateMinutes(0);
    setCameraOpen(false);
  };

  const checkGps = (shift: any) => {
    setSelectedId(shift.id);
    setGps('checking');
    setDistM(null);
    setSelfieAction('none');
    setSelfiePreview(null);
    setSelfieFile(null);
    setCameraOpen(false);

    const job = jobs.get(shift.jobId);
    if (job?.date && job?.startTime && shift.status === 'SCHEDULED') {
      setLateMinutes(calcLateMinutes(job.date, job.startTime));
    } else {
      setLateMinutes(0);
    }

    if (!navigator.geolocation) {
      setLoc({ lat: -26.2041, lng: 28.0473 });
      currentLocRef.current = { lat: -26.2041, lng: 28.0473 };
      setDistM(0); setGps('near'); return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const newLoc = { lat, lng };
        setLoc(newLoc); currentLocRef.current = newLoc;
        const jobForGeo = jobs.get(shift.jobId);
        if (!jobForGeo || !jobForGeo.lat || !jobForGeo.lng) { setDistM(0); setGps('near'); return; }
        const d = haversine(lat, lng, jobForGeo.lat, jobForGeo.lng);
        setDistM(Math.round(d));
        setGps(d <= GEO_THRESHOLD_M ? 'near' : 'far');
      },
      () => {
        const fallback = { lat: -26.2041, lng: 28.0473 };
        setLoc(fallback); currentLocRef.current = fallback;
        setDistM(0); setGps('near');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const doCheckIn = async () => {
    if (!selectedId || !selfieFile) { showToast('Please take a selfie to check in.', 'error'); return; }
    const currentShift = shifts.find(s => s.id === selectedId);
    if (!currentShift) { showToast('Shift not found', 'error'); return; }
    if (currentShift.status === 'CHECKED_IN') { setSelfieAction('none'); showToast('You are already checked in.', 'info'); return; }
    if (['PENDING_APPROVAL', 'APPROVED'].includes(currentShift.status)) { setSelfieAction('none'); showToast('This shift has already been completed.', 'info'); return; }

    setWorking(true);
    try {
      const currentLoc = currentLocRef.current || loc || { lat: -26.2041, lng: 28.0473 };
      const formData = new FormData();
      formData.append('lat', String(currentLoc.lat));
      formData.append('lng', String(currentLoc.lng));
      formData.append('selfie', selfieFile);

      const res = await fetch(`${API}/shifts/${selectedId}/checkin`, { method: 'POST', headers: authHdr(), body: formData });

      if (res.ok) {
        const updated = await res.json();
        setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
        setSelfieAction('none'); setSelfiePreview(null); setSelfieFile(null);
        startTracking(selectedId);
        if (updated.isLate && updated.lateMinutes > 0) {
          showToast(`Checked in — you are ${updated.lateMinutes} minute${updated.lateMinutes > 1 ? 's' : ''} late.`, 'info');
        } else {
          showToast('Checked in! Your location and earnings are now being tracked.', 'success');
        }
      } else {
        const errBody = await res.json().catch(() => ({ error: 'Check-in failed' }));
        if (errBody.error?.toLowerCase().includes('already checked in')) {
          await loadShifts(); setSelfieAction('none'); showToast('You are already checked in.', 'info');
        } else {
          showToast(errBody.error || 'Check-in failed', 'error');
        }
      }
    } catch (e) { console.error('[CheckIn] error:', e); showToast('Check-in failed — please try again', 'error'); }
    setWorking(false);
  };

  const doCheckOut = async () => {
    if (!selectedId || !selfieFile) { showToast('Please take a selfie to check out.', 'error'); return; }
    const currentShift = shifts.find(s => s.id === selectedId);
    if (!currentShift) { showToast('Shift not found', 'error'); return; }
    if (currentShift.status !== 'CHECKED_IN') { setSelfieAction('none'); showToast('You need to check in before checking out.', 'error'); return; }

    setWorking(true);
    try {
      const currentLoc = currentLocRef.current || loc || { lat: -26.2041, lng: 28.0473 };
      const formData = new FormData();
      formData.append('lat', String(currentLoc.lat));
      formData.append('lng', String(currentLoc.lng));
      formData.append('selfie', selfieFile);

      const res = await fetch(`${API}/shifts/${selectedId}/checkout`, { method: 'POST', headers: authHdr(), body: formData });

      if (res.ok) {
        const updated = await res.json();
        setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
        setSelfieAction('none'); setSelfiePreview(null); setSelfieFile(null);
        stopTracking();
        showToast('Checked out! Earnings submitted for payment.', 'success');
        await loadShifts();
        window.dispatchEvent(new Event('payment-updated'));
      } else {
        const errBody = await res.json().catch(() => ({ error: 'Check-out failed' }));
        showToast(errBody.error || 'Check-out failed', 'error');
      }
    } catch (e) { console.error('[CheckOut] error:', e); showToast('Check-out failed — please try again', 'error'); }
    setWorking(false);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string; bg: string }> = {
      SCHEDULED:        { color: '#5A9EC4', label: 'Scheduled',        bg: 'rgba(90,158,196,0.1)'  },
      CHECKED_IN:       { color: GREEN,     label: 'On Shift',         bg: 'rgba(74,222,128,0.1)'  },
      PENDING_APPROVAL: { color: AMBER,     label: 'Pending Approval', bg: 'rgba(232,168,32,0.1)'  },
      APPROVED:         { color: GL,        label: 'Approved',         bg: 'rgba(232,168,32,0.1)'  },
      NO_SHOW:          { color: CORAL,     label: 'No Show',          bg: 'rgba(196,97,74,0.1)'   },
    };
    const s = map[status] || { color: WD, label: status, bg: 'transparent' };
    return (
      <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.color}44`, padding: '3px 9px', borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        {s.label}
      </span>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: WD, padding: '60px 0', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: `2px solid ${GL}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 15, color: WM }}>Loading shifts...</span>
    </div>
  );

  return (
    <div style={{ padding: '40px 48px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700 }}>Shifts</div>
            <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>My Shifts</h1>
            <p style={{ fontSize: 13, color: WM, marginTop: 6 }}>Earnings = Hours x Rate. Location is tracked continuously while on shift.</p>
          </div>
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
              <div style={{ fontSize: 12, color: GREEN, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Active Shift — Earning Now</div>
              {trackingActive && loc && <div style={{ fontSize: 10, color: GREEN, fontFamily: FB }}>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</div>}
            </div>
            <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: W, marginBottom: 4 }}>{job.title}</div>
            <div style={{ fontSize: 12, color: WM, marginBottom: 16 }}>{job.venue} · R{job.hourlyRate}/hr</div>
            {s.checkInTime && <LiveEarningsTimer checkInTime={s.checkInTime} hourlyRate={job.hourlyRate} />}
            {s.issueReport?.startsWith('LATE_CHECK_IN:') && (
              <div style={{ marginTop: 10, padding: '6px 12px', background: 'rgba(232,168,32,0.1)', border: `1px solid ${AMBER}`, borderRadius: 3, fontSize: 11, color: AMBER, fontWeight: 700, display: 'inline-block' }}>
                Late by {s.issueReport.replace('LATE_CHECK_IN:', '')} min
              </div>
            )}
            <button onClick={() => checkGps(s)}
              style={{ marginTop: 16, width: '100%', padding: '12px', background: 'rgba(74,222,128,0.1)', border: `1px solid rgba(74,222,128,0.4)`, color: GREEN, fontFamily: FD, fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Check Out
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
            {statusFilter === 'all' ? 'Once a business confirms you for a job, your shift will appear here.' : `No ${statusFilter.toLowerCase().replace(/_/g, ' ')} shifts right now.`}
          </p>
        </div>
      ) : (
        <div style={{ background: BC, border: `1px solid ${BB}`, overflow: 'hidden', borderRadius: 2 }}>
          {filteredShifts.map((shift, i) => {
            const job      = jobs.get(shift.jobId);
            const isActive = shift.status === 'CHECKED_IN';
            const isLate   = shift.issueReport?.startsWith('LATE_CHECK_IN:');
            return (
              <div key={shift.id} onClick={() => checkGps(shift)}
                style={{ padding: '18px 22px', borderBottom: i < filteredShifts.length - 1 ? `1px solid ${BB}` : 'none', cursor: 'pointer', background: isActive ? 'rgba(74,222,128,0.03)' : 'transparent', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(74,222,128,0.03)' : 'transparent'; }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: W, fontFamily: FD, marginBottom: 3 }}>{job?.title || 'Loading...'}</div>
                  <div style={{ fontSize: 12, color: WM, marginBottom: 2 }}>
                    {job?.venue || '—'} · {job?.date ? new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: WD }}>{job?.startTime}–{job?.endTime} · R{job?.hourlyRate}/hr</div>
                  {shift.checkInTime && (
                    <div style={{ fontSize: 11, color: TEAL, marginTop: 4 }}>
                      Checked in: {new Date(shift.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {isLate && (
                    <div style={{ marginTop: 4, fontSize: 10, color: AMBER, fontWeight: 700 }}>
                      Late by {shift.issueReport.replace('LATE_CHECK_IN:', '')} min
                    </div>
                  )}
                  {shift.totalHours != null && job && (
                    <div style={{ fontSize: 11, color: GL, marginTop: 2 }}>
                      {shift.totalHours}h x R{job.hourlyRate} = R{Math.round(shift.totalHours * job.hourlyRate)}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  {statusBadge(shift.status)}
                  {shift.status === 'SCHEDULED' && <div style={{ marginTop: 8, fontSize: 10, color: GL, fontWeight: 700 }}>Tap to Check In</div>}
                  {shift.status === 'CHECKED_IN' && <div style={{ marginTop: 8, fontSize: 10, color: GREEN, fontWeight: 700 }}>Tap to Check Out</div>}
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
          <div style={{ background: BC, border: `1px solid ${BB}`, borderRadius: 8, maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 32, position: 'relative', boxShadow: `0 8px 32px rgba(0,0,0,0.5)` }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${GL}, ${G2})`, borderRadius: '8px 8px 0 0' }} />
            <button onClick={closeModal} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: WD, fontSize: 24, lineHeight: 1, zIndex: 2 }}>x</button>

            {(() => {
              const job = jobs.get(activeShift.jobId);
              if (!job) return null;

              const startDateTime = new Date(job.date);
              const [sh, sm] = job.startTime.split(':').map(Number);
              startDateTime.setHours(sh, sm, 0, 0);

              const endDateTime = new Date(job.date);
              const [eh, em] = job.endTime.split(':').map(Number);
              endDateTime.setHours(eh, em, 0, 0);
              if (endDateTime < startDateTime) endDateTime.setDate(endDateTime.getDate() + 1);

              const now = new Date();
              const isBeforeStart = now < startDateTime;
              const isAfterEnd    = now > endDateTime;
              const fmt = (d: Date) => d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });

              return (
                <>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <h2 style={{ color: W, fontWeight: 800, fontSize: 24, marginBottom: 4, fontFamily: FD }}>{job.title}</h2>
                      <p style={{ color: WM, fontSize: 14, marginBottom: 0, fontFamily: FB }}>{job.venue} · R{job.hourlyRate}/hr</p>
                    </div>
                    <div>{statusBadge(activeShift.status)}</div>
                  </div>

                  {/* Job details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24, background: hex2rgba(GL, 0.02), padding: 16, borderRadius: 6 }}>
                    {[
                      { label: 'Date',   value: new Date(job.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) },
                      { label: 'Time',   value: `${fmt(startDateTime)} – ${fmt(endDateTime)}` },
                      { label: 'Rate',   value: `R${job.hourlyRate}/hr` },
                      { label: 'Client', value: job.client },
                    ].map(r => (
                      <div key={r.label} style={{ background: hex2rgba(GL, 0.04), border: `1px solid ${BB}`, padding: '8px 10px', borderRadius: 4 }}>
                        <div style={{ fontSize: 9, color: WD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2, fontFamily: FB }}>{r.label}</div>
                        <div style={{ fontSize: 13, color: W, fontWeight: 600, fontFamily: FD }}>{r.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Late warning */}
                  {activeShift.status === 'SCHEDULED' && lateMinutes > 0 && !isBeforeStart && (
                    <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(232,168,32,0.10)', border: `1px solid ${AMBER}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>⏰</span>
                      <div>
                        <p style={{ fontSize: 13, color: AMBER, fontWeight: 700, marginBottom: 2 }}>
                          You are {lateMinutes} minute{lateMinutes > 1 ? 's' : ''} late
                        </p>
                        <p style={{ fontSize: 12, color: WM, margin: 0 }}>
                          Shift started at {fmt(startDateTime)}. Your check-in will be marked as late.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Live earnings */}
                  {activeShift.status === 'CHECKED_IN' && activeShift.checkInTime && (
                    <div style={{ padding: 16, background: 'rgba(74,222,128,0.08)', border: `1px solid rgba(74,222,128,0.3)`, borderRadius: 6, marginBottom: 24, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: GREEN, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8, fontFamily: FB }}>Live Earnings</div>
                      <LiveEarningsTimer checkInTime={activeShift.checkInTime} hourlyRate={job.hourlyRate} />
                      {activeShift.issueReport?.startsWith('LATE_CHECK_IN:') && (
                        <div style={{ marginTop: 10, padding: '5px 12px', background: 'rgba(232,168,32,0.1)', border: `1px solid ${AMBER}`, borderRadius: 3, fontSize: 11, color: AMBER, fontWeight: 700, display: 'inline-block' }}>
                          Late check-in: {activeShift.issueReport.replace('LATE_CHECK_IN:', '')} min
                        </div>
                      )}
                      {trackingActive && loc && (
                        <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(74,222,128,0.06)', border: `1px solid rgba(74,222,128,0.2)`, borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s ease-in-out infinite' }} />
                          <span style={{ fontSize: 10, color: GREEN, fontFamily: FB }}>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Map + GPS status */}
                  {job.lat && job.lng && (
                    <div style={{ marginBottom: 24 }}>
                      <iframe width="100%" height="200" style={{ border: 0, borderRadius: 6 }} loading="lazy" allowFullScreen
                        src={`https://www.google.com/maps?q=${job.lat},${job.lng}&z=18&output=embed`} />
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: hex2rgba(GL, 0.04), padding: '12px 16px', borderRadius: 6 }}>
                        <div style={{ fontSize: 13, color: WM, fontFamily: FB }}>
                          {loc ? <>You are <strong style={{ color: GL }}>{distM !== null ? `${distM}m` : '—'}</strong> from the venue.</> : 'Waiting for your location...'}
                        </div>
                        <div>
                          {gps === 'near'     && <span style={{ color: GREEN, fontWeight: 700 }}>Within radius</span>}
                          {gps === 'far'      && <span style={{ color: CORAL, fontWeight: 700 }}>Too far</span>}
                          {gps === 'checking' && <span style={{ color: GL, fontWeight: 700 }}>Checking...</span>}
                          {gps === 'denied'   && <span style={{ color: CORAL, fontWeight: 700 }}>Location denied</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Time window warning */}
                  {activeShift.status === 'SCHEDULED' && (isBeforeStart || isAfterEnd) && (
                    <div style={{ marginBottom: 24, padding: '12px 16px', background: isBeforeStart ? hex2rgba(AMBER, 0.1) : hex2rgba(CORAL, 0.1), border: `1px solid ${isBeforeStart ? AMBER : CORAL}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{isBeforeStart ? '⏳' : '⌛'}</span>
                      <div>
                        <p style={{ fontSize: 13, color: isBeforeStart ? AMBER : CORAL, fontWeight: 700, marginBottom: 2 }}>
                          {isBeforeStart ? 'Shift has not started yet' : 'Shift has already ended'}
                        </p>
                        <p style={{ fontSize: 12, color: WM, margin: 0 }}>
                          {isBeforeStart ? `Check-in opens at ${fmt(startDateTime)}. Please arrive on time.` : `This shift ended at ${fmt(endDateTime)}. Contact your supervisor if this is an error.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── In-page camera (replaces file input) ────────────────── */}
                  {selfieAction !== 'none' && gps === 'near' && !isBeforeStart && !isAfterEnd && (
                    <div style={{ marginBottom: 24, padding: 20, background: hex2rgba(GL, 0.04), border: `1px solid ${hex2rgba(GL, 0.28)}`, borderRadius: 6 }}>
                      {!selfiePreview ? (
                        // Camera is open
                        <CameraCapture
                          action={selfieAction}
                          onCapture={(file, preview) => {
                            setSelfieFile(file);
                            setSelfiePreview(preview);
                            setCameraOpen(false);
                          }}
                          onCancel={() => { setSelfieAction('none'); setCameraOpen(false); }}
                        />
                      ) : (
                        // Photo taken — show preview + confirm
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ color: GL, fontWeight: 700, fontSize: 14, fontFamily: FD, marginBottom: 12 }}>
                            {selfieAction === 'checkin' ? 'Check-in selfie' : 'Check-out selfie'}
                          </p>
                          <img src={selfiePreview} alt="selfie" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, border: `1px solid ${hex2rgba(GL, 0.3)}`, marginBottom: 14 }} />
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button
                              onClick={() => { setSelfiePreview(null); setSelfieFile(null); }}
                              style={{ flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 12, cursor: 'pointer', borderRadius: 6 }}>
                              Retake
                            </button>
                            <button
                              onClick={selfieAction === 'checkin' ? doCheckIn : doCheckOut}
                              disabled={working}
                              style={{ flex: 2, padding: '11px', background: working ? BB : `linear-gradient(135deg,${GL},${G})`, border: 'none', color: working ? WM : B, fontFamily: FD, fontSize: 12, fontWeight: 700, cursor: working ? 'not-allowed' : 'pointer', borderRadius: 6, letterSpacing: '0.06em' }}>
                              {working
                                ? 'Processing...'
                                : selfieAction === 'checkin'
                                ? `Confirm Check-In${lateMinutes > 0 ? ` (${lateMinutes} min late)` : ''}`
                                : 'Confirm Check-Out'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activeShift.status === 'SCHEDULED' && gps === 'near' && selfieAction === 'none' && !isBeforeStart && !isAfterEnd && (
                      <button onClick={() => { setSelfieAction('checkin'); setCameraOpen(true); }}
                        style={{ padding: '14px', background: `linear-gradient(135deg,${GL},${G})`, border: 'none', color: B, fontFamily: FD, fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 6, letterSpacing: '0.1em', textTransform: 'uppercase' as const, boxShadow: `0 4px 12px ${hex2rgba(GL, 0.3)}` }}>
                        {lateMinutes > 0 ? `Start Shift — ${lateMinutes} min late` : 'Start Shift — Check In'}
                      </button>
                    )}
                    {activeShift.status === 'CHECKED_IN' && gps === 'near' && selfieAction === 'none' && (
                      <button onClick={() => { setSelfieAction('checkout'); setCameraOpen(true); }}
                        style={{ padding: '14px', background: 'rgba(196,97,74,0.15)', border: `1px solid ${CORAL}`, color: CORAL, fontFamily: FD, fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 6, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                        End Shift — Check Out
                      </button>
                    )}
                    {['PENDING_APPROVAL', 'APPROVED'].includes(activeShift.status) && (
                      <div style={{ padding: '14px', background: hex2rgba(GL, 0.06), border: `1px solid ${BB}`, borderRadius: 6, textAlign: 'center', fontSize: 14, color: GL, fontFamily: FD }}>
                        Shift completed — {activeShift.totalHours ? `${activeShift.totalHours}h worked · R${Math.round(activeShift.totalHours * (job?.hourlyRate || 0))} earned` : 'pending approval'}
                      </div>
                    )}
                    {(gps === 'idle' || gps === 'far' || (activeShift.status === 'SCHEDULED' && (isBeforeStart || isAfterEnd))) && (
                      <button onClick={() => checkGps(activeShift)}
                        style={{ padding: '12px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 13, cursor: 'pointer', borderRadius: 6 }}>
                        Refresh Location
                      </button>
                    )}
                    <button onClick={closeModal}
                      style={{ padding: '12px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 13, cursor: 'pointer', borderRadius: 6 }}>
                      Hide
                    </button>
                  </div>

                  {job.lat && job.lng && (
                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                      <MapsButton lat={job.lat} lng={job.lng} />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};