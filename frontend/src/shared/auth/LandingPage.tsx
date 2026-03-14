import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_JOBS, getActiveJobs } from '../jobs/JobsPage';

// ── Color tokens ──────────────────────────────────────────────────────────────
const GL = '#E8A820'
const G  = '#D4880A'
const G3 = '#C07818'
const G5 = '#6B3F10'
const B  = '#0C0A07'
const D1 = '#141008'
const D2 = '#1A1408'
const W  = '#FAF3E8'
const W85 = 'rgba(250,243,232,0.85)'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'
const W12 = 'rgba(250,243,232,0.12)'
const BB  = 'rgba(212,136,10,0.16)'

const FD = "'Work Sans', 'worksans', sans-serif"

// ── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&family=Bodoni+Moda:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { -webkit-font-smoothing: antialiased; background: ${B}; font-family: ${FD}; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: ${D1}; }
  ::-webkit-scrollbar-thumb { background: ${GL}; }

  .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(232,168,32,0.5)} 50%{box-shadow:0 0 0 16px rgba(232,168,32,0)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes hero-fade { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes feature-in { 0%{opacity:0;transform:translateY(40px) scale(0.97)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes feature-out { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-40px) scale(0.97)} }
  @keyframes twinkle { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
  @keyframes glitter-drift { 0%{transform:translateY(0) rotate(0deg);opacity:0.6} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
  @keyframes pyramid-glow { 0%,100%{box-shadow:0 0 0 0 rgba(232,168,32,0)} 50%{box-shadow:0 0 32px 8px rgba(232,168,32,0.18)} }
  @keyframes card-rise { 0%{opacity:0;transform:translateY(60px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes num-count { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes img-scale { 0%{transform:scale(1.08)} 100%{transform:scale(1)} }

  .nav-link { color: ${W55}; background: none; border: none; cursor: pointer; font-family: ${FD}; font-size: 12px; font-weight: 400; letter-spacing: 0.12em; padding: 0; transition: color 0.25s; }
  .nav-link:hover { color: ${GL}; }

  .ticker-wrap { overflow: hidden; border-top: 1px solid ${BB}; border-bottom: 1px solid ${BB}; background: ${D1}; }
  .ticker-inner { display: flex; white-space: nowrap; animation: ticker 28s linear infinite; }
  .ticker-item { padding: 0 56px; font-size: 10px; font-weight: 500; letter-spacing: 0.3em; text-transform: uppercase; color: ${W28}; display: flex; align-items: center; gap: 24px; height: 42px; font-family: ${FD}; }
  .ticker-item span { color: ${GL}; font-size: 8px; }

  .feat-slide-enter { animation: feature-in 0.65s cubic-bezier(0.22,1,0.36,1) both; }
  .feat-slide-exit  { animation: feature-out 0.45s cubic-bezier(0.22,1,0.36,1) both; }

  .job-card-hover:hover { transform: translateY(-8px) !important; }
  .job-card-hover:hover .card-inner { border-color: ${GL} !important; box-shadow: 0 32px 64px rgba(0,0,0,0.7), 0 0 40px rgba(232,168,32,0.15) !important; }

  .triptych-img { overflow: hidden; position: relative; }
  .triptych-img img { width:100%; height:100%; object-fit:cover; transition: transform 0.8s cubic-bezier(0.22,1,0.36,1); filter: grayscale(100%); }
  .triptych-img.center img { filter: grayscale(0%) !important; }
  .triptych-img:hover img { transform: scale(1.04); }
`

// ── Reveal hook ───────────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect() }
    }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

// ── Glitter Field ─────────────────────────────────────────────────────────────
function GlitterField() {
  const particles = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${10 + Math.random() * 80}%`,
    size: 1.5 + Math.random() * 3,
    delay: `${Math.random() * 6}s`,
    dur: `${3 + Math.random() * 5}s`,
    color: Math.random() > 0.6 ? W : Math.random() > 0.4 ? GL : G,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, top: p.top,
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.color, opacity: 0.5,
          animation: `glitter-drift ${p.dur} ${p.delay} ease-in infinite, twinkle ${p.dur} ${p.delay} ease-in-out infinite`,
        }} />
      ))}
      {Array.from({ length: 20 }, (_, i) => (
        <div key={`star-${i}`} style={{
          position: 'absolute',
          left: `${3 + Math.random() * 94}%`,
          top: `${5 + Math.random() * 90}%`,
          fontSize: `${7 + Math.random() * 9}px`,
          color: Math.random() > 0.5 ? GL : W,
          opacity: 0.3,
          animation: `twinkle ${2 + Math.random() * 3}s ${Math.random() * 5}s ease-in-out infinite`,
        }}>✦</div>
      ))}
    </div>
  )
}

// ── Jobs Section ──────────────────────────────────────────────────────────────
function JobsSection({ jobs, isLoggedIn, onLock, onView }: {
  jobs: ReturnType<typeof getActiveJobs>
  isLoggedIn: boolean
  onLock: () => void
  onView: (id: string) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const preview = jobs.slice(0, 3)

  // Card 0 = gold accent, 1 & 2 = standard dark
  const isGold = (i: number) => i === 0

  return (
    <div style={{ position: 'relative' }}>
      <GlitterField />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 2,
        position: 'relative',
        zIndex: 1,
      }}>
        {preview.map((job, i) => {
          const gold = isGold(i)
          const isHov = hovered === i
          const fillPct = Math.round(((job.slots - job.slotsLeft) / job.slots) * 100)

          return (
            <div
              key={job.id}
              className="job-card-hover"
              style={{
                transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
                animation: `card-rise 0.7s ${i * 0.15}s cubic-bezier(0.22,1,0.36,1) both`,
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="card-inner"
                style={{
                  position: 'relative', overflow: 'hidden', height: '100%',
                  background: gold
                    ? `linear-gradient(160deg, #2A1E06 0%, #1E1504 50%, #160F03 100%)`
                    : `linear-gradient(160deg, ${D2} 0%, rgba(20,16,5,0.98) 100%)`,
                  border: `1px solid ${gold ? 'rgba(232,168,32,0.4)' : BB}`,
                  transition: 'border-color 0.35s, box-shadow 0.35s',
                  boxShadow: gold
                    ? `0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(232,168,32,0.08)`
                    : `0 4px 24px rgba(0,0,0,0.4)`,
                  cursor: 'pointer',
                  padding: '0 0 28px 0',
                }}
              >
                {/* Top gradient bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: gold ? 4 : 2,
                  background: gold
                    ? `linear-gradient(90deg, ${G5}, ${GL}, #F5C842, ${GL}, ${G5})`
                    : `linear-gradient(90deg, ${G5}, rgba(232,168,32,0.5), ${G5})`,
                }} />

                {/* Gold card ambient glow */}
                {gold && (
                  <div style={{
                    position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
                    width: 300, height: 200,
                    background: 'radial-gradient(ellipse, rgba(232,168,32,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />
                )}

                {/* Mini glitters on gold card */}
                {gold && [0,1,2,3,4].map(si => (
                  <div key={si} style={{
                    position: 'absolute',
                    left: `${10 + si * 18}%`, top: `${15 + (si % 3) * 20}%`,
                    fontSize: `${6 + si % 3}px`, color: si % 2 === 0 ? GL : W,
                    opacity: 0.3,
                    animation: `twinkle ${2 + si * 0.6}s ${si * 0.4}s ease-in-out infinite`,
                    pointerEvents: 'none',
                  }}>★</div>
                ))}

                <div style={{ padding: '32px 28px 0' }}>
                  {/* Tag row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase',
                      color: gold ? GL : W28, fontFamily: FD,
                      padding: gold ? '4px 10px' : '4px 0',
                      background: gold ? 'rgba(232,168,32,0.1)' : 'transparent',
                      border: gold ? `1px solid rgba(232,168,32,0.2)` : 'none',
                    }}>
                      {gold ? '★ Featured' : job.type}
                    </span>
                    <span style={{ fontSize: 9, color: W28, fontFamily: FD, letterSpacing: '0.08em' }}>{job.date}</span>
                  </div>

                  {/* Company */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: gold ? GL : G3, fontWeight: 700, letterSpacing: '0.06em', fontFamily: FD }}>{job.company}</div>
                    {!gold && <div style={{ fontSize: 9, color: W28, marginTop: 2, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FD }}>{job.type}</div>}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: FD,
                    fontSize: gold ? 26 : 20,
                    fontWeight: 900,
                    lineHeight: 1.15,
                    color: gold ? W : W85,
                    marginBottom: 6,
                    fontStyle: gold ? 'italic' : 'normal',
                    letterSpacing: gold ? '-0.01em' : '0',
                  }}>{job.title}</h3>

                  {/* Pay */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
                    <span style={{ fontFamily: FD, fontSize: gold ? 36 : 28, fontWeight: 900, color: GL, lineHeight: 1 }}>{job.pay}</span>
                    <span style={{ fontSize: 11, color: W28, fontFamily: FD }}>{job.payPer}</span>
                  </div>

                  {/* Meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {[
                      { icon: '◎', text: job.location },
                      { icon: '◉', text: `${job.duration} · ${job.slots} slots` },
                    ].map((m, mi) => (
                      <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 9, color: GL, flexShrink: 0 }}>{m.icon}</span>
                        <span style={{ fontSize: 12, color: W55, fontFamily: FD }}>{m.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Slots bar */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: W28, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FD }}>Availability</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: job.slotsLeft <= 2 ? '#EF9060' : GL, fontFamily: FD }}>{job.slotsLeft} left</span>
                    </div>
                    <div style={{ height: gold ? 3 : 2, background: 'rgba(250,243,232,0.07)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${fillPct}%`,
                        background: gold
                          ? `linear-gradient(90deg, ${G5}, ${GL}, #F5C842)`
                          : `linear-gradient(90deg, ${G5}, ${GL})`,
                        transition: 'width 0.7s ease',
                      }} />
                    </div>
                  </div>

                  {/* CTA */}
                  {isLoggedIn ? (
                    <button onClick={() => onView(job.id)} style={{
                      width: '100%', padding: gold ? '14px' : '11px',
                      border: `1px solid ${gold ? 'rgba(232,168,32,0.5)' : BB}`,
                      background: gold ? 'rgba(232,168,32,0.1)' : 'transparent',
                      color: GL, fontFamily: FD, fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.25s',
                    }}>
                      View Full Details →
                    </button>
                  ) : (
                    <button onClick={onLock} style={{
                      width: '100%', padding: gold ? '14px' : '11px',
                      border: `1px solid ${gold ? 'rgba(232,168,32,0.35)' : BB}`,
                      background: 'transparent',
                      color: gold ? W85 : W55, fontFamily: FD, fontSize: 10,
                      fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.25s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      <span style={{ fontSize: 10 }}>⬡</span> Login to Apply
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Login Prompt Modal ────────────────────────────────────────────────────────
function LoginPromptModal({ onClose, onLogin, onRegister }: {
  onClose: () => void; onLogin: () => void; onRegister: () => void
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: D2, border: `1px solid ${BB}`, padding: '52px 48px', maxWidth: 420, width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${G5}, ${GL}, ${G5})` }} />
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: `rgba(212,136,10,0.12)`, border: `1px solid rgba(232,168,32,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 26, animation: 'float 3s ease-in-out infinite' }}>⬡</div>
        <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 12, fontFamily: FD }}>Members Only</div>
        <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, color: W, marginBottom: 14, lineHeight: 1.2 }}>Unlock Job Details</h2>
        <p style={{ fontSize: 13, color: W55, lineHeight: 1.75, marginBottom: 36, fontFamily: FD }}>
          Create a free account or sign in to view full job details, requirements, and apply for promoter positions.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onRegister}
            style={{ width: '100%', padding: '15px', background: GL, border: 'none', color: B, fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = GL; e.currentTarget.style.transform = 'translateY(0)' }}>
            Create Free Account
          </button>
          <button onClick={onLogin}
            style={{ width: '100%', padding: '15px', background: 'transparent', border: `1px solid ${BB}`, color: W55, fontFamily: FD, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(232,168,32,0.45)`; e.currentTarget.style.color = GL }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = W55 }}>
            Already Have an Account
          </button>
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: W28, fontSize: 18 }}>✕</button>
      </div>
    </div>
  )
}

// ── Feature Slideshow ─────────────────────────────────────────────────────────
function FeatureSlideshow() {
  const [active, setActive] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [displayIdx, setDisplayIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const features = [
    { tag: 'Smart Dispatch', icon: '◎', title: 'Right person, right place.', body: 'AI-powered matching filters promoters by location, reliability score, and physical attributes — filling your brand activations with precision.', stat: '280+', statLabel: 'Active Promoters' },
    { tag: 'Geo-Verified Shifts', icon: '⬡', title: 'Attendance you can trust.', body: 'Promoters check in only when within 200m of the venue. GPS verification plus mandatory selfie — no proxy clock-ins, ever.', stat: '98%', statLabel: 'Shift Attendance' },
    { tag: 'Smart Payroll', icon: '◈', title: 'Calculate pay in minutes.', body: 'Hours × Rate calculations done instantly. View earnings per promoter and per campaign. Admin approves — no direct payments on-platform.', stat: '12', statLabel: 'Cities Covered' },
  ]

  const advance = (toIdx: number) => {
    setExiting(true)
    setTimeout(() => { setDisplayIdx(toIdx); setActive(toIdx); setExiting(false) }, 450)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => { advance((active + 1) % features.length) }, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [active])

  const f = features[displayIdx]

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 40, justifyContent: 'flex-end' }}>
        {features.map((_, i) => (
          <button key={i} onClick={() => { if (timerRef.current) clearInterval(timerRef.current); advance(i) }}
            style={{ width: i === active ? 36 : 10, height: 4, border: 'none', cursor: 'pointer', background: i === active ? GL : `rgba(232,168,32,0.22)`, transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)', borderRadius: 2 }} />
        ))}
      </div>
      <div key={displayIdx} className={exiting ? 'feat-slide-exit' : 'feat-slide-enter'}
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 80, alignItems: 'center', background: `linear-gradient(135deg, ${D2} 0%, ${D1} 100%)`, border: `1px solid ${BB}`, padding: '64px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${G5}, ${GL}, ${G5})` }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, rgba(232,168,32,0.06) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 28, height: 1, background: GL }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, fontFamily: FD }}>{f.tag}</span>
          </div>
          <div style={{ fontFamily: FD, fontSize: 56, color: GL, marginBottom: 20, lineHeight: 1 }}>{f.icon}</div>
          <h3 style={{ fontFamily: FD, fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, lineHeight: 1.15, color: W, marginBottom: 22 }}>{f.title}</h3>
          <p style={{ fontSize: 16, lineHeight: 1.85, color: W55, fontFamily: FD, fontWeight: 400, maxWidth: 500 }}>{f.body}</p>
          <div style={{ marginTop: 32, display: 'flex', gap: 8 }}>
            {features.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === active ? GL : W12, transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── About + Capabilities Combined Card ───────────────────────────────────────
function AboutCapabilities({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const caps = [
    'Promoter Onboarding', 'Geo Check-In / Out', 'Live Operations Map', 'Smart Job Allocation',
    'Payroll Calculations', 'Document Vault', 'Supervisor Monitoring', 'Client Reports',
    'SMS Notifications', 'Reliability Scoring', 'Earnings Export', 'POPIA Compliance',
  ]
  const roles = [
    { role: 'Promoter', icon: '◉', color: G3, desc: 'View jobs, geo check-in, track earnings, upload documents.' },
    { role: 'Supervisor', icon: '◈', color: GL, desc: 'Monitor attendance live, flag issues, view team profiles.' },
    { role: 'Admin', icon: '◆', color: GL, desc: 'Create jobs, manage users, calculate payroll, generate reports.' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      {/* Roles card */}
      <div style={{ background: `linear-gradient(160deg, ${D2}, rgba(20,16,5,0.98))`, border: `1px solid ${BB}`, padding: '52px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G5}, ${GL}, ${G5})` }} />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 16, fontFamily: FD }}>Who We Serve</div>
        <h2 style={{ fontFamily: FD, fontSize: 'clamp(28px,3vw,42px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 36 }}>
          Three roles.<br /><span style={{ color: GL, fontStyle: 'italic' }}>One platform.</span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {roles.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 18, padding: '20px 0', borderBottom: i < 2 ? `1px solid ${BB}` : 'none' }}>
              <div style={{ fontSize: 22, color: r.color, flexShrink: 0, marginTop: 2 }}>{r.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: W, marginBottom: 5, fontFamily: FD }}>{r.role}</div>
                <div style={{ fontSize: 12, color: W55, lineHeight: 1.65, fontFamily: FD }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/register')}
          style={{ marginTop: 36, fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', background: GL, color: B, border: 'none', padding: '14px 32px', cursor: 'pointer', transition: 'all 0.3s' }}
          onMouseEnter={e => { e.currentTarget.style.background = G }}
          onMouseLeave={e => { e.currentTarget.style.background = GL }}>
          Get Started
        </button>
      </div>

      {/* Capabilities card */}
      <div style={{ background: B, border: `1px solid ${BB}`, padding: '52px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G5}, rgba(232,168,32,0.4), ${G5})` }} />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 16, fontFamily: FD }}>Full Suite</div>
        <h2 style={{ fontFamily: FD, fontSize: 'clamp(28px,3vw,42px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 36 }}>
          Platform<br /><span style={{ color: GL, fontStyle: 'italic' }}>Capabilities</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: `1px solid ${BB}` }}>
          {caps.map((cap, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              borderRight: i % 2 === 0 ? `1px solid ${BB}` : 'none',
              borderBottom: i < 10 ? `1px solid ${BB}` : 'none',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'background 0.25s',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = D2 }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: GL, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: W55, fontFamily: FD }}>{cap}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Image Triptych ────────────────────────────────────────────────────────────
function ImageTriptych() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: B, borderTop: `1px solid ${BB}` }}>
      {/* Section label */}
      <div style={{
        position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.42em', textTransform: 'uppercase', color: GL, marginBottom: 10, fontFamily: FD }}>The Stage Awaits</div>
        <h2 style={{ fontFamily: FD, fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, color: W, lineHeight: 1, textShadow: '0 4px 40px rgba(0,0,0,0.8)' }}>
          Be part of<br /><span style={{ color: GL, fontStyle: 'italic' }}>something electric.</span>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', height: 520 }}>
        {/* Left */}
        <div className="triptych-img" style={{ position: 'relative' }}>
          <img
            src="/leftFooter.jpg"
            alt="Concert crowd"
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) brightness(0.7)', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(12,10,7,0.3), transparent)' }} />
        </div>

        {/* Center — color, brightest */}
        <div className="triptych-img center" style={{ position: 'relative', zIndex: 2 }}>
          <img
            src="/centreFooter.jpg"
            alt="Promoter at event"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'brightness(1.05) saturate(1.1)', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
          />
          {/* Gold frame on center image */}
          <div style={{ position: 'absolute', inset: 0, border: `2px solid ${GL}`, pointerEvents: 'none', opacity: 0.4 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${GL}, transparent)` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${GL}, transparent)` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,10,7,0.7) 0%, transparent 50%)' }} />
        </div>

        {/* Right */}
        <div className="triptych-img" style={{ position: 'relative' }}>
          <img
            src="/rightFooter.jpg"
            alt="Street crowd"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'grayscale(100%) brightness(0.7)', transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(12,10,7,0.3), transparent)' }} />
        </div>
      </div>

      {/* Bottom CTA strip over images */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
        background: 'linear-gradient(to top, rgba(12,10,7,0.96) 0%, transparent 100%)',
        padding: '48px 80px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <div>
          <div style={{ fontFamily: FD, fontSize: 'clamp(18px,2.5vw,30px)', fontWeight: 900, color: W, lineHeight: 1.1 }}>
            Join the platform<br /><span style={{ color: GL, fontStyle: 'italic' }}>powering SA promotions.</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            style={{ fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', background: GL, color: B, border: 'none', padding: '14px 36px', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = GL; e.currentTarget.style.transform = 'translateY(0)' }}>
            Register Now — Free
          </button>
          <button
            style={{ fontFamily: FD, fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'transparent', color: W85, border: `1px solid ${BB}`, padding: '14px 28px', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(232,168,32,0.5)`; e.currentTarget.style.color = GL }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = W85 }}>
            Browse Jobs
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [showLoginPrompt, setLoginPrompt] = useState(false)
  const [session, setSession] = useState<{ role: string; name: string; email: string } | null>(null)
  const [heroSlide, setHeroSlide] = useState(0)
  const heroSlideRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const heroMedia = [
    { type: 'image', src: '/1_hero.jpg' },
    { type: 'image', src: '/2_hero.jpg' },
    { type: 'video', src: '/3_hero.mp4' },
    { type: 'image', src: '/4_hero.jpg' },
    { type: 'image', src: '/5_hero.jpg' },
  ]

  const advanceHeroSlide = (to: number) => {
    setHeroSlide(to)
  }

  useEffect(() => {
    heroSlideRef.current = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % heroMedia.length)
    }, 5000)
    return () => { if (heroSlideRef.current) clearInterval(heroSlideRef.current) }
  }, [])

  useEffect(() => {
    const s = localStorage.getItem('hg_session')
    if (s) { try { setSession(JSON.parse(s)) } catch {} }
  }, [])

  const previewJobs = getActiveJobs(ALL_JOBS).slice(0, 3)
  const totalActiveJobs = getActiveJobs(ALL_JOBS).length

  const handleLogout = () => { localStorage.removeItem('hg_session'); setSession(null) }
  const handleDashboard = () => {
    if (!session) return
    const map: Record<string, string> = { admin: '/admin', business: '/business/dashboard', promoter: '/promoter/' }
    navigate(map[session.role] || '/')
  }

  const secFeatures = useRef<HTMLElement>(null)
  const secJobs     = useRef<HTMLElement>(null)
  const secAbout    = useRef<HTMLElement>(null)

  const rFeatures = useReveal()
  const rJobs     = useReveal()
  const rAbout    = useReveal()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (ref: React.RefObject<HTMLElement>) => ref.current?.scrollIntoView({ behavior: 'smooth' })

  const stats = [
    { value: '280+', label: 'Active Promoters' },
    { value: '12',   label: 'Cities Covered' },
    { value: '4.8★', label: 'Avg Promoter Rating' },
    { value: '98%',  label: 'Shift Attendance Rate' },
  ]

  const tickerItems = ['Brand Activations', 'In-Store Demos', 'Event Staffing', 'Field Marketing', 'Geo-Verified Shifts', 'Live Payroll Calc', 'Supervisor Monitoring', 'Nationwide Coverage']

  return (
    <div style={{ fontFamily: FD, background: B, color: W, overflowX: 'hidden', width: '100%' }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAV — always solid black, no border ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        padding: '0 48px',
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#000',
      }}>
        {/* Logo */}
        <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.01em', flexShrink: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span style={{ color: GL }}>HONEY</span><span style={{ color: W }}> GROUP</span>
        </div>

        {/* Centre nav links */}
        <ul style={{ display: 'flex', gap: 52, listStyle: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          {[
            { label: 'Jobs',     ref: secJobs },
            { label: 'Features', ref: secFeatures },
            { label: 'About',    ref: secAbout },
          ].map(({ label, ref }) => (
            <li key={label}>
              <button onClick={() => scrollTo(ref)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: FD, fontSize: 13, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: W,
                transition: 'color 0.2s', padding: 0,
              }}
                onMouseEnter={e => e.currentTarget.style.color = GL}
                onMouseLeave={e => e.currentTarget.style.color = W}>
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right CTA */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          {session ? (
            <>
              <button onClick={handleDashboard} style={{
                fontFamily: FD, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', background: GL, border: 'none', color: B,
                padding: '11px 24px', cursor: 'pointer', transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = G}
                onMouseLeave={e => e.currentTarget.style.background = GL}>
                My Dashboard
              </button>
              <button onClick={handleLogout} style={{
                fontFamily: FD, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)', color: W,
                padding: '11px 20px', cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GL; e.currentTarget.style.color = GL }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = W }}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={{
                fontFamily: FD, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)', color: W,
                padding: '11px 22px', cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GL; e.currentTarget.style.color = GL }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = W }}>
                LOG IN
              </button>
              <button onClick={() => navigate('/register')} style={{
                fontFamily: FD, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', background: GL, border: 'none', color: B,
                padding: '11px 24px', cursor: 'pointer', transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = G}
                onMouseLeave={e => e.currentTarget.style.background = GL}>
                REGISTER
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO — full width with text overlaid on top of slideshow ── */}
      <section style={{ height: '75vh', minHeight: 540, maxHeight: 820, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'stretch', background: '#000', marginTop: 68, padding: '28px 48px' }}>

        {/* SLIDESHOW — starts at 48%, restored full size, quarter of PROMOTERS overlaps */}
        <div style={{ position: 'absolute', top: 28, left: '48%', right: 48, bottom: 28, borderRadius: 16, overflow: 'hidden', zIndex: 1 }}>
          {heroMedia.map((media, idx) => (
            <div key={idx} style={{
              position: 'absolute', inset: 0,
              opacity: heroSlide === idx ? 1 : 0,
              transition: 'opacity 1s ease',
              zIndex: heroSlide === idx ? 1 : 0,
            }}>
              {media.type === 'video' ? (
                <video autoPlay muted loop playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}>
                  <source src={media.src} type="video/mp4" />
                </video>
              ) : (
                <img src={media.src} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center',
                    animation: heroSlide === idx ? 'img-scale 8s ease-out forwards' : 'none' }} />
              )}
            </div>
          ))}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#111' }} />
          {/* Dark overlay so text is readable */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.1) 100%)' }} />

          {/* Slide dots — bottom left */}
          <div style={{ position: 'absolute', bottom: 20, left: 24, zIndex: 10, display: 'flex', gap: 6 }}>
            {heroMedia.map((_, idx) => (
              <button key={idx}
                onClick={() => { if (heroSlideRef.current) clearInterval(heroSlideRef.current); advanceHeroSlide(idx) }}
                style={{
                  width: idx === heroSlide ? 24 : 6, height: 3, border: 'none', cursor: 'pointer', borderRadius: 2,
                  background: idx === heroSlide ? GL : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.4s ease', padding: 0,
                }} />
            ))}
          </div>

          {/* Pause button — bottom right */}
          <div style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 10,
            width: 34, height: 34, border: '1px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', background: 'rgba(0,0,0,0.3)',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>⏸</span>
          </div>
        </div>

        {/* TEXT — positioned so only PROMOTERS bleeds into slideshow */}
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0, left: 0,
          width: '100%',
          zIndex: 5,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 0 0 48px',
          pointerEvents: 'none',
        }}>
          <h1 style={{
            fontFamily: "'Bodoni Moda', 'Modern No. 20', 'Didot', Georgia, serif",
            fontSize: 'clamp(58px, 7.8vw, 112px)',
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            marginBottom: 36,
            fontStyle: 'italic',
          }}>
            <span style={{ color: W, display: 'block' }}>WE PUT <span style={{ color: GL }}>PROMOTERS</span></span>
            <span style={{ color: W, display: 'inline-block', maxWidth: '46%' }}>CENTRE STAGE</span>
          </h1>

          {session ? (
            <button onClick={handleDashboard} style={{
              fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', background: 'transparent',
              border: '2px solid rgba(255,255,255,0.7)', color: W,
              padding: '11px 20px', cursor: 'pointer', transition: 'all 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 8, pointerEvents: 'all',
              width: 'fit-content', whiteSpace: 'nowrap', maxWidth: '38%',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = GL; e.currentTarget.style.borderColor = GL; e.currentTarget.style.color = B }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; e.currentTarget.style.color = W }}>
              ▶ MY DASHBOARD
            </button>
          ) : (
            <button onClick={() => navigate('/register')} style={{
              fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', background: 'transparent',
              border: '2px solid rgba(255,255,255,0.7)', color: W,
              padding: '11px 20px', cursor: 'pointer', transition: 'all 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 8, pointerEvents: 'all',
              width: 'fit-content', whiteSpace: 'nowrap', maxWidth: '38%',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = GL; e.currentTarget.style.borderColor = GL; e.currentTarget.style.color = B }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; e.currentTarget.style.color = W }}>
              ▶ JOIN AS PROMOTER
            </button>
          )}
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="ticker-item"><span>◆</span>{item}</div>
          ))}
        </div>
      </div>

      {/* ── JOBS SECTION (now first, D1 background) ── */}
      <section
        ref={(el) => { (rJobs as any).current = el; (secJobs as any).current = el }}
        className="reveal"
        style={{ padding: '100px 80px', background: D1, borderBottom: `1px solid ${BB}`, position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ maxWidth: 1360, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* GOLD CARD WRAPPER */}
          <div style={{
            position: 'relative',
            background: `linear-gradient(145deg, #2A1E06 0%, #1A1205 40%, #120D03 100%)`,
            border: `1px solid rgba(232,168,32,0.35)`,
            boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 80px rgba(232,168,32,0.07), inset 0 1px 0 rgba(232,168,32,0.2)`,
            padding: '52px 56px 56px',
            overflow: 'hidden',
          }}>
            {/* Gold top border accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${G5}, ${GL}, #F5C842, ${GL}, ${G5})` }} />
            {/* Ambient glow bottom-left */}
            <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(232,168,32,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

            {/* ✦ STARS / GLITTER — top-right corner ✦ */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 240, height: 200, pointerEvents: 'none', overflow: 'hidden' }}>
              {/* Large anchor stars */}
              {[
                { top: 22, right: 28, size: 22, opacity: 0.85, color: GL, delay: '0s', dur: '2.4s' },
                { top: 14, right: 72, size: 14, opacity: 0.6, color: '#F5C842', delay: '0.7s', dur: '3.1s' },
                { top: 44, right: 52, size: 10, opacity: 0.5, color: W, delay: '1.2s', dur: '2.8s' },
                { top: 8,  right: 118, size: 8,  opacity: 0.45, color: GL, delay: '0.3s', dur: '3.5s' },
                { top: 60, right: 22, size: 16, opacity: 0.55, color: G,  delay: '1.8s', dur: '2.2s' },
                { top: 36, right: 100, size: 7, opacity: 0.4, color: W,  delay: '2.1s', dur: '4s' },
                { top: 80, right: 68, size: 9,  opacity: 0.38, color: GL, delay: '0.9s', dur: '3.3s' },
                { top: 18, right: 158, size: 6, opacity: 0.35, color: '#F5C842', delay: '1.5s', dur: '2.9s' },
                { top: 70, right: 140, size: 5, opacity: 0.3, color: W,  delay: '2.5s', dur: '3.8s' },
                { top: 100, right: 30, size: 7, opacity: 0.28, color: GL, delay: '0.5s', dur: '3.6s' },
              ].map((s, i) => (
                <div key={i} style={{
                  position: 'absolute', top: s.top, right: s.right,
                  fontSize: s.size, color: s.color, opacity: s.opacity,
                  animation: `twinkle ${s.dur} ${s.delay} ease-in-out infinite`,
                  lineHeight: 1,
                }}>✦</div>
              ))}
              {/* Glitter dots */}
              {[
                { top: 30, right: 42, size: 3 }, { top: 55, right: 88, size: 2 },
                { top: 12, right: 95, size: 2.5 }, { top: 90, right: 55, size: 2 },
                { top: 48, right: 130, size: 2 }, { top: 75, right: 110, size: 1.5 },
              ].map((d, i) => (
                <div key={`dot-${i}`} style={{
                  position: 'absolute', top: d.top, right: d.right,
                  width: d.size, height: d.size, borderRadius: '50%',
                  background: i % 2 === 0 ? GL : W, opacity: 0.5,
                  animation: `twinkle ${2.5 + i * 0.4}s ${i * 0.6}s ease-in-out infinite`,
                }} />
              ))}
            </div>

          {/* Section header — editorial typographic style */}
          <div style={{ marginBottom: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 1, height: 64, background: `linear-gradient(to bottom, transparent, ${GL})` }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.42em', textTransform: 'uppercase', color: GL, fontFamily: FD }}>Current Opportunities</div>
                <h2 style={{ fontFamily: FD, fontSize: 'clamp(36px,5vw,68px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
                  <span style={{ color: W }}>Live </span>
                  <span style={{ color: GL, fontStyle: 'italic' }}>Jobs.</span>
                </h2>
                <p style={{ fontSize: 14, color: W55, lineHeight: 1.75, fontFamily: FD }}>
                  3 newest approved positions.
                  {!session && <> <span style={{ color: GL }}>Login or register</span> to apply.</>}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                {!session ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: `rgba(212,136,10,0.08)`, border: `1px solid ${BB}` }}>
                    <span style={{ fontSize: 12, color: GL }}>⬡</span>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GL, fontFamily: FD }}>Members Only</div>
                      <div style={{ fontSize: 11, color: W28, marginTop: 1, fontFamily: FD }}>Login to apply</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: `rgba(192,120,24,0.08)`, border: `1px solid ${BB}` }}>
                    <span style={{ fontSize: 12, color: G3 }}>◉</span>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: G3, fontFamily: FD }}>Logged In</div>
                      <div style={{ fontSize: 11, color: W28, marginTop: 1, fontFamily: FD }}>{session.name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <JobsSection
            jobs={previewJobs}
            isLoggedIn={!!session}
            onLock={() => setLoginPrompt(true)}
            onView={(id) => navigate(`/jobs/${id}`)}
          />

          <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${GL}, transparent)` }} />
            <p style={{ fontSize: 12, color: W28, fontFamily: FD }}>Showing 3 of <strong style={{ color: W55 }}>{totalActiveJobs} active jobs</strong></p>
            <button onClick={() => navigate('/jobs')}
              style={{ fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: 'transparent', border: `1px solid rgba(232,168,32,0.35)`, color: GL, padding: '14px 44px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(232,168,32,0.08)`; e.currentTarget.style.borderColor = GL }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `rgba(232,168,32,0.35)` }}>
              View All {totalActiveJobs} Jobs →
            </button>
          </div>

          </div>{/* end gold card */}
        </div>
      </section>

      {/* ── FEATURES SLIDESHOW (now second, right after jobs) ── */}
      <section
        ref={(el) => { (rFeatures as any).current = el; (secFeatures as any).current = el }}
        className="reveal"
        style={{ padding: '120px 80px', background: B, borderBottom: `1px solid ${BB}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ marginBottom: 52 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 14, fontFamily: FD }}>Platform Capabilities</div>
            <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 900, lineHeight: 1.05 }}>
              Built for<br /><span style={{ color: GL, fontStyle: 'italic' }}>precision.</span>
            </h2>
          </div>
          <FeatureSlideshow />
        </div>
      </section>

      {/* ── ABOUT + CAPABILITIES ── */}
      <section
        ref={(el) => { (rAbout as any).current = el; (secAbout as any).current = el }}
        className="reveal"
        style={{ padding: '0 80px', background: D1, borderBottom: `1px solid ${BB}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '80px 0' }}>
          <div style={{ marginBottom: 52 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 14, fontFamily: FD }}>About the Platform</div>
            <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 900, lineHeight: 1.05 }}>
              One platform.<br /><span style={{ color: GL, fontStyle: 'italic' }}>Infinite scale.</span>
            </h2>
          </div>
          <AboutCapabilities navigate={navigate} />
        </div>
      </section>

      {/* ── IMAGE TRIPTYCH (replaces CTA band) ── */}
      <ImageTriptych />

      {/* ── FOOTER ── */}
      <footer style={{ background: D1, borderTop: `1px solid ${BB}` }}>
        <div style={{ background: B, padding: '56px 80px', borderBottom: `1px solid ${BB}` }}>
          <div style={{ maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 60 }}>
            <div>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, marginBottom: 16 }}><span style={{ color: GL }}>HONEY</span><span style={{ color: W }}> GROUP</span></div>
              <p style={{ fontSize: 13, color: W55, lineHeight: 1.8, maxWidth: 280, marginBottom: 28, fontFamily: FD }}>South Africa's premier promoter management platform. Fully digital. Fully verified.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {['IG', 'LI', 'FB'].map(s => (
                  <div key={s} style={{ width: 36, height: 36, border: `1px solid ${BB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: W28, letterSpacing: '0.05em', transition: 'all 0.25s', fontFamily: FD }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(232,168,32,0.45)`; e.currentTarget.style.color = GL }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = W28 }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
            {[
              { label: 'Platform', links: ['Features', 'Jobs Board', 'Geo Check-In', 'Reports'] },
              { label: 'Company',  links: ['About Us', 'Careers', 'Contact', 'Blog'] },
              { label: 'Legal',    links: ['Privacy Policy', 'POPIA', 'Terms of Use', 'Cookie Policy'] },
            ].map(col => (
              <div key={col.label}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: GL, marginBottom: 22, fontFamily: FD }}>{col.label}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, color: W55, marginBottom: 12, cursor: 'pointer', transition: 'color 0.2s', fontFamily: FD }}
                    onMouseEnter={e => e.currentTarget.style.color = W}
                    onMouseLeave={e => e.currentTarget.style.color = W55}>
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '22px 80px', maxWidth: 1360, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: W28, fontFamily: FD }}>© 2026 Honey Group Promotions. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 28 }}>
            {['POPIA Compliant', 'South Africa', 'Est. 2018'].map(t => (
              <span key={t} style={{ fontSize: 10, color: W28, letterSpacing: '0.08em', fontFamily: FD }}>{t}</span>
            ))}
          </div>
        </div>
      </footer>

      {showLoginPrompt && <LoginPromptModal onClose={() => setLoginPrompt(false)} onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />}
    </div>
  )
}