import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_JOBS, getActiveJobs } from '../jobs/JobsPage';

// ── Color tokens ─────────────────────────────────────────────────────────────
const BLACK        = '#0A0A0A';
const DARK_1       = '#141414';
const DARK_2       = '#1C1C1C';
const DARK_3       = '#242424';
const GREY_BORDER  = 'rgba(255,255,255,0.09)';
const GREY_MID     = '#2E2E2E';
const GREY_LIGHT   = '#3A3A3A';

const BRONZE       = '#C4973A';
const BRONZE_LIGHT = '#D4A84A';
const BRONZE_MUTED = 'rgba(196,151,58,0.10)';
const BRONZE_DIM   = 'rgba(196,151,58,0.35)';

const WHITE        = '#F5F0E8';
const WHITE_85     = 'rgba(245,240,232,0.85)';
const WHITE_55     = 'rgba(245,240,232,0.55)';
const WHITE_28     = 'rgba(245,240,232,0.28)';
const WHITE_12     = 'rgba(245,240,232,0.12)';

const FD = "'Playfair Display', Georgia, serif";
const FB = "'DM Sans', system-ui, sans-serif";

// ── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { -webkit-font-smoothing: antialiased; background: ${BLACK}; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: ${DARK_1}; }
  ::-webkit-scrollbar-thumb { background: ${BRONZE}; }

  .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }

  @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(196,151,58,0.5)} 50%{box-shadow:0 0 0 16px rgba(196,151,58,0)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes shimmer-line { 0%{opacity:0;transform:scaleX(0)} 100%{opacity:1;transform:scaleX(1)} }
  @keyframes hero-fade { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }

  .nav-link { color: ${WHITE_55}; background: none; border: none; cursor: pointer; font-family: ${FB}; font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; padding: 0; transition: color 0.25s; }
  .nav-link:hover { color: ${BRONZE}; }

  .ticker-wrap { overflow: hidden; border-top: 1px solid ${GREY_BORDER}; border-bottom: 1px solid ${GREY_BORDER}; background: ${DARK_1}; }
  .ticker-inner { display: flex; white-space: nowrap; animation: ticker 28s linear infinite; }
  .ticker-item { padding: 0 56px; font-size: 10px; font-weight: 600; letter-spacing: 0.35em; text-transform: uppercase; color: ${WHITE_28}; display: flex; align-items: center; gap: 24px; height: 42px; }
  .ticker-item span { color: ${BRONZE}; font-size: 8px; }
`;

// ── Hook: reveal on scroll ────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── JobCard ───────────────────────────────────────────────────────────────────
function JobCard({ job, isLoggedIn, onLock, onView }: {
  job: ReturnType<typeof getActiveJobs>[0];
  isLoggedIn: boolean;
  onLock: () => void;
  onView: (id: string) => void;
}) {
  const [hov, setHov] = useState(false);
  const filled = job.slots - job.slotsLeft;
  const pct = Math.round((filled / job.slots) * 100);
  const almostFull = job.slotsLeft <= 2;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', background: DARK_2, border: `1px solid ${hov ? GREY_MID : GREY_BORDER}`,
        overflow: 'hidden', transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)', cursor: 'pointer',
        transform: hov ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hov ? '0 24px 56px rgba(0,0,0,0.6)' : 'none',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: job.accentLine }} />
      <div style={{ position: 'absolute', inset: 0, background: job.gradient, opacity: hov ? 0.7 : 0.4, transition: 'opacity 0.35s' }} />

      <div style={{ position: 'relative', padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${job.companyColor}18`, border: `1px solid ${job.companyColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: job.companyColor, flexShrink: 0, fontFamily: FD }}>
              {job.companyInitial}
            </div>
            <div>
              <div style={{ fontSize: 11, color: job.companyColor, fontWeight: 600, letterSpacing: '0.06em' }}>{job.company}</div>
              <div style={{ fontSize: 10, color: WHITE_28, marginTop: 2, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{job.type}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color: BRONZE, lineHeight: 1 }}>{job.pay}</div>
            <div style={{ fontSize: 10, color: WHITE_28, marginTop: 3 }}>{job.payPer}</div>
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
              <span style={{ fontSize: 11, color: BRONZE, flexShrink: 0 }}>{m.icon}</span>
              <span style={{ fontSize: 12, color: WHITE_55 }}>{m.text}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {job.tags.map((tag: string, i: number) => (
            <span key={i} style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: WHITE_28, background: WHITE_12, border: `1px solid ${GREY_BORDER}`, padding: '3px 10px' }}>
              {tag}
            </span>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: WHITE_28, letterSpacing: '0.1em' }}>SLOTS FILLED</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: almostFull ? '#C8956A' : '#8FA89A' }}>{job.slotsLeft} left</span>
          </div>
          <div style={{ height: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: almostFull ? '#C8956A' : job.accentLine, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {isLoggedIn ? (
          <button onClick={() => onView(job.id)} style={{
            width: '100%', padding: '13px', border: `1px solid ${job.accentLine}55`,
            background: hov ? `${job.accentLine}22` : 'transparent',
            color: job.accentLine, fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s',
          }}>View Full Details →</button>
        ) : (
          <button onClick={onLock} style={{
            width: '100%', padding: '13px', border: `1px solid ${GREY_BORDER}`,
            background: hov ? WHITE_12 : 'transparent',
            color: hov ? WHITE_85 : WHITE_55, fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em',
            textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 12 }}>⬡</span> Members Only — Login to Apply
          </button>
        )}
      </div>
    </div>
  );
}

// ── Login Prompt Modal ────────────────────────────────────────────────────────
function LoginPromptModal({ onClose, onLogin, onRegister }: { onClose: () => void; onLogin: () => void; onRegister: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: DARK_2, border: `1px solid ${GREY_BORDER}`, padding: '52px 48px', maxWidth: 420, width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: BRONZE }} />
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: BRONZE_MUTED, border: `1px solid ${BRONZE_DIM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 26, animation: 'float 3s ease-in-out infinite' }}>⬡</div>
        <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: BRONZE, marginBottom: 12 }}>Members Only</div>
        <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, color: WHITE, marginBottom: 14, lineHeight: 1.2 }}>Unlock Job Details</h2>
        <p style={{ fontSize: 13, color: WHITE_55, lineHeight: 1.75, marginBottom: 36 }}>
          Create a free account or sign in to view full job details, requirements, and apply for promoter positions.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onRegister}
            style={{ width: '100%', padding: '15px', background: BRONZE, border: 'none', color: BLACK, fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.background = BRONZE_LIGHT; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = BRONZE; e.currentTarget.style.transform = 'translateY(0)'; }}
          >Create Free Account</button>
          <button onClick={onLogin}
            style={{ width: '100%', padding: '15px', background: 'transparent', border: `1px solid ${GREY_BORDER}`, color: WHITE_55, fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRONZE_DIM; e.currentTarget.style.color = BRONZE; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = GREY_BORDER; e.currentTarget.style.color = WHITE_55; }}
          >Already Have an Account</button>
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: WHITE_28, fontSize: 18 }}>✕</button>
      </div>
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showLoginPrompt, setLoginPrompt] = useState(false);
  const [session, setSession] = useState<{ role: string; name: string; email: string } | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('hg_session');
    if (s) { try { setSession(JSON.parse(s)); } catch {} }
  }, []);

  const previewJobs = getActiveJobs(ALL_JOBS).slice(0, 4);
  const totalActiveJobs = getActiveJobs(ALL_JOBS).length;

  const handleLogout = () => { localStorage.removeItem('hg_session'); setSession(null); };
  const handleDashboard = () => {
    if (!session) return;
    const map: Record<string, string> = { admin: '/admin', business: '/business/dashboard', promoter: '/promoter/' };
    navigate(map[session.role] || '/');
  };

  const secFeatures = useRef<HTMLElement>(null);
  const secJobs     = useRef<HTMLElement>(null);
  const secAbout    = useRef<HTMLElement>(null);

  const rFeatures = useReveal();
  const rJobs     = useReveal();
  const rAbout    = useReveal();
  const rCaps     = useReveal();
  const rCta      = useReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLElement>) => ref.current?.scrollIntoView({ behavior: 'smooth' });

  const features = [
    { tag: 'Smart Dispatch', icon: '◎', title: 'Right person, right place.', body: 'AI-powered matching filters promoters by location, reliability score, and physical attributes — filling your brand activations with precision.' },
    { tag: 'Geo-Verified Shifts', icon: '⬡', title: 'Attendance you can trust.', body: 'Promoters check in only when within 200m of the venue. GPS verification plus mandatory selfie — no proxy clock-ins, ever.' },
    { tag: 'Smart Payroll', icon: '◈', title: 'Calculate pay in minutes.', body: 'Hours × Rate calculations done instantly. View earnings per promoter and per campaign. Admin approves — no direct payments on-platform.' },
  ];

  const caps = [
    'Promoter Onboarding', 'Geo Check-In / Out', 'Live Operations Map',
    'Smart Job Allocation', 'Payroll Calculations', 'Document Vault',
    'Supervisor Monitoring', 'Client Reports', 'SMS Notifications',
    'Reliability Scoring', 'Earnings Export', 'POPIA Compliance',
  ];

  const stats = [
    { value: '280+', label: 'Active Promoters' },
    { value: '12', label: 'Cities Covered' },
    { value: '4.8★', label: 'Avg Promoter Rating' },
    { value: '98%', label: 'Shift Attendance Rate' },
  ];

  const tickerItems = ['Brand Activations', 'In-Store Demos', 'Event Staffing', 'Field Marketing', 'Geo-Verified Shifts', 'Live Payroll Calc', 'Supervisor Monitoring', 'Nationwide Coverage'];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FB, background: BLACK, color: WHITE, overflowX: 'hidden', width: '100%' }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        padding: scrolled ? '14px 80px' : '28px 80px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,10,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(28px)' : 'none',
        borderBottom: scrolled ? `1px solid ${GREY_BORDER}` : 'none',
        transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ fontFamily: FD, fontSize: 19, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span style={{ color: BRONZE }}>HONEY</span><span style={{ color: WHITE }}> GROUP</span>
        </div>

        <ul style={{ display: 'flex', gap: 48, listStyle: 'none' }}>
          {[
            { label: 'Features', ref: secFeatures },
            { label: 'Jobs', ref: secJobs },
            { label: 'About', ref: secAbout },
          ].map(({ label, ref }) => (
            <li key={label}>
              <button className="nav-link" onClick={() => scrollTo(ref)}>{label}</button>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {session ? (
            <>
              <button onClick={handleDashboard}
                style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', background: BRONZE, border: 'none', color: BLACK, padding: '10px 26px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = BRONZE_LIGHT; }}
                onMouseLeave={e => { e.currentTarget.style.background = BRONZE; }}>
                My Dashboard
              </button>
              <button onClick={handleLogout}
                style={{ fontFamily: FB, fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${GREY_BORDER}`, color: WHITE_55, padding: '10px 20px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#8F6060'; e.currentTarget.style.color = '#C89090'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = GREY_BORDER; e.currentTarget.style.color = WHITE_55; }}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')}
                style={{ fontFamily: FB, fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${GREY_BORDER}`, color: WHITE, padding: '10px 26px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BRONZE_DIM; e.currentTarget.style.color = BRONZE; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = GREY_BORDER; e.currentTarget.style.color = WHITE; }}>
                Log In
              </button>
              <button onClick={() => navigate('/register')}
                style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', background: BRONZE, border: 'none', color: BLACK, padding: '10px 28px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = BRONZE_LIGHT; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = BRONZE; e.currentTarget.style.transform = 'translateY(0)'; }}>
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        {/* Background video / image */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {!videoError ? (
            <video
              autoPlay muted loop playsInline
              onError={() => setVideoError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            >
              {/* Operator: replace with actual promo video URL */}
              <source src="/assets/hero-reel.mp4" type="video/mp4" />
            </video>
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, #1A1410 0%, #0A0A0A 50%, #131008 100%)` }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse at 60% 40%, rgba(196,151,58,0.12) 0%, transparent 60%)` }} />
              <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: `linear-gradient(${BRONZE} 1px, transparent 1px), linear-gradient(90deg, ${BRONZE} 1px, transparent 1px)`, backgroundSize: '64px 64px' }} />
            </div>
          )}
          {/* Multi-layer overlay like G7 */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.7) 30%, rgba(10,10,10,0.25) 60%, rgba(10,10,10,0.5) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.2) 55%, transparent 100%)' }} />
        </div>

        {/* Left-anchored hero content — G7 style */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1360, margin: '0 auto', padding: '0 80px 120px', display: 'grid', gridTemplateColumns: '1fr 0.45fr', gap: 80, alignItems: 'flex-end' }}>
          {/* Left: text */}
          <div style={{ animation: 'hero-fade 1s 0.2s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 36, height: 1, background: BRONZE }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.42em', textTransform: 'uppercase', color: BRONZE }}>National Promoter Platform</span>
            </div>

            <h1 style={{ fontFamily: FD, fontSize: 'clamp(38px, 5.5vw, 76px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 28 }}>
              <span style={{ color: WHITE }}>We put </span>
              <span style={{ color: BRONZE, fontStyle: 'italic' }}>promoters</span>
              <br />
              <span style={{ color: WHITE }}>centre stage.</span>
            </h1>

            <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.8, color: WHITE_55, maxWidth: 480, marginBottom: 44 }}>
              Honey Group manages 280+ brand promoters across South Africa — now fully digital. From onboarding to geo-verified shifts to payroll calculations.
            </p>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {session ? (
                <>
                  <button onClick={handleDashboard}
                    style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: BRONZE, color: BLACK, border: 'none', padding: '18px 52px', cursor: 'pointer', transition: 'all 0.3s', animation: 'pulse-ring 3s 2s infinite' }}
                    onMouseEnter={e => { e.currentTarget.style.background = BRONZE_LIGHT; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = BRONZE; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    Go to Dashboard
                  </button>
                  <button onClick={() => navigate('/jobs')}
                    style={{ fontFamily: FB, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'transparent', color: WHITE_85, border: `1px solid ${GREY_BORDER}`, padding: '18px 40px', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BRONZE_DIM; e.currentTarget.style.color = BRONZE; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = GREY_BORDER; e.currentTarget.style.color = WHITE_85; }}>
                    Browse Jobs ↓
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/register')}
                    style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: BRONZE, color: BLACK, border: 'none', padding: '18px 52px', cursor: 'pointer', transition: 'all 0.3s', animation: 'pulse-ring 3s 2s infinite' }}
                    onMouseEnter={e => { e.currentTarget.style.background = BRONZE_LIGHT; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = BRONZE; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    Join as a Promoter
                  </button>
                  <button onClick={() => navigate('/jobs')}
                    style={{ fontFamily: FB, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'transparent', color: WHITE_85, border: `1px solid ${GREY_BORDER}`, padding: '18px 40px', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BRONZE_DIM; e.currentTarget.style.color = BRONZE; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = GREY_BORDER; e.currentTarget.style.color = WHITE_85; }}>
                    Browse Jobs ↓
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: stats panel — G7-style sidebar card */}
          <div style={{ animation: 'hero-fade 1s 0.5s cubic-bezier(0.22,1,0.36,1) both', background: 'rgba(20,20,20,0.72)', backdropFilter: 'blur(20px)', border: `1px solid ${GREY_BORDER}`, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: BRONZE }} />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', color: BRONZE, marginBottom: 28 }}>Platform at a Glance</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: GREY_BORDER }}>
              {stats.map((s, i) => (
                <div key={i} style={{ background: DARK_2, padding: '22px 18px' }}>
                  <div style={{ fontFamily: FD, fontSize: 32, fontWeight: 700, color: WHITE, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: WHITE_28, letterSpacing: '0.1em' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${GREY_BORDER}` }}>
              <div style={{ fontSize: 11, color: WHITE_55, lineHeight: 1.7 }}>
                Geo-verified shifts · Nationwide coverage · Real-time operations
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: WHITE_28, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', zIndex: 3 }}>
          <div style={{ width: 1, height: 48, background: `linear-gradient(to bottom, ${BRONZE}, transparent)` }} />
          Scroll
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap" style={{ padding: '0' }}>
        <div className="ticker-inner">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="ticker-item">
              <span>◆</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section
        ref={(el) => { (rFeatures as any).current = el; (secFeatures as any).current = el; }}
        className="reveal"
        style={{ padding: '120px 80px', background: DARK_1, borderBottom: `1px solid ${GREY_BORDER}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 60 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: BRONZE, marginBottom: 14 }}>Platform Capabilities</div>
              <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 900, lineHeight: 1.05 }}>
                Built for<br /><span style={{ color: BRONZE, fontStyle: 'italic' }}>precision.</span>
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {features.map((_, i) => (
                <button key={i} onClick={() => setActiveFeature(i)}
                  style={{ width: 28, height: 3, border: 'none', cursor: 'pointer', background: activeFeature === i ? BRONZE : GREY_LIGHT, transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: GREY_BORDER }}>
            {features.map((f, i) => (
              <div key={i} onClick={() => setActiveFeature(i)}
                style={{ padding: '56px 44px', background: activeFeature === i ? BRONZE : DARK_2, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: activeFeature === i ? 'rgba(0,0,0,0.45)' : BRONZE, marginBottom: 20 }}>{f.tag}</div>
                <div style={{ fontFamily: FD, fontSize: 38, color: activeFeature === i ? BLACK : BRONZE, marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, lineHeight: 1.2, color: activeFeature === i ? BLACK : WHITE, marginBottom: 16 }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: activeFeature === i ? 'rgba(0,0,0,0.6)' : WHITE_55 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOBS PREVIEW ── */}
      <section
        ref={(el) => { (rJobs as any).current = el; (secJobs as any).current = el; }}
        className="reveal"
        style={{ padding: '100px 80px', background: BLACK, borderBottom: `1px solid ${GREY_BORDER}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: BRONZE, marginBottom: 14 }}>Current Opportunities</div>
              <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 900, lineHeight: 1 }}>Live Jobs</h2>
              <p style={{ fontSize: 14, color: WHITE_55, marginTop: 12, maxWidth: 460, lineHeight: 1.75 }}>
                4 newest approved positions — sorted by approval date.
                {!session && <> <span style={{ color: BRONZE }}> Login or register</span> to apply.</>}
              </p>
            </div>
            <div>
              {!session ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px', background: BRONZE_MUTED, border: `1px solid ${BRONZE_DIM}` }}>
                  <span style={{ fontSize: 14, color: BRONZE }}>⬡</span>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: BRONZE }}>Members Only</div>
                    <div style={{ fontSize: 11, color: WHITE_28, marginTop: 2 }}>Login to apply</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px', background: 'rgba(143,168,154,0.08)', border: `1px solid rgba(143,168,154,0.28)` }}>
                  <span style={{ fontSize: 14, color: '#8FA89A' }}>◉</span>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8FA89A' }}>Logged In</div>
                    <div style={{ fontSize: 11, color: WHITE_28, marginTop: 2 }}>{session.name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {previewJobs.map(job => (
              <JobCard key={job.id} job={job} isLoggedIn={!!session} onLock={() => setLoginPrompt(true)} onView={(id) => navigate(`/jobs/${id}`)} />
            ))}
          </div>

          <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${BRONZE}, transparent)` }} />
            <p style={{ fontSize: 12, color: WHITE_28 }}>Showing 4 of <strong style={{ color: WHITE_55 }}>{totalActiveJobs} active jobs</strong></p>
            <button onClick={() => navigate('/jobs')}
              style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${BRONZE_DIM}`, color: BRONZE, padding: '12px 40px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = BRONZE_MUTED; e.currentTarget.style.borderColor = BRONZE; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = BRONZE_DIM; }}>
              View All {totalActiveJobs} Jobs →
            </button>
          </div>
        </div>
      </section>

      {/* ── ABOUT / ROLES ── */}
      <section
        ref={(el) => { (rAbout as any).current = el; (secAbout as any).current = el; }}
        className="reveal"
        style={{ padding: '120px 80px', background: DARK_1, borderBottom: `1px solid ${GREY_BORDER}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          {/* Split intro — G7 style */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, marginBottom: 80, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: BRONZE, marginBottom: 14 }}>About the Platform</div>
              <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,54px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 28 }}>
                Three roles.<br /><span style={{ color: BRONZE, fontStyle: 'italic' }}>One platform.</span>
              </h2>
              <p style={{ fontSize: 15, color: WHITE_55, lineHeight: 1.8, marginBottom: 32 }}>
                Honey Group Promotions is South Africa's premier digital promoter management platform. We connect brands with vetted, geo-verified promoters — managed through a single, powerful platform.
              </p>
              <div style={{ display: 'flex', gap: 14 }}>
                <button onClick={() => navigate('/register')}
                  style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', background: BRONZE, color: BLACK, border: 'none', padding: '14px 36px', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = BRONZE_LIGHT; }}
                  onMouseLeave={e => { e.currentTarget.style.background = BRONZE; }}>
                  Get Started
                </button>
              </div>
            </div>
            {/* Decorative panel */}
            <div style={{ position: 'relative' }}>
              <div style={{ background: DARK_2, border: `1px solid ${GREY_BORDER}`, padding: '40px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: BRONZE }} />
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: BRONZE, marginBottom: 24 }}>Who We Serve</div>
                {[
                  { role: 'Promoter', icon: '◉', color: '#8FA8C8', desc: 'View jobs, geo check-in, track earnings, upload documents.' },
                  { role: 'Supervisor', icon: '◈', color: BRONZE, desc: 'Monitor attendance live, flag issues, view team profiles.' },
                  { role: 'Admin', icon: '◆', color: '#A89AB8', desc: 'Create jobs, manage users, calculate payroll, generate reports.' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '18px 0', borderBottom: i < 2 ? `1px solid ${GREY_BORDER}` : 'none' }}>
                    <div style={{ fontSize: 20, color: r.color, flexShrink: 0, marginTop: 2 }}>{r.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: WHITE, marginBottom: 4, fontFamily: FD }}>{r.role}</div>
                      <div style={{ fontSize: 12, color: WHITE_55, lineHeight: 1.6 }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section ref={rCaps} className="reveal" style={{ padding: '100px 80px', background: BLACK, borderBottom: `1px solid ${GREY_BORDER}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: BRONZE, marginBottom: 14 }}>Full Suite</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 900, marginBottom: 56 }}>Capabilities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `1px solid ${GREY_BORDER}` }}>
            {caps.map((cap, i) => (
              <div key={i}
                style={{ padding: '24px 26px', borderRight: i % 4 < 3 ? `1px solid ${GREY_BORDER}` : 'none', borderBottom: i < 8 ? `1px solid ${GREY_BORDER}` : 'none', background: BLACK, display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.3s, color 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.background = DARK_2; (e.currentTarget.querySelector('span') as HTMLElement).style.color = WHITE_85; }}
                onMouseLeave={e => { e.currentTarget.style.background = BLACK; (e.currentTarget.querySelector('span') as HTMLElement).style.color = WHITE_55; }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: BRONZE, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: WHITE_55, transition: 'color 0.3s' }}>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section ref={rCta} className="reveal" style={{ background: BRONZE, padding: '110px 80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.07) 1px,transparent 1px)', backgroundSize: '44px 44px' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.42)', marginBottom: 22 }}>Ready to Scale?</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(36px,5.5vw,72px)', fontWeight: 900, color: BLACK, lineHeight: 1, marginBottom: 44 }}>
            Join the platform<br /><span style={{ fontStyle: 'italic' }}>powering SA promotions.</span>
          </h2>
          {session ? (
            <button onClick={handleDashboard}
              style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: BLACK, color: BRONZE, border: 'none', padding: '20px 56px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = BLACK; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Go to Dashboard
            </button>
          ) : (
            <button onClick={() => navigate('/register')}
              style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: BLACK, color: BRONZE, border: 'none', padding: '20px 56px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = BLACK; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Register Now — It's Free
            </button>
          )}
        </div>
      </section>

      {/* ── FOOTER — G7 style ── */}
      <footer style={{ background: DARK_1, borderTop: `1px solid ${GREY_BORDER}`, paddingTop: 0 }}>
        {/* Top band */}
        <div style={{ background: BLACK, padding: '56px 80px', borderBottom: `1px solid ${GREY_BORDER}` }}>
          <div style={{ maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 60 }}>
            {/* Brand */}
            <div>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, marginBottom: 16 }}><span style={{ color: BRONZE }}>HONEY</span><span style={{ color: WHITE }}> GROUP</span></div>
              <p style={{ fontSize: 13, color: WHITE_55, lineHeight: 1.8, maxWidth: 280, marginBottom: 28 }}>
                South Africa's premier promoter management platform. Fully digital. Fully verified.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {['IG', 'LI', 'FB'].map(s => (
                  <div key={s} style={{ width: 36, height: 36, border: `1px solid ${GREY_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: WHITE_28, letterSpacing: '0.05em', transition: 'all 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BRONZE_DIM; e.currentTarget.style.color = BRONZE; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = GREY_BORDER; e.currentTarget.style.color = WHITE_28; }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
            {/* Col links */}
            {[
              { label: 'Platform', links: ['Features', 'Jobs Board', 'Geo Check-In', 'Reports'] },
              { label: 'Company', links: ['About Us', 'Careers', 'Contact', 'Blog'] },
              { label: 'Legal', links: ['Privacy Policy', 'POPIA', 'Terms of Use', 'Cookie Policy'] },
            ].map(col => (
              <div key={col.label}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: BRONZE, marginBottom: 22 }}>{col.label}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, color: WHITE_55, marginBottom: 12, cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = WHITE}
                    onMouseLeave={e => e.currentTarget.style.color = WHITE_55}>
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{ padding: '22px 80px', maxWidth: 1360, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: WHITE_28 }}>© 2026 Honey Group Promotions. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 28 }}>
            {['POPIA Compliant', 'South Africa', 'Est. 2018'].map(t => (
              <span key={t} style={{ fontSize: 10, color: WHITE_28, letterSpacing: '0.08em' }}>{t}</span>
            ))}
          </div>
        </div>
      </footer>

      {showLoginPrompt && <LoginPromptModal onClose={() => setLoginPrompt(false)} onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />}
    </div>
  );
}