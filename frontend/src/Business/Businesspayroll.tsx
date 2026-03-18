import { useState, useEffect, useCallback } from 'react'

// ─── Strict Gold & Black Palette ──────────────────────────────────────────────
const BLK  = '#050402'
const BLK1 = '#0A0804'
const BLK2 = '#100C05'
const BLK3 = '#181206'
const GL   = '#E8A820'
const GD   = '#C07818'
const GD2  = '#8B5A1A'
const GD3  = '#6B3F10'
const BB   = 'rgba(212,136,10,0.16)'
const W    = '#FAF3E8'
const W7   = 'rgba(250,243,232,0.70)'
const W4   = 'rgba(250,243,232,0.40)'
const W2   = 'rgba(250,243,232,0.20)'
const FD   = "'Playfair Display', Georgia, serif"
const FB   = "'DM Sans', system-ui, sans-serif"

function hex2rgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
function authHdr() {
  const t = localStorage.getItem('hg_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

interface PayRow {
  id: string; promoterName: string; promoterEmail: string
  jobTitle: string; grossAmount: number; deductions: number
  netAmount: number; status: string; paidAt?: string
}

type SortKey = 'netAmount' | 'promoterName' | 'status'

export default function BusinessPayroll() {
  const [rows,    setRows]    = useState<PayRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy,  setSortBy]  = useState<SortKey>('netAmount')
  const [filter,  setFilter]  = useState('all')

  const loadPayroll = useCallback(async () => {
    try {
      const res = await fetch(`${API}/payments/`, { headers: authHdr() as any })
      if (res.ok) {
        const data: any[] = await res.json()
        setRows(data.map(p => ({
          id:            p.id,
          promoterName:  p.promoter?.fullName || 'Unknown',
          promoterEmail: p.promoter?.email    || '',
          jobTitle:      p.shift?.job?.title  || 'Unknown Job',
          grossAmount:   p.grossAmount || 0,
          deductions:    p.deductions  || 0,
          netAmount:     p.netAmount   || 0,
          status:        (p.status || 'pending').toLowerCase(),
          paidAt:        p.paidAt,
        })))
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadPayroll() }, [loadPayroll])

  // ─── Reload when admin updates jobs or payments ─────────────────────────────
  useEffect(() => {
    const onStorage = (e?: StorageEvent) => {
      // React to both job updates (which may change shift records) and client updates
      if (e && e.key !== 'hg_job_updates' && e.key !== 'hg_client_updates' && e.key !== null) return
      loadPayroll()
    }
    window.addEventListener('storage', onStorage)
    // Poll every 60s — payroll data changes less frequently than job status
    const poll = setInterval(loadPayroll, 60_000)
    return () => { window.removeEventListener('storage', onStorage); clearInterval(poll) }
  }, [loadPayroll])

  const filtered = rows.filter(r => filter === 'all' || r.status === filter)
  const sorted   = [...filtered].sort((a, b) => {
    if (sortBy === 'netAmount')    return b.netAmount - a.netAmount
    if (sortBy === 'promoterName') return a.promoterName.localeCompare(b.promoterName)
    return a.status.localeCompare(b.status)
  })

  const grandTotal = sorted.reduce((acc, r) => acc + r.netAmount, 0)
  const statusColor = (s: string) => s === 'paid' ? GD : s === 'approved' ? GL : s === 'pending' ? GL : W4

  return (
    <div>
      <div className="biz-page" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>Finance · Payroll</div>
        <h1 style={{ fontFamily: FD, fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, color: W }}>Earnings Summary</h1>
        <p style={{ fontSize: 13, color: W4, marginTop: 6, fontFamily: FB }}>Promoter payout overview for your campaigns.</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: BB, marginBottom: 28 }}>
        {[
          { label: 'Total Payout', value: `R ${grandTotal.toFixed(0)}`,                                    color: GL  },
          { label: 'Promoters',    value: new Set(rows.map(r => r.promoterEmail)).size,                     color: GD  },
          { label: 'Paid Records', value: rows.filter(r => r.status === 'paid').length,                     color: GD2 },
        ].map((s, i) => (
          <div key={i} className="biz-page" style={{ background: BLK2, padding: '22px 20px', position: 'relative', borderRadius: 2 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${GD3}, ${s.color}, ${GD3})` }} />
            <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: W4, fontFamily: FD, marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontFamily: FD, fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + sort */}
      <div className="biz-page" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'pending', 'approved', 'paid'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', background: filter === f ? hex2rgba(f === 'all' ? GL : statusColor(f), 0.14) : 'transparent', border: `1px solid ${filter === f ? (f === 'all' ? GL : statusColor(f)) : BB}`, color: filter === f ? (f === 'all' ? GL : statusColor(f)) : W4, fontFamily: FD, fontSize: 9, fontWeight: filter === f ? 700 : 400, cursor: 'pointer', borderRadius: 2, transition: 'all 0.18s', letterSpacing: '0.1em' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['netAmount', 'promoterName', 'status'] as SortKey[]).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              style={{ padding: '6px 12px', background: sortBy === s ? hex2rgba(GL, 0.1) : 'transparent', border: `1px solid ${sortBy === s ? hex2rgba(GL, 0.4) : BB}`, color: sortBy === s ? GL : W4, fontFamily: FD, fontSize: 9, fontWeight: sortBy === s ? 700 : 400, cursor: 'pointer', borderRadius: 2, transition: 'all 0.18s', letterSpacing: '0.1em' }}>
              {s === 'netAmount' ? 'By Amount' : s === 'promoterName' ? 'By Name' : 'By Status'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="biz-page" style={{ background: BLK2, border: `1px solid ${BB}`, overflow: 'hidden', borderRadius: 3 }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: W4, fontFamily: FD }}>Loading payroll data…</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: FD, fontSize: 18, color: W4, marginBottom: 6 }}>No payroll data yet</p>
            <p style={{ fontFamily: FB, fontSize: 12, color: W2 }}>Payout records appear once promoters complete shifts on your jobs.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BB}`, background: BLK1 }}>
                {['Promoter', 'Job', 'Gross', 'Deductions', 'Net Payout', 'Status', 'Paid At'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: W2, fontFamily: FD, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={r.id}
                  style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${BB}` : 'none', transition: 'background 0.18s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = BLK3)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: W, fontFamily: FD }}>{r.promoterName}</div>
                    <div style={{ fontSize: 10, color: W4, fontFamily: FB }}>{r.promoterEmail}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: W7, fontFamily: FB, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.jobTitle}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: W, fontFamily: FD }}>R{r.grossAmount.toLocaleString('en-ZA')}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: r.deductions > 0 ? W7 : W2, fontFamily: FD }}>{r.deductions > 0 ? `-R${r.deductions}` : '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontFamily: FD, fontSize: 15, fontWeight: 700, color: GL }}>R{r.netAmount.toLocaleString('en-ZA')}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: statusColor(r.status), background: hex2rgba(statusColor(r.status), 0.1), border: `1px solid ${hex2rgba(statusColor(r.status), 0.4)}`, padding: '3px 9px', borderRadius: 2, fontFamily: FD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 11, color: W4, fontFamily: FB }}>
                    {r.paidAt ? new Date(r.paidAt).toLocaleDateString('en-ZA') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${BB}`, background: hex2rgba(GL, 0.04) }}>
                <td colSpan={4} style={{ padding: '14px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: GL, fontFamily: FD }}>Grand Total</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: GL }}>R {grandTotal.toLocaleString('en-ZA')}</span>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {sorted.length > 0 && (
        <div style={{ marginTop: 14, padding: '12px 16px', border: `1px solid ${BB}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}>
          <p style={{ fontFamily: FB, fontSize: 11, color: W4 }}>Payroll export available. Payments processed by Honey Group admin.</p>
          <button
            onClick={() => {
              const csv = [
                ['Promoter', 'Email', 'Job', 'Gross', 'Deductions', 'Net', 'Status', 'Paid At'],
                ...sorted.map(r => [r.promoterName, r.promoterEmail, r.jobTitle, r.grossAmount, r.deductions, r.netAmount, r.status, r.paidAt || '']),
              ].map(row => row.join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url  = URL.createObjectURL(blob)
              const a    = document.createElement('a'); a.href = url; a.download = 'honey-group-payroll.csv'; a.click()
              URL.revokeObjectURL(url)
            }}
            style={{ fontFamily: FD, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${hex2rgba(GL, 0.4)}`, color: GL, padding: '8px 18px', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 2, flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = hex2rgba(GL, 0.1)}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            ↓ Export CSV
          </button>
        </div>
      )}
    </div>
  )
}