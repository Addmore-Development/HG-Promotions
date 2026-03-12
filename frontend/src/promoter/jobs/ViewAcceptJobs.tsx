// promoter/jobs/ViewAcceptJobs.tsx  — unchanged logic, fixed imports

import React, { useState, useEffect } from 'react';
import { useAuth }          from '../../shared/hooks/useAuth';
import { jobsService }      from '../../shared/services/jobsService';
import { usersService }     from '../../shared/services/usersService';
import { Button }           from '../../shared/components/Button';
import { Badge }            from '../../shared/components/Badge';
import type { Job }         from '../../shared/types/job.types';
import type { UserProfile } from '../../shared/types/user.types';

export const ViewAcceptJobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs,        setJobs]        = useState<Job[]>([]);
  const [profile,     setProfile]     = useState<UserProfile | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [applying,    setApplying]    = useState<string | null>(null);
  const [applied,     setApplied]     = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filter,      setFilter]      = useState<'all' | 'matched' | 'open'>('all');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      jobsService.getAvailableJobs(user.id),
      usersService.getProfile(user.id),
    ]).then(([j, p]) => { setJobs(j); setProfile(p); setLoading(false); });
  }, [user]);

  const isProfileMatch = (job: Job): boolean => {
    if (!profile) return false;
    const { gender, minHeight } = job.filters;
    if (gender && gender !== 'any' && gender !== profile.gender) return false;
    if (minHeight && profile.physicalAttributes.height < minHeight) return false;
    return true;
  };

  const filtered = jobs.filter(j => {
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
    } catch (e) { console.error(e); }
    finally { setApplying(null); }
  };

  const slotBadge = (job: Job) => {
    if (applied.has(job.id)) return <Badge variant="success">Applied ✓</Badge>;
    if (job.status === 'filled') return <Badge variant="neutral">Full</Badge>;
    const n = job.totalSlots - job.filledSlots;
    return <Badge variant={n <= 1 ? 'warning' : 'success'}>{n} slot{n !== 1 ? 's' : ''} open</Badge>;
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', color:'#666', padding:'60px 0' }}>
      <div style={{ width:20, height:20, border:'2px solid #D4AF37', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      Loading jobs…
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px', flexWrap:'wrap', gap:'16px' }}>
        <div>
          <h1 style={{ color:'#fff', fontSize:'22px', fontWeight:800, margin:'0 0 6px' }}>Available Jobs</h1>
          <p style={{ color:'#666', fontSize:'14px', margin:0 }}>{jobs.filter(j => j.status === 'open').length} open positions near you</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {(['all','matched','open'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:'8px 16px', borderRadius:'20px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:600, background: filter === f ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', color: filter === f ? '#D4AF37' : '#666', fontFamily:'inherit' }}>
              {f === 'all' ? 'All Jobs' : f === 'matched' ? '⚡ Profile Match' : 'Open Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px, 1fr))', gap:'16px' }}>
        {filtered.map(job => {
          const match = isProfileMatch(job);
          const canApply = !!profile && job.status === 'open' && !applied.has(job.id);
          return (
            <div key={job.id} onClick={() => setSelectedJob(job)} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${match ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius:'14px', overflow:'hidden', cursor:'pointer', transition:'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}
            >
              <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'4px' }}>
                  <div>
                    {match && <div style={{ fontSize:'10px', color:'#D4AF37', fontWeight:700, letterSpacing:'0.08em', marginBottom:'6px' }}>⚡ PROFILE MATCH</div>}
                    <h3 style={{ color:'#fff', fontSize:'15px', fontWeight:700, margin:'0 0 4px' }}>{job.title}</h3>
                    <p style={{ color:'#a0a0a0', fontSize:'12px', margin:0 }}>{job.client} · {job.brand}</p>
                  </div>
                  {slotBadge(job)}
                </div>
              </div>
              <div style={{ padding:'16px 20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
                  {[{ icon:'📍', text:job.venue },{ icon:'📏', text:`${job.distanceKm}km away` },{ icon:'📅', text:new Date(job.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'}) },{ icon:'⏰', text:`${job.startTime}–${job.endTime}` }].map((r,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ fontSize:'12px' }}>{r.icon}</span>
                      <span style={{ color:'#a0a0a0', fontSize:'12px' }}>{r.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'baseline', gap:'4px', marginBottom:'14px' }}>
                  <span style={{ color:'#D4AF37', fontSize:'22px', fontWeight:800 }}>R{job.hourlyRate}</span>
                  <span style={{ color:'#555', fontSize:'12px' }}>/hr</span>
                </div>
                <Button fullWidth variant={canApply ? 'primary' : 'ghost'} size="sm" disabled={!canApply} loading={applying === job.id}
                  onClick={e => { e.stopPropagation(); if (canApply) handleApply(job); }}>
                  {applied.has(job.id) ? '✓ Applied' : job.status === 'filled' ? 'Position Full' : !profile ? 'Profile Required' : 'Apply Now'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px', color:'#555' }}>
          <div style={{ fontSize:'40px', marginBottom:'16px' }}>🔍</div>
          <p>No jobs found for this filter.</p>
        </div>
      )}

      {/* Detail modal */}
      {selectedJob && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'24px' }} onClick={() => setSelectedJob(null)}>
          <div style={{ background:'#111', border:'1px solid rgba(212,175,55,0.25)', borderRadius:'20px', maxWidth:'500px', width:'100%', maxHeight:'80vh', overflowY:'auto', padding:'32px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color:'#fff', fontSize:'20px', fontWeight:800, marginBottom:'4px' }}>{selectedJob.title}</h2>
            <p style={{ color:'#D4AF37', fontSize:'14px', marginBottom:'24px' }}>{selectedJob.client} · {selectedJob.brand}</p>
            {[
              { label:'Venue',   value: selectedJob.venue },
              { label:'Address', value: selectedJob.address },
              { label:'Date',    value: new Date(selectedJob.date).toLocaleDateString('en-ZA',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) },
              { label:'Time',    value: `${selectedJob.startTime} – ${selectedJob.endTime}` },
              { label:'Rate',    value: `R${selectedJob.hourlyRate}/hr` },
              { label:'Slots',   value: `${selectedJob.filledSlots}/${selectedJob.totalSlots} filled` },
              { label:'Requirements', value: [
                selectedJob.filters.gender && selectedJob.filters.gender !== 'any' ? `${selectedJob.filters.gender.charAt(0).toUpperCase() + selectedJob.filters.gender.slice(1)} only` : null,
                selectedJob.filters.minHeight ? `Height ≥ ${selectedJob.filters.minHeight}cm` : null,
              ].filter(Boolean).join(', ') || 'Open to all' },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', gap:'12px', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color:'#555', fontSize:'13px', minWidth:'90px' }}>{r.label}</span>
                <span style={{ color:'#e0e0e0', fontSize:'13px', fontWeight:600 }}>{r.value}</span>
              </div>
            ))}
            <div style={{ marginTop:'24px', display:'flex', gap:'12px' }}>
              <Button variant="ghost" onClick={() => setSelectedJob(null)} style={{ flex:1 }}>Close</Button>
              {profile && selectedJob.status === 'open' && !applied.has(selectedJob.id) && (
                <Button loading={applying === selectedJob.id} onClick={() => handleApply(selectedJob)} style={{ flex:2 }}>
                  Apply — R{selectedJob.hourlyRate}/hr
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};