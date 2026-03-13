import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'

const BLACK        = '#080808'
const BLACK_SOFT   = '#0f0f0f'
const BLACK_CARD   = '#161616'
const BLACK_BORDER = 'rgba(255,255,255,0.07)'
const GOLD         = '#C4973A'
const GOLD_LIGHT   = '#DDB55A'
const WHITE        = '#F4EFE6'
const WHITE_MUTED  = 'rgba(244,239,230,0.55)'
const WHITE_DIM    = 'rgba(244,239,230,0.18)'
const FD           = "'Playfair Display', Georgia, serif"
const FB           = "'DM Sans', system-ui, sans-serif"

const NAV_ITEMS = [
  { path: '/business/dashboard', icon: '▦', label: 'Overview'   },
  { path: '/business/jobs',      icon: '◈', label: 'Jobs'       },
  { path: '/business/tracking',  icon: '◎', label: 'Tracking'   },
  { path: '/business/payroll',   icon: '◆', label: 'Payroll'    },
]

export default function BusinessLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [session, setSession] = useState<Record<string,string> | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const s = localStorage.getItem('hg_session')
    if (!s) { navigate('/login'); return }
    const parsed = JSON.parse(s)
    if (parsed.role !== 'business') { navigate('/login'); return }
    setSession(parsed)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('hg_session')
    navigate('/')
  }

  // ── CHANGE: navigate to landing page without logging out ──
  const handleViewSite = () => {
    navigate('/')
  }

  if (!session) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BLACK, fontFamily: FB }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; background: ${BLACK}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: ${GOLD}; border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .biz-page { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 64 : 220, flexShrink: 0,
        background: BLACK_SOFT,
        borderRight: `1px solid ${BLACK_BORDER}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '28px 0' : '28px 24px',
          borderBottom: `1px solid ${BLACK_BORDER}`,
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700 }}>
              <span style={{ color: GOLD }}>HONEY</span>
              <span style={{ color: WHITE }}> GROUP</span>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: WHITE_MUTED, fontSize: 14, lineHeight: 1,
            padding: 4, transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.color = WHITE_MUTED)}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 12, padding: collapsed ? '13px 0' : '13px 24px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? 'rgba(196,151,58,0.1)' : 'transparent',
                  borderLeft: active ? `3px solid ${GOLD}` : '3px solid transparent',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  color: active ? GOLD : WHITE_MUTED,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = WHITE } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = WHITE_MUTED } }}
              >
                <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontFamily: FB, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em' }}>{item.label}</span>}
              </button>
            )
          })}

          {/* ── CHANGE: View Site link ── */}
          <button
            onClick={handleViewSite}
            title={collapsed ? 'View Site' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 12, padding: collapsed ? '13px 0' : '13px 24px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'transparent',
              borderLeft: '3px solid transparent',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              color: WHITE_MUTED,
              marginTop: 8,
              borderTop: `1px solid ${BLACK_BORDER}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = GOLD }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = WHITE_MUTED }}
          >
            <span style={{ fontSize: 15, flexShrink: 0 }}>⊹</span>
            {!collapsed && <span style={{ fontFamily: FB, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em' }}>View Site</span>}
          </button>
        </nav>

        {/* User + logout */}
        <div style={{ borderTop: `1px solid ${BLACK_BORDER}`, padding: collapsed ? '16px 0' : '16px 20px' }}>
          {!collapsed && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: WHITE, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.name}
              </p>
              <p style={{ fontFamily: FB, fontSize: 10, color: WHITE_MUTED }}>Business Account</p>
            </div>
          )}
          <button onClick={handleLogout}
            title={collapsed ? 'Log Out' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 8, justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: FB, fontSize: 11, color: WHITE_MUTED,
              padding: collapsed ? '8px 0' : '8px 4px', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
            onMouseLeave={e => (e.currentTarget.style.color = WHITE_MUTED)}
          >
            <span style={{ fontSize: 13 }}>⏻</span>
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${BLACK_BORDER}`,
          padding: '0 36px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD }}>
              {NAV_ITEMS.find(n => n.path === location.pathname)?.label || 'Business Portal'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* ── CHANGE: View Site button in top bar ── */}
            <button
              onClick={handleViewSite}
              style={{
                background: 'none', border: `1px solid ${BLACK_BORDER}`, cursor: 'pointer',
                fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: WHITE_MUTED, padding: '6px 14px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BLACK_BORDER; e.currentTarget.style.color = WHITE_MUTED }}
            >
              ← View Site
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              <span style={{ fontFamily: FB, fontSize: 11, color: WHITE_MUTED }}>Active</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '36px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}