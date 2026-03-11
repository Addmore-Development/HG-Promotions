import { useState } from 'react'
import { AdminLayout } from '../AdminLayout'

const G  = '#C4973A'
const GL = '#DDB55A'
const B  = '#080808'
const BC = '#161616'
const BB = 'rgba(255,255,255,0.07)'
const W  = '#F4EFE6'
const WM = 'rgba(244,239,230,0.55)'
const WD = 'rgba(244,239,230,0.22)'
const FB = "'DM Sans', system-ui, sans-serif"
const FD = "'Playfair Display', Georgia, serif"

type PayStatus = 'pending' | 'approved' | 'exported' | 'paid'

interface PayRecord {
  id:         string
  promoter:   string
  email:      string
  bank:       string
  accountNo:  string
  job:        string
  date:       string
  hours:      number
  rate:       number
  deductions: number
  status:     PayStatus
}

const MOCK: PayRecord[] = [
  { id: 'PAY-001', promoter: 'Ayanda Dlamini',  email: 'ayanda@email.com',  bank: 'FNB',     accountNo: '****4521', job: 'Red Bull — Sandton',    date: '2026-03-08', hours: 8,  rate: 120, deductions: 0,    status: 'pending'  },
  { id: 'PAY-002', promoter: 'Thabo Nkosi',     email: 'thabo@email.com',   bank: 'Capitec', accountNo: '****7832', job: 'Red Bull — Sandton',    date: '2026-03-08', hours: 8,  rate: 120, deductions: 50,   status: 'pending'  },
  { id: 'PAY-003', promoter: 'Sipho Mhlongo',   email: 'sipho@email.com',   bank: 'ABSA',    accountNo: '****3301', job: 'Nike — Mall of Africa', date: '2026-03-07', hours: 8,  rate: 135, deductions: 0,    status: 'approved' },
  { id: 'PAY-004', promoter: 'Zanele Motha',    email: 'zanele@email.com',  bank: 'Standard',accountNo: '****9914', job: 'Nike — Mall of Africa', date: '2026-03-07', hours: 8,  rate: 135, deductions: 0,    status: 'approved' },
  { id: 'PAY-005', promoter: 'Bongani Khumalo', email: 'bongani@email.com', bank: 'Nedbank', accountNo: '****5542', job: 'Savanna — Gateway',     date: '2026-03-06', hours: 8,  rate: 115, deductions: 100,  status: 'exported' },
  { id: 'PAY-006', promoter: 'Lerato Mokoena',  email: 'lerato@email.com',  bank: 'FNB',     accountNo: '****2278', job: 'Nedbank Golf Day',      date: '2026-03-05', hours: 8,  rate: 150, deductions: 0,    status: 'paid'     },
]

const STATUS_COLOR: Record<PayStatus, string> = { pending: '#F59E0B', approved: G, exported: '#3A7BD5', paid: '#22C55E' }

const gross  = (r: PayRecord) => r.hours * r.rate
const net    = (r: PayRecord) => gross(r) - r.deductions
const fmtZAR = (n: number)    => `R${n.toLocaleString('en-ZA')}`

export default function ApproveExport() {
  const [records,   setRecords]   = useState<PayRecord[]>(MOCK)
  const [selected,  setSelected]  = useState<Set<string>>(new Set())
  const [filter,    setFilter]    = useState<PayStatus | 'all'>('all')
  const [exported,  setExported]  = useState(false)

  const filtered  = records.filter(r => filter === 'all' || r.status === filter)
  const allIds    = filtered.filter(r => r.status === 'pending' || r.status === 'approved').map(r => r.id)
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

  const totalSelected    = [...selected].reduce((sum, id) => { const r = records.find(x => x.id === id); return r ? sum + net(r) : sum }, 0)
  const pendingTotal     = records.filter(r => r.status === 'pending').reduce((sum, r) => sum + net(r), 0)
  const approvedTotal    = records.filter(r => r.status === 'approved').reduce((sum, r) => sum + net(r), 0)
  const paidTotal        = records.filter(r => r.status === 'paid').reduce((sum, r) => sum + net(r), 0)

  return (
    <AdminLayout>
      <div style={{ padding: '40px 48px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: G, marginBottom: 8 }}>Payroll</div>
            <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>Approve & Export Payments</h1>
            <p style={{ fontSize: 13, color: WM, marginTop: 6 }}>Review earnings, approve batches, and export to Paystack EFT.</p>
          </div>
          {exported && (
            <div style={{ padding: '12px 24px', background: 'rgba(34,197,94,0.15)', border: '1px solid #22C55E', color: '#22C55E', fontFamily: FB, fontSize: 13, fontWeight: 600 }}>
              ✓ Export successful — EFT batch sent
            </div>
          )}
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Pending Approval', value: fmtZAR(pendingTotal),  color: '#F59E0B', count: records.filter(r => r.status === 'pending').length  },
            { label: 'Approved — Ready', value: fmtZAR(approvedTotal), color: G,         count: records.filter(r => r.status === 'approved').length },
            { label: 'Paid This Month',  value: fmtZAR(paidTotal),     color: '#22C55E', count: records.filter(r => r.status === 'paid').length     },
          ].map(c => (
            <div key={c.label} style={{ background: BC, border: `1px solid ${BB}`, padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.color }} />
              <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: WM, marginBottom: 10 }}>{c.label}</div>
              <div style={{ fontFamily: FD, fontSize: 32, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: WD, marginTop: 6 }}>{c.count} promoters</div>
            </div>
          ))}
        </div>

        {/* ACTIONS + FILTER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'pending', 'approved', 'exported', 'paid'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 14px', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FB,
                fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'capitalize',
                background: filter === f ? G : 'rgba(255,255,255,0.05)',
                color: filter === f ? B : WM, transition: 'all 0.2s',
              }}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>

          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: WM }}>{selected.size} selected · {fmtZAR(totalSelected)}</span>
              <button onClick={approveSelected} style={{ padding: '8px 18px', background: 'rgba(196,151,58,0.15)', border: `1px solid ${G}`, color: G, fontFamily: FB, fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em' }}>
                ✓ Approve
              </button>
              <button onClick={exportSelected} style={{ padding: '8px 18px', background: G, border: 'none', color: B, fontFamily: FB, fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = GL}
                onMouseLeave={e => e.currentTarget.style.background = G}
              >↑ Export EFT</button>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div style={{ background: BC, border: `1px solid ${BB}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BB}` }}>
                <th style={{ padding: '13px 18px', width: 40 }}>
                  <input type="checkbox" checked={allTicked} onChange={toggleAll} style={{ accentColor: G, cursor: 'pointer' }} />
                </th>
                {['Promoter', 'Bank', 'Job', 'Date', 'Hours', 'Gross', 'Deductions', 'Net Pay', 'Status'].map(h => (
                  <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: WD, fontFamily: FB, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BB}` : 'none', background: selected.has(r.id) ? 'rgba(196,151,58,0.05)' : 'transparent', transition: 'background 0.15s' }}>
                  <td style={{ padding: '14px 18px' }}>
                    {(r.status === 'pending' || r.status === 'approved') && (
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} style={{ accentColor: G, cursor: 'pointer' }} />
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: W }}>{r.promoter}</div>
                    <div style={{ fontSize: 11, color: WM }}>{r.email}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 12, color: W }}>{r.bank}</div>
                    <div style={{ fontSize: 11, color: WD }}>{r.accountNo}</div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: WM, maxWidth: 160 }}>{r.job}</td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: WM, whiteSpace: 'nowrap' }}>
                    {new Date(r.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: WM, textAlign: 'center' }}>{r.hours}h</td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: W }}>{fmtZAR(gross(r))}</td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: r.deductions > 0 ? '#EF4444' : WD }}>
                    {r.deductions > 0 ? `-${fmtZAR(r.deductions)}` : '—'}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: G }}>{fmtZAR(net(r))}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: STATUS_COLOR[r.status], background: `${STATUS_COLOR[r.status]}18`, padding: '3px 10px', borderRadius: 2 }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid ${BB}`, background: 'rgba(255,255,255,0.02)' }}>
                <td colSpan={7} style={{ padding: '14px 18px', fontSize: 11, color: WM, fontFamily: FB }}>
                  {filtered.length} records
                </td>
                <td colSpan={2} style={{ padding: '14px 18px', textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: WM }}>Total net</div>
                  <div style={{ fontFamily: FD, fontSize: 18, color: G, fontWeight: 700 }}>
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