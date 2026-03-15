import { useState } from 'react'
import { AdminLayout } from '../AdminLayout'

// ─── Palette ──────────────────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
type EntryType = 'review' | 'complaint'
type EntryStatus = 'open' | 'resolved' | 'escalated'

interface Entry {
  id:        string
  type:      EntryType
  from:      string
  fromRole:  'promoter' | 'business'
  regarding: string
  regardingRole: 'promoter' | 'business' | 'job'
  subject:   string
  body:      string
  date:      string
  status:    EntryStatus
  rating?:   number        // only for reviews
  jobTitle?: string
  adminNote: string
  read:      boolean
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ENTRIES: Entry[] = [
  {
    id:'RC001', type:'complaint', from:'RedBull SA', fromRole:'business',
    regarding:'Ayanda Dlamini', regardingRole:'promoter',
    subject:'No-show — Sandton City shift, 8 Mar',
    body:'Ayanda Dlamini did not show up for the Sandton City shift on March 8th. This is the second consecutive no-show. We lost a full day of brand activation and had to scramble last minute. We expect a full investigation and accountability from Honey Group.',
    date:'2026-03-11', status:'open', adminNote:'', read:false,
  },
  {
    id:'RC002', type:'review', from:'Ayanda Dlamini', fromRole:'promoter',
    regarding:'RedBull SA', regardingRole:'business',
    subject:'RedBull — Sandton event was well run',
    body:'The event at Sandton City was well organised. The client was professional and briefing was thorough. Payment came through on time. Would work with this client again.',
    date:'2026-03-10', status:'resolved', rating:5, jobTitle:'Red Bull Sampling — Activations Team',
    adminNote:'Noted — positive experience logged.', read:true,
  },
  {
    id:'RC003', type:'review', from:'FreshBrands Ltd', fromRole:'business',
    regarding:'Lerato Mokoena', regardingRole:'promoter',
    subject:'Excellent promoter — launch event standout',
    body:'The promoters provided for our Durban launch event were outstanding. Lerato in particular was exceptional — energetic, well-spoken, and kept the crowd engaged all day. Will specifically request her again.',
    date:'2026-03-09', status:'resolved', rating:5, jobTitle:'In-Store Promoter — Shoprite Durban',
    adminNote:'Positive review forwarded to promoter.', read:true,
  },
  {
    id:'RC004', type:'complaint', from:'Thabo Nkosi', fromRole:'promoter',
    regarding:'Castle Lager SA', regardingRole:'business',
    subject:'Client was dismissive and unprofessional',
    body:'During the Castle Lager event the client supervisor was dismissive and unprofessional towards the promo team. We were not given the promised briefing and were told to "just figure it out". This is unacceptable and I want it on record.',
    date:'2026-03-09', status:'escalated', adminNote:'Escalated to operations manager. Client notified.', read:true,
  },
  {
    id:'RC005', type:'complaint', from:'Nomsa Zulu', fromRole:'promoter',
    regarding:'Acme Events Corp', regardingRole:'business',
    subject:'Late payment — 3 weeks overdue',
    body:'I completed the Menlyn Fashion Night shift on March 1st and have still not received payment. It has been 3 weeks. Every follow-up email goes unanswered. I need this resolved urgently.',
    date:'2026-03-10', status:'open', adminNote:'', read:false,
  },
  {
    id:'RC006', type:'review', from:'Sipho Mhlongo', fromRole:'promoter',
    regarding:'MTN SA', regardingRole:'business',
    subject:'MTN Soweto Festival — great experience',
    body:'Very well organised event. The MTN team was supportive and the briefing was detailed. Pay was competitive. The venue was busy but manageable. Would recommend this client to other promoters.',
    date:'2026-03-08', status:'resolved', rating:4, jobTitle:'MTN Brand Ambassador — Soweto Festival',
    adminNote:'Reviewed and logged.', read:true,
  },
  {
    id:'RC007', type:'complaint', from:'Vodacom SA', fromRole:'business',
    regarding:'Bongani Khumalo', regardingRole:'promoter',
    subject:'Promoter arrived without required ID',
    body:'Bongani Khumalo arrived at the Canal Walk venue without his required RICA certification or ID. We were unable to deploy him and the slot was left empty for 2 hours. This cost us significant brand exposure.',
    date:'2026-03-07', status:'open', adminNote:'', read:false,
  },
  {
    id:'RC008', type:'review', from:'Zanele Motha', fromRole:'promoter',
    regarding:'Heineken SA', regardingRole:'business',
    subject:'Heineken Mall of Africa — smooth shift',
    body:'Really enjoyable shift. The Heineken team was welcoming and the uniform was great. Mall of Africa is a high-traffic venue so the shift was busy but rewarding. Payment was on time.',
    date:'2026-03-06', status:'resolved', rating:4, jobTitle:'Heineken Roadshow — Weekend Crew',
    adminNote:'Positive — logged.', read:true,
  },
  {
    id:'RC009', type:'complaint', from:'Lerato Mokoena', fromRole:'promoter',
    regarding:'Standard Bank SA', regardingRole:'business',
    subject:'Shift cancelled 1 hour before start',
    body:'I travelled from Soweto to Pretoria for the Standard Bank Career Expo and was notified only 1 hour before the start that the shift was cancelled. I incurred travel costs and lost an entire day. No compensation was offered.',
    date:'2026-03-05', status:'escalated', adminNote:'Client issued formal apology. Travel reimbursement approved.', read:true,
  },
  {
    id:'RC010', type:'review', from:'Chantelle Botha', fromRole:'promoter',
    regarding:'SAB South Africa', regardingRole:'business',
    subject:'Brutal Fruit sampling — fun and professional',
    body:'SAB always runs tight activations. The product is easy to sample, the kit is high quality, and supervisors are on point. Pay rate is competitive for the hours. My third campaign with them and counting.',
    date:'2026-03-04', status:'resolved', rating:5, jobTitle:'Brutal Fruit — Weekend Sampling Crew',
    adminNote:'Filed.', read:true,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:12, color: i <= rating ? GL : W28 }}>★</span>
      ))}
    </div>
  )
}

function TypeBadge({ type }: { type: EntryType }) {
  const isReview = type === 'review'
  return (
    <span style={{
      fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD,
      color: isReview ? GL : G4,
      background: isReview ? hex2rgba(GL, 0.12) : hex2rgba(G4, 0.12),
      border: `1px solid ${isReview ? hex2rgba(GL, 0.42) : hex2rgba(G4, 0.42)}`,
      padding:'3px 10px', borderRadius:3,
    }}>
      {isReview ? '★ Review' : '⚑ Complaint'}
    </span>
  )
}

function StatusBadge({ status }: { status: EntryStatus }) {
  const map: Record<EntryStatus, { color:string; bg:string; border:string }> = {
    open:      { color: G4,                bg: hex2rgba(G4, 0.10), border: hex2rgba(G4, 0.38) },
    resolved:  { color: G3,                bg: hex2rgba(G3, 0.10), border: hex2rgba(G3, 0.38) },
    escalated: { color: '#E8D5A8',         bg: hex2rgba(G5, 0.35), border: hex2rgba(G2, 0.55) },
  }
  const s = map[status]
  return (
    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD, color:s.color, background:s.bg, border:`1px solid ${s.border}`, padding:'3px 10px', borderRadius:3 }}>
      {status}
    </span>
  )
}

function FilterBtn({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      padding:'6px 16px', border:`1px solid ${active ? color : 'rgba(212,136,10,0.22)'}`,
      cursor:'pointer', fontFamily:FD, fontSize:10, fontWeight:active?700:400,
      textTransform:'capitalize' as const, borderRadius:3,
      background:active ? hex2rgba(color, 0.18) : 'transparent',
      color:active ? color : W55, transition:'all 0.18s',
    }}>{label}</button>
  )
}

function StatCard({ label, value, color }: { label:string; value:any; color:string }) {
  return (
    <div style={{ background:'rgba(20,16,5,0.6)', padding:'22px 20px', position:'relative', overflow:'hidden', borderRadius:2 }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},${hex2rgba(color,0.3)})` }} />
      <div style={{ fontFamily:FD, fontSize:34, fontWeight:700, color:W, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:9, color:W55, marginTop:8, letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:FD }}>{label}</div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ entry, onClose, onUpdate }: { entry: Entry; onClose: ()=>void; onUpdate: (id:string, status:EntryStatus, note:string)=>void }) {
  const [status, setStatus] = useState<EntryStatus>(entry.status)
  const [note,   setNote  ] = useState(entry.adminNote)
  const [saved,  setSaved ] = useState(false)

  const handleSave = () => {
    onUpdate(entry.id, status, note)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const accent = entry.type === 'review' ? GL : G4

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.90)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:D2, border:`1px solid ${BB}`, width:'100%', maxWidth:580, maxHeight:'92vh', overflowY:'auto', position:'relative', borderRadius:4 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G5},${accent},${G5})` }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>

        <div style={{ padding:'32px 36px 0' }}>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
            <TypeBadge type={entry.type} />
            <StatusBadge status={entry.status} />
            {entry.rating && <StarDisplay rating={entry.rating} />}
          </div>
          <div style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, marginBottom:6, lineHeight:1.3 }}>{entry.subject}</div>
          <div style={{ fontSize:12, color:W55, marginBottom:20, fontFamily:FD }}>
            From: <strong style={{ color:W85 }}>{entry.from}</strong> ({entry.fromRole}) · {entry.date}
          </div>

          {/* Regarding */}
          <div style={{ padding:'10px 16px', background:hex2rgba(accent, 0.06), border:`1px solid ${hex2rgba(accent, 0.22)}`, marginBottom:20, borderRadius:3 }}>
            <span style={{ fontSize:10, color:accent, fontFamily:FD, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Regarding: </span>
            <span style={{ fontSize:12, color:W85, fontFamily:FD }}>{entry.regarding}</span>
            {entry.jobTitle && <span style={{ fontSize:11, color:W55, fontFamily:FD }}> · {entry.jobTitle}</span>}
          </div>

          {/* Body */}
          <div style={{ padding:'18px 20px', background:BB2, border:`1px solid ${BB}`, marginBottom:24, fontSize:13, color:W, lineHeight:1.8, fontFamily:FD, borderRadius:3 }}>
            {entry.body}
          </div>
        </div>

        <div style={{ padding:'0 36px 36px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Status */}
          <div>
            <label style={{ fontSize:9, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:W55, display:'block', marginBottom:8, fontFamily:FD }}>Update Status</label>
            <div style={{ display:'flex', gap:6 }}>
              {(['open','resolved','escalated'] as EntryStatus[]).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ flex:1, padding:'9px 8px', fontFamily:FD, fontSize:10, fontWeight:status===s?700:400, cursor:'pointer', borderRadius:3, textTransform:'capitalize',
                    background: status===s ? hex2rgba(s==='open'?G4:s==='resolved'?G3:G2, 0.22) : 'transparent',
                    border:`1px solid ${status===s?(s==='open'?G4:s==='resolved'?G3:G2):BB}`,
                    color: status===s ? (s==='open'?G4:s==='resolved'?G3:'#E8D5A8') : W55,
                    transition:'all 0.18s',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Admin note */}
          <div>
            <label style={{ fontSize:9, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:W55, display:'block', marginBottom:8, fontFamily:FD }}>Admin Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="Add an internal note about this entry..."
              style={{ width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'10px 14px', color:W, fontFamily:FD, fontSize:13, resize:'none', outline:'none', borderRadius:3 }}
              onFocus={e => e.currentTarget.style.borderColor=GL} onBlur={e => e.currentTarget.style.borderColor=BB} />
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleSave}
              style={{ flex:2, padding:'11px', background:saved ? hex2rgba(G3,0.2) : `linear-gradient(135deg,${GL},${G})`, border:`1px solid ${GL}`, color:saved?GL:B, fontFamily:FD, fontSize:11, fontWeight:700, letterSpacing:'0.1em', cursor:'pointer', borderRadius:3, transition:'all 0.2s' }}>
              {saved ? '✓ Saved' : 'Save Changes'}
            </button>
            <button onClick={onClose}
              style={{ flex:1, padding:'11px', background:'transparent', border:`1px solid ${BB}`, color:W55, fontFamily:FD, fontSize:11, cursor:'pointer', borderRadius:3 }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReviewsAndComplaintsPage() {
  const [entries, setEntries] = useState<Entry[]>(MOCK_ENTRIES)
  const [viewing, setViewing] = useState<Entry | null>(null)
  const [typeF,   setTypeF  ] = useState<'all'|EntryType>('all')
  const [statusF, setStatusF] = useState<'all'|EntryStatus>('all')
  const [roleF,   setRoleF  ] = useState<'all'|'promoter'|'business'>('all')
  const [search,  setSearch ] = useState('')

  const handleOpen = (entry: Entry) => {
    setViewing(entry)
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, read: true } : e))
  }

  const handleUpdate = (id: string, status: EntryStatus, note: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status, adminNote: note } : e))
    setViewing(prev => prev?.id === id ? { ...prev, status, adminNote: note } : prev)
  }

  const filtered = entries.filter(e => {
    const tm = typeF   === 'all' || e.type      === typeF
    const sm = statusF === 'all' || e.status    === statusF
    const rm = roleF   === 'all' || e.fromRole  === roleF
    const qm = !search || [e.subject, e.from, e.regarding, e.body].some(v => v.toLowerCase().includes(search.toLowerCase()))
    return tm && sm && rm && qm
  })

  const reviews    = entries.filter(e => e.type === 'review')
  const complaints = entries.filter(e => e.type === 'complaint')
  const open       = entries.filter(e => e.status === 'open')
  const escalated  = entries.filter(e => e.status === 'escalated')
  const unread     = entries.filter(e => !e.read)
  const avgRating  = reviews.filter(e => e.rating).reduce((sum, e) => sum + (e.rating||0), 0) / (reviews.filter(e=>e.rating).length || 1)

  return (
    <AdminLayout>
      <div style={{ padding:'40px 48px' }}>

        {/* HEADER */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Comms · Feedback</div>
          <h1 style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W }}>Reviews & Complaints</h1>
          <p style={{ fontSize:13, color:W55, marginTop:6, fontFamily:FD }}>Manage promoter reviews and business/promoter complaints across all campaigns.</p>
        </div>

        {/* STAT CARDS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:1, background:BB, marginBottom:32 }}>
          <StatCard label="Total Entries"      value={entries.length}             color={GL} />
          <StatCard label="Reviews"            value={reviews.length}             color={G3} />
          <StatCard label="Complaints"         value={complaints.length}          color={G4} />
          <StatCard label="Open / Unresolved"  value={open.length}                color={G4} />
          <StatCard label="Avg Review Rating"  value={`${avgRating.toFixed(1)} ★`} color={GL} />
        </div>

        {/* UNREAD BANNER */}
        {unread.length > 0 && (
          <div style={{ padding:'12px 18px', background:hex2rgba(GL, 0.06), border:`1px solid ${hex2rgba(GL, 0.28)}`, marginBottom:20, fontSize:12, color:GL, display:'flex', alignItems:'center', gap:8, borderRadius:3, fontFamily:FD }}>
            <span>●</span>
            <span><strong>{unread.length}</strong> unread entr{unread.length === 1 ? 'y' : 'ies'} · {escalated.length > 0 && <span style={{ color:G4 }}><strong>{escalated.length}</strong> escalated</span>}</span>
          </div>
        )}

        {/* FILTERS */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            <FilterBtn label={`All (${entries.length})`}                  active={typeF==='all'}       color={GL} onClick={()=>setTypeF('all')} />
            <FilterBtn label={`Reviews (${reviews.length})`}              active={typeF==='review'}    color={GL} onClick={()=>setTypeF('review')} />
            <FilterBtn label={`Complaints (${complaints.length})`}        active={typeF==='complaint'} color={G4} onClick={()=>setTypeF('complaint')} />
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {(['all','open','resolved','escalated'] as const).map(s => (
              <FilterBtn key={s} label={s==='all'?'All Status':s} active={statusF===s} color={s==='escalated'?'#E8D5A8':s==='resolved'?G3:G4} onClick={()=>setStatusF(s)} />
            ))}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ display:'flex', gap:4 }}>
              {(['all','promoter','business'] as const).map(r => (
                <FilterBtn key={r} label={r==='all'?'All Roles':r} active={roleF===r} color={G3} onClick={()=>setRoleF(r)} />
              ))}
            </div>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:W28, fontSize:12, pointerEvents:'none' }}>⌕</span>
              <input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{ background:D2, border:`1px solid ${BB}`, padding:'7px 14px 7px 30px', color:W, fontFamily:FD, fontSize:11, outline:'none', borderRadius:3, width:180 }}
                onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${BB}`, background:D1 }}>
                {['Type','From','Regarding','Subject','Date','Status',''].map(h => (
                  <th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:W28, fontFamily:FD }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id}
                  style={{ borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', background:e.read?'transparent':hex2rgba(GL,0.03), transition:'background 0.18s', cursor:'pointer' }}
                  onClick={() => handleOpen(e)}
                  onMouseEnter={ev => ev.currentTarget.style.background=BB2}
                  onMouseLeave={ev => ev.currentTarget.style.background=e.read?'transparent':hex2rgba(GL,0.03)}>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {!e.read && <div style={{ width:5, height:5, borderRadius:'50%', background:GL, flexShrink:0 }} />}
                      <TypeBadge type={e.type} />
                    </div>
                    {e.rating && (
                      <div style={{ marginTop:5 }}><StarDisplay rating={e.rating} /></div>
                    )}
                  </td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{e.from}</div>
                    <div style={{ fontSize:10, color:W55, marginTop:2, fontFamily:FD, textTransform:'capitalize' }}>{e.fromRole}</div>
                  </td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:12, color:W85, fontFamily:FD }}>{e.regarding}</div>
                    <div style={{ fontSize:10, color:W28, marginTop:2, fontFamily:FD, textTransform:'capitalize' }}>{e.regardingRole}</div>
                  </td>
                  <td style={{ padding:'14px 18px', maxWidth:240 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:W, fontFamily:FD, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.subject}</div>
                    {e.jobTitle && <div style={{ fontSize:10, color:W28, marginTop:2, fontFamily:FD, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.jobTitle}</div>}
                  </td>
                  <td style={{ padding:'14px 18px', fontSize:12, color:W55, fontFamily:FD, whiteSpace:'nowrap' }}>{e.date}</td>
                  <td style={{ padding:'14px 18px' }}><StatusBadge status={e.status} /></td>
                  <td style={{ padding:'14px 18px' }}>
                    <button style={{ fontSize:11, color:GL, background:'none', border:'none', cursor:'pointer', fontFamily:FD, fontWeight:700 }}
                      onMouseEnter={ev=>ev.currentTarget.style.color=W} onMouseLeave={ev=>ev.currentTarget.style.color=GL}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding:48, textAlign:'center', color:W28, fontSize:13, fontFamily:FD }}>No entries match your filters.</div>
          )}
        </div>

        <div style={{ marginTop:12, fontSize:11, color:W28, fontFamily:FD }}>
          Showing <strong style={{ color:W55 }}>{filtered.length}</strong> of <strong style={{ color:W55 }}>{entries.length}</strong> entries
        </div>

        {viewing && (
          <DetailModal entry={viewing} onClose={()=>setViewing(null)} onUpdate={handleUpdate} />
        )}
      </div>
    </AdminLayout>
  )
}