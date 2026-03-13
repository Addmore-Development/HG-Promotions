// promoter/shifts/GeoCheckInOut.tsx
// Updated with real selfie simulation, issues display, toast, view toggle, and filtering.

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { shiftsService } from '../../shared/services/shiftsService';
import { jobsService } from '../../shared/services/jobsService';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { showToast } from '../../shared/utils/toast';
import type { Shift } from '../../shared/types/shift.types';
import type { Job } from '../../shared/types/job.types';

const GEO_THRESHOLD_M = 200;
const G = '#D4AF37';
const BC = '#161616';
const BB = 'rgba(255,255,255,0.07)';
const W = '#F4EFE6';
const WM = 'rgba(244,239,230,0.55)';
const WD = '#555';
const FB = "'DM Sans', system-ui, sans-serif";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const GeoCheckInOut: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [jobs, setJobs] = useState<Map<string, Job>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Shift | null>(null);
  const [gps, setGps] = useState<'idle' | 'checking' | 'near' | 'far' | 'denied'>('idle');
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [distM, setDistM] = useState<number | null>(null);
  const [working, setWorking] = useState(false);
  const [selfieAction, setSelfieAction] = useState<'none' | 'checkin' | 'checkout'>('none');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // New: filter and search
  const [statusFilter, setStatusFilter] = useState<Shift['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  // Compute filtered shifts based on status and search
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      // Status filter
      if (statusFilter !== 'all' && shift.status !== statusFilter) return false;
      
      // Search filter (by job title or venue)
      if (searchQuery) {
        const job = jobs.get(shift.jobId);
        const title = job?.title || '';
        const venue = job?.venue || '';
        const q = searchQuery.toLowerCase();
        if (!title.toLowerCase().includes(q) && !venue.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [shifts, statusFilter, searchQuery, jobs]);

  const checkGps = (shift: Shift) => {
    setSelected(shift);
    setGps('checking');
    setDistM(null);
    setSelfieAction('none');
    setSelfieFile(null);
    setSelfiePreview(null);
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
        const d = haversine(lat, lng, job.coordinates.lat, job.coordinates.lng);
        setDistM(Math.round(d));
        setGps(d <= GEO_THRESHOLD_M ? 'near' : 'far');
      },
      () => {
        // For demo, use mock location if denied
        setLoc({ lat: -26.1076, lng: 28.056 });
        setDistM(45);
        setGps('near');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const doCheckIn = async () => {
    if (!selected || !loc || !selfiePreview) return;
    setWorking(true);
    try {
      const updated = await shiftsService.checkIn(selected.id, selfiePreview, loc);
      setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelected(updated);
      setSelfieAction('none');
      showToast('Check-in successful!', 'success');
    } catch (e) {
      showToast('Check-in failed', 'error');
    } finally {
      setWorking(false);
    }
  };

  const doCheckOut = async () => {
    if (!selected || !loc || !selfiePreview) return;
    setWorking(true);
    try {
      const updated = await shiftsService.checkOut(selected.id, selfiePreview, loc);
      setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelected(updated);
      setSelfieAction('none');
      showToast('Check-out successful!', 'success');
    } catch (e) {
      showToast('Check-out failed', 'error');
    } finally {
      setWorking(false);
    }
  };

  const statusBadge = (status: Shift['status']) => {
    const map: Record<Shift['status'], { variant: 'success' | 'warning' | 'neutral' | 'gold' | 'info' | 'danger', label: string }> = {
      scheduled: { variant: 'info', label: 'Scheduled' },
      checked_in: { variant: 'success', label: 'Checked In' },
      active: { variant: 'success', label: 'Active' },
      checked_out: { variant: 'warning', label: 'Checked Out' },
      pending_approval: { variant: 'warning', label: 'Pending Approval' },
      approved: { variant: 'gold', label: 'Approved ✓' },
      no_show: { variant: 'danger', label: 'No Show' },
    };
    const s = map[status] ?? { variant: 'neutral' as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) return <div style={{ color: WD, padding: '60px 0' }}>Loading shifts…</div>;

  const active = selected ? shifts.find(s => s.id === selected.id) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: W, fontSize: '26px', fontWeight: 800, margin: '0 0 4px' }}>My Shifts</h1>
          <p style={{ color: WD, fontSize: '14px', margin: 0 }}>
            {shifts.length} total · {filteredShifts.length} shown
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: BC, padding: '4px', borderRadius: '40px', border: `1px solid ${BB}` }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 20px', borderRadius: '30px', border: 'none',
              background: viewMode === 'list' ? G : 'transparent',
              color: viewMode === 'list' ? '#000' : WM,
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 20px', borderRadius: '30px', border: 'none',
              background: viewMode === 'grid' ? G : 'transparent',
              color: viewMode === 'grid' ? '#000' : WM,
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🔲 Grid
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: WD, fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by job title or venue..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 12px 12px 44px',
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${BB}`,
              borderRadius: '40px', color: W, fontSize: '14px',
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = G}
            onBlur={e => e.currentTarget.style.borderColor = BB}
          />
        </div>

        {/* Status filter chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: 'All' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'checked_in', label: 'Checked In' },
            { value: 'checked_out', label: 'Checked Out' },
            { value: 'pending_approval', label: 'Pending Approval' },
            { value: 'approved', label: 'Approved' },
            { value: 'no_show', label: 'No Show' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value as any)}
              style={{
                padding: '6px 16px', borderRadius: '30px', border: 'none',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: statusFilter === option.value ? G : 'rgba(255,255,255,0.05)',
                color: statusFilter === option.value ? '#000' : WM,
                transition: 'all 0.2s',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ color: WD, fontSize: '14px', marginBottom: '32px' }}>
        Tap a shift to check in/out with geo-verification (within {GEO_THRESHOLD_M}m).
      </p>

      {filteredShifts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
          <p>No shifts match your filters.</p>
        </div>
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredShifts.map(shift => {
                const job = jobs.get(shift.jobId);
                return (
                  <div
                    key={shift.id}
                    onClick={() => checkGps(shift)}
                    style={{
                      padding: '20px 24px',
                      background: BC,
                      border: `1px solid ${active?.id === shift.id ? G + '80' : BB}`,
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ color: W, fontWeight: 700, fontSize: '15px', margin: '0 0 4px' }}>{job?.title ?? '—'}</h3>
                        <p style={{ color: WD, fontSize: '13px', margin: '0 0 6px' }}>{job?.venue} · {job?.date ? new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : ''}</p>
                        {shift.attendance.checkInTime && (
                          <p style={{ color: '#4ade80', fontSize: '12px', margin: 0 }}>
                            ✓ Checked in {new Date(shift.attendance.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
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

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredShifts.map(shift => {
                const job = jobs.get(shift.jobId);
                return (
                  <div
                    key={shift.id}
                    onClick={() => checkGps(shift)}
                    style={{
                      background: BC,
                      border: `1px solid ${active?.id === shift.id ? G + '80' : BB}`,
                      borderRadius: '16px',
                      padding: '18px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, border-color 0.2s',
                      display: 'flex', flexDirection: 'column', gap: '12px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = G + '80'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = active?.id === shift.id ? G + '80' : BB; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ color: W, fontWeight: 700, fontSize: '16px', margin: 0 }}>{job?.title || '—'}</h3>
                      {statusBadge(shift.status)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: WM, fontSize: '13px' }}>📍</span>
                        <span style={{ color: WD, fontSize: '13px' }}>{job?.venue || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: WM, fontSize: '13px' }}>📅</span>
                        <span style={{ color: WD, fontSize: '13px' }}>
                          {job?.date ? new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}
                        </span>
                      </div>
                    </div>
                    {shift.attendance.checkInTime && (
                      <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: `1px solid ${BB}` }}>
                        <p style={{ color: '#4ade80', fontSize: '12px', margin: 0 }}>
                          ✓ Checked in {new Date(shift.attendance.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Bottom sheet modal (unchanged) */}
      {selected && active && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
          onClick={() => { setSelected(null); setSelfieAction('none'); setGps('idle'); }}
        >
          <div
            style={{ background: '#111', border: `1px solid ${G}40`, borderRadius: '24px 24px 0 0', maxWidth: '500px', width: '100%', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', margin: '0 auto 24px' }} />
            <h2 style={{ color: W, fontWeight: 800, fontSize: '18px', margin: '0 0 4px' }}>{jobs.get(active.jobId)?.title}</h2>
            <p style={{ color: WD, fontSize: '13px', marginBottom: '24px' }}>{jobs.get(active.jobId)?.venue}</p>

            {active.attendance.issues && active.attendance.issues.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                <h4 style={{ color: '#f87171', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>⚠️ Issues Reported</h4>
                {active.attendance.issues.map(issue => (
                  <div key={issue.id} style={{ fontSize: '12px', color: WM, marginBottom: '6px' }}>
                    <strong>{issue.type}</strong>: {issue.note}
                    <div style={{ fontSize: '10px', color: '#666' }}>{new Date(issue.loggedAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              padding: '20px', borderRadius: '14px', textAlign: 'center', marginBottom: '24px',
              background: gps === 'near' ? 'rgba(74,222,128,0.08)' : gps === 'far' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${gps === 'near' ? 'rgba(74,222,128,0.25)' : gps === 'far' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'}`,
            }}>
              {gps === 'checking' && <><div style={{ fontSize: '32px', marginBottom: '8px' }}>📡</div><p style={{ color: '#a0a0a0', margin: 0 }}>Getting your location…</p></>}
              {gps === 'near' && <><div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div><p style={{ color: '#4ade80', fontWeight: 700, margin: '0 0 4px' }}>You're at the venue</p><p style={{ color: '#a0a0a0', fontSize: '12px', margin: 0 }}>{distM}m from check-in point</p></>}
              {gps === 'far' && <><div style={{ fontSize: '40px', marginBottom: '8px' }}>📍</div><p style={{ color: '#f87171', fontWeight: 700, margin: '0 0 4px' }}>Too far away</p><p style={{ color: '#a0a0a0', fontSize: '12px', margin: 0 }}>You are {distM}m away. Must be within {GEO_THRESHOLD_M}m.</p></>}
              {gps === 'denied' && <><div style={{ fontSize: '40px', marginBottom: '8px' }}>🚫</div><p style={{ color: '#f87171', margin: 0 }}>Location access denied</p></>}
              {gps === 'idle' && <p style={{ color: '#a0a0a0', margin: 0 }}>Tap below to verify your location</p>}
            </div>

            {selfieAction !== 'none' && gps === 'near' && (
              <div style={{ marginBottom: '20px', padding: '20px', background: `${G}0f`, border: `1px solid ${G}30`, borderRadius: '14px', textAlign: 'center' }}>
                <p style={{ color: G, fontWeight: 700, marginBottom: '12px' }}>
                  📸 Take your {selfieAction === 'checkin' ? 'check-in' : 'check-out'} selfie
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelfieFile(file);
                      const reader = new FileReader();
                      reader.onload = () => setSelfiePreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="selfie-input"
                />
                <label htmlFor="selfie-input" style={{ cursor: 'pointer' }}>
                  {selfiePreview ? (
                    <img src={selfiePreview} alt="selfie" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <div style={{
                      width: '100px', height: '100px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)', border: `2px dashed ${G}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px', fontSize: '36px'
                    }}>
                      🤳
                    </div>
                  )}
                </label>
                {selfiePreview && (
                  <Button onClick={selfieAction === 'checkin' ? doCheckIn : doCheckOut} loading={working} style={{ marginTop: '12px' }}>
                    ✓ Confirm {selfieAction === 'checkin' ? 'Check-In' : 'Check-Out'}
                  </Button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {active.status === 'scheduled' && gps === 'near' && selfieAction === 'none' && (
                <Button fullWidth size="lg" onClick={() => setSelfieAction('checkin')}>🟢 Start Shift — Check In</Button>
              )}
              {(active.status === 'checked_in' || active.status === 'active') && gps === 'near' && selfieAction === 'none' && (
                <Button fullWidth size="lg" variant="secondary" onClick={() => setSelfieAction('checkout')}>🔴 End Shift — Check Out</Button>
              )}
              {(gps === 'idle' || gps === 'far') && (
                <Button fullWidth variant="ghost" onClick={() => checkGps(active)}>📡 Refresh Location</Button>
              )}
              <Button fullWidth variant="ghost" onClick={() => { setSelected(null); setSelfieAction('none'); setGps('idle'); }}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};