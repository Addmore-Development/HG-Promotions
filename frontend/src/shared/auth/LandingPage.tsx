import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_JOBS, getActiveJobs } from '../jobs/JobsPage';

const BLACK        = '#080808';
const BLACK_SOFT   = '#111111';
const BLACK_CARD   = '#161616';
const BLACK_BORDER = 'rgba(255,255,255,0.07)';
const GOLD         = '#C4973A';
const GOLD_LIGHT   = '#DDB55A';
const GOLD_MUTED   = 'rgba(196,151,58,0.08)';
const WHITE        = '#F4EFE6';
const WHITE_MUTED  = 'rgba(244,239,230,0.55)';
const WHITE_DIM    = 'rgba(244,239,230,0.22)';
const FD           = "'Playfair Display', Georgia, serif";
const FB           = "'DM Sans', system-ui, sans-serif";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { -webkit-font-smoothing: antialiased; background: ${BLACK}; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: ${GOLD}; }
  .hg-reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .hg-reveal.hg-visible { opacity: 1; transform: translateY(0); }
  @keyframes hg-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(196,151,58,0.45); } 50% { box-shadow: 0 0 0 14px rgba(196,151,58,0); } }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
`;

function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('hg-visible'); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function JobCard({ job, isLoggedIn, onLock, onView }: {
  job: ReturnType<typeof getActiveJobs>[0];
  isLoggedIn: boolean;
  onLock: () => void;
  onView: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const filled = job.slots - job.slotsLeft;
  const pct = Math.round((filled / job.slots) * 100);
  const almostFull = job.slotsLeft <= 2;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', background: BLACK_CARD, border: `1px solid ${hovered ? job.accentLine + '44' : BLACK_BORDER}`,
        overflow: 'hidden', transition: 'all 0.35s ease', cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px ${job.accentLine}22` : 'none',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: job.gradient, opacity: hovered ? 1 : 0.6, transition: 'opacity 0.35s' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: job.accentLine }} />

      <div style={{ position: 'relative', padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${job.companyColor}22`, border: `1px solid ${job.companyColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: job.companyColor, flexShrink: 0, fontFamily: FD }}>
              {job.companyInitial}
            </div>
            <div>
              <div style={{ fontSize: 11, color: job.companyColor, fontWeight: 600, letterSpacing: '0.06em' }}>{job.company}</div>
              <div style={{ fontSize: 10, color: WHITE_DIM, marginTop: 2, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{job.type}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color: GOLD, lineHeight: 1 }}>{job.pay}</div>
            <div style={{ fontSize: 10, color: WHITE_DIM, marginTop: 3 }}>{job.payPer}</div>
          </div>
        </div>

        <h3 style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: WHITE, lineHeight: 1.25, marginBottom: 14 }}>{job.title}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {[
            { icon: '◎', text: job.location },
            { icon: '◈', text: job.date },
            { icon: '◉', text: `${job.duration} · ${job.slots} promoters needed` },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: GOLD, flexShrink: 0 }}>{m.icon}</span>
              <span style={{ fontSize: 12, color: WHITE_MUTED }}>{m.text}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {job.tags.map((tag, i) => (
            <span key={i} style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: WHITE_DIM, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BLACK_BORDER}`, padding: '3px 10px', borderRadius: 2 }}>{tag}</span>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: WHITE_DIM, letterSpacing: '0.1em' }}>SLOTS FILLED</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: almostFull ? '#EF4444' : '#22C55E' }}>{job.slotsLeft} left</span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: almostFull ? '#EF4444' : job.accentLine, borderRadius: 2, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {isLoggedIn ? (
          <button
            onClick={() => onView(job.id)}
            style={{
              width: '100%', padding: '13px', border: `1px solid ${job.accentLine}66`,
              background: hovered ? `${job.accentLine}28` : `${job.accentLine}14`,
              color: job.accentLine, fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            View Full Details →
          </button>
        ) : (
          <button
            onClick={onLock}
            style={{
              width: '100%', padding: '13px', border: `1px solid ${job.accentLine}66`,
              background: hovered ? `${job.accentLine}18` : 'transparent',
              color: hovered ? job.accentLine : WHITE_MUTED, fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em',
              textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 13 }}>🔒</span> View Full Details — Login Required
          </button>
        )}
      </div>
    </div>
  );
}

function LoginPromptModal({ onClose, onLogin, onRegister }: { onClose: () => void; onLogin: () => void; onRegister: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`, padding: '52px 48px', maxWidth: 420, width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: GOLD }} />
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${GOLD}14`, border: `1px solid ${GOLD}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28, animation: 'float 3s ease-in-out infinite' }}>🔒</div>
        <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>Members Only</div>
        <h2 style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: WHITE, marginBottom: 14, lineHeight: 1.2 }}>Unlock Job Details</h2>
        <p style={{ fontSize: 14, color: WHITE_MUTED, lineHeight: 1.7, marginBottom: 36 }}>
          Create a free account or log in to view full job details, requirements, and apply for promoter positions.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onRegister}
            style={{ width: '100%', padding: '15px', background: GOLD, border: 'none', color: BLACK, fontFamily: FB, fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)'; }}
          >Create Free Account</button>
          <button onClick={onLogin}
            style={{ width: '100%', padding: '15px', background: 'transparent', border: `1px solid ${BLACK_BORDER}`, color: WHITE_MUTED, fontFamily: FB, fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BLACK_BORDER; e.currentTarget.style.color = WHITE_MUTED; }}
          >I Already Have an Account</button>
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: WHITE_DIM, fontSize: 18 }}>✕</button>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled]           = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showLoginPrompt, setLoginPrompt] = useState(false);

  const [session, setSession] = useState<{ role: string; name: string; email: string } | null>(null);
  useEffect(() => {
    const s = localStorage.getItem('hg_session');
    if (s) { try { setSession(JSON.parse(s)); } catch { /* ignore */ } }
  }, []);

  // Get the 4 newest approved active jobs — these are what appear on the landing page
  const previewJobs = getActiveJobs(ALL_JOBS).slice(0, 4);
  const totalActiveJobs = getActiveJobs(ALL_JOBS).length;

  const handleLogout = () => { localStorage.removeItem('hg_session'); setSession(null); };
  const handleDashboard = () => {
    if (!session) return;
    const map: Record<string, string> = { admin: '/admin', business: '/business/dashboard', promoter: '/promoter/' };
    navigate(map[session.role] || '/');
  };

  const rFeatures = useReveal();
  const rJobs     = useReveal();
  const rCaps     = useReveal();
  const rRoles    = useReveal();
  const rCta      = useReveal();

  const secFeatures = useRef<HTMLElement>(null);
  const secJobs     = useRef<HTMLElement>(null);
  const secCaps     = useRef<HTMLElement>(null);
  const secRoles    = useRef<HTMLElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLElement>) => { ref.current?.scrollIntoView({ behavior: 'smooth' }); };

  const features = [
    { tag: 'Smart Dispatch',      icon: '◎', title: 'Right person.\nRight place.\nEvery time.',  body: 'AI-powered matching filters promoters by location, reliability score, and physical attributes — filling your brand activations with precision.' },
    { tag: 'Geo-Verified Shifts', icon: '⬡', title: 'Attendance you\ncan trust.',                body: 'Promoters check in only when within 200m of the venue. GPS verification plus mandatory selfie — no proxy clock-ins, ever.' },
    { tag: 'Automated Payroll',   icon: '◈', title: 'Pay your team\nin minutes.',                body: 'Hours × Rate minus deductions, calculated instantly. Bulk-approve and export to Paystack for same-day EFT across South Africa.' },
  ];

  const caps = [
    'Promoter Onboarding', 'Geo Check-In / Out',   'Live Operations Map',
    'Smart Job Allocation', 'Automated Payroll',    'Document Vault',
    'Supervisor Monitoring','Client Reports',        'SMS Notifications',
    'Reliability Scoring',  'Bulk EFT Export',      'POPIA Compliance',
  ];

  const roles = [
    { role: 'Promoter',   icon: '◉', color: '#3A7BD5', perks: ['View & accept jobs', 'Geo check-in / out', 'Real-time earnings', 'Document vault'] },
    { role: 'Supervisor', icon: '◈', color: GOLD,      perks: ['Monitor attendance live', 'Traffic-light status', 'Flag issues instantly', 'View team profiles'] },
    { role: 'Admin',      icon: '◆', color: '#8B5CF6', perks: ['Full CRUD users & jobs', 'Approve payroll & export', 'Live operations map', 'Generate PDF reports'] },
  ];

  return (
    <div style={{ fontFamily: FB, background: BLACK, color: WHITE, overflowX: 'hidden', width: '100%' }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, padding: scrolled ? '14px 80px' : '26px 80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(8,8,8,0.96)' : 'transparent', backdropFilter: scrolled ? 'blur(24px)' : 'none', borderBottom: scrolled ? `1px solid ${BLACK_BORDER}` : 'none', transition: 'all 0.4s ease' }}>
        <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span style={{ color: GOLD }}>HONEY</span><span style={{ color: WHITE }}> GROUP</span>
        </div>

        <ul style={{ display: 'flex', gap: 44, listStyle: 'none' }}>
          {[
            { label: 'Features', ref: secFeatures },
            { label: 'Jobs',     ref: secJobs     },
            { label: 'About',    ref: secRoles    },
          ].map(({ label, ref }) => (
            <li key={label}>
              <button
                onClick={() => scrollTo(ref)}
                style={{ fontFamily: FB, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: WHITE_MUTED, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.25s', padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = GOLD}
                onMouseLeave={e => e.currentTarget.style.color = WHITE_MUTED}
              >{label}</button>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {session ? (
            <>
              <button onClick={handleDashboard}
                style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', background: GOLD, border: 'none', color: BLACK, padding: '10px 24px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT; }}
                onMouseLeave={e => { e.currentTarget.style.background = GOLD; }}
              >My Dashboard</button>
              <button onClick={handleLogout}
                style={{ fontFamily: FB, fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${WHITE_DIM}`, color: WHITE_MUTED, padding: '10px 20px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = WHITE_DIM; e.currentTarget.style.color = WHITE_MUTED; }}
              >Log Out</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')}
                style={{ fontFamily: FB, fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${WHITE_DIM}`, color: WHITE, padding: '10px 26px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = WHITE_DIM; e.currentTarget.style.color = WHITE; }}
              >Log In</button>
              <button onClick={() => navigate('/register')}
                style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', background: GOLD, border: 'none', color: BLACK, padding: '10px 28px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)'; }}
              >Register</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', width: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 90% 70% at 65% 35%, rgba(196,151,58,0.07) 0%, transparent 65%), ${BLACK}` }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: `linear-gradient(${GOLD} 1px, transparent 1px), linear-gradient(90deg, ${GOLD} 1px, transparent 1px)`, backgroundSize: '72px 72px' }} />
        <div style={{ position: 'absolute', right: -200, top: '50%', transform: 'translateY(-50%)', width: 760, height: 760, borderRadius: '50%', border: '1px solid rgba(196,151,58,0.07)' }}>
          <div style={{ position: 'absolute', inset: 80, borderRadius: '50%', border: '1px solid rgba(196,151,58,0.05)' }}>
            <div style={{ position: 'absolute', inset: 80, borderRadius: '50%', border: '1px solid rgba(196,151,58,0.03)' }} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: '18%', right: '30%', width: 1, height: 200, background: `linear-gradient(to bottom, transparent, ${GOLD}, transparent)`, opacity: 0.28 }} />

        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1360, margin: '0 auto', padding: '0 80px', paddingTop: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.42em', textTransform: 'uppercase', color: GOLD, marginBottom: 28 }}>
            <div style={{ width: 44, height: 1, background: GOLD }} />
            National Promoter Management Platform
            <div style={{ width: 44, height: 1, background: GOLD }} />
          </div>
          <h1 style={{ fontFamily: FD, fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', marginBottom: 28 }}>
            <span style={{ color: WHITE }}>We put </span>
            <span style={{ color: GOLD, fontStyle: 'italic' }}>promoters </span>
            <span style={{ color: WHITE }}>centre stage.</span>
          </h1>
          <p style={{ fontFamily: FB, fontSize: 16, fontWeight: 300, lineHeight: 1.8, color: WHITE_MUTED, maxWidth: 520, marginBottom: 48 }}>
            Honey Group manages 280+ brand promoters across South Africa — now fully digital. From onboarding to geo-verified shifts to automated payroll.
          </p>

          <div style={{ display: 'flex', gap: 16 }}>
            {session ? (
              <>
                <button onClick={handleDashboard}
                  style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', background: GOLD, color: BLACK, border: 'none', padding: '18px 52px', cursor: 'pointer', transition: 'all 0.3s', animation: 'hg-pulse 3s 2s infinite' }}
                  onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(196,151,58,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >Go to Dashboard</button>
                <button onClick={() => navigate('/jobs')}
                  style={{ fontFamily: FB, fontSize: 12, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'transparent', color: WHITE_MUTED, border: `1px solid ${WHITE_DIM}`, padding: '18px 40px', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = WHITE_DIM; e.currentTarget.style.color = WHITE_MUTED; }}
                >Browse All Jobs ↓</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/register')}
                  style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', background: GOLD, color: BLACK, border: 'none', padding: '18px 52px', cursor: 'pointer', transition: 'all 0.3s', animation: 'hg-pulse 3s 2s infinite' }}
                  onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(196,151,58,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >Join as a Promoter</button>
                <button onClick={() => navigate('/jobs')}
                  style={{ fontFamily: FB, fontSize: 12, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'transparent', color: WHITE_MUTED, border: `1px solid ${WHITE_DIM}`, padding: '18px 40px', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = WHITE_DIM; e.currentTarget.style.color = WHITE_MUTED; }}
                >Browse All Jobs ↓</button>
              </>
            )}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: WHITE_DIM, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: FB }}>
          <div style={{ width: 1, height: 52, background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
          Scroll
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={(el) => { (rFeatures as any).current = el; (secFeatures as any).current = el; }} className="hg-reveal" style={{ padding: '120px 0' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto 64px', padding: '0 80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>Platform Capabilities</div>
            <h2 style={{ fontFamily: FD, fontSize: 'clamp(34px,5vw,60px)', fontWeight: 900, lineHeight: 1.05, textDecoration: 'line-through', textDecorationColor: GOLD, textDecorationThickness: '3px' }}>our features</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {features.map((_, i) => <button key={i} onClick={() => setActiveFeature(i)} style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer', background: activeFeature === i ? GOLD : WHITE_DIM, transition: 'all 0.3s' }} />)}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', maxWidth: 1360, margin: '0 auto', padding: '0 80px', gap: 1 }}>
          {features.map((f, i) => (
            <div key={i} onClick={() => setActiveFeature(i)} style={{ padding: '64px 48px', background: activeFeature === i ? GOLD : BLACK_CARD, border: `1px solid ${BLACK_BORDER}`, cursor: 'pointer', transition: 'all 0.4s ease' }}>
              <div style={{ fontFamily: FD, fontSize: 40, marginBottom: 24, color: activeFeature === i ? BLACK : GOLD }}>{f.icon}</div>
              <div style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: activeFeature === i ? 'rgba(0,0,0,0.5)' : GOLD, marginBottom: 20 }}>{f.tag}</div>
              <h3 style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, lineHeight: 1.15, whiteSpace: 'pre-line', color: activeFeature === i ? BLACK : WHITE, marginBottom: 20 }}>{f.title}</h3>
              <p style={{ fontFamily: FB, fontSize: 14, lineHeight: 1.8, color: activeFeature === i ? 'rgba(0,0,0,0.65)' : WHITE_MUTED }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── JOBS PREVIEW SECTION ── */}
      <section ref={(el) => { (rJobs as any).current = el; (secJobs as any).current = el; }} className="hg-reveal" style={{ padding: '100px 80px', background: BLACK_SOFT, borderTop: `1px solid ${BLACK_BORDER}`, borderBottom: `1px solid ${BLACK_BORDER}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56 }}>
            <div>
              <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>Current Opportunities</div>
              <h2 style={{ fontFamily: FD, fontSize: 'clamp(34px,5vw,60px)', fontWeight: 900, lineHeight: 1 }}>Live Jobs</h2>
              <p style={{ fontFamily: FB, fontSize: 15, color: WHITE_MUTED, marginTop: 14, maxWidth: 480, lineHeight: 1.7 }}>
                Showing the <strong style={{ color: WHITE }}>4 newest approved jobs</strong> — sorted by approval date, newest first. Jobs are automatically removed after their event date.
                {!session && <> <span style={{ color: GOLD, fontStyle: 'italic' }}>Login or register</span> to apply.</>}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              {!session ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px', background: `${GOLD}10`, border: `1px solid ${GOLD}33`, borderRadius: 2 }}>
                  <span style={{ fontSize: 16 }}>🔒</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD }}>Members only</div>
                    <div style={{ fontSize: 11, color: WHITE_DIM, marginTop: 2 }}>Login to apply</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px', background: 'rgba(34,197,94,0.08)', border: `1px solid rgba(34,197,94,0.3)`, borderRadius: 2 }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#22C55E' }}>Logged In</div>
                    <div style={{ fontSize: 11, color: WHITE_DIM, marginTop: 2 }}>{session.name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── TOP 4 NEWEST APPROVED JOBS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {previewJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isLoggedIn={!!session}
                onLock={() => setLoginPrompt(true)}
                onView={(id) => navigate(`/jobs/${id}`)}
              />
            ))}
          </div>

          {/* ── VIEW ALL CTA ── */}
          <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
            <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
            <p style={{ fontSize: 13, color: WHITE_DIM }}>
              Showing 4 of <strong style={{ color: WHITE }}>{totalActiveJobs} active jobs</strong> this week
            </p>
            {/* ✅ FIX: Always navigate to /jobs regardless of login state */}
            <button
              onClick={() => navigate('/jobs')}
              style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${GOLD}44`, color: GOLD, padding: '12px 36px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}14`; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${GOLD}44`; }}
            >
              View All {totalActiveJobs} Jobs →
            </button>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section ref={(el) => { (rCaps as any).current = el; (secCaps as any).current = el; }} className="hg-reveal" style={{ background: BLACK, padding: '100px 80px', borderBottom: `1px solid ${BLACK_BORDER}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>What We Offer</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(34px,5vw,60px)', fontWeight: 900, marginBottom: 60, textDecoration: 'line-through', textDecorationColor: GOLD, textDecorationThickness: '3px' }}>Capabilities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `1px solid ${BLACK_BORDER}` }}>
            {caps.map((cap, i) => (
              <div key={i}
                style={{ padding: '26px 28px', borderRight: i % 4 < 3 ? `1px solid ${BLACK_BORDER}` : 'none', borderBottom: i < 8 ? `1px solid ${BLACK_BORDER}` : 'none', background: BLACK, display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.background = GOLD_MUTED}
                onMouseLeave={e => e.currentTarget.style.background = BLACK}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                <span style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED }}>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section ref={(el) => { (rRoles as any).current = el; (secRoles as any).current = el; }} className="hg-reveal" style={{ padding: '120px 80px' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>Built for Everyone</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(34px,5vw,60px)', fontWeight: 900, marginBottom: 60 }}>Three roles.<br /><span style={{ color: GOLD, fontStyle: 'italic' }}>One platform.</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {roles.map((r, i) => (
              <div key={i}
                style={{ background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`, padding: '48px 40px', position: 'relative', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: r.color }} />
                <div style={{ fontFamily: FD, fontSize: 38, color: r.color, marginBottom: 20 }}>{r.icon}</div>
                <h3 style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, marginBottom: 28, color: WHITE }}>{r.role}</h3>
                <ul style={{ listStyle: 'none' }}>
                  {r.perks.map((p, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 5, height: 5, background: r.color, borderRadius: '50%', flexShrink: 0 }} />
                      <span style={{ fontFamily: FB, fontSize: 14, color: WHITE_MUTED }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section ref={rCta} className="hg-reveal" style={{ background: GOLD, padding: '110px 80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.06) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)', marginBottom: 24 }}>Ready to Scale?</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(38px,6vw,80px)', fontWeight: 900, color: BLACK, lineHeight: 1, marginBottom: 44 }}>Join the platform<br /><span style={{ fontStyle: 'italic' }}>powering SA promotions.</span></h2>
          {session ? (
            <button onClick={handleDashboard}
              style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', background: BLACK, color: GOLD, border: 'none', padding: '20px 56px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = BLACK; e.currentTarget.style.transform = 'translateY(0)'; }}
            >Go to Dashboard</button>
          ) : (
            <button onClick={() => navigate('/register')}
              style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', background: BLACK, color: GOLD, border: 'none', padding: '20px 56px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = BLACK; e.currentTarget.style.transform = 'translateY(0)'; }}
            >Register Now</button>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: BLACK, borderTop: `1px solid ${BLACK_BORDER}`, padding: '64px 80px 40px' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 52 }}>
            <div>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, marginBottom: 14 }}><span style={{ color: GOLD }}>HONEY</span><span style={{ color: WHITE }}> GROUP</span></div>
              <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED, lineHeight: 1.75, maxWidth: 300 }}>South Africa's premier promoter management platform. Fully digital.</p>
            </div>
            <div style={{ display: 'flex', gap: 64 }}>
              {[{ label: 'Platform', links: ['Features', 'Pricing', 'Security'] }, { label: 'Company', links: ['About', 'Careers', 'Contact'] }].map(col => (
                <div key={col.label}>
                  <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 22 }}>{col.label}</div>
                  {col.links.map(l => (
                    <div key={l} style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED, marginBottom: 12, cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = WHITE}
                      onMouseLeave={e => e.currentTarget.style.color = WHITE_MUTED}
                    >{l}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${BLACK_BORDER}`, paddingTop: 28, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: FB, fontSize: 11, color: WHITE_DIM }}>© 2026 Honey Group Promotions. All rights reserved.</span>
            <span style={{ fontFamily: FB, fontSize: 11, color: WHITE_DIM }}>POPIA Compliant · South Africa</span>
          </div>
        </div>
      </footer>

      {showLoginPrompt && <LoginPromptModal onClose={() => setLoginPrompt(false)} onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />}
    </div>
  );
}