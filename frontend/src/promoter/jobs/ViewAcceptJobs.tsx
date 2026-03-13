// promoter/jobs/ViewAcceptJobs.tsx
// Premium UI/UX with search, advanced sorting, and distance slider removed.
// Now fully consistent with the dashboard, profile, and shifts pages.

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

// Design tokens – matching other promoter pages
const G = '#D4AF37';
const GL = '#DDB55A';
const B = '#080808';
const BC = '#161616';
const BB = 'rgba(255,255,255,0.07)';
const W = '#F4EFE6';
const WM = 'rgba(244,239,230,0.55)';
const WD = '#555';
const FB = "'DM Sans', system-ui, sans-serif";
const FD = "'Playfair Display', Georgia, serif";

// Haversine distance calculation (km)
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // km
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
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc'); // default newest first

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
      (err) => {
        setLocationError('');
        setLocationLoading(false);
        // Fallback to Sandton
        setUserLocation({ lat: -26.1076, lng: 28.0560 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Load data
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

  // Periodic check for standby notifications
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

  // Filter jobs based on search query and filter type
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      // Filter by type
      if (filter === 'matched' && !isProfileMatch(j)) return false;
      if (filter === 'open' && j.status !== 'open') return false;

      // Search by title, client, brand, venue
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          j.title.toLowerCase().includes(q) ||
          j.client.toLowerCase().includes(q) ||
          j.brand.toLowerCase().includes(q) ||
          j.venue.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [jobs, filter, searchQuery, profile]);

  // Sort the filtered jobs
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
          // fallback to static distanceKm
          return jobsToSort.sort((a, b) => multiplier * ((a.distanceKm || 0) - (b.distanceKm || 0)));
        }
      case 'date':
      default:
        return jobsToSort.sort((a, b) => multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
  }, [filteredJobs, sortField, sortDir, userLocation]);

  // Helper to toggle sort direction or change field
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
    if (slotsLeft <= 1) return <Badge variant="warning">{slotsLeft} slot left</Badge>;
    return <Badge variant="success">{slotsLeft} slots open</Badge>;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: WD, padding: '60px 0' }}>
      <div style={{ width: 24, height: 24, border: `2px solid ${G}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '15px', color: WM }}>Loading jobs...</span>
    </div>
  );

  return (
    <div>
      {/* Header with title and filter toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: W, fontSize: '28px', fontWeight: 800, margin: '0 0 4px' }}>Available Jobs</h1>
          <p style={{ color: WM, fontSize: '15px', margin: 0 }}>
            {jobs.filter(j => j.status === 'open').length} open positions
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '8px 20px', borderRadius: '30px', border: `1px solid ${showFilters ? G : BB}`,
            background: showFilters ? `${G}15` : 'transparent',
            color: showFilters ? G : WM, fontSize: '13px', fontWeight: 600,
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
        <div style={{ marginBottom: '16px', color: '#f87171', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📍</span> {locationError}
          <button onClick={getUserLocation} style={{ color: G, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
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
              background: filter === f ? G : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#000' : WM,
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
          background: BC, border: `1px solid ${BB}`, borderRadius: '24px',
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
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${BB}`,
                  borderRadius: '40px', color: W, fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = G}
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
                  padding: '8px 18px', borderRadius: '30px', border: `1px solid ${sortField === 'date' ? G : BB}`,
                  background: sortField === 'date' ? `${G}15` : 'transparent',
                  color: sortField === 'date' ? G : WM, fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                Date {sortField === 'date' && (sortDir === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => handleSortChange('pay', sortField === 'pay' && sortDir === 'desc' ? 'asc' : 'desc')}
                style={{
                  padding: '8px 18px', borderRadius: '30px', border: `1px solid ${sortField === 'pay' ? G : BB}`,
                  background: sortField === 'pay' ? `${G}15` : 'transparent',
                  color: sortField === 'pay' ? G : WM, fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                Pay {sortField === 'pay' && (sortDir === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => handleSortChange('distance', sortField === 'distance' && sortDir === 'asc' ? 'desc' : 'asc')}
                style={{
                  padding: '8px 18px', borderRadius: '30px', border: `1px solid ${sortField === 'distance' ? G : BB}`,
                  background: sortField === 'distance' ? `${G}15` : 'transparent',
                  color: sortField === 'distance' ? G : WM, fontSize: '13px', fontWeight: 500,
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
        <div style={{ padding: '18px 22px', background: `${G}0f`, border: `1px solid ${G}30`, borderRadius: '16px', marginBottom: '28px' }}>
          <p style={{ color: G, fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
            ⚠️ Complete your profile to see jobs that match your attributes.
          </p>
        </div>
      )}

      {/* Job cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {sortedJobs.map(job => {
          const match = isProfileMatch(job);
          const hasApplied = applications.some(a => a.jobId === job.id);
          const canApply = profile && job.status === 'open' && !hasApplied;
          
          // Calculate dynamic distance if location available
          const displayDistance = userLocation
            ? haversineDistance(userLocation.lat, userLocation.lng, job.coordinates.lat, job.coordinates.lng).toFixed(1)
            : job.distanceKm?.toFixed(1) || '?';

          return (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              style={{
                background: BC,
                border: `1px solid ${match ? G + '80' : BB}`,
                borderRadius: '24px',
                overflow: 'hidden',
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                boxShadow: match ? `0 4px 12px ${G}20` : 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${G}30`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = match ? `0 4px 12px ${G}20` : 'none'; }}
            >
              <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${BB}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    {match && <div style={{ fontSize: '11px', color: G, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '8px' }}>⚡ PROFILE MATCH</div>}
                    <h3 style={{ color: W, fontSize: '18px', fontWeight: 700, margin: '0 0 6px', lineHeight: 1.3 }}>{job.title}</h3>
                    <p style={{ color: WM, fontSize: '13px', margin: 0 }}>{job.client} · {job.brand}</p>
                  </div>
                  {getStatusBadge(job)}
                </div>
              </div>

              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { icon: '📍', label: job.venue },
                    { icon: '📏', label: `${displayDistance}km away` },
                    { icon: '📅', label: new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) },
                    { icon: '⏰', label: `${job.startTime} – ${job.endTime}` },
                  ].map((info, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: WM }}>{info.icon}</span>
                      <span style={{ color: WM, fontSize: '13px' }}>{info.label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ color: G, fontSize: '24px', fontWeight: 800 }}>R{job.hourlyRate}</span>
                    <span style={{ color: WM, fontSize: '12px' }}>/hr</span>
                  </div>
                  <span style={{ color: WD, fontSize: '13px' }}>
                    Est. R{job.hourlyRate * (parseInt(job.endTime) - parseInt(job.startTime))}
                  </span>
                </div>

                <Button
                  fullWidth
                  variant={canApply ? 'primary' : 'ghost'}
                  size="sm"
                  disabled={!canApply}
                  loading={applying === job.id}
                  onClick={e => { e.stopPropagation(); if (canApply) handleApply(job); }}
                >
                  {hasApplied
                    ? applications.find(a => a.jobId === job.id)?.status === 'allocated'
                      ? '✓ Allocated'
                      : '⏳ Standby'
                    : job.status === 'filled'
                      ? 'Position Full'
                      : !profile
                        ? 'Profile Required'
                        : 'Apply Now'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {sortedJobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: WM }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: G }}>🔍</div>
          <p style={{ fontSize: '16px', margin: 0 }}>No jobs found. Try adjusting your filters.</p>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }} onClick={() => setSelectedJob(null)}>
          <div style={{ background: BC, border: `1px solid ${G}40`, borderRadius: '28px', maxWidth: '540px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '36px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: W, fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{selectedJob.title}</h2>
            <p style={{ color: G, fontSize: '15px', marginBottom: '28px' }}>{selectedJob.client} · {selectedJob.brand}</p>

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
              <Button variant="ghost" onClick={() => setSelectedJob(null)} style={{ flex: 1 }}>Close</Button>
              {profile && selectedJob.status === 'open' && !applications.some(a => a.jobId === selectedJob.id) && (
                <Button loading={applying === selectedJob.id} onClick={() => handleApply(selectedJob)} style={{ flex: 2 }}>
                  Apply Now — R{selectedJob.hourlyRate}/hr
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};