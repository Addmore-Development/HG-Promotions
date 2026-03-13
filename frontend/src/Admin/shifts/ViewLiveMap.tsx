import { useState, useEffect } from 'react'
import { AdminLayout } from '../AdminLayout'

// ─── Warm palette ─────────────────────────────────────────────────────────────
const G   = '#D4880A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const G3  = '#C07818'
const G4  = '#F0C050'
const G5  = '#6B3F10'

const B  = '#0C0A07'
const D1 = '#0E0C06'
const D2 = '#151209'
const D3 = '#1C1709'

const BB  = 'rgba(212,136,10,0.16)'
const BB2 = 'rgba(212,136,10,0.06)'

const W   = '#FAF3E8'
const W85 = 'rgba(250,243,232,0.85)'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'

const FD = "'Playfair Display', Georgia, serif"

function hex2rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

type CheckStatus = 'checked-in' | 'late' | 'absent' | 'completed'

interface Promoter {
  id: string; name: string; job: string; venue: string
  city: string; status: CheckStatus; time: string; lat: number; lng: number
}

const MOCK: Promoter[] = [
  { id:'P01', name:'Ayanda Dlamini',  job:'Red Bull — Sandton',    venue:'Sandton City',    city:'Johannesburg', status:'checked-in', time:'09:02', lat:52,  lng:140 },
  { id:'P02', name:'Thabo Nkosi',     job:'Red Bull — Sandton',    venue:'Sandton City',    city:'Johannesburg', status:'checked-in', time:'09:05', lat:65,  lng:155 },
  { id:'P03', name:'Nomsa Zulu',      job:'Castle Lite — V&A',     venue:'V&A Waterfront',  city:'Cape Town',    status:'late',       time:'—',     lat:210, lng:90  },
  { id:'P04', name:'Sipho Mhlongo',   job:'Nike — Mall of Africa', venue:'Mall of Africa',  city:'Johannesburg', status:'checked-in', time:'10:01', lat:90,  lng:200 },
  { id:'P05', name:'Lerato Mokoena',  job:'Vodacom — Greenacres',  venue:'Greenacres Mall', city:'Gqeberha',     status:'absent',     time:'—',     lat:160, lng:310 },
  { id:'P06', name:'Bongani Khumalo', job:'Savanna — Gateway',     venue:'Gateway',         city:'Durban',       status:'completed',  time:'16:00', lat:300, lng:240 },
  { id:'P07', name:'Zanele Motha',    job:'Nike — Mall of Africa', venue:'Mall of Africa',  city:'Johannesburg', status:'checked-in', time:'10:03', lat:105, lng:185 },
  { id:'P08', name:'Musa Dube',       job:'Savanna — Gateway',     venue:'Gateway',         city:'Durban',       status:'late',       time:'—',     lat:285, lng:255 },
]

// All status colors clearly visible on dark background
const STATUS_COLOR: Record<CheckStatus, string> = {
  'checked-in': GL,          // bright gold
  'late':       G4,          // pale gold — warm, distinct from checked-in
  'absent':     '#E8D5A8',  // warm cream — clearly visible, not angry red
  'completed':  G3,          // mid amber — muted "done" state
}
const STATUS_BG: Record<CheckStatus, string> = {
  'checked-in': hex2rgba(GL, 0.12),
  'late':       hex2rgba(G4, 0.12),
  'absent':     hex2rgba('#8B6840', 0.22),
  'completed':  hex2rgba(G3, 0.12),
}
const STATUS_BORDER: Record<CheckStatus, string> = {
  'checked-in': hex2rgba(GL, 0.45),
  'late':       hex2rgba(G4, 0.42),
  'absent':     hex2rgba('#8B6840', 0.55),
  'completed':  hex2rgba(G3, 0.45),
}

const STATUS_LABEL: Record<CheckStatus, string> = {
  'checked-in': 'Checked In',
  'late':       'Late',
  'absent':     'Absent',
  'completed':  'Completed',
}

function StatusBadge({ status }: { status: CheckStatus }) {
  return (
    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD, color:STATUS_COLOR[status], background:STATUS_BG[status], border:`1px solid ${STATUS_BORDER[status]}`, padding:'3px 8px', borderRadius:3 }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

function FilterBtn({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ padding:'5px 12px', background:active?hex2rgba(color,0.18):'rgba(12,10,7,0.85)', border:`1px solid ${active?color:'rgba(212,136,10,0.22)'}`, color:active?color:W55, fontFamily:FD, fontSize:10, fontWeight:active?700:400, cursor:'pointer', letterSpacing:'0.08em', borderRadius:3, transition:'all 0.18s' }}>
      {label}
    </button>
  )
}

function StatCard({ count, label, status, active, onClick }: { count:number; label:string; status:CheckStatus; active:boolean; onClick:()=>void }) {
  const color = STATUS_COLOR[status]
  return (
    <div onClick={onClick}
      style={{ background:'rgba(20,16,5,0.6)', padding:'18px 20px', position:'relative', overflow:'hidden', cursor:'pointer', transition:'all 0.2s', borderRadius:2, border:`1px solid ${active?color:BB}` }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},${hex2rgba(color,0.3)})` }} />
      <div style={{ fontFamily:FD, fontSize:32, fontWeight:700, color, lineHeight:1 }}>{count}</div>
      <div style={{ fontSize:9, color:W55, marginTop:8, letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:FD }}>{label}</div>
    </div>
  )
}

export default function ViewLiveMap() {
  const [selected,     setSelected    ]=useState<Promoter|null>(null)
  const [filterCity,   setFilterCity  ]=useState<string>('all')
  const [filterStatus, setFilterStatus]=useState<CheckStatus|'all'>('all')
  const [pulse,        setPulse       ]=useState(true)

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500)
    return () => clearInterval(t)
  }, [])

  const cities   = ['all', ...Array.from(new Set(MOCK.map(p => p.city)))]
  const filtered = MOCK.filter(p =>
    (filterCity   === 'all' || p.city   === filterCity) &&
    (filterStatus === 'all' || p.status === filterStatus)
  )
  const counts: Record<CheckStatus, number> = {
    'checked-in': MOCK.filter(p => p.status === 'checked-in').length,
    'late':       MOCK.filter(p => p.status === 'late').length,
    'absent':     MOCK.filter(p => p.status === 'absent').length,
    'completed':  MOCK.filter(p => p.status === 'completed').length,
  }

  return (
    <AdminLayout>
      <div style={{ padding:'40px 48px' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Operations · Live</div>
            <h1 style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W }}>Live Operations Map</h1>
            <p style={{ fontSize:13, color:W55, marginTop:6, fontFamily:FD }}>Real-time attendance across all active shifts.</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:GL, opacity:pulse?1:0.25, transition:'opacity 0.5s' }} />
            <span style={{ fontSize:11, color:W55, fontFamily:FD }}>Live · Updated just now</span>
          </div>
        </div>

        {/* STATUS SUMMARY CARDS — clickable filters */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:BB, marginBottom:28 }}>
          {(Object.keys(counts) as CheckStatus[]).map(s=>(
            <StatCard key={s} count={counts[s]} label={STATUS_LABEL[s]} status={s} active={filterStatus===s} onClick={()=>setFilterStatus(filterStatus===s?'all':s)} />
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20 }}>

          {/* MAP PANEL */}
          <div style={{ background:D2, border:`1px solid ${BB}`, position:'relative', overflow:'hidden', minHeight:500, borderRadius:4 }}>
            {/* Grid texture */}
            <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${hex2rgba(GL,0.035)} 1px,transparent 1px),linear-gradient(90deg,${hex2rgba(GL,0.035)} 1px,transparent 1px)`, backgroundSize:'40px 40px' }} />

            {/* Watermark */}
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ fontSize:11, color:W28, letterSpacing:'0.35em', textTransform:'uppercase', fontFamily:FD }}>South Africa · Live View</div>
            </div>

            {/* City filter overlay */}
            <div style={{ position:'absolute', top:14, left:14, display:'flex', gap:5, zIndex:10, flexWrap:'wrap' }}>
              {cities.map(c=>(
                <FilterBtn key={c} label={c==='all'?'All Cities':c} active={filterCity===c} color={GL} onClick={()=>setFilterCity(c)} />
              ))}
            </div>

            {/* Promoter dots */}
            {filtered.map(p => (
              <div key={p.id}
                onClick={() => setSelected(selected?.id===p.id ? null : p)}
                style={{ position:'absolute', left:p.lng, top:p.lat, cursor:'pointer', transform:'translate(-50%,-50%)', zIndex:5 }}>
                {/* Pulse ring for checked-in */}
                {p.status==='checked-in' && (
                  <div style={{ position:'absolute', inset:-8, borderRadius:'50%', border:`1px solid ${STATUS_COLOR[p.status]}`, opacity:pulse?0.6:0.1, transition:'opacity 0.5s' }} />
                )}
                <div style={{ width:selected?.id===p.id?16:12, height:selected?.id===p.id?16:12, borderRadius:'50%', background:STATUS_COLOR[p.status], border:`2px solid ${B}`, transition:'all 0.2s', boxShadow:selected?.id===p.id?`0 0 0 3px ${hex2rgba(STATUS_COLOR[p.status],0.35)}`:'none' }} />
                {/* Tooltip */}
                {selected?.id===p.id && (
                  <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', background:D2, border:`1px solid ${BB}`, padding:'8px 12px', whiteSpace:'nowrap', pointerEvents:'none', borderRadius:3, zIndex:20 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:W, fontFamily:FD }}>{p.name}</div>
                    <div style={{ fontSize:10, color:W55, fontFamily:FD }}>{p.venue}</div>
                  </div>
                )}
              </div>
            ))}

            {/* Legend */}
            <div style={{ position:'absolute', bottom:14, right:14, background:'rgba(10,8,4,0.9)', border:`1px solid ${BB}`, padding:'12px 16px', display:'flex', flexDirection:'column', gap:7, borderRadius:3 }}>
              {(Object.keys(STATUS_COLOR) as CheckStatus[]).map(s=>(
                <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COLOR[s], flexShrink:0 }} />
                  <span style={{ fontSize:10, color:W55, letterSpacing:'0.05em', fontFamily:FD }}>{STATUS_LABEL[s]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PROMOTER LIST */}
          <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'18px 20px 14px', borderBottom:`1px solid ${BB}`, background:D1 }}>
              <div style={{ fontSize:9, letterSpacing:'0.25em', textTransform:'uppercase', color:GL, fontWeight:700, fontFamily:FD }}>Active Promoters</div>
              <div style={{ fontSize:12, color:W55, marginTop:4, fontFamily:FD }}>{filtered.length} showing</div>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {filtered.map((p, i) => (
                <div key={p.id}
                  onClick={() => setSelected(selected?.id===p.id ? null : p)}
                  style={{ padding:'14px 20px', borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', cursor:'pointer', background:selected?.id===p.id?hex2rgba(GL,0.06):'transparent', transition:'background 0.18s' }}
                  onMouseEnter={e=>{ if(selected?.id!==p.id) e.currentTarget.style.background=BB2 }}
                  onMouseLeave={e=>{ if(selected?.id!==p.id) e.currentTarget.style.background='transparent' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{p.name}</div>
                      <div style={{ fontSize:11, color:W55, marginTop:2, fontFamily:FD }}>{p.venue}</div>
                      <div style={{ fontSize:10, color:W28, marginTop:2, fontFamily:FD }}>{p.job}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                      <StatusBadge status={p.status} />
                      {p.time!=='—' && <div style={{ fontSize:10, color:W28, marginTop:6, fontFamily:FD }}>In at {p.time}</div>}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length===0 && <div style={{ padding:40, textAlign:'center', color:W28, fontSize:13, fontFamily:FD }}>No promoters match this filter.</div>}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}