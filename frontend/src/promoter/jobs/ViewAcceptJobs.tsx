// promoter/jobs/ViewAcceptJobs.tsx
// Updated with real distance filtering, standby auto-allocation, and toasts.

import React, { useState, useEffect } from 'react';
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

// Design tokens
const G = '#D4AF37';
const BC = '#161616';
const BB = 'rgba(255,255,255,0.08)';
const W = '#fff';
const WM = '#a0a0a0';
const WD = '#555';
const FB = "'DM Sans', system-ui, sans-serif";

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
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [showFilters, setShowFilters] = useState(false);
  const [standbyNotified, setStandbyNotified] = useState<Set<string>>(new Set());

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
        // Fallback to a default location (Sandton)
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

  // Load distance preference
  useEffect(() => {
    if (!user) return;
    const pref = localStorage.getItem(`hg_pref_${user.id}_maxDistance`);
    if (pref) setMaxDistance(parseInt(pref));
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
        // Update job list to reflect filled slots
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
    }, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [user, jobs, standbyNotified]);

  const isProfileMatch = (job: Job): boolean => {
    if (!profile) return false;
    const { gender, minHeight } = job.filters;
    if (gender && gender !== 'any' && gender !== profile.gender) return false;
    if (minHeight && (profile.physicalAttributes?.height || 0) < minHeight) return false;
    return true;
  };

  const handleDistanceChange = (value: number) => {
    setMaxDistance(value);
    if (user) localStorage.setItem(`hg_pref_${user.id}_maxDistance`, value.toString());
  };

  // Filter jobs based on criteria and distance
  const filteredJobs = jobs.filter(j => {
    if (filter === 'matched' && !isProfileMatch(j)) return false;
    if (filter === 'open' && j.status !== 'open') return false;
    
    // Distance filter
    if (userLocation) {
      const distance = haversineDistance(
        userLocation.lat, userLocation.lng,
        j.coordinates.lat, j.coordinates.lng
      );
      if (distance > maxDistance) return false;
    } else {
      // Fallback to static distanceKm
      if (j.distanceKm && j.distanceKm > maxDistance) return false;
    }
    return true;
  });

  const handleApply = async (job: Job) => {
    if (!user) return;
    setApplying(job.id);
    try {
      const app = await applicationService.apply(job.id, user.id);
      setApplications(prev => [...prev, app]);
      // Update job list to reflect filled slots if allocated
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
      <div style={{ width: 20, height: 20, border: `2px solid ${G}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading jobs...
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: W, fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>Available Jobs</h1>
          <p style={{ color: WD, fontSize: '14px', margin: 0 }}>
            {jobs.filter(j => j.status === 'open').length} open positions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600,
              background: showFilters ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
              color: showFilters ? G : WD,
            }}
          >
            🔍 Filters
          </button>
          {(['all', 'matched', 'open'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600,
                background: filter === f ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? G : WD,
              }}
            >
              {f === 'all' ? 'All Jobs' : f === 'matched' ? '⚡ Match' : 'Open Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Location status */}
      {locationLoading && (
        <div style={{ marginBottom: '16px', color: WM, fontSize: '13px' }}>
          📡 Getting your location...
        </div>
      )}
      {locationError && (
        <div style={{ marginBottom: '16px', color: '#f87171', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {locationError}
          <button onClick={getUserLocation} style={{ color: G, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Distance filter */}
      {showFilters && (
        <div style={{ marginBottom: '24px', padding: '20px', background: BC, border: `1px solid ${BB}`, borderRadius: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: WM, display: 'block', marginBottom: '8px' }}>
            Max Distance: {maxDistance} km
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={maxDistance}
            onChange={e => handleDistanceChange(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: WD, marginTop: '4px' }}>
            <span>0 km</span>
            <span>25 km</span>
            <span>50 km</span>
          </div>
        </div>
      )}

      {!profile && (
        <div style={{ padding: '16px', background: 'rgba(212,175,55,0.06)', border: `1px solid ${G}40`, borderRadius: '12px', marginBottom: '24px' }}>
          <p style={{ color: G, fontSize: '13px', margin: 0 }}>
            ⚠️ Complete your profile to see jobs that match your attributes.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredJobs.map(job => {
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
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${match ? G + '80' : BB}`,
                borderRadius: '14px',
                overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.2s',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedJob(job)}
            >
              <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    {match && <div style={{ fontSize: '10px', color: G, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '6px' }}>⚡ PROFILE MATCH</div>}
                    <h3 style={{ color: W, fontSize: '16px', fontWeight: 700, margin: '0 0 4px', lineHeight: 1.3 }}>{job.title}</h3>
                    <p style={{ color: WM, fontSize: '12px', margin: 0 }}>{job.client} · {job.brand}</p>
                  </div>
                  {getStatusBadge(job)}
                </div>
              </div>

              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { icon: '📍', label: job.venue },
                    { icon: '📏', label: `${displayDistance}km away` },
                    { icon: '📅', label: new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) },
                    { icon: '⏰', label: `${job.startTime} – ${job.endTime}` },
                  ].map((info, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px' }}>{info.icon}</span>
                      <span style={{ color: WM, fontSize: '12px' }}>{info.label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ color: G, fontSize: '22px', fontWeight: 800 }}>R{job.hourlyRate}</span>
                    <span style={{ color: WD, fontSize: '12px' }}>/hr</span>
                  </div>
                  <span style={{ color: '#555', fontSize: '12px' }}>
                    Est. R{job.hourlyRate * (parseInt(job.endTime) - parseInt(job.startTime))} total
                  </span>
                </div>
              </div>

              <div style={{ padding: '0 20px 20px' }}>
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

      {filteredJobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
          <p>No jobs found for this filter.</p>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }} onClick={() => setSelectedJob(null)}>
          <div style={{ background: '#111', border: `1px solid ${G}40`, borderRadius: '20px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: W, fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{selectedJob.title}</h2>
            <p style={{ color: G, fontSize: '14px', marginBottom: '24px' }}>{selectedJob.client} · {selectedJob.brand}</p>

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
              <div key={row.label} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#555', fontSize: '13px', minWidth: '80px' }}>{row.label}</span>
                <span style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
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