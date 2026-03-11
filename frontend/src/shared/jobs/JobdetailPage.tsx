import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const B   = '#080808';
const BC  = '#161616';
const BC2 = '#1c1c1c';
const BB  = 'rgba(255,255,255,0.07)';
const G   = '#C4973A';
const GL  = '#DDB55A';
const W   = '#F4EFE6';
const WM  = 'rgba(244,239,230,0.55)';
const WD  = 'rgba(244,239,230,0.22)';
const FD  = "'Playfair Display', Georgia, serif";
const FB  = "'DM Sans', system-ui, sans-serif";

/* ─── MOCK JOB DATABASE ───────────────────────────────────────── */
const JOBS_DB: Record<string, any> = {
  'JB-201': {
    id: 'JB-201',
    title: 'Brand Promoter — Castle Lager Launch',
    company: 'SABMiller SA',
    companyInitial: 'S',
    companyColor: '#3A7BD5',
    companyBio: 'SABMiller is one of the largest brewers in the world. Their South African division runs premium brand activations across all major metros.',
    location: 'Sandton City Shopping Centre, Johannesburg',
    type: 'Brand Activation',
    status: 'open',
    pay: 'R 950',
    payPer: 'per shift',
    date: 'Saturday 22 March 2026',
    time: '09:00 – 17:00 (8 hours)',
    slots: 6,
    slotsLeft: 2,
    duration: '8 hrs',
    reportTo: 'Supervisor: Lerato Mokoena',
    dress: 'Branded Castle Lager uniform provided. Black trousers, black closed shoes (own).',
    briefing: 'Briefing at 08:30 at the main entrance. DO NOT be late. Briefing packs will be distributed.',
    description: 'We are looking for energetic, outgoing brand promoters to represent the Castle Lager brand at our Sandton City launch activation. You will be engaging shoppers, distributing samples (sealed cans), and driving brand awareness through enthusiastic interaction.',
    responsibilities: [
      'Engage customers in the shopping centre with enthusiasm and professionalism',
      'Distribute product samples and promotional material as briefed',
      'Capture leads via QR code scan on provided device',
      'Maintain brand uniform and presentation standards throughout shift',
      'Report attendance and activity via the Honey Group app',
    ],
    requirements: [
      { label: 'Gender',       value: 'Female preferred' },
      { label: 'Age',          value: '18 – 30 years' },
      { label: 'Height',       value: 'Not specified' },
      { label: 'Languages',    value: 'English (fluent)' },
      { label: 'Experience',   value: 'Min. 1 year brand activation' },
      { label: 'Transport',    value: 'Own transport or reliable access to Sandton' },
      { label: 'Reliability',  value: 'Score 70%+ on Honey Group platform' },
    ],
    perks: ['Meals provided on shift', 'Castle Lager uniform included', 'Same-day EFT payment post-approval'],
    tags: ['Female preferred', 'English', 'Own transport', 'Brand Activation'],
    mapEmbed: 'Sandton City, Sandton, 2196',
  },
  'JB-202': {
    id: 'JB-202',
    title: 'Red Bull Sampling — Activations Team',
    company: 'Red Bull South Africa',
    companyInitial: 'R',
    companyColor: '#EF4444',
    companyBio: 'Red Bull SA manages experiential marketing and sampling campaigns nationwide. Known for high-energy events and premium brand standards.',
    location: 'V&A Waterfront, Cape Town',
    type: 'Sampling',
    status: 'open',
    pay: 'R 800',
    payPer: 'per shift',
    date: 'Sunday 23 March 2026',
    time: '10:00 – 16:00 (6 hours)',
    slots: 4,
    slotsLeft: 4,
    duration: '6 hrs',
    reportTo: 'Supervisor: Musa Dube',
    dress: 'Red Bull wings outfit provided. White sneakers (own). Hair tied back.',
    briefing: 'Briefing via WhatsApp group 24hrs before. Arrive at V&A security gate at 09:45.',
    description: "Join the Red Bull Wings Team at the iconic V&A Waterfront. You will be sampling cold Red Bull cans to shoppers, tourists, and locals — creating memorable brand experiences in one of Cape Town's most visited destinations.",
    responsibilities: [
      'Distribute samples from branded cooler backpack in high-foot-traffic zones',
      'Engage consumers in a fun, energetic, and brand-aligned manner',
      'Log sample counts on the Honey Group app every hour',
      'Capture photos/video for social content (client approval required)',
      'Maintain a clean and professional brand presence at all times',
    ],
    requirements: [
      { label: 'Gender',       value: 'Any gender' },
      { label: 'Age',          value: '18 – 28 years' },
      { label: 'Height',       value: 'Not specified' },
      { label: 'Languages',    value: 'Afrikaans & English' },
      { label: 'Experience',   value: 'FMCG sampling experience a plus' },
      { label: 'Transport',    value: 'Must be able to reach V&A Waterfront' },
      { label: 'Energy',       value: 'High energy, outgoing personality required' },
    ],
    perks: ['Full Red Bull Wings outfit provided', 'Refreshments on site', 'EFT within 48 hours'],
    tags: ['Any gender', 'Afrikaans + English', 'High energy', 'Sampling'],
    mapEmbed: 'V&A Waterfront, Cape Town, 8001',
  },
  'JB-203': {
    id: 'JB-203',
    title: 'In-Store Promoter — Shoprite Durban',
    company: 'FreshBrands Ltd',
    companyInitial: 'F',
    companyColor: '#22C55E',
    companyBio: 'FreshBrands Ltd is a leading FMCG brand management company operating across KwaZulu-Natal and Gauteng. Known for professional in-store executions.',
    location: 'Musgrave Centre, Durban',
    type: 'In-Store',
    status: 'filling fast',
    pay: 'R 700',
    payPer: 'per shift',
    date: 'Monday 24 – Friday 28 March 2026',
    time: '09:00 – 14:00 (5 hours/day)',
    slots: 3,
    slotsLeft: 1,
    duration: '5 hrs/day × 5 days',
    reportTo: 'Supervisor: Zanele Motha',
    dress: 'FreshBrands branded apron over own smart casual (no jeans, no sneakers).',
    briefing: 'In-store briefing Monday morning at 08:45 with the store manager.',
    description: 'FreshBrands is seeking a well-spoken, neat female promoter for a 5-day in-store activation at Shoprite Musgrave. The role involves promoting a new range of cooking sauces, providing tastings, and driving basket purchases. Repeat bookings available for reliable promoters.',
    responsibilities: [
      'Set up and maintain a tidy, branded display at the product stand',
      'Offer product tastings and educate shoppers on the new product range',
      'Process vouchers and assist shoppers with product selection',
      'Report daily sales uplift data to supervisor',
      'Break down display and clean area at end of each shift',
    ],
    requirements: [
      { label: 'Gender',       value: 'Female' },
      { label: 'Age',          value: '22 – 35 years' },
      { label: 'Languages',    value: 'Zulu & English (required)' },
      { label: 'Experience',   value: 'In-store promotions preferred' },
      { label: 'Appearance',   value: 'Neat, well-presented, no visible tattoos' },
      { label: 'Availability', value: 'All 5 days required — no partial booking' },
    ],
    perks: ['Daily meal allowance R50', 'Repeat bookings for reliable promoters', 'EFT weekly'],
    tags: ['Female', 'Zulu + English', 'Neat appearance', 'In-Store'],
    mapEmbed: 'Musgrave Centre, Durban, 4001',
  },
  'JB-204': {
    id: 'JB-204',
    title: 'Event Hostess — Menlyn Fashion Night',
    company: 'Acme Events Corp',
    companyInitial: 'A',
    companyColor: G,
    companyBio: 'Acme Events Corp is a Pretoria-based premium events company specialising in lifestyle, fashion, and corporate activations at tier-one venues across Gauteng.',
    location: 'Menlyn Mall, Pretoria',
    type: 'Events & Hosting',
    status: 'open',
    pay: 'R 1,200',
    payPer: 'per shift',
    date: 'Friday 21 March 2026',
    time: '17:00 – 03:00 (10 hours, including breaks)',
    slots: 8,
    slotsLeft: 3,
    duration: '10 hrs',
    reportTo: 'Event Director: Sipho Mhlongo',
    dress: 'Smart evening wear provided by Acme. Nude heels (3cm+ own). Hair: elegant updo or sleek.',
    briefing: 'Full call-sheet and briefing document emailed 48hrs before. Arrive at staff entrance by 16:30.',
    description: "Acme Events Corp is hosting Pretoria's most anticipated fashion evening at Menlyn Mall. We require elegant, well-spoken event hostesses to welcome VIP guests, manage registration, guide guests to their seats, and ensure a world-class guest experience throughout the evening. This is a high-profile event with opportunities for repeat bookings.",
    responsibilities: [
      'Welcome and register VIP guests at the main entrance',
      'Guide guests to seating areas and manage VIP section access',
      'Assist with gift bag distribution and sponsor activations',
      'Maintain composure and elegance throughout a 10-hour event',
      'Work closely with event director and follow call-sheet timings',
    ],
    requirements: [
      { label: 'Gender',       value: 'Female' },
      { label: 'Age',          value: '21 – 30 years' },
      { label: 'Height',       value: '1.70m minimum' },
      { label: 'Languages',    value: 'English (fluent), Afrikaans (beneficial)' },
      { label: 'Experience',   value: 'Events hosting or hospitality preferred' },
      { label: 'Presentation', value: 'Flawless grooming and elegant bearing required' },
    ],
    perks: ['Evening outfit provided by Acme', 'Dinner provided', 'Premium rate R1,200 flat', 'Strong repeat-booking record'],
    tags: ['Female', '1.70m+', 'Smart evening wear provided', 'Events & Hosting'],
    mapEmbed: 'Menlyn Mall, Pretoria, 0181',
  },
};

/* ── STATUS BADGE ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    'open':         { color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    'filling fast': { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    'closed':       { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  };
  const s = map[status] || map['open'];
  return (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: s.color, background: s.bg, padding: '4px 12px', borderRadius: 2 }}>{status}</span>
  );
}

/* ── APPLY MODAL ── */
function ApplyModal({ job, role, onClose }: { job: any; role: string; onClose: () => void }) {
  const [step, setStep]       = useState<'form'|'success'>('form');
  const [form, setForm]       = useState({ name: '', phone: '', message: '' });
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
            <p style={{ fontSize: 13, color: WM, lineHeight: 1.7 }}>Your application for <strong style={{ color: W }}>{job.title}</strong> has been submitted. You'll receive an SMS confirmation shortly. The client will confirm your slot within 24 hours.</p>
            <button onClick={onClose} style={{ marginTop: 28, padding: '12px 36px', background: G, border: 'none', color: B, fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>Close</button>
          </div>
        ) : !canApply ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 20 }}>🔒</div>
            <h3 style={{ fontFamily: FD, fontSize: 24, fontWeight: 700, color: W, marginBottom: 14 }}>Promoters Only</h3>
            <p style={{ fontSize: 13, color: WM, lineHeight: 1.7 }}>Only registered promoters can apply for jobs. Business accounts are used to post jobs, not apply for them.</p>
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
                  onFocus={e => e.currentTarget.style.borderColor = G} onBlur={e => e.currentTarget.style.borderColor = BB}
                />
              </div>
            ))}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: WM, display: 'block', marginBottom: 7 }}>Note to Client (optional)</label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="Tell the client why you're the right fit..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BB}`, padding: '12px 14px', color: W, fontFamily: FB, fontSize: 13, resize: 'none', outline: 'none' }}
                onFocus={e => e.currentTarget.style.borderColor = G} onBlur={e => e.currentTarget.style.borderColor = BB}
              />
            </div>
            <button onClick={submit}
              style={{ width: '100%', padding: '15px', background: G, border: 'none', color: B, fontFamily: FB, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = GL}
              onMouseLeave={e => e.currentTarget.style.background = G}
            >Submit Application</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── JOB DETAIL PAGE ── */
export default function JobDetailPage() {
  const navigate    = useNavigate();
  const { jobId }   = useParams<{ jobId: string }>();
  const [applyOpen, setApplyOpen] = useState(false);

  /* In a real app this would come from an API + auth context */
  const role = (localStorage.getItem('hg_session') ? JSON.parse(localStorage.getItem('hg_session')!).role : 'promoter') as string;

  const job = JOBS_DB[jobId || ''];

  /* filled slots */
  const filled = job ? job.slots - job.slotsLeft : 0;
  const pct    = job ? Math.round((filled / job.slots) * 100) : 0;
  const almostFull = job && job.slotsLeft <= 2;

  if (!job) {
    return (
      <div style={{ minHeight: '100vh', background: B, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FB, color: WM, flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 48 }}>◎</div>
        <div style={{ fontFamily: FD, fontSize: 28, color: W }}>Job Not Found</div>
        <button onClick={() => navigate(-1)} style={{ padding: '12px 32px', background: G, border: 'none', color: B, fontFamily: FB, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>← Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: B, fontFamily: FB, color: W }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:${B};}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:${G};}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── TOP NAV BAR ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,8,0.96)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BB}`, padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: WM, fontFamily: FB, fontSize: 12, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = W} onMouseLeave={e => e.currentTarget.style.color = WM}
        >← Back to Jobs</button>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700 }}>
          <span style={{ color: G }}>HONEY</span><span style={{ color: W }}> GROUP</span>
        </div>
        <StatusBadge status={job.status} />
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 48px', animation: 'fadeIn 0.35s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div>
            {/* HERO HEADER */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '40px 40px 36px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: job.companyColor }} />
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 80% at 100% 50%, ${job.companyColor}0A 0%, transparent 60%)` }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${job.companyColor}1A`, border: `1px solid ${job.companyColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: job.companyColor, fontFamily: FD }}>
                    {job.companyInitial}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: job.companyColor, fontWeight: 600 }}>{job.company}</div>
                    <div style={{ fontSize: 10, color: WD, marginTop: 2, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{job.type}</div>
                  </div>
                </div>
                <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W, lineHeight: 1.2, marginBottom: 20 }}>{job.title}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {job.tags.map((tag: string, i: number) => (
                    <span key={i} style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: WD, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BB}`, padding: '4px 12px', borderRadius: 2 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* KEY DETAILS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: BB, border: `1px solid ${BB}`, marginBottom: 24 }}>
              {[
                { label: 'Pay Rate',  value: job.pay,      sub: job.payPer,  color: G },
                { label: 'Date',      value: job.date,     sub: job.time,    color: W },
                { label: 'Duration',  value: job.duration, sub: job.type,    color: W },
              ].map((item, i) => (
                <div key={i} style={{ background: BC, padding: '20px 24px' }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: WD, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: i === 0 ? FD : FB }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: WM, marginTop: 3 }}>{item.sub}</div>
                </div>
              ))}
            </div>

            {/* LOCATION + REPORT TO */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '24px 28px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 16, fontWeight: 700 }}>Logistics</div>
              {[
                { icon: '◎', label: 'Location',   value: job.location },
                { icon: '◈', label: 'Report To',  value: job.reportTo },
                { icon: '◉', label: 'Briefing',   value: job.briefing },
                { icon: '✧', label: 'Dress Code', value: job.dress },
              ].map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 90px 1fr', gap: 12, padding: '12px 0', borderBottom: i < 3 ? `1px solid ${BB}` : 'none', alignItems: 'flex-start' }}>
                  <span style={{ color: G, fontSize: 13 }}>{row.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: WD }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: WM, lineHeight: 1.5 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* DESCRIPTION */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 16, fontWeight: 700 }}>About This Job</div>
              <p style={{ fontSize: 14, color: WM, lineHeight: 1.85 }}>{job.description}</p>
            </div>

            {/* RESPONSIBILITIES */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 20, fontWeight: 700 }}>What You'll Do</div>
              <ul style={{ listStyle: 'none' }}>
                {job.responsibilities.map((r: string, i: number) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: G, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: WM, lineHeight: 1.6 }}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* REQUIREMENTS TABLE */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px', marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 20, fontWeight: 700 }}>Requirements</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {job.requirements.map((req: any, i: number) => (
                    <tr key={i} style={{ borderBottom: i < job.requirements.length - 1 ? `1px solid ${BB}` : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
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
                {job.perks.map((perk: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: `${G}10`, border: `1px solid ${G}28`, borderRadius: 2 }}>
                    <span style={{ color: G, fontSize: 12 }}>✦</span>
                    <span style={{ fontSize: 13, color: W }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* APPLY CARD */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: G }} />
              <div style={{ fontFamily: FD, fontSize: 32, fontWeight: 700, color: G, marginBottom: 4 }}>{job.pay}</div>
              <div style={{ fontSize: 12, color: WM, marginBottom: 20 }}>{job.payPer} · {job.duration}</div>

              {/* slots */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: WD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Slots Available</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: almostFull ? '#EF4444' : '#22C55E' }}>{job.slotsLeft} of {job.slots} left</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: almostFull ? '#EF4444' : G, borderRadius: 2, transition: 'width 0.5s' }} />
                </div>
                {almostFull && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 8, fontWeight: 600 }}>⚡ Almost full — apply quickly</div>}
              </div>

              <button onClick={() => setApplyOpen(true)}
                style={{ width: '100%', padding: '16px', background: G, border: 'none', color: B, fontFamily: FB, fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 12, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = GL}
                onMouseLeave={e => e.currentTarget.style.background = G}
              >Apply for This Job</button>
              <button onClick={() => navigate(-1)}
                style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = WM; e.currentTarget.style.color = W; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = WM; }}
              >← Back to Jobs</button>
            </div>

            {/* COMPANY CARD */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G, marginBottom: 16, fontWeight: 700 }}>About the Client</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${job.companyColor}1A`, border: `1px solid ${job.companyColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: job.companyColor, fontFamily: FD, flexShrink: 0 }}>
                  {job.companyInitial}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: W }}>{job.company}</div>
              </div>
              <p style={{ fontSize: 12, color: WM, lineHeight: 1.7 }}>{job.companyBio}</p>
            </div>

            {/* JOB ID */}
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: WD, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Job Reference</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: G, fontFamily: 'monospace' }}>{job.id}</span>
            </div>
          </div>
        </div>
      </div>

      {applyOpen && <ApplyModal job={job} role={role} onClose={() => setApplyOpen(false)} />}
    </div>
  );
}