// promoter/jobs/ViewAcceptJobs.tsx
// Premium job feed for promoters, visually identical to the admin's job management page.

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { jobsService } from '../../shared/services/jobsService';
import { usersService } from '../../shared/services/usersService';
import { applicationService } from '../../shared/services/applicationService';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { showToast } from '../../shared/utils/toast';
import type { Job } from '../../shared/types/job.types';
import type { UserProfile } from '../../shared/types/user.types';
import type { JobApplication } from '../../shared/types/job.types';

// Admin‑style tokens (warm amber palette)
const G   = '#D4880A';   // primary gold
const GL  = '#E8A820';   // bright gold
const G2  = '#8B5A1A';   // dark brown accent
const B   = '#0C0A07';   // near‑black background
const BC  = '#141008';   // sidebar background
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

// Haversine distance calculation (km)
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const ViewAcceptJobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState<'all' | 'matched' | 'open'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [standbyNotified, setStandbyNotified] = useState<Set<string>>(new Set());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state: field + direction
  const [sortField, setSortField] = useState<'date' | 'pay' | 'distance'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Get user location
  const getUserLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        setLocationError('');
        setLocationLoading(false);
        setUserLocation({ lat: -26.1076, lng: 28.0560 }); // fallback Sandton
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [j, p, apps] = await Promise.all([
        jobsService.getAvailableJobs(user.id),
        usersService.getProfile(user.id),
        applicationService.getApplications(user.id),
      ]);
      setJobs(j);
      setProfile(p);
      setApplications(apps);
      setLoading(false);
    };
    load();
    getUserLocation();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const result = await applicationService.checkForOpenSlots(user.id);
      result.allocated.forEach(app => {
        const job = jobs.find(j => j.id === app.jobId);
        showToast(`🎉 You've been allocated to ${job?.title || 'a job'}!`, 'success');
        setApplications(prev => prev.map(a => a.id === app.id ? app : a));
        setJobs(prev => prev.map(j =>
          j.id === app.jobId ? { ...j, filledSlots: j.filledSlots + 1 } : j
        ));
      });
      result.notified.forEach(app => {
        if (!standbyNotified.has(app.jobId)) {
          const job = jobs.find(j => j.id === app.jobId);
          showToast(`A slot opened for ${job?.title || 'a job'}! Apply now.`, 'info');
          setStandbyNotified(prev => new Set([...prev, app.jobId]));
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [user, jobs, standbyNotified]);

  const isProfileMatch = (job: Job): boolean => {
    if (!profile) return false;
    const { gender, minHeight } = job.filters;
    if (gender && gender !== 'any' && gender !== profile.gender) return false;
    if (minHeight && (profile.physicalAttributes?.height || 0) < minHeight) return false;
    return true;
  };

  // Filter jobs based on search, type, and distance
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (filter === 'matched' && !isProfileMatch(j)) return false;
      if (filter === 'open' && j.status !== 'open') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = 
          j.title.toLowerCase().includes(q) ||
          j.client.toLowerCase().includes(q) ||
          j.brand.toLowerCase().includes(q) ||
          j.venue.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [jobs, filter, searchQuery, profile]);

  // Sort filtered jobs
  const sortedJobs = useMemo(() => {
    const jobsToSort = [...filteredJobs];
    const multiplier = sortDir === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'pay':
        return jobsToSort.sort((a, b) => multiplier * (a.hourlyRate - b.hourlyRate));
      case 'distance':
        if (userLocation) {
          return jobsToSort.sort((a, b) => {
            const distA = haversineDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng);
            const distB = haversineDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng);
            return multiplier * (distA - distB);
          });
        } else {
          return jobsToSort.sort((a, b) => multiplier * ((a.distanceKm || 0) - (b.distanceKm || 0)));
        }
      case 'date':
      default:
        return jobsToSort.sort((a, b) => multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
  }, [filteredJobs, sortField, sortDir, userLocation]);

  const handleSortChange = (field: typeof sortField, dir: typeof sortDir) => {
    setSortField(field);
    setSortDir(dir);
  };

  const handleApply = async (job: Job) => {
    if (!user) return;
    setApplying(job.id);
    try {
      const app = await applicationService.apply(job.id, user.id);
      setApplications(prev => [...prev, app]);
      if (app.status === 'allocated') {
        setJobs(prev => prev.map(j =>
          j.id === job.id ? { ...j, filledSlots: Math.min(j.filledSlots + 1, j.totalSlots) } : j
        ));
        showToast('Application successful! You have been allocated.', 'success');
      } else {
        showToast('You are on the standby list. We\'ll notify you if a slot opens.', 'info');
      }
      setSelectedJob(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to apply', 'error');
    } finally {
      setApplying(null);
    }
  };

  const getStatusBadge = (job: Job) => {
    const app = applications.find(a => a.jobId === job.id);
    if (app) {
      if (app.status === 'allocated') return <Badge variant="success">Allocated ✓</Badge>;
      if (app.status === 'standby') return <Badge variant="warning">Standby</Badge>;
    }
    if (job.status === 'filled') return <Badge variant="neutral">Full</Badge>;
    const slotsLeft = job.totalSlots - job.filledSlots;
    if (slotsLeft <= 1) return <Badge variant="warning">{slotsLeft} left</Badge>;
    return <Badge variant="success">{slotsLeft} open</Badge>;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: WD, padding: '60px 0' }}>
      <div style={{ width: 24, height: 24, border: `2px solid ${GL}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '15px', color: WM }}>Loading jobs...</span>
    </div>
  );

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700 }}>
            Job Feed
          </div>
          <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>Available Jobs</h1>
          <p style={{ fontSize: 13, color: WM, marginTop: 6 }}>{jobs.filter(j => j.status === 'open').length} open positions</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '8px 20px', borderRadius: '30px', border: `1px solid ${showFilters ? GL : BB}`,
            background: showFilters ? `${GL}15` : 'transparent',
            color: showFilters ? GL : WM, fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Location status */}
      {locationLoading && (
        <div style={{ marginBottom: '16px', color: WM, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>📍</span> Getting your location...
        </div>
      )}
      {locationError && (
        <div style={{ marginBottom: '16px', color: CORAL, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📍</span> {locationError}
          <button onClick={getUserLocation} style={{ color: GL, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
            Retry
          </button>
        </div>
      )}

      {/* Filter chips (All, Matched, Open) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['all', 'matched', 'open'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 18px', borderRadius: '30px', border: 'none',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              background: filter === f ? GL : 'rgba(250,243,232,0.05)',
              color: filter === f ? B : WM,
              transition: 'all 0.2s',
            }}
          >
            {f === 'all' ? 'All Jobs' : f === 'matched' ? '⚡ Profile Match' : 'Open Only'}
          </button>
        ))}
      </div>

      {/* Filters panel (search + sort) */}
      {showFilters && (
        <div style={{
          marginBottom: '32px', padding: '28px',
          background: BC, border: `1px solid ${BB}`, borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {/* Search input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: WM, display: 'block', marginBottom: '8px' }}>
              Search jobs
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: WD, fontSize: '16px' }}>🔍</span>
              <input
                type="text"
                placeholder="Title, client, brand, or venue..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '14px 14px 14px 48px',
                  background: 'rgba(250,243,232,0.05)', border: `1px solid ${BB}`,
                  borderRadius: '40px', color: W, fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = GL}
                onBlur={e => e.currentTarget.style.borderColor = BB}
              />
            </div>
          </div>

          {/* Sort controls */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: WM, display: 'block', marginBottom: '8px' }}>
              Sort by
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleSortChange('date', sortField === 'date' && sortDir === 'desc' ? 'asc' : 'desc')}
                style={{
                  padding: '8px 18px', borderRadius: '30px', border: `1px solid ${sortField === 'date' ? GL : BB}`,
                  background: sortField === 'date' ? `${GL}15` : 'transparent',
                  color: sortField === 'date' ? GL : WM, fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                Date {sortField === 'date' && (sortDir === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => handleSortChange('pay', sortField === 'pay' && sortDir === 'desc' ? 'asc' : 'desc')}
                style={{
                  padding: '8px 18px', borderRadius: '30px', border: `1px solid ${sortField === 'pay' ? GL : BB}`,
                  background: sortField === 'pay' ? `${GL}15` : 'transparent',
                  color: sortField === 'pay' ? GL : WM, fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                Pay {sortField === 'pay' && (sortDir === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => handleSortChange('distance', sortField === 'distance' && sortDir === 'asc' ? 'desc' : 'asc')}
                style={{
                  padding: '8px 18px', borderRadius: '30px', border: `1px solid ${sortField === 'distance' ? GL : BB}`,
                  background: sortField === 'distance' ? `${GL}15` : 'transparent',
                  color: sortField === 'distance' ? GL : WM, fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                Distance {sortField === 'distance' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
      )}

      {!profile && (
        <div style={{ padding: '18px 22px', background: `${GL}0f`, border: `1px solid ${GL}30`, borderRadius: 2, marginBottom: '28px' }}>
          <p style={{ color: GL, fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
            ⚠️ Complete your profile to see jobs that match your attributes.
          </p>
        </div>
      )}

      {/* Job table – exactly like admin's table */}
      <div style={{ background: BC, border: `1px solid ${BB}`, overflow: 'hidden', borderRadius: 2 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BB}` }}>
              {['Job Title', 'Client', 'Venue', 'Date', 'Rate', 'Slots', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: WD, fontFamily: FB, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedJobs.map((job, i) => {
              const match = isProfileMatch(job);
              const hasApplied = applications.some(a => a.jobId === job.id);
              const displayDistance = userLocation
                ? haversineDistance(userLocation.lat, userLocation.lng, job.coordinates.lat, job.coordinates.lng).toFixed(1)
                : job.distanceKm?.toFixed(1) || '?';
              return (
                <tr
                  key={job.id}
                  style={{ borderBottom: i < sortedJobs.length - 1 ? `1px solid ${BB}` : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelectedJob(job)}
                >
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: W }}>{job.title}</div>
                    {match && <div style={{ fontSize: 10, color: GL, fontWeight: 600, marginTop: 2 }}>⚡ Profile Match</div>}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: WM }}>{job.client}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 12, color: W }}>{job.venue}</div>
                    <div style={{ fontSize: 11, color: WD }}>{displayDistance}km away</div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: WM, whiteSpace: 'nowrap' }}>
                    {new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}<br />
                    <span style={{ fontSize: 10, color: WD }}>{job.startTime}–{job.endTime}</span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: G, fontWeight: 700 }}>R{job.hourlyRate}/hr</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 12, color: W }}>{job.filledSlots}/{job.totalSlots}</div>
                    <div style={{ marginTop: 4, height: 3, background: BB, borderRadius: 2, width: 48 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: match ? GL : WD, width: `${(job.filledSlots / job.totalSlots) * 100}%` }} />
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {getStatusBadge(job)}
                  </td>
                  <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                    {hasApplied ? (
                      <span style={{ fontSize: 11, color: applications.find(a => a.jobId === job.id)?.status === 'allocated' ? TEAL : AMBER, fontWeight: 600 }}>
                        {applications.find(a => a.jobId === job.id)?.status === 'allocated' ? '✓ Allocated' : '⏳ Standby'}
                      </span>
                    ) : job.status === 'open' ? (
                      <button
                        onClick={e => { e.stopPropagation(); handleApply(job); }}
                        disabled={applying === job.id}
                        style={{
                          fontSize: 11, color: G, background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: FB, fontWeight: 700, padding: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = GL}
                        onMouseLeave={e => e.currentTarget.style.color = G}
                      >
                        {applying === job.id ? 'Applying...' : 'Apply →'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: WD }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sortedJobs.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: WD, fontSize: 13 }}>No jobs found. Try adjusting your filters.</div>
        )}
      </div>

      {/* Job Detail Modal – restyled to match admin's modal */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }} onClick={() => setSelectedJob(null)}>
          <div style={{ background: BC, border: `1px solid ${BB}`, padding: '44px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', position: 'relative', borderRadius: 4 }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${GL}, ${G2})` }} />
            <button onClick={() => setSelectedJob(null)} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: WD, fontSize: 18 }}>✕</button>
            <h2 style={{ color: W, fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{selectedJob.title}</h2>
            <p style={{ color: GL, fontSize: '15px', marginBottom: '28px' }}>{selectedJob.client} · {selectedJob.brand}</p>

            {[
              { label: 'Venue', value: selectedJob.venue },
              { label: 'Address', value: selectedJob.address },
              { label: 'Date', value: new Date(selectedJob.date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: 'Time', value: `${selectedJob.startTime} – ${selectedJob.endTime}` },
              { label: 'Rate', value: `R${selectedJob.hourlyRate}/hr` },
              { label: 'Slots', value: `${selectedJob.filledSlots}/${selectedJob.totalSlots} filled` },
              { label: 'Requirements', value: [
                selectedJob.filters.gender && selectedJob.filters.gender !== 'any' ? `${selectedJob.filters.gender.charAt(0).toUpperCase() + selectedJob.filters.gender.slice(1)} only` : null,
                selectedJob.filters.minHeight ? `Height ≥ ${selectedJob.filters.minHeight}cm` : null,
              ].filter(Boolean).join(', ') || 'Open to all' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', gap: '16px', padding: '14px 0', borderBottom: `1px solid ${BB}` }}>
                <span style={{ color: WM, fontSize: '14px', minWidth: '100px' }}>{row.label}</span>
                <span style={{ color: W, fontSize: '14px', fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}

            <div style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${BB}`,
                  color: WM, fontFamily: FB, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Close
              </button>
              {profile && selectedJob.status === 'open' && !applications.some(a => a.jobId === selectedJob.id) && (
                <button
                  onClick={() => handleApply(selectedJob)}
                  disabled={applying === selectedJob.id}
                  style={{
                    flex: 2, padding: '12px', background: G, border: 'none', color: B,
                    fontFamily: FB, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = GL}
                  onMouseLeave={e => e.currentTarget.style.background = G}
                >
                  {applying === selectedJob.id ? 'Applying...' : `Apply Now — R${selectedJob.hourlyRate}/hr`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};