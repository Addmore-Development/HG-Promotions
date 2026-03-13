// promoter/PromoterLayout.tsx
// Dedicated layout for the promoter portal, exactly matching the new admin design.

import { useNavigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

// Updated palette – same as admin
const G   = '#D4880A'   // Warm amber primary
const GL  = '#E8A820'   // Bright golden yellow
const G2  = '#8B5A1A'   // Dark brown
const B   = '#0C0A07'   // Near‑black
const BC  = '#141008'   // Sidebar dark with warm tint
const BB  = 'rgba(212,136,10,0.12)'
const W   = '#FAF3E8'   // Warm white
const WM  = 'rgba(250,243,232,0.65)'
const WD  = 'rgba(250,243,232,0.28)'
const FD  = "'Playfair Display', Georgia, serif"
const FB  = "'DM Sans', system-ui, sans-serif"

// Promoter navigation groups – now exactly like admin's structure
const PROMOTER_NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: '◈', path: '/promoter', tab: 'dashboard', external: false },
    ]
  },
  {
    label: 'Jobs',
    items: [
      { label: 'Job Feed', icon: '◈', path: '/promoter', tab: 'jobs', external: false },
    ]
  },
  {
    label: 'Shifts',
    items: [
      { label: 'My Shifts', icon: '▦', path: '/promoter', tab: 'shifts', external: false },
    ]
  },
  {
    label: 'Payments',
    items: [
      { label: 'Earnings', icon: '◆', path: '/promoter', tab: 'earnings', external: false },
    ]
  },
  {
    label: 'Profile',
    items: [
      { label: 'My Profile', icon: '⊙', path: '/promoter', tab: 'profile', external: false },
    ]
  },
]

function injectScrollbarStyles() {
  if (document.getElementById('hg-scrollbar-styles')) return
  const el = document.createElement('style')
  el.id = 'hg-scrollbar-styles'
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    select option { background: #141008; color: #FAF3E8; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
    .hg-nav-scroll::-webkit-scrollbar        { width: 6px; }
    .hg-nav-scroll::-webkit-scrollbar-track  { background: rgba(212,136,10,0.06); }
    .hg-nav-scroll::-webkit-scrollbar-thumb  { background: linear-gradient(180deg, #D4880A, #8B5A1A); border-radius: 6px; min-height: 40px; }
    .hg-nav-scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #E8A820, #D4880A); }
    .hg-nav-scroll { scrollbar-width: thin; scrollbar-color: #D4880A rgba(212,136,10,0.06); }
  `
  document.head.appendChild(el)
}

interface PromoterLayoutProps {
  children: ReactNode;
}

export function PromoterLayout({ children }: PromoterLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const activeTab = searchParams.get('tab') || (location.pathname === '/promoter' ? 'dashboard' : '')

  useEffect(() => {
    injectScrollbarStyles()
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  type NavItem = typeof PROMOTER_NAV_GROUPS[0]['items'][0]

  const handleNav = (item: NavItem) => {
    if (item.external) navigate(item.path)
    else navigate(`/promoter?tab=${item.tab}`)
  }

  const isActive = (item: NavItem) => {
    if (item.external) {
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    }
    if (location.pathname !== '/promoter') return false
    if (item.tab === 'dashboard') return activeTab === 'dashboard' || activeTab === ''
    return activeTab === item.tab
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: B, fontFamily: FB, color: W }}>
      <aside style={{
        width: 224, flexShrink: 0,
        background: `linear-gradient(180deg, ${BC} 0%, #100D07 100%)`,
        borderRight: `1px solid ${BB}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 32px rgba(0,0,0,0.6)',
      }}>

        {/* ── Logo ── */}
        <div style={{ padding: '26px 22px 18px', borderBottom: `1px solid ${BB}`, flexShrink: 0 }}>
          {/* Amber top stripe */}
          <div style={{ height: 2, background: `linear-gradient(90deg, ${GL}, ${G}, ${G2})`, marginBottom: 14, borderRadius: 1 }} />
          <div style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, letterSpacing: '0.02em' }}>
            <span style={{ color: GL }}>HONEY</span>
            <span style={{ color: W }}> GROUP</span>
          </div>
          <div style={{ fontSize: 8, letterSpacing: '0.38em', color: WD, marginTop: 5, textTransform: 'uppercase' }}>Promoter Portal</div>
        </div>

        {/* ── Nav ── */}
        <nav className="hg-nav-scroll" style={{ flex: 1, overflowY: 'scroll', overflowX: 'hidden', padding: '10px 10px' }}>
          {PROMOTER_NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{
                fontSize: 7.5, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase',
                color: WD, padding: '10px 12px 5px',
              }}>
                {group.label}
              </div>

              {group.items.map(n => {
                const active = isActive(n)

                return (
                  <button
                    key={n.tab}
                    onClick={() => handleNav(n)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 12px', marginBottom: 2, borderRadius: 6, cursor: 'pointer',
                      background: active
                        ? `linear-gradient(135deg, rgba(212,136,10,0.22), rgba(139,90,26,0.14))`
                        : 'transparent',
                      border: active
                        ? `1px solid rgba(212,136,10,0.40)`
                        : '1px solid transparent',
                      color: active ? GL : WM,
                      fontFamily: FB, fontSize: 12.5,
                      fontWeight: active ? 600 : 400,
                      transition: 'all 0.18s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(212,136,10,0.08)'
                        e.currentTarget.style.color = W
                        e.currentTarget.style.borderColor = 'rgba(212,136,10,0.18)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = WM
                        e.currentTarget.style.borderColor = 'transparent'
                      }
                    }}
                  >
                    {/* Active left glow bar */}
                    {active && (
                      <div style={{
                        position: 'absolute', left: 0, top: '20%', bottom: '20%',
                        width: 3, borderRadius: '0 2px 2px 0',
                        background: `linear-gradient(180deg, ${GL}, ${G})`,
                      }} />
                    )}
                    <span style={{
                      fontSize: 12,
                      color: active ? GL : WD,
                      transition: 'color 0.18s',
                    }}>{n.icon}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div style={{ padding: '14px 18px', borderTop: `1px solid ${BB}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: `linear-gradient(135deg, ${G2}, ${G})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: W, flexShrink: 0,
            }}>P</div>
            <div>
              <div style={{ fontSize: 12, color: W, fontWeight: 600 }}>Promoter</div>
              <div style={{ fontSize: 10, color: WD, marginTop: 1 }}>Active</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              fontSize: 10.5, color: WD, background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: FB, padding: 0, letterSpacing: '0.06em',
            }}
            onMouseEnter={e => e.currentTarget.style.color = G}
            onMouseLeave={e => e.currentTarget.style.color = WD}
          >← Back to site</button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', background: B }}>
        <div style={{ animation: 'fadeIn 0.25s ease' }}>{children}</div>
      </main>
    </div>
  )
}