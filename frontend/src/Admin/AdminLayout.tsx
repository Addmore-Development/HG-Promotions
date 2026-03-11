import { useNavigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

const G  = '#C4973A'
const GL = '#DDB55A'
const B  = '#080808'
const BC = '#161616'
const BB = 'rgba(255,255,255,0.07)'
const W  = '#F4EFE6'
const WM = 'rgba(244,239,230,0.55)'
const WD = 'rgba(244,239,230,0.22)'
const FD = "'Playfair Display', Georgia, serif"
const FB = "'DM Sans', system-ui, sans-serif"

// external:true  → real separate route
// external:false → internal tab in AdminDashboard, navigate to /admin?tab=X
const NAV_GROUPS = [
  { label: 'Overview', items: [
    { label: 'Dashboard',      icon: '◈', path: '/admin',            tab: 'dashboard',     external: false },
  ]},
  { label: 'People', items: [
    { label: 'Users',          icon: '⬡', path: '/admin/users',      tab: 'users',         external: true  },
    { label: 'Registrations',  icon: '▣', path: '/admin',            tab: 'registrations', external: false },
    { label: 'Onboarding',     icon: '✧', path: '/admin/onboarding', tab: 'onboarding',    external: true  },
  ]},
  { label: 'Operations', items: [
    { label: 'Jobs',           icon: '◎', path: '/admin/jobs',       tab: 'jobs',          external: true  },
    { label: 'Live Map',       icon: '⊙', path: '/admin/map',        tab: 'map',           external: true  },
    { label: 'Payments',       icon: '✦', path: '/admin/payments',   tab: 'payments',      external: true  },
  ]},
  { label: 'Comms', items: [
    { label: 'Messages',       icon: '◆', path: '/admin',            tab: 'messages',      external: false },
    { label: 'Login Activity', icon: '◉', path: '/admin',            tab: 'logins',        external: false },
  ]},
  { label: 'System', items: [
    { label: 'Reports',        icon: '▤', path: '/admin',            tab: 'reports',       external: false },
    { label: 'Settings',       icon: '⚙', path: '/admin',            tab: 'settings',      external: false },
  ]},
]

function injectScrollbarStyles() {
  if (document.getElementById('hg-scrollbar-styles')) return
  const el = document.createElement('style')
  el.id = 'hg-scrollbar-styles'
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    select option { background: #161616; color: #F4EFE6; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
    .hg-nav-scroll::-webkit-scrollbar        { width: 10px; }
    .hg-nav-scroll::-webkit-scrollbar-track  { background: rgba(255,255,255,0.04); }
    .hg-nav-scroll::-webkit-scrollbar-thumb  { background: #C4973A; border-radius: 6px; border: 2px solid #161616; min-height: 48px; }
    .hg-nav-scroll::-webkit-scrollbar-thumb:hover { background: #DDB55A; }
    .hg-nav-scroll { scrollbar-width: auto; scrollbar-color: #C4973A rgba(255,255,255,0.04); }
  `
  document.head.appendChild(el)
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const activeTab = searchParams.get('tab') || (location.pathname === '/admin' ? 'dashboard' : '')

  useEffect(() => {
    injectScrollbarStyles()
    // Lock scroll while admin is mounted, restore when leaving
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  const handleNav = (item: typeof NAV_GROUPS[0]['items'][0]) => {
    if (item.external) {
      navigate(item.path)
    } else {
      // Navigate to /admin with ?tab=X — no new route needed, AdminDashboard reads it
      navigate(`/admin?tab=${item.tab}`)
    }
  }

  const isActive = (item: typeof NAV_GROUPS[0]['items'][0]) => {
    if (item.external) {
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    }
    // Internal tab: active when on /admin and tab param matches (dashboard is default)
    if (location.pathname !== '/admin') return false
    if (item.tab === 'dashboard') return activeTab === 'dashboard' || activeTab === ''
    return activeTab === item.tab
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: B, fontFamily: FB, color: W }}>
      <aside style={{ width: 220, flexShrink: 0, background: BC, borderRight: `1px solid ${BB}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: `1px solid ${BB}`, flexShrink: 0 }}>
          <div style={{ fontFamily: FD, fontSize: 17, fontWeight: 700 }}>
            <span style={{ color: G }}>HONEY</span><span style={{ color: W }}> GROUP</span>
          </div>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', color: WD, marginTop: 4, textTransform: 'uppercase' }}>Admin Console</div>
        </div>

        <nav className="hg-nav-scroll" style={{ flex: 1, overflowY: 'scroll', overflowX: 'hidden', padding: '8px 10px' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: WD, padding: '10px 12px 4px' }}>{group.label}</div>
              {group.items.map(n => {
                const active = isActive(n)
                return (
                  <button key={n.tab} onClick={() => handleNav(n)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 12px', marginBottom: 1, borderRadius: 5, cursor: 'pointer',
                    background: active ? 'rgba(196,151,58,0.12)' : 'transparent',
                    border: active ? `1px solid rgba(196,151,58,0.28)` : '1px solid transparent',
                    color: active ? G : WM, fontFamily: FB, fontSize: 12, fontWeight: active ? 600 : 400,
                    transition: 'all 0.18s',
                  }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = W }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = WM }}
                  >
                    <span style={{ fontSize: 13 }}>{n.icon}</span>{n.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${BB}`, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: WD }}>Logged in as</div>
          <div style={{ fontSize: 13, color: W, fontWeight: 600, marginTop: 2 }}>Administrator</div>
          <button onClick={() => navigate('/')}
            style={{ marginTop: 10, fontSize: 11, color: WM, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = W}
            onMouseLeave={e => e.currentTarget.style.color = WM}
          >← Back to site</button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', background: B }}>
        <div style={{ animation: 'fadeIn 0.25s ease' }}>{children}</div>
      </main>
    </div>
  )
}