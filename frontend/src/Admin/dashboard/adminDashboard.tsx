import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AdminLayout } from '../AdminLayout'

// ─── Updated palette from reference image ─────────────────────────────────────
const G   = '#D4880A'   // Warm amber primary
const GL  = '#E8A820'   // Bright golden yellow
const G2  = '#8B5A1A'   // Dark brown
const GP  = '#F5D898'   // Soft peach highlight

const B  = '#0C0A07'
const D1 = '#121008'
const D2 = '#1A1508'
const D3 = '#221C0C'
const GM = '#2A2210'
const GL2= '#352C14'

const BB = 'rgba(212,136,10,0.14)'
const BB2= 'rgba(212,136,10,0.07)'

const W   = '#FAF3E8'
const W85 = 'rgba(250,243,232,0.85)'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'
const W12 = 'rgba(250,243,232,0.10)'

// Status palette — brighter, more vivid against dark warm background
const TEAL       = '#4AABB8'   // approved / active
const AMBER      = '#E8A820'   // pending
const CORAL      = '#C4614A'   // rejected / warning
const SKY        = '#5A9EC4'   // neutral info

const FD = "'Playfair Display', Georgia, serif"
const FB = "'DM Sans', system-ui, sans-serif"

// ─── Status color helper ──────────────────────────────────────────────────────
function statusColor(status: string): string {
  if (status === 'approved' || status === 'active') return TEAL
  if (status === 'rejected' || status === 'inactive') return CORAL
  if (status === 'pending' || status === 'pending_review') return AMBER
  if (status === 'new') return SKY
  return W28
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_LOGINS = [
  { id:'L001', name:'Ayanda Dlamini', email:'ayanda@email.com', role:'promoter', time:'2026-03-11T08:02:00', ip:'196.25.1.4'  },
  { id:'L002', name:'Thabo Nkosi',    email:'thabo@email.com',  role:'promoter', time:'2026-03-11T08:14:00', ip:'196.25.1.7'  },
  { id:'L003', name:'Acme Corp',      email:'acme@corp.co.za',  role:'business', time:'2026-03-11T09:01:00', ip:'41.13.22.9'  },
  { id:'L004', name:'Lerato Mokoena', email:'lerato@email.com', role:'promoter', time:'2026-03-10T17:30:00', ip:'196.25.1.12' },
  { id:'L005', name:'RedBull SA',     email:'rb@redbull.co.za', role:'business', time:'2026-03-10T14:22:00', ip:'41.13.55.3'  },
  { id:'L006', name:'Sipho Mhlongo',  email:'sipho@email.com',  role:'promoter', time:'2026-03-09T11:45:00', ip:'196.25.1.9'  },
]

const MOCK_REGISTRATIONS = [
  { id:'R001', name:'Zanele Motha',    email:'zanele@email.com',  role:'promoter', date:'2026-03-11', status:'pending',  city:'Johannesburg', phone:'+27 79 111 2222', source:'mock', details:{ gender:'Female', height:'1.70m', idNumber:'9801010001088', experience:'2 years brand activation' } },
  { id:'R002', name:'Musa Dube',       email:'musa@email.com',    role:'promoter', date:'2026-03-10', status:'pending',  city:'Cape Town',    phone:'+27 72 333 4444', source:'mock', details:{ gender:'Male',   height:'1.82m', idNumber:'9505050002083', experience:'1 year events' } },
  { id:'R003', name:'FreshBrands Ltd', email:'fresh@brands.co.za',role:'business', date:'2026-03-10', status:'pending',  city:'Durban',       phone:'+27 31 555 6666', source:'mock', details:{ regNumber:'2022/123456/07', industry:'FMCG', website:'freshbrands.co.za', contactPerson:'Jane Dlamini' } },
  { id:'R004', name:'Nomsa Zulu',      email:'nomsa@email.com',   role:'promoter', date:'2026-03-09', status:'approved', city:'Pretoria',     phone:'+27 83 777 8888', source:'mock', details:{ gender:'Female', height:'1.65m', idNumber:'0002020003081', experience:'3 years retail promotions' } },
  { id:'R005', name:'PromoNation',     email:'promo@nation.co.za',role:'business', date:'2026-03-08', status:'rejected', city:'Johannesburg', phone:'+27 11 999 0000', source:'mock', details:{ regNumber:'2019/654321/07', industry:'Events', website:'promonation.co.za', contactPerson:'Bob Smith' } },
  { id:'R006', name:'Bongani Khumalo', email:'bong@email.com',    role:'promoter', date:'2026-03-08', status:'approved', city:'Durban',       phone:'+27 61 222 3333', source:'mock', details:{ gender:'Male',   height:'1.78m', idNumber:'9811110004086', experience:'4 years field marketing' } },
]

// ── CLIENTS — businesses that have registered on the platform ──────────────────
const MOCK_CLIENTS = [
  { id:'C001', name:'RedBull South Africa',   contact:'James Mokoena',   email:'rb@redbull.co.za',      phone:'+27 11 555 0001', industry:'FMCG / Energy',     city:'Johannesburg', registeredDate:'2024-01-12', activeSince:'2024-01', jobsRun:14, totalHours:312, status:'active',   budget:'R 48,000',  website:'redbull.com/za',     regNumber:'2005/098765/07', description:'Energy drink brand activation & sampling campaigns across Gauteng.' },
  { id:'C002', name:'Acme Corp',              contact:'Priya Nair',      email:'acme@corp.co.za',       phone:'+27 21 555 0002', industry:'Retail',            city:'Cape Town',    registeredDate:'2023-06-03', activeSince:'2023-06', jobsRun:9,  totalHours:204, status:'active',   budget:'R 32,000',  website:'acmecorp.co.za',     regNumber:'2010/112233/07', description:'Multi-category retail promotions and in-store activations.' },
  { id:'C003', name:'FreshBrands Ltd',        contact:'Jane Dlamini',    email:'fresh@brands.co.za',    phone:'+27 31 555 6666', industry:'FMCG',              city:'Durban',       registeredDate:'2025-11-20', activeSince:'2025-11', jobsRun:3,  totalHours:48,  status:'new',      budget:'R 8,400',   website:'freshbrands.co.za',  regNumber:'2022/123456/07', description:'New FMCG client specialising in health and wellness product launches.' },
  { id:'C004', name:'Castle Lager SA',        contact:'Sipho Mahlangu',  email:'castle@sab.co.za',      phone:'+27 11 555 0004', industry:'Beverages',         city:'Johannesburg', registeredDate:'2022-03-08', activeSince:'2022-03', jobsRun:28, totalHours:680, status:'active',   budget:'R 112,000', website:'castlelager.co.za',  regNumber:'1998/003344/07', description:'Beer brand activations, stadium events, and trade promotions nationwide.' },
  { id:'C005', name:'PromoNation',            contact:'Bob Smith',       email:'promo@nation.co.za',    phone:'+27 11 999 0000', industry:'Events',            city:'Johannesburg', registeredDate:'2024-08-15', activeSince:'2024-08', jobsRun:2,  totalHours:16,  status:'inactive', budget:'R 2,800',   website:'promonation.co.za',  regNumber:'2019/654321/07', description:'Event production company with limited recent activity.' },
  { id:'C006', name:'Standard Bank Promos',  contact:'Lerato Sithole',  email:'promos@stdbank.co.za',  phone:'+27 11 555 0006', industry:'Financial Services',city:'Pretoria',     registeredDate:'2023-09-01', activeSince:'2023-09', jobsRun:7,  totalHours:168, status:'active',   budget:'R 29,400',  website:'standardbank.co.za', regNumber:'1969/017128/06', description:'Consumer banking product promotions and financial literacy activations.' },
  { id:'C007', name:'Nando\'s Marketing',    contact:'Thandi Khumalo',  email:'mktg@nandos.co.za',     phone:'+27 11 555 0007', industry:'Quick Service Restaurant', city:'Johannesburg', registeredDate:'2025-02-10', activeSince:'2025-02', jobsRun:5,  totalHours:88,  status:'active',   budget:'R 15,600',  website:'nandos.co.za',       regNumber:'1990/004499/07', description:'Brand activation and loyalty campaign promoters for restaurant launches.' },
  { id:'C008', name:'Vodacom Business',      contact:'Amahle Ndaba',    email:'biz@vodacom.co.za',     phone:'+27 11 555 0008', industry:'Telecoms',          city:'Midrand',      registeredDate:'2023-03-15', activeSince:'2023-03', jobsRun:11, totalHours:256, status:'active',   budget:'R 44,800',  website:'vodacom.co.za',      regNumber:'1993/003367/07', description:'Telco product launches, bundle promotions, and retail point-of-sale activations.' },
]

const INIT_MESSAGES = [
  { id:'M001', from:'RedBull SA',     fromRole:'business', to:'Admin',         subject:'Complaint: Promoter no-show',     body:'Ayanda Dlamini did not show up for the Sandton shift on March 8th. This is the second time.', date:'2026-03-11', read:false, type:'complaint', regardingName:'Ayanda Dlamini' },
  { id:'M002', from:'Ayanda Dlamini', fromRole:'promoter', to:'Admin',         subject:'Review: RedBull event was great', body:'The event at Sandton City was well organised. The client was professional.',                 date:'2026-03-10', read:true,  type:'review',    regardingName:'RedBull SA'      },
  { id:'M003', from:'FreshBrands',    fromRole:'business', to:'Admin',         subject:'Review: Excellent promoter team', body:'The promoters provided for our launch event were outstanding.',                             date:'2026-03-09', read:false, type:'review',    regardingName:'Lerato Mokoena'  },
  { id:'M004', from:'Thabo Nkosi',    fromRole:'promoter', to:'Admin',         subject:'Complaint: Client was rude',      body:'During the Castle Lager event the client was dismissive and unprofessional.',               date:'2026-03-09', read:true,  type:'complaint', regardingName:'SABMiller'       },
  { id:'M005', from:'Acme Corp',      fromRole:'business', to:'Sipho Mhlongo', subject:'Job opportunity',                 body:'We have an upcoming activation in Pretoria on March 20th. Would you be available?',         date:'2026-03-08', read:true,  type:'message',   regardingName:''                },
]

const ACTIVITY = [
  { time:'2m ago',  msg:'Ayanda Dlamini checked in at Sandton City',  type:'checkin' },
  { time:'8m ago',  msg:'New registration: Zanele Motha — Promoter',  type:'apply'   },
  { time:'14m ago', msg:'Job #JB-204 filled — 8/8 slots taken',       type:'job'     },
  { time:'22m ago', msg:'Sipho Mhlongo submitted ID document',         type:'doc'     },
  { time:'31m ago', msg:'Payroll batch calculated — R12,400',          type:'payment' },
  { time:'45m ago', msg:'Lerato Mokoena flagged late — Rosebank Mall', type:'flag'    },
]

const TYPE_CLR: Record<string,string> = {
  checkin: TEAL,
  apply:   GL,
  job:     SKY,
  doc:     '#A090C8',
  payment: GL,
  flag:    CORAL,
}

function normalizeStatus(status: string): string {
  if (status === 'pending_review') return 'pending'
  return status || 'pending'
}

function isPending(status: string): boolean {
  return status === 'pending' || status === 'pending_review'
}

function loadRealRegistrations() {
  try {
    const stored: any[] = JSON.parse(localStorage.getItem('hg_users') || '[]')
    return stored.map((u: any, idx: number) => ({
      id: `LIVE-${idx + 1}`,
      name: u.fullName || u.contactName || u.companyName || u.email,
      email: u.email,
      role: u.role as string,
      date: u.createdAt ? String(u.createdAt).slice(0,10) : u.registeredAt ? String(u.registeredAt).slice(0,10) : new Date().toISOString().slice(0,10),
      status: normalizeStatus(String(u.status || 'pending')),
      city: u.city || u.location || (u.address ? u.address.split(',').pop()?.trim() : '') || 'Not specified',
      phone: u.phone || u.contactPhone || 'Not provided',
      source: 'real',
      _rawStatus: u.status || 'pending',
      details: u.role === 'promoter'
        ? { gender: u.gender||'N/A', height: u.height||'N/A', idNumber: u.idNumber||'N/A', experience: u.experience||'N/A' }
        : { regNumber: u.regNumber||'N/A', industry: u.industry||'N/A', website: u.website||'N/A', contactPerson: u.contactName||u.fullName||'N/A', companyName: u.companyName||'N/A' },
    }))
  } catch { return [] }
}

// ─── Shared components ────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
      color, background: `${color}1A`, border: `1px solid ${color}44`,
      padding: '3px 10px', borderRadius: 3,
    }}>
      {label}
    </span>
  )
}

function BronzeBtn({ children, onClick, outline=false, small=false, color=G }: any) {
  return (
    <button onClick={onClick}
      style={{
        padding: small ? '6px 14px' : '10px 22px',
        background: outline ? 'transparent' : `linear-gradient(135deg, ${color}, ${color}CC)`,
        border: `1px solid ${color}`,
        color: outline ? color : '#0C0A07',
        fontFamily: FB, fontSize: small ? 10 : 11, fontWeight: 700,
        letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase' as const,
        transition: 'all 0.2s', borderRadius: 3,
        boxShadow: outline ? 'none' : `0 2px 12px ${color}40`,
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
    >{children}</button>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 28 }}>
      <div>
        <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700 }}>{eyebrow}</div>
        <h1 style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: W, lineHeight: 1.15 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: W55, marginTop: 5, lineHeight: 1.5 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label:string; value:any; sub?:string; color:string }) {
  return (
    <div style={{ background: D2, padding: '24px 22px', position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      <div style={{ position:'absolute', top:0, right:0, width:60, height:60, background:`${color}06`, borderRadius:'0 0 0 60px' }} />
      <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: W55, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: FD, fontSize: 38, fontWeight: 700, color: W, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 8, fontWeight: 600 }}>{sub}</div>}
    </div>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onApprove, onReject }: { item: any; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const isPromoter = item.role === 'promoter'
  const pending = isPending(item.status)
  const accentColor = isPromoter ? SKY : GL
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: D2, border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:520, position:'relative', maxHeight:'90vh', overflowY:'auto', borderRadius:4 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: `linear-gradient(90deg, ${accentColor}, ${G2})` }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
        <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>{isPromoter ? 'Promoter Application' : 'Business Application'}</div>
        <div style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:8 }}>{item.name}</div>
        <div style={{ marginBottom:16, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <Badge label={item.status} color={statusColor(item.status)} />
          {item.source==='real' && <span style={{ fontSize:10, color:TEAL, fontWeight:700 }}>● Live Registration</span>}
        </div>
        {[{label:'Email',value:item.email},{label:'Phone',value:item.phone},{label:'City',value:item.city},{label:'Applied',value:item.date}].map((r:any) => (
          <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${BB}` }}>
            <span style={{ fontSize:12, color:W55 }}>{r.label}</span>
            <span style={{ fontSize:12, color:W, fontWeight:600 }}>{r.value}</span>
          </div>
        ))}
        <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:GL, marginTop:20, marginBottom:12, fontWeight:700 }}>{isPromoter ? 'Promoter Profile' : 'Business Profile'}</div>
        {Object.entries(item.details).map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${BB}` }}>
            <span style={{ fontSize:12, color:W55, textTransform:'capitalize' }}>{k.replace(/([A-Z])/g,' $1')}</span>
            <span style={{ fontSize:12, color:W, fontWeight:600 }}>{String(v)}</span>
          </div>
        ))}
        {pending && (
          <div style={{ display:'flex', gap:12, marginTop:28 }}>
            <BronzeBtn onClick={onApprove} color={TEAL}>✓ Approve</BronzeBtn>
            <BronzeBtn onClick={onReject} color={CORAL} outline>✗ Reject</BronzeBtn>
          </div>
        )}
        {!pending && item.status === 'approved' && (
          <div style={{ marginTop:28, padding:'12px 16px', background:`${TEAL}12`, border:`1px solid ${TEAL}44`, fontSize:12, color:TEAL, borderRadius:3 }}>
            ✓ This account has been approved and is visible on the platform.
          </div>
        )}
        {!pending && item.status === 'rejected' && (
          <div style={{ marginTop:28, padding:'12px 16px', background:`${CORAL}12`, border:`1px solid ${CORAL}44`, fontSize:12, color:CORAL, borderRadius:3 }}>
            ✗ This account has been rejected.
          </div>
        )}
      </div>
    </div>
  )
}

function MessageModal({ msg, onClose }: { msg: any; onClose: () => void }) {
  const [reply, setReply] = useState('')
  const typeColor = msg.type === 'complaint' ? CORAL : msg.type === 'review' ? TEAL : GL
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:D2, border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:540, position:'relative', borderRadius:4 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: `linear-gradient(90deg, ${typeColor}, ${G2})` }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
        <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:typeColor, marginBottom:8 }}>{msg.type} · from {msg.fromRole}</div>
        <div style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, marginBottom:4 }}>{msg.subject}</div>
        <div style={{ fontSize:12, color:W55, marginBottom:24 }}>From: {msg.from} · {msg.date}</div>
        {msg.regardingName && <div style={{ padding:'8px 14px', background:`${GL}0D`, border:`1px solid ${GL}30`, marginBottom:20, fontSize:12, color:GL }}>Regarding: <strong>{msg.regardingName}</strong></div>}
        <div style={{ fontSize:14, color:W, lineHeight:1.8, marginBottom:28, padding:16, background:BB2, border:`1px solid ${BB}` }}>{msg.body}</div>
        <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Type your response..."
          style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FB, fontSize:13, resize:'none', outline:'none', marginBottom:14 }}
          onFocus={e => e.currentTarget.style.borderColor = GL} onBlur={e => e.currentTarget.style.borderColor = BB}
        />
        <div style={{ display:'flex', gap:10 }}>
          <BronzeBtn onClick={onClose}>Send Reply</BronzeBtn>
          <BronzeBtn onClick={onClose} outline color={W55}>Close</BronzeBtn>
        </div>
      </div>
    </div>
  )
}

// ─── Client Detail Modal ──────────────────────────────────────────────────────
function ClientModal({ client, onClose }: { client: any; onClose: () => void }) {
  const accentColor = statusColor(client.status)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:D2, border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:560, position:'relative', maxHeight:'90vh', overflowY:'auto', borderRadius:4 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: `linear-gradient(90deg, ${accentColor}, ${G2})` }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>

        {/* Header */}
        <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>Client Profile</div>
        <div style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:6 }}>{client.name}</div>
        <div style={{ marginBottom:20, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <Badge label={client.status} color={accentColor} />
          <Badge label={client.industry} color={SKY} />
        </div>

        {/* Description */}
        {client.description && (
          <div style={{ padding:'12px 16px', background:BB2, border:`1px solid ${BB}`, marginBottom:20, fontSize:13, color:W85, lineHeight:1.6, borderRadius:3 }}>
            {client.description}
          </div>
        )}

        {/* Details */}
        {[
          {label:'Contact Person',   value: client.contact},
          {label:'Email',            value: client.email},
          {label:'Phone',            value: client.phone},
          {label:'City',             value: client.city},
          {label:'Website',          value: client.website},
          {label:'Reg. Number',      value: client.regNumber},
          {label:'Registered Date',  value: client.registeredDate},
          {label:'Active Since',     value: client.activeSince},
          {label:'Campaigns Run',    value: `${client.jobsRun} campaigns`},
          {label:'Total Hours',      value: `${client.totalHours} hrs`},
          {label:'Est. Budget Spent',value: client.budget},
        ].map((r:any) => (
          <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${BB}` }}>
            <span style={{ fontSize:12, color:W55 }}>{r.label}</span>
            <span style={{ fontSize:12, color:W, fontWeight:600 }}>{r.value}</span>
          </div>
        ))}

        <div style={{ marginTop:28, display:'flex', gap:12 }}>
          <BronzeBtn onClick={onClose}>Message Client</BronzeBtn>
          <BronzeBtn onClick={onClose} outline>View Jobs</BronzeBtn>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ regs, msgs, time, onRoute }: { regs: any[]; msgs: any[]; time: Date; onRoute: (id: string) => void }) {
  const getGreeting = () => { const h = time.getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; if (h < 21) return 'Good evening'; return 'Good night' }
  const unread = msgs.filter(m => !m.read).length
  const stats = [
    { label:'Active Promoters',  value: regs.filter(r => r.role==='promoter' && r.status==='approved').length, color: TEAL,  sub:'registered' },
    { label:'Pending Approvals', value: regs.filter(r => isPending(r.status)).length,                          color: AMBER, sub:'need review' },
    { label:'Unread Messages',   value: unread,                                                                 color: CORAL, sub:'complaints & reviews' },
    { label:'Active Clients',    value: MOCK_CLIENTS.filter(c => c.status === 'active').length,                color: GL,    sub:'business clients' },
  ]
  const quickActions = [
    { label:'Registrations', icon:'▣', id:'registrations', color: AMBER },
    { label:'Messages',      icon:'◆', id:'messages',      color: CORAL },
    { label:'Live Map',      icon:'⊙', id:'map',           color: SKY   },
    { label:'Clients',       icon:'◉', id:'clients',       color: GL    },
    { label:'Jobs',          icon:'◎', id:'jobs',          color: GL    },
    { label:'Reports',       icon:'▤', id:'reports',       color:'#A090C8' },
  ]
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:36 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>Admin Dashboard</div>
          <h1 style={{ fontFamily:FD, fontSize:32, fontWeight:700, color:W }}>{getGreeting()}, Admin.</h1>
          <p style={{ fontSize:13, color:W55, marginTop:6 }}>Here's what's happening across the platform today.</p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:FD, fontSize:26, color:GL }}>{time.toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</div>
          <div style={{ fontSize:11, color:W55, marginTop:4 }}>{time.toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long'})}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:BB, marginBottom:32 }}>
        {stats.map((s,i) => (
          <StatCard key={i} label={s.label} value={s.value} sub={s.sub} color={s.color} />
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:BB }}>
        <div style={{ background:D2, padding:28 }}>
          <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:18, fontWeight:700 }}>Quick Actions</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:BB }}>
            {quickActions.map(a => (
              <button key={a.id} onClick={() => onRoute(a.id)}
                style={{ padding:'16px 14px', background:D3, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'all 0.2s', fontFamily:FB }}
                onMouseEnter={e => { e.currentTarget.style.background = GM; e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = D3; e.currentTarget.style.transform='translateY(0)' }}>
                <span style={{ fontSize:15, color:a.color }}>{a.icon}</span>
                <span style={{ fontSize:12, color:W, fontWeight:600 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background:D2, padding:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, fontWeight:700 }}>Live Activity</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:TEAL, animation:'pulse 2s infinite' }} />
              <span style={{ fontSize:10, color:W55 }}>Live</span>
            </div>
          </div>
          {ACTIVITY.map((a,i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${BB}` : 'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:TYPE_CLR[a.type], marginTop:4, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:12, color:W, lineHeight:1.4 }}>{a.msg}</div>
                <div style={{ fontSize:10, color:W28, marginTop:2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Registrations Tab ────────────────────────────────────────────────────────
function RegistrationsTab({ regs, onDetail, onApprove, onReject }: { regs: any[]; onDetail: (r: any) => void; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const [statusF, setStatusF] = useState('all')
  const [roleF,   setRoleF]   = useState('all')
  const [dateF,   setDateF]   = useState('all')
  const liveCount    = regs.filter(r => r.source === 'real').length
  const pendingCount = regs.filter(r => isPending(r.status)).length
  const dates = ['all', ...Array.from(new Set(regs.map(r => r.date).filter(Boolean)))]
  const filtered = regs.filter(r =>
    (statusF === 'all' || r.status === statusF) &&
    (roleF   === 'all' || r.role   === roleF)   &&
    (dateF   === 'all' || r.date   === dateF)
  )

  const filterBtn = (active: boolean, color: string) => ({
    padding:'6px 14px', border:`1px solid ${active ? color : BB}`, cursor:'pointer', fontFamily:FB,
    fontSize:10, fontWeight:600, textTransform:'capitalize' as const, borderRadius:3,
    background: active ? `${color}1E` : 'transparent', color: active ? color : W55, transition:'all 0.2s',
  })

  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>People · Registrations</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Registrations</h1>
          <p style={{ fontSize:13, color:W55, marginTop:4 }}>Review and approve promoter and business applications.</p>
        </div>
        <div style={{ textAlign:'right', fontSize:12, color:W55 }}>
          <div><span style={{ color:AMBER, fontWeight:700 }}>{pendingCount}</span> pending approval</div>
          {liveCount > 0 && <div style={{ marginTop:4 }}><span style={{ color:TEAL, fontWeight:700 }}>● {liveCount}</span> live</div>}
        </div>
      </div>

      {regs.filter(r => r.source === 'real' && isPending(r.status)).length > 0 && (
        <div style={{ padding:'12px 18px', background:`${AMBER}0E`, border:`1px solid ${AMBER}50`, marginBottom:16, fontSize:12, color:AMBER, display:'flex', alignItems:'center', gap:8, borderRadius:3 }}>
          <span>⚠</span>
          <span><strong>{regs.filter(r => r.source === 'real' && isPending(r.status)).length}</strong> live registration{regs.filter(r => r.source === 'real' && isPending(r.status)).length > 1 ? 's' : ''} awaiting approval</span>
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4 }}>
          {['all','pending','approved','rejected'].map(f => (
            <button key={f} onClick={() => setStatusF(f)} style={filterBtn(statusF===f, statusColor(f) || GL)}>{f}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {['all','promoter','business'].map(f => (
            <button key={f} onClick={() => setRoleF(f)} style={filterBtn(roleF===f, SKY)}>{f}</button>
          ))}
        </div>
        <select value={dateF} onChange={e => setDateF(e.target.value)} style={{ background:D2, border:`1px solid ${BB}`, padding:'6px 12px', color:W, fontFamily:FB, fontSize:10, outline:'none', cursor:'pointer', borderRadius:3 }}>
          {dates.map(d => <option key={d} value={d}>{d === 'all' ? 'All Dates' : d}</option>)}
        </select>
      </div>

      <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ borderBottom:`1px solid ${BB}` }}>
            {['Name','Role','City','Date','Status','Source','Actions'].map(h => (
              <th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:W28, fontFamily:FB }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((r,i) => (
              <tr key={r.id}
                style={{ borderBottom: i < filtered.length-1 ? `1px solid ${BB}` : 'none', background:'transparent', transition:'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = BB2)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding:'14px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {r.source === 'real' && isPending(r.status) && <div style={{ width:5, height:5, borderRadius:'50%', background:AMBER, flexShrink:0 }} />}
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:W }}>{r.name}</div>
                      <div style={{ fontSize:11, color:W55 }}>{r.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:'14px 18px' }}><Badge label={r.role} color={r.role==='promoter' ? SKY : GL} /></td>
                <td style={{ padding:'14px 18px', fontSize:12, color:W55 }}>{r.city}</td>
                <td style={{ padding:'14px 18px', fontSize:12, color:W55 }}>{r.date}</td>
                <td style={{ padding:'14px 18px' }}><Badge label={r.status} color={statusColor(r.status)} /></td>
                <td style={{ padding:'14px 18px' }}><span style={{ fontSize:10, fontWeight:700, color: r.source==='real' ? TEAL : W28 }}>{r.source==='real' ? '● Live' : '○ Demo'}</span></td>
                <td style={{ padding:'14px 18px' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <button onClick={() => onDetail(r)} style={{ fontSize:11, color:GL, background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontWeight:600 }}>View →</button>
                    {isPending(r.status) && <>
                      <span style={{ color:W28 }}>·</span>
                      <button onClick={() => onApprove(r.id)} style={{ fontSize:11, color:TEAL, background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontWeight:700 }}>✓ Approve</button>
                      <span style={{ color:W28 }}>·</span>
                      <button onClick={() => onReject(r.id)} style={{ fontSize:11, color:CORAL, background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontWeight:700 }}>✗ Reject</button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding:40, textAlign:'center', color:W28, fontSize:13 }}>No registrations match your filters.</div>}
      </div>
    </div>
  )
}

// ─── CLIENTS TAB — independent page listing all registered businesses ─────────
function ClientsTab() {
  const [statusF, setStatusF] = useState('all')
  const [cityF,   setCityF]   = useState('all')
  const [search,  setSearch]  = useState('')
  const [viewing, setViewing] = useState<any>(null)
  const [sortBy,  setSortBy]  = useState<'name'|'jobsRun'|'totalHours'|'registeredDate'>('registeredDate')

  const clientStatusColor = (s: string) => statusColor(s)
  const cities = ['all', ...Array.from(new Set(MOCK_CLIENTS.map(c => c.city))).sort()]

  const filtered = MOCK_CLIENTS.filter(c =>
    (statusF === 'all' || c.status === statusF) &&
    (cityF   === 'all' || c.city   === cityF)   &&
    (search  === ''    ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()))
  ).sort((a: any, b: any) => {
    if (sortBy === 'jobsRun')        return b.jobsRun - a.jobsRun
    if (sortBy === 'totalHours')     return b.totalHours - a.totalHours
    if (sortBy === 'registeredDate') return b.registeredDate.localeCompare(a.registeredDate)
    return a.name.localeCompare(b.name)
  })

  const totalJobs   = MOCK_CLIENTS.reduce((a,c) => a + c.jobsRun, 0)
  const totalHours  = MOCK_CLIENTS.reduce((a,c) => a + c.totalHours, 0)
  const activeCount = MOCK_CLIENTS.filter(c => c.status === 'active').length
  const newCount    = MOCK_CLIENTS.filter(c => c.status === 'new').length

  const filterBtn = (active: boolean, color: string) => ({
    padding:'6px 16px', border:`1px solid ${active ? color : BB}`, cursor:'pointer', fontFamily:FB,
    fontSize:10, fontWeight:600, textTransform:'capitalize' as const, borderRadius:3,
    background: active ? `${color}1E` : 'transparent', color: active ? color : W55, transition:'all 0.2s',
  })

  const industryColor = (ind: string) => {
    if (ind.includes('FMCG') || ind.includes('Bev')) return GL
    if (ind.includes('Retail'))                       return SKY
    if (ind.includes('Telco'))                        return '#7AADCC'
    if (ind.includes('Finance'))                      return TEAL
    if (ind.includes('Event'))                        return CORAL
    if (ind.includes('Restaurant'))                   return '#C4A46A'
    return W28
  }

  const avatarAccents = [GL, TEAL, SKY, CORAL, AMBER, '#A090C8', '#7AADCC', '#C4A46A']

  // Column layout: Business 28% | Contact 20% | Industry+City 18% | Registered 10% | Campaigns 8% | Budget 10% | Status 9% | Action 7%
  const COLS = '28fr 20fr 18fr 10fr 8fr 10fr 9fr 7fr'

  return (
    <div style={{ padding:'40px 48px' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>People · Clients</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Client Accounts</h1>
          <p style={{ fontSize:13, color:W55, marginTop:4 }}>Businesses registered on the platform who book promoters.</p>
        </div>
        <BronzeBtn onClick={() => {}}>+ Add Client</BronzeBtn>
      </div>

      {/* ── Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:BB, marginBottom:32 }}>
        {[
          { label:'Active Clients',   value: activeCount,      color: GL,   sub:`of ${MOCK_CLIENTS.length} total` },
          { label:'New This Quarter', value: newCount,          color: SKY,  sub:'recently joined' },
          { label:'Total Campaigns',  value: totalJobs,         color: TEAL, sub:'across all clients' },
          { label:'Total Hours',      value: `${totalHours}h`, color: AMBER,sub:'promoter hours booked' },
        ].map((s,i) => <StatCard key={i} label={s.label} value={s.value} sub={s.sub} color={s.color} />)}
      </div>

      {/* ── Filters ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4 }}>
          {['all','active','new','inactive'].map(f => (
            <button key={f} onClick={() => setStatusF(f)} style={filterBtn(statusF===f, clientStatusColor(f))}>{f}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={cityF} onChange={e => setCityF(e.target.value)}
            style={{ background:D2, border:`1px solid ${BB}`, padding:'7px 12px', color:W, fontFamily:FB, fontSize:10, outline:'none', cursor:'pointer', borderRadius:3 }}>
            {cities.map(c => <option key={c} value={c}>{c === 'all' ? 'All Cities' : c}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            style={{ background:D2, border:`1px solid ${BB}`, padding:'7px 12px', color:W, fontFamily:FB, fontSize:10, outline:'none', cursor:'pointer', borderRadius:3 }}>
            <option value="registeredDate">Newest First</option>
            <option value="name">Name A–Z</option>
            <option value="jobsRun">Most Campaigns</option>
            <option value="totalHours">Most Hours</option>
          </select>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:W28, fontSize:12, pointerEvents:'none' }}>⌕</span>
            <input
              placeholder="Search clients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background:D2, border:`1px solid ${BB}`, padding:'7px 14px 7px 30px', color:W, fontFamily:FB, fontSize:11, outline:'none', borderRadius:3, width:200 }}
              onFocus={e => e.currentTarget.style.borderColor = GL}
              onBlur={e => e.currentTarget.style.borderColor = BB}
            />
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ borderRadius:4, overflow:'hidden', border:`1px solid ${BB}` }}>

        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns: COLS, background:D1, padding:'11px 24px', gap:0 }}>
          {['Business','Contact','Industry / City','Registered','Jobs','Est. Budget','Status',''].map(h => (
            <div key={h} style={{ fontSize:8.5, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:W28, fontFamily:FB, paddingRight:12 }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 && (
          <div style={{ padding:'48px 24px', textAlign:'center', color:W28, fontSize:13, background:D2 }}>
            No clients match your filters.
          </div>
        )}
        {filtered.map((c, i) => {
          const accent = avatarAccents[i % avatarAccents.length]
          return (
            <div
              key={c.id}
              onClick={() => setViewing(c)}
              style={{
                display:'grid', gridTemplateColumns: COLS,
                background: D2,
                padding:'20px 24px',
                gap:0,
                alignItems:'center',
                cursor:'pointer',
                transition:'background 0.16s',
                borderTop:`1px solid ${BB}`,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = D3)}
              onMouseLeave={e => (e.currentTarget.style.background = D2)}
            >
              {/* Business */}
              <div style={{ display:'flex', alignItems:'center', gap:12, paddingRight:16, minWidth:0 }}>
                <div style={{
                  width:40, height:40, borderRadius:8, flexShrink:0,
                  background:`linear-gradient(145deg, ${G2}CC, ${accent}33)`,
                  border:`1px solid ${accent}44`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:15, fontWeight:700, color:accent,
                }}>
                  {c.name.charAt(0)}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:W, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize:10.5, color:W28, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.email}</div>
                </div>
              </div>

              {/* Contact */}
              <div style={{ paddingRight:16 }}>
                <div style={{ fontSize:12, color:W85, fontWeight:500 }}>{c.contact}</div>
                <div style={{ fontSize:10.5, color:W28, marginTop:2 }}>{c.phone}</div>
              </div>

              {/* Industry / City */}
              <div style={{ paddingRight:16 }}>
                <div style={{ fontSize:10.5, color: industryColor(c.industry), fontWeight:700, marginBottom:3 }}>{c.industry}</div>
                <div style={{ fontSize:11, color:W55 }}>{c.city}</div>
              </div>

              {/* Registered */}
              <div style={{ paddingRight:16 }}>
                <div style={{ fontSize:11, color:W55 }}>{c.registeredDate}</div>
                <div style={{ fontSize:10, color:W28, marginTop:2 }}>since {c.activeSince}</div>
              </div>

              {/* Campaigns */}
              <div style={{ paddingRight:16 }}>
                <div style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, lineHeight:1 }}>{c.jobsRun}</div>
                <div style={{ fontSize:10, color:W28, marginTop:3 }}>{c.totalHours}h total</div>
              </div>

              {/* Budget */}
              <div style={{ paddingRight:16 }}>
                <div style={{ fontFamily:FD, fontSize:15, fontWeight:700, color:GL }}>{c.budget}</div>
              </div>

              {/* Status */}
              <div style={{ paddingRight:12 }}>
                <Badge label={c.status} color={clientStatusColor(c.status)} />
              </div>

              {/* Action */}
              <div>
                <button
                  onClick={e => { e.stopPropagation(); setViewing(c) }}
                  style={{ fontSize:11, color:GL, background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontWeight:700, whiteSpace:'nowrap', padding:0 }}
                  onMouseEnter={e => e.currentTarget.style.color = W}
                  onMouseLeave={e => e.currentTarget.style.color = GL}
                >View →</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Results count */}
      <div style={{ marginTop:12, fontSize:11, color:W28 }}>
        Showing <strong style={{ color:W55 }}>{filtered.length}</strong> of <strong style={{ color:W55 }}>{MOCK_CLIENTS.length}</strong> clients
      </div>

      {viewing && <ClientModal client={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

// ─── Logins Tab ───────────────────────────────────────────────────────────────
function LoginsTab() {
  const [roleF, setRoleF] = useState('all')
  const [dateF, setDateF] = useState('all')
  const dates = ['all', ...Array.from(new Set(MOCK_LOGINS.map(l => l.time.slice(0,10))))]
  const filtered = MOCK_LOGINS.filter(l =>
    (roleF === 'all' || l.role === roleF) &&
    (dateF === 'all' || l.time.startsWith(dateF))
  )
  const filterBtn = (active: boolean, color: string) => ({
    padding:'6px 14px', border:`1px solid ${active ? color : BB}`, cursor:'pointer', fontFamily:FB, fontSize:10, fontWeight:600, textTransform:'capitalize' as const, borderRadius:3,
    background: active ? `${color}1E` : 'transparent', color: active ? color : W55, transition:'all 0.2s',
  })
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>Comms · Activity</div>
        <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Login Activity</h1>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:BB, marginBottom:24 }}>
        {[
          { label:'Logins Today', value: MOCK_LOGINS.filter(l => l.time.startsWith('2026-03-11')).length, color:GL   },
          { label:'Promoters',    value: MOCK_LOGINS.filter(l => l.role==='promoter').length,             color:SKY  },
          { label:'Businesses',   value: MOCK_LOGINS.filter(l => l.role==='business').length,             color:AMBER},
        ].map((s,i) => <StatCard key={i} label={s.label} value={s.value} color={s.color} />)}
      </div>
      <div style={{ display:'flex', gap:4, marginBottom:16 }}>
        {['all','promoter','business'].map(f => <button key={f} onClick={() => setRoleF(f)} style={filterBtn(roleF===f, SKY)}>{f}</button>)}
        <select value={dateF} onChange={e => setDateF(e.target.value)} style={{ background:D2, border:`1px solid ${BB}`, padding:'6px 12px', color:W, fontFamily:FB, fontSize:10, outline:'none', cursor:'pointer', borderRadius:3, marginLeft:6 }}>
          {dates.map(d => <option key={d} value={d}>{d === 'all' ? 'All Dates' : d}</option>)}
        </select>
      </div>
      <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ borderBottom:`1px solid ${BB}` }}>
            {['User','Role','Time','IP'].map(h => <th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:W28, fontFamily:FB }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((l,i) => (
              <tr key={l.id} style={{ borderBottom: i < filtered.length-1 ? `1px solid ${BB}` : 'none', transition:'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = BB2)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding:'14px 18px' }}><div style={{ fontSize:13, fontWeight:600, color:W }}>{l.name}</div><div style={{ fontSize:11, color:W55 }}>{l.email}</div></td>
                <td style={{ padding:'14px 18px' }}><Badge label={l.role} color={l.role==='promoter' ? SKY : GL} /></td>
                <td style={{ padding:'14px 18px', fontSize:12, color:W55 }}>{new Date(l.time).toLocaleString('en-ZA',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                <td style={{ padding:'14px 18px', fontSize:12, color:W28, fontFamily:'monospace' }}>{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────
function MessagesTab({ msgs, setMsgs }: { msgs: any[]; setMsgs: (fn: (p: any[]) => any[]) => void }) {
  const [filter,  setFilter]  = useState('all')
  const [compose, setCompose] = useState(false)
  const [viewing, setViewing] = useState<any>(null)
  const [to,      setTo]      = useState('')
  const [subject, setSubject] = useState('')
  const [body,    setBody]    = useState('')
  const filtered = msgs.filter(m => filter === 'all' || m.type === filter)
  const typeColor = (t: string) => t === 'complaint' ? CORAL : t === 'review' ? TEAL : GL

  const filterBtn = (active: boolean, color: string) => ({
    padding:'6px 14px', border:`1px solid ${active ? color : BB}`, cursor:'pointer', fontFamily:FB, fontSize:10, fontWeight:600, textTransform:'capitalize' as const, borderRadius:3,
    background: active ? `${color}1E` : 'transparent', color: active ? color : W55, transition:'all 0.2s',
  })

  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>Comms · Messages</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Messages & Complaints</h1>
        </div>
        <BronzeBtn onClick={() => setCompose(true)}>+ Compose</BronzeBtn>
      </div>
      <div style={{ display:'flex', gap:4, marginBottom:20 }}>
        {['all','complaint','review','message'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={filterBtn(filter===f, f==='all' ? GL : typeColor(f))}>
            {f === 'all' ? `All (${msgs.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${msgs.filter(m=>m.type===f).length})`}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
        {filtered.map(m => (
          <div key={m.id} onClick={() => { setViewing(m); setMsgs(p => p.map(x => x.id===m.id ? {...x,read:true} : x)) }}
            style={{ background: m.read ? D2 : D3, border:`1px solid ${m.read ? BB : `${GL}28`}`, padding:'18px 22px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, transition:'all 0.2s', borderRadius:3 }}
            onMouseEnter={e => (e.currentTarget.style.background = GM)}
            onMouseLeave={e => (e.currentTarget.style.background = m.read ? D2 : D3)}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:typeColor(m.type), marginTop:5, flexShrink:0 }} />
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:W }}>{m.subject}</span>
                  {!m.read && <span style={{ fontSize:8, fontWeight:700, background:`linear-gradient(135deg, ${GL}, ${G})`, color:B, padding:'2px 7px', borderRadius:2 }}>NEW</span>}
                </div>
                <div style={{ fontSize:12, color:W55 }}>From: <strong style={{ color:W85 }}>{m.from}</strong> · {m.date}</div>
              </div>
            </div>
            <Badge label={m.type} color={typeColor(m.type)} />
          </div>
        ))}
      </div>
      {viewing && <MessageModal msg={viewing} onClose={() => setViewing(null)} />}
      {compose && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
          onClick={e => e.target === e.currentTarget && setCompose(false)}>
          <div style={{ background:D2, border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:500, position:'relative', borderRadius:4 }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: `linear-gradient(90deg, ${GL}, ${G2})` }} />
            <button onClick={() => setCompose(false)} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
            <div style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, marginBottom:24 }}>New Message</div>
            {[{label:'To',val:to,set:setTo,ph:'Recipient'},{label:'Subject',val:subject,set:setSubject,ph:'Subject'}].map(f => (
              <div key={f.label} style={{ marginBottom:16 }}>
                <label style={{ fontSize:9, fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:W55, display:'block', marginBottom:7 }}>{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  style={{ width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FB, fontSize:13, outline:'none', borderRadius:3 }}
                  onFocus={e => e.currentTarget.style.borderColor = GL} onBlur={e => e.currentTarget.style.borderColor = BB}
                />
              </div>
            ))}
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Message..."
              style={{ width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FB, fontSize:13, resize:'none', outline:'none', marginBottom:16, borderRadius:3 }}
              onFocus={e => e.currentTarget.style.borderColor = GL} onBlur={e => e.currentTarget.style.borderColor = BB}
            />
            <div style={{ display:'flex', gap:10 }}>
              <BronzeBtn onClick={() => {
                setMsgs(p => [{ id:`M${p.length+1}`, from:'Admin', fromRole:'admin', to, subject, body, date:new Date().toISOString().slice(0,10), read:true, type:'message', regardingName:'' }, ...p])
                setCompose(false); setTo(''); setSubject(''); setBody('')
              }}>Send</BronzeBtn>
              <BronzeBtn onClick={() => setCompose(false)} outline color={W55}>Cancel</BronzeBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ regs }: { regs: any[] }) {
  const [exportMsg, setExportMsg] = useState('')
  const doExport = (t: string) => { setExportMsg(`${t} export initiated.`); setTimeout(() => setExportMsg(''), 3000) }
  const [hourlyRate, setHourlyRate] = useState('120')
  const [hours,      setHours]      = useState('8')
  const [promoters,  setPromoters]  = useState('6')
  const calcTotal = parseFloat(hourlyRate||'0') * parseFloat(hours||'0') * parseFloat(promoters||'0')

  const cards = [
    { icon:'✦', color:SKY,          title:'Campaign Reports', desc:'Automated PDF reports on campaign attendance for client delivery.', btns:[['PDF','Campaign PDF'],['CSV','Campaign CSV']] },
    { icon:'▤', color:'#A090C8',    title:'Promoter Roster',  desc:'Export of all active promoters with contact details and scores.',   btns:[['CSV','Roster CSV'],['Excel','Roster Excel']] },
    { icon:'⬡', color:AMBER,        title:'Attendance Log',   desc:'Geo-verified check-in/out records with timestamps for all shifts.', btns:[['CSV','Attendance CSV'],['PDF','Attendance PDF']] },
    { icon:'◉', color:GL,           title:'Earnings Summary', desc:'Calculated earnings per promoter and per campaign.',                btns:[['CSV','Earnings CSV'],['Excel','Earnings Excel']] },
  ]
  const summary = [
    { label:'Registered Promoters', value: regs.filter(r=>r.role==='promoter').length },
    { label:'Active Promoters',     value: regs.filter(r=>r.role==='promoter'&&r.status==='approved').length },
    { label:'Active Clients',       value: MOCK_CLIENTS.filter(c=>c.status==='active').length },
    { label:'Pending Approvals',    value: regs.filter(r=>isPending(r.status)).length },
    { label:'Shifts This Month',    value: 42 },
    { label:'Est. Payroll (Month)', value: 'R 84,200' },
  ]
  const inputStyle: React.CSSProperties = { width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'10px 14px', color:W, fontFamily:FB, fontSize:13, outline:'none', borderRadius:3 }
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>System · Reporting</div>
        <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Reports & Exports</h1>
      </div>
      {exportMsg && <div style={{ padding:'12px 18px', background:`${GL}12`, border:`1px solid ${GL}44`, marginBottom:20, fontSize:13, color:GL, fontWeight:600, borderRadius:3 }}>✓ {exportMsg}</div>}
      <div style={{ background:D2, border:`1px solid ${BB}`, padding:28, marginBottom:20, borderRadius:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <span style={{ fontSize:18, color:GL }}>◈</span>
          <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:GL, fontWeight:700 }}>Payroll Calculator</div>
          <span style={{ fontSize:9, color:W28, marginLeft:8, padding:'2px 8px', border:`1px solid ${BB}`, letterSpacing:'0.1em', borderRadius:3 }}>Estimate only</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16, alignItems:'flex-end' }}>
          {[
            {label:'Hourly Rate (R)', val:hourlyRate, set:setHourlyRate},
            {label:'Hours per Shift', val:hours,      set:setHours},
            {label:'No. of Promoters',val:promoters,  set:setPromoters},
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize:9, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:W55, display:'block', marginBottom:8 }}>{f.label}</label>
              <input type="number" value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = GL} onBlur={e => e.currentTarget.style.borderColor = BB} />
            </div>
          ))}
          <div style={{ background: `linear-gradient(135deg, ${D3}, ${G2}30)`, border:`1px solid ${GL}44`, padding:'10px 16px', borderRadius:3 }}>
            <div style={{ fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase', color:W55, marginBottom:6 }}>Total Estimate</div>
            <div style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:GL }}>R {calcTotal.toLocaleString('en-ZA', {minimumFractionDigits:0})}</div>
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:BB, marginBottom:20 }}>
        {cards.map((c,i) => (
          <div key={i} style={{ background:D2, padding:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontSize:18, color:c.color }}>{c.icon}</span>
              <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:GL, fontWeight:700 }}>{c.title}</div>
            </div>
            <p style={{ fontSize:13, color:W55, marginBottom:18, lineHeight:1.6 }}>{c.desc}</p>
            <div style={{ display:'flex', gap:8 }}>
              <BronzeBtn onClick={() => doExport(c.btns[0][1])} small>{c.btns[0][0]}</BronzeBtn>
              <BronzeBtn onClick={() => doExport(c.btns[1][1])} small outline>{c.btns[1][0]}</BronzeBtn>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4 }}>
        <div style={{ padding:'14px 22px', borderBottom:`1px solid ${BB}`, fontSize:9, letterSpacing:'0.25em', textTransform:'uppercase', color:GL, fontWeight:700 }}>Platform Summary</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <tbody>
            {summary.map((row,i) => (
              <tr key={i} style={{ borderBottom: i < summary.length-1 ? `1px solid ${BB}` : 'none', transition:'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = BB2)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding:'14px 22px', fontSize:13, color:W55 }}>{row.label}</td>
                <td style={{ padding:'14px 22px', fontSize:14, fontWeight:700, color:GL, textAlign:'right', fontFamily:FD }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [saved,    setSaved]    = useState(false)
  const [platName, setPlatName] = useState('Honey Group Promotions')
  const [email,    setEmail]    = useState('admin@honeygroup.co.za')
  const [otp,      setOtp]      = useState("Africa's Talking")
  const [payment,  setPayment]  = useState('Paystack')
  const [geoR,     setGeoR]     = useState('200')
  const [jobR,     setJobR]     = useState('20')
  const [notifs,   setNotifs]   = useState(true)
  const [popia,    setPopia]    = useState(true)
  const [maint,    setMaint]    = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 3000) }

  const inputStyle: React.CSSProperties = { width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'10px 14px', color:W, fontFamily:FB, fontSize:13, outline:'none', borderRadius:3 }
  const labelStyle: React.CSSProperties = { fontSize:9, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:W55, display:'block', marginBottom:7 }

  const Toggle = ({ val, set }: { val: boolean; set: (v: boolean) => void }) => (
    <div onClick={() => set(!val)} style={{ width:40, height:22, borderRadius:11, background: val ? `linear-gradient(135deg, ${GL}, ${G})` : '#2A2210', cursor:'pointer', position:'relative', transition:'background 0.25s', flexShrink:0, border:`1px solid ${val ? G : BB}` }}>
      <div style={{ position:'absolute', top:3, left: val ? 19 : 3, width:14, height:14, borderRadius:'50%', background: val ? '#0C0A07' : W55, transition:'left 0.25s' }} />
    </div>
  )

  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>System · Config</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Platform Settings</h1>
        </div>
        <BronzeBtn onClick={save}>{saved ? '✓ Saved' : 'Save Changes'}</BronzeBtn>
      </div>
      {saved && <div style={{ padding:'12px 18px', background:`${TEAL}12`, border:`1px solid ${TEAL}44`, marginBottom:20, fontSize:13, color:TEAL, fontWeight:600, borderRadius:3 }}>✓ Settings saved successfully.</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:BB }}>
        <div style={{ background:D2, padding:28 }}>
          <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:GL, marginBottom:20, fontWeight:700 }}>General</div>
          <div style={{ marginBottom:18 }}><label style={labelStyle}>Platform Name</label><input value={platName} onChange={e => setPlatName(e.target.value)} style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
          <div><label style={labelStyle}>Support Email</label><input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
        </div>
        <div style={{ background:D2, padding:28 }}>
          <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:GL, marginBottom:20, fontWeight:700 }}>Geo & Radius</div>
          <div style={{ marginBottom:18 }}><label style={labelStyle}>Check-in Radius (m)</label><input value={geoR} onChange={e => setGeoR(e.target.value)} style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
          <div><label style={labelStyle}>Job Notification Radius (km)</label><input value={jobR} onChange={e => setJobR(e.target.value)} style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
        </div>
        <div style={{ background:D2, padding:28 }}>
          <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:GL, marginBottom:20, fontWeight:700 }}>Integrations</div>
          <div style={{ marginBottom:18 }}>
            <label style={labelStyle}>OTP Provider</label>
            <select value={otp} onChange={e => setOtp(e.target.value)} style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
              {["Africa's Talking",'Clickatell','Twilio'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Payment Reference Gateway</label>
            <select value={payment} onChange={e => setPayment(e.target.value)} style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
              {['Paystack Reference','PayFast Reference','Manual EFT'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ background:D2, padding:28 }}>
          <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:GL, marginBottom:20, fontWeight:700 }}>Feature Flags</div>
          {[
            { label:'Push Notifications', desc:'Send job alerts to promoters',   val:notifs, set:setNotifs },
            { label:'POPIA Compliance',   desc:'Enforce data protection',         val:popia,  set:setPopia  },
            { label:'Maintenance Mode',   desc:'Block non-admin access',          val:maint,  set:setMaint  },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:`1px solid ${BB}` }}>
              <div><div style={{ fontSize:13, fontWeight:600, color:W }}>{row.label}</div><div style={{ fontSize:11, color:W28, marginTop:2 }}>{row.desc}</div></div>
              <Toggle val={row.val} set={row.set} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'dashboard'
  const setTab = (t: string) => setSearchParams({ tab: t })
  const [time,       setTime]   = useState(new Date())
  const [regs,       setRegs]   = useState<any[]>([])
  const [msgs,       setMsgs]   = useState<any[]>(INIT_MESSAGES)
  const [detailItem, setDetail] = useState<any>(null)

  useEffect(() => {
    const real = loadRealRegistrations()
    const realEmails = new Set(real.map((r: any) => r.email))
    setRegs([...real, ...MOCK_REGISTRATIONS.filter(m => !realEmails.has(m.email))])
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const handleRoute = (id: string) => {
    const external: Record<string,string> = { users:'/admin/users', jobs:'/admin/jobs', map:'/admin/map', payments:'/admin/payments', onboarding:'/admin/onboarding' }
    if (external[id]) { navigate(external[id]); return }
    navigate('/admin?tab=' + id)
  }

  const updateStatus = (id: string, status: 'approved' | 'rejected') => {
    setRegs(p => p.map(r => {
      if (r.id !== id) return r
      if (r.source === 'real') {
        try {
          const u: any[] = JSON.parse(localStorage.getItem('hg_users') || '[]')
          localStorage.setItem('hg_users', JSON.stringify(
            u.map((x: any) => x.email === r.email ? { ...x, status } : x)
          ))
        } catch {}
      }
      return { ...r, status }
    }))
    setDetail(null)
  }

  return (
    <AdminLayout>
      {tab === 'dashboard'     && <DashboardTab     regs={regs} msgs={msgs} time={time} onRoute={handleRoute} />}
      {tab === 'registrations' && <RegistrationsTab regs={regs} onDetail={setDetail} onApprove={id => updateStatus(id,'approved')} onReject={id => updateStatus(id,'rejected')} />}
      {tab === 'clients'       && <ClientsTab />}
      {tab === 'logins'        && <LoginsTab />}
      {tab === 'messages'      && <MessagesTab msgs={msgs} setMsgs={setMsgs} />}
      {tab === 'reports'       && <ReportsTab regs={regs} />}
      {tab === 'settings'      && <SettingsTab />}

      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetail(null)}
          onApprove={() => updateStatus(detailItem.id, 'approved')}
          onReject={() => updateStatus(detailItem.id, 'rejected')}
        />
      )}
    </AdminLayout>
  )
}