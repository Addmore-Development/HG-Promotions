import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_JOBS, getActiveJobs } from '../jobs/JobsPage';

// ── Color tokens — matching admin dashboard palette ──────────────────────────
const GL = '#E8A820'   // bright gold — primary accent
const G  = '#D4880A'   // gold
const G3 = '#C07818'   // mid amber
const G5 = '#6B3F10'   // darkest brown
const B  = '#0C0A07'   // near-black background
const D1 = '#141008'
const D2 = '#1A1408'
const W  = '#FAF3E8'   // warm white
const W85 = 'rgba(250,243,232,0.85)'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'
const W12 = 'rgba(250,243,232,0.12)'
const BB  = 'rgba(212,136,10,0.16)'

const FD = "'Playfair Display', Georgia, serif"

// ── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700&display=swap');
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
  @keyframes orbit { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes counter-orbit { 0%{transform:rotate(0deg)} 100%{transform:rotate(-360deg)} }
  @keyframes twinkle { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
  @keyframes glitter-drift { 0%{transform:translateY(0) rotate(0deg);opacity:0.6} 100%{transform:translateY(-80px) rotate(180deg);opacity:0} }
  @keyframes pyramid-glow { 0%,100%{box-shadow:0 0 0 0 rgba(232,168,32,0)} 50%{box-shadow:0 0 32px 8px rgba(232,168,32,0.18)} }

  .nav-link { color: ${W55}; background: none; border: none; cursor: pointer; font-family: ${FD}; font-size: 12px; font-weight: 400; letter-spacing: 0.12em; padding: 0; transition: color 0.25s; }
  .nav-link:hover { color: ${GL}; }

  .ticker-wrap { overflow: hidden; border-top: 1px solid ${BB}; border-bottom: 1px solid ${BB}; background: ${D1}; }
  .ticker-inner { display: flex; white-space: nowrap; animation: ticker 28s linear infinite; }
  .ticker-item { padding: 0 56px; font-size: 10px; font-weight: 500; letter-spacing: 0.3em; text-transform: uppercase; color: ${W28}; display: flex; align-items: center; gap: 24px; height: 42px; font-family: ${FD}; }
  .ticker-item span { color: ${GL}; font-size: 8px; }

  .feat-slide-enter { animation: feature-in 0.65s cubic-bezier(0.22,1,0.36,1) both; }
  .feat-slide-exit  { animation: feature-out 0.45s cubic-bezier(0.22,1,0.36,1) both; }
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

// ── Glitter particles ─────────────────────────────────────────────────────────
function GlitterField() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${20 + Math.random() * 70}%`,
    size: 2 + Math.random() * 3,
    delay: `${Math.random() * 5}s`,
    dur: `${3 + Math.random() * 4}s`,
    color: Math.random() > 0.6 ? W : Math.random() > 0.4 ? GL : G,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, top: p.top,
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.color, opacity: 0.6,
          animation: `glitter-drift ${p.dur} ${p.delay} ease-in infinite, twinkle ${p.dur} ${p.delay} ease-in-out infinite`,
        }} />
      ))}
      {/* Star glitter */}
      {Array.from({ length: 16 }, (_, i) => (
        <div key={`star-${i}`} style={{
          position: 'absolute',
          left: `${5 + Math.random() * 90}%`,
          top: `${10 + Math.random() * 80}%`,
          fontSize: `${8 + Math.random() * 8}px`,
          color: Math.random() > 0.5 ? GL : W,
          opacity: 0.4,
          animation: `twinkle ${2 + Math.random() * 3}s ${Math.random() * 4}s ease-in-out infinite`,
        }}>✦</div>
      ))}
    </div>
  )
}

// ── Pyramid Job Cards ─────────────────────────────────────────────────────────
function PyramidJobs({ jobs, isLoggedIn, onLock, onView }: {
  jobs: ReturnType<typeof getActiveJobs>
  isLoggedIn: boolean
  onLock: () => void
  onView: (id: string) => void
}) {
  // Layout: top 1, middle 2, bottom 1 — orbiting clockwise
  const [orbitAngle, setOrbitAngle] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setOrbitAngle(a => (a + 0.4) % 360)
    }, 30)
    return () => clearInterval(id)
  }, [])

  const preview = jobs.slice(0, 4)

  // Pyramid positions (relative to center) — orbiting offsets
  const rad = (deg: number) => (deg * Math.PI) / 180
  const orbit = [0, 1, 2, 3].map(i => {
    const angle = orbitAngle + i * 90 // 4 positions, 90° apart
    const rx = 28, ry = 14 // elliptical orbit
    return { dx: Math.cos(rad(angle)) * rx, dy: Math.sin(rad(angle)) * ry }
  })

  // Static pyramid grid positions — orbit adds a subtle float
  const basePositions = [
    { gridCol: '2 / 3', gridRow: '1 / 2', label: 'TOP' },
    { gridCol: '1 / 2', gridRow: '2 / 3', label: 'MID-L' },
    { gridCol: '3 / 4', gridRow: '2 / 3', label: 'MID-R' },
    { gridCol: '2 / 3', gridRow: '3 / 4', label: 'BOT' },
  ]

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <GlitterField />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: 'auto auto auto',
        gap: 24,
        maxWidth: 960,
        margin: '0 auto',
        padding: '20px 0 40px',
        position: 'relative',
      }}>
        {preview.map((job, i) => {
          const pos = basePositions[i]
          const o = orbit[i]
          const isHov = hovered === i
          const payNum = parseInt(job.pay.replace(/\D/g, ''))

          return (
            <div key={job.id} style={{
              gridColumn: pos.gridCol,
              gridRow: pos.gridRow,
              transform: `translate(${o.dx * 0.6}px, ${o.dy * 0.6}px)`,
              transition: 'transform 0.1s linear',
              zIndex: isHov ? 10 : 1,
            }}>
              <div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'relative', overflow: 'hidden',
                  background: `linear-gradient(145deg, ${D2} 0%, rgba(26,20,8,0.98) 100%)`,
                  border: `1px solid ${isHov ? GL : BB}`,
                  transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
                  cursor: 'pointer',
                  transform: isHov ? 'translateY(-6px) scale(1.02)' : 'none',
                  boxShadow: isHov
                    ? `0 28px 60px rgba(0,0,0,0.7), 0 0 0 1px ${GL}44, 0 0 40px ${GL}22`
                    : `0 4px 24px rgba(0,0,0,0.4)`,
                  animation: 'pyramid-glow 4s ease-in-out infinite',
                  animationDelay: `${i * 0.8}s`,
                }}
              >
                {/* Gold top bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${G5}, ${GL}, ${G5})` }} />

                {/* Glitter overlay */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                  {[...Array(6)].map((_, si) => (
                    <div key={si} style={{
                      position: 'absolute',
                      left: `${10 + si * 15}%`, top: `${20 + (si % 3) * 25}%`,
                      fontSize: `${6 + si % 4}px`, color: si % 2 === 0 ? GL : W,
                      opacity: 0.25,
                      animation: `twinkle ${2 + si * 0.5}s ${si * 0.3}s ease-in-out infinite`,
                    }}>★</div>
                  ))}
                </div>

                <div style={{ position: 'relative', padding: '22px 22px 18px' }}>
                  {/* Company + Pay header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `linear-gradient(145deg, ${G5}, rgba(107,63,16,0.4))`,
                        border: `1px solid ${BB}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: GL, flexShrink: 0, fontFamily: FD,
                      }}>
                        {job.companyInitial}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: GL, fontWeight: 700, letterSpacing: '0.05em', fontFamily: FD }}>{job.company}</div>
                        <div style={{ fontSize: 9, color: W28, marginTop: 1, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FD }}>{job.type}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: FD, fontSize: 19, fontWeight: 700, color: GL, lineHeight: 1 }}>{job.pay}</div>
                      <div style={{ fontSize: 9, color: W28, marginTop: 2, fontFamily: FD }}>{job.payPer}</div>
                    </div>
                  </div>

                  <h3 style={{ fontFamily: FD, fontSize: 15, fontWeight: 700, color: W, lineHeight: 1.3, marginBottom: 12 }}>{job.title}</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                    {[
                      { icon: '◎', text: job.location },
                      { icon: '◈', text: job.date },
                      { icon: '◉', text: `${job.duration} · ${job.slots} slots` },
                    ].map((m, mi) => (
                      <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 9, color: GL, flexShrink: 0 }}>{m.icon}</span>
                        <span style={{ fontSize: 11, color: W55, fontFamily: FD }}>{m.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Slots bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 9, color: W28, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FD }}>Slots</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: job.slotsLeft <= 2 ? '#EF9060' : GL, fontFamily: FD }}>{job.slotsLeft} left</span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(250,243,232,0.08)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round(((job.slots - job.slotsLeft) / job.slots) * 100)}%`,
                        background: `linear-gradient(90deg, ${G5}, ${GL})`,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>

                  {isLoggedIn ? (
                    <button onClick={() => onView(job.id)} style={{
                      width: '100%', padding: '11px',
                      border: `1px solid ${BB}`,
                      background: isHov ? `rgba(232,168,32,0.12)` : 'transparent',
                      color: GL, fontFamily: FD, fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.25s',
                    }}>
                      View Full Details →
                    </button>
                  ) : (
                    <button onClick={onLock} style={{
                      width: '100%', padding: '11px',
                      border: `1px solid ${BB}`,
                      background: isHov ? W12 : 'transparent',
                      color: isHov ? W85 : W55, fontFamily: FD, fontSize: 10,
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
    {
      tag: 'Smart Dispatch', icon: '◎',
      title: 'Right person, right place.',
      body: 'AI-powered matching filters promoters by location, reliability score, and physical attributes — filling your brand activations with precision.',
      stat: '280+', statLabel: 'Active Promoters',
    },
    {
      tag: 'Geo-Verified Shifts', icon: '⬡',
      title: 'Attendance you can trust.',
      body: 'Promoters check in only when within 200m of the venue. GPS verification plus mandatory selfie — no proxy clock-ins, ever.',
      stat: '98%', statLabel: 'Shift Attendance',
    },
    {
      tag: 'Smart Payroll', icon: '◈',
      title: 'Calculate pay in minutes.',
      body: 'Hours × Rate calculations done instantly. View earnings per promoter and per campaign. Admin approves — no direct payments on-platform.',
      stat: '12', statLabel: 'Cities Covered',
    },
  ]

  const advance = (toIdx: number) => {
    setExiting(true)
    setTimeout(() => {
      setDisplayIdx(toIdx)
      setActive(toIdx)
      setExiting(false)
    }, 450)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      advance((active + 1) % features.length)
    }, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [active])

  const f = features[displayIdx]

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40, justifyContent: 'flex-end' }}>
        {features.map((_, i) => (
          <button key={i} onClick={() => { if (timerRef.current) clearInterval(timerRef.current); advance(i) }}
            style={{
              width: i === active ? 36 : 10, height: 4, border: 'none', cursor: 'pointer',
              background: i === active ? GL : `rgba(232,168,32,0.22)`,
              transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
              borderRadius: 2,
            }} />
        ))}
      </div>

      {/* Slide */}
      <div
        key={displayIdx}
        className={exiting ? 'feat-slide-exit' : 'feat-slide-enter'}
        style={{
          display: 'grid', gridTemplateColumns: '1fr 340px', gap: 80, alignItems: 'center',
          background: `linear-gradient(135deg, ${D2} 0%, ${D1} 100%)`,
          border: `1px solid ${BB}`, padding: '64px 72px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Decorative accent */}
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
        </div>

        {/* Stat card */}
        <div style={{
          background: `rgba(20,16,5,0.8)`, backdropFilter: 'blur(8px)',
          border: `1px solid ${BB}`, padding: '44px 40px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: GL }} />
          <div style={{ fontFamily: FD, fontSize: 72, fontWeight: 900, color: GL, lineHeight: 1, marginBottom: 8 }}>{f.stat}</div>
          <div style={{ fontSize: 12, color: W55, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: FD }}>{f.statLabel}</div>
          <div style={{ marginTop: 32, display: 'flex', gap: 8, justifyContent: 'center' }}>
            {features.map((_, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === active ? GL : W12, transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [showLoginPrompt, setLoginPrompt] = useState(false)
  const [session, setSession] = useState<{ role: string; name: string; email: string } | null>(null)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    const s = localStorage.getItem('hg_session')
    if (s) { try { setSession(JSON.parse(s)) } catch {} }
  }, [])

  const previewJobs = getActiveJobs(ALL_JOBS).slice(0, 4)
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
  const rCaps     = useReveal()
  const rCta      = useReveal()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (ref: React.RefObject<HTMLElement>) => ref.current?.scrollIntoView({ behavior: 'smooth' })

  const caps = [
    'Promoter Onboarding', 'Geo Check-In / Out', 'Live Operations Map',
    'Smart Job Allocation', 'Payroll Calculations', 'Document Vault',
    'Supervisor Monitoring', 'Client Reports', 'SMS Notifications',
    'Reliability Scoring', 'Earnings Export', 'POPIA Compliance',
  ]

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

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        padding: scrolled ? '14px 80px' : '28px 80px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(12,10,7,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(28px)' : 'none',
        borderBottom: scrolled ? `1px solid ${BB}` : 'none',
        transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ fontFamily: FD, fontSize: 19, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span style={{ color: GL }}>HONEY</span><span style={{ color: W }}> GROUP</span>
        </div>

        <ul style={{ display: 'flex', gap: 48, listStyle: 'none' }}>
          {[
            { label: 'Features', ref: secFeatures },
            { label: 'Jobs',     ref: secJobs },
            { label: 'About',    ref: secAbout },
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
                style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', background: GL, border: 'none', color: B, padding: '10px 26px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = G }}
                onMouseLeave={e => { e.currentTarget.style.background = GL }}>
                My Dashboard
              </button>
              <button onClick={handleLogout}
                style={{ fontFamily: FD, fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${BB}`, color: W55, padding: '10px 20px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(139,90,26,0.6)`; e.currentTarget.style.color = `#C8A090` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = W55 }}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')}
                style={{ fontFamily: FD, fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${BB}`, color: W, padding: '10px 26px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(232,168,32,0.45)`; e.currentTarget.style.color = GL }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = W }}>
                Log In
              </button>
              <button onClick={() => navigate('/register')}
                style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', background: GL, border: 'none', color: B, padding: '10px 28px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = GL; e.currentTarget.style.transform = 'translateY(0)' }}>
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {!videoError ? (
            <video autoPlay muted loop playsInline onError={() => setVideoError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}>
              <source src="/assets/hero-reel.mp4" type="video/mp4" />
            </video>
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, #1A1408 0%, #0C0A07 50%, #140E04 100%)` }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse at 60% 40%, rgba(232,168,32,0.1) 0%, transparent 60%)` }} />
              <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: `linear-gradient(${GL} 1px, transparent 1px), linear-gradient(90deg, ${GL} 1px, transparent 1px)`, backgroundSize: '64px 64px' }} />
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,10,7,1) 0%, rgba(12,10,7,0.7) 30%, rgba(12,10,7,0.25) 60%, rgba(12,10,7,0.5) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(12,10,7,0.85) 0%, rgba(12,10,7,0.2) 55%, transparent 100%)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1360, margin: '0 auto', padding: '0 80px 120px', display: 'grid', gridTemplateColumns: '1fr 0.45fr', gap: 80, alignItems: 'flex-end' }}>
          <div style={{ animation: 'hero-fade 1s 0.2s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 36, height: 1, background: GL }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.42em', textTransform: 'uppercase', color: GL, fontFamily: FD }}>National Promoter Platform</span>
            </div>
            <h1 style={{ fontFamily: FD, fontSize: 'clamp(38px, 5.5vw, 76px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 28 }}>
              <span style={{ color: W }}>We put </span>
              <span style={{ color: GL, fontStyle: 'italic' }}>promoters</span>
              <br />
              <span style={{ color: W }}>centre stage.</span>
            </h1>
            <p style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.8, color: W55, maxWidth: 480, marginBottom: 44, fontFamily: FD }}>
              Honey Group manages 280+ brand promoters across South Africa — now fully digital. From onboarding to geo-verified shifts to payroll calculations.
            </p>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {session ? (
                <>
                  <button onClick={handleDashboard}
                    style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: GL, color: B, border: 'none', padding: '18px 52px', cursor: 'pointer', transition: 'all 0.3s', animation: 'pulse-ring 3s 2s infinite' }}
                    onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = GL; e.currentTarget.style.transform = 'translateY(0)' }}>
                    Go to Dashboard
                  </button>
                  <button onClick={() => navigate('/jobs')}
                    style={{ fontFamily: FD, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'transparent', color: W85, border: `1px solid ${BB}`, padding: '18px 40px', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(232,168,32,0.45)`; e.currentTarget.style.color = GL }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = W85 }}>
                    Browse Jobs ↓
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/register')}
                    style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: GL, color: B, border: 'none', padding: '18px 52px', cursor: 'pointer', transition: 'all 0.3s', animation: 'pulse-ring 3s 2s infinite' }}
                    onMouseEnter={e => { e.currentTarget.style.background = G; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = GL; e.currentTarget.style.transform = 'translateY(0)' }}>
                    Join as a Promoter
                  </button>
                  <button onClick={() => navigate('/jobs')}
                    style={{ fontFamily: FD, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'transparent', color: W85, border: `1px solid ${BB}`, padding: '18px 40px', cursor: 'pointer', transition: 'all 0.3s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(232,168,32,0.45)`; e.currentTarget.style.color = GL }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = W85 }}>
                    Browse Jobs ↓
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats panel */}
          <div style={{ animation: 'hero-fade 1s 0.5s cubic-bezier(0.22,1,0.36,1) both', background: 'rgba(20,16,5,0.72)', backdropFilter: 'blur(20px)', border: `1px solid ${BB}`, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G5}, ${GL}, ${G5})` }} />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', color: GL, marginBottom: 28, fontFamily: FD }}>Platform at a Glance</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: BB }}>
              {stats.map((s, i) => (
                <div key={i} style={{ background: D2, padding: '22px 18px' }}>
                  <div style={{ fontFamily: FD, fontSize: 32, fontWeight: 700, color: W, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: W28, letterSpacing: '0.1em', fontFamily: FD }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: W28, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', zIndex: 3, fontFamily: FD }}>
          <div style={{ width: 1, height: 48, background: `linear-gradient(to bottom, ${GL}, transparent)` }} />
          Scroll
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="ticker-item">
              <span>◆</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES SLIDESHOW ── */}
      <section
        ref={(el) => { (rFeatures as any).current = el; (secFeatures as any).current = el }}
        className="reveal"
        style={{ padding: '120px 80px', background: D1, borderBottom: `1px solid ${BB}` }}>
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

      {/* ── JOBS PREVIEW — PYRAMID ── */}
      <section
        ref={(el) => { (rJobs as any).current = el; (secJobs as any).current = el }}
        className="reveal"
        style={{ padding: '100px 80px', background: B, borderBottom: `1px solid ${BB}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 14, fontFamily: FD }}>Current Opportunities</div>
              <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 900, lineHeight: 1 }}>Live Jobs</h2>
              <p style={{ fontSize: 14, color: W55, marginTop: 12, maxWidth: 460, lineHeight: 1.75, fontFamily: FD }}>
                4 newest approved positions.
                {!session && <> <span style={{ color: GL }}> Login or register</span> to apply.</>}
              </p>
            </div>
            <div>
              {!session ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px', background: `rgba(212,136,10,0.08)`, border: `1px solid ${BB}` }}>
                  <span style={{ fontSize: 14, color: GL }}>⬡</span>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GL, fontFamily: FD }}>Members Only</div>
                    <div style={{ fontSize: 11, color: W28, marginTop: 2, fontFamily: FD }}>Login to apply</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px', background: `rgba(192,120,24,0.08)`, border: `1px solid ${BB}` }}>
                  <span style={{ fontSize: 14, color: G3 }}>◉</span>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: G3, fontFamily: FD }}>Logged In</div>
                    <div style={{ fontSize: 11, color: W28, marginTop: 2, fontFamily: FD }}>{session.name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <PyramidJobs
            jobs={previewJobs}
            isLoggedIn={!!session}
            onLock={() => setLoginPrompt(true)}
            onView={(id) => navigate(`/jobs/${id}`)}
          />

          <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${GL}, transparent)` }} />
            <p style={{ fontSize: 12, color: W28, fontFamily: FD }}>Showing 4 of <strong style={{ color: W55 }}>{totalActiveJobs} active jobs</strong></p>
            <button onClick={() => navigate('/jobs')}
              style={{ fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: 'transparent', border: `1px solid rgba(232,168,32,0.35)`, color: GL, padding: '14px 44px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(232,168,32,0.08)`; e.currentTarget.style.borderColor = GL }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `rgba(232,168,32,0.35)` }}>
              View All {totalActiveJobs} Jobs →
            </button>
          </div>
        </div>
      </section>

      {/* ── ABOUT / ROLES ── */}
      <section
        ref={(el) => { (rAbout as any).current = el; (secAbout as any).current = el }}
        className="reveal"
        style={{ padding: '120px 80px', background: D1, borderBottom: `1px solid ${BB}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 14, fontFamily: FD }}>About the Platform</div>
              <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,54px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 28 }}>
                Three roles.<br /><span style={{ color: GL, fontStyle: 'italic' }}>One platform.</span>
              </h2>
              <p style={{ fontSize: 15, color: W55, lineHeight: 1.8, marginBottom: 32, fontFamily: FD }}>
                Honey Group Promotions is South Africa's premier digital promoter management platform. We connect brands with vetted, geo-verified promoters — managed through a single, powerful platform.
              </p>
              <button onClick={() => navigate('/register')}
                style={{ fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', background: GL, color: B, border: 'none', padding: '14px 36px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = G }}
                onMouseLeave={e => { e.currentTarget.style.background = GL }}>
                Get Started
              </button>
            </div>
            <div style={{ background: D2, border: `1px solid ${BB}`, padding: '40px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G5}, ${GL}, ${G5})` }} />
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: GL, marginBottom: 24, fontFamily: FD }}>Who We Serve</div>
              {[
                { role: 'Promoter', icon: '◉', color: G3, desc: 'View jobs, geo check-in, track earnings, upload documents.' },
                { role: 'Supervisor', icon: '◈', color: GL, desc: 'Monitor attendance live, flag issues, view team profiles.' },
                { role: 'Admin', icon: '◆', color: GL, desc: 'Create jobs, manage users, calculate payroll, generate reports.' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '18px 0', borderBottom: i < 2 ? `1px solid ${BB}` : 'none' }}>
                  <div style={{ fontSize: 20, color: r.color, flexShrink: 0, marginTop: 2 }}>{r.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: W, marginBottom: 4, fontFamily: FD }}>{r.role}</div>
                    <div style={{ fontSize: 12, color: W55, lineHeight: 1.6, fontFamily: FD }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section ref={rCaps} className="reveal" style={{ padding: '100px 80px', background: B, borderBottom: `1px solid ${BB}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 14, fontFamily: FD }}>Full Suite</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,56px)', fontWeight: 900, marginBottom: 56 }}>Capabilities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `1px solid ${BB}` }}>
            {caps.map((cap, i) => (
              <div key={i}
                style={{ padding: '24px 26px', borderRight: i % 4 < 3 ? `1px solid ${BB}` : 'none', borderBottom: i < 8 ? `1px solid ${BB}` : 'none', background: B, display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.3s, color 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.background = D2; (e.currentTarget.querySelector('span') as HTMLElement).style.color = W85 }}
                onMouseLeave={e => { e.currentTarget.style.background = B; (e.currentTarget.querySelector('span') as HTMLElement).style.color = W55 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: GL, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: W55, transition: 'color 0.3s', fontFamily: FD }}>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section ref={rCta} className="reveal" style={{ background: GL, padding: '110px 80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.07) 1px,transparent 1px)', backgroundSize: '44px 44px' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.42)', marginBottom: 22, fontFamily: FD }}>Ready to Scale?</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(36px,5.5vw,72px)', fontWeight: 900, color: B, lineHeight: 1, marginBottom: 44 }}>
            Join the platform<br /><span style={{ fontStyle: 'italic' }}>powering SA promotions.</span>
          </h2>
          {session ? (
            <button onClick={handleDashboard}
              style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: B, color: GL, border: 'none', padding: '20px 56px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1A1408'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = B; e.currentTarget.style.transform = 'translateY(0)' }}>
              Go to Dashboard
            </button>
          ) : (
            <button onClick={() => navigate('/register')}
              style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: B, color: GL, border: 'none', padding: '20px 56px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1A1408'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = B; e.currentTarget.style.transform = 'translateY(0)' }}>
              Register Now — It's Free
            </button>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: D1, borderTop: `1px solid ${BB}`, paddingTop: 0 }}>
        <div style={{ background: B, padding: '56px 80px', borderBottom: `1px solid ${BB}` }}>
          <div style={{ maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 60 }}>
            <div>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, marginBottom: 16 }}><span style={{ color: GL }}>HONEY</span><span style={{ color: W }}> GROUP</span></div>
              <p style={{ fontSize: 13, color: W55, lineHeight: 1.8, maxWidth: 280, marginBottom: 28, fontFamily: FD }}>
                South Africa's premier promoter management platform. Fully digital. Fully verified.
              </p>
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