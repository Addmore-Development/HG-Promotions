import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'

// ─── Strict Gold & Black Palette ──────────────────────────────────────────────
const BLK   = '#050402'
const BLK1  = '#0A0804'
const BLK2  = '#100C05'
const BLK3  = '#181206'
const BLK4  = '#201808'
const GOLD  = '#D4880A'
const GL    = '#E8A820'
const GL2   = '#F0C050'
const GD    = '#C07818'
const GD2   = '#8B5A1A'
const GD3   = '#6B3F10'
const BB    = 'rgba(212,136,10,0.16)'
const BB2   = 'rgba(212,136,10,0.08)'
const W     = '#FAF3E8'
const W7    = 'rgba(250,243,232,0.70)'
const W4    = 'rgba(250,243,232,0.40)'
const W2    = 'rgba(250,243,232,0.20)'
const FD    = "'Playfair Display', Georgia, serif"
const FB    = "'DM Sans', system-ui, sans-serif"

const NAV_ITEMS = [
  { path: '/business/dashboard', icon: '◈', label: 'Overview'  },
  { path: '/business/jobs',      icon: '◎', label: 'Jobs'      },
  { path: '/business/tracking',  icon: '⊙', label: 'Tracking'  },
  { path: '/business/payroll',   icon: '◆', label: 'Payroll'   },
]

export default function BusinessLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [session, setSession]     = useState<Record<string,string> | null>(null)
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
    localStorage.removeItem('hg_token')
    navigate('/')
  }

  if (!session) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BLK, fontFamily: FB }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; background: ${BLK}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${BLK1}; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(${GL}, ${GD}); border-radius: 2px; }
        @keyframes biz-fade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .biz-page { animation: biz-fade 0.4s ease both; }
        select option { background: ${BLK2}; color: ${W}; }
        input::placeholder { color: rgba(212,136,10,0.25); }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 58 : 216, flexShrink: 0,
        background: `linear-gradient(180deg, ${BLK1} 0%, ${BLK} 100%)`,
        borderRight: `1px solid ${BB}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
        boxShadow: `4px 0 24px rgba(0,0,0,0.6)`,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '24px 0' : '24px 20px',
          borderBottom: `1px solid ${BB}`,
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700 }}>
              <span style={{ color: GL }}>HONEY</span>
              <span style={{ color: W }}> GROUP</span>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: W4, fontSize: 12, lineHeight: 1, padding: 4, transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = GL)}
            onMouseLeave={e => (e.currentTarget.style.color = W4)}
          >{collapsed ? '▶' : '◀'}</button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 10, padding: collapsed ? '12px 0' : '11px 20px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? BB2 : 'transparent',
                  borderLeft: active ? `3px solid ${GL}` : '3px solid transparent',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  color: active ? GL : W4,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = BB; e.currentTarget.style.color = W7 } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = W4 } }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontFamily: FD, fontSize: 12, fontWeight: active ? 700 : 400, letterSpacing: '0.04em' }}>{item.label}</span>}
              </button>
            )
          })}

          <button onClick={() => navigate('/')}
            title={collapsed ? 'View Site' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 10, padding: collapsed ? '12px 0' : '11px 20px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'transparent', borderLeft: '3px solid transparent',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              color: W4, marginTop: 8, borderTop: `1px solid ${BB}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = BB; e.currentTarget.style.color = GL }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = W4 }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>⊹</span>
            {!collapsed && <span style={{ fontFamily: FD, fontSize: 12, fontWeight: 400 }}>View Site</span>}
          </button>
        </nav>

        {/* User + logout */}
        <div style={{ borderTop: `1px solid ${BB}`, padding: collapsed ? '14px 0' : '14px 18px' }}>
          {!collapsed && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, color: W, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.companyName || session.name || session.email}
              </p>
              <p style={{ fontFamily: FB, fontSize: 10, color: W4 }}>Business Account</p>
            </div>
          )}
          <button onClick={handleLogout}
            title={collapsed ? 'Log Out' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 8, justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: FB, fontSize: 11, color: W4,
              padding: collapsed ? '6px 0' : '6px 2px', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = GL)}
            onMouseLeave={e => (e.currentTarget.style.color = W4)}
          >
            <span style={{ fontSize: 13 }}>⏻</span>
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0, background: BLK }}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: `rgba(5,4,2,0.96)`, backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${BB}`,
          padding: '0 36px', height: 58,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 2, height: 18, background: `linear-gradient(${GL}, ${GD})` }} />
            <p style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: GL }}>
              {NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label || 'Business Portal'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => navigate('/')}
              style={{ background: 'none', border: `1px solid ${BB}`, cursor: 'pointer', fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: W4, padding: '6px 14px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GL; e.currentTarget.style.color = GL }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = W4 }}>
              ← View Site
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: GL, boxShadow: `0 0 6px ${GL}` }} />
              <span style={{ fontFamily: FB, fontSize: 10, color: W4 }}>Active</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '32px 36px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}