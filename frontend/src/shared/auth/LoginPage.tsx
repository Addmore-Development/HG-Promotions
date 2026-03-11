import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── DESIGN TOKENS (mirrored from LandingPage) ──────────────── */
const BLACK        = '#080808'
const BLACK_CARD   = '#161616'
const BLACK_BORDER = 'rgba(255,255,255,0.07)'
const GOLD         = '#C4973A'
const GOLD_LIGHT   = '#DDB55A'
const GOLD_MUTED   = 'rgba(196,151,58,0.08)'
const WHITE        = '#F4EFE6'
const WHITE_MUTED  = 'rgba(244,239,230,0.55)'
const WHITE_DIM    = 'rgba(244,239,230,0.22)'
const FD           = "'Playfair Display', Georgia, serif"
const FB           = "'DM Sans', system-ui, sans-serif"

/* ─── ROLE CONFIG ────────────────────────────────────────────── */
type Role = 'promoter' | 'business' | 'admin'

const ROLE_CONFIG: Record<Role, { label: string; icon: string; accentColor: string; description: string }> = {
  promoter: {
    label:       'Promoter',
    icon:        '◉',
    accentColor: '#3A7BD5',
    description: 'Access your shifts, geo check-in, and earnings dashboard.',
  },
  business: {
    label:       'Business',
    icon:        '◈',
    accentColor: GOLD,
    description: 'Manage your promoter teams, monitor attendance, and view reports.',
  },
  admin: {
    label:       'Admin',
    icon:        '◆',
    accentColor: '#8B5CF6',
    description: 'Full platform access — users, jobs, payroll, and operations.',
  },
}

/* ─── HARDCODED ADMIN CREDENTIALS (embedded, not registerable) ─ */
const ADMIN_CREDENTIALS = {
  email:    'admin@honeygroup.co.za',
  password: 'Admin@HG2026!',
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { -webkit-font-smoothing: antialiased; background: ${BLACK}; }
  @keyframes hg-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .hg-form-wrap { animation: hg-fade-up 0.55s ease both; }
  input::placeholder { color: rgba(244,239,230,0.15); }
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 30px #0e0e0e inset !important;
    -webkit-text-fill-color: ${WHITE} !important;
  }
`

function FloatingInput({
  label, type = 'text', placeholder, value, onChange, focused, onFocus, onBlur, accentColor,
}: {
  label: string; type?: string; placeholder: string; value: string
  onChange: (v: string) => void; focused: boolean
  onFocus: () => void; onBlur: () => void; accentColor: string
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: FB, fontSize: 10, fontWeight: 600,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: focused ? accentColor : WHITE_MUTED,
        marginBottom: 8, transition: 'color 0.2s',
      }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${focused ? accentColor : BLACK_BORDER}`,
          padding: '14px 16px',
          fontFamily: FB, fontSize: 14, color: WHITE,
          outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: focused ? `0 0 0 3px ${accentColor}18` : 'none',
        }}
      />
    </div>
  )
}

export default function LoginPage() {
  const navigate                  = useNavigate()
  const [role, setRole]           = useState<Role>('promoter')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [focusedField, setFocused] = useState<string | null>(null)

  const cfg = ROLE_CONFIG[role]

  const handleLogin = async () => {
    setError(null)
    if (!email || !password) { setError('Please enter your email and password.'); return }

    setLoading(true)
    await new Promise(r => setTimeout(r, 700)) // simulate async

    /* ── Admin hard-coded credentials ── */
    if (role === 'admin') {
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const session = { role: 'admin', email, name: 'Administrator', loggedIn: true }
        localStorage.setItem('hg_session', JSON.stringify(session))
        setSuccess(true)
        setTimeout(() => navigate('/admin'), 900)
        setLoading(false); return
      } else {
        setError('Invalid admin credentials.')
        setLoading(false); return
      }
    }

    /* ── Promoter / Business — check localStorage registrations ── */
    const allUsers: Record<string, unknown>[] = JSON.parse(localStorage.getItem('hg_users') || '[]')
    const match = allUsers.find((u: Record<string, unknown>) => u.email === email && u.role === role)
    if (!match) {
      setError(`No ${cfg.label} account found with this email.`)
      setLoading(false); return
    }
    if (match.password !== password) {
      setError('Incorrect password. Please try again.')
      setLoading(false); return
    }

    const session = { role, email, name: match.fullName || match.contactName || email, loggedIn: true, status: match.status }
    localStorage.setItem('hg_session', JSON.stringify(session))
    setSuccess(true)

    const redirectMap: Record<Role, string> = {
      promoter: '/promoter/dashboard',
      business: '/business/dashboard',
      admin:    '/admin/dashboard',
    }
    setTimeout(() => navigate(redirectMap[role]), 900)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: BLACK,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FB, padding: '40px 16px', position: 'relative', overflow: 'hidden',
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.025,
        backgroundImage: `linear-gradient(${GOLD} 1px,transparent 1px),linear-gradient(90deg,${GOLD} 1px,transparent 1px)`,
        backgroundSize: '72px 72px',
      }} />

      {/* Radial glow — shifts with role */}
      <div style={{
        position: 'fixed', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 400, borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse, ${cfg.accentColor}12 0%, transparent 70%)`,
        transition: 'background 0.6s ease',
      }} />

      {/* Decorative concentric rings */}
      <div style={{
        position: 'fixed', right: -240, top: '50%', transform: 'translateY(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        border: '1px solid rgba(196,151,58,0.06)', pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{ position: 'absolute', inset: 80, borderRadius: '50%', border: '1px solid rgba(196,151,58,0.04)' }} />
      </div>

      <div className="hg-form-wrap" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            <span style={{ color: GOLD }}>HONEY</span>
            <span style={{ color: WHITE }}> GROUP</span>
          </div>
          <div style={{ width: 32, height: 1, background: GOLD, margin: '0 auto 18px' }} />
          <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: WHITE_MUTED }}>
            Platform Login
          </p>
        </div>

        {/* Role tabs */}
        <div style={{
          display: 'flex', background: '#0d0d0d',
          border: `1px solid ${BLACK_BORDER}`, padding: 4, marginBottom: 28, gap: 4,
        }}>
          {(Object.keys(ROLE_CONFIG) as Role[]).map(r => {
            const c = ROLE_CONFIG[r]
            const active = role === r
            return (
              <button key={r} onClick={() => { setRole(r); setError(null) }}
                style={{
                  flex: 1, padding: '11px 8px',
                  background: active ? `${c.accentColor}14` : 'transparent',
                  border: active ? `1px solid ${c.accentColor}55` : '1px solid transparent',
                  color: active ? c.accentColor : WHITE_DIM,
                  fontFamily: FB, fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = WHITE_MUTED }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = WHITE_DIM }}
              >
                <span style={{ fontSize: 13 }}>{c.icon}</span>
                {c.label}
              </button>
            )
          })}
        </div>

        {/* Card */}
        <div style={{
          background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`,
          padding: '44px 40px', position: 'relative',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
        }}>
          {/* Top accent bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cfg.accentColor, transition: 'background 0.4s' }} />

          {/* Role description pill */}
          <div style={{
            background: `${cfg.accentColor}0f`,
            border: `1px solid ${cfg.accentColor}30`,
            padding: '10px 14px', marginBottom: 32, transition: 'all 0.4s',
          }}>
            <p style={{ fontFamily: FB, fontSize: 12, color: cfg.accentColor, margin: 0, lineHeight: 1.5, transition: 'color 0.4s' }}>
              {cfg.description}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FloatingInput
              label="Email Address"
              type="email"
              placeholder="you@honeygroup.co.za"
              value={email}
              onChange={setEmail}
              focused={focusedField === 'email'}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              accentColor={cfg.accentColor}
            />
            <FloatingInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              focused={focusedField === 'password'}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              accentColor={cfg.accentColor}
            />
          </div>

          {error && (
            <div style={{
              marginTop: 18, padding: '10px 14px',
              background: 'rgba(255,70,70,0.08)', border: '1px solid rgba(255,70,70,0.25)',
              fontFamily: FB, fontSize: 12, color: '#ff6b6b',
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              marginTop: 18, padding: '10px 14px',
              background: `${cfg.accentColor}12`, border: `1px solid ${cfg.accentColor}40`,
              fontFamily: FB, fontSize: 12, color: cfg.accentColor,
            }}>
              ✓ Login successful — redirecting…
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || success}
            style={{
              marginTop: 28, width: '100%', padding: '16px 0',
              background: success ? `${cfg.accentColor}15` : cfg.accentColor,
              border: success ? `1px solid ${cfg.accentColor}50` : 'none',
              fontFamily: FB, fontSize: 11, fontWeight: 600,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: success ? cfg.accentColor : BLACK,
              cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { if (!loading && !success) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {success ? `✓ Logged in` : loading ? 'Authenticating…' : `Log In as ${cfg.label}`}
          </button>

          {/* Footer links */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            {role !== 'admin' && (
              <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_MUTED, marginBottom: 0 }}>
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 12, color: GOLD, fontWeight: 600, padding: 0 }}
                >
                  Register
                </button>
              </p>
            )}
            {role === 'admin' && (
              <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_DIM, letterSpacing: '0.1em' }}>
                Admin accounts are created by invitation only
              </p>
            )}
          </div>
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 11, color: WHITE_DIM, letterSpacing: '0.16em', textTransform: 'uppercase', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.color = WHITE_DIM)}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}