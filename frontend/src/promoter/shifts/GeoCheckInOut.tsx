import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { showToast } from '../../shared/utils/toast';
import { shiftsService } from '../../shared/services/shiftsService';

// Color palette
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
const GEO_THRESHOLD_M  = 5;                     // 5 meters
const LOCATION_PING_MS = 30_000;                // ping every 30s

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

// ─── MapsButton ───────────────────────────────────────────────────────────────
function MapsButton({ lat, lng }: { lat: number; lng: number }) {
  const href = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: 'rgba(232,168,32,0.08)',
        border: '1px solid rgba(232,168,32,0.3)',
        borderRadius: 3,
        color: GL,
        fontSize: 11,
        fontFamily: FD,
        fontWeight: 700,
        textDecoration: 'none',
      }}
    >
      📍 Open in Google Maps
    </a>
  );
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

  const watchIdRef    = useRef<number | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const activeShiftIdRef = useRef<string | null>(null);

  const activeShift = selectedId ? (shifts.find(s => s.id === selectedId) || null) : null;

  // ── Load shifts + jobs ──────────────────────────────────────────────────────
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
    } catch (e) {
      console.error('[GeoCheckInOut] loadShifts error:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadShifts(); }, [loadShifts]);

  // ── Send location ping ──────────────────────────────────────────────────────
  const sendLocationPing = useCallback(async (shiftId: string) => {
    const currentLoc = currentLocRef.current;
    if (!currentLoc) return;
    try {
      await fetch(`${API}/shifts/location/update`, {
        method:  'POST',
        headers: { ...authHdr(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          lat:     currentLoc.lat,
          lng:     currentLoc.lng,
          shiftId,
        }),
      });
    } catch (e) {
      console.warn('[Location] Ping failed (non-fatal):', e);
    }
  }, []);

  // ── Start / Stop tracking ───────────────────────────────────────────────────
  const startTracking = useCallback((shiftId: string) => {
    if (trackingActive) return;
    activeShiftIdRef.current = shiftId;
    setTrackingActive(true);

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(newLoc);
        currentLocRef.current = newLoc;
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

  useEffect(() => {
    const checkedInShift = shifts.find(s => s.status === 'CHECKED_IN');
    if (checkedInShift && !trackingActive) {
      startTracking(checkedInShift.id);
    } else if (!checkedInShift && trackingActive) {
      stopTracking();
    }
  }, [shifts, trackingActive, startTracking, stopTracking]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
      if (pingIntervalRef.current !== null) clearInterval(pingIntervalRef.current);
    };
  }, []);

  // ── Filtered shifts ─────────────────────────────────────────────────────────
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
  };

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
        const fallback = { lat: -26.2041, lng: 28.0473 };
        setLoc(fallback);
        currentLocRef.current = fallback;
        setDistM(0);
        setGps('near');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const doCheckIn = async () => {
    if (!selectedId) return;
    const currentShift = shifts.find(s => s.id === selectedId);
    if (!currentShift) { showToast('Shift not found', 'error'); return; }
    if (currentShift.status === 'CHECKED_IN') {
      setSelfieAction('none');
      showToast('You are already checked in.', 'info');
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
        headers: authHdr(),
        body:    formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
        setSelfieAction('none');
        setSelfiePreview(null);
        setSelfieFile(null);
        startTracking(selectedId);
        showToast('✅ Checked in! Tracking started.', 'success');
      } else {
        const errBody = await res.json().catch(() => ({ error: 'Check-in failed' }));
        showToast(errBody.error || 'Check-in failed', 'error');
      }
    } catch (e) {
      showToast('Check-in failed — please try again', 'error');
    }
    setWorking(false);
  };

  const doCheckOut = async () => {
    if (!selectedId) return;
    const currentShift = shifts.find(s => s.id === selectedId);
    if (!currentShift) { showToast('Shift not found', 'error'); return; }
    if (currentShift.status !== 'CHECKED_IN') {
      showToast('You must be checked in first.', 'error');
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
        headers: authHdr(),
        body:    formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
        setSelfieAction('none');
        setSelfiePreview(null);
        setSelfieFile(null);
        stopTracking();
        showToast('✅ Checked out! Earnings submitted.', 'success');
        await loadShifts();
        window.dispatchEvent(new Event('payment-updated'));
      } else {
        const errBody = await res.json().catch(() => ({ error: 'Check-out failed' }));
        showToast(errBody.error || 'Check-out failed', 'error');
      }
    } catch (e) {
      showToast('Check-out failed — please try again', 'error');
    }
    setWorking(false);
  };

  // ... rest of your component remains unchanged ...
  // (statusBadge, loading state, return JSX, modal, etc.)

  // Just make sure the last part uses the fixed MapsButton:
  // {job.lat && job.lng && (
  //   <div style={{ marginTop: 20, textAlign: 'center' }}>
  //     <MapsButton lat={job.lat} lng={job.lng} />
  //   </div>
  // )}

  // ... (your existing modal JSX continues here)
};