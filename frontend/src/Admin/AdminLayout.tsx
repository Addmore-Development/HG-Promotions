import { useNavigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

/* ─── TOKENS ─────────────────────────────────────────────────── */
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

const NAV_ITEMS = [
  { label: 'Dashboard',      icon: '◈', path: '/admin'            },
  { label: 'Registrations',  icon: '▣', path: '/admin/registrations' },
  { label: 'Login Activity', icon: '◉', path: '/admin/logins'     },
  { label: 'Messages',       icon: '◆', path: '/admin/messages'   },
  { label: 'Users',          icon: '⬡', path: '/admin/users'      },
  { label: 'Jobs',           icon: '◎', path: '/admin/jobs'       },
  { label: 'Live Map',       icon: '⊙', path: '/admin/map'        },
  { label: 'Payments',       icon: '✦', path: '/admin/payments'   },
  { label: 'Onboarding',     icon: '✧', path: '/admin/onboarding' },
  { label: 'Reports',        icon: '▤', path: '/admin/reports'    },
  { label: 'Settings',       icon: '⚙', path: '/admin/settings'  },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: B, fontFamily: FB, color: W }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${B} !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: ${B}; }
        ::-webkit-scrollbar-thumb { background: ${G}; }
        select option { background: #161616; color: #F4EFE6; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: 220, background: BC,
        borderRight: `1px solid ${BB}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: `1px solid ${BB}` }}>
          <div style={{ fontFamily: FD, fontSize: 17, fontWeight: 700 }}>
            <span style={{ color: G }}>HONEY</span>
            <span style={{ color: W }}> GROUP</span>
          </div>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', color: WD, marginTop: 4, textTransform: 'uppercase' }}>Admin Console</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(n => {
            const isActive = location.pathname === n.path || (n.path !== '/admin' && location.pathname.startsWith(n.path))
            return (
              <button key={n.path} onClick={() => navigate(n.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  padding: '10px 12px', marginBottom: 3, borderRadius: 5, cursor: 'pointer',
                  background: isActive ? 'rgba(196,151,58,0.12)' : 'transparent',
                  border: isActive ? `1px solid rgba(196,151,58,0.28)` : '1px solid transparent',
                  color: isActive ? G : WM,
                  fontFamily: FB, fontSize: 12, fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s', gap: 10,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = W }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = WM }}
              >
                <span style={{ fontSize: 14 }}>{n.icon}</span>
                {n.label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${BB}` }}>
          <div style={{ fontSize: 10, color: WD }}>Logged in as</div>
          <div style={{ fontSize: 13, color: W, fontWeight: 600, marginTop: 2 }}>Administrator</div>
          <button onClick={() => navigate('/')}
            style={{ marginTop: 10, fontSize: 11, color: WM, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, padding: 0, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = W}
            onMouseLeave={e => e.currentTarget.style.color = WM}
          >← Back to site</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ marginLeft: 220, flex: 1, overflowY: 'auto', background: B }}>
        {children}
      </main>
    </div>
  )
}