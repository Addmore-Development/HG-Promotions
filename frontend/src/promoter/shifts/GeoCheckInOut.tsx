// promoter/shifts/GeoCheckInOut.tsx
// Promoter shift check‑in/out, visually identical to the admin's live map page.

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { shiftsService } from '../../shared/services/shiftsService';
import { jobsService } from '../../shared/services/jobsService';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { showToast } from '../../shared/utils/toast';
import type { Shift } from '../../shared/types/shift.types';
import type { Job } from '../../shared/types/job.types';

// Admin‑style tokens (warm amber palette)
const G   = '#D4880A';   // primary gold
const GL  = '#E8A820';   // bright gold
const G2  = '#8B5A1A';   // dark brown accent
const B   = '#0C0A07';   // near‑black background
const BC  = '#141008';   // card background
const BB  = 'rgba(212,136,10,0.12)';   // border
const W   = '#FAF3E8';   // warm white text
const WM  = 'rgba(250,243,232,0.65)';  // white muted
const WD  = 'rgba(250,243,232,0.28)';  // white dim
const FD  = "'Playfair Display', Georgia, serif";
const FB  = "'DM Sans', system-ui, sans-serif";

// Status colors
const TEAL   = '#4AABB8';
const AMBER  = '#E8A820';
const CORAL  = '#C4614A';
const SKY    = '#5A9EC4';

const GEO_THRESHOLD_M = 200;

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
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Filter and search
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

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      if (statusFilter !== 'all' && shift.status !== statusFilter) return false;
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: WD, padding: '60px 0', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: `2px solid ${GL}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '15px', color: WM }}>Loading shifts…</span>
    </div>
  );

  const active = selected ? shifts.find(s => s.id === selected.id) : null;

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700 }}>
            Shifts
          </div>
          <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>My Shifts</h1>
          <p style={{ fontSize: 13, color: WM, marginTop: 6 }}>{shifts.length} total · {filteredShifts.length} shown</p>
        </div>
        <div style={{ display: 'flex', gap: 8, background: BC, padding: 4, borderRadius: 40, border: `1px solid ${BB}` }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 20px', borderRadius: 30, border: 'none',
              background: viewMode === 'list' ? GL : 'transparent',
              color: viewMode === 'list' ? B : WM,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 20px', borderRadius: 30, border: 'none',
              background: viewMode === 'grid' ? GL : 'transparent',
              color: viewMode === 'grid' ? B : WM,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
             Grid
          </button>
        </div>
      </div>

      {/* Filter bar – styled like admin's city/status filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 240 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: WD, fontSize: 16 }}></span>
          <input
            type="text"
            placeholder="Search shifts…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 10px 10px 44px',
              background: BC, border: `1px solid ${BB}`, color: W,
              fontFamily: FB, fontSize: 13, outline: 'none', borderRadius: 2,
            }}
            onFocus={e => e.currentTarget.style.borderColor = GL}
            onBlur={e => e.currentTarget.style.borderColor = BB}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { value: 'all', label: 'All' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'checked_in', label: 'Checked In' },
            { value: 'checked_out', label: 'Checked Out' },
            { value: 'pending_approval', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'no_show', label: 'No Show' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value as any)}
              style={{
                padding: '6px 16px', border: `1px solid ${statusFilter === opt.value ? GL : BB}`,
                background: statusFilter === opt.value ? `${GL}15` : 'transparent',
                color: statusFilter === opt.value ? GL : WM, fontFamily: FB,
                fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 2,
                transition: 'all 0.2s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ color: WM, fontSize: 14, marginBottom: 24 }}>
        Tap a shift to check in/out with geo‑verification (within {GEO_THRESHOLD_M}m).
      </p>

      {filteredShifts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: WD }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: GL }}>🔍</div>
          <p>No shifts match your filters.</p>
        </div>
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <div style={{ background: BC, border: `1px solid ${BB}`, overflow: 'hidden', borderRadius: 2 }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BB}` }}>
                <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: GL }}>Your Shifts</div>
              </div>
              <div style={{ overflowY: 'auto' }}>
                {filteredShifts.map((shift, i) => {
                  const job = jobs.get(shift.jobId);
                  return (
                    <div
                      key={shift.id}
                      onClick={() => checkGps(shift)}
                      style={{
                        padding: '14px 20px', borderBottom: i < filteredShifts.length - 1 ? `1px solid ${BB}` : 'none',
                        cursor: 'pointer', background: active?.id === shift.id ? `${GL}0f` : 'transparent',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => { if (active?.id !== shift.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { if (active?.id !== shift.id) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: W }}>{job?.title || '—'}</div>
                          <div style={{ fontSize: 11, color: WM, marginTop: 2 }}>{job?.venue}</div>
                          <div style={{ fontSize: 10, color: WD, marginTop: 2 }}>
                            {job?.date ? new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : ''} · {job?.startTime}–{job?.endTime}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {statusBadge(shift.status)}
                          {shift.attendance.checkInTime && (
                            <div style={{ fontSize: 10, color: TEAL, marginTop: 5 }}>✓ In {new Date(shift.attendance.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filteredShifts.map(shift => {
                const job = jobs.get(shift.jobId);
                return (
                  <div
                    key={shift.id}
                    onClick={() => checkGps(shift)}
                    style={{
                      background: BC, border: `1px solid ${active?.id === shift.id ? GL : BB}`,
                      padding: 18, cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s',
                      borderRadius: 2,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = GL; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = active?.id === shift.id ? GL : BB; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ color: W, fontWeight: 700, fontSize: 15, margin: 0 }}>{job?.title || '—'}</h3>
                      {statusBadge(shift.status)}
                    </div>
                    <div style={{ fontSize: 12, color: WM, marginBottom: 4 }}>{job?.venue}</div>
                    <div style={{ fontSize: 11, color: WD }}>{job?.date ? new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : ''} · {job?.startTime}–{job?.endTime}</div>
                    {shift.attendance.checkInTime && (
                      <div style={{ marginTop: 10, borderTop: `1px solid ${BB}`, paddingTop: 8, fontSize: 11, color: TEAL }}>
                        ✓ In {new Date(shift.attendance.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Detail Modal – centered like job modal, with admin styling */}
      {selected && active && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24
          }}
          onClick={() => { setSelected(null); setSelfieAction('none'); setGps('idle'); }}
        >
          <div
            style={{
              background: BC, border: `1px solid ${BB}`, borderRadius: 4,
              maxWidth: 540, width: '100%', maxHeight: '85vh',
              overflowY: 'auto', padding: 32, position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Gradient top bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: 3, background: `linear-gradient(90deg, ${GL}, ${G2})`
            }} />
            <button
              onClick={() => { setSelected(null); setSelfieAction('none'); setGps('idle'); }}
              style={{
                position: 'absolute', top: 16, right: 20,
                background: 'none', border: 'none', cursor: 'pointer',
                color: WD, fontSize: 18
              }}
            >
              ✕
            </button>

            <h2 style={{ color: W, fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
              {jobs.get(active.jobId)?.title}
            </h2>
            <p style={{ color: WM, fontSize: 14, marginBottom: 24 }}>
              {jobs.get(active.jobId)?.venue}
            </p>

            {/* Issues display */}
            {active.attendance.issues && active.attendance.issues.length > 0 && (
              <div style={{
                marginBottom: 20, padding: 16,
                background: `${CORAL}12`, border: `1px solid ${CORAL}44`,
                borderRadius: 2
              }}>
                <h4 style={{ color: CORAL, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  ⚠️ Issues Reported
                </h4>
                {active.attendance.issues.map(issue => (
                  <div key={issue.id} style={{ fontSize: 12, color: WM, marginBottom: 6 }}>
                    <strong>{issue.type}</strong>: {issue.note}
                    <div style={{ fontSize: 10, color: WD }}>
                      {new Date(issue.loggedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* GPS status panel */}
            <div style={{
              padding: 20, borderRadius: 2, textAlign: 'center', marginBottom: 24,
              background: gps === 'near' ? `${TEAL}12` : gps === 'far' ? `${CORAL}12` : BC,
              border: `1px solid ${gps === 'near' ? TEAL : gps === 'far' ? CORAL : BB}`
            }}>
              {gps === 'checking' && (
                <><div style={{ fontSize: 32, marginBottom: 8 }}>📡</div><p style={{ color: WM, margin: 0 }}>Getting your location…</p></>
              )}
              {gps === 'near' && (
                <><div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <p style={{ color: TEAL, fontWeight: 700, margin: '0 0 4px' }}>You're at the venue</p>
                <p style={{ color: WM, fontSize: 12, margin: 0 }}>{distM}m from check‑in point</p></>
              )}
              {gps === 'far' && (
                <><div style={{ fontSize: 40, marginBottom: 8 }}>📍</div>
                <p style={{ color: CORAL, fontWeight: 700, margin: '0 0 4px' }}>Too far away</p>
                <p style={{ color: WM, fontSize: 12, margin: 0 }}>You are {distM}m away. Must be within {GEO_THRESHOLD_M}m.</p></>
              )}
              {gps === 'denied' && (
                <><div style={{ fontSize: 40, marginBottom: 8 }}>🚫</div><p style={{ color: CORAL, margin: 0 }}>Location access denied</p></>
              )}
              {gps === 'idle' && (
                <p style={{ color: WM, margin: 0 }}>Tap below to verify your location</p>
              )}
            </div>

            {/* Selfie capture */}
            {selfieAction !== 'none' && gps === 'near' && (
              <div style={{
                marginBottom: 20, padding: 20,
                background: `${GL}0f`, border: `1px solid ${GL}30`,
                borderRadius: 2, textAlign: 'center'
              }}>
                <p style={{ color: GL, fontWeight: 700, marginBottom: 12 }}>
                  📸 Take your {selfieAction === 'checkin' ? 'check‑in' : 'check‑out'} selfie
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
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
                    <img src={selfiePreview} alt="selfie" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 2 }} />
                  ) : (
                    <div style={{
                      width: 100, height: 100, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)', border: `2px dashed ${GL}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px', fontSize: 36
                    }}>
                      🤳
                    </div>
                  )}
                </label>
                {selfiePreview && (
                  <Button onClick={selfieAction === 'checkin' ? doCheckIn : doCheckOut} loading={working} style={{ marginTop: 12 }}>
                    ✓ Confirm {selfieAction === 'checkin' ? 'Check‑In' : 'Check‑Out'}
                  </Button>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {active.status === 'scheduled' && gps === 'near' && selfieAction === 'none' && (
                <Button fullWidth size="lg" onClick={() => setSelfieAction('checkin')}>
                  🟢 Start Shift — Check In
                </Button>
              )}
              {(active.status === 'checked_in' || active.status === 'active') && gps === 'near' && selfieAction === 'none' && (
                <Button fullWidth size="lg" variant="secondary" onClick={() => setSelfieAction('checkout')}>
                  🔴 End Shift — Check Out
                </Button>
              )}
              {(gps === 'idle' || gps === 'far') && (
                <Button fullWidth variant="ghost" onClick={() => checkGps(active)}>
                  📡 Refresh Location
                </Button>
              )}
              <Button fullWidth variant="ghost" onClick={() => { setSelected(null); setSelfieAction('none'); setGps('idle'); }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};