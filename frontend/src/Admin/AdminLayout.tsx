import { useNavigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

const G   = '#D4880A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const G5  = '#6B3F10'

const B  = '#0C0A07'
const BC = '#100D05'
const BB = 'rgba(212,136,10,0.14)'

const W  = '#FAF3E8'
const WM = 'rgba(250,243,232,0.65)'
const WD = 'rgba(250,243,232,0.28)'

const FD = "'Playfair Display', Georgia, serif"

const NAV_GROUPS = [
  { label: 'Overview', items: [
    { label: 'Dashboard',          icon: '◈', path: '/admin',             tab: 'dashboard',     external: false },
  ]},
  { label: 'People', items: [
    { label: 'Users',              icon: '⬡', path: '/admin/users',       tab: 'users',         external: true  },
    { label: 'Clients',            icon: '◉', path: '/admin',             tab: 'clients',       external: false },
    { label: 'Registrations',      icon: '▣', path: '/admin',             tab: 'registrations', external: false },
    { label: 'Onboarding',         icon: '✧', path: '/admin/onboarding',  tab: 'onboarding',    external: true  },
  ]},
  { label: 'Operations', items: [
    { label: 'Jobs',               icon: '◎', path: '/admin/jobs',        tab: 'jobs',          external: true  },
    { label: 'Live Map',           icon: '⊙', path: '/admin/map',         tab: 'map',           external: true  },
  ]},
  { label: 'Comms', items: [
    { label: 'Messages',           icon: '◆', path: '/admin',             tab: 'messages',      external: false },
    { label: 'Reviews & Complaints', icon: '★', path: '/admin/reviews',   tab: 'reviews',       external: true  },
    { label: 'Login Activity',     icon: '◉', path: '/admin',             tab: 'logins',        external: false },
  ]},
  { label: 'System', items: [
    { label: 'Reports',            icon: '▤', path: '/admin',             tab: 'reports',       external: false },
    { label: 'Settings',           icon: '⚙', path: '/admin',             tab: 'settings',      external: false },
  ]},
]

function injectStyles() {
  if (document.getElementById('hg-styles')) return
  const el = document.createElement('style')
  el.id = 'hg-styles'
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Mono:wght@400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    select option { background: #100D05; color: #FAF3E8; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
    .hg-nav::-webkit-scrollbar        { width: 5px; }
    .hg-nav::-webkit-scrollbar-track  { background: rgba(212,136,10,0.05); }
    .hg-nav::-webkit-scrollbar-thumb  { background: linear-gradient(180deg, #E8A820, #8B5A1A); border-radius: 4px; min-height: 36px; }
    .hg-nav::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #F0C050, #D4880A); }
    .hg-nav { scrollbar-width: thin; scrollbar-color: #D4880A rgba(212,136,10,0.05); }
  `
  document.head.appendChild(el)
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const params    = new URLSearchParams(location.search)
  const activeTab = params.get('tab') || (location.pathname === '/admin' ? 'dashboard' : '')

  useEffect(() => {
    injectStyles()
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => { document.body.style.overflow = ''; document.documentElement.style.overflow = '' }
  }, [])

  type NavItem = typeof NAV_GROUPS[0]['items'][0]

  const handleNav = (item: NavItem) => {
    if (item.external) navigate(item.path)
    else navigate(`/admin?tab=${item.tab}`)
  }

  const isActive = (item: NavItem) => {
    if (item.external) {
      if (item.path === '/admin/users')   return location.pathname === '/admin/users'
      if (item.path === '/admin/reviews') return location.pathname === '/admin/reviews'
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    }
    if (location.pathname !== '/admin') return false
    if (item.tab === 'dashboard') return activeTab === 'dashboard' || activeTab === ''
    return activeTab === item.tab
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:B, fontFamily:FD, color:W }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width:224, flexShrink:0,
        background:`linear-gradient(180deg, ${BC} 0%, #0A0805 100%)`,
        borderRight:`1px solid ${BB}`,
        display:'flex', flexDirection:'column',
        boxShadow:'4px 0 32px rgba(0,0,0,0.7)',
      }}>

        {/* Logo */}
        <div style={{ padding:'26px 22px 18px', borderBottom:`1px solid ${BB}`, flexShrink:0 }}>
          <div style={{ height:2, background:`linear-gradient(90deg, ${GL}, ${G}, ${G2})`, marginBottom:14, borderRadius:1 }} />
          <div style={{ fontFamily:FD, fontSize:18, fontWeight:700, letterSpacing:'0.02em' }}>
            <span style={{ color:GL }}>HONEY</span>
            <span style={{ color:W }}> GROUP</span>
          </div>
          <div style={{ fontSize:8, letterSpacing:'0.38em', color:WD, marginTop:5, textTransform:'uppercase', fontFamily:FD }}>Admin Console</div>
        </div>

        {/* Nav */}
        <nav className="hg-nav" style={{ flex:1, overflowY:'scroll', overflowX:'hidden', padding:'10px 10px' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom:4 }}>
              <div style={{ fontSize:7.5, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:WD, padding:'10px 12px 5px', fontFamily:FD }}>
                {group.label}
              </div>
              {group.items.map(n => {
                const active = isActive(n)
                return (
                  <button key={n.tab} onClick={() => handleNav(n)}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', gap:9,
                      padding:'8px 12px', marginBottom:2, borderRadius:6, cursor:'pointer',
                      background:active ? `linear-gradient(135deg, rgba(212,136,10,0.22), rgba(139,90,26,0.14))` : 'transparent',
                      border:active ? `1px solid rgba(212,136,10,0.42)` : '1px solid transparent',
                      color:active ? GL : WM,
                      fontFamily:FD, fontSize:12.5, fontWeight:active?700:400,
                      transition:'all 0.18s', position:'relative',
                    }}
                    onMouseEnter={e => { if(!active){ e.currentTarget.style.background='rgba(212,136,10,0.08)'; e.currentTarget.style.color=W; e.currentTarget.style.borderColor='rgba(212,136,10,0.18)' }}}
                    onMouseLeave={e => { if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=WM; e.currentTarget.style.borderColor='transparent' }}}
                  >
                    {active && (
                      <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:'0 2px 2px 0', background:`linear-gradient(180deg,${GL},${G})` }} />
                    )}
                    <span style={{ fontSize:12, color:active?GL:WD, transition:'color 0.18s' }}>{n.icon}</span>
                    <span style={{ flex:1, textAlign:'left' }}>{n.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:'14px 18px', borderTop:`1px solid ${BB}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,${G2},${G})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:W, flexShrink:0, fontFamily:FD }}>A</div>
            <div>
              <div style={{ fontSize:12, color:W, fontWeight:700, fontFamily:FD }}>Administrator</div>
              <div style={{ fontSize:10, color:WD, marginTop:1, fontFamily:FD }}>Super Admin</div>
            </div>
          </div>
          <button onClick={() => navigate('/')}
            style={{ fontSize:10.5, color:WD, background:'none', border:'none', cursor:'pointer', fontFamily:FD, padding:0, letterSpacing:'0.06em' }}
            onMouseEnter={e => e.currentTarget.style.color=GL}
            onMouseLeave={e => e.currentTarget.style.color=WD}
          >← Back to site</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex:1, overflowY:'auto', background:B }}>
        <div style={{ animation:'fadeIn 0.25s ease' }}>{children}</div>
      </main>
    </div>
  )
}