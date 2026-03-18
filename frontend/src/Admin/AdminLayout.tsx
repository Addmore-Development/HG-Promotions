import { useNavigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect, useState, useRef } from 'react'

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
    { label: 'Dashboard',              icon: '◈', path: '/admin',            tab: 'dashboard',     external: false },
  ]},
  { label: 'People', items: [
    { label: 'Users',                  icon: '⬡', path: '/admin/users',      tab: 'users',         external: true  },
    { label: 'Clients',                icon: '◉', path: '/admin',            tab: 'clients',       external: false },
    { label: 'Registrations',          icon: '▣', path: '/admin',            tab: 'registrations', external: false },
    { label: 'Onboarding',             icon: '✧', path: '/admin/onboarding', tab: 'onboarding',    external: true  },
  ]},
  { label: 'Operations', items: [
    { label: 'Jobs',                   icon: '◎', path: '/admin/jobs',       tab: 'jobs',          external: true  },
    { label: 'Live Map',               icon: '⊙', path: '/admin/map',        tab: 'map',           external: true  },
  ]},
  { label: 'Comms', items: [
    { label: 'Messages',               icon: '◆', path: '/admin',            tab: 'messages',      external: false },
    { label: 'Complaints & Enquiries', icon: '⚑', path: '/admin/reviews',    tab: 'reviews',       external: true  },
    { label: 'Login Activity',         icon: '◉', path: '/admin',            tab: 'logins',        external: false },
  ]},
  { label: 'System', items: [
    { label: 'Reports',                icon: '▤', path: '/admin',            tab: 'reports',       external: false },
    { label: 'Settings',               icon: '⚙', path: '/admin',            tab: 'settings',      external: false },
  ]},
]

// ── Widths ────────────────────────────────────────────────────────────────────
const SIDEBAR_FULL      = 224
const SIDEBAR_COLLAPSED = 56

function injectStyles() {
  if (document.getElementById('hg-styles')) return
  const el = document.createElement('style')
  el.id = 'hg-styles'
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Mono:wght@400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    select option { background: #100D05; color: #FAF3E8; }

    @keyframes fadeIn       { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
    @keyframes slideInLeft  { from { transform:translateX(-100%) } to { transform:translateX(0) } }
    @keyframes slideOutLeft { from { transform:translateX(0) } to { transform:translateX(-100%) } }
    @keyframes overlayIn    { from { opacity:0 } to { opacity:1 } }

    .hg-nav::-webkit-scrollbar        { width: 4px; }
    .hg-nav::-webkit-scrollbar-track  { background: rgba(212,136,10,0.04); }
    .hg-nav::-webkit-scrollbar-thumb  { background: linear-gradient(180deg, #E8A820, #8B5A1A); border-radius: 4px; min-height: 36px; }
    .hg-nav::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #F0C050, #D4880A); }
    .hg-nav { scrollbar-width: thin; scrollbar-color: #D4880A rgba(212,136,10,0.04); }

    /* Sidebar transition */
    .hg-sidebar {
      transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
    }

    /* Nav item label fade */
    .hg-nav-label {
      transition: opacity 0.18s ease, width 0.24s ease;
      white-space: nowrap;
      overflow: hidden;
    }

    /* Group label fade */
    .hg-group-label {
      transition: opacity 0.18s ease, max-height 0.24s ease;
      overflow: hidden;
    }

    /* Tooltip for collapsed icons */
    .hg-nav-item { position: relative; }
    .hg-nav-item .hg-tooltip {
      position: absolute;
      left: calc(100% + 10px);
      top: 50%;
      transform: translateY(-50%);
      background: #1C1709;
      border: 1px solid rgba(212,136,10,0.35);
      color: #FAF3E8;
      font-size: 11px;
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      z-index: 9999;
      transition: opacity 0.15s ease;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
    }
    .hg-nav-item .hg-tooltip::before {
      content: '';
      position: absolute;
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      border: 5px solid transparent;
      border-right-color: rgba(212,136,10,0.35);
    }
    .hg-nav-item:hover .hg-tooltip { opacity: 1; }

    /* Mobile overlay */
    .hg-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      z-index: 199;
      backdrop-filter: blur(4px);
      animation: overlayIn 0.22s ease;
    }

    /* Mobile top bar */
    .hg-mobile-bar {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 52px;
      background: ${BC};
      border-bottom: 1px solid ${BB};
      z-index: 300;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.6);
    }

    /* Collapse toggle button */
    .hg-collapse-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid rgba(212,136,10,0.28);
      background: rgba(212,136,10,0.08);
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .hg-collapse-btn:hover {
      background: rgba(212,136,10,0.18);
      border-color: rgba(212,136,10,0.5);
    }
    .hg-collapse-btn svg {
      transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
    }

    /* ── RESPONSIVE BREAKPOINTS ── */
    @media (max-width: 900px) {
      .hg-desktop-sidebar { display: none !important; }
      .hg-mobile-bar { display: flex !important; }
      .hg-main-content { margin-top: 52px !important; height: calc(100vh - 52px) !important; }
    }

    @media (min-width: 901px) {
      .hg-mobile-sidebar { display: none !important; }
    }

    /* Collapsed sidebar — icon-only adjustments */
    .hg-sidebar.collapsed .hg-nav-label { opacity: 0; width: 0; }
    .hg-sidebar.collapsed .hg-group-label { opacity: 0; max-height: 0; }
    .hg-sidebar.collapsed .hg-logo-text { opacity: 0; width: 0; }
    .hg-sidebar.collapsed .hg-footer-info { opacity: 0; width: 0; }
    .hg-sidebar.collapsed .hg-footer-btn { opacity: 0; width: 0; pointer-events: none; }

    /* Main content responsive */
    @media (max-width: 600px) {
      .hg-tab-content { padding: 24px 14px !important; }
    }
  `
  document.head.appendChild(el)
}

// ── Hamburger icon ─────────────────────────────────────────────────────────────
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <style>{`
        .hb-line { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); transform-origin: center; }
      `}</style>
      <line className="hb-line" x1="1" y1={open ? "7" : "1"}  x2="17" y2={open ? "7" : "1"}  stroke="${GL}" strokeWidth="2" strokeLinecap="round"
        style={{ transform: open ? 'rotate(45deg) translateY(0px)' : 'none' }} />
      <line className="hb-line" x1="1" y1="7"  x2="17" y2="7"  stroke="${GL}" strokeWidth="2" strokeLinecap="round"
        style={{ opacity: open ? 0 : 1 }} />
      <line className="hb-line" x1="1" y1={open ? "7" : "13"} x2="17" y2={open ? "7" : "13"} stroke="${GL}" strokeWidth="2" strokeLinecap="round"
        style={{ transform: open ? 'rotate(-45deg) translateY(0px)' : 'none' }} />
    </svg>
  )
}

// ── Chevron icon ───────────────────────────────────────────────────────────────
function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)' }}
    >
      <path d="M8.5 4.5L6 7L3.5 4.5" stroke={GL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Sidebar inner content ──────────────────────────────────────────────────────
function SidebarContent({
  collapsed,
  onToggleCollapse,
  isMobile,
  onClose,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
  isMobile?: boolean
  onClose?: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const params   = new URLSearchParams(location.search)
  const activeTab = params.get('tab') || (location.pathname === '/admin' ? 'dashboard' : '')

  // Track which groups are open (all open by default)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(NAV_GROUPS.map(g => [g.label, true]))
  )

  type NavItem = typeof NAV_GROUPS[0]['items'][0]

  const handleNav = (item: NavItem) => {
    if (item.external) navigate(item.path)
    else navigate(`/admin?tab=${item.tab}`)
    if (onClose) onClose()
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

  const toggleGroup = (label: string) => {
    if (collapsed) return // don't collapse groups when sidebar is collapsed
    setOpenGroups(p => ({ ...p, [label]: !p[label] }))
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: `linear-gradient(180deg, ${BC} 0%, #0A0805 100%)`,
      borderRight: isMobile ? 'none' : `1px solid ${BB}`,
    }}>

      {/* ── Logo row ── */}
      <div style={{
        padding: collapsed && !isMobile ? '22px 0 16px' : '22px 16px 16px',
        borderBottom: `1px solid ${BB}`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
        gap: 8,
        transition: 'padding 0.28s',
      }}>
        {/* Logo */}
        <div style={{ overflow: 'hidden', minWidth: 0 }}>
          <div style={{ height: 2, background: `linear-gradient(90deg, ${GL}, ${G}, ${G2})`, marginBottom: 10, borderRadius: 1, transition: 'opacity 0.18s', opacity: collapsed && !isMobile ? 0 : 1 }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, overflow: 'hidden' }}>
            <span style={{ fontFamily: FD, fontSize: 15, fontWeight: 700, color: GL, whiteSpace: 'nowrap', letterSpacing: '0.02em', flexShrink: 0 }}>HG</span>
            <span className="hg-logo-text" style={{
              fontFamily: FD, fontSize: 13, fontWeight: 500, color: W,
              opacity: collapsed && !isMobile ? 0 : 1,
              maxWidth: collapsed && !isMobile ? 0 : 120,
              transition: 'opacity 0.2s, max-width 0.28s',
              overflow: 'hidden', whiteSpace: 'nowrap',
            }}>Admin</span>
          </div>
          <div style={{
            fontSize: 7.5, letterSpacing: '0.3em', color: WD, marginTop: 3,
            textTransform: 'uppercase', fontFamily: FD, whiteSpace: 'nowrap',
            opacity: collapsed && !isMobile ? 0 : 1,
            transition: 'opacity 0.18s',
          }}>Console</div>
        </div>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            className="hg-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronIcon collapsed={!collapsed} />
          </button>
        )}

        {/* Close button — mobile only */}
        {isMobile && onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WD, fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="hg-nav" style={{ flex: 1, overflowY: 'scroll', overflowX: 'hidden', padding: '8px 8px' }}>
        {NAV_GROUPS.map(group => {
          const groupOpen = collapsed && !isMobile ? true : openGroups[group.label]
          return (
            <div key={group.label} style={{ marginBottom: 2 }}>

              {/* Group label — collapsible header */}
              <button
                onClick={() => toggleGroup(group.label)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: collapsed && !isMobile ? '6px 0' : '8px 10px 4px',
                  background: 'none',
                  border: 'none',
                  cursor: collapsed && !isMobile ? 'default' : 'pointer',
                  gap: 4,
                }}
              >
                <span
                  className="hg-group-label"
                  style={{
                    fontSize: 7.5,
                    fontWeight: 700,
                    letterSpacing: '0.32em',
                    textTransform: 'uppercase' as const,
                    color: WD,
                    fontFamily: FD,
                    opacity: collapsed && !isMobile ? 0 : 1,
                    maxHeight: collapsed && !isMobile ? 0 : 20,
                    transition: 'opacity 0.18s, max-height 0.24s',
                    overflow: 'hidden',
                    display: 'block',
                  }}
                >
                  {group.label}
                </span>
                {!collapsed || isMobile ? (
                  <span style={{ flexShrink: 0, opacity: 0.5 }}>
                    <svg
                      width="10" height="10" viewBox="0 0 10 10" fill="none"
                      style={{ transform: groupOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.22s' }}
                    >
                      <path d="M7.5 3.5L5 6L2.5 3.5" stroke={WD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : null}
              </button>

              {/* Group items */}
              <div style={{
                overflow: 'hidden',
                maxHeight: groupOpen ? 400 : 0,
                transition: 'max-height 0.28s cubic-bezier(0.4,0,0.2,1)',
              }}>
                {group.items.map(n => {
                  const active = isActive(n)
                  return (
                    <div key={n.tab} className="hg-nav-item">
                      <button
                        onClick={() => handleNav(n)}
                        title={collapsed && !isMobile ? n.label : ''}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: collapsed && !isMobile ? '9px 0' : '8px 10px',
                          marginBottom: 2,
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: active
                            ? 'linear-gradient(135deg, rgba(212,136,10,0.22), rgba(139,90,26,0.14))'
                            : 'transparent',
                          border: active
                            ? '1px solid rgba(212,136,10,0.42)'
                            : '1px solid transparent',
                          color: active ? GL : WM,
                          fontFamily: FD,
                          fontSize: 12.5,
                          fontWeight: active ? 700 : 400,
                          transition: 'all 0.18s',
                          position: 'relative' as const,
                          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
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
                        {/* Active indicator bar */}
                        {active && (
                          <div style={{
                            position: 'absolute',
                            left: 0, top: '20%', bottom: '20%',
                            width: 3,
                            borderRadius: '0 2px 2px 0',
                            background: `linear-gradient(180deg,${GL},${G})`,
                          }} />
                        )}

                        {/* Icon */}
                        <span style={{
                          fontSize: 13,
                          color: active ? GL : WD,
                          transition: 'color 0.18s',
                          flexShrink: 0,
                          lineHeight: 1,
                        }}>
                          {n.icon}
                        </span>

                        {/* Label */}
                        <span
                          className="hg-nav-label"
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            opacity: collapsed && !isMobile ? 0 : 1,
                            maxWidth: collapsed && !isMobile ? 0 : 180,
                            transition: 'opacity 0.18s, max-width 0.24s',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {n.label}
                        </span>
                      </button>

                      {/* Tooltip — only when collapsed */}
                      {collapsed && !isMobile && (
                        <span className="hg-tooltip">{n.label}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: collapsed && !isMobile ? '12px 0' : '14px 14px',
        borderTop: `1px solid ${BB}`,
        flexShrink: 0,
        transition: 'padding 0.28s',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: collapsed && !isMobile ? 0 : 10,
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
        }}>
          {/* Avatar */}
          <div style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: `linear-gradient(135deg,${G2},${G})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: W,
            flexShrink: 0, fontFamily: FD,
          }}>A</div>

          {/* Info */}
          <div className="hg-footer-info" style={{
            overflow: 'hidden',
            opacity: collapsed && !isMobile ? 0 : 1,
            maxWidth: collapsed && !isMobile ? 0 : 140,
            transition: 'opacity 0.18s, max-width 0.24s',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontSize: 11, color: W, fontWeight: 700, fontFamily: FD }}>Administrator</div>
            <div style={{ fontSize: 9, color: WD, marginTop: 1, fontFamily: FD }}>Super Admin</div>
          </div>
        </div>

        <button
          className="hg-footer-btn"
          onClick={() => navigate('/')}
          style={{
            fontSize: 10,
            color: GL,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: FD,
            padding: 0,
            letterSpacing: '0.06em',
            textAlign: 'left' as const,
            display: 'block',
            width: '100%',
            opacity: collapsed && !isMobile ? 0 : 1,
            maxHeight: collapsed && !isMobile ? 0 : 20,
            overflow: 'hidden',
            transition: 'opacity 0.18s, max-height 0.24s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.color = W}
          onMouseLeave={e => e.currentTarget.style.color = GL}
        >
          ← Back to Site
        </button>
      </div>
    </div>
  )
}

// ── Main Layout Export ─────────────────────────────────────────────────────────
export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const [collapsed,     setCollapsed    ] = useState(false)
  const [mobileOpen,    setMobileOpen   ] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    injectStyles()
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  // Close mobile drawer on route change
  const location = useLocation()
  useEffect(() => { setMobileOpen(false) }, [location.pathname, location.search])

  // Close on outside click (mobile)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileOpen])

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: B, fontFamily: FD, color: W }}>

      {/* ── Mobile top bar ── */}
      <div className="hg-mobile-bar">
        {/* Hamburger */}
        <button
          onClick={() => setMobileOpen(p => !p)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px 4px', display: 'flex', alignItems: 'center',
          }}
          aria-label="Toggle navigation"
        >
          <HamburgerIcon open={mobileOpen} />
        </button>

        {/* Logo */}
        <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.02em' }}>
          <span style={{ color: GL }}>HONEY</span>
          <span style={{ color: W }}> GROUP</span>
        </div>

        {/* Back to site */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: `1px solid ${BB}`,
            color: WM, fontFamily: FD, fontSize: 10,
            padding: '5px 10px', cursor: 'pointer',
            borderRadius: 4, letterSpacing: '0.06em',
          }}
        >
          ← Site
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="hg-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        ref={drawerRef}
        className="hg-mobile-sidebar"
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 256,
          zIndex: 200,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: mobileOpen ? '8px 0 40px rgba(0,0,0,0.8)' : 'none',
        }}
      >
        <SidebarContent
          collapsed={false}
          onToggleCollapse={() => {}}
          isMobile={true}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hg-sidebar hg-desktop-sidebar ${collapsed ? 'collapsed' : ''}`}
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          boxShadow: '4px 0 32px rgba(0,0,0,0.7)',
          zIndex: 10,
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(p => !p)}
          isMobile={false}
        />
      </aside>

      {/* ── Main content ── */}
      <main
        className="hg-main-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          background: B,
          height: '100vh',
          transition: 'none',
        }}
      >
        <div
          className="hg-tab-content"
          style={{ animation: 'fadeIn 0.25s ease' }}
        >
          {children}
        </div>
      </main>
    </div>
  )
}