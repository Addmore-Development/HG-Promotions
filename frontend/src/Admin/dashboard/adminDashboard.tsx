import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AdminLayout } from '../AdminLayout'

// ─── Design tokens ────────────────────────────────────────────────────────────
const G  = '#C4973A'
const B  = '#080808'
const BC = '#161616'
const BB = 'rgba(255,255,255,0.07)'
const W  = '#F4EFE6'
const WM = 'rgba(244,239,230,0.55)'
const WD = 'rgba(244,239,230,0.22)'
const FD = "'Playfair Display', Georgia, serif"
const FB = "'DM Sans', system-ui, sans-serif"

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
  { time:'31m ago', msg:'Payroll batch approved — R12,400 exported',   type:'payment' },
  { time:'45m ago', msg:'Lerato Mokoena flagged late — Rosebank Mall', type:'flag'    },
]

const TYPE_CLR: Record<string,string> = { checkin:'#22C55E', apply:G, job:'#3A7BD5', doc:'#8B5CF6', payment:'#22C55E', flag:'#EF4444' }

// ─── Normalize status: treat 'pending_review' as 'pending' throughout the admin ──
function normalizeStatus(status: string): string {
  if (status === 'pending_review') return 'pending'
  return status || 'pending'
}

// ─── Helper: is this registration in a "pending" state? ──────────────────────
function isPending(status: string): boolean {
  return status === 'pending' || status === 'pending_review'
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function loadRealRegistrations() {
  try {
    const stored: any[] = JSON.parse(localStorage.getItem('hg_users') || '[]')
    return stored.map((u: any, idx: number) => ({
      id: `LIVE-${idx + 1}`,
      name: u.fullName || u.contactName || u.companyName || u.email,
      email: u.email,
      role: u.role as string,
      date: u.createdAt ? String(u.createdAt).slice(0,10) : u.registeredAt ? String(u.registeredAt).slice(0,10) : new Date().toISOString().slice(0,10),
      // Normalize status so 'pending_review' shows as 'pending' in admin
      status: normalizeStatus(String(u.status || 'pending')),
      city: u.city || u.location || (u.address ? u.address.split(',').pop()?.trim() : '') || 'Not specified',
      phone: u.phone || u.contactPhone || 'Not provided',
      source: 'real',
      // Keep raw status so we can write it back correctly
      _rawStatus: u.status || 'pending',
      details: u.role === 'promoter'
        ? { gender: u.gender||'N/A', height: u.height||'N/A', idNumber: u.idNumber||'N/A', experience: u.experience||'N/A' }
        : {
            regNumber: u.regNumber||'N/A',
            industry: u.industry||'N/A',
            website: u.website||'N/A',
            contactPerson: u.contactName||u.fullName||'N/A',
            companyName: u.companyName||'N/A',
          },
    }))
  } catch { return [] }
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color, background:`${color}18`, padding:'3px 10px', borderRadius:2 }}>
      {label}
    </span>
  )
}

function GoldBtn({ children, onClick, outline=false, small=false, color=G }: any) {
  return (
    <button onClick={onClick} style={{ padding: small ? '6px 14px' : '10px 22px', background: outline ? 'transparent' : color, border: `1px solid ${color}`, color: outline ? color : B, fontFamily: FB, fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase' as const }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >{children}</button>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onApprove, onReject }: { item: any; onClose: () => void; onApprove: () => void; onReject: () => void }) {
  const isPromoter = item.role === 'promoter'
  const pending = isPending(item.status)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#141414', border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:520, position:'relative', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: isPromoter ? '#3A7BD5' : G }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WM, fontSize:18 }}>✕</button>
        <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:G, marginBottom:8 }}>{isPromoter ? 'Promoter Application' : 'Business Application'}</div>
        <div style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:8 }}>{item.name}</div>
        <div style={{ marginBottom:16, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <Badge label={item.status} color={item.status==='approved'?'#22C55E':item.status==='rejected'?'#EF4444':'#F59E0B'} />
          {item.source==='real' && <span style={{ fontSize:10, color:'#22C55E', fontWeight:700 }}>● Live Registration</span>}
        </div>
        {[{label:'Email',value:item.email},{label:'Phone',value:item.phone},{label:'City',value:item.city},{label:'Applied',value:item.date}].map((r:any) => (
          <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${BB}` }}>
            <span style={{ fontSize:12, color:WM }}>{r.label}</span>
            <span style={{ fontSize:12, color:W, fontWeight:600 }}>{r.value}</span>
          </div>
        ))}
        <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:G, marginTop:20, marginBottom:12 }}>{isPromoter ? 'Promoter Profile' : 'Business Profile'}</div>
        {Object.entries(item.details).map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${BB}` }}>
            <span style={{ fontSize:12, color:WM, textTransform:'capitalize' }}>{k.replace(/([A-Z])/g,' $1')}</span>
            <span style={{ fontSize:12, color:W, fontWeight:600 }}>{String(v)}</span>
          </div>
        ))}
        {pending && (
          <div style={{ display:'flex', gap:12, marginTop:28 }}>
            <GoldBtn onClick={onApprove} color="#22C55E">✓ Approve</GoldBtn>
            <GoldBtn onClick={onReject} color="#EF4444" outline>✗ Reject</GoldBtn>
          </div>
        )}
        {!pending && item.status === 'approved' && (
          <div style={{ marginTop:28, padding:'12px 16px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.3)', fontSize:12, color:'#22C55E' }}>
            ✓ This account has been approved and is visible on the platform.
          </div>
        )}
        {!pending && item.status === 'rejected' && (
          <div style={{ marginTop:28, padding:'12px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', fontSize:12, color:'#EF4444' }}>
            ✗ This account has been rejected.
          </div>
        )}
      </div>
    </div>
  )
}

function MessageModal({ msg, onClose }: { msg: any; onClose: () => void }) {
  const [reply, setReply] = useState('')
  const typeColor = msg.type === 'complaint' ? '#EF4444' : msg.type === 'review' ? '#22C55E' : G
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#141414', border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:540, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:typeColor }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WM, fontSize:18 }}>✕</button>
        <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:typeColor, marginBottom:8 }}>{msg.type} · from {msg.fromRole}</div>
        <div style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, marginBottom:4 }}>{msg.subject}</div>
        <div style={{ fontSize:12, color:WM, marginBottom:24 }}>From: {msg.from} · {msg.date}</div>
        {msg.regardingName && <div style={{ padding:'8px 14px', background:'rgba(196,151,58,0.08)', border:`1px solid rgba(196,151,58,0.2)`, marginBottom:20, fontSize:12, color:G }}>Regarding: <strong>{msg.regardingName}</strong></div>}
        <div style={{ fontSize:14, color:W, lineHeight:1.8, marginBottom:28, padding:16, background:'rgba(255,255,255,0.03)', border:`1px solid ${BB}` }}>{msg.body}</div>
        <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Type your response..."
          style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FB, fontSize:13, resize:'none', outline:'none', marginBottom:14 }}
          onFocus={e => e.currentTarget.style.borderColor = G} onBlur={e => e.currentTarget.style.borderColor = BB}
        />
        <div style={{ display:'flex', gap:10 }}>
          <GoldBtn onClick={onClose}>Send Reply</GoldBtn>
          <GoldBtn onClick={onClose} outline color={WM}>Close</GoldBtn>
        </div>
      </div>
    </div>
  )
}

// ─── Tab components ───────────────────────────────────────────────────────────

function DashboardTab({ regs, msgs, time, onRoute }: { regs: any[]; msgs: any[]; time: Date; onRoute: (id: string) => void }) {
  const getGreeting = () => { const h = time.getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; if (h < 21) return 'Good evening'; return 'Good night' }
  const unread = msgs.filter(m => !m.read).length
  const stats = [
    { label:'Active Promoters',  value: regs.filter(r => r.role==='promoter' && r.status==='approved').length, color:'#3A7BD5', sub:'registered' },
    { label:'Pending Approvals', value: regs.filter(r => isPending(r.status)).length,                          color:'#F59E0B', sub:'need review' },
    { label:'Unread Messages',   value: unread,                                                                 color:'#EF4444', sub:'complaints & reviews' },
    { label:'Businesses',        value: regs.filter(r => r.role==='business' && r.status==='approved').length, color:G,         sub:'active clients' },
  ]
  const quickActions = [
    { label:'Registrations', icon:'▣', id:'registrations', color:'#F59E0B' },
    { label:'Messages',      icon:'◆', id:'messages',      color:'#EF4444' },
    { label:'Live Map',      icon:'⊙', id:'map',           color:'#22C55E' },
    { label:'Payments',      icon:'✦', id:'payments',      color:'#3A7BD5' },
    { label:'Jobs',          icon:'◎', id:'jobs',          color:G         },
    { label:'Reports',       icon:'▤', id:'reports',       color:'#8B5CF6' },
  ]
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:36 }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>Admin Dashboard</div>
          <h1 style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W }}>{getGreeting()}, Admin.</h1>
          <p style={{ fontSize:13, color:WM, marginTop:6 }}>Here's what's happening across the platform today.</p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:FD, fontSize:22, color:W }}>{time.toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</div>
          <div style={{ fontSize:11, color:WM, marginTop:4 }}>{time.toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long'})}</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
        {stats.map((s,i) => (
          <div key={i} style={{ background:BC, border:`1px solid ${BB}`, padding:24, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.color }} />
            <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:WM, marginBottom:10 }}>{s.label}</div>
            <div style={{ fontFamily:FD, fontSize:40, fontWeight:700, color:W, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:s.color, marginTop:8 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ background:BC, border:`1px solid ${BB}`, padding:24 }}>
          <div style={{ fontSize:10, letterSpacing:'0.3em', textTransform:'uppercase', color:G, marginBottom:18 }}>Quick Actions</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {quickActions.map(a => (
              <button key={a.id} onClick={() => onRoute(a.id)}
                style={{ padding:16, background:'rgba(255,255,255,0.03)', border:`1px solid ${BB}`, cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'all 0.2s', fontFamily:FB }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = a.color; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BB;     (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
              >
                <span style={{ fontSize:18, color:a.color }}>{a.icon}</span>
                <span style={{ fontSize:12, color:W, fontWeight:600 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ background:BC, border:`1px solid ${BB}`, padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:10, letterSpacing:'0.3em', textTransform:'uppercase', color:G }}>Live Activity</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E' }} />
              <span style={{ fontSize:10, color:WM }}>Live</span>
            </div>
          </div>
          {ACTIVITY.map((a,i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${BB}` : 'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:TYPE_CLR[a.type], marginTop:4, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:12, color:W, lineHeight:1.4 }}>{a.msg}</div>
                <div style={{ fontSize:10, color:WD, marginTop:2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RegistrationsTab({ regs, onDetail, onApprove, onReject }: { regs: any[]; onDetail: (r: any) => void; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const [statusF, setStatusF] = useState('all')
  const [roleF,   setRoleF]   = useState('all')
  const [dateF,   setDateF]   = useState('all')
  const liveCount = regs.filter(r => r.source === 'real').length
  const pendingCount = regs.filter(r => isPending(r.status)).length
  const dates = ['all', ...Array.from(new Set(regs.map(r => r.date).filter(Boolean)))]
  const filtered = regs.filter(r =>
    (statusF === 'all' || r.status === statusF) &&
    (roleF   === 'all' || r.role   === roleF)   &&
    (dateF   === 'all' || r.date   === dateF)
  )
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>People · Registrations</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Registrations</h1>
          <p style={{ fontSize:13, color:WM, marginTop:4 }}>Review and approve promoter and business applications.</p>
        </div>
        <div style={{ textAlign:'right', fontSize:12, color:WM }}>
          <div><span style={{ color:'#F59E0B', fontWeight:700 }}>{pendingCount}</span> pending approval</div>
          {liveCount > 0 && <div style={{ marginTop:4 }}><span style={{ color:'#22C55E', fontWeight:700 }}>● {liveCount}</span> live</div>}
        </div>
      </div>

      {/* Banner for live pending registrations */}
      {regs.filter(r => r.source === 'real' && isPending(r.status)).length > 0 && (
        <div style={{ padding:'12px 18px', background:'rgba(245,158,11,0.08)', border:`1px solid rgba(245,158,11,0.35)`, marginBottom:16, fontSize:12, color:'#F59E0B', borderRadius:4, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>⚠</span>
          <span><strong>{regs.filter(r => r.source === 'real' && isPending(r.status)).length}</strong> live registration{regs.filter(r => r.source === 'real' && isPending(r.status)).length > 1 ? 's' : ''} awaiting your approval</span>
        </div>
      )}

      {liveCount > 0 && regs.filter(r => r.source === 'real' && isPending(r.status)).length === 0 && (
        <div style={{ padding:'10px 16px', background:'rgba(34,197,94,0.08)', border:`1px solid rgba(34,197,94,0.3)`, marginBottom:16, fontSize:12, color:'#22C55E', borderRadius:4 }}>
          ✓ <strong>{liveCount}</strong> live registration{liveCount > 1 ? 's' : ''} shown.
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:5 }}>
          {['all','pending','approved','rejected'].map(f => (
            <button key={f} onClick={() => setStatusF(f)} style={{ padding:'6px 12px', border:'none', borderRadius:4, cursor:'pointer', fontFamily:FB, fontSize:11, fontWeight:600, textTransform:'capitalize', background: statusF===f ? G : 'rgba(255,255,255,0.06)', color: statusF===f ? B : WM }}>{f}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {['all','promoter','business'].map(f => (
            <button key={f} onClick={() => setRoleF(f)} style={{ padding:'6px 12px', border:'none', borderRadius:4, cursor:'pointer', fontFamily:FB, fontSize:11, fontWeight:600, textTransform:'capitalize', background: roleF===f ? '#3A7BD5' : 'rgba(255,255,255,0.06)', color: roleF===f ? W : WM }}>{f}</button>
          ))}
        </div>
        <select value={dateF} onChange={e => setDateF(e.target.value)} style={{ background:BC, border:`1px solid ${BB}`, padding:'6px 12px', color:W, fontFamily:FB, fontSize:11, outline:'none', cursor:'pointer' }}>
          {dates.map(d => <option key={d} value={d}>{d === 'all' ? 'All Dates' : d}</option>)}
        </select>
      </div>
      <div style={{ background:BC, border:`1px solid ${BB}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ borderBottom:`1px solid ${BB}` }}>
            {['Name','Role','City','Date','Status','Source','Actions'].map(h => (
              <th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:WD, fontFamily:FB }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((r,i) => (
              <tr key={r.id}
                style={{ borderBottom: i < filtered.length-1 ? `1px solid ${BB}` : 'none', background: r.source === 'real' && isPending(r.status) ? 'rgba(245,158,11,0.04)' : 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = r.source === 'real' && isPending(r.status) ? 'rgba(245,158,11,0.04)' : 'transparent')}
              >
                <td style={{ padding:'14px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {r.source === 'real' && isPending(r.status) && <div style={{ width:6, height:6, borderRadius:'50%', background:'#F59E0B', flexShrink:0 }} />}
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:W }}>{r.name}</div>
                      <div style={{ fontSize:11, color:WM }}>{r.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:'14px 18px' }}><Badge label={r.role} color={r.role==='promoter' ? '#3A7BD5' : G} /></td>
                <td style={{ padding:'14px 18px', fontSize:12, color:WM }}>{r.city}</td>
                <td style={{ padding:'14px 18px', fontSize:12, color:WM }}>{r.date}</td>
                <td style={{ padding:'14px 18px' }}><Badge label={r.status} color={r.status==='approved'?'#22C55E':r.status==='rejected'?'#EF4444':'#F59E0B'} /></td>
                <td style={{ padding:'14px 18px' }}><span style={{ fontSize:10, fontWeight:700, color: r.source==='real' ? '#22C55E' : WD }}>{r.source==='real' ? '● Live' : '○ Demo'}</span></td>
                <td style={{ padding:'14px 18px' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <button onClick={() => onDetail(r)} style={{ fontSize:11, color:G, background:'none', border:'none', cursor:'pointer', fontFamily:FB }}>View</button>
                    {isPending(r.status) && <>
                      <span style={{ color:WD }}>·</span>
                      <button onClick={() => onApprove(r.id)} style={{ fontSize:11, color:'#22C55E', background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontWeight:700 }}>✓ Approve</button>
                      <span style={{ color:WD }}>·</span>
                      <button onClick={() => onReject(r.id)} style={{ fontSize:11, color:'#EF4444', background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontWeight:700 }}>✗ Reject</button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding:40, textAlign:'center', color:WD, fontSize:13 }}>No registrations match your filters.</div>}
      </div>
    </div>
  )
}

function LoginsTab() {
  const [roleF,    setRoleF]    = useState('all')
  const [dateF,    setDateF]    = useState('all')
  const dates = ['all', ...Array.from(new Set(MOCK_LOGINS.map(l => l.time.slice(0,10))))]
  const filtered = MOCK_LOGINS.filter(l =>
    (roleF === 'all' || l.role === roleF) &&
    (dateF === 'all' || l.time.startsWith(dateF))
  )
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>Comms · Activity</div>
        <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Login Activity</h1>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Logins Today', value: MOCK_LOGINS.filter(l => l.time.startsWith('2026-03-11')).length, color:G          },
          { label:'Promoters',    value: MOCK_LOGINS.filter(l => l.role==='promoter').length,             color:'#3A7BD5'  },
          { label:'Businesses',   value: MOCK_LOGINS.filter(l => l.role==='business').length,             color:'#22C55E'  },
        ].map((s,i) => (
          <div key={i} style={{ background:BC, border:`1px solid ${BB}`, padding:'20px 24px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:s.color }} />
            <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:WM, marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:FD, fontSize:32, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['all','promoter','business'].map(f => (
          <button key={f} onClick={() => setRoleF(f)} style={{ padding:'6px 12px', border:'none', borderRadius:4, cursor:'pointer', fontFamily:FB, fontSize:11, fontWeight:600, textTransform:'capitalize', background: roleF===f ? '#3A7BD5' : 'rgba(255,255,255,0.06)', color: roleF===f ? W : WM }}>{f}</button>
        ))}
        <select value={dateF} onChange={e => setDateF(e.target.value)} style={{ background:BC, border:`1px solid ${BB}`, padding:'6px 12px', color:W, fontFamily:FB, fontSize:11, outline:'none', cursor:'pointer', marginLeft:4 }}>
          {dates.map(d => <option key={d} value={d}>{d === 'all' ? 'All Dates' : d}</option>)}
        </select>
      </div>
      <div style={{ background:BC, border:`1px solid ${BB}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ borderBottom:`1px solid ${BB}` }}>
            {['User','Role','Time','IP'].map(h => <th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:WD, fontFamily:FB }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((l,i) => (
              <tr key={l.id} style={{ borderBottom: i < filtered.length-1 ? `1px solid ${BB}` : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding:'14px 18px' }}><div style={{ fontSize:13, fontWeight:600, color:W }}>{l.name}</div><div style={{ fontSize:11, color:WM }}>{l.email}</div></td>
                <td style={{ padding:'14px 18px' }}><Badge label={l.role} color={l.role==='promoter' ? '#3A7BD5' : G} /></td>
                <td style={{ padding:'14px 18px', fontSize:12, color:WM }}>{new Date(l.time).toLocaleString('en-ZA',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                <td style={{ padding:'14px 18px', fontSize:12, color:WD, fontFamily:'monospace' }}>{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MessagesTab({ msgs, setMsgs }: { msgs: any[]; setMsgs: (fn: (p: any[]) => any[]) => void }) {
  const [filter,   setFilter]  = useState('all')
  const [compose,  setCompose] = useState(false)
  const [viewing,  setViewing] = useState<any>(null)
  const [to,       setTo]      = useState('')
  const [subject,  setSubject] = useState('')
  const [body,     setBody]    = useState('')
  const filtered = msgs.filter(m => filter === 'all' || m.type === filter)
  const typeColor = (t: string) => t === 'complaint' ? '#EF4444' : t === 'review' ? '#22C55E' : '#3A7BD5'
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>Comms · Messages</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Messages & Complaints</h1>
        </div>
        <GoldBtn onClick={() => setCompose(true)}>+ Compose</GoldBtn>
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {['all','complaint','review','message'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 14px', border:'none', borderRadius:4, cursor:'pointer', fontFamily:FB, fontSize:11, fontWeight:600, textTransform:'capitalize', background: filter===f ? (f==='all'?G:typeColor(f)) : 'rgba(255,255,255,0.06)', color: filter===f ? (f==='all'?B:W) : WM }}>
            {f === 'all' ? `All (${msgs.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${msgs.filter(m=>m.type===f).length})`}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
        {filtered.map(m => (
          <div key={m.id} onClick={() => { setViewing(m); setMsgs(p => p.map(x => x.id===m.id ? {...x,read:true} : x)) }}
            style={{ background: m.read ? BC : '#1a1810', border:`1px solid ${m.read ? BB : 'rgba(196,151,58,0.2)'}`, padding:'18px 22px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = m.read ? BC : '#1a1810')}
          >
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:typeColor(m.type), marginTop:5, flexShrink:0 }} />
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:W }}>{m.subject}</span>
                  {!m.read && <span style={{ fontSize:8, fontWeight:700, background:G, color:B, padding:'2px 6px', borderRadius:2 }}>NEW</span>}
                </div>
                <div style={{ fontSize:12, color:WM }}>From: <strong style={{ color:W }}>{m.from}</strong> · {m.date}</div>
              </div>
            </div>
            <Badge label={m.type} color={typeColor(m.type)} />
          </div>
        ))}
      </div>

      {viewing && <MessageModal msg={viewing} onClose={() => setViewing(null)} />}

      {compose && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
          onClick={e => e.target === e.currentTarget && setCompose(false)}>
          <div style={{ background:'#141414', border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:500, position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:G }} />
            <button onClick={() => setCompose(false)} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WM, fontSize:18 }}>✕</button>
            <div style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, marginBottom:24 }}>New Message</div>
            {[{label:'To',val:to,set:setTo,ph:'Recipient'},{label:'Subject',val:subject,set:setSubject,ph:'Subject'}].map(f => (
              <div key={f.label} style={{ marginBottom:16 }}>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:WM, display:'block', marginBottom:7 }}>{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FB, fontSize:13, outline:'none' }}
                  onFocus={e => e.currentTarget.style.borderColor = G} onBlur={e => e.currentTarget.style.borderColor = BB}
                />
              </div>
            ))}
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Message..."
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FB, fontSize:13, resize:'none', outline:'none', marginBottom:16 }}
              onFocus={e => e.currentTarget.style.borderColor = G} onBlur={e => e.currentTarget.style.borderColor = BB}
            />
            <div style={{ display:'flex', gap:10 }}>
              <GoldBtn onClick={() => {
                setMsgs(p => [{ id:`M${p.length+1}`, from:'Admin', fromRole:'admin', to, subject, body, date:new Date().toISOString().slice(0,10), read:true, type:'message', regardingName:'' }, ...p])
                setCompose(false); setTo(''); setSubject(''); setBody('')
              }}>Send</GoldBtn>
              <GoldBtn onClick={() => setCompose(false)} outline color={WM}>Cancel</GoldBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReportsTab({ regs }: { regs: any[] }) {
  const [exportMsg, setExportMsg] = useState('')
  const doExport = (t: string) => { setExportMsg(`${t} export initiated.`); setTimeout(() => setExportMsg(''), 3000) }
  const cards = [
    { icon:'✦', color:'#3A7BD5', title:'Payroll Export',   desc:'Export approved shift hours and pay for bulk EFT via Paystack.',   btns:[['CSV','Payroll CSV'],['Excel','Payroll Excel']] },
    { icon:'▤', color:'#8B5CF6', title:'Campaign Reports', desc:'Automated PDF reports on campaign attendance for client delivery.', btns:[['PDF','Campaign PDF'],['CSV','Campaign CSV']] },
    { icon:'⬡', color:'#22C55E', title:'Promoter Roster',  desc:'Export of all active promoters with contact details and scores.',   btns:[['CSV','Roster CSV'],['Excel','Roster Excel']] },
    { icon:'◉', color:'#F59E0B', title:'Attendance Log',   desc:'Geo-verified check-in/out records with timestamps for all shifts.', btns:[['CSV','Attendance CSV'],['PDF','Attendance PDF']] },
  ]
  const summary = [
    { label:'Registered Promoters', value: regs.filter(r=>r.role==='promoter').length },
    { label:'Active Promoters',     value: regs.filter(r=>r.role==='promoter'&&r.status==='approved').length },
    { label:'Total Businesses',     value: regs.filter(r=>r.role==='business').length },
    { label:'Pending',              value: regs.filter(r=>isPending(r.status)).length },
    { label:'Shifts This Month',    value: 42 },
    { label:'Payroll Processed',    value: 'R 84,200' },
  ]
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>System · Reporting</div>
        <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Reports & Exports</h1>
      </div>
      {exportMsg && <div style={{ padding:'12px 18px', background:'rgba(196,151,58,0.1)', border:`1px solid ${G}`, marginBottom:20, fontSize:13, color:G, fontWeight:600 }}>✓ {exportMsg}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        {cards.map((c,i) => (
          <div key={i} style={{ background:BC, border:`1px solid ${BB}`, padding:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontSize:20, color:c.color }}>{c.icon}</span>
              <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, fontWeight:700 }}>{c.title}</div>
            </div>
            <p style={{ fontSize:13, color:WM, marginBottom:18, lineHeight:1.6 }}>{c.desc}</p>
            <div style={{ display:'flex', gap:8 }}>
              <GoldBtn onClick={() => doExport(c.btns[0][1])} small>{c.btns[0][0]}</GoldBtn>
              <GoldBtn onClick={() => doExport(c.btns[1][1])} small outline>{c.btns[1][0]}</GoldBtn>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:BC, border:`1px solid ${BB}` }}>
        <div style={{ padding:'16px 22px', borderBottom:`1px solid ${BB}`, fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, fontWeight:700 }}>Platform Summary</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <tbody>
            {summary.map((row,i) => (
              <tr key={i} style={{ borderBottom: i < summary.length-1 ? `1px solid ${BB}` : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding:'14px 22px', fontSize:13, color:WM }}>{row.label}</td>
                <td style={{ padding:'14px 22px', fontSize:14, fontWeight:700, color:G, textAlign:'right', fontFamily:FD }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

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
  const inputStyle = { width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${BB}`, padding:'10px 14px', color:W, fontFamily:FB, fontSize:13, outline:'none' }
  const labelStyle = { fontSize:10, fontWeight:600 as const, letterSpacing:'0.15em', textTransform:'uppercase' as const, color:WM, display:'block' as const, marginBottom:7 }
  const Toggle = ({ val, set }: { val: boolean; set: (v: boolean) => void }) => (
    <div onClick={() => set(!val)} style={{ width:44, height:24, borderRadius:12, background: val ? G : 'rgba(255,255,255,0.12)', cursor:'pointer', position:'relative', transition:'background 0.25s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left: val ? 22 : 3, width:18, height:18, borderRadius:'50%', background:'#FFF', transition:'left 0.25s' }} />
    </div>
  )
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>System · Config</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Platform Settings</h1>
        </div>
        <GoldBtn onClick={save}>{saved ? '✓ Saved' : 'Save Changes'}</GoldBtn>
      </div>
      {saved && <div style={{ padding:'12px 18px', background:'rgba(34,197,94,0.1)', border:`1px solid #22C55E`, marginBottom:20, fontSize:13, color:'#22C55E', fontWeight:600 }}>✓ Settings saved.</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ background:BC, border:`1px solid ${BB}`, padding:28 }}>
          <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:20, fontWeight:700 }}>General</div>
          <div style={{ marginBottom:18 }}><label style={labelStyle}>Platform Name</label><input value={platName} onChange={e => setPlatName(e.target.value)} style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=G} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
          <div><label style={labelStyle}>Support Email</label><input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=G} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
        </div>
        <div style={{ background:BC, border:`1px solid ${BB}`, padding:28 }}>
          <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:20, fontWeight:700 }}>Geo & Radius</div>
          <div style={{ marginBottom:18 }}><label style={labelStyle}>Check-in Radius (m)</label><input value={geoR} onChange={e => setGeoR(e.target.value)} style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=G} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
          <div><label style={labelStyle}>Job Notification Radius (km)</label><input value={jobR} onChange={e => setJobR(e.target.value)} style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=G} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
        </div>
        <div style={{ background:BC, border:`1px solid ${BB}`, padding:28 }}>
          <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:20, fontWeight:700 }}>Integrations</div>
          <div style={{ marginBottom:18 }}>
            <label style={labelStyle}>OTP Provider</label>
            <select value={otp} onChange={e => setOtp(e.target.value)} style={{ ...inputStyle, background:'#0e0e0e', cursor:'pointer' }}>
              {["Africa's Talking",'Clickatell','Twilio'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Payment Gateway</label>
            <select value={payment} onChange={e => setPayment(e.target.value)} style={{ ...inputStyle, background:'#0e0e0e', cursor:'pointer' }}>
              {['Paystack','PayFast','Ozow'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ background:BC, border:`1px solid ${BB}`, padding:28 }}>
          <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:20, fontWeight:700 }}>Feature Flags</div>
          {[
            { label:'Push Notifications', desc:'Send job alerts to promoters',   val:notifs, set:setNotifs },
            { label:'POPIA Compliance',   desc:'Enforce data protection',         val:popia,  set:setPopia  },
            { label:'Maintenance Mode',   desc:'Block non-admin access',          val:maint,  set:setMaint  },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:`1px solid ${BB}` }}>
              <div><div style={{ fontSize:13, fontWeight:600, color:W }}>{row.label}</div><div style={{ fontSize:11, color:WD, marginTop:2 }}>{row.desc}</div></div>
              <Toggle val={row.val} set={row.set} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
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