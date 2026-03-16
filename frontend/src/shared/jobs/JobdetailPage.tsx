// shared/jobs/JobdetailPage.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsService } from '../services/jobsService';
import { useAuth } from '../hooks/useAuth';
import type { Job } from '../types/job.types';

const G = '#C4973A'; const B = '#080808'; const BC = '#161616'; const BB = 'rgba(255,255,255,0.07)';
const W = '#F4EFE6'; const WM = 'rgba(244,239,230,0.55)'; const WD = 'rgba(244,239,230,0.22)';
const FD = "'Playfair Display', Georgia, serif"; const FB = "'DM Sans', system-ui, sans-serif";

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    if (jobId) jobsService.getJobById(jobId).then(setJob);
  }, [jobId]);

  if (!job) return <div style={{ minHeight: '100vh', background: B, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WD, fontFamily: FB }}>Loading job details…</div>;

  return (
    <div style={{ minHeight: '100vh', background: B, fontFamily: FB, color: W }}>
      <nav style={{ padding: '18px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${BB}`, background: BC }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: WM, cursor: 'pointer', fontFamily: FB, fontSize: 13 }}>← Back to Jobs</button>
        <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700 }}><span style={{ color: G }}>HONEY</span><span style={{ color: W }}> GROUP</span></div>
      </nav>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ marginBottom: 10, fontSize: 11, color: WD }}>{job.client} · {job.location}</div>
        <h1 style={{ fontFamily: FD, fontSize: 36, fontWeight: 700, color: W, marginBottom: 20 }}>{job.title}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: BB, marginBottom: 36 }}>
          {[
            { label: 'Rate',  value: `R${job.hourlyRate}/hr` },
            { label: 'Date',  value: new Date(job.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'long' }) },
            { label: 'Slots', value: `${job.slots} available` },
          ].map((r, i) => (
            <div key={i} style={{ background: BC, padding: '20px 24px' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WD, marginBottom: 8 }}>{r.label}</div>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color: G }}>{r.value}</div>
            </div>
          ))}
        </div>
        {job.description && <p style={{ fontSize: 14, color: WM, lineHeight: 1.8, marginBottom: 32 }}>{job.description}</p>}
        {job.requirements && job.requirements.length > 0 && (
          <div style={{ marginBottom: 36, padding: '20px 24px', background: BC, border: `1px solid ${BB}` }}>
            <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 14, fontWeight: 700 }}>Requirements</div>
            {job.requirements.map((r, i) => <div key={i} style={{ fontSize: 13, color: WM, padding: '6px 0', borderBottom: i < job.requirements!.length - 1 ? `1px solid ${BB}` : 'none' }}>· {r}</div>)}
          </div>
        )}
        <button onClick={() => isAuthenticated ? navigate('/promoter/jobs') : navigate('/register')}
          style={{ width: '100%', padding: '15px', background: job.status === 'open' ? G : 'rgba(255,255,255,0.06)', border: 'none', color: job.status === 'open' ? B : WM, fontFamily: FB, fontSize: 14, fontWeight: 700, cursor: job.status === 'open' ? 'pointer' : 'not-allowed', letterSpacing: '0.06em' }}>
          {job.status === 'open' ? (isAuthenticated ? 'Apply for This Job' : 'Register to Apply') : 'Job Closed'}
        </button>
      </div>
    </div>
  );
}