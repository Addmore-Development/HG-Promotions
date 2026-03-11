import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── TOKENS ─────────────────────────────────────────────────── */
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

/* ─── GLOBAL CSS ─────────────────────────────────────────────── */
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
`;

/* ─── SCROLL REVEAL HOOK ─────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('hg-visible'); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── LANDING PAGE ───────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled,      setScrolled]      = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const rFeatures = useReveal();
  const rCaps     = useReveal();
  const rRoles    = useReveal();
  const rCta      = useReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

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

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, padding: scrolled ? '14px 80px' : '26px 80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(8,8,8,0.96)' : 'transparent', backdropFilter: scrolled ? 'blur(24px)' : 'none', borderBottom: scrolled ? `1px solid ${BLACK_BORDER}` : 'none', transition: 'all 0.4s ease' }}>
        <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 700 }}>
          <span style={{ color: GOLD }}>HONEY</span>
          <span style={{ color: WHITE }}> GROUP</span>
        </div>
        <ul style={{ display: 'flex', gap: 44, listStyle: 'none' }}>
          {['Platform', 'Features', 'About'].map((l) => (
            <li key={l}>
              <a href="#" style={{ fontFamily: FB, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: WHITE_MUTED, textDecoration: 'none', transition: 'color 0.25s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={(e) => (e.currentTarget.style.color = WHITE_MUTED)}
              >{l}</a>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/login')}
            style={{ fontFamily: FB, fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${WHITE_DIM}`, color: WHITE, padding: '10px 26px', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = WHITE_DIM; e.currentTarget.style.color = WHITE; }}
          >Log In</button>
          <button onClick={() => navigate('/register')}
            style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', background: GOLD, border: 'none', color: BLACK, padding: '10px 28px', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)'; }}
          >Register</button>
        </div>
      </nav>

      {/* HERO */}
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

          <button onClick={() => navigate('/register')}
            style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', background: GOLD, color: BLACK, border: 'none', padding: '18px 52px', cursor: 'pointer', transition: 'all 0.3s', animation: 'hg-pulse 3s 2s infinite' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(196,151,58,0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >Join as a Promoter</button>
        </div>

        <div style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: WHITE_DIM, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: FB }}>
          <div style={{ width: 1, height: 52, background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
          Scroll
        </div>
      </section>

      {/* FEATURES */}
      <section ref={rFeatures} className="hg-reveal" style={{ padding: '120px 0' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto 64px', padding: '0 80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>Platform Capabilities</div>
            <h2 style={{ fontFamily: FD, fontSize: 'clamp(34px,5vw,60px)', fontWeight: 900, lineHeight: 1.05, textDecoration: 'line-through', textDecorationColor: GOLD, textDecorationThickness: '3px' }}>our features</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {features.map((_, i) => (
              <button key={i} onClick={() => setActiveFeature(i)} style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer', background: activeFeature === i ? GOLD : WHITE_DIM, transition: 'all 0.3s' }} />
            ))}
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

      {/* CAPABILITIES */}
      <section ref={rCaps} className="hg-reveal" style={{ background: BLACK_SOFT, padding: '100px 80px', borderTop: `1px solid ${BLACK_BORDER}`, borderBottom: `1px solid ${BLACK_BORDER}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>What We Offer</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(34px,5vw,60px)', fontWeight: 900, marginBottom: 60, textDecoration: 'line-through', textDecorationColor: GOLD, textDecorationThickness: '3px' }}>Capabilities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `1px solid ${BLACK_BORDER}` }}>
            {caps.map((cap, i) => (
              <div key={i}
                style={{ padding: '26px 28px', borderRight: i % 4 < 3 ? `1px solid ${BLACK_BORDER}` : 'none', borderBottom: i < 8 ? `1px solid ${BLACK_BORDER}` : 'none', background: BLACK, display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.3s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = GOLD_MUTED)}
                onMouseLeave={(e) => (e.currentTarget.style.background = BLACK)}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                <span style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED }}>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section ref={rRoles} className="hg-reveal" style={{ padding: '120px 80px' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>Built for Everyone</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(34px,5vw,60px)', fontWeight: 900, marginBottom: 60 }}>
            Three roles.<br />
            <span style={{ color: GOLD, fontStyle: 'italic' }}>One platform.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {roles.map((r, i) => (
              <div key={i}
                style={{ background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`, padding: '48px 40px', position: 'relative', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
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

      {/* CTA BAND */}
      <section ref={rCta} className="hg-reveal" style={{ background: GOLD, padding: '110px 80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.06) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)', marginBottom: 24 }}>Ready to Scale?</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(38px,6vw,80px)', fontWeight: 900, color: BLACK, lineHeight: 1, marginBottom: 44 }}>
            Join the platform<br />
            <span style={{ fontStyle: 'italic' }}>powering SA promotions.</span>
          </h2>
          <button onClick={() => navigate('/register')}
            style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', background: BLACK, color: GOLD, border: 'none', padding: '20px 56px', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = BLACK; e.currentTarget.style.transform = 'translateY(0)'; }}
          >Register Now</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: BLACK, borderTop: `1px solid ${BLACK_BORDER}`, padding: '64px 80px 40px' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 52 }}>
            <div>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, marginBottom: 14 }}>
                <span style={{ color: GOLD }}>HONEY</span><span style={{ color: WHITE }}> GROUP</span>
              </div>
              <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED, lineHeight: 1.75, maxWidth: 300 }}>South Africa's premier promoter management platform. Fully digital.</p>
            </div>
            <div style={{ display: 'flex', gap: 64 }}>
              {[{ label: 'Platform', links: ['Features','Pricing','Security'] }, { label: 'Company', links: ['About','Careers','Contact'] }].map((col) => (
                <div key={col.label}>
                  <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 22 }}>{col.label}</div>
                  {col.links.map((l) => (
                    <div key={l} style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED, marginBottom: 12, cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = WHITE_MUTED)}
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
    </div>
  );
}