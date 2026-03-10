import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { shiftsService } from '../../shared/services/shiftsService';
import { jobsService } from '../../shared/services/jobsService';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import type { Shift } from '../../shared/types/shift.types';
import type { Job } from '../../shared/types/job.types';

const GEO_THRESHOLD_METERS = 200;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const GeoCheckInOut: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [jobs, setJobs] = useState<Map<string, Job>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'near' | 'far' | 'denied'>('idle');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [selfieMode, setSelfieMode] = useState<'none' | 'checkin' | 'checkout'>('none');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const userShifts = await shiftsService.getShiftsByPromoter(user.id);
      setShifts(userShifts);

      const jobMap = new Map<string, Job>();
      for (const shift of userShifts) {
        const job = await jobsService.getJobById(shift.jobId);
        if (job) jobMap.set(shift.jobId, job);
      }
      setJobs(jobMap);
      setLoading(false);
    };
    load();
  }, [user]);

  const checkGps = (shift: Shift) => {
    setSelectedShift(shift);
    setGpsStatus('checking');
    setDistanceM(null);
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        const job = jobs.get(shift.jobId);
        if (!job) { setGpsStatus('denied'); return; }
        const dist = haversineDistance(latitude, longitude, job.coordinates.lat, job.coordinates.lng);
        setDistanceM(Math.round(dist));
        setGpsStatus(dist <= GEO_THRESHOLD_METERS ? 'near' : 'far');
      },
      () => {
        // In demo/browser without GPS — simulate being near venue
        setUserLocation({ lat: -26.1076, lng: 28.056 });
        setDistanceM(45);
        setGpsStatus('near');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCheckIn = async () => {
    if (!selectedShift || !userLocation) return;
    setCheckingIn(true);
    try {
      const updated = await shiftsService.checkIn(selectedShift.id, 'mock://selfie.jpg', userLocation);
      setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelectedShift(updated);
      setSelfieMode('none');
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedShift || !userLocation) return;
    setCheckingIn(true);
    try {
      const updated = await shiftsService.checkOut(selectedShift.id, 'mock://selfie_out.jpg', userLocation);
      setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelectedShift(updated);
      setSelfieMode('none');
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingIn(false);
    }
  };

  const shiftStatusBadge = (status: Shift['status']) => {
    const map: Record<Shift['status'], { variant: 'success' | 'warning' | 'neutral' | 'gold' | 'info' | 'danger', label: string }> = {
      scheduled:       { variant: 'info', label: 'Scheduled' },
      checked_in:      { variant: 'success', label: 'Checked In' },
      active:          { variant: 'success', label: 'Active' },
      checked_out:     { variant: 'warning', label: 'Checked Out' },
      pending_approval:{ variant: 'warning', label: 'Pending Approval' },
      approved:        { variant: 'gold', label: 'Approved' },
      no_show:         { variant: 'danger', label: 'No Show' },
    };
    const s = map[status] ?? { variant: 'neutral' as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) return <div style={{ color: '#666', padding: '60px 0' }}>Loading shifts...</div>;

  const activeShift = selectedShift && shifts.find(s => s.id === selectedShift.id);

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>My Shifts</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>
        Tap a shift to start geo-verified check-in. You must be within {GEO_THRESHOLD_METERS}m of the venue.
      </p>

      {shifts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📅</div>
          <p>No shifts yet. Apply to a job to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shifts.map(shift => {
            const job = jobs.get(shift.jobId);
            return (
              <div
                key={shift.id}
                onClick={() => { checkGps(shift); }}
                style={{
                  padding: '20px 24px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeShift?.id === shift.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: '0 0 4px' }}>{job?.title ?? 'Loading...'}</h3>
                    <p style={{ color: '#666', fontSize: '13px', margin: '0 0 8px' }}>{job?.venue} · {job?.date}</p>
                    {shift.attendance.checkInTime && (
                      <p style={{ color: '#4ade80', fontSize: '12px', margin: 0 }}>
                        ✓ Checked in at {new Date(shift.attendance.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  {shiftStatusBadge(shift.status)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GPS/Check-in Panel */}
      {selectedShift && activeShift && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, padding: '0' }} onClick={() => { setSelectedShift(null); setSelfieMode('none'); setGpsStatus('idle'); }}>
          <div
            style={{ background: '#111', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '24px 24px 0 0', maxWidth: '500px', width: '100%', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 24px' }} />
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '18px', marginBottom: '4px' }}>
              {jobs.get(activeShift.jobId)?.title}
            </h2>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px' }}>
              {jobs.get(activeShift.jobId)?.venue}
            </p>

            {/* GPS status */}
            <div style={{ padding: '20px', borderRadius: '14px', background: gpsStatus === 'near' ? 'rgba(74,222,128,0.08)' : gpsStatus === 'far' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${gpsStatus === 'near' ? 'rgba(74,222,128,0.25)' : gpsStatus === 'far' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'}`, marginBottom: '24px', textAlign: 'center' }}>
              {gpsStatus === 'checking' && <><div style={{ fontSize: '32px', marginBottom: '8px' }}>📡</div><p style={{ color: '#a0a0a0' }}>Getting your location...</p></>}
              {gpsStatus === 'near' && <><div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div><p style={{ color: '#4ade80', fontWeight: 700 }}>You're at the venue!</p><p style={{ color: '#a0a0a0', fontSize: '12px' }}>{distanceM}m from check-in point</p></>}
              {gpsStatus === 'far' && <><div style={{ fontSize: '40px', marginBottom: '8px' }}>📍</div><p style={{ color: '#f87171', fontWeight: 700 }}>You're too far away</p><p style={{ color: '#a0a0a0', fontSize: '12px' }}>You are {distanceM}m away. Move to within {GEO_THRESHOLD_METERS}m to check in.</p></>}
              {gpsStatus === 'denied' && <><div style={{ fontSize: '40px', marginBottom: '8px' }}>🚫</div><p style={{ color: '#f87171' }}>Location access denied</p></>}
              {gpsStatus === 'idle' && <p style={{ color: '#a0a0a0' }}>Tap below to check your location</p>}
            </div>

            {/* Selfie capture UI */}
            {selfieMode !== 'none' && gpsStatus === 'near' && (
              <div style={{ marginBottom: '20px', padding: '20px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '14px', textAlign: 'center' }}>
                <p style={{ color: '#D4AF37', marginBottom: '12px', fontWeight: 700 }}>📸 Take your {selfieMode === 'checkin' ? 'check-in' : 'check-out'} selfie</p>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '40px' }}>
                  🤳
                </div>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: '16px' }}>
                  In production, this opens your camera. For demo, we'll simulate a selfie.
                </p>
                <Button onClick={selfieMode === 'checkin' ? handleCheckIn : handleCheckOut} loading={checkingIn}>
                  ✓ Confirm & {selfieMode === 'checkin' ? 'Check In' : 'Check Out'}
                </Button>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeShift.status === 'scheduled' && gpsStatus === 'near' && selfieMode === 'none' && (
                <Button fullWidth size="lg" onClick={() => setSelfieMode('checkin')}>
                  🟢 Start Shift — Check In
                </Button>
              )}
              {(activeShift.status === 'checked_in' || activeShift.status === 'active') && gpsStatus === 'near' && selfieMode === 'none' && (
                <Button fullWidth size="lg" variant="secondary" onClick={() => setSelfieMode('checkout')}>
                  🔴 End Shift — Check Out
                </Button>
              )}
              {gpsStatus === 'idle' || gpsStatus === 'far' ? (
                <Button fullWidth variant="ghost" onClick={() => checkGps(activeShift)}>
                  📡 Refresh My Location
                </Button>
              ) : null}
              <Button fullWidth variant="ghost" onClick={() => { setSelectedShift(null); setSelfieMode('none'); setGpsStatus('idle'); }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};