import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_JOBS, getActiveJobs, getAllJobsWithAdminJobs } from '../jobs/JobsPage';

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

// Jobs section dark overlays (text on gold bg)
const JB  = 'rgba(12,10,7,0.82)'   // near-black text
const JB6 = 'rgba(12,10,7,0.60)'
const JB4 = 'rgba(12,10,7,0.40)'
const JB2 = 'rgba(12,10,7,0.18)'
const JBB = 'rgba(12,10,7,0.22)'   // border on gold

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

  .feat-card-0, .feat-card-1, .feat-card-2 {
    transition: transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.55s ease, z-index 0s;
  }

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

// ── Feature Cards ─────────────────────────────────────────────────────────────
function FeatureSlideshow() {
  const features = [
    {
      tag: 'Smart Dispatch',
      icon: '◎',
      title: 'Right person, right place.',
      body: 'AI-powered matching filters promoters by location, reliability score, and physical attributes — filling your brand activations with precision.',
      stat: '280+', statLabel: 'Active Promoters',
      bg: `linear-gradient(160deg, #1E1608 0%, #120D03 100%)`,
      border: 'rgba(232,168,32,0.30)',
      accent: GL,
      rotate: '-3deg',
      translateY: '12px',
      zIndex: 1,
    },
    {
      tag: 'Geo-Verified Shifts',
      icon: '⬡',
      title: 'Attendance you can trust.',
      body: 'Promoters check in only when within 5m of the venue. GPS verification plus mandatory selfie — no proxy clock-ins, ever.',
      stat: '98%', statLabel: 'Shift Attendance',
      bg: `linear-gradient(160deg, #3D2E0A 0%, #2A1E05 100%)`,
      border: '#AB8D3F',
      accent: '#AB8D3F',
      rotate: '0deg',
      translateY: '0px',
      zIndex: 3,
    },
    {
      tag: 'Smart Payroll',
      icon: '◈',
      title: 'Calculate pay in minutes.',
      body: 'Hours × Rate calculations done instantly. View earnings per promoter and per campaign. Admin approves — no direct payments on-platform.',
      stat: '12', statLabel: 'Cities Covered',
      bg: `linear-gradient(160deg, #1E1608 0%, #120D03 100%)`,
      border: 'rgba(232,168,32,0.30)',
      accent: GL,
      rotate: '3deg',
      translateY: '12px',
      zIndex: 1,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, alignItems: 'flex-start', perspective: '1200px' }}>
      {features.map((f, i) => (
        <div
          key={i}
          className={`feat-card-${i}`}
          style={{
            transform: `rotate(${f.rotate}) translateY(${f.translateY})`,
            zIndex: f.zIndex,
            transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease',
            transformStyle: 'preserve-3d',
            cursor: 'default',
            position: 'relative',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = `rotate(0deg) translateY(-16px) rotateY(4deg)`
            el.style.zIndex = '10'
            el.style.boxShadow = `0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(232,168,32,0.12)`
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = `rotate(${f.rotate}) translateY(${f.translateY})`
            el.style.zIndex = String(f.zIndex)
            el.style.boxShadow = 'none'
          }}
        >
          <div style={{
            background: f.bg,
            border: `1px solid ${f.border}`,
            position: 'relative', overflow: 'hidden',
            boxShadow: i === 1
              ? `0 16px 48px rgba(0,0,0,0.6), 0 0 40px rgba(171,141,63,0.15)`
              : `0 8px 32px rgba(0,0,0,0.5)`,
          }}>
            {/* Top accent bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: i === 1 ? 4 : 2,
              background: i === 1
                ? `linear-gradient(90deg, #6B4F10, #AB8D3F, #D4B86A, #AB8D3F, #6B4F10)`
                : `linear-gradient(90deg, ${G5}, ${GL}, ${G5})`,
            }} />

            {/* Page-fold corner */}
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 0, height: 0,
              borderStyle: 'solid',
              borderWidth: '0 28px 28px 0',
              borderColor: `transparent ${i === 1 ? 'rgba(171,141,63,0.25)' : 'rgba(232,168,32,0.15)'} transparent transparent`,
            }} />

            {/* Content — evenly distributed with flexbox column */}
            <div style={{
              padding: '48px 36px 44px',
              display: 'flex', flexDirection: 'column',
              gap: 0,
              minHeight: 420,
              justifyContent: 'space-between',
            }}>
              {/* Top: tag + icon */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                  <div style={{ width: 20, height: 1, background: f.accent }} />
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase', color: f.accent, fontFamily: FD }}>{f.tag}</span>
                </div>
                <div style={{ fontSize: 48, color: f.accent, lineHeight: 1, marginBottom: 20 }}>{f.icon}</div>
              </div>

              {/* Middle: title + body */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 0 24px' }}>
                <h3 style={{
                  fontFamily: FD, fontSize: 22, fontWeight: 800, lineHeight: 1.2,
                  color: W, marginBottom: 16,
                  letterSpacing: '-0.01em',
                }}>{f.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.8, color: W55, fontFamily: FD }}>{f.body}</p>
              </div>

              {/* Bottom: stat */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                paddingTop: 24,
                borderTop: `1px solid ${i === 1 ? 'rgba(171,141,63,0.2)' : BB}`,
              }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: f.accent, fontFamily: FD, lineHeight: 1 }}>{f.stat}</span>
                <span style={{ fontSize: 11, color: W28, fontFamily: FD, letterSpacing: '0.06em' }}>{f.statLabel}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── About Section — Editorial Brutalist Luxury ────────────────────────────────
function AboutCapabilities({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [hoveredCap, setHoveredCap] = useState<number | null>(null)

  const caps = [
    { label: 'Promoter Onboarding',   icon: '◉' },
    { label: 'Geo Check-In / Out',    icon: '⬡' },
    { label: 'Live Operations Map',   icon: '◎' },
    { label: 'Smart Job Allocation',  icon: '◈' },
    { label: 'Payroll Calculations',  icon: '◆' },
    { label: 'Document Vault',        icon: '▣' },
    { label: 'Supervisor Monitoring', icon: '◉' },
    { label: 'Client Reports',        icon: '◎' },
    { label: 'SMS Notifications',     icon: '⬡' },
    { label: 'Reliability Scoring',   icon: '◈' },
    { label: 'Earnings Export',       icon: '◆' },
    { label: 'POPIA Compliance',      icon: '▣' },
  ]

  return (
    <div>

      {/* ── PART 1: Giant editorial headline row ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderBottom: `1px solid ${BB}`,
      }}>
        {/* Enormous background watermark */}
        <div style={{
          position: 'absolute', top: '-0.15em', left: '-0.05em',
          fontSize: 'clamp(180px, 24vw, 300px)',
          fontWeight: 900, fontFamily: FD,
          color: 'transparent',
          WebkitTextStroke: `1px rgba(232,168,32,0.06)`,
          lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
          zIndex: 0,
        }}>HG</div>

        <div style={{ position: 'relative', zIndex: 1, padding: '64px 0 56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 40, height: 1, background: GL }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.44em', textTransform: 'uppercase', color: GL, fontFamily: FD }}>Est. 2018 · South Africa</span>
          </div>
          <h2 style={{
            fontFamily: "'Bodoni Moda', Georgia, serif",
            fontSize: 'clamp(42px, 5.5vw, 80px)',
            fontWeight: 900, fontStyle: 'italic',
            lineHeight: 0.92, letterSpacing: '-0.03em',
            color: W,
          }}>
            One platform.<br />
            <span style={{ color: 'transparent', WebkitTextStroke: `2px ${GL}` }}>Infinite scale.</span>
          </h2>
        </div>
      </div>

      {/* ── PART 3: Capabilities ── */}
      <div style={{ padding: '56px 0 72px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 48 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.44em', textTransform: 'uppercase', color: GL, fontFamily: FD }}>Full Suite</div>
          <div style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, color: W, fontFamily: FD, letterSpacing: '-0.02em' }}>
            Platform <span style={{ color: GL, fontStyle: 'italic' }}>Capabilities</span>
          </div>
        </div>

        {/* 4-column capability cells with alternating gold/dark highlight */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: `1px solid ${BB}` }}>
          {caps.map((cap, i) => {
            const isHighlight = i === 3 || i === 8
            return (
              <div key={i}
                style={{
                  padding: '22px 24px',
                  borderRight: (i + 1) % 4 !== 0 ? `1px solid ${BB}` : 'none',
                  borderBottom: i < 8 ? `1px solid ${BB}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: hoveredCap === i ? `rgba(171,141,63,0.08)` : isHighlight ? `rgba(232,168,32,0.04)` : 'transparent',
                  transition: 'background 0.25s, transform 0.2s',
                  cursor: 'default',
                  transform: hoveredCap === i ? 'translateX(4px)' : 'translateX(0)',
                  position: 'relative',
                }}
                onMouseEnter={() => setHoveredCap(i)}
                onMouseLeave={() => setHoveredCap(null)}
              >
                {/* Animated left bar on hover */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: hoveredCap === i ? 3 : 0,
                  background: GL,
                  transition: 'width 0.2s ease',
                }} />
                <span style={{ fontSize: 14, color: hoveredCap === i ? GL : W28, transition: 'color 0.2s', flexShrink: 0 }}>{cap.icon}</span>
                <span style={{ fontSize: 12, color: hoveredCap === i ? W : W55, fontFamily: FD, transition: 'color 0.2s', fontWeight: hoveredCap === i ? 600 : 400 }}>{cap.label}</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

// ── Image Triptych ────────────────────────────────────────────────────────────
function ImageTriptych() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: B, borderTop: `1px solid ${BB}` }}>
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
          <div style={{ position: 'absolute', inset: 0, border: `2px solid ${GL}`, pointerEvents: 'none', opacity: 0.4 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${GL}, transparent)` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${GL}, transparent)` }} />
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

  const previewJobs = getActiveJobs(getAllJobsWithAdminJobs()).slice(0, 3)
  const totalActiveJobs = getActiveJobs(getAllJobsWithAdminJobs()).length

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

      {/* ── NAV ── */}
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

      {/* ── HERO ── */}
      <section style={{ height: '75vh', minHeight: 540, maxHeight: 820, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'stretch', background: '#000', marginTop: 68, padding: '28px 48px' }}>

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
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.1) 100%)' }} />

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

          <div style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 10,
            width: 34, height: 34, border: '1px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', background: 'rgba(0,0,0,0.3)',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>⏸</span>
          </div>
        </div>

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

      {/* ── JOBS SECTION — everything on gold background ── */}
      <section
        ref={(el) => { (rJobs as any).current = el; (secJobs as any).current = el }}
        className="reveal"
        style={{
          padding: '48px 80px 52px',
          background: '#AB8D3F',
          borderBottom: `1px solid rgba(120,75,0,0.4)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Depth texture on gold */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at 15% 40%, rgba(255,210,90,0.22) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(90,45,0,0.18) 0%, transparent 50%)',
        }} />

        {/* ✦ Top-left star band ✦ */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 340, height: 340, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          {[
            { top:  12, left:  16, size: 28, opacity: 0.55, delay: '0s',   dur: '2.6s' },
            { top:  10, left:  64, size: 16, opacity: 0.40, delay: '0.5s', dur: '3.2s' },
            { top:  38, left:  36, size: 12, opacity: 0.35, delay: '1.0s', dur: '2.9s' },
            { top:   8, left: 108, size: 10, opacity: 0.28, delay: '0.3s', dur: '3.7s' },
            { top:  60, left:  14, size: 20, opacity: 0.45, delay: '1.4s', dur: '2.4s' },
            { top:  52, left:  72, size:  8, opacity: 0.25, delay: '0.8s', dur: '4.0s' },
            { top:  80, left:  44, size: 14, opacity: 0.32, delay: '2.0s', dur: '3.0s' },
            { top:  28, left: 148, size:  7, opacity: 0.22, delay: '1.7s', dur: '3.5s' },
            { top: 100, left:  20, size: 10, opacity: 0.28, delay: '0.6s', dur: '2.8s' },
            { top:  70, left: 112, size:  6, opacity: 0.20, delay: '2.3s', dur: '3.3s' },
            { top: 118, left:  62, size: 18, opacity: 0.38, delay: '1.1s', dur: '2.7s' },
            { top:  18, left: 190, size:  8, opacity: 0.18, delay: '1.9s', dur: '4.2s' },
            { top: 140, left:  30, size:  8, opacity: 0.22, delay: '0.4s', dur: '3.1s' },
            { top:  92, left: 158, size:  5, opacity: 0.16, delay: '2.6s', dur: '3.8s' },
            { top: 162, left:  84, size: 12, opacity: 0.28, delay: '1.3s', dur: '2.5s' },
            { top:  46, left: 220, size:  6, opacity: 0.14, delay: '2.1s', dur: '3.6s' },
            { top: 130, left: 130, size:  9, opacity: 0.20, delay: '0.9s', dur: '3.4s' },
            { top: 180, left:  50, size:  7, opacity: 0.18, delay: '1.6s', dur: '2.9s' },
          ].map((s, i) => (
            <div key={`tl-${i}`} style={{
              position: 'absolute', top: s.top, left: s.left,
              fontSize: s.size, color: W, opacity: s.opacity,
              animation: `twinkle ${s.dur} ${s.delay} ease-in-out infinite`,
              lineHeight: 1,
            }}>✦</div>
          ))}
        </div>

        {/* ✦ Bottom-right star band ✦ */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 340, height: 340, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          {[
            { bottom:  12, right:  16, size: 28, opacity: 0.55, delay: '0.2s', dur: '2.6s' },
            { bottom:  10, right:  64, size: 16, opacity: 0.40, delay: '0.7s', dur: '3.2s' },
            { bottom:  38, right:  36, size: 12, opacity: 0.35, delay: '1.2s', dur: '2.9s' },
            { bottom:   8, right: 108, size: 10, opacity: 0.28, delay: '0.4s', dur: '3.7s' },
            { bottom:  60, right:  14, size: 20, opacity: 0.45, delay: '1.6s', dur: '2.4s' },
            { bottom:  52, right:  72, size:  8, opacity: 0.25, delay: '0.9s', dur: '4.0s' },
            { bottom:  80, right:  44, size: 14, opacity: 0.32, delay: '2.1s', dur: '3.0s' },
            { bottom:  28, right: 148, size:  7, opacity: 0.22, delay: '1.8s', dur: '3.5s' },
            { bottom: 100, right:  20, size: 10, opacity: 0.28, delay: '0.7s', dur: '2.8s' },
            { bottom:  70, right: 112, size:  6, opacity: 0.20, delay: '2.4s', dur: '3.3s' },
            { bottom: 118, right:  62, size: 18, opacity: 0.38, delay: '1.2s', dur: '2.7s' },
            { bottom:  18, right: 190, size:  8, opacity: 0.18, delay: '2.0s', dur: '4.2s' },
            { bottom: 140, right:  30, size:  8, opacity: 0.22, delay: '0.5s', dur: '3.1s' },
            { bottom:  92, right: 158, size:  5, opacity: 0.16, delay: '2.7s', dur: '3.8s' },
            { bottom: 162, right:  84, size: 12, opacity: 0.28, delay: '1.4s', dur: '2.5s' },
            { bottom:  46, right: 220, size:  6, opacity: 0.14, delay: '2.2s', dur: '3.6s' },
            { bottom: 130, right: 130, size:  9, opacity: 0.20, delay: '1.0s', dur: '3.4s' },
            { bottom: 180, right:  50, size:  7, opacity: 0.18, delay: '1.7s', dur: '2.9s' },
          ].map((s, i) => (
            <div key={`br-${i}`} style={{
              position: 'absolute', bottom: s.bottom, right: s.right,
              fontSize: s.size, color: W, opacity: s.opacity,
              animation: `twinkle ${s.dur} ${s.delay} ease-in-out infinite`,
              lineHeight: 1,
            }}>✦</div>
          ))}
        </div>

        <div style={{ maxWidth: 1360, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Section header — dark text on gold */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
              <div>
                <h2 style={{ fontFamily: FD, fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: 10 }}>
                  <span style={{ color: B }}>Live </span>
                  <span style={{ color: B, fontStyle: 'italic' }}>Jobs.</span>
                </h2>
                <p style={{ fontSize: 13, color: JB6, lineHeight: 1.6, fontFamily: FD }}>
                  3 newest approved positions.
                  {!session && <> <span style={{ color: B, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>Login or register</span> to apply.</>}
                </p>
              </div>
              <div style={{ flexShrink: 0 }}>
                {!session ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: `rgba(12,10,7,0.10)`, border: `1px solid ${JBB}` }}>
                    <span style={{ fontSize: 12, color: B }}>⬡</span>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: B, fontFamily: FD }}>Members Only</div>
                      <div style={{ fontSize: 11, color: JB6, marginTop: 1, fontFamily: FD }}>Login to apply</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: `rgba(12,10,7,0.10)`, border: `1px solid ${JBB}` }}>
                    <span style={{ fontSize: 12, color: B }}>◉</span>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: B, fontFamily: FD }}>Logged In</div>
                      <div style={{ fontSize: 11, color: JB6, marginTop: 1, fontFamily: FD }}>{session.name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job cards */}
          <JobsSection
            jobs={previewJobs}
            isLoggedIn={!!session}
            onLock={() => setLoginPrompt(true)}
            onView={(id) => navigate(`/jobs/${id}`)}
          />

          {/* Footer row */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${B}, transparent)` }} />
            <p style={{ fontSize: 12, color: JB4, fontFamily: FD }}>Showing 3 of <strong style={{ color: JB6 }}>{totalActiveJobs} active jobs</strong></p>
            <button onClick={() => navigate('/jobs')}
              style={{ fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', background: B, border: `1px solid ${B}`, color: GL, padding: '14px 44px', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.background = G5; e.currentTarget.style.borderColor = G5 }}
              onMouseLeave={e => { e.currentTarget.style.background = B; e.currentTarget.style.borderColor = B }}>
              View All {totalActiveJobs} Jobs →
            </button>
          </div>

        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        ref={(el) => { (rFeatures as any).current = el; (secFeatures as any).current = el }}
        className="reveal"
        style={{ padding: '80px 80px 100px', background: B, borderBottom: `1px solid ${BB}` }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            marginBottom: 56, borderBottom: `1px solid ${BB}`, paddingBottom: 32,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.42em', textTransform: 'uppercase', color: GL, fontFamily: FD }}>Platform Capabilities</div>
            <h2 style={{ fontFamily: FD, fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 900, lineHeight: 1, textAlign: 'right' }}>
              Built for <span style={{ color: GL, fontStyle: 'italic' }}>precision.</span>
            </h2>
          </div>
          <FeatureSlideshow />
          {/* About Us button — below cards */}
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => navigate('/about')}
              style={{
                fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
                textTransform: 'uppercase', background: 'transparent',
                border: `1px solid rgba(232,168,32,0.4)`, color: GL,
                padding: '14px 44px', cursor: 'pointer', transition: 'all 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(232,168,32,0.08)`; e.currentTarget.style.borderColor = GL }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `rgba(232,168,32,0.4)` }}>
              About Us →
            </button>
          </div>
        </div>
      </section>

      {/* ── IMAGE TRIPTYCH ── */}
      <ImageTriptych />

      {/* ── GOLD SEPARATOR LINE ── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${G5}, ${GL}, #F5C842, ${GL}, ${G5})` }} />

      {/* ── FOOTER ── */}
      <footer style={{ background: B }}>

        {/* Main footer body */}
        <div style={{ padding: '72px 80px 56px' }}>
          <div style={{ maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 1fr', gap: 80, alignItems: 'start' }}>

            {/* LEFT — Newsletter sign-up */}
            <div>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 800, marginBottom: 32, letterSpacing: '0.01em' }}>
                <span style={{ color: GL }}>HONEY</span><span style={{ color: W }}> GROUP</span>
              </div>
              <h3 style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, color: W, marginBottom: 12, lineHeight: 1.2 }}>Newsletter Sign-Up</h3>
              <p style={{ fontSize: 13, color: W55, lineHeight: 1.75, fontFamily: FD, marginBottom: 28, maxWidth: 300 }}>
                Subscribe to receive our latest opportunities and platform updates directly to your inbox.
              </p>
              {/* Name field */}
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="YOUR NAME"
                  style={{
                    width: '100%', background: 'transparent',
                    border: `1px solid ${BB}`, borderRadius: 0,
                    padding: '14px 16px',
                    fontFamily: FD, fontSize: 11, fontWeight: 500,
                    letterSpacing: '0.12em', color: W55,
                    outline: 'none',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = `rgba(232,168,32,0.5)`}
                  onBlur={e => e.currentTarget.style.borderColor = BB}
                />
              </div>
              {/* Email field */}
              <div style={{ marginBottom: 20 }}>
                <input
                  type="email"
                  placeholder="YOUR EMAIL"
                  style={{
                    width: '100%', background: 'transparent',
                    border: `1px solid ${BB}`, borderRadius: 0,
                    padding: '14px 16px',
                    fontFamily: FD, fontSize: 11, fontWeight: 500,
                    letterSpacing: '0.12em', color: W55,
                    outline: 'none',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = `rgba(232,168,32,0.5)`}
                  onBlur={e => e.currentTarget.style.borderColor = BB}
                />
              </div>
              {/* Submit */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', paddingBottom: 6, borderBottom: `1px solid ${BB}`, width: 'fit-content' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = GL }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = BB }}>
                <span style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: W }}>SUBMIT</span>
                <span style={{ fontSize: 16, color: GL }}>↗</span>
              </div>
            </div>

            {/* CENTRE — Nav links */}
            <div style={{ paddingTop: 8 }}>
              {[
                { label: 'Jobs Board',    href: '/jobs' },
                { label: 'Features',      href: '/#features' },
                { label: 'About',         href: '/#about' },
                { label: 'News & Updates',href: '#' },
                { label: 'Contact',       href: '#' },
              ].map(link => (
                <div key={link.label}
                  style={{
                    padding: '14px 0',
                    borderBottom: `1px solid ${BB}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => link.href !== '#' && navigate(link.href)}
                  onMouseEnter={e => { (e.currentTarget.firstChild as HTMLElement).style.color = GL }}
                  onMouseLeave={e => { (e.currentTarget.firstChild as HTMLElement).style.color = W55 }}
                >
                  <span style={{ fontFamily: FD, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: W55, transition: 'color 0.2s' }}>
                    {link.label}
                  </span>
                </div>
              ))}
            </div>

            {/* RIGHT — Contact info + social */}
            <div style={{ paddingTop: 8 }}>
              {/* Partnership */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: W, marginBottom: 6 }}>Partnership Opportunities</h4>
                <a href="mailto:partnerships@honeygroup.co.za" style={{ fontFamily: FD, fontSize: 13, color: GL, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  partnerships@honeygroup.co.za
                </a>
              </div>
              {/* Career */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: W, marginBottom: 6 }}>Career Opportunities</h4>
                <a href="mailto:careers@honeygroup.co.za" style={{ fontFamily: FD, fontSize: 13, color: GL, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  careers@honeygroup.co.za
                </a>
              </div>
              {/* Press */}
              <div style={{ marginBottom: 36 }}>
                <h4 style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: W, marginBottom: 6 }}>Press</h4>
                <a href="mailto:press@honeygroup.co.za" style={{ fontFamily: FD, fontSize: 13, color: GL, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  press@honeygroup.co.za
                </a>
              </div>
              {/* Social icons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
                {[
                  { label: 'LI', title: 'LinkedIn' },
                  { label: 'IG', title: 'Instagram' },
                  { label: 'FB', title: 'Facebook' },
                ].map(s => (
                  <div key={s.label} title={s.title} style={{
                    width: 38, height: 38,
                    border: `1px solid ${BB}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.25s',
                    fontSize: 10, fontWeight: 700, color: W28, fontFamily: FD, letterSpacing: '0.04em',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(232,168,32,0.5)`; e.currentTarget.style.color = GL; e.currentTarget.style.background = `rgba(232,168,32,0.06)` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = W28; e.currentTarget.style.background = 'transparent' }}>
                    {s.label}
                  </div>
                ))}
              </div>
              {/* Copyright tucked into right column */}
              <div style={{ borderTop: `1px solid ${BB}`, paddingTop: 24 }}>
                <p style={{ fontSize: 11, color: W28, fontFamily: FD, marginBottom: 12 }}>©2026 Honey Group Promotions. All rights reserved.</p>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {['Privacy Policy', 'POPIA Compliant', 'Terms of Use'].map(t => (
                    <span key={t} style={{ fontSize: 10, color: W28, letterSpacing: '0.06em', fontFamily: FD, cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = GL}
                      onMouseLeave={e => e.currentTarget.style.color = W28}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      </footer>

      {showLoginPrompt && <LoginPromptModal onClose={() => setLoginPrompt(false)} onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />}
    </div>
  )
}