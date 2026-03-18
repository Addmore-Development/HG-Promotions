import { useState, useEffect } from 'react'
import { AdminLayout } from '../AdminLayout'
import { injectAdminMobileStyles } from '../adminMobileStyles'

const G   = '#D4880A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const G3  = '#C07818'
const G4  = '#F0C050'
const G5  = '#6B3F10'
const B   = '#0C0A07'
const D2  = '#151209'
const D3  = '#1C1709'
const BB  = 'rgba(212,136,10,0.16)'
const BB2 = 'rgba(212,136,10,0.06)'
const W   = '#CEC5B2'
const W55 = 'rgba(192,178,158,0.80)'
const W28 = 'rgba(172,158,136,0.65)'
const FD  = "'Playfair Display', Georgia, serif"

function hex2rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const today = () => new Date().toISOString().slice(0, 10)

function exportCSV(rows: string[][], filename: string) {
  const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  triggerDownload(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

function exportPDF(htmlContent: string, filename: string) {
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${htmlContent}</body></html>`
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')
  if (win) { win.addEventListener('load', () => { setTimeout(() => { win.focus(); win.print() }, 600) }); setTimeout(() => URL.revokeObjectURL(url), 15_000) }
  else { triggerDownload(blob, filename + '.html'); URL.revokeObjectURL(url) }
}

interface CalcState { rate: number; hours: number; promoters: number }

interface PayRecord {
  id: string; promoter: string; email: string; bank: string; accountNo: string
  job: string; client: string; date: string; hours: number; rate: number
  deductions: number; status: string
}

const gross  = (r: PayRecord) => r.hours * r.rate
const net    = (r: PayRecord) => gross(r) - r.deductions
const fmtZAR = (n: number)   => `R${n.toLocaleString('en-ZA')}`

const MOCK_RECORDS: PayRecord[] = [
  { id:'PAY-001', promoter:'Ayanda Dlamini',  email:'ayanda@email.com',  bank:'FNB',      accountNo:'****4521', job:'Red Bull — Sandton',    client:'Red Bull SA', date:'2026-03-08', hours:8, rate:120, deductions:0,   status:'pending'  },
  { id:'PAY-002', promoter:'Thabo Nkosi',     email:'thabo@email.com',   bank:'Capitec',  accountNo:'****7832', job:'Red Bull — Sandton',    client:'Red Bull SA', date:'2026-03-08', hours:8, rate:120, deductions:50,  status:'pending'  },
  { id:'PAY-003', promoter:'Sipho Mhlongo',   email:'sipho@email.com',   bank:'ABSA',     accountNo:'****3301', job:'Nike — Mall of Africa', client:'Nike SA',     date:'2026-03-07', hours:8, rate:135, deductions:0,   status:'approved' },
  { id:'PAY-004', promoter:'Zanele Motha',    email:'zanele@email.com',  bank:'Standard', accountNo:'****9914', job:'Nike — Mall of Africa', client:'Nike SA',     date:'2026-03-07', hours:8, rate:135, deductions:0,   status:'approved' },
  { id:'PAY-005', promoter:'Bongani Khumalo', email:'bongani@email.com', bank:'Nedbank',  accountNo:'****5542', job:'Savanna — Gateway',     client:'Distell',     date:'2026-03-06', hours:8, rate:115, deductions:100, status:'exported' },
  { id:'PAY-006', promoter:'Lerato Mokoena',  email:'lerato@email.com',  bank:'FNB',      accountNo:'****2278', job:'Nedbank Golf Day',      client:'Nedbank',     date:'2026-03-05', hours:8, rate:150, deductions:0,   status:'paid'     },
  { id:'PAY-007', promoter:'Nomsa Zulu',      email:'nomsa@email.com',   bank:'Capitec',  accountNo:'****6612', job:'Heineken Activation',   client:'Heineken SA', date:'2026-03-09', hours:8, rate:120, deductions:0,   status:'pending'  },
  { id:'PAY-008', promoter:'Kagiso Radebe',   email:'kagiso@email.com',  bank:'ABSA',     accountNo:'****8843', job:'MTN Soweto Festival',   client:'MTN SA',      date:'2026-03-10', hours:8, rate:110, deductions:0,   status:'approved' },
]

function buildPayrollCSV(records: PayRecord[]) {
  const headers = ['ID','Promoter','Email','Bank','Account No','Job','Client','Date','Hours','Rate (R)','Gross (R)','Deductions (R)','Net Payout (R)','Status']
  const rows    = records.map(r => [r.id, r.promoter, r.email, r.bank, r.accountNo, r.job, r.client, r.date, r.hours, r.rate, gross(r), r.deductions, net(r), r.status])
  exportCSV([headers, ...rows] as string[][], `honey-group-payroll-${today()}.csv`)
}

function buildCampaignPDF(records: PayRecord[]) {
  const byClient: Record<string, PayRecord[]> = {}
  records.forEach(r => { byClient[r.client] = byClient[r.client] || []; byClient[r.client].push(r) })
  const clientSections = Object.entries(byClient).map(([client, cr]) => {
    const totalHours = cr.reduce((s, r) => s + r.hours, 0)
    const totalCost  = cr.reduce((s, r) => s + net(r), 0)
    const promoters  = new Set(cr.map(r => r.promoter)).size
    const rows       = cr.map(r => `<tr><td>${r.promoter}</td><td>${r.job}</td><td>${r.date}</td><td>${r.hours}h</td><td>R${r.rate}/hr</td><td style="color:#E8A820;font-weight:700">${fmtZAR(net(r))}</td><td>${r.status}</td></tr>`).join('')
    return `<div class="section"><div class="client-name">${client}</div><div class="summary"><div class="card"><div class="card-label">Promoters</div><div class="card-value">${promoters}</div></div><div class="card"><div class="card-label">Shifts</div><div class="card-value">${cr.length}</div></div><div class="card"><div class="card-label">Total Hours</div><div class="card-value">${totalHours}h</div></div><div class="card"><div class="card-label">Total Payout</div><div class="card-value" style="color:#E8A820">${fmtZAR(totalCost)}</div></div></div><table><thead><tr><th>Promoter</th><th>Job</th><th>Date</th><th>Hours</th><th>Rate</th><th>Net Payout</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`
  }).join('')
  const html = `<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#0C0A07;color:#FAF3E8;padding:48px;font-size:13px}.header{border-bottom:2px solid #D4880A;padding-bottom:24px;margin-bottom:36px}.logo{font-size:26px;font-weight:700;color:#E8A820}.logo span{color:#FAF3E8}.sub{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#C07818;margin-top:6px}.section{margin-bottom:44px}.client-name{font-size:15px;font-weight:700;color:#E8A820;border-left:3px solid #E8A820;padding-left:12px;margin-bottom:14px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}.card{background:rgba(212,136,10,.08);border:1px solid rgba(212,136,10,.2);padding:12px 14px}.card-label{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(250,243,232,.5);margin-bottom:6px}.card-value{font-size:20px;font-weight:700;color:#FAF3E8}table{width:100%;border-collapse:collapse;font-size:12px}thead tr{background:rgba(212,136,10,.1)}th{padding:9px 12px;text-align:left;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:rgba(250,243,232,.5);border-bottom:1px solid rgba(212,136,10,.2)}td{padding:9px 12px;border-bottom:1px solid rgba(212,136,10,.08);color:rgba(250,243,232,.85)}</style><div class="header"><div class="logo">HONEY <span>GROUP</span></div><div class="sub">Campaign Attendance & Payroll Report</div></div>${clientSections}`
  exportPDF(html, `honey-group-campaign-report-${today()}`)
}

function buildJobsCSV() {
  const stored = localStorage.getItem('hg_admin_jobs')
  const jobs   = stored ? JSON.parse(stored) : []
  if (jobs.length === 0) { exportCSV([['No jobs data available.']], `honey-group-jobs-${today()}.csv`); return }
  const headers = ['ID','Title','Company','Location','Date','Pay','Slots','Slots Left','Type','Status']
  const rows = jobs.map((j: any) => [j.id, j.title, j.company||j.client, j.location||`${j.venue}, ${j.city}`, j.jobDate||j.date, j.pay||`R${j.hourlyRate}/hr`, j.slots||j.totalSlots, j.slotsLeft??(j.totalSlots-j.filledSlots), j.type||j.category, j.status])
  exportCSV([headers, ...rows] as string[][], `honey-group-jobs-${today()}.csv`)
}

function buildPromotersCSV() {
  const stored = localStorage.getItem('hg_promoters_cache')
  const users  = stored ? JSON.parse(stored) : []
  const headers = ['ID','Name','Email','City','Reliability Score','Status','Joined']
  if (users.length === 0) { exportCSV([headers, ['—','No promoter data cached.','','','','','']] as string[][], `honey-group-promoters-${today()}.csv`); return }
  const rows = users.map((u: any) => [u.id, u.fullName||u.name, u.email, u.city, u.reliabilityScore??'', u.status, u.createdAt?.slice(0,10)??''])
  exportCSV([headers, ...rows] as string[][], `honey-group-promoters-${today()}.csv`)
}

// ── Export card component ─────────────────────────────────────────────────────
function ExportCard({ icon, title, description, format, color, onClick }: {
  icon: string; title: string; description: string; format: 'CSV' | 'PDF'; color: string; onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <div className="hg-export-card"
      style={{ background:hover?hex2rgba(color,0.07):D2, border:`1px solid ${hover?hex2rgba(color,0.5):BB}`, borderRadius:4, padding:'24px 24px 20px', cursor:'pointer', transition:'all 0.18s', position:'relative', overflow:'hidden' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onClick}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:hover?`linear-gradient(90deg,${color},${hex2rgba(color,0.3)})`:'transparent', transition:'all 0.18s' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:FD, color, background:hex2rgba(color,0.12), border:`1px solid ${hex2rgba(color,0.4)}`, padding:'3px 9px', borderRadius:3 }}>{format}</span>
      </div>
      <div style={{ fontSize:14, fontWeight:700, color:W, fontFamily:FD, marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:12, color:W55, fontFamily:FD, lineHeight:1.6, marginBottom:16 }}>{description}</div>
      <div style={{ fontSize:11, fontWeight:700, color, fontFamily:FD, letterSpacing:'0.06em' }}>↓ Download {format}</div>
    </div>
  )
}

export default function ReportsExports() {
  const [calc,   setCalc  ] = useState<CalcState>({ rate: 120, hours: 8, promoters: 6 })
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => { injectAdminMobileStyles() }, [])

  const flash = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(null), 4000) }
  const handleExport = (fn: () => void, msg: string) => { fn(); flash(msg) }
  const totalPayout = calc.rate * calc.hours * calc.promoters

  const inp: React.CSSProperties = { background:BB2, border:`1px solid ${BB}`, padding:'12px 16px', fontFamily:FD, fontSize:15, color:W, outline:'none', borderRadius:3, width:'100%', boxSizing:'border-box' }
  const lbl: React.CSSProperties = { fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:W55, display:'block', marginBottom:8, fontFamily:FD }

  return (
    <AdminLayout>
      <div className="hg-page" style={{ padding:'40px 48px' }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>System · Reporting</div>
          <h1 style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W }}>Reports &amp; Exports</h1>
          <p style={{ fontSize:13, color:W55, marginTop:6, fontFamily:FD }}>Download platform data as CSV or PDF directly to your device.</p>
        </div>

        {/* ── FLASH NOTICE ── */}
        {notice && (
          <div style={{ padding:'13px 20px', background:hex2rgba(GL,0.10), border:`1px solid ${hex2rgba(GL,0.45)}`, borderRadius:4, marginBottom:24, fontSize:13, color:GL, fontFamily:FD, fontWeight:700 }}>
            ✓ {notice}
          </div>
        )}

        {/* ── EXPORT CARDS GRID ── */}
        <div className="hg-card-grid-3" style={{ marginBottom:32 }}>
          <ExportCard icon="📄" title="Full Payroll Register"    format="CSV" color={G3} description="All promoter payout records with bank details, hours, rates, and net pay." onClick={() => handleExport(() => buildPayrollCSV(MOCK_RECORDS), 'Payroll CSV downloaded')} />
          <ExportCard icon="📋" title="Campaign Client Report"   format="PDF" color={GL} description="Per-client attendance and payout summary. Opens print dialog — save as PDF." onClick={() => handleExport(() => buildCampaignPDF(MOCK_RECORDS), 'Campaign PDF export initiated')} />
          <ExportCard icon="💼" title="Jobs Register"            format="CSV" color={G4} description="All active and archived jobs with slots, pay rates, locations, and status." onClick={() => handleExport(() => buildJobsCSV(), 'Jobs CSV downloaded')} />
          <ExportCard icon="👥" title="Promoter Roster"          format="CSV" color={G3} description="Full promoter list with city, reliability scores, and onboarding status." onClick={() => handleExport(() => buildPromotersCSV(), 'Promoters CSV downloaded')} />
          <ExportCard icon="🏦" title="EFT Batch File"           format="CSV" color={GL} description="Bank-ready payment batch containing only approved payroll records." onClick={() => {
            const approved = MOCK_RECORDS.filter(r => r.status==='approved')
            if (!approved.length) { flash('No approved records to export'); return }
            const headers = ['Promoter','Email','Bank','Account No','Net Payout (R)','Job','Date']
            const rows = approved.map(r => [r.promoter, r.email, r.bank, r.accountNo, net(r), r.job, r.date])
            exportCSV([headers, ...rows] as string[][], `honey-group-eft-batch-${today()}.csv`)
            flash(`EFT batch CSV downloaded — ${approved.length} records`)
          }} />
          <ExportCard icon="📊" title="Attendance Summary"       format="CSV" color={G4} description="Shift-level attendance log: hours worked, job, client, and promoter per shift." onClick={() => {
            const headers = ['Shift ID','Promoter','Job','Client','Date','Hours Worked','Rate','Gross']
            const rows = MOCK_RECORDS.map(r => [r.id, r.promoter, r.job, r.client, r.date, r.hours, `R${r.rate}`, fmtZAR(gross(r))])
            exportCSV([headers, ...rows] as string[][], `honey-group-attendance-${today()}.csv`)
            flash('Attendance CSV downloaded')
          }} />
        </div>

        {/* ── PAYOUT CALCULATOR ── */}
        <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4, padding:'28px 32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, flexWrap:'wrap' }}>
            <span style={{ fontSize:14, color:GL }}>◈</span>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, fontFamily:FD }}>Promoter Payout Calculator</div>
            <span style={{ fontSize:10, color:W28, fontFamily:FD }}>Estimate only · Promoters</span>
          </div>

          <div className="hg-calc-row">
            <div>
              <label style={lbl}>Hourly Rate (R)</label>
              <input type="number" value={calc.rate} min={0} onChange={e=>setCalc(p=>({...p,rate:+e.target.value}))} style={inp}
                onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
            </div>
            <div>
              <label style={lbl}>Hours Per Shift</label>
              <input type="number" value={calc.hours} min={1} max={24} onChange={e=>setCalc(p=>({...p,hours:+e.target.value}))} style={inp}
                onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
            </div>
            <div>
              <label style={lbl}>No. of Promoters</label>
              <input type="number" value={calc.promoters} min={1} onChange={e=>setCalc(p=>({...p,promoters:+e.target.value}))} style={inp}
                onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
            </div>
            <div className="hg-calc-total" style={{ background:`linear-gradient(135deg,${hex2rgba(G3,0.28)},${hex2rgba(G,0.18)})`, border:`1px solid ${hex2rgba(GL,0.5)}`, borderRadius:4, padding:'18px 22px' }}>
              <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:W55, fontFamily:FD, marginBottom:8 }}>Total Payout</div>
              <div className="hg-calc-val" style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:GL, letterSpacing:'-0.01em' }}>
                R {totalPayout.toLocaleString('en-ZA')}
              </div>
            </div>
          </div>

          <div style={{ marginTop:20 }}>
            <button onClick={() => {
              const headers = ['Description','Value']
              const rows: string[][] = [['Hourly Rate (R)',`R${calc.rate}`],['Hours Per Shift',`${calc.hours}h`],['No. of Promoters',`${calc.promoters}`],['Total Payout (R)',`R${totalPayout.toLocaleString('en-ZA')}`],['Generated',new Date().toISOString()]]
              exportCSV([headers,...rows], `honey-group-payout-estimate-${today()}.csv`)
              flash('Payout estimate CSV downloaded')
            }} style={{ padding:'9px 20px', background:'transparent', border:`1px solid ${G3}`, color:G3, fontFamily:FD, fontSize:11, fontWeight:700, cursor:'pointer', borderRadius:3, letterSpacing:'0.08em', transition:'all 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.background=hex2rgba(G3,0.15)}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              ↓ Export Estimate as CSV
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}