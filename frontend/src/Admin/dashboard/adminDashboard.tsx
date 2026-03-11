import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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

const MOCK_MESSAGES = [
  { id:'M001', from:'RedBull SA',     fromRole:'business', to:'Admin',         subject:'Complaint: Promoter no-show',     body:'Ayanda Dlamini did not show up for the Sandton shift on March 8th. This is the second time. We need this addressed urgently.', date:'2026-03-11', read:false, type:'complaint', regardingName:'Ayanda Dlamini' },
  { id:'M002', from:'Ayanda Dlamini', fromRole:'promoter', to:'Admin',         subject:'Review: RedBull event was great', body:'The event at Sandton City was well organised. The client was professional and briefing materials were thorough.', date:'2026-03-10', read:true,  type:'review',    regardingName:'RedBull SA' },
  { id:'M003', from:'FreshBrands',    fromRole:'business', to:'Admin',         subject:'Review: Excellent promoter team', body:'The promoters provided for our launch event were outstanding. Punctual, professional, and well-presented.', date:'2026-03-09', read:false, type:'review',    regardingName:'Lerato Mokoena' },
  { id:'M004', from:'Thabo Nkosi',    fromRole:'promoter', to:'Admin',         subject:'Complaint: Client was rude',      body:'During the Castle Lager event the client representative was dismissive and unprofessional. There was no briefing and we were not given lunch as agreed.', date:'2026-03-09', read:true, type:'complaint', regardingName:'SABMiller' },
  { id:'M005', from:'Acme Corp',      fromRole:'business', to:'Sipho Mhlongo', subject:'Job opportunity',                 body:'We have an upcoming activation in Pretoria on March 20th. Would you be available for a 2-day event at Menlyn Mall?', date:'2026-03-08', read:true, type:'message', regardingName:'' },
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

const NAV_GROUPS = [
  { label:'Overview', items:[ { label:'Dashboard', icon:'◈', id:'dashboard' } ]},
  { label:'People', items:[
    { label:'Users',         icon:'⬡', id:'users'         },
    { label:'Registrations', icon:'▣', id:'registrations' },
    { label:'Onboarding',    icon:'✧', id:'onboarding'    },
  ]},
  { label:'Operations', items:[
    { label:'Jobs',     icon:'◎', id:'jobs'     },
    { label:'Live Map', icon:'⊙', id:'map'      },
    { label:'Payments', icon:'✦', id:'payments' },
  ]},
  { label:'Comms', items:[
    { label:'Messages',       icon:'◆', id:'messages' },
    { label:'Login Activity', icon:'◉', id:'logins'   },
  ]},
  { label:'System', items:[
    { label:'Reports',  icon:'▤', id:'reports'  },
    { label:'Settings', icon:'⚙', id:'settings' },
  ]},
]

function loadRealRegistrations() {
  try {
    const stored: any[] = JSON.parse(localStorage.getItem('hg_users') || '[]')
    return stored.map((u: any, idx: number) => {
      const isPromoter = u.role === 'promoter'
      return {
        id:     `LIVE-${idx + 1}`,
        name:   u.fullName || u.contactName || u.email,
        email:  u.email,
        role:   u.role as string,
        date:   u.registeredAt ? String(u.registeredAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
        status: String(u.status || 'pending'),
        city:   u.city || u.location || 'Not specified',
        phone:  u.phone || u.contactPhone || 'Not provided',
        source: 'real',
        details: isPromoter
          ? { gender: u.gender || 'Not specified', height: u.height || 'Not specified', idNumber: u.idNumber || 'Not provided', experience: u.experience || 'Not specified' }
          : { regNumber: u.regNumber || 'Not provided', industry: u.industry || 'Not specified', website: u.website || 'Not provided', contactPerson: u.contactName || u.fullName || 'Not provided' },
      }
    })
  } catch { return [] }
}

/* Inject scrollbar CSS into <head> once — this is the only reliable way */
const SCROLLBAR_CSS = `
  .hg-nav-scroll::-webkit-scrollbar { width: 10px !important; }
  .hg-nav-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.05) !important; }
  .hg-nav-scroll::-webkit-scrollbar-thumb { background: #C4973A !important; border-radius: 6px !important; border: 2px solid #161616 !important; min-height: 48px !important; }
  .hg-nav-scroll::-webkit-scrollbar-thumb:hover { background: #DDB55A !important; }
  .hg-nav-scroll { scrollbar-width: auto !important; scrollbar-color: #C4973A rgba(255,255,255,0.05) !important; }
`

function injectScrollbarStyles() {
  if (document.getElementById('hg-scrollbar-styles')) return
  const el = document.createElement('style')
  el.id = 'hg-scrollbar-styles'
  el.textContent = SCROLLBAR_CSS
  document.head.appendChild(el)
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color, background:`${color}18`, padding:'3px 10px', borderRadius:2 }}>{label}</span>
}

function Btn({ children, onClick, color=G, outline=false, small=false }: any) {
  return (
    <button onClick={onClick}
      style={{ padding:small?'6px 14px':'10px 20px', background:outline?'transparent':color, border:`1px solid ${color}`, color:outline?color:B, fontFamily:FB, fontSize:small?10:11, fontWeight:700, letterSpacing:'0.1em', cursor:'pointer', transition:'all 0.2s', textTransform:'uppercase' }}
      onMouseEnter={e=>(e.currentTarget.style.opacity='0.8')}
      onMouseLeave={e=>(e.currentTarget.style.opacity='1')}
    >{children}</button>
  )
}

function DetailModal({ item, onClose, onApprove, onReject }: any) {
  const isPromoter = item.role === 'promoter'
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'#141414', border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:520, position:'relative', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:item.role==='promoter'?'#3A7BD5':G }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WM, fontSize:18 }}>✕</button>
        <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:G, marginBottom:8 }}>{isPromoter?'Promoter Application':'Business Application'}</div>
        <div style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:4 }}>{item.name}</div>
        <div style={{ marginBottom:16, display:'flex', gap:8, alignItems:'center' }}>
          <Badge label={item.status} color={item.status==='approved'?'#22C55E':item.status==='rejected'?'#EF4444':'#F59E0B'} />
          {item.source==='real'&&<span style={{ fontSize:10, color:'#22C55E', fontWeight:700 }}>● Live Registration</span>}
        </div>
        {[{label:'Email',value:item.email},{label:'Phone',value:item.phone},{label:'City',value:item.city},{label:'Applied',value:item.date}].map((r:any)=>(
          <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${BB}` }}>
            <span style={{ fontSize:12, color:WM }}>{r.label}</span>
            <span style={{ fontSize:12, color:W, fontWeight:600 }}>{r.value}</span>
          </div>
        ))}
        <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:G, marginTop:20, marginBottom:12 }}>{isPromoter?'Promoter Profile':'Business Profile'}</div>
        {Object.entries(item.details).map(([k,v])=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${BB}` }}>
            <span style={{ fontSize:12, color:WM, textTransform:'capitalize' }}>{k.replace(/([A-Z])/g,' $1')}</span>
            <span style={{ fontSize:12, color:W, fontWeight:600 }}>{String(v)}</span>
          </div>
        ))}
        {item.status==='pending'&&(
          <div style={{ display:'flex', gap:12, marginTop:28 }}>
            <Btn onClick={onApprove} color="#22C55E">✓ Approve</Btn>
            <Btn onClick={onReject} color="#EF4444" outline>✗ Reject</Btn>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageModal({ msg, onClose }: any) {
  const [reply,setReply]=useState('')
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'#141414', border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:540, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:msg.type==='complaint'?'#EF4444':msg.type==='review'?'#22C55E':G }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WM, fontSize:18 }}>✕</button>
        <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:msg.type==='complaint'?'#EF4444':msg.type==='review'?'#22C55E':G, marginBottom:8 }}>{msg.type} · from {msg.fromRole}</div>
        <div style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, marginBottom:4 }}>{msg.subject}</div>
        <div style={{ fontSize:12, color:WM, marginBottom:24 }}>From: {msg.from} · {msg.date}</div>
        {msg.regardingName&&<div style={{ padding:'8px 14px', background:'rgba(196,151,58,0.08)', border:`1px solid rgba(196,151,58,0.2)`, marginBottom:20, fontSize:12, color:G }}>Regarding: <strong>{msg.regardingName}</strong></div>}
        <div style={{ fontSize:14, color:W, lineHeight:1.8, marginBottom:28, padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${BB}` }}>{msg.body}</div>
        <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3} placeholder="Type your response..."
          style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FB, fontSize:13, resize:'none', outline:'none', marginBottom:14 }}
          onFocus={e=>e.currentTarget.style.borderColor=G} onBlur={e=>e.currentTarget.style.borderColor=BB}
        />
        <div style={{ display:'flex', gap:10 }}>
          <Btn onClick={onClose}>Send Reply</Btn>
          <Btn onClick={onClose} outline color={WM}>Close</Btn>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab,setTab]               = useState('dashboard')
  const [time,setTime]             = useState(new Date())
  const [regs,setRegs]             = useState<any[]>([])
  const [msgs,setMsgs]             = useState(MOCK_MESSAGES)
  const [detailItem,setDetail]     = useState<any>(null)
  const [msgItem,setMsgItem]       = useState<any>(null)
  const [regFilter,setRegFilter]   = useState('all')
  const [roleFilter,setRoleFilter] = useState('all')
  const [loginDate,setLoginDate]   = useState('all')
  const [regDate,setRegDate]       = useState('all')
  const [msgFilter,setMsgFilter]   = useState('all')
  const [compose,setCompose]       = useState(false)
  const [composeForm,setCompose2]  = useState({ to:'', subject:'', body:'' })
  const unread = msgs.filter(m=>!m.read).length

  /* Inject scrollbar CSS into document.head on first mount */
  useEffect(() => { injectScrollbarStyles() }, [])

  useEffect(() => {
    const real = loadRealRegistrations()
    const realEmails = new Set(real.map((r:any) => r.email))
    const filteredMock = MOCK_REGISTRATIONS.filter(m => !realEmails.has(m.email))
    setRegs([...real, ...filteredMock])
  }, [])

  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(t) },[])

  const getGreeting=()=>{ const h=time.getHours(); if(h>=5&&h<12)return'Good morning'; if(h>=12&&h<17)return'Good afternoon'; if(h>=17&&h<21)return'Good evening'; return'Good night' }

  const goRoute=(id: string)=>{
    const routes: Record<string,string>={users:'/admin/users',jobs:'/admin/jobs',map:'/admin/map',payments:'/admin/payments',onboarding:'/admin/onboarding'}
    if(routes[id]){navigate(routes[id]);return}
    setTab(id)
  }

  const updateStatus = (id: string, status: 'approved'|'rejected') => {
    setRegs(p => p.map(r => {
      if (r.id !== id) return r
      if (r.source === 'real') {
        try {
          const users: any[] = JSON.parse(localStorage.getItem('hg_users') || '[]')
          localStorage.setItem('hg_users', JSON.stringify(users.map((u:any) => u.email === r.email ? {...u, status} : u)))
        } catch {}
      }
      return {...r, status}
    }))
    setDetail(null)
  }

  const approve = (id: string) => updateStatus(id, 'approved')
  const reject  = (id: string) => updateStatus(id, 'rejected')
  const markRead = (id: string) => setMsgs(p => p.map(m => m.id===id ? {...m,read:true} : m))

  const filteredRegs   = regs.filter(r=>(regFilter==='all'||r.status===regFilter)&&(roleFilter==='all'||r.role===roleFilter)&&(regDate==='all'||r.date===regDate))
  const filteredLogins = MOCK_LOGINS.filter(l=>(roleFilter==='all'||l.role===roleFilter)&&(loginDate==='all'||l.time.startsWith(loginDate)))
  const filteredMsgs   = msgs.filter(m=>msgFilter==='all'||m.type===msgFilter)
  const uniqueDates    = (arr: any[], key: string) => ['all',...Array.from(new Set(arr.map((i:any)=>i[key]?.slice(0,10)).filter(Boolean)))]

  /* ─ SIDEBAR ─────────────────────────────────────────────────── */
  function Sidebar() {
    return (
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: BC,
        borderRight: `1px solid ${BB}`,
        display: 'flex',
        flexDirection: 'column',
        /* height is inherited from parent which is height:100vh overflow:hidden */
        alignSelf: 'stretch',
      }}>
        {/* Branding — pinned top */}
        <div style={{ padding:'28px 24px 20px', borderBottom:`1px solid ${BB}`, flexShrink:0 }}>
          <div style={{ fontFamily:FD, fontSize:17, fontWeight:700 }}>
            <span style={{ color:G }}>HONEY</span><span style={{ color:W }}> GROUP</span>
          </div>
          <div style={{ fontSize:9, letterSpacing:'0.3em', color:WD, marginTop:4, textTransform:'uppercase' }}>Admin Console</div>
        </div>

        {/* Scrollable nav — styled via .hg-nav-scroll in document.head */}
        <nav className="hg-nav-scroll" style={{
          flex: 1,
          overflowY: 'scroll',
          overflowX: 'hidden',
          padding: '8px 10px',
        }}>
          {NAV_GROUPS.map(group=>(
            <div key={group.label} style={{ marginBottom:6 }}>
              <div style={{ fontSize:8, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:WD, padding:'10px 12px 4px' }}>{group.label}</div>
              {group.items.map(n=>{
                const isActive = tab===n.id
                const badge = n.id==='messages'&&unread>0 ? unread : n.id==='registrations' ? regs.filter(r=>r.status==='pending').length : 0
                return (
                  <button key={n.id} onClick={()=>goRoute(n.id)} style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'8px 12px', marginBottom:1, borderRadius:5, cursor:'pointer',
                    background:isActive?'rgba(196,151,58,0.12)':'transparent',
                    border:isActive?`1px solid rgba(196,151,58,0.28)`:'1px solid transparent',
                    color:isActive?G:WM, fontFamily:FB, fontSize:12, fontWeight:isActive?600:400, transition:'all 0.18s',
                  }}
                    onMouseEnter={e=>{if(!isActive)(e.currentTarget as HTMLButtonElement).style.color=W}}
                    onMouseLeave={e=>{if(!isActive)(e.currentTarget as HTMLButtonElement).style.color=WM}}
                  >
                    <span style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <span style={{ fontSize:13 }}>{n.icon}</span>{n.label}
                    </span>
                    {badge>0&&<span style={{ fontSize:9, fontWeight:700, background:n.id==='messages'?'#EF4444':'#F59E0B', color:W, padding:'2px 6px', borderRadius:10, minWidth:18, textAlign:'center' }}>{badge}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer — pinned bottom */}
        <div style={{ padding:'14px 20px', borderTop:`1px solid ${BB}`, flexShrink:0 }}>
          <div style={{ fontSize:10, color:WD }}>Logged in as</div>
          <div style={{ fontSize:13, color:W, fontWeight:600, marginTop:2 }}>Administrator</div>
          <button onClick={()=>navigate('/')} style={{ marginTop:10, fontSize:11, color:WM, background:'none', border:'none', cursor:'pointer', fontFamily:FB, padding:0 }}
            onMouseEnter={e=>(e.currentTarget.style.color=W)} onMouseLeave={e=>(e.currentTarget.style.color=WM)}
          >← Back to site</button>
        </div>
      </aside>
    )
  }

  /* ─ DASHBOARD ───────────────────────────────────────────────── */
  function DashboardTab() {
    return (
      <div>
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
          {[
            {label:'Active Promoters', value:String(regs.filter(r=>r.role==='promoter'&&r.status==='approved').length), color:'#3A7BD5', sub:'registered'},
            {label:'Pending Approvals',value:String(regs.filter(r=>r.status==='pending').length),                       color:'#F59E0B', sub:'need review'},
            {label:'Unread Messages',  value:String(unread),                                                             color:'#EF4444', sub:'complaints & reviews'},
            {label:'Businesses',       value:String(regs.filter(r=>r.role==='business'&&r.status==='approved').length), color:G,         sub:'active clients'},
          ].map((s,i)=>(
            <div key={i} style={{ background:BC, border:`1px solid ${BB}`, padding:'24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.color }} />
              <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:WM, marginBottom:10 }}>{s.label}</div>
              <div style={{ fontFamily:FD, fontSize:40, fontWeight:700, color:W, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:s.color, marginTop:8 }}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:BC, border:`1px solid ${BB}`, padding:'24px' }}>
            <div style={{ fontSize:10, letterSpacing:'0.3em', textTransform:'uppercase', color:G, marginBottom:18 }}>Quick Actions</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                {label:'Registrations',icon:'▣',id:'registrations',color:'#F59E0B'},
                {label:'Messages',     icon:'◆',id:'messages',      color:'#EF4444'},
                {label:'Live Map',     icon:'⊙',id:'map',           color:'#22C55E'},
                {label:'Payments',     icon:'✦',id:'payments',      color:'#3A7BD5'},
                {label:'Jobs',         icon:'◎',id:'jobs',          color:G        },
                {label:'Reports',      icon:'▤',id:'reports',       color:'#8B5CF6'},
              ].map(a=>(
                <button key={a.id} onClick={()=>goRoute(a.id)}
                  style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${BB}`, cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'all 0.2s', fontFamily:FB }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=a.color;(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.06)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=BB;(e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,0.03)'}}
                >
                  <span style={{ fontSize:18, color:a.color }}>{a.icon}</span>
                  <span style={{ fontSize:12, color:W, fontWeight:600 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ background:BC, border:`1px solid ${BB}`, padding:'24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ fontSize:10, letterSpacing:'0.3em', textTransform:'uppercase', color:G }}>Live Activity</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E' }} />
                <span style={{ fontSize:10, color:WM }}>Live</span>
              </div>
            </div>
            {ACTIVITY.map((a,i)=>(
              <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:i<ACTIVITY.length-1?`1px solid ${BB}`:'none' }}>
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

  /* ─ REGISTRATIONS ───────────────────────────────────────────── */
  function RegistrationsTab() {
    const liveCount = regs.filter(r=>r.source==='real').length
    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
          <div>
            <button onClick={()=>setTab('dashboard')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontSize:11, color:WM, padding:0, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}
              onMouseEnter={e=>(e.currentTarget.style.color=G)} onMouseLeave={e=>(e.currentTarget.style.color=WM)}
            >← Back to Dashboard</button>
            <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>People · Registrations</div>
            <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Registrations</h1>
            <p style={{ fontSize:13, color:WM, marginTop:4 }}>Review and approve promoter and business applications.</p>
          </div>
          <div style={{ fontSize:12, color:WM, textAlign:'right' }}>
            <div><span style={{ color:'#F59E0B', fontWeight:700 }}>{regs.filter(r=>r.status==='pending').length}</span> pending</div>
            {liveCount>0&&<div style={{ marginTop:4 }}><span style={{ color:'#22C55E', fontWeight:700 }}>● {liveCount}</span> live from platform</div>}
          </div>
        </div>
        {liveCount > 0 && (
          <div style={{ padding:'10px 16px', background:'rgba(34,197,94,0.08)', border:`1px solid rgba(34,197,94,0.3)`, marginBottom:16, fontSize:12, color:'#22C55E', display:'flex', alignItems:'center', gap:8, borderRadius:4 }}>
            ✓ <strong>{liveCount}</strong> real registration{liveCount>1?'s':''} from the platform are shown at the top.
          </div>
        )}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:5 }}>
            {['all','pending','approved','rejected'].map(f=>(
              <button key={f} onClick={()=>setRegFilter(f)} style={{ padding:'6px 12px', border:'none', borderRadius:4, cursor:'pointer', fontFamily:FB, fontSize:11, fontWeight:600, textTransform:'capitalize', background:regFilter===f?G:'rgba(255,255,255,0.06)', color:regFilter===f?B:WM }}>{f}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:5 }}>
            {['all','promoter','business'].map(f=>(
              <button key={f} onClick={()=>setRoleFilter(f)} style={{ padding:'6px 12px', border:'none', borderRadius:4, cursor:'pointer', fontFamily:FB, fontSize:11, fontWeight:600, textTransform:'capitalize', background:roleFilter===f?'#3A7BD5':'rgba(255,255,255,0.06)', color:roleFilter===f?W:WM }}>{f}</button>
            ))}
          </div>
          <select value={regDate} onChange={e=>setRegDate(e.target.value)} style={{ background:BC, border:`1px solid ${BB}`, padding:'6px 12px', color:W, fontFamily:FB, fontSize:11, outline:'none', cursor:'pointer' }}>
            {uniqueDates(regs,'date').map(d=><option key={d} value={d}>{d==='all'?'All Dates':d}</option>)}
          </select>
        </div>
        <div style={{ background:BC, border:`1px solid ${BB}` }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${BB}` }}>
                {['Name','Role','City','Date','Status','Source','Actions'].map(h=>(
                  <th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:WD, fontFamily:FB }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRegs.map((r,i)=>(
                <tr key={r.id} style={{ borderBottom:i<filteredRegs.length-1?`1px solid ${BB}`:'none' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                >
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:W }}>{r.name}</div>
                    <div style={{ fontSize:11, color:WM }}>{r.email}</div>
                  </td>
                  <td style={{ padding:'14px 18px' }}><Badge label={r.role} color={r.role==='promoter'?'#3A7BD5':G} /></td>
                  <td style={{ padding:'14px 18px', fontSize:12, color:WM }}>{r.city}</td>
                  <td style={{ padding:'14px 18px', fontSize:12, color:WM }}>{r.date}</td>
                  <td style={{ padding:'14px 18px' }}><Badge label={r.status} color={r.status==='approved'?'#22C55E':r.status==='rejected'?'#EF4444':'#F59E0B'} /></td>
                  <td style={{ padding:'14px 18px' }}>
                    <span style={{ fontSize:10, fontWeight:700, color:r.source==='real'?'#22C55E':WD }}>
                      {r.source==='real'?'● Live':'○ Demo'}
                    </span>
                  </td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <button onClick={()=>setDetail(r)} style={{ fontSize:11, color:G, background:'none', border:'none', cursor:'pointer', fontFamily:FB }}>View</button>
                      {r.status==='pending'&&<>
                        <span style={{ color:WD }}>·</span>
                        <button onClick={()=>approve(r.id)} style={{ fontSize:11, color:'#22C55E', background:'none', border:'none', cursor:'pointer', fontFamily:FB }}>Approve</button>
                        <span style={{ color:WD }}>·</span>
                        <button onClick={()=>reject(r.id)} style={{ fontSize:11, color:'#EF4444', background:'none', border:'none', cursor:'pointer', fontFamily:FB }}>Reject</button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRegs.length===0&&<div style={{ padding:'40px', textAlign:'center', color:WD, fontSize:13 }}>No registrations match your filters.</div>}
        </div>
      </div>
    )
  }

  /* ─ LOGINS ──────────────────────────────────────────────────── */
  function LoginsTab() {
    return (
      <div>
        <div style={{ marginBottom:28 }}>
          <button onClick={()=>setTab('dashboard')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontSize:11, color:WM, padding:0, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}
            onMouseEnter={e=>(e.currentTarget.style.color=G)} onMouseLeave={e=>(e.currentTarget.style.color=WM)}
          >← Back to Dashboard</button>
          <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>Comms · Activity</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Login Activity</h1>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
          {[
            {label:'Logins Today', value:String(MOCK_LOGINS.filter(l=>l.time.startsWith('2026-03-11')).length), color:G},
            {label:'Promoters',    value:String(MOCK_LOGINS.filter(l=>l.role==='promoter').length), color:'#3A7BD5'},
            {label:'Businesses',   value:String(MOCK_LOGINS.filter(l=>l.role==='business').length), color:'#22C55E'},
          ].map((s,i)=>(
            <div key={i} style={{ background:BC, border:`1px solid ${BB}`, padding:'20px 24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:s.color }} />
              <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:WM, marginBottom:8 }}>{s.label}</div>
              <div style={{ fontFamily:FD, fontSize:32, fontWeight:700, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {['all','promoter','business'].map(f=>(
            <button key={f} onClick={()=>setRoleFilter(f)} style={{ padding:'6px 12px', border:'none', borderRadius:4, cursor:'pointer', fontFamily:FB, fontSize:11, fontWeight:600, textTransform:'capitalize', background:roleFilter===f?'#3A7BD5':'rgba(255,255,255,0.06)', color:roleFilter===f?W:WM }}>{f}</button>
          ))}
          <select value={loginDate} onChange={e=>setLoginDate(e.target.value)} style={{ background:BC, border:`1px solid ${BB}`, padding:'6px 12px', color:W, fontFamily:FB, fontSize:11, outline:'none', cursor:'pointer', marginLeft:4 }}>
            {uniqueDates(MOCK_LOGINS,'time').map(d=><option key={d} value={d}>{d==='all'?'All Dates':d}</option>)}
          </select>
        </div>
        <div style={{ background:BC, border:`1px solid ${BB}` }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ borderBottom:`1px solid ${BB}` }}>
              {['User','Role','Time','IP'].map(h=><th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:WD, fontFamily:FB }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredLogins.map((l,i)=>(
                <tr key={l.id} style={{ borderBottom:i<filteredLogins.length-1?`1px solid ${BB}`:'none' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                >
                  <td style={{ padding:'14px 18px' }}><div style={{ fontSize:13, fontWeight:600, color:W }}>{l.name}</div><div style={{ fontSize:11, color:WM }}>{l.email}</div></td>
                  <td style={{ padding:'14px 18px' }}><Badge label={l.role} color={l.role==='promoter'?'#3A7BD5':G} /></td>
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

  /* ─ MESSAGES ────────────────────────────────────────────────── */
  function MessagesTab() {
    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
          <div>
            <button onClick={()=>setTab('dashboard')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontSize:11, color:WM, padding:0, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}
              onMouseEnter={e=>(e.currentTarget.style.color=G)} onMouseLeave={e=>(e.currentTarget.style.color=WM)}
            >← Back to Dashboard</button>
            <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>Comms · Messages</div>
            <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Messages & Complaints</h1>
          </div>
          <Btn onClick={()=>setCompose(true)}>+ Compose</Btn>
        </div>
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {['all','complaint','review','message'].map(f=>{
            const colors: Record<string,string>={all:G,complaint:'#EF4444',review:'#22C55E',message:'#3A7BD5'}
            return <button key={f} onClick={()=>setMsgFilter(f)} style={{ padding:'6px 14px', border:'none', borderRadius:4, cursor:'pointer', fontFamily:FB, fontSize:11, fontWeight:600, textTransform:'capitalize', background:msgFilter===f?colors[f]:'rgba(255,255,255,0.06)', color:msgFilter===f?(f==='all'?B:W):WM }}>{f==='all'?`All (${msgs.length})`:`${f.charAt(0).toUpperCase()+f.slice(1)} (${msgs.filter(m=>m.type===f).length})`}</button>
          })}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
          {filteredMsgs.map(m=>(
            <div key={m.id} onClick={()=>{setMsgItem(m);markRead(m.id)}} style={{ background:m.read?BC:'#1a1810', border:`1px solid ${m.read?BB:'rgba(196,151,58,0.2)'}`, padding:'18px 22px', cursor:'pointer', transition:'background 0.2s', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 }}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.04)')}
              onMouseLeave={e=>(e.currentTarget.style.background=m.read?BC:'#1a1810')}
            >
              <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:m.type==='complaint'?'#EF4444':m.type==='review'?'#22C55E':'#3A7BD5', marginTop:5, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:W }}>{m.subject}</span>
                    {!m.read&&<span style={{ fontSize:8, fontWeight:700, background:G, color:B, padding:'2px 6px', borderRadius:2 }}>NEW</span>}
                  </div>
                  <div style={{ fontSize:12, color:WM }}>From: <strong style={{ color:W }}>{m.from}</strong> · {m.date}</div>
                </div>
              </div>
              <Badge label={m.type} color={m.type==='complaint'?'#EF4444':m.type==='review'?'#22C55E':'#3A7BD5'} />
            </div>
          ))}
        </div>
        {compose&&(
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
            onClick={e=>e.target===e.currentTarget&&setCompose(false)}>
            <div style={{ background:'#141414', border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:500, position:'relative' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:G }} />
              <button onClick={()=>setCompose(false)} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WM, fontSize:18 }}>✕</button>
              <div style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, marginBottom:24 }}>New Message</div>
              {[{label:'To',key:'to',placeholder:'Recipient'},{label:'Subject',key:'subject',placeholder:'Subject'}].map(({label,key,placeholder})=>(
                <div key={key} style={{ marginBottom:16 }}>
                  <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:WM, display:'block', marginBottom:7 }}>{label}</label>
                  <input value={(composeForm as any)[key]} onChange={e=>setCompose2(p=>({...p,[key]:e.target.value}))} placeholder={placeholder}
                    style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FB, fontSize:13, outline:'none' }}
                    onFocus={e=>e.currentTarget.style.borderColor=G} onBlur={e=>e.currentTarget.style.borderColor=BB}
                  />
                </div>
              ))}
              <textarea value={composeForm.body} onChange={e=>setCompose2(p=>({...p,body:e.target.value}))} rows={4} placeholder="Message..."
                style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FB, fontSize:13, resize:'none', outline:'none', marginBottom:16 }}
                onFocus={e=>e.currentTarget.style.borderColor=G} onBlur={e=>e.currentTarget.style.borderColor=BB}
              />
              <div style={{ display:'flex', gap:10 }}>
                <Btn onClick={()=>{setMsgs(p=>[{id:`M${p.length+1}`,from:'Admin',fromRole:'admin',to:composeForm.to,subject:composeForm.subject,body:composeForm.body,date:new Date().toISOString().slice(0,10),read:true,type:'message',regardingName:''},...p]);setCompose(false);setCompose2({to:'',subject:'',body:''})}}>Send</Btn>
                <Btn onClick={()=>setCompose(false)} outline color={WM}>Cancel</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ─ REPORTS ─────────────────────────────────────────────────── */
  function ReportsTab() {
    const [exportMsg,setExportMsg]=useState('')
    const handleExport=(type: string)=>{setExportMsg(`${type} export initiated.`);setTimeout(()=>setExportMsg(''),3000)}
    return (
      <div>
        <div style={{ marginBottom:28 }}>
          <button onClick={()=>setTab('dashboard')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontSize:11, color:WM, padding:0, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}
            onMouseEnter={e=>(e.currentTarget.style.color=G)} onMouseLeave={e=>(e.currentTarget.style.color=WM)}
          >← Back to Dashboard</button>
          <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>System · Reporting</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Reports & Exports</h1>
        </div>
        {exportMsg&&<div style={{ padding:'12px 18px', background:'rgba(196,151,58,0.1)', border:`1px solid ${G}`, marginBottom:20, fontSize:13, color:G, fontWeight:600 }}>✓ {exportMsg}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
          {[
            {icon:'✦',color:'#3A7BD5',title:'Payroll Export',   desc:'Export approved shift hours and pay for bulk EFT via Paystack.',   ex:[['CSV','Payroll CSV'],['Excel','Payroll Excel']]},
            {icon:'▤',color:'#8B5CF6',title:'Campaign Reports', desc:'Automated PDF reports on campaign attendance for client delivery.', ex:[['PDF','Campaign PDF'],['CSV','Campaign CSV']]},
            {icon:'⬡',color:'#22C55E',title:'Promoter Roster',  desc:'Export of all active promoters with contact details and scores.',   ex:[['CSV','Roster CSV'],['Excel','Roster Excel']]},
            {icon:'◉',color:'#F59E0B',title:'Attendance Log',   desc:'Geo-verified check-in/out records with timestamps for all shifts.', ex:[['CSV','Attendance CSV'],['PDF','Attendance PDF']]},
          ].map((card,i)=>(
            <div key={i} style={{ background:BC, border:`1px solid ${BB}`, padding:'28px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:20, color:card.color }}>{card.icon}</span>
                <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, fontWeight:700 }}>{card.title}</div>
              </div>
              <p style={{ fontSize:13, color:WM, marginBottom:18, lineHeight:1.6 }}>{card.desc}</p>
              <div style={{ display:'flex', gap:8 }}>
                <Btn onClick={()=>handleExport(card.ex[0][1])} small>{card.ex[0][0]}</Btn>
                <Btn onClick={()=>handleExport(card.ex[1][1])} small outline color={G}>{card.ex[1][0]}</Btn>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:BC, border:`1px solid ${BB}` }}>
          <div style={{ padding:'16px 22px', borderBottom:`1px solid ${BB}`, fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, fontWeight:700 }}>Platform Summary</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              {[
                {label:'Registered Promoters', value:String(regs.filter(r=>r.role==='promoter').length)},
                {label:'Active Promoters',      value:String(regs.filter(r=>r.role==='promoter'&&r.status==='approved').length)},
                {label:'Total Businesses',      value:String(regs.filter(r=>r.role==='business').length)},
                {label:'Pending',               value:String(regs.filter(r=>r.status==='pending').length)},
                {label:'Shifts This Month',     value:'42'},
                {label:'Payroll Processed',     value:'R 84,200'},
              ].map((row,i)=>(
                <tr key={i} style={{ borderBottom:i<5?`1px solid ${BB}`:'none' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
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

  /* ─ SETTINGS ────────────────────────────────────────────────── */
  function SettingsTab() {
    const [saved,setSaved]=useState(false)
    const [s,setS]=useState({ platformName:'Honey Group Promotions', supportEmail:'admin@honeygroup.co.za', otpProvider:"Africa's Talking", paymentGateway:'Paystack', geoRadius:'200', jobRadius:'20', notifications:true, popia:true, maintenance:false })
    const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),3000)}
    const toggle=(k: string)=>setS(p=>({...p,[k]:!(p as any)[k]}))
    const update=(k: string,v: string)=>setS(p=>({...p,[k]:v}))
    return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
          <div>
            <button onClick={()=>setTab('dashboard')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:FB, fontSize:11, color:WM, padding:0, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}
              onMouseEnter={e=>(e.currentTarget.style.color=G)} onMouseLeave={e=>(e.currentTarget.style.color=WM)}
            >← Back to Dashboard</button>
            <div style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:G, marginBottom:8 }}>System · Config</div>
            <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Platform Settings</h1>
          </div>
          <Btn onClick={save}>{saved?'✓ Saved':'Save Changes'}</Btn>
        </div>
        {saved&&<div style={{ padding:'12px 18px', background:'rgba(34,197,94,0.1)', border:`1px solid #22C55E`, marginBottom:20, fontSize:13, color:'#22C55E', fontWeight:600 }}>✓ Settings saved.</div>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {[
            {title:'General',fields:[{label:'Platform Name',k:'platformName'},{label:'Support Email',k:'supportEmail'}]},
            {title:'Geo & Radius',fields:[{label:'Check-in Radius (m)',k:'geoRadius'},{label:'Job Notification Radius (km)',k:'jobRadius'}]},
          ].map((section,si)=>(
            <div key={si} style={{ background:BC, border:`1px solid ${BB}`, padding:'28px' }}>
              <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:20, fontWeight:700 }}>{section.title}</div>
              {section.fields.map(({label,k})=>(
                <div key={k} style={{ marginBottom:18 }}>
                  <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:WM, display:'block', marginBottom:7 }}>{label}</label>
                  <input value={(s as any)[k]} onChange={e=>update(k,e.target.value)} style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${BB}`, padding:'10px 14px', color:W, fontFamily:FB, fontSize:13, outline:'none' }} onFocus={e=>e.currentTarget.style.borderColor=G} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>
              ))}
            </div>
          ))}
          <div style={{ background:BC, border:`1px solid ${BB}`, padding:'28px' }}>
            <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:20, fontWeight:700 }}>Integrations</div>
            {[{label:'OTP Provider',k:'otpProvider',opts:["Africa's Talking",'Clickatell','Twilio']},{label:'Payment Gateway',k:'paymentGateway',opts:['Paystack','PayFast','Ozow']}].map(({label,k,opts})=>(
              <div key={k} style={{ marginBottom:18 }}>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:WM, display:'block', marginBottom:7 }}>{label}</label>
                <select value={(s as any)[k]} onChange={e=>update(k,e.target.value)} style={{ width:'100%', background:'#0e0e0e', border:`1px solid ${BB}`, padding:'10px 14px', color:W, fontFamily:FB, fontSize:13, outline:'none', cursor:'pointer' }}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ background:BC, border:`1px solid ${BB}`, padding:'28px' }}>
            <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:20, fontWeight:700 }}>Feature Flags</div>
            {[{label:'Push Notifications',k:'notifications',desc:'Send job alerts to promoters'},{label:'POPIA Compliance',k:'popia',desc:'Enforce data protection'},{label:'Maintenance Mode',k:'maintenance',desc:'Block non-admin access'}].map(({label,k,desc})=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:`1px solid ${BB}` }}>
                <div><div style={{ fontSize:13, fontWeight:600, color:W }}>{label}</div><div style={{ fontSize:11, color:WD, marginTop:2 }}>{desc}</div></div>
                <div onClick={()=>toggle(k)} style={{ width:44, height:24, borderRadius:12, background:(s as any)[k]?G:'rgba(255,255,255,0.12)', cursor:'pointer', position:'relative', transition:'background 0.25s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:3, left:(s as any)[k]?22:3, width:18, height:18, borderRadius:'50%', background:'#FFF', transition:'left 0.25s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ─ RENDER ──────────────────────────────────────────────────── */
  const TABS: Record<string,()=>JSX.Element> = { dashboard:DashboardTab, registrations:RegistrationsTab, logins:LoginsTab, messages:MessagesTab, reports:ReportsTab, settings:SettingsTab }
  const REDIRECT_IDS = ['users','jobs','map','payments','onboarding']

  useEffect(()=>{
    if(REDIRECT_IDS.includes(tab)){
      const routes: Record<string,string>={users:'/admin/users',jobs:'/admin/jobs',map:'/admin/map',payments:'/admin/payments',onboarding:'/admin/onboarding'}
      navigate(routes[tab])
    }
  },[tab])

  const ActiveTab = TABS[tab] || DashboardTab

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; margin: 0; padding: 0; background: ${B}; overflow: hidden; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        select option { background: #161616; color: #F4EFE6; }
      `}</style>

      {/*
        THE ACTUAL FIX:
        - Root wrapper is height:100vh, display:flex, overflow:hidden
        - Sidebar is a normal flex child (NOT position:fixed) — height is naturally 100vh from parent
        - The <nav> inside the sidebar has flex:1 + overflowY:scroll — it's a real scrollable box
        - CSS injected via document.head (injectScrollbarStyles) targets .hg-nav-scroll
        - Because the nav is a regular in-flow element (not fixed), ::-webkit-scrollbar works 100%
      */}
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:B, fontFamily:FB, color:W }}>

        <Sidebar />

        <main style={{ flex:1, overflowY:'auto', background:B, padding:'40px 48px' }} key={tab}>
          <div style={{ animation:'fadeIn 0.25s ease' }}>
            <ActiveTab />
          </div>
        </main>
      </div>

      {detailItem && <DetailModal item={detailItem} onClose={()=>setDetail(null)} onApprove={()=>approve(detailItem.id)} onReject={()=>reject(detailItem.id)} />}
      {msgItem    && <MessageModal msg={msgItem} onClose={()=>setMsgItem(null)} />}
    </>
  )
}