import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ALL_JOBS } from './JobsPage';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const B   = '#080808';
const BC  = '#161616';
const BC2 = '#1c1c1c';
const BB  = 'rgba(212,136,10,0.16)';
const G   = '#C4973A';
const GL  = '#DDB55A';
const W   = '#F4EFE6';
const WM  = 'rgba(244,239,230,0.55)';
const WD  = 'rgba(244,239,230,0.22)';
const FD  = "'Playfair Display', Georgia, serif";
const FB  = "'DM Sans', system-ui, sans-serif";

/* ── STATUS BADGE ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    'open':         { color: '#C4973A', bg: 'rgba(196,151,58,0.12)' },
    'filling fast': { color: '#DDB55A', bg: 'rgba(221,181,90,0.12)' },
    'closed':       { color: '#8B6A2A', bg: 'rgba(139,106,42,0.18)' },
  };
  const s = map[status] || map['open'];
  return (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: s.color, background: s.bg, padding: '4px 12px', borderRadius: 2 }}>{status}</span>
  );
}

/* ── APPLY MODAL ── */
function ApplyModal({ job, role, onClose }: { job: any; role: string; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const canApply = role === 'promoter';

  const submit = () => {
    if (!form.name || !form.phone) return;
    setStep('success');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: BC, border: `1px solid ${BB}`, padding: '48px', maxWidth: 480, width: '100%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: G }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: WM, fontSize: 18 }}>✕</button>

        {step === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
            <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: G, marginBottom: 10 }}>Application Sent</div>
            <h3 style={{ fontFamily: FD, fontSize: 24, fontWeight: 700, color: W, marginBottom: 14 }}>You're in the pool!</h3>
            <p style={{ fontSize: 13, color: WM, lineHeight: 1.7 }}>Your application for <strong style={{ color: W }}>{job.title}</strong> has been submitted. You'll receive SMS confirmation shortly.</p>
            <button onClick={onClose} style={{ marginTop: 28, padding: '12px 36px', background: G, border: 'none', color: B, fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>Close</button>
          </div>
        ) : !canApply ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 20 }}>🔒</div>
            <h3 style={{ fontFamily: FD, fontSize: 24, fontWeight: 700, color: W, marginBottom: 14 }}>Promoters Only</h3>
            <p style={{ fontSize: 13, color: WM, lineHeight: 1.7 }}>Only registered promoters can apply for jobs.</p>
            <button onClick={onClose} style={{ marginTop: 24, padding: '12px 36px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 11, cursor: 'pointer' }}>Got it</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: G, marginBottom: 10 }}>Apply Now</div>
            <h3 style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color: W, marginBottom: 6 }}>{job.title}</h3>
            <p style={{ fontSize: 12, color: WM, marginBottom: 28 }}>{job.company} · {job.location}</p>
            {[
              { label: 'Full Name', key: 'name', placeholder: 'Ayanda Dlamini' },
              { label: 'Phone Number', key: 'phone', placeholder: '+27 71 000 0000' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: WM, display: 'block', marginBottom: 7 }}>{label}</label>
                <input value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BB}`, padding: '12px 14px', color: W, fontFamily: FB, fontSize: 13, outline: 'none' }}
                  onFocus={e => e.currentTarget.style.borderColor = G} onBlur={e => e.currentTarget.style.borderColor = BB} />
              </div>
            ))}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: WM, display: 'block', marginBottom: 7 }}>Note to Client (optional)</label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="Tell the client why you're the right fit..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BB}`, padding: '12px 14px', color: W, fontFamily: FB, fontSize: 13, resize: 'none', outline: 'none' }}
                onFocus={e => e.currentTarget.style.borderColor = G} onBlur={e => e.currentTarget.style.borderColor = BB} />
            </div>
            <button onClick={submit}
              style={{ width: '100%', padding: '15px', background: G, border: 'none', color: B, fontFamily: FB, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = GL}
              onMouseLeave={e => e.currentTarget.style.background = G}>
              Submit Application
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── JOB DETAIL PAGE ── */
export default function JobDetailPage() {
  const navigate  = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [applyOpen, setApplyOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const s = localStorage.getItem('hg_session');
    if (s) { try { setSession(JSON.parse(s)); } catch {} }
  }, []);

  const role = session?.role || 'promoter';

  // Find the job from ALL_JOBS — covers all 24 jobs
  const job = ALL_JOBS.find(j => j.id === jobId);

  const filled = job ? job.slots - job.slotsLeft : 0;
  const pct    = job ? Math.round((filled / job.slots) * 100) : 0;
  const almostFull = job && job.slotsLeft <= 2;

  if (!job) {
    return (
      <div style={{ minHeight: '100vh', background: B, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FB, color: WM, flexDirection: 'column', gap: 20 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap'); *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}`}</style>
        <div style={{ fontSize: 48, color: WD }}>◎</div>
        <div style={{ fontFamily: FD, fontSize: 28, color: W }}>Job Not Found</div>
        <p style={{ fontSize: 14, color: WM, textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>This job may have been removed or the link is incorrect.</p>
        <button onClick={() => navigate('/jobs')} style={{ padding: '12px 32px', background: G, border: 'none', color: B, fontFamily: FB, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>← Browse All Jobs</button>
      </div>
    );
  }

  // Build extended info from job data
  const responsibilities = [
    `Represent the ${job.company} brand professionally throughout the shift`,
    `Engage consumers and drive brand awareness through enthusiastic interaction`,
    `Report attendance and activity via the Honey Group app`,
    `Maintain branded uniform and presentation standards`,
    `Complete all briefing requirements before the shift begins`,
  ];

  const requirements = [
    { label: 'Type',       value: job.type },
    { label: 'Duration',   value: job.duration },
    { label: 'Date',       value: job.date },
    { label: 'Location',   value: job.location },
    { label: 'Total Slots', value: String(job.slots) },
    ...(job.tags || []).map((tag: string) => {
      const parts = tag.split(':');
      return { label: parts.length > 1 ? parts[0].trim() : 'Requirement', value: parts.length > 1 ? parts[1].trim() : tag };
    }),
  ];

  const perks = [
    'Branded uniform or attire provided',
    `${job.pay} ${job.payPer} — paid within 5 business days`,
    'Geo-verified check-in confirmation',
    'Professional work history on Honey Group platform',
  ];

  return (
    <div style={{ minHeight: '100vh', background: B, fontFamily: FB, color: W }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:${B};}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:${G};}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,8,0.96)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BB}`, padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/jobs')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: WM, fontFamily: FB, fontSize: 12, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = W} onMouseLeave={e => e.currentTarget.style.color = WM}>
          ← Back to Jobs
        </button>
        <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700 }}>
          <span style={{ color: G }}>HONEY</span><span style={{ color: W }}> GROUP</span>
        </div>
        <StatusBadge status={job.status} />
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 48px', animation: 'fadeIn 0.35s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

          {/* LEFT COLUMN */}
          <div>
            {/* HERO HEADER */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '40px 40px 36px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, #6B3F10, ${G}, ${GL}, ${G}, #6B3F10)` }} />
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 80% at 100% 50%, rgba(196,151,58,0.06) 0%, transparent 60%)` }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: `rgba(196,151,58,0.15)`, border: `1px solid rgba(196,151,58,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: G, fontFamily: FD }}>
                    {job.company.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: G, fontWeight: 600 }}>{job.company}</div>
                    <div style={{ fontSize: 10, color: WD, marginTop: 2, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{job.type}</div>
                  </div>
                </div>
                <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W, lineHeight: 1.2, marginBottom: 20 }}>{job.title}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(job.tags || []).map((tag: string, i: number) => (
                    <span key={i} style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: WD, background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(212,136,10,0.16)`, padding: '4px 12px', borderRadius: 2 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* KEY DETAILS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: BB, border: `1px solid ${BB}`, marginBottom: 24 }}>
              {[
                { label: 'Pay Rate',  value: job.pay,      sub: job.payPer,  highlight: true },
                { label: 'Date',      value: job.date,     sub: job.type,    highlight: false },
                { label: 'Duration',  value: job.duration, sub: `${job.slots} slots`, highlight: false },
              ].map((item, i) => (
                <div key={i} style={{ background: BC, padding: '20px 24px' }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: WD, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: item.highlight ? G : W, fontFamily: item.highlight ? FD : FB }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: WM, marginTop: 3 }}>{item.sub}</div>
                </div>
              ))}
            </div>

            {/* LOCATION */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '24px 28px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 16, fontWeight: 700 }}>Logistics</div>
              {[
                { icon: '◎', label: 'Location',   value: job.location },
                { icon: '◈', label: 'Date',        value: job.date },
                { icon: '◉', label: 'Duration',    value: `${job.duration} · ${job.slots} total slots` },
                { icon: '✧', label: 'Availability', value: `${job.slotsLeft} slot${job.slotsLeft !== 1 ? 's' : ''} remaining` },
              ].map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 90px 1fr', gap: 12, padding: '12px 0', borderBottom: i < 3 ? `1px solid ${BB}` : 'none', alignItems: 'flex-start' }}>
                  <span style={{ color: G, fontSize: 13 }}>{row.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: WD }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: WM, lineHeight: 1.5 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* ABOUT */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 16, fontWeight: 700 }}>About This Job</div>
              <p style={{ fontSize: 14, color: WM, lineHeight: 1.85 }}>
                {job.company} is seeking enthusiastic promoters for this {job.type.toLowerCase()} activation. You will represent the brand in a professional manner, engage with consumers, and ensure a memorable brand experience. This is an excellent opportunity to build your portfolio and earn competitive rates.
              </p>
            </div>

            {/* RESPONSIBILITIES */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 20, fontWeight: 700 }}>What You'll Do</div>
              <ul style={{ listStyle: 'none' }}>
                {responsibilities.map((r, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: G, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: WM, lineHeight: 1.6 }}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* REQUIREMENTS */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 20, fontWeight: 700 }}>Requirements</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {requirements.map((req, i) => (
                    <tr key={i} style={{ borderBottom: i < requirements.length - 1 ? `1px solid ${BB}` : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 8px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: WD, width: 130 }}>{req.label}</td>
                      <td style={{ padding: '12px 8px', fontSize: 14, color: W }}>{req.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PERKS */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 18, fontWeight: 700 }}>Perks & Benefits</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {perks.map((perk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: `rgba(196,151,58,0.08)`, border: `1px solid rgba(196,151,58,0.22)`, borderRadius: 2 }}>
                    <span style={{ color: G, fontSize: 12 }}>✦</span>
                    <span style={{ fontSize: 13, color: W }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TERMS SNIPPET */}
            {job.terms && (
              <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px', marginTop: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 16, fontWeight: 700 }}>Terms & Conditions</div>
                <div style={{ whiteSpace: 'pre-line', fontSize: 12, lineHeight: 1.85, color: WM, fontFamily: FB, maxHeight: 200, overflow: 'hidden', position: 'relative' }}>
                  {job.terms.slice(0, 400)}…
                </div>
                <p style={{ fontSize: 11, color: WD, marginTop: 12 }}>Full T&Cs visible when you proceed to apply.</p>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* APPLY CARD */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, #6B3F10, ${G}, ${GL}, ${G}, #6B3F10)` }} />
              <div style={{ fontFamily: FD, fontSize: 32, fontWeight: 700, color: G, marginBottom: 4 }}>{job.pay}</div>
              <div style={{ fontSize: 12, color: WM, marginBottom: 20 }}>{job.payPer} · {job.duration}</div>

              {/* slots bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: WD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Slots Available</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: almostFull ? '#B8820A' : G }}>{job.slotsLeft} of {job.slots} left</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: almostFull ? '#B8820A' : G, borderRadius: 2, transition: 'width 0.5s' }} />
                </div>
                {almostFull && <div style={{ fontSize: 11, color: '#B8820A', marginTop: 8, fontWeight: 600 }}>⚡ Almost full — apply quickly</div>}
              </div>

              <button onClick={() => setApplyOpen(true)}
                style={{ width: '100%', padding: '16px', background: G, border: 'none', color: B, fontFamily: FB, fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 12, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = GL}
                onMouseLeave={e => e.currentTarget.style.background = G}>
                Apply for This Job
              </button>
              <button onClick={() => navigate('/jobs')}
                style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = WM; e.currentTarget.style.color = W; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = WM; }}>
                ← Back to Jobs
              </button>
            </div>

            {/* COMPANY CARD */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 16, fontWeight: 700 }}>About the Client</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `rgba(196,151,58,0.15)`, border: `1px solid rgba(196,151,58,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: G, fontFamily: FD, flexShrink: 0 }}>
                  {job.company.charAt(0)}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: W }}>{job.company}</div>
              </div>
              <p style={{ fontSize: 12, color: WM, lineHeight: 1.7 }}>
                {job.company} runs verified promoter campaigns through the Honey Group platform. All activations are GPS-verified and fully POPIA compliant.
              </p>
            </div>

            {/* JOB ID */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: WD, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Job Reference</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: G, fontFamily: 'monospace' }}>{job.id}</span>
            </div>

            {/* CONTACT */}
            {job.contactPerson && (
              <div style={{ background: BC, border: `1px solid ${BB}`, padding: '24px 28px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 16, fontWeight: 700 }}>Contact</div>
                {[
                  { label: 'Name',  value: job.contactPerson },
                  { label: 'Email', value: job.contactEmail },
                  { label: 'Phone', value: job.contactPhone },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BB}` }}>
                    <span style={{ fontSize: 11, color: WD }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: W }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {applyOpen && <ApplyModal job={job} role={role} onClose={() => setApplyOpen(false)} />}
    </div>
  );
}