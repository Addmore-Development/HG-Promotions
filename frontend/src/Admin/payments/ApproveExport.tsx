import { useState } from 'react'
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

const FD   = "'Playfair Display', Georgia, serif"
const MONO = "'DM Mono', 'Courier New', monospace"

function hex2rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

type PayStatus = 'pending' | 'approved' | 'exported' | 'paid'

interface PayRecord {
  id: string; promoter: string; email: string; bank: string; accountNo: string
  job: string; date: string; hours: number; rate: number; deductions: number; status: PayStatus
}

const MOCK: PayRecord[] = [
  { id:'PAY-001', promoter:'Ayanda Dlamini',  email:'ayanda@email.com',  bank:'FNB',      accountNo:'****4521', job:'Red Bull — Sandton',    date:'2026-03-08', hours:8, rate:120, deductions:0,   status:'pending'  },
  { id:'PAY-002', promoter:'Thabo Nkosi',     email:'thabo@email.com',   bank:'Capitec',  accountNo:'****7832', job:'Red Bull — Sandton',    date:'2026-03-08', hours:8, rate:120, deductions:50,  status:'pending'  },
  { id:'PAY-003', promoter:'Sipho Mhlongo',   email:'sipho@email.com',   bank:'ABSA',     accountNo:'****3301', job:'Nike — Mall of Africa', date:'2026-03-07', hours:8, rate:135, deductions:0,   status:'approved' },
  { id:'PAY-004', promoter:'Zanele Motha',    email:'zanele@email.com',  bank:'Standard', accountNo:'****9914', job:'Nike — Mall of Africa', date:'2026-03-07', hours:8, rate:135, deductions:0,   status:'approved' },
  { id:'PAY-005', promoter:'Bongani Khumalo', email:'bongani@email.com', bank:'Nedbank',  accountNo:'****5542', job:'Savanna — Gateway',     date:'2026-03-06', hours:8, rate:115, deductions:100, status:'exported' },
  { id:'PAY-006', promoter:'Lerato Mokoena',  email:'lerato@email.com',  bank:'FNB',      accountNo:'****2278', job:'Nedbank Golf Day',      date:'2026-03-05', hours:8, rate:150, deductions:0,   status:'paid'     },
]

// All status colors clearly visible on dark background
const STATUS_CLR: Record<PayStatus, string> = {
  pending:  GL,          // bright gold
  approved: G3,          // mid amber
  exported: G4,          // pale gold — bright, distinguishable
  paid:     '#E8D5A8',  // warm cream — visible for "done" state
}
const STATUS_BG: Record<PayStatus, string> = {
  pending:  hex2rgba(GL, 0.12),
  approved: hex2rgba(G3, 0.12),
  exported: hex2rgba(G4, 0.12),
  paid:     hex2rgba('#8B6840', 0.18),
}
const STATUS_BORDER: Record<PayStatus, string> = {
  pending:  hex2rgba(GL, 0.45),
  approved: hex2rgba(G3, 0.45),
  exported: hex2rgba(G4, 0.42),
  paid:     hex2rgba('#8B6840', 0.5),
}

function StatusBadge({ status }: { status: PayStatus }) {
  return (
    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD, color:STATUS_CLR[status], background:STATUS_BG[status], border:`1px solid ${STATUS_BORDER[status]}`, padding:'3px 10px', borderRadius:3 }}>
      {status}
    </span>
  )
}

function FilterBtn({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ padding:'7px 16px', border:`1px solid ${active ? color : 'rgba(212,136,10,0.22)'}`, cursor:'pointer', fontFamily:FD, fontSize:10, fontWeight:active?700:400, textTransform:'capitalize' as const, borderRadius:3, background:active?hex2rgba(color,0.18):'transparent', color:active?color:W55, transition:'all 0.18s' }}>
      {label}
    </button>
  )
}

function StatCard({ label, value, sub, color, count }: { label:string; value:string; sub?:string; color:string; count:number }) {
  return (
    <div style={{ background:'rgba(20,16,5,0.6)', padding:'24px 22px', position:'relative', overflow:'hidden', borderRadius:2 }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},${hex2rgba(color,0.4)})` }} />
      <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:W55, marginBottom:10, fontFamily:FD }}>{label}</div>
      <div style={{ fontFamily:FD, fontSize:34, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:W28, marginTop:8, fontFamily:FD }}>{count} promoters{sub ? ` · ${sub}` : ''}</div>
    </div>
  )
}

const gross  = (r: PayRecord) => r.hours * r.rate
const net    = (r: PayRecord) => gross(r) - r.deductions
const fmtZAR = (n: number)   => `R${n.toLocaleString('en-ZA')}`

export default function ApproveExport() {
  const [records,  setRecords ]=useState<PayRecord[]>(MOCK)
  const [selected, setSelected]=useState<Set<string>>(new Set())
  const [filter,   setFilter  ]=useState<PayStatus|'all'>('all')
  const [exported, setExported]=useState(false)

  const filtered  = records.filter(r => filter === 'all' || r.status === filter)
  const actionable = filtered.filter(r => r.status === 'pending' || r.status === 'approved')
  const allIds    = actionable.map(r => r.id)
  const allTicked = allIds.length > 0 && allIds.every(id => selected.has(id))

  const toggle    = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const toggleAll = () => setSelected(allTicked ? new Set() : new Set(allIds))

  const approveSelected = () => {
    setRecords(prev => prev.map(r => selected.has(r.id) && r.status === 'pending' ? { ...r, status: 'approved' } : r))
    setSelected(new Set())
  }
  const exportSelected = () => {
    setRecords(prev => prev.map(r => selected.has(r.id) && r.status === 'approved' ? { ...r, status: 'exported' } : r))
    setSelected(new Set())
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  const totalSelected  = [...selected].reduce((sum, id) => { const r = records.find(x => x.id === id); return r ? sum + net(r) : sum }, 0)
  const pendingTotal   = records.filter(r => r.status === 'pending').reduce((s, r) => s + net(r), 0)
  const approvedTotal  = records.filter(r => r.status === 'approved').reduce((s, r) => s + net(r), 0)
  const paidTotal      = records.filter(r => r.status === 'paid').reduce((s, r) => s + net(r), 0)

  return (
    <AdminLayout>
      <div style={{ padding:'40px 48px' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Finance · Payroll</div>
            <h1 style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W }}>Approve & Export Payments</h1>
            <p style={{ fontSize:13, color:W55, marginTop:6, fontFamily:FD }}>Review promoter payouts, approve batches, and export to Paystack EFT.</p>
          </div>
          {exported && (
            <div style={{ padding:'12px 24px', background:hex2rgba(G3,0.12), border:`1px solid ${hex2rgba(G3,0.45)}`, color:GL, fontFamily:FD, fontSize:13, fontWeight:700, borderRadius:3 }}>
              ✓ Export successful — EFT batch sent
            </div>
          )}
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:BB, marginBottom:28 }}>
          <StatCard label="Pending Approval" value={fmtZAR(pendingTotal)}  color={GL} count={records.filter(r=>r.status==='pending').length}  />
          <StatCard label="Approved — Ready" value={fmtZAR(approvedTotal)} color={G3} count={records.filter(r=>r.status==='approved').length} />
          <StatCard label="Paid This Month"  value={fmtZAR(paidTotal)}     color={G4} count={records.filter(r=>r.status==='paid').length}     />
        </div>

        {/* ACTIONS + FILTERS */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:6 }}>
            {(['all','pending','approved','exported','paid'] as const).map(f=>(
              <FilterBtn key={f} label={f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)} active={filter===f} color={f==='all'?GL:STATUS_CLR[f]} onClick={()=>setFilter(f)} />
            ))}
          </div>

          {selected.size > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:12, color:W55, fontFamily:FD }}>{selected.size} selected · {fmtZAR(totalSelected)}</span>
              <button onClick={approveSelected} style={{ padding:'8px 18px', background:hex2rgba(G3,0.15), border:`1px solid ${G3}`, color:G3, fontFamily:FD, fontSize:11, fontWeight:700, cursor:'pointer', letterSpacing:'0.08em', borderRadius:3 }}>
                ✓ Approve
              </button>
              <button onClick={exportSelected} style={{ padding:'8px 18px', background:`linear-gradient(135deg,${GL},${G3})`, border:'none', color:B, fontFamily:FD, fontSize:11, fontWeight:700, cursor:'pointer', letterSpacing:'0.08em', borderRadius:3, boxShadow:`0 2px 12px ${hex2rgba(GL,0.35)}` }}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}
              >↑ Export EFT</button>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${BB}`, background:D1 }}>
                <th style={{ padding:'13px 18px', width:40 }}>
                  <input type="checkbox" checked={allTicked} onChange={toggleAll} style={{ accentColor:GL, cursor:'pointer' }} />
                </th>
                {['Promoter','Bank','Job','Date','Hours','Gross','Deductions','Net Payout','Status'].map(h=>(
                  <th key={h} style={{ padding:'13px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:W28, fontFamily:FD, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id}
                  style={{ borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', background:selected.has(r.id)?hex2rgba(GL,0.04):'transparent', transition:'background 0.15s' }}
                  onMouseEnter={e=>{ if(!selected.has(r.id)) e.currentTarget.style.background=BB2 }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=selected.has(r.id)?hex2rgba(GL,0.04):'transparent' }}>
                  <td style={{ padding:'14px 18px' }}>
                    {(r.status==='pending'||r.status==='approved') && (
                      <input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggle(r.id)} style={{ accentColor:GL, cursor:'pointer' }} />
                    )}
                  </td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{r.promoter}</div>
                    <div style={{ fontSize:11, color:W55, fontFamily:FD }}>{r.email}</div>
                  </td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:12, color:W, fontFamily:FD }}>{r.bank}</div>
                    <div style={{ fontSize:11, color:W28, fontFamily:MONO }}>{r.accountNo}</div>
                  </td>
                  <td style={{ padding:'14px 18px', fontSize:12, color:W55, fontFamily:FD, maxWidth:160 }}>{r.job}</td>
                  <td style={{ padding:'14px 18px', fontSize:12, color:W55, fontFamily:FD, whiteSpace:'nowrap' }}>
                    {new Date(r.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}
                  </td>
                  <td style={{ padding:'14px 18px', fontSize:12, color:W55, textAlign:'center', fontFamily:FD }}>{r.hours}h</td>
                  <td style={{ padding:'14px 18px', fontSize:12, color:W, fontFamily:FD }}>{fmtZAR(gross(r))}</td>
                  <td style={{ padding:'14px 18px', fontSize:12, color:r.deductions>0?'#E8D5A8':W28, fontFamily:FD }}>
                    {r.deductions>0 ? `-${fmtZAR(r.deductions)}` : '—'}
                  </td>
                  <td style={{ padding:'14px 18px', fontSize:14, fontWeight:700, color:GL, fontFamily:FD }}>{fmtZAR(net(r))}</td>
                  <td style={{ padding:'14px 18px' }}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop:`1px solid ${BB}`, background:BB2 }}>
                <td colSpan={7} style={{ padding:'14px 18px', fontSize:11, color:W55, fontFamily:FD }}>
                  {filtered.length} records
                </td>
                <td colSpan={3} style={{ padding:'14px 18px' }}>
                  <div style={{ fontSize:10, color:W55, fontFamily:FD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>Total Net Payout</div>
                  <div style={{ fontFamily:FD, fontSize:22, color:GL, fontWeight:700 }}>
                    {fmtZAR(filtered.reduce((s, r) => s + net(r), 0))}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}