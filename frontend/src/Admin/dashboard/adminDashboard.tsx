import { useState } from 'react';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const BLACK        = '#080808';
const BLACK_BORDER = 'rgba(255,255,255,0.07)';
const GOLD         = '#C4973A';
const GOLD_LIGHT   = '#DDB55A';
const GOLD_MUTED   = 'rgba(196,151,58,0.12)';
const WHITE        = '#F4EFE6';
const WHITE_MUTED  = 'rgba(244,239,230,0.55)';
const ADMIN_BG     = '#F7F6F3';
const ADMIN_CARD   = '#FFFFFF';
const ADMIN_BORDER = 'rgba(0,0,0,0.08)';
const FD           = "'Playfair Display', Georgia, serif";
const FB           = "'DM Sans', system-ui, sans-serif";

/* ─── GLOBAL CSS ─────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #F0EFE9; }
  ::-webkit-scrollbar-thumb { background: ${GOLD}; }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
`;

/* ─── TYPES ──────────────────────────────────────────────────── */
type NavId        = 'dashboard' | 'promoters' | 'jobs' | 'shifts' | 'payroll' | 'reports' | 'settings';
type BadgeColor   = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gold';

interface NavItem   { icon: string; label: string; id: NavId; }
interface StatProps { icon: string; label: string; value: string; delta?: string; accent?: string; }
interface BadgeProps{ children: React.ReactNode; color: BadgeColor; }
interface HeaderProps { title: string; subtitle?: string; action?: string; }
interface TableProps  { columns: string[]; rows: React.ReactNode[][]; }

/* ─── NAV CONFIG ─────────────────────────────────────────────── */
const NAV: NavItem[] = [
  { icon: '▣', label: 'Dashboard', id: 'dashboard' },
  { icon: '◉', label: 'Promoters', id: 'promoters' },
  { icon: '◈', label: 'Jobs',      id: 'jobs'      },
  { icon: '⬡', label: 'Shifts',    id: 'shifts'    },
  { icon: '◆', label: 'Payroll',   id: 'payroll'   },
  { icon: '▤', label: 'Reports',   id: 'reports'   },
  { icon: '⊙', label: 'Settings',  id: 'settings'  },
];

/* ─── SHARED UI ──────────────────────────────────────────────── */
function Badge({ children, color }: BadgeProps) {
  const map: Record<BadgeColor, { bg: string; text: string }> = {
    green:  { bg: 'rgba(34,197,94,0.1)',   text: '#16A34A' },
    amber:  { bg: 'rgba(245,158,11,0.1)',  text: '#D97706' },
    red:    { bg: 'rgba(239,68,68,0.1)',   text: '#DC2626' },
    blue:   { bg: 'rgba(59,130,246,0.1)',  text: '#2563EB' },
    purple: { bg: 'rgba(139,92,246,0.1)',  text: '#7C3AED' },
    gold:   { bg: GOLD_MUTED,             text: GOLD      },
  };
  const c = map[color];
  return (
    <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', background: c.bg, color: c.text, padding: '4px 10px', display: 'inline-block' }}>
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, delta, accent }: StatProps) {
  return (
    <div
      style={{ background: ADMIN_CARD, border: `1px solid ${ADMIN_BORDER}`, padding: 28, position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.25s' }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent ?? GOLD }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#999', marginBottom: 12 }}>{label}</p>
          <p style={{ fontFamily: FD, fontSize: 40, fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>{value}</p>
          {delta && <p style={{ fontFamily: FB, fontSize: 11, color: '#22C55E', marginTop: 8 }}>↑ {delta}</p>}
        </div>
        <span style={{ fontSize: 22, color: accent ?? GOLD, opacity: 0.65 }}>{icon}</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: HeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
      <div>
        <h1 style={{ fontFamily: FD, fontSize: 32, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1 }}>{title}</h1>
        {subtitle && <p style={{ fontFamily: FB, fontSize: 13, color: '#888', marginTop: 7 }}>{subtitle}</p>}
      </div>
      {action && (
        <button
          style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', background: GOLD, color: BLACK, border: 'none', padding: '12px 28px', cursor: 'pointer', transition: 'all 0.25s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)'; }}
        >{action}</button>
      )}
    </div>
  );
}

function AdminTable({ columns, rows }: TableProps) {
  return (
    <div style={{ background: ADMIN_CARD, border: `1px solid ${ADMIN_BORDER}`, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F9F8F6', borderBottom: `1px solid ${ADMIN_BORDER}` }}>
            {columns.map((col) => (
              <th key={col} style={{ fontFamily: FB, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#999', padding: '14px 20px', textAlign: 'left' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              style={{ borderBottom: `1px solid ${ADMIN_BORDER}`, transition: 'background 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAF8')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {row.map((cell, j) => (
                <td key={j} style={{ fontFamily: FB, fontSize: 13, color: '#333', padding: '15px 20px' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── VIEW: DASHBOARD ────────────────────────────────────────── */
function DashboardView() {
  return (
    <div>
      <SectionHeader title="Dashboard Overview" subtitle="Tuesday, 10 March 2026 · Johannesburg" action="+ New Job" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 }}>
        <StatCard icon="◉" label="Active Promoters"  value="284"    delta="12 this month"  accent={GOLD}     />
        <StatCard icon="⬡" label="Live Shifts Today" value="37"     delta="4 more than Fri" accent="#3A7BD5" />
        <StatCard icon="◆" label="Pending Payroll"   value="R 124K"                         accent="#8B5CF6" />
        <StatCard icon="▣" label="Open Jobs"         value="12"     delta="3 filling fast"  accent="#22C55E" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#999', marginBottom: 16 }}>Recent Activity</p>
          <AdminTable
            columns={['Promoter', 'Event', 'Status', 'Time']}
            rows={[
              ['Ayanda Dlamini', 'Tiger Brands – Joburg CBD', <Badge color="green">Checked In</Badge>, '08:02 AM'],
              ['Thabo Mokoena',  'Castle Lager – Soweto',     <Badge color="green">Checked In</Badge>, '08:14 AM'],
              ['Lerato Khumalo', 'Unilever – Sandton',        <Badge color="amber">Late</Badge>,       '08:31 AM'],
              ['Sipho Ndlovu',   'Nando\'s – Rosebank',       <Badge color="red">No-Show</Badge>,      '—'        ],
              ['Naledi Sithole', 'MTN – Pretoria',            <Badge color="blue">Standby</Badge>,     '—'        ],
            ]}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: ADMIN_CARD, border: `1px solid ${ADMIN_BORDER}`, padding: 28 }}>
            <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#999', marginBottom: 20 }}>Quick Actions</p>
            {['Create New Job', 'Review Applicants (8)', 'Approve Payroll', 'Generate Report'].map((a) => (
              <button key={a}
                style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: `1px solid ${ADMIN_BORDER}`, fontFamily: FB, fontSize: 12, color: '#333', cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ADMIN_BORDER; e.currentTarget.style.color = '#333'; }}
              >{a} <span style={{ fontSize: 10 }}>›</span></button>
            ))}
          </div>
          <div style={{ background: BLACK, padding: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: GOLD }} />
            <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 14 }}>Pending Reviews</p>
            <p style={{ fontFamily: FD, fontSize: 48, fontWeight: 900, color: WHITE }}>8</p>
            <p style={{ fontFamily: FB, fontSize: 12, color: 'rgba(244,239,230,0.5)', marginBottom: 22 }}>applicants awaiting review</p>
            <button
              style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', background: GOLD, color: BLACK, border: 'none', padding: '11px 0', cursor: 'pointer', width: '100%', transition: 'background 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = GOLD_LIGHT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
            >Review Now →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── VIEW: PROMOTERS ────────────────────────────────────────── */
function PromotersView() {
  return (
    <div>
      <SectionHeader title="Promoters" subtitle="Manage your national promoter network" action="+ Invite Promoter" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 }}>
        <StatCard icon="◉" label="Total Registered" value="284" accent={GOLD}     />
        <StatCard icon="▣" label="Active"            value="241" accent="#22C55E" />
        <StatCard icon="⬡" label="Pending Review"    value="8"   accent="#F59E0B" />
        <StatCard icon="◆" label="Blacklisted"       value="3"   accent="#EF4444" />
      </div>
      <AdminTable
        columns={['Name', 'Profile', 'City', 'Status', 'Score', 'Action']}
        rows={[
          ['Ayanda Dlamini', 'Female · 1.68m', 'Cape Town',    <Badge color="green">Active</Badge>,     '★ 4.9', <Badge color="gold">View</Badge>   ],
          ['Thabo Mokoena',  'Male · 1.82m',   'Johannesburg', <Badge color="green">Active</Badge>,     '★ 4.7', <Badge color="gold">View</Badge>   ],
          ['Lerato Khumalo', 'Female · 1.65m', 'Pretoria',     <Badge color="amber">Pending</Badge>,    '★ —',   <Badge color="gold">Review</Badge> ],
          ['Sipho Ndlovu',   'Male · 1.79m',   'Durban',       <Badge color="red">Blacklisted</Badge>,  '★ 2.1', <Badge color="gold">View</Badge>   ],
          ['Naledi Sithole', 'Female · 1.72m', 'Johannesburg', <Badge color="green">Active</Badge>,     '★ 4.8', <Badge color="gold">View</Badge>   ],
          ['Kagiso Molefe',  'Male · 1.75m',   'Soweto',       <Badge color="blue">Standby</Badge>,     '★ 4.5', <Badge color="gold">View</Badge>   ],
        ]}
      />
    </div>
  );
}

/* ─── VIEW: JOBS ─────────────────────────────────────────────── */
function JobsView() {
  return (
    <div>
      <SectionHeader title="Jobs" subtitle="Create and manage brand activation campaigns" action="+ Create Job (Wizard)" />
      <AdminTable
        columns={['Job Title', 'Client', 'Venue', 'Date', 'Status', 'Filled']}
        rows={[
          ['Tiger Brands Activation', 'Tiger Brands', 'Johannesburg CBD', '12 Mar 2026', <Badge color="green">Open</Badge>,       '8 / 10'  ],
          ['Castle Lager Promo',      'SABMiller',    'Soweto',           '15 Mar 2026', <Badge color="green">Open</Badge>,       '5 / 6'   ],
          ['MTN Brand Day',           'MTN',          'Pretoria',         '18 Mar 2026', <Badge color="amber">Filling</Badge>,    '9 / 12'  ],
          ["Nando's Launch",          "Nando's SA",   'Rosebank',         '22 Mar 2026', <Badge color="blue">Draft</Badge>,       '0 / 8'   ],
          ['Unilever Sampling',       'Unilever',     'Sandton City',     '10 Mar 2026', <Badge color="purple">Completed</Badge>, '12 / 12' ],
        ]}
      />
    </div>
  );
}

/* ─── VIEW: SHIFTS ───────────────────────────────────────────── */
function ShiftsView() {
  const pins = [
    { top: '28%', left: '42%', color: '#22C55E' }, { top: '54%', left: '61%', color: '#22C55E' },
    { top: '40%', left: '55%', color: '#F59E0B' }, { top: '62%', left: '38%', color: '#22C55E' },
    { top: '35%', left: '70%', color: '#EF4444' }, { top: '48%', left: '30%', color: '#22C55E' },
  ];
  return (
    <div>
      <SectionHeader title="Live Shifts" subtitle="Real-time promoter locations across South Africa" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 28 }}>
        <StatCard icon="●" label="Checked In" value="37" accent="#22C55E" />
        <StatCard icon="●" label="Late"        value="4"  accent="#F59E0B" />
        <StatCard icon="●" label="No-Show"     value="2"  accent="#EF4444" />
      </div>
      <div style={{ background: BLACK, height: 400, position: 'relative', overflow: 'hidden', border: '1px solid rgba(196,151,58,0.15)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(196,151,58,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(196,151,58,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: FD, fontSize: 44, color: GOLD }}>⬡</div>
          <p style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, color: WHITE }}>Live Operations Map</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: 'rgba(244,239,230,0.45)' }}>Google Maps SDK · 37 promoters live across SA</p>
        </div>
        {pins.map((p, i) => (
          <div key={i} style={{ position: 'absolute', top: p.top, left: p.left, width: 12, height: 12, borderRadius: '50%', background: p.color, border: '2px solid white', boxShadow: `0 0 8px ${p.color}`, animation: 'blink 2s infinite', animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── VIEW: PAYROLL ──────────────────────────────────────────── */
function PayrollView() {
  return (
    <div>
      <SectionHeader title="Payroll" subtitle="Approve earnings and export for EFT via Paystack" action="Approve All + Export CSV" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 28 }}>
        <StatCard icon="◆" label="Total Pending" value="R 124,650" accent={GOLD}     />
        <StatCard icon="▣" label="Approved"       value="R 89,200"  accent="#22C55E" />
        <StatCard icon="◈" label="Deductions"     value="R 2,340"   accent="#EF4444" />
      </div>
      <AdminTable
        columns={['Promoter', 'Shift', 'Rate', 'Gross Pay', 'Adjustments', 'Status']}
        rows={[
          ['Ayanda Dlamini', 'Tiger Brands · 12 Mar',  '8h × R120',  'R 960',   '—',          <Badge color="green">Approved</Badge>   ],
          ['Thabo Mokoena',  'Castle Lager · 15 Mar',  '6h × R110',  'R 660',   '-R 55 late', <Badge color="amber">Pending</Badge>    ],
          ['Lerato Khumalo', 'MTN Brand Day · 18 Mar', '10h × R130', 'R 1,300', '—',          <Badge color="amber">Pending</Badge>    ],
          ['Naledi Sithole', 'Unilever · 10 Mar',      '8h × R120',  'R 960',   '—',          <Badge color="green">Approved</Badge>   ],
          ['Kagiso Molefe',  "Nando's · 22 Mar",       '7h × R115',  'R 805',   '—',          <Badge color="blue">Calculated</Badge>  ],
        ]}
      />
    </div>
  );
}

/* ─── VIEW: REPORTS ──────────────────────────────────────────── */
function ReportsView() {
  const reports = [
    { client: 'Tiger Brands', campaign: 'National Activation Q1',  date: 'Mar 2026', attendance: '98%',  promoters: 24 },
    { client: 'SABMiller',    campaign: 'Castle Lager Promo Tour',  date: 'Feb 2026', attendance: '94%',  promoters: 18 },
    { client: 'MTN',          campaign: 'Brand Day Pretoria',       date: 'Mar 2026', attendance: '100%', promoters: 12 },
  ];
  return (
    <div>
      <SectionHeader title="Client Reports" subtitle="Generate automated PDF campaign reports" action="+ Generate Report" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
        {reports.map((r, i) => (
          <div key={i}
            style={{ background: ADMIN_CARD, border: `1px solid ${ADMIN_BORDER}`, padding: 32, position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.25s' }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: GOLD }} />
            <p style={{ fontFamily: FB, fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>{r.client}</p>
            <h3 style={{ fontFamily: FD, fontSize: 19, fontWeight: 700, color: '#1a1a1a', marginBottom: 24, lineHeight: 1.3 }}>{r.campaign}</h3>
            <div style={{ display: 'flex', gap: 28, marginBottom: 28 }}>
              <div>
                <p style={{ fontFamily: FB, fontSize: 9, color: '#aaa', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Attendance</p>
                <p style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, color: '#22C55E' }}>{r.attendance}</p>
              </div>
              <div>
                <p style={{ fontFamily: FB, fontSize: 9, color: '#aaa', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Promoters</p>
                <p style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, color: '#1a1a1a' }}>{r.promoters}</p>
              </div>
              <div>
                <p style={{ fontFamily: FB, fontSize: 9, color: '#aaa', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Period</p>
                <p style={{ fontFamily: FB, fontSize: 13, color: '#666', marginTop: 4 }}>{r.date}</p>
              </div>
            </div>
            <button
              style={{ width: '100%', padding: '11px 0', background: GOLD, border: 'none', fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: BLACK, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = GOLD_LIGHT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
            >Download PDF Report</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── VIEW: SETTINGS ─────────────────────────────────────────── */
function SettingsView() {
  const items = [
    { icon: '◈', title: 'SMS Provider',            desc: "Africa's Talking / Clickatell — configured in .env"           },
    { icon: '⬡', title: 'Geo-Fencing Radius',       desc: 'Default: 200 metres from venue GPS pin'                       },
    { icon: '◆', title: 'POPIA Compliance',          desc: '7-year retention · Auto-delete rejected applicants after 30d' },
    { icon: '▣', title: 'Paystack Integration',      desc: 'Bulk EFT export for South African banking'                    },
    { icon: '◉', title: 'Notification Windows',      desc: 'Push alerts: 24h, 2h, and 30 min before shift start'         },
    { icon: '⊙', title: 'Reliability Score Weight',  desc: 'Distance 40% · Past performance 40% · Attributes 20%'        },
  ];
  return (
    <div>
      <SectionHeader title="System Settings" subtitle="Configure platform behaviour and integrations" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {items.map((s, i) => (
          <div key={i}
            style={{ background: ADMIN_CARD, border: `1px solid ${ADMIN_BORDER}`, padding: 28, display: 'flex', gap: 20, alignItems: 'flex-start', transition: 'box-shadow 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ width: 44, height: 44, background: GOLD_MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: GOLD, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: FB, fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>{s.title}</p>
              <p style={{ fontFamily: FB, fontSize: 12, color: '#888', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
            <button
              style={{ background: 'none', border: `1px solid ${ADMIN_BORDER}`, fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', padding: '8px 16px', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = ADMIN_BORDER; e.currentTarget.style.color = '#555'; }}
            >Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── VIEW MAP ───────────────────────────────────────────────── */
const VIEWS: Record<NavId, () => JSX.Element> = {
  dashboard: DashboardView,
  promoters: PromotersView,
  jobs:      JobsView,
  shifts:    ShiftsView,
  payroll:   PayrollView,
  reports:   ReportsView,
  settings:  SettingsView,
};

/* ─── ADMIN DASHBOARD ────────────────────────────────────────── */
export default function AdminDashboard() {
  const [active,    setActive]    = useState<NavId>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const ActiveView = VIEWS[active];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: FB, background: ADMIN_BG, overflow: 'hidden' }}>
      <style>{GLOBAL_CSS}</style>

      {/* SIDEBAR */}
      <aside style={{ width: collapsed ? 64 : 240, background: BLACK, display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', flexShrink: 0, borderRight: `1px solid ${BLACK_BORDER}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: GOLD }} />

        {/* Logo */}
        <div style={{ padding: '32px 20px 24px', borderBottom: `1px solid ${BLACK_BORDER}`, minHeight: 80, display: 'flex', alignItems: 'center' }}>
          {collapsed
            ? <span style={{ fontFamily: FD, fontSize: 18, fontWeight: 900, color: GOLD, textAlign: 'center', width: '100%' }}>H</span>
            : <span style={{ fontFamily: FD, fontSize: 16, fontWeight: 700 }}>
                <span style={{ color: GOLD }}>HONEY</span>
                <span style={{ color: WHITE }}> GROUP</span>
              </span>
          }
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          {NAV.map((item) => (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 14, padding: collapsed ? '14px 0' : '14px 20px', justifyContent: collapsed ? 'center' : 'flex-start', background: active === item.id ? GOLD_MUTED : 'transparent', border: 'none', cursor: 'pointer', borderLeft: active === item.id ? `3px solid ${GOLD}` : '3px solid transparent', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { if (active !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(e) => { if (active !== item.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 15, color: active === item.id ? GOLD : WHITE_MUTED, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontFamily: FB, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: active === item.id ? GOLD : WHITE_MUTED, whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ padding: '14px 20px', background: 'transparent', border: 'none', borderTop: `1px solid ${BLACK_BORDER}`, cursor: 'pointer', color: 'rgba(244,239,230,0.3)', fontSize: 18, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(244,239,230,0.3)')}
        >{collapsed ? '›' : '‹'}</button>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOP BAR */}
        <header style={{ background: ADMIN_CARD, borderBottom: `1px solid ${ADMIN_BORDER}`, padding: '0 36px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <span style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD }}>
              {NAV.find((n) => n.id === active)?.label}
            </span>
            <span style={{ fontFamily: FB, fontSize: 11, color: '#bbb', marginLeft: 8 }}>/ Admin Portal</span>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', animation: 'blink 1.5s infinite' }} />
              <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#22C55E' }}>Live</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FB, fontSize: 13, fontWeight: 700, color: BLACK }}>A</div>
              <div>
                <div style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>Admin User</div>
                <div style={{ fontFamily: FB, fontSize: 10, color: '#999' }}>Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 36 }}>
          <ActiveView />
        </main>
      </div>
    </div>
  );
}