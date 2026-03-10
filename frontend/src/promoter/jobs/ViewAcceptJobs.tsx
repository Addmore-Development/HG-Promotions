import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { jobsService } from '../../shared/services/jobsService';
import { usersService } from '../../shared/services/usersService';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import type { Job } from '../../shared/types/job.types';
import type { UserProfile } from '../../shared/types/user.types';

export const ViewAcceptJobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState<'all' | 'matched' | 'open'>('all');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [j, p] = await Promise.all([
        jobsService.getAvailableJobs(user.id),
        usersService.getProfile(user.id),
      ]);
      setJobs(j);
      setProfile(p);
      setLoading(false);
    };
    load();
  }, [user]);

  const isProfileMatch = (job: Job): boolean => {
    if (!profile) return false;
    const { filters } = job;
    if (filters.gender && filters.gender !== 'any' && filters.gender !== profile.gender) return false;
    if (filters.minHeight && profile.physicalAttributes.height < filters.minHeight) return false;
    return true;
  };

  const filteredJobs = jobs.filter(j => {
    if (filter === 'matched') return isProfileMatch(j);
    if (filter === 'open') return j.status === 'open';
    return true;
  });

  const handleApply = async (job: Job) => {
    if (!user) return;
    setApplying(job.id);
    try {
      await jobsService.applyForJob(job.id, user.id);
      setApplied(prev => new Set([...prev, job.id]));
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, filledSlots: Math.min(j.filledSlots + 1, j.totalSlots) } : j));
      setSelectedJob(null);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setApplying(null);
    }
  };

  const getStatusBadge = (job: Job) => {
    if (applied.has(job.id)) return <Badge variant="success">Applied ✓</Badge>;
    if (job.status === 'filled') return <Badge variant="neutral">Full</Badge>;
    const slotsLeft = job.totalSlots - job.filledSlots;
    if (slotsLeft <= 1) return <Badge variant="warning">{slotsLeft} slot left</Badge>;
    return <Badge variant="success">{slotsLeft} slots open</Badge>;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', padding: '60px 0' }}>
      <div style={{ width: '20px', height: '20px', border: '2px solid #D4AF37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Loading jobs...
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>Available Jobs</h1>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            {jobs.filter(j => j.status === 'open').length} open positions near you
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'matched', 'open'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em',
                background: filter === f ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? '#D4AF37' : '#666',
                transition: 'all 0.2s',
              }}
            >
              {f === 'all' ? 'All Jobs' : f === 'matched' ? '⚡ Profile Match' : 'Open Only'}
            </button>
          ))}
        </div>
      </div>

      {!profile && (
        <div style={{ padding: '16px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '12px', marginBottom: '24px' }}>
          <p style={{ color: '#D4AF37', fontSize: '13px', margin: 0 }}>
            ⚠️ Complete your profile to see jobs that match your attributes and unlock the apply button.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredJobs.map(job => {
          const match = isProfileMatch(job);
          const canApply = profile && job.status === 'open' && !applied.has(job.id);

          return (
            <div
              key={job.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${match ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '14px',
                overflow: 'hidden',
                transition: 'border-color 0.2s, transform 0.2s',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedJob(job)}
            >
              {/* Card header */}
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    {match && <div style={{ fontSize: '10px', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '6px' }}>⚡ PROFILE MATCH</div>}
                    <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 4px', lineHeight: 1.3 }}>{job.title}</h3>
                    <p style={{ color: '#a0a0a0', fontSize: '12px', margin: 0 }}>{job.client} · {job.brand}</p>
                  </div>
                  {getStatusBadge(job)}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { icon: '📍', label: job.venue },
                    { icon: '📏', label: `${job.distanceKm}km away` },
                    { icon: '📅', label: new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) },
                    { icon: '⏰', label: `${job.startTime} – ${job.endTime}` },
                  ].map((info, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px' }}>{info.icon}</span>
                      <span style={{ color: '#a0a0a0', fontSize: '12px' }}>{info.label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ color: '#D4AF37', fontSize: '22px', fontWeight: 800 }}>R{job.hourlyRate}</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>/hr</span>
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
                  {applied.has(job.id) ? '✓ Applied' : job.status === 'filled' ? 'Position Full' : !profile ? 'Complete Profile First' : 'Apply Now'}
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
          <div style={{ background: '#111', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '20px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{selectedJob.title}</h2>
            <p style={{ color: '#D4AF37', fontSize: '14px', marginBottom: '24px' }}>{selectedJob.client} · {selectedJob.brand}</p>

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
              {profile && selectedJob.status === 'open' && !applied.has(selectedJob.id) && (
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